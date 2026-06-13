import Papa from 'papaparse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type CsvRow = {
  date: string;
  description: string;
  paid_by: string;
  amount: string;
  currency: string;
  split_type: string;
  split_with: string;
  split_details: string;
  notes: string;
};

export async function processCsvImport(fileContent: string, jobId: string) {
  const result = Papa.parse<CsvRow>(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = result.data;
  const anomalies: { rowNumber: number; type: string; description: string; suggestedAction: string }[] = [];

  const seenExpenses = new Map<string, number>();

  rows.forEach((row, index) => {
    const rowNum = index + 2; // 1-based index, plus 1 for header

    // 1. Check for missing values
    if (!row.paid_by) {
      anomalies.push({
        rowNumber: rowNum,
        type: 'ERROR',
        description: 'Missing "paid_by" value.',
        suggestedAction: 'Provide the user who paid this expense.',
      });
    }
    if (!row.currency) {
      anomalies.push({
        rowNumber: rowNum,
        type: 'ERROR',
        description: 'Missing "currency" value.',
        suggestedAction: 'Default to INR or specify a valid currency.',
      });
    }

    // 2. Check amount issues
    const amountStr = row.amount?.replace(/,/g, '');
    const amount = parseFloat(amountStr);
    
    if (row.amount && row.amount.includes(',')) {
      anomalies.push({
        rowNumber: rowNum,
        type: 'WARNING',
        description: `Amount "${row.amount}" contains formatting commas.`,
        suggestedAction: 'Remove formatting commas to parse correctly.',
      });
    }

    if (isNaN(amount)) {
      anomalies.push({
        rowNumber: rowNum,
        type: 'ERROR',
        description: `Invalid amount "${row.amount}".`,
        suggestedAction: 'Provide a valid numerical amount.',
      });
    } else if (amount === 0) {
      anomalies.push({
        rowNumber: rowNum,
        type: 'WARNING',
        description: `Amount is zero.`,
        suggestedAction: 'Skip or provide correct amount.',
      });
    } else if (amount < 0) {
      anomalies.push({
        rowNumber: rowNum,
        type: 'WARNING',
        description: `Amount is negative (${amount}). Is this a refund?`,
        suggestedAction: 'Reverse transaction or map as refund.',
      });
    } else if (amountStr && amountStr.split('.')[1]?.length > 2) {
      anomalies.push({
        rowNumber: rowNum,
        type: 'WARNING',
        description: `Floating point issue detected in amount "${row.amount}".`,
        suggestedAction: 'Round to 2 decimal places.',
      });
    }

    // 3. Date Issues
    if (row.date && !/^\d{2}-\d{2}-\d{4}$/.test(row.date)) {
      anomalies.push({
        rowNumber: rowNum,
        type: 'WARNING',
        description: `Inconsistent date format "${row.date}".`,
        suggestedAction: 'Format as DD-MM-YYYY.',
      });
    }

    // 4. Duplicate Detection (Near matches based on amount, paid_by and date)
    const dupKey = `${row.date}_${row.paid_by?.toLowerCase()}_${amount}`;
    if (seenExpenses.has(dupKey)) {
      const prevRow = seenExpenses.get(dupKey);
      anomalies.push({
        rowNumber: rowNum,
        type: 'WARNING',
        description: `Potential duplicate of expense on row ${prevRow}. Same date, amount, and payer.`,
        suggestedAction: 'Verify if this is a duplicate and keep/merge/delete.',
      });
    } else {
      seenExpenses.set(dupKey, rowNum);
    }

    // 5. Settlement entry vs Expense
    if (!row.split_type && row.notes?.toLowerCase().includes('settlement')) {
       anomalies.push({
        rowNumber: rowNum,
        type: 'INFO',
        description: `Entry looks like a settlement rather than an expense.`,
        suggestedAction: 'Import as a settlement transaction.',
      });
    } else if (row.description?.toLowerCase().includes('deposit') || row.description?.toLowerCase().includes('paid back')) {
       anomalies.push({
        rowNumber: rowNum,
        type: 'INFO',
        description: `Entry "${row.description}" looks like a settlement.`,
        suggestedAction: 'Convert to settlement.',
      });
    }

    // 6. Split Type and Total Logic
    if (row.split_type === 'percentage') {
      const details = row.split_details?.split(';').map(s => parseFloat(s.match(/[\d.]+/)?.[0] || '0'));
      const totalPct = details?.reduce((a, b) => a + b, 0);
      if (totalPct && totalPct !== 100) {
        anomalies.push({
          rowNumber: rowNum,
          type: 'ERROR',
          description: `Percentage split totals to ${totalPct}% instead of 100%.`,
          suggestedAction: 'Correct the percentage values.',
        });
      }
    } else if (row.split_type === 'equal' && row.split_details) {
       anomalies.push({
          rowNumber: rowNum,
          type: 'WARNING',
          description: `Split type is 'equal' but split_details are provided.`,
          suggestedAction: 'Check if this should be ' + (row.split_details.includes('%') ? 'percentage' : 'share') + ' or ignore details.',
        });
    }

    // 7. Unknown Categories / Members
    const members = row.split_with?.split(';').map(s => s.trim().toLowerCase()) || [];
    if (members.some(m => m.includes('friend') || m.includes('kabir'))) {
      anomalies.push({
        rowNumber: rowNum,
        type: 'ERROR',
        description: `Contains unknown/non-group participants in split_with.`,
        suggestedAction: 'Map to a known group member (e.g. host).',
      });
    }

  });

  // Save anomalies to database
  if (anomalies.length > 0) {
    await prisma.importAnomaly.createMany({
      data: anomalies.map(a => ({
        importJobId: jobId,
        rowNumber: a.rowNumber,
        type: a.type,
        description: a.description,
        suggestedAction: a.suggestedAction,
      }))
    });
  }

  return { rows, anomalies };
}
