// Prüft echte Spielstand-Dateien gegen die AKTUELLE Spielversion:
// Lassen sie sich laden? Zeigen alle gespeicherten Schritt-/Aufgaben-IDs noch auf vorhandene Inhalte?
// Aufruf: node spielstaende-pruefen.js [ordner]   (Standard: ../test)
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./lib');

global.window = {};
require(path.join(ROOT, 'spiel/content/inhalte.js')).forEach(d => require(path.join(ROOT, 'spiel/content', d)));
require(path.join(ROOT, 'spiel/js/kit/storage.js'));
const OSI = window.OSI, S = window.OSIStore;
global.btoa = s => Buffer.from(s, 'binary').toString('base64');
global.atob = s => Buffer.from(s, 'base64').toString('binary');

const ordner = path.resolve(process.argv[2] || path.join(ROOT, 'test'));
if (!fs.existsSync(ordner)) { console.log(`Ordner ${ordner} gibt es nicht – nichts zu prüfen.`); process.exit(0); }
const steps = new Set([...OSI.einsaetze.flatMap(e => e.steps.map(s => s.id)), ...(OSI.ausgemustert || [])]);
const items = new Set([...S.alleItems(OSI).map(i => i.id), ...(OSI.ausgemustert || [])]);
let probleme = 0, n = 0;
for (const f of fs.readdirSync(ordner).filter(f => f.endsWith('.osiagent'))) {
  n++;
  const r = S.decode(fs.readFileSync(path.join(ordner, f), 'utf8'));
  if (!r.ok) { console.log(`❌ ${f}: ${r.fehler}`); probleme++; continue; }
  const s = r.save;
  const tote = [...Object.keys(s.steps).filter(id => !steps.has(id)), ...Object.keys(s.items).filter(id => !items.has(id))];
  const pos = s.pos && !steps.has(s.pos.s) ? ` · Position ${s.pos.s} existiert nicht mehr (Spiel springt zum ersten offenen Schritt)` : '';
  if (tote.length) { console.log(`⚠ ${f}: ${tote.length} verwaiste ID(s): ${tote.join(', ')}${pos}`); probleme++; }
  else console.log(`✅ ${f}: Duo ${s.duo.codename}, v${s.version}, ${Object.values(s.items).filter(i => i.ok).length} Aufgaben gelöst${pos}`);
}
console.log(n ? `${n} Datei(en) geprüft.` : 'Keine .osiagent-Dateien gefunden.');
process.exit(probleme ? 1 : 0);
