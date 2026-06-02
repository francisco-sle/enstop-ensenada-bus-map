-- Clean slate
TRUNCATE categories, routes, stops, route_stops, fare_rules RESTART IDENTITY CASCADE;

-- Insert categories
INSERT INTO categories (id, name, color_hex) VALUES
(1, 'Centro–Chapultepec', '#3DBFA8');

-- Insert routes
INSERT INTO routes (id, name, short_name, category_id, description, geom, direction, is_active) VALUES
(1, 'R1 — Centro–Chapultepec', 'R1', 1, 'Ruta troncal de Centro a Chapultepec por Av. Reforma', 
  ST_GeomFromText('LINESTRING(-116.625 31.868, -116.621 31.865, -116.618 31.862, -116.615 31.859, -116.610 31.856, -116.605 31.853, -116.602 31.849, -116.600 31.845, -116.599 31.842, -116.598 31.839, -116.597 31.835, -116.596 31.832, -116.595 31.829, -116.594 31.826, -116.593 31.823, -116.592 31.820, -116.591 31.817, -116.590 31.814, -116.589 31.811, -116.588 31.808, -116.587 31.805, -116.586 31.802, -116.585 31.799, -116.584 31.796, -116.583 31.793, -116.582 31.790, -116.581 31.787, -116.580 31.784)', 4326),
  'circular', true);

-- Insert stops
INSERT INTO stops (id, name, common_name, geom, is_terminal, accessible) VALUES
(1, 'Terminal Centro', 'Terminal Centro', ST_SetSRID(ST_MakePoint(-116.625, 31.868), 4326), true, true),
(2, 'Calle Segunda y Gastélum', 'Parque Revolución', ST_SetSRID(ST_MakePoint(-116.621, 31.865), 4326), false, true),
(3, 'Calle Tercera y Gastélum', 'Calle 3ra & Gastélum', ST_SetSRID(ST_MakePoint(-116.618, 31.862), 4326), false, false),
(4, 'Avenida Juárez y Miramar', 'Av. Juárez & Miramar', ST_SetSRID(ST_MakePoint(-116.615, 31.859), 4326), false, false),
(5, 'Plaza Cívica de la Patria', 'Plaza Cívica (Tres Cabezas)', ST_SetSRID(ST_MakePoint(-116.610, 31.856), 4326), false, true),
(6, 'Boulevard Costero y Sanginés', 'Blvd. Costero & Sanginés', ST_SetSRID(ST_MakePoint(-116.605, 31.853), 4326), false, false),
(7, 'Avenida Reforma y Calle Diamante', 'Reforma & Diamante', ST_SetSRID(ST_MakePoint(-116.602, 31.849), 4326), false, true),
(8, 'Avenida Reforma y Calle Plita', 'Reforma & Plita', ST_SetSRID(ST_MakePoint(-116.600, 31.845), 4326), false, false),
(9, 'Avenida Reforma y Calle Delante', 'Reforma & Delante', ST_SetSRID(ST_MakePoint(-116.599, 31.842), 4326), false, false),
(10, 'Avenida Reforma UABC Valle Dorado', 'UABC Valle Dorado', ST_SetSRID(ST_MakePoint(-116.598, 31.839), 4326), false, true),
(11, 'Avenida Reforma Plaza Sendero', 'Plaza Sendero / Macroplaza', ST_SetSRID(ST_MakePoint(-116.597, 31.835), 4326), false, true),
(12, 'Avenida Reforma y Calle Esmeralda', 'Reforma & Esmeralda', ST_SetSRID(ST_MakePoint(-116.596, 31.832), 4326), false, false),
(13, 'Avenida Reforma Cearte', 'Reforma (Cearte Branch)', ST_SetSRID(ST_MakePoint(-116.595, 31.829), 4326), false, false),
(14, 'Avenida Reforma y Calle Alisos', 'Reforma & Alisos', ST_SetSRID(ST_MakePoint(-116.594, 31.826), 4326), false, false),
(15, 'Avenida Reforma Clinica 8 IMSS', 'IMSS Clinica 8', ST_SetSRID(ST_MakePoint(-116.593, 31.823), 4326), false, true),
(16, 'Avenida Reforma y Hector A. Peñaloza', 'Reforma & Peñaloza', ST_SetSRID(ST_MakePoint(-116.592, 31.820), 4326), false, false),
(17, 'Avenida Reforma y Lázaro Cárdenas', 'Reforma & Lázaro Cárdenas', ST_SetSRID(ST_MakePoint(-116.591, 31.817), 4326), false, true),
(18, 'Avenida Reforma y San Marcos', 'Reforma & San Marcos', ST_SetSRID(ST_MakePoint(-116.590, 31.814), 4326), false, false),
(19, 'Avenida Reforma Soriana Super', 'Soriana Super', ST_SetSRID(ST_MakePoint(-116.589, 31.811), 4326), false, false),
(20, 'Avenida Reforma y Calle Estancia', 'Reforma & Estancia', ST_SetSRID(ST_MakePoint(-116.588, 31.808), 4326), false, true),
(21, 'Avenida Reforma y Calle Hierro', 'Reforma & Hierro', ST_SetSRID(ST_MakePoint(-116.587, 31.805), 4326), false, false),
(22, 'Avenida Reforma Valle Dorado Sur', 'Reforma (Valle Dorado Sur)', ST_SetSRID(ST_MakePoint(-116.586, 31.802), 4326), false, false),
(23, 'Avenida Reforma y Calle Lago Powell', 'Reforma & Lago Powell', ST_SetSRID(ST_MakePoint(-116.585, 31.799), 4326), false, false),
(24, 'Avenida Reforma y Calle Certeneja', 'Reforma & Certeneja', ST_SetSRID(ST_MakePoint(-116.584, 31.796), 4326), false, false),
(25, 'Avenida Reforma Pórticos del Mar', 'Pórticos del Mar', ST_SetSRID(ST_MakePoint(-116.583, 31.793), 4326), false, true),
(26, 'Avenida Reforma Villa Bonita', 'Villa Bonita', ST_SetSRID(ST_MakePoint(-116.582, 31.790), 4326), false, false),
(27, 'Avenida Reforma Entrada Chapultepec', 'Entrada Chapultepec', ST_SetSRID(ST_MakePoint(-116.581, 31.787), 4326), false, false),
(28, 'Terminal Chapultepec', 'Terminal Chapultepec', ST_SetSRID(ST_MakePoint(-116.580, 31.784), 4326), true, true);

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
