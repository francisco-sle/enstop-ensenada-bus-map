-- Migration: Spatial geometry degradation RPC
-- Exposes a simplified (privacy-degraded) version of route geometries.
-- Called exclusively by the route-proxy Edge Function via service_role.
-- Direct table SELECT on routes is blocked by RLS (see 002_rls_policies.sql).

CREATE OR REPLACE FUNCTION get_degraded_routes()
RETURNS TABLE(route_id BIGINT, geom GEOMETRY)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
      r.id::BIGINT,
      ST_SimplifyPreserveTopology(r.geom, 0.0005)
    FROM routes r
    WHERE r.is_active = TRUE;
END;
$$;

-- Only the service_role (used by the Edge Function) may call this function.
-- anon and authenticated roles cannot invoke it directly from the client.
REVOKE EXECUTE ON FUNCTION get_degraded_routes() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_degraded_routes() TO service_role;
