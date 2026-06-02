-- Clean slate
TRUNCATE categories, routes, stops, route_stops, fare_rules RESTART IDENTITY CASCADE;

-- Insert categories
INSERT INTO categories (id, name, color_hex) VALUES
(1, 'Centro–Chapultepec', '#3DBFA8');

-- Insert routes
INSERT INTO routes (id, name, short_name, category_id, description, geom, direction, is_active) VALUES
(1, 'R1 — Centro–Chapultepec', 'R1', 1, 'Ruta troncal de Centro a Chapultepec por Av. Reforma', 
  ST_GeomFromText('LINESTRING(-116.625 31.868, -116.621 31.865, -116.618 31.861, -116.615 31.857, -116.610 31.854, -116.605 31.851, -116.602 31.848, -116.600 31.845, -116.599 31.842, -116.598 31.839, -116.597 31.835, -116.596 31.831, -116.595 31.826, -116.594 31.820, -116.592 31.814, -116.590 31.808, -116.586 31.800, -116.583 31.790, -116.580 31.780, -116.590 31.785, -116.594 31.795, -116.598 31.805, -116.602 31.815, -116.606 31.825, -116.610 31.835, -116.614 31.845, -116.618 31.855, -116.623 31.862, -116.625 31.868)', 4326),
  'circular', true);

-- Insert stops
INSERT INTO stops (id, name, common_name, geom, is_terminal, accessible) VALUES
(1, 'Terminal Centro', 'Terminal Centro', ST_SetSRID(ST_MakePoint(-116.625, 31.868), 4326), true, true),
(2, 'Calle Segunda y Gastélum', 'Parque Revolución', ST_SetSRID(ST_MakePoint(-116.621, 31.865), 4326), false, true),
(3, 'Calle Segunda y Floresta', 'Calle 2da & Floresta', ST_SetSRID(ST_MakePoint(-116.618, 31.861), 4326), false, false),
(4, 'Calle Segunda y Espinoza', 'Calle 2da & Espinoza', ST_SetSRID(ST_MakePoint(-116.615, 31.857), 4326), false, false),
(5, 'Calle Segunda y Rayón', 'Calle 2da & Rayón', ST_SetSRID(ST_MakePoint(-116.610, 31.854), 4326), false, true),
(6, 'Calle Segunda y Kiliwas', 'Calle 2da & Kiliwas', ST_SetSRID(ST_MakePoint(-116.605, 31.851), 4326), false, false),
(7, 'Avenida Reforma y Calle Diamante', 'Reforma & Diamante', ST_SetSRID(ST_MakePoint(-116.602, 31.848), 4326), false, true),
(8, 'Avenida Reforma y Calle Plita', 'Reforma & Plita', ST_SetSRID(ST_MakePoint(-116.600, 31.845), 4326), false, false),
(9, 'Avenida Reforma y Calle Delante', 'Reforma & Delante', ST_SetSRID(ST_MakePoint(-116.599, 31.842), 4326), false, false),
(10, 'Avenida Reforma UABC Valle Dorado', 'UABC Valle Dorado', ST_SetSRID(ST_MakePoint(-116.598, 31.839), 4326), false, true),
(11, 'Avenida Reforma Plaza Sendero', 'Plaza Sendero / Macroplaza', ST_SetSRID(ST_MakePoint(-116.597, 31.835), 4326), false, true),
(12, 'Avenida Reforma y Calle Esmeralda', 'Reforma & Esmeralda', ST_SetSRID(ST_MakePoint(-116.596, 31.831), 4326), false, false),
(13, 'Avenida Reforma y Calle Alisos', 'Reforma & Alisos', ST_SetSRID(ST_MakePoint(-116.595, 31.826), 4326), false, false),
(14, 'Avenida Reforma y Calle Coral', 'Reforma & Calle Coral', ST_SetSRID(ST_MakePoint(-116.594, 31.820), 4326), false, false),
(15, 'Avenida Reforma Clinica 8 IMSS', 'IMSS Clinica 8', ST_SetSRID(ST_MakePoint(-116.592, 31.814), 4326), false, true),
(16, 'Avenida Reforma y Lázaro Cárdenas', 'Reforma & Lázaro Cárdenas', ST_SetSRID(ST_MakePoint(-116.590, 31.808), 4326), false, true),
(17, 'Avenida Reforma y Calle Estancia', 'Reforma & Estancia', ST_SetSRID(ST_MakePoint(-116.586, 31.800), 4326), false, true),
(18, 'Avenida Reforma Pórticos del Mar', 'Pórticos del Mar', ST_SetSRID(ST_MakePoint(-116.583, 31.790), 4326), false, true),
(19, 'Terminal Chapultepec', 'Terminal Chapultepec', ST_SetSRID(ST_MakePoint(-116.580, 31.780), 4326), true, true),
(20, 'Pedro Loyola y Entrada Chapultepec', 'Pedro Loyola & Entrada Chapultepec', ST_SetSRID(ST_MakePoint(-116.590, 31.785), 4326), false, false),
(21, 'Pedro Loyola y Pórticos del Mar', 'Pedro Loyola & Pórticos del Mar', ST_SetSRID(ST_MakePoint(-116.594, 31.795), 4326), false, true),
(22, 'Pedro Loyola y Calle Lago Powell', 'Pedro Loyola & Lago Powell', ST_SetSRID(ST_MakePoint(-116.598, 31.805), 4326), false, false),
(23, 'Pedro Loyola y Calle Estancia', 'Pedro Loyola & Estancia', ST_SetSRID(ST_MakePoint(-116.602, 31.815), 4326), false, true),
(24, 'Pedro Loyola y Lázaro Cárdenas', 'Pedro Loyola & Lázaro Cárdenas', ST_SetSRID(ST_MakePoint(-116.606, 31.825), 4326), false, true),
(25, 'Pedro Loyola y Clinica 8 IMSS', 'Pedro Loyola & IMSS', ST_SetSRID(ST_MakePoint(-116.610, 31.835), 4326), false, true),
(26, 'Pedro Loyola y Calle Esmeralda', 'Pedro Loyola & Esmeralda', ST_SetSRID(ST_MakePoint(-116.614, 31.845), 4326), false, false),
(27, 'Blvd. Costero y Sanginés', 'Blvd. Costero & Sanginés', ST_SetSRID(ST_MakePoint(-116.618, 31.855), 4326), false, false),
(28, 'Plaza Cívica de la Patria', 'Plaza Cívica', ST_SetSRID(ST_MakePoint(-116.623, 31.862), 4326), false, true);

-- Insert route_stops (Sequence mapping)
INSERT INTO route_stops (route_id, stop_id, sequence) VALUES
(1, 1, 1),
(1, 2, 2),
(1, 3, 3),
(1, 4, 4),
(1, 5, 5),
(1, 6, 6),
(1, 7, 7),
(1, 8, 8),
(1, 9, 9),
(1, 10, 10),
(1, 11, 11),
(1, 12, 12),
(1, 13, 13),
(1, 14, 14),
(1, 15, 15),
(1, 16, 16),
(1, 17, 17),
(1, 18, 18),
(1, 19, 19),
(1, 20, 20),
(1, 21, 21),
(1, 22, 22),
(1, 23, 23),
(1, 24, 24),
(1, 25, 25),
(1, 26, 26),
(1, 27, 27),
(1, 28, 28);

-- Insert fare_rules
INSERT INTO fare_rules (route_id, passenger_type, fare_mxn, effective_from, notes) VALUES
(1, 'normal', 13.00, '2024-01-01', 'Tarifa general de microbús 2024'),
(1, 'student_government', 7.00, '2024-01-01', 'Tarifa estudiante con credencial de gobierno'),
(1, 'student_highschool', 10.00, '2024-01-01', 'Tarifa estudiante preparatoria/universidad privada'),
(1, 'disability', 7.00, '2024-01-01', 'Tarifa preferencial para personas con discapacidad');
