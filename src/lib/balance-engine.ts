import { PrismaClient, Expense, ExpenseParticipant, Settlement } from '@prisma/client';

const prisma = new PrismaClient();

export type NetBalance = {
  userId: string;
  netAmount: number; // Positive means they are owed money, Negative means they owe money
};

export type SimplifiedDebt = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export class BalanceEngine {
  
  /**
   * Calculate raw net balances for a group, considering multi-currency and settlements.
   */
  static async calculateGroupBalances(groupId: string): Promise<Map<string, number>> {
    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: { participants: true }
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId }
    });

    const balances = new Map<string, number>();

    const addBalance = (userId: string, amount: number) => {
      balances.set(userId, (balances.get(userId) || 0) + amount);
    };

    // 1. Process Expenses
    for (const exp of expenses) {
      if (!exp.paidById) continue;

      // Base amount is either convertedAmount (for foreign) or amount
      const expenseAmount = Number(exp.convertedAmount || exp.amount);

      // Payer gets credited the full amount
      addBalance(exp.paidById, expenseAmount);

      // Participants get debited their owed share
      for (const participant of exp.participants) {
        addBalance(participant.userId, -Number(participant.owed));
      }
    }

    // 2. Process Settlements
    for (const stl of settlements) {
      const amount = Number(stl.amount);
      // The person who pays gets credited
      addBalance(stl.paidById, amount);
      // The person who receives the payment gets debited
      addBalance(stl.paidToId, -amount);
    }

    return balances;
  }

  /**
   * Splitwise-style Debt Simplification Algorithm
   */
  static simplifyDebts(balances: Map<string, number>): SimplifiedDebt[] {
    const debtors: { userId: string, amount: number }[] = [];
    const creditors: { userId: string, amount: number }[] = [];

    // Separate into those who owe (debtors) and those who are owed (creditors)
    for (const [userId, netAmount] of balances.entries()) {
      if (netAmount < -0.01) {
        debtors.push({ userId, amount: -netAmount });
      } else if (netAmount > 0.01) {
        creditors.push({ userId, amount: netAmount });
      }
    }

    // Sort by largest amount to minimize transactions
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const simplifiedDebts: SimplifiedDebt[] = [];

    let i = 0; // debtors index
    let j = 0; // creditors index

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const settlementAmount = Math.min(debtor.amount, creditor.amount);

      simplifiedDebts.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: Number(settlementAmount.toFixed(2)),
      });

      debtor.amount -= settlementAmount;
      creditor.amount -= settlementAmount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return simplifiedDebts;
  }
}
