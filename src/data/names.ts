export const FIRST_NAMES = [
  'Ava', 'Liam', 'Noah', 'Mia', 'Zoe', 'Ethan', 'Aria', 'Lucas', 'Ivy', 'Kai',
  'Maya', 'Leo', 'Nina', 'Owen', 'Ruby', 'Sam', 'Tara', 'Vera', 'Wade', 'Yuki',
  'Adrian', 'Bianca', 'Cyrus', 'Daria', 'Eli', 'Fiona', 'Grant', 'Hana', 'Iris', 'Jonah',
  'Kira', 'Logan', 'Mira', 'Nico', 'Olive', 'Pia', 'Quinn', 'Ravi', 'Sana', 'Theo',
  'Uma', 'Vince', 'Wren', 'Xena', 'Yara', 'Zane', 'Bea', 'Cole', 'Dex', 'Elena',
];

export const LAST_NAMES = [
  'Chen', 'Patel', 'Garcia', 'Kim', 'Nguyen', 'Rivera', 'Khan', 'Singh', 'Rossi', 'Schmidt',
  'Tanaka', 'Olsen', 'Cohen', 'Murphy', 'Park', 'Diaz', 'Ali', 'Wang', 'Brown', 'Reyes',
  'Müller', 'Novak', 'Silva', 'Sato', 'Liu', 'Ford', 'Costa', 'Bauer', 'Haddad', 'Yamamoto',
  'Volkov', 'Mehta', 'Larsen', 'Okafor', 'Petrov', 'Dube', 'Romano', 'Vega', 'Asante', 'Becker',
];

export const COMPANY_PREFIXES = [
  'Hyper', 'Meta', 'Quantum', 'Pixel', 'Nexus', 'Strata', 'Nova', 'Aero', 'Volt', 'Lumen',
  'Echo', 'Flux', 'Vertex', 'Quark', 'Apex', 'Orbit', 'Cobalt', 'Glyph', 'Helio', 'Onyx',
];

export const COMPANY_SUFFIXES = [
  'ly', 'io', 'stack', 'flow', 'hub', 'base', 'lab', 'verse', 'wave', 'grid',
  'forge', 'loop', 'pod', 'nest', 'sync',
];

export function randomName(rng: () => number = Math.random): string {
  const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

export function randomCompanyName(rng: () => number = Math.random): string {
  const p = COMPANY_PREFIXES[Math.floor(rng() * COMPANY_PREFIXES.length)];
  const s = COMPANY_SUFFIXES[Math.floor(rng() * COMPANY_SUFFIXES.length)];
  return `${p}${s}`;
}

export function uid(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
