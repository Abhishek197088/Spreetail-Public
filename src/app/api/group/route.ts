import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { BalanceEngine } from '@/lib/balance-engine';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const group = await prisma.group.findFirst({
      where: { name: 'Flatmates' },
      include: {
        members: {
          include: { user: true }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const users = group.members.map(m => m.user);

    // Calculate balances
    const balancesMap = await BalanceEngine.calculateGroupBalances(group.id);
    
    // Map balances map to array format
    const rawBalances = Array.from(balancesMap.entries()).map(([userId, netAmount]) => ({
      userId,
      netAmount
    }));

    // Simplify debts
    const simplifiedDebts = BalanceEngine.simplifyDebts(balancesMap);

    return NextResponse.json({
      group,
      users,
      balances: rawBalances,
      simplifiedDebts
    });
  } catch (error) {
    console.error('Group API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
