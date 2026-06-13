# Scope

This document details the exact scope and policies handled by the application.

## Anomalies Detected in CSV
- Duplicates & near duplicates
- Negative & zero amounts
- Settlement records mixed into expenses
- Membership timeline mismatches (e.g. Meera moving out, Sam joining)
- Percentage split invalid totals
- Multi-currency entries
- Date formatting inconsistencies

## Handling Policy
Nothing is auto-deleted. The `Import Engine` flags anomalies as `ERROR`, `WARNING`, or `INFO`.
- `ERROR`: Blocks import of the specific row until corrected (e.g., missing payer, unknown member, invalid percentage).
- `WARNING`: Notifies user but allows import (e.g., potential duplicate, zero amount).
- `INFO`: Automatically maps entries to correct tables (e.g., detecting settlements).

## Database Schema (Key Tables)
1. `User` & `Group`: Standard authentication and grouping.
2. `GroupMember`: Includes `joinedAt` and `leftAt` to enforce timeline logic.
3. `Expense` & `ExpenseParticipant`: Stores precise decimal amounts, currency, and split logic.
4. `Settlement`: Separate table for debt repayment.
5. `ImportJob` & `ImportAnomaly`: Temporary staging tables for CSV validation.
