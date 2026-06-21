-- Migration: Update spatial degradation tolerance
-- The previous tolerance of 0.0005 degrees (~55m) was too aggressive, causing route lines
-- to cut through city blocks and building squares visually on the frontend.
-- This reduces the tolerance to 0.00005 (~5.5m), which is small enough to tightly trace
-- the street grids, but still provides enough noise/simplification to deter high-precision scraping.

CREATE OR REPLACE FUNCTION get_degraded_routes()
RETURNS TABLE(route_id BIGINT, geom JSON)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
      r.id::BIGINT,
      ST_AsGeoJSON(ST_SimplifyPreserveTopology(r.geom, 0.00005))::json
    FROM routes r
    WHERE r.is_active = TRUE;
END;
$$;

-- Ensure execution privileges remain correct
REVOKE EXECUTE ON FUNCTION get_degraded_routes() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_degraded_routes() TO service_role;
