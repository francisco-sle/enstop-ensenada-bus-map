-- Remove route_stops associations where the stop is more than 40 meters away from the route geometry
DELETE FROM route_stops rs
USING routes r, stops s
WHERE rs.route_id = r.id AND rs.stop_id = s.id
AND ST_Distance(r.geom::geography, s.geom::geography) > 40;
