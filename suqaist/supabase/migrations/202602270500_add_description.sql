-- Add description column to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description_ar text;
