import { BalanceEngine } from '../src/lib/balance-engine';

describe('BalanceEngine.simplifyDebts', () => {
  it('should simplify a simple transitive debt', () => {
    const balances = new Map<string, number>();
    // A owes B 100, B owes C 100
    // Balances: A: -100, B: 0, C: 100
    balances.set('A', -100);
    balances.set('B', 0);
    balances.set('C', 100);

    const simplified = BalanceEngine.simplifyDebts(balances);

    expect(simplified).toHaveLength(1);
    expect(simplified[0]).toEqual({
      fromUserId: 'A',
      toUserId: 'C',
      amount: 100,
    });
  });

  it('should handle complex multi-way debts', () => {
    const balances = new Map<string, number>();
    // A owes 50, B owes 50
    // C is owed 100
    balances.set('A', -50);
    balances.set('B', -50);
    balances.set('C', 100);

    const simplified = BalanceEngine.simplifyDebts(balances);

    expect(simplified).toHaveLength(2);
    expect(simplified).toEqual(
      expect.arrayContaining([
        { fromUserId: 'A', toUserId: 'C', amount: 50 },
        { fromUserId: 'B', toUserId: 'C', amount: 50 },
      ])
    );
  });

  it('should ignore dust balances (floating point issues)', () => {
    const balances = new Map<string, number>();
    balances.set('A', -0.001);
    balances.set('B', 0.001);

    const simplified = BalanceEngine.simplifyDebts(balances);

    expect(simplified).toHaveLength(0); // Ignore anything under 0.01
  });
});
