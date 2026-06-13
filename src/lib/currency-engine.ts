export class CurrencyEngine {
  // Static mock for exchange rates. In a real app, this would fetch from an API or DB.
  private static mockRates: Record<string, number> = {
    'USD_TO_INR': 83.50,
    'EUR_TO_INR': 90.10,
    'GBP_TO_INR': 105.20,
  };

  /**
   * Convert amount from given currency to base currency (INR)
   */
  static async convertToBase(amount: number, fromCurrency: string, date: Date): Promise<{ converted: number, rate: number }> {
    fromCurrency = fromCurrency.toUpperCase();
    if (fromCurrency === 'INR') {
      return { converted: amount, rate: 1.0 };
    }

    const pair = `${fromCurrency}_TO_INR`;
    
    // In a production app, we would query the historical exchange rate table by `date` here.
    const rate = this.mockRates[pair] || 83.0; // Default fallback for USD

    return {
      converted: Number((amount * rate).toFixed(2)),
      rate
    };
  }
}
