import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processCsvImport, CsvRow } from '@/lib/csv-parser';
import { parse } from 'date-fns'; // useful for parsing dd-mm-yyyy

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jobId = formData.get('jobId') as string;

    if (!file || !jobId) {
      return NextResponse.json({ error: 'No file or jobId provided' }, { status: 400 });
    }

    const fileContent = await file.text();

    // Re-run the parse, this time we won't insert anomalies because the jobId might already have them,
    // or we can just ignore the DB write by passing a dummy ID if we don't want duplicates.
    // However, our parser function creates anomalies in DB unconditionally.
    // Let's just bypass it or clean them up first.
    await prisma.importAnomaly.deleteMany({ where: { importJobId: jobId }});
    
    const { rows, anomalies } = await processCsvImport(fileContent, jobId);

    // Filter out rows that have ERRORs
    const errorRows = new Set(anomalies.filter(a => a.type === 'ERROR').map(a => a.rowNumber));

    // Get the Group
    const group = await prisma.group.findFirst({ where: { name: 'Flatmates' } });
    if (!group) throw new Error("Group Flatmates not found");

    // Fetch all users to map names to IDs
    const users = await prisma.user.findMany();
    const userMap = new Map<string, string>();
    for (const u of users) {
      userMap.set(u.name.toLowerCase(), u.id);
    }

    let insertedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // header is 1
      if (errorRows.has(rowNum)) continue; // skip rows with ERROR anomalies

      const row = rows[i];
      if (!row.paid_by) continue;

      const payerId = userMap.get(row.paid_by.trim().toLowerCase());
      if (!payerId) continue;

      const amountStr = row.amount?.replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) continue; // skip negative or zero amounts for simplicity

      // Parse date DD-MM-YYYY
      let dateObj = new Date();
      if (row.date && /^\d{2}-\d{2}-\d{4}$/.test(row.date)) {
        try {
          dateObj = parse(row.date, 'dd-MM-yyyy', new Date());
        } catch(e) {}
      }

      const isSettlement = row.notes?.toLowerCase().includes('settlement') || row.description?.toLowerCase().includes('deposit') || row.description?.toLowerCase().includes('paid back');

      if (isSettlement) {
        // Settlements usually have the receiver in 'split_with'
        const splitWith = row.split_with?.split(';')[0]?.trim().toLowerCase() || '';
        const receiverId = userMap.get(splitWith);
        
        if (receiverId) {
          await prisma.settlement.create({
            data: {
              groupId: group.id,
              paidById: payerId,
              paidToId: receiverId,
              amount: amount,
              currency: row.currency || 'INR',
              date: dateObj,
              notes: row.description || row.notes,
            }
          });
          insertedCount++;
        }
      } else {
        // Expense
        const expense = await prisma.expense.create({
          data: {
            groupId: group.id,
            description: row.description || 'Expense',
            amount: amount,
            currency: row.currency || 'INR',
            date: dateObj,
            paidById: payerId,
            splitType: row.split_type?.toUpperCase() || 'EQUAL',
            notes: row.notes,
          }
        });

        // Participants mapping
        // In a real app we parse split_with and split_details precisely. 
        // For now, we assume EQUAL splits across everyone mentioned.
        let participants: string[] = [];
        if (row.split_with && row.split_with.toLowerCase() !== 'all') {
          participants = row.split_with.split(';').map(s => s.trim().toLowerCase());
        } else {
          participants = Array.from(userMap.keys());
        }

        const validParticipants = participants.map(p => userMap.get(p)).filter(Boolean) as string[];
        if (validParticipants.length > 0) {
          const share = amount / validParticipants.length;
          await prisma.expenseParticipant.createMany({
            data: validParticipants.map(uid => ({
              expenseId: expense.id,
              userId: uid,
              share: share,
              owed: share
            }))
          });
        }
        insertedCount++;
      }
    }

    // Mark job as imported
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'IMPORTED' }
    });

    return NextResponse.json({ success: true, inserted: insertedCount });
  } catch (error) {
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
