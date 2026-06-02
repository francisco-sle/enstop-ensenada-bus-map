-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Route categories (e.g., "Centro–Maneadero")
CREATE TABLE categories (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  color_hex  TEXT NOT NULL  -- polyline color on map
);

-- Microbus routes
CREATE TABLE routes (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  short_name   TEXT NOT NULL,        -- e.g. "R1"
  category_id  INT REFERENCES categories(id),
  description  TEXT,
  geom         GEOMETRY(LineString, 4326) NOT NULL,
  direction    TEXT CHECK (direction IN ('inbound','outbound','circular')),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX routes_geom_idx ON routes USING GIST(geom);

-- Bus stops
CREATE TABLE stops (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  common_name  TEXT,                 -- landmark alias (e.g. "Plaza Cívica")
  geom         GEOMETRY(Point, 4326) NOT NULL,
  is_terminal  BOOLEAN DEFAULT FALSE,
  accessible   BOOLEAN DEFAULT FALSE, -- wheelchair accessible
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX stops_geom_idx ON stops USING GIST(geom);

-- Ordered route ↔ stop relationships
CREATE TABLE route_stops (
  id        SERIAL PRIMARY KEY,
  route_id  INT REFERENCES routes(id) ON DELETE CASCADE,
  stop_id   INT REFERENCES stops(id) ON DELETE CASCADE,
  sequence  INT NOT NULL,
  UNIQUE(route_id, stop_id)
);

-- Fare rules (managed by admin; updated by bus operator decisions)
CREATE TABLE fare_rules (
  id              SERIAL PRIMARY KEY,
  route_id        INT REFERENCES routes(id) ON DELETE CASCADE,
  passenger_type  TEXT CHECK (passenger_type IN (
                    'normal',
                    'student_government',
                    'student_highschool',
                    'disability'
                  )),
  fare_mxn        NUMERIC(6,2) NOT NULL,
  effective_from  DATE NOT NULL DEFAULT CURRENT_DATE,
  notes           TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
-- Always query the most recently effective fare
CREATE INDEX fare_rules_effective_idx ON fare_rules(route_id, passenger_type, effective_from DESC);
