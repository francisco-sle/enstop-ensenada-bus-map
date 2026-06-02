ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops       ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE fare_rules  ENABLE ROW LEVEL SECURITY;

-- Public read-only for all tables
CREATE POLICY "public_read_categories"  ON categories  FOR SELECT USING (TRUE);
CREATE POLICY "public_read_routes"      ON routes      FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_stops"       ON stops       FOR SELECT USING (TRUE);
CREATE POLICY "public_read_route_stops" ON route_stops FOR SELECT USING (TRUE);
CREATE POLICY "public_read_fare_rules"  ON fare_rules  FOR SELECT USING (TRUE);
-- No INSERT/UPDATE/DELETE from anon key. Admin writes via service-role key only.
