ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops       ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE fare_rules  ENABLE ROW LEVEL SECURITY;

-- Grant SELECT on public tables to anon and authenticated roles.
-- Without table-level SELECT, PostgREST returns 401 before RLS is even evaluated.
GRANT SELECT ON categories  TO anon, authenticated;
GRANT SELECT ON stops       TO anon, authenticated;
GRANT SELECT ON route_stops TO anon, authenticated;
GRANT SELECT ON fare_rules  TO anon, authenticated;

-- routes: grant SELECT only on non-geometry columns.
-- This allows anon to fetch route metadata (names, categories, stops) while
-- keeping geom inaccessible. Direct SELECT on geom returns 42501.
-- Geometry always flows through the route-proxy Edge Function (service_role).
GRANT SELECT (id, name, short_name, category_id, description, direction, is_active, created_at)
  ON routes TO anon, authenticated;

-- RLS SELECT policies are required — table-level grants alone are not enough.
-- USING (TRUE) = all rows visible; column-level grant restricts which columns on routes.
CREATE POLICY "public_read_categories"      ON categories  FOR SELECT USING (TRUE);
CREATE POLICY "public_read_stops"           ON stops       FOR SELECT USING (TRUE);
CREATE POLICY "public_read_route_stops"     ON route_stops FOR SELECT USING (TRUE);
CREATE POLICY "public_read_fare_rules"      ON fare_rules  FOR SELECT USING (TRUE);
CREATE POLICY "public_read_routes_metadata" ON routes      FOR SELECT USING (TRUE);
-- No INSERT/UPDATE/DELETE from anon key. Admin writes via service-role key only.

