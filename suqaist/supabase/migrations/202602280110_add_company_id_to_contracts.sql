-- Add company_id to company_contracts table
ALTER TABLE company_contracts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Add company_id to contract_pipeline_summary table  
ALTER TABLE contract_pipeline_summary ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
