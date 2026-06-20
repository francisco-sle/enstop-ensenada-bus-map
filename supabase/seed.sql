-- CI/CD mock seed — single simplified route for integration testing.
-- Real coordinates and full route data live in seed.private.sql (git-ignored).
TRUNCATE categories, routes, stops, route_stops, fare_rules RESTART IDENTITY CASCADE;

-- Single mock category
INSERT INTO categories (id, name, color_hex) VALUES
(1, 'Centro–Chapultepec', '#3DBFA8');

-- Single mock route with a minimal 2-point linestring
INSERT INTO routes (id, name, short_name, category_id, description, geom, direction, is_active) VALUES
(1, 'R1 — Mock CI Route', 'R1', 1, 'Ruta de prueba para CI/CD',
  ST_GeomFromText('LINESTRING(-116.624975 31.867987, -116.580034 31.780245)', 4326),
  'circular', true);

-- Two terminal stops
INSERT INTO stops (id, name, common_name, geom, is_terminal, accessible) VALUES
(1, 'Terminal Centro (Mock)',      'Terminal Centro',      ST_SetSRID(ST_MakePoint(-116.624975, 31.867987), 4326), true,  true),
(2, 'Terminal Chapultepec (Mock)', 'Terminal Chapultepec', ST_SetSRID(ST_MakePoint(-116.580034, 31.780245), 4326), true,  true);

-- Sequence
INSERT INTO route_stops (route_id, stop_id, sequence) VALUES
(1, 1, 1),
(1, 2, 2);

-- Fares
INSERT INTO fare_rules (route_id, passenger_type, fare_mxn, effective_from, notes) VALUES
(1, 'normal',             13.00, '2024-01-01', 'Tarifa general — mock'),
(1, 'student_government',  7.00, '2024-01-01', 'Tarifa estudiante — mock');
