import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const stopsPath = path.resolve(__dirname, '../data/stops.json');
const routesPath = path.resolve(__dirname, '../data/routes.json');
const seedPath = path.resolve(__dirname, '../../../../supabase/seed.sql');

// Pure JS projection and snapping helper functions
function getDistanceSq(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return dx * dx + dy * dy;
}

function projectPointOnSegment(p, a, b) {
  const x = p[0], y = p[1];
  const x1 = a[0], y1 = a[1];
  const x2 = b[0], y2 = b[1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  if (dx === 0 && dy === 0) {
    return a;
  }
  
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  if (t < 0) return a;
  if (t > 1) return b;
  
  return [x1 + t * dx, y1 + t * dy];
}

function snapPointToPolyline(p, polyline) {
  let minDistSq = Infinity;
  let bestPoint = null;
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];
    const proj = projectPointOnSegment(p, a, b);
    const distSq = getDistanceSq(p, proj);
    if (distSq < minDistSq) {
      minDistSq = distSq;
      bestPoint = proj;
    }
  }
  return bestPoint;
}

async function run() {
  console.log('Reading original stops.json...');
  const stops = JSON.parse(fs.readFileSync(stopsPath, 'utf8'));

  // Define 7 key turn waypoints to get a clean, detour-free round route path
  const keyWaypoints = [
    [-116.625, 31.868], // Terminal Centro
    [-116.610, 31.854], // Segunda/Rayón
    [-116.602, 31.848], // Reforma/Diamante
    [-116.580, 31.780], // Terminal Chapultepec
    [-116.590, 31.785], // Pedro Loyola/Entrada Chapultepec
    [-116.618, 31.855], // Pedro Loyola/Sanginés
    [-116.623, 31.862], // Plaza Cívica
    [-116.625, 31.868]  // Return to Terminal Centro
  ];

  console.log('Querying OSRM Route API for a clean main route path...');
  const routeQueryStr = keyWaypoints.map(c => `${c[0]},${c[1]}`).join(';');
  const routeUrl = `https://router.project-osrm.org/route/v1/driving/${routeQueryStr}?overview=full&geometries=geojson`;

  let routeGeom = null;
  try {
    const res = await fetch(routeUrl);
    if (!res.ok) {
      throw new Error(`OSRM route request failed: ${res.statusText}`);
    }
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      routeGeom = data.routes[0].geometry;
      console.log(`Clean route generated successfully. Waypoint count: ${routeGeom.coordinates.length}`);
    } else {
      throw new Error(`OSRM route response not OK: ${data.code}`);
    }
  } catch (e) {
    console.error('Failed to generate clean route geometry:', e.message);
    process.exit(1);
  }

  const routeCoords = routeGeom.coordinates; // array of [lng, lat]
  const snappedStops = [];

  console.log('Snapping all stops directly onto the clean route path...');
  for (const stop of stops) {
    const originalCoords = stop.geom.coordinates;
    const snappedCoords = snapPointToPolyline(originalCoords, routeCoords);
    
    console.log(`Snapped Stop #${stop.id} "${stop.name}": [${originalCoords}] -> [${snappedCoords}]`);
    
    snappedStops.push({
      ...stop,
      geom: {
        type: 'Point',
        coordinates: snappedCoords
      }
    });
  }

  // Write snapped stops back to stops.json
  fs.writeFileSync(stopsPath, JSON.stringify(snappedStops, null, 2), 'utf8');
  console.log('Saved snapped stops.json');

  // Read and update routes.json
  const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
  // Update route with id: 1
  const updatedRoutes = routes.map(r => {
    if (r.id === 1) {
      return {
        ...r,
        geom: routeGeom
      };
    }
    return r;
  });
  fs.writeFileSync(routesPath, JSON.stringify(updatedRoutes, null, 2), 'utf8');
  console.log('Saved updated routes.json');

  // Update seed.sql
  console.log('Updating seed.sql...');
  
  // Format stops insert statement
  const stopsInsertRows = snappedStops.map(s => {
    const [lng, lat] = s.geom.coordinates;
    const nameEscaped = s.name.replace(/'/g, "''");
    const commonNameEscaped = s.common_name.replace(/'/g, "''");
    return `(${s.id}, '${nameEscaped}', '${commonNameEscaped}', ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), ${s.is_terminal}, ${s.accessible})`;
  }).join(',\n');

  const routeLineStringWKT = `LINESTRING(${routeGeom.coordinates.map(c => `${c[0]} ${c[1]}`).join(', ')})`;

  // Construct seed.sql content
  const seedContent = `-- Clean slate
TRUNCATE categories, routes, stops, route_stops, fare_rules RESTART IDENTITY CASCADE;

-- Insert categories
INSERT INTO categories (id, name, color_hex) VALUES
(1, 'Centro–Chapultepec', '#3DBFA8');

-- Insert routes
INSERT INTO routes (id, name, short_name, category_id, description, geom, direction, is_active) VALUES
(1, 'R1 — Centro–Chapultepec', 'R1', 1, 'Ruta troncal de Centro a Chapultepec por Av. Reforma', 
  ST_GeomFromText('${routeLineStringWKT}', 4326),
  'circular', true);

-- Insert stops
INSERT INTO stops (id, name, common_name, geom, is_terminal, accessible) VALUES
${stopsInsertRows};

-- Insert route_stops (Sequence mapping)
INSERT INTO route_stops (route_id, stop_id, sequence) VALUES
${snappedStops.map(s => `(1, ${s.id}, ${s.id})`).join(',\n')};

-- Insert fare_rules
INSERT INTO fare_rules (route_id, passenger_type, fare_mxn, effective_from, notes) VALUES
(1, 'normal', 13.00, '2024-01-01', 'Tarifa general de microbús 2024'),
(1, 'student_government', 7.00, '2024-01-01', 'Tarifa estudiante con credencial de gobierno'),
(1, 'student_highschool', 10.00, '2024-01-01', 'Tarifa estudiante preparatoria/universidad privada'),
(1, 'disability', 7.00, '2024-01-01', 'Tarifa preferencial para personas con discapacidad');
`;

  fs.writeFileSync(seedPath, seedContent, 'utf8');
  console.log('Saved updated seed.sql');
}

run();
