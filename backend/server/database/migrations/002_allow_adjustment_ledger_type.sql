ALTER TABLE ledger_transactions
  DROP CONSTRAINT IF EXISTS ledger_transactions_type_check;

ALTER TABLE ledger_transactions
  ADD CONSTRAINT ledger_transactions_type_check
  CHECK (type IN (
    'escrow_hold',
    'escrow_release',
    'platform_fee',
    'payout',
    'refund',
    'penalty',
    'deposit',
    'withdrawal',
    'adjustment'
  ));
