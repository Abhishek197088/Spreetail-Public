import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processCsvImport } from '@/lib/csv-parser';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileContent = await file.text();

    // Create an import job
    const job = await prisma.importJob.create({
      data: {
        filename: file.name,
        status: 'PREVIEW',
      }
    });

    // Parse and generate anomalies
    const { rows, anomalies } = await processCsvImport(fileContent, job.id);

    return NextResponse.json({
      jobId: job.id,
      totalRows: rows.length,
      anomaliesCount: anomalies.length,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }

  const anomalies = await prisma.importAnomaly.findMany({
    where: { importJobId: jobId },
    orderBy: { rowNumber: 'asc' }
  });

  return NextResponse.json({ anomalies });
}
