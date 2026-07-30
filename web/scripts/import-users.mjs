#!/usr/bin/env node
/**
 * Seeds `approved_users` from a CSV export of VMA's real registration
 * sheet ("VMA - BOT REGISTROS EMPRESARIALES") — Google Sheets → File →
 * Download → CSV, or export just the two needed columns.
 *
 * Usage: node scripts/import-users.mjs path/to/export.csv
 * Run from `web/` (same cwd the app itself uses for `data/app.db`).
 *
 * Reads only two columns, matched by header name (not position, so a
 * re-export with reordered/extra columns still works):
 *   - "Correo Electronico" (or any header containing "correo")
 *   - "Número Documento"   (or any header containing "documento")
 * Everything else in the sheet — ID photos, payment vouchers, signed
 * contracts, phone numbers — is never read. The site only ever needs
 * email + documento to validate the one-time account activation.
 *
 * Safe to re-run: upserts by email, so importing a fresher export just
 * updates existing rows instead of erroring or duplicating.
 */

import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Uso: node scripts/import-users.mjs archivo.csv");
  process.exit(1);
}

/** Minimal CSV parser — handles quoted fields with embedded commas/quotes
 * ("" as an escaped quote), which the sheet's URL/text columns need. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function findColumn(header, needle) {
  const idx = header.findIndex((h) =>
    h.toLowerCase().includes(needle),
  );
  if (idx === -1) {
    throw new Error(`No se encontró una columna que contenga "${needle}" en el encabezado.`);
  }
  return idx;
}

const raw = readFileSync(csvPath, "utf-8");
const rows = parseCsv(raw);
if (rows.length < 2) {
  console.error("El CSV no tiene filas de datos.");
  process.exit(1);
}

const [header, ...dataRows] = rows;
const emailCol = findColumn(header, "correo");
const documentoCol = findColumn(header, "documento");

// Last write wins — a re-submitted form (seen in the real sheet: the same
// person submitted twice) should end up as one row, reflecting whichever
// entry appears later in the export.
const users = new Map();
let skipped = 0;

for (const row of dataRows) {
  const email = (row[emailCol] ?? "").trim().toLowerCase();
  const documento = (row[documentoCol] ?? "").trim();
  if (!email || !documento) {
    skipped++;
    continue;
  }
  users.set(email, documento);
}

const dbPath = join(process.cwd(), "data", "app.db");
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS approved_users (
    email TEXT PRIMARY KEY,
    documento TEXT NOT NULL
  );
`);

const upsert = db.prepare(`
  INSERT INTO approved_users (email, documento) VALUES (?, ?)
  ON CONFLICT(email) DO UPDATE SET documento = excluded.documento
`);

db.exec("BEGIN");
for (const [email, documento] of users) {
  upsert.run(email, documento);
}
db.exec("COMMIT");
db.close();

console.log(`Filas leídas: ${dataRows.length}`);
console.log(`Omitidas (email o documento vacío): ${skipped}`);
console.log(`Usuarios aprobados cargados/actualizados: ${users.size}`);
