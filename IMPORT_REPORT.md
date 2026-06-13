# Import Report

This document contains a comprehensive analysis of the anomalies detected in the provided `Expenses Export.csv` file, along with the actions taken.

## Overview
The dataset contains a mix of standard expenses, settlements, and varying formats. Several members have irregular timelines (e.g., Meera moved out, Sam joined, Dev only participated temporarily).

## Detected Anomalies & Actions Taken

| Row | Anomaly Type | Description | Action Taken / Recommendation |
| --- | --- | --- | --- |
| 5 & 6 | DUPLICATE | "Dinner at Marina Bites" vs "dinner - marina bites", Dev, ₹3200 | Flagged for user approval (merge or keep). The import engine detects near duplicates by matching date, payer, and amount. |
| 7 | FORMATTING | Amount "1,200" contains a comma. | Automatically parsed and converted to numerical format (1200) during import. |
| 9 | DATA INCONSISTENCY | Payer "priya" (lowercase). | Normalized automatically. |
| 10 | FLOATING POINT | Amount `899.995`. | Flagged for rounding. Balance engine uses Decimal to maintain precision. |
| 11 | DATA INCONSISTENCY | Payer "Priya S" instead of "Priya". | Flagged for manual mapping to existing user `Priya`. |
| 13 | MISSING DATA | Payer is missing. | Flagged as ERROR. Requires manual assignment before calculation. |
| 14 | LOGIC MIX-UP | "Rohan paid Aisha back" (₹5000). | Detected by notes ("settlement") and split details. Mapped to `Settlement` table instead of `Expense`. |
| 15 & 32 | INVALID LOGIC | Percentage split adds up to 110% (30+30+30+20). | Flagged as ERROR. The import engine requires manual correction to total 100%. |
| 20, 21, 23 | MULTI-CURRENCY | Expenses in USD. | Stored with original currency in DB. Balance engine converts to INR using the recorded exchange rate. |
| 23 | UNKNOWN MEMBER | "Dev's friend Kabir" in split list. | Flagged as ERROR. User must define if Kabir is added as a temporary member or mapped to Dev's share. |
| 24 & 25 | NEAR DUPLICATE | "Dinner at Thalassa" (₹2400) vs "Thalassa dinner" (₹2450). | Flagged for review. Notes indicate Aisha's entry might be wrong. |
| 26 | NEGATIVE AMOUNT | Amount -30 (Parasailing refund). | Flagged. Can be treated as an income split or a negative expense. |
| 27 | DATE FORMATTING | Date format "Mar-14". Payer "rohan " with trailing space. | Date flagged for standardizing to DD-MM-YYYY. Payer trimmed automatically. |
| 28 | MISSING CURRENCY | Forgotten currency. | Flagged. Defaults to base currency (INR) if approved. |
| 31 | ZERO AMOUNT | Amount 0. | Flagged as WARNING. Suggested to be skipped. |
| 34 | AMBIGUOUS DATE | Date "04-05-2026" (April 5 vs May 4). | Flagged for user clarification. |
| 36 | MEMBERSHIP | Meera included in April split, but she moved out. | Balance engine rules reject members not in the group at the time of the expense. Flagged as ERROR. |
| 38 | LOGIC MIX-UP | "Sam deposit share" (₹15000). | Identified as a settlement entry. Moved to `Settlement` table. |
| 42 | LOGIC MISMATCH | `split_type` says "equal" but `split_details` has shares. | Flagged. Requires user to confirm the correct split strategy (Equal vs Share). |

## Database State Post-Import
All valid rows are directly inserted into `Expense` and `ExpenseParticipant` tables. Settlements are moved to the `Settlement` table. The balance engine continuously processes these tables to present simplified net balances.
