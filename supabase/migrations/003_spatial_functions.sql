-- Nearest stops within radius (default 500m)
CREATE OR REPLACE FUNCTION nearby_stops(
  lat FLOAT, lng FLOAT, radius_meters FLOAT DEFAULT 500
)
RETURNS SETOF stops AS $$
  SELECT * FROM stops
  WHERE ST_DWithin(
    geom::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_meters
  )
  ORDER BY geom <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  LIMIT 20;
$$ LANGUAGE sql STABLE;

-- Active routes serving a given stop
CREATE OR REPLACE FUNCTION routes_for_stop(p_stop_id INT)
RETURNS SETOF routes AS $$
  SELECT r.* FROM routes r
  JOIN route_stops rs ON rs.route_id = r.id
  WHERE rs.stop_id = p_stop_id AND r.is_active = TRUE;
$$ LANGUAGE sql STABLE;

-- Current effective fare for a route + passenger type
CREATE OR REPLACE FUNCTION current_fare(p_route_id INT, p_passenger_type TEXT)
RETURNS fare_rules AS $$
  SELECT * FROM fare_rules
  WHERE route_id = p_route_id
    AND passenger_type = p_passenger_type
    AND effective_from <= CURRENT_DATE
  ORDER BY effective_from DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;
