import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paidById, paidToId, amount, currency, date, notes } = body;

    const group = await prisma.group.findFirst({ where: { name: 'Flatmates' }});
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const settlement = await prisma.settlement.create({
      data: {
        groupId: group.id,
        paidById,
        paidToId,
        amount: parseFloat(amount),
        currency: currency || 'INR',
        date: new Date(date),
        notes: notes || 'Settlement',
      }
    });

    return NextResponse.json({ success: true, settlement });
  } catch (error) {
    console.error('Create settlement error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
