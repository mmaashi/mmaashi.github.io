-- Add missing columns to ownership table

-- Add holder_type column if not exists
ALTER TABLE ownership ADD COLUMN IF NOT EXISTS holder_type text CHECK (holder_type IN ('institution', 'individual', 'government', 'foreign', 'retail'));

-- Add shares column if not exists  
ALTER TABLE ownership ADD COLUMN IF NOT EXISTS shares bigint CHECK (shares >= 0);

-- Add as_of_date column if not exists
ALTER TABLE ownership ADD COLUMN IF NOT EXISTS as_of_date date;

-- Add shares_outstanding column to companies if not exists
ALTER TABLE companies ADD COLUMN IF NOT EXISTS shares_outstanding bigint;

-- Create analyst_estimates table if not exists
CREATE TABLE IF NOT EXISTS analyst_estimates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  analyst_firm text NOT NULL,
  target_price numeric(15,2),
  recommendation text CHECK (recommendation IN ('buy', 'overweight', 'hold', 'underweight', 'sell')),
  estimate_date date,
  created_at timestamptz DEFAULT now()
);

-- Create index if table was just created
CREATE INDEX IF NOT EXISTS idx_ownership_company ON ownership(company_id);
CREATE INDEX IF NOT EXISTS idx_ownership_holder_type ON ownership(holder_type);
CREATE INDEX IF NOT EXISTS idx_analyst_estimates_company ON analyst_estimates(company_id);
