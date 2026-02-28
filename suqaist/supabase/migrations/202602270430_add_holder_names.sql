-- Add holder_name columns to ownership table
ALTER TABLE ownership ADD COLUMN IF NOT EXISTS holder_name_en text;
ALTER TABLE ownership ADD COLUMN IF NOT EXISTS holder_name_ar text;
