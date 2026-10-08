// ─────────────────────────────────────────────────────────────────────────────
// ENStop — Demo bus network definition (source of truth for mock data + seed)
//
// Routes follow Ensenada's real arterial corridors (Av. Reforma, Blvd. Costero,
// Calle Novena, Carretera Tijuana–Ensenada, Transpeninsular, Blvd. Geranios…)
// but are NOT official operator itineraries. They exist for demonstration until
// the real GPS data is loaded.
//
// Consumed by build_network.mjs, which road-snaps each route through OSRM and
// writes ui/src/mocks/data/*.json and supabase/seed.sql.
//
// Conventions
// - Waypoints: [lat, lng, bearing?]. A bearing pins the waypoint to the
//   carriageway travelling in that direction (dual carriageways are ~17 m apart).
// - Every route is a circular loop that starts and ends at its first stop.
// - Route stop lists are in travel order. A stop key used by several routes is a
//   single shared stop (same physical pole, same direction of travel).
// - `at` is approximate; the generator projects it onto the route geometry.
// ─────────────────────────────────────────────────────────────────────────────

export const brands = [
  { id: 1, name: 'Rojo y Blanco', color_hex: '#ef4444', units_operating: 343 },
  { id: 2, name: 'Amarillo y Blanco', color_hex: '#eab308', units_operating: 260 },
  { id: 3, name: 'Transportes El Vigía', color_hex: '#3b82f6', units_operating: 139 },
  { id: 4, name: 'Transportes Brisa', color_hex: '#f97316', units_operating: 87 },
  { id: 5, name: 'Transportes Flecha Verde', color_hex: '#22c55e', units_operating: 45 },
  { id: 6, name: 'Transportes Nativos', color_hex: '#6b7280', units_operating: 25 },
]

export const categories = [
  { id: 1, name: 'Centro–Chapultepec', color_hex: '#3DBFA8' },
  { id: 2, name: 'Centro–Maneadero', color_hex: '#F59E0B' },
  { id: 3, name: 'Centro–El Sauzal', color_hex: '#3B82F6' },
  { id: 4, name: 'Centro–Lomitas', color_hex: '#F97316' },
  { id: 5, name: 'Centro–Valle Dorado', color_hex: '#22C55E' },
]

// Same fare schedule for every route (2025 microbús tariff).
export const fareSchedule = [
  { passenger_type: 'normal', fare_mxn: 15.5, notes: 'Tarifa general de microbús 2025' },
  { passenger_type: 'student', fare_mxn: 5.85, notes: 'Tarifa de estudiante' },
  { passenger_type: 'senior', fare_mxn: 7.75, notes: 'Tarifa preferencial para tercera edad' },
  {
    passenger_type: 'disability',
    fare_mxn: 7.75,
    notes: 'Tarifa preferencial para personas con discapacidad',
  },
  {
    passenger_type: 'disability_free',
    fare_mxn: 0,
    notes: 'Tarifa gratuita para personas con discapacidad',
  },
]

// ── Stops ────────────────────────────────────────────────────────────────────
// Directional hints in common_name: "→ Centro" = northbound / inbound.

const S = (name, common_name, at, opts = {}) => ({
  name,
  common_name,
  at,
  is_terminal: false,
  accessible: false,
  ...opts,
})
const T = { is_terminal: true, accessible: true }
const A = { accessible: true }

export const stops = {
  // Downtown (shared by every route)
  centro: S('Terminal Centro', 'Calle Novena y Av. Alvarado', [31.869517, -116.617893], T),
  novenaFloresta: S('Calle Novena y Av. Floresta', 'Zona Centro', [31.86763, -116.61278], A),
  octavaEspinoza: S('Calle Octava y Av. Espinoza', 'Zona Centro → Terminal', [31.8671, -116.61449]),
  riverollJuarez: S('Av. Riveroll y Av. Juárez', 'Zona Centro', [31.86622, -116.62214], A),

  // Av. Reforma southbound (→ Chapultepec)
  reformaJuarezS: S('Av. Reforma y Av. Juárez', 'Col. Obrera → Sur', [31.86051, -116.60673]),
  reformaDiamanteS: S('Av. Reforma y Av. Diamante', '→ Sur', [31.8557, -116.60577]),
  reformaEsmeraldaS: S('Av. Reforma y Blvd. Esmeralda', '→ Sur', [31.84643, -116.60388], A),
  reformaEstanciaS: S('Av. Reforma y Blvd. Estancia', 'Col. Acapulco → Sur', [31.84171, -116.603]),
  reformaPalmasS: S('Av. Reforma y Av. Las Palmas', 'Valle Dorado → Sur', [31.83497, -116.60169]),
  reformaPlayaS: S(
    'Av. Reforma y Blvd. Paseo de la Playa',
    'Hospital General / UABC → Sur',
    [31.82569, -116.59986],
    A,
  ),
  reformaHierroS: S(
    'Av. Reforma y Calle Hierro',
    'Macroplaza del Mar → Sur',
    [31.8193, -116.5986],
    A,
  ),
  reformaCamachoS: S(
    'Av. Reforma y Av. Ávila Camacho',
    'Centro de Gobierno → Sur',
    [31.81003, -116.59674],
  ),
  reformaTecS: S('Av. Reforma y Blvd. Tecnológico', 'CBTIS 41 → Sur', [31.80408, -116.59554]),
  reformaMelendrezS: S(
    'Av. Reforma y Blvd. Antonio Meléndrez',
    'Chapultepec → Sur',
    [31.7911, -116.593],
  ),
  reformaMorelosS: S('Av. Reforma y Calzada Morelos', 'Chapultepec → Sur', [31.78431, -116.59164]),

  // Chapultepec
  chapultepec: S(
    'Terminal Chapultepec',
    'Calzada Morelos y Calle California Tercera',
    [31.78245, -116.60435],
    T,
  ),

  // Av. Reforma northbound (→ Centro)
  reformaLazaroN: S(
    'Av. Reforma y Prol. Lázaro Cárdenas',
    'Chapultepec → Centro',
    [31.7824, -116.59108],
  ),
  reformaMelendrezN: S(
    'Av. Reforma y Blvd. Antonio Meléndrez',
    'Chapultepec → Centro',
    [31.79106, -116.5928],
  ),
  reformaTecN: S('Av. Reforma y Blvd. Tecnológico', 'CBTIS 41 → Centro', [31.80397, -116.59536]),
  reformaCamachoN: S(
    'Av. Reforma y Av. Ávila Camacho',
    'Centro de Gobierno → Centro',
    [31.81005, -116.59656],
    A,
  ),
  reformaGranadaN: S(
    'Av. Reforma y Calle Granada',
    'Hospital General / UABC → Centro',
    [31.82328, -116.59918],
    A,
  ),
  reformaPlintaN: S('Av. Reforma y Blvd. Plinta', 'Valle Dorado → Centro', [31.8372, -116.60192]),
  reformaEstanciaN: S(
    'Av. Reforma y Blvd. Estancia',
    'Col. Acapulco → Centro',
    [31.84173, -116.60284],
  ),
  reformaDelanteN: S('Av. Reforma y Av. Delante', '→ Centro', [31.85097, -116.60466], A),
  reformaJuarezN: S('Av. Reforma y Av. Juárez', 'Col. Obrera → Centro', [31.86021, -116.60649]),

  // R2 — Blvd. Costero & Maneadero
  costeroBlancarte: S(
    'Blvd. Costero y Av. Blancarte',
    'Malecón / Plaza Cívica',
    [31.85986, -116.62271],
    A,
  ),
  costeroSangines: S('Blvd. Costero y Calle Sanginés', 'Bahía Ensenada', [31.84953, -116.61464]),
  costeroEstancia: S(
    'Blvd. Costero y Blvd. Estancia',
    'Col. Acapulco / Plaza Contenedores',
    [31.84059, -116.61113],
  ),
  florestaLoyola: S('Calle Floresta y Av. Pedro Loyola', 'Punta Banda', [31.83208, -116.60556]),
  reformaBallenasS: S(
    'Av. Reforma y Calle Paseo de las Ballenas',
    'Chapultepec Sur → Maneadero',
    [31.7772, -116.5903],
  ),
  transpHidalgoS: S(
    'Carretera Transpeninsular y Calle Miguel Hidalgo',
    '→ Maneadero',
    [31.74493, -116.58391],
  ),
  transpCantuS: S(
    'Carretera Transpeninsular y Calle Esteban Cantú',
    'Maneadero',
    [31.73312, -116.58145],
  ),
  maneadero: S(
    'Terminal Maneadero',
    'Calle Francisco I. Madero, Maneadero',
    [31.729654, -116.573663],
    T,
  ),
  transpHidalgoN: S(
    'Carretera Transpeninsular y Calle Miguel Hidalgo',
    'Maneadero → Centro',
    [31.74496, -116.58363],
  ),
  transpMaderoN: S(
    'Carretera Transpeninsular y Calle Francisco I. Madero',
    '→ Centro',
    [31.75401, -116.58543],
  ),
  reformaBallenasN: S(
    'Av. Reforma y Calle Paseo de las Ballenas',
    'Chapultepec Sur → Centro',
    [31.77727, -116.59011],
  ),

  // R3 — Blvd. Fernando Consag & El Sauzal
  costeroMiramar: S(
    'Blvd. Costero y Av. Miramar',
    'Malecón / Mercado Negro',
    [31.86238, -116.62807],
    A,
  ),
  consagBarco: S(
    'Blvd. Fernando Consag y Calle del Barco',
    'Fracc. Playitas → El Sauzal',
    [31.86418, -116.65626],
  ),
  carreteraCiceseN: S(
    'Carretera Tijuana–Ensenada y Calle Teniente Azueta',
    'CICESE / UABC → El Sauzal',
    [31.86663, -116.66789],
    A,
  ),
  carreteraRosasN: S(
    'Carretera Tijuana–Ensenada y Calle de las Rosas',
    'El Sauzal',
    [31.87042, -116.67679],
  ),
  carreteraPemexN: S(
    'Carretera Tijuana–Ensenada, Terminal PEMEX',
    'El Sauzal',
    [31.8801, -116.683],
  ),
  sauzalPrimera: S('Calle Primera y Avenida L', 'El Sauzal', [31.89041, -116.69245]),
  sauzal: S('Terminal El Sauzal', 'Av. Benito Juárez y Calle Segunda', [31.895233, -116.694285], T),
  carreteraPemexS: S(
    'Carretera Tijuana–Ensenada, Terminal PEMEX',
    'El Sauzal → Centro',
    [31.8801, -116.683],
  ),
  carreteraRosasS: S(
    'Carretera Tijuana–Ensenada y Calle de las Rosas',
    'El Sauzal → Centro',
    [31.87042, -116.67679],
  ),
  carreteraCiceseS: S(
    'Carretera Tijuana–Ensenada y Calle Teniente Azueta',
    'CICESE / UABC → Centro',
    [31.86651, -116.66787],
    A,
  ),
  clarkAleman: S('Av. Clark Flores y Av. Miguel Alemán', '→ Centro', [31.86943, -116.64557]),
  clarkBelgrado: S(
    'Av. Clark Flores y Calle Belgrado',
    'Cruz Roja → Centro',
    [31.87333, -116.63587],
    A,
  ),
  novenaRuiz: S('Calle Novena y Av. Ruiz', 'Zona Centro', [31.87165, -116.62372]),

  // R4 — Lomitas & Popular 89
  reformaOnceN: S('Av. Reforma y Calle Once', 'Col. Ulbrich → Lomitas', [31.86924, -116.6083]),
  constAlisosN: S(
    'Av. Constituyentes y Calle Alisos',
    'Valle Verde → Lomitas',
    [31.87959, -116.60154],
  ),
  higuerasLomitasE: S(
    'Calle de las Higueras y De las Moras',
    'Lomitas → Popular 89',
    [31.8895, -116.5966],
  ),
  geraniosPinoE: S('Blvd. Geranios y Calle Pino', 'Lomitas → Popular 89', [31.89306, -116.58305]),
  popular89: S(
    'Terminal Popular 89',
    'Libramiento Circuito Oriente y Blvd. Geranios',
    [31.896233, -116.575118],
    T,
  ),
  geraniosCochimiW: S(
    'Blvd. Geranios y Av. Cochimí',
    'Soriana Geranios → Centro',
    [31.89488, -116.57826],
    A,
  ),
  geraniosPinoW: S('Blvd. Geranios y Calle Pino', 'Lomitas → Centro', [31.89312, -116.5832]),
  higuerasLomitasW: S(
    'Calle de las Higueras y De las Moras',
    'Lomitas → Centro',
    [31.88966, -116.59656],
  ),
  higuerasAmbarW: S(
    'Calle de las Higueras y Ámbar',
    'Valle Verde → Centro',
    [31.88378, -116.60489],
  ),
  constAlisosS: S(
    'Av. Constituyentes y Calle Alisos',
    'Valle Verde → Centro',
    [31.87958, -116.60161],
  ),
  reformaOnceS: S('Av. Reforma y Calle Once', 'Col. Ulbrich → Centro', [31.86923, -116.6084]),

  // R5 — Esmeralda & Valle Dorado
  aguilasMina: S(
    'Calzada de las Águilas y Av. Francisco Mina',
    'Col. Aviación',
    [31.86347, -116.60178],
  ),
  aguilasMexico: S(
    'Calzada de las Águilas y Av. México',
    'Col. Independencia',
    [31.86454, -116.59434],
  ),
  perifericoCortez: S('Periférico y Calzada Cortez', 'Col. Hidalgo', [31.86369, -116.58212]),
  perifericoDelante: S('Periférico y Av. Delante', 'Ampliación Hidalgo', [31.85468, -116.57938]),
  esmeraldaCostaBella: S(
    'Blvd. Esmeralda y Calle Paseo Costa Bella',
    'Unidad Costa Bella',
    [31.84918, -116.58486],
  ),
  esmeraldaMexico: S('Blvd. Esmeralda y Av. México', 'Col. Cuauhtémoc', [31.84829, -116.59112], A),
  floresEstancia: S(
    'Blvd. Paseo de las Flores y Blvd. Estancia',
    'Valle Dorado',
    [31.84243, -116.59852],
  ),
  zertucheVictoria: S(
    'Blvd. Zertuche y Blvd. del Lago Victoria',
    'Valle Dorado',
    [31.83392, -116.59889],
  ),
  zertucheLagos: S(
    'Blvd. Zertuche y Blvd. de los Lagos',
    'UABC Valle Dorado',
    [31.82724, -116.59759],
    A,
  ),
  hierroZertuche: S(
    'Calle Hierro y Blvd. Zertuche',
    'Macroplaza del Mar',
    [31.81948, -116.59607],
    A,
  ),
}

// ── Routes ───────────────────────────────────────────────────────────────────

const reformaNorthbound = [
  'reformaGranadaN',
  'reformaPlintaN',
  'reformaEstanciaN',
  'reformaDelanteN',
  'reformaJuarezN',
  'octavaEspinoza',
]

export const routes = [
  {
    id: 1,
    short_name: 'R1',
    name: 'Rojo y Blanco — Centro–Chapultepec',
    category_id: 1,
    brand_id: 1,
    description:
      'Ruta troncal por Av. Reforma: Centro, Valle Dorado, Hospital General, Macroplaza y Chapultepec.',
    waypoints: [
      [31.869517, -116.617893, 115],
      [31.850043, -116.604667, 165],
      [31.824497, -116.599621, 170],
      [31.799981, -116.594736, 170],
      [31.78341, -116.597962, 265],
      [31.783507, -116.604547],
      [31.781442, -116.597594, 85],
      [31.799991, -116.594572, 350],
      [31.824495, -116.599431, 350],
      [31.850003, -116.604475, 345],
      [31.867405, -116.615308, 295],
      [31.869517, -116.617893, 115],
    ],
    stops: [
      'centro',
      'novenaFloresta',
      'reformaJuarezS',
      'reformaDiamanteS',
      'reformaEsmeraldaS',
      'reformaEstanciaS',
      'reformaPalmasS',
      'reformaPlayaS',
      'reformaHierroS',
      'reformaCamachoS',
      'reformaTecS',
      'reformaMelendrezS',
      'reformaMorelosS',
      'chapultepec',
      'reformaLazaroN',
      'reformaMelendrezN',
      'reformaTecN',
      'reformaCamachoN',
      ...reformaNorthbound,
    ],
  },
  {
    id: 2,
    short_name: 'R2',
    name: 'Amarillo y Blanco — Centro–Maneadero',
    category_id: 2,
    brand_id: 2,
    description:
      'Ruta suburbana: sale por Blvd. Costero y la Transpeninsular hasta Maneadero; regresa por Av. Reforma.',
    waypoints: [
      [31.869517, -116.617893, 115],
      [31.864833, -116.622858],
      [31.853856, -116.616849, 150],
      [31.837994, -116.610541, 170],
      [31.824497, -116.599621, 170],
      [31.799981, -116.594736, 170],
      [31.750013, -116.584911, 160],
      [31.726697, -116.580257],
      [31.729654, -116.573663],
      [31.750055, -116.584627, 340],
      [31.799991, -116.594572, 350],
      [31.81298, -116.597137, 350],
      [31.824495, -116.599431, 350],
      [31.840003, -116.602481, 350],
      [31.850003, -116.604475, 345],
      [31.867405, -116.615308, 295],
      [31.869517, -116.617893, 115],
    ],
    stops: [
      'centro',
      'riverollJuarez',
      'costeroBlancarte',
      'costeroSangines',
      'costeroEstancia',
      'florestaLoyola',
      'reformaPlayaS',
      'reformaHierroS',
      'reformaTecS',
      'reformaMorelosS',
      'reformaBallenasS',
      'transpHidalgoS',
      'transpCantuS',
      'maneadero',
      'transpHidalgoN',
      'transpMaderoN',
      'reformaBallenasN',
      'reformaLazaroN',
      'reformaMelendrezN',
      'reformaTecN',
      'reformaCamachoN',
      ...reformaNorthbound,
    ],
  },
  {
    id: 3,
    short_name: 'R3',
    name: 'El Vigía — Centro–El Sauzal',
    category_id: 3,
    brand_id: 3,
    description:
      'Sale por el Malecón y Blvd. Fernando Consag, pasa por CICESE/UABC hasta El Sauzal; regresa por Av. Clark Flores.',
    waypoints: [
      [31.869517, -116.617893, 115],
      [31.864833, -116.622858],
      [31.860812, -116.640049, 280],
      [31.864724, -116.65757, 300],
      [31.869049, -116.674681, 320],
      [31.885324, -116.686491, 320],
      [31.895233, -116.694285],
      [31.885246, -116.686582, 140],
      [31.868947, -116.67474, 140],
      [31.867283, -116.655866, 100],
      [31.87057, -116.640915, 105],
      [31.871332, -116.622837, 115],
      [31.869517, -116.617893, 115],
    ],
    stops: [
      'centro',
      'riverollJuarez',
      'costeroMiramar',
      'consagBarco',
      'carreteraCiceseN',
      'carreteraRosasN',
      'carreteraPemexN',
      'sauzalPrimera',
      'sauzal',
      'carreteraPemexS',
      'carreteraRosasS',
      'carreteraCiceseS',
      'clarkAleman',
      'clarkBelgrado',
      'novenaRuiz',
    ],
  },
  {
    id: 4,
    short_name: 'R4',
    name: 'Brisa — Centro–Lomitas–Popular 89',
    category_id: 4,
    brand_id: 4,
    description:
      'Sube por Av. Reforma y Constituyentes a Valle Verde, Lomitas y Blvd. Geranios hasta Popular 89.',
    waypoints: [
      [31.869517, -116.617893, 115],
      [31.867225, -116.611635, 115],
      [31.87098, -116.608646, 350],
      [31.874405, -116.605041, 75],
      [31.879011, -116.601425, 350],
      [31.88922, -116.599282, 60],
      [31.892319, -116.585155, 70],
      [31.896233, -116.575118],
      [31.892405, -116.585202, 250],
      [31.889319, -116.599322, 240],
      [31.879, -116.601499, 170],
      [31.874455, -116.604872, 255],
      [31.870993, -116.608746, 170],
      [31.867523, -116.612235, 295],
      [31.867405, -116.615308, 295],
      [31.869517, -116.617893, 115],
    ],
    stops: [
      'centro',
      'novenaFloresta',
      'reformaOnceN',
      'constAlisosN',
      'higuerasLomitasE',
      'geraniosPinoE',
      'popular89',
      'geraniosCochimiW',
      'geraniosPinoW',
      'higuerasLomitasW',
      'higuerasAmbarW',
      'constAlisosS',
      'reformaOnceS',
      'octavaEspinoza',
    ],
  },
  {
    id: 5,
    short_name: 'R5',
    name: 'Flecha Verde — Centro–Esmeralda–Valle Dorado',
    category_id: 5,
    brand_id: 5,
    description:
      'Circuito oriente: Calzada de las Águilas, Periférico y Blvd. Esmeralda hasta Valle Dorado y UABC; regresa por Av. Reforma.',
    waypoints: [
      [31.869517, -116.617893, 115],
      [31.86446, -116.594891, 75],
      [31.858121, -116.580039, 180],
      [31.848435, -116.590098, 255],
      [31.834986, -116.5991, 170],
      [31.825816, -116.597374, 170],
      [31.819282, -116.597497, 265],
      [31.824495, -116.599431, 350],
      [31.850003, -116.604475, 345],
      [31.867405, -116.615308, 295],
      [31.869517, -116.617893, 115],
    ],
    stops: [
      'centro',
      'novenaFloresta',
      'aguilasMina',
      'aguilasMexico',
      'perifericoCortez',
      'perifericoDelante',
      'esmeraldaCostaBella',
      'esmeraldaMexico',
      'floresEstancia',
      'zertucheVictoria',
      'zertucheLagos',
      'hierroZertuche',
      ...reformaNorthbound,
    ],
  },
]
