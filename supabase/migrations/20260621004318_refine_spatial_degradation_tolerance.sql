-- Migration: Refine spatial degradation tolerance with grid snapping
-- The previous tolerance of 0.00005 degrees (~5.5m) was still too large for tight curves
-- like roundabouts, causing the lines to cut corners aggressively.
-- This reduces the simplify tolerance to 0.00001 (~1.1m) to maintain visual fidelity of curves,
-- but adds ST_SnapToGrid(geom, 0.00001) to forcefully remove high-precision decimal data.
-- This combination ensures the proprietary surveyor coordinates are scrubbed, without
-- destroying the true visual path of the route.

CREATE OR REPLACE FUNCTION get_degraded_routes()
RETURNS TABLE(route_id BIGINT, geom JSON)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
      r.id::BIGINT,
      ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_SnapToGrid(r.geom, 0.00001), 0.00001))::json
    FROM routes r
    WHERE r.is_active = TRUE;
END;
$$;

-- Ensure execution privileges remain correct
REVOKE EXECUTE ON FUNCTION get_degraded_routes() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_degraded_routes() TO service_role;
