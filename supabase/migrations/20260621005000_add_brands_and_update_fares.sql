-- Add brands table
CREATE TABLE brands (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  color_hex        TEXT NOT NULL,
  units_operating  INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Add brand_id to routes
ALTER TABLE routes
ADD COLUMN brand_id INT REFERENCES brands(id) ON DELETE SET NULL;

-- Update the CHECK constraint on passenger_type in fare_rules
ALTER TABLE fare_rules DROP CONSTRAINT fare_rules_passenger_type_check;

ALTER TABLE fare_rules ADD CONSTRAINT fare_rules_passenger_type_check
CHECK (passenger_type IN (
  'normal',
  'student',
  'disability',
  'senior',
  'disability_free'
));

-- Enable RLS and grant access for brands table
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON brands TO anon, authenticated;
CREATE POLICY "public_read_brands" ON brands FOR SELECT USING (TRUE);

-- Grant access to brand_id column on routes table
GRANT SELECT (brand_id) ON routes TO anon, authenticated;
