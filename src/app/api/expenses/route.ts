import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Optional filter

    const group = await prisma.group.findFirst({ where: { name: 'Flatmates' }});
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Fetch expenses
    const expenses = await prisma.expense.findMany({
      where: {
        groupId: group.id,
        ...(userId ? {
          OR: [
            { paidById: userId },
            { participants: { some: { userId: userId } } }
          ]
        } : {})
      },
      include: {
        paidBy: true,
        participants: {
          include: { user: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Fetch settlements
    const settlements = await prisma.settlement.findMany({
      where: {
        groupId: group.id,
        ...(userId ? {
          OR: [
            { paidById: userId },
            { paidToId: userId }
          ]
        } : {})
      },
      include: {
        paidBy: true,
        paidTo: true
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({
      expenses,
      settlements
    });
  } catch (error) {
    console.error('Expenses API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, amount, currency, date, paidById, splitType, participants } = body;

    const group = await prisma.group.findFirst({ where: { name: 'Flatmates' }});
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const expense = await prisma.expense.create({
      data: {
        groupId: group.id,
        description,
        amount: parseFloat(amount),
        currency: currency || 'INR',
        date: new Date(date),
        paidById,
        splitType: splitType || 'EQUAL',
      }
    });

    if (participants && participants.length > 0) {
      await prisma.expenseParticipant.createMany({
        data: participants.map((p: any) => ({
          expenseId: expense.id,
          userId: p.userId,
          share: parseFloat(p.share),
          owed: parseFloat(p.owed)
        }))
      });
    }

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
