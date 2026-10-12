// Admin: Spielstand eines Kontos holen (zum Herunterladen), ersetzen (hochgeladene Datei) oder zurücksetzen.
// Ersetzen und Zurücksetzen melden die Person ab, damit ein offenes Spiel den alten Stand nicht zurückschreibt.
import { abfrage } from '@/lib/db';
import { adminOderFehler, fehler } from '@/lib/rechte';
import { kontoLaden, spielstandErsetzen, spielstandZuruecksetzen } from '@/lib/verwaltung';
import { pruefeSpielstand } from '@/lib/werte';

type Ctx = { params: Promise<{ id: string }> };
const MAX_BYTES = 512 * 1024;

export async function GET(_req: Request, { params }: Ctx) {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const k = await kontoLaden((await params).id);
  if (!k) return fehler(404, 'Konto nicht gefunden.');
  const [s] = await abfrage<{ daten: unknown; aktualisiert: Date }>('select daten, aktualisiert from spielstand where user_id = $1', [k.id]);
  if (!s) return fehler(404, 'Noch kein Spielstand.');
  return Response.json({ benutzername: k.username, aktualisiert: s.aktualisiert, daten: s.daten });
}

export async function PUT(req: Request, { params }: Ctx) {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const k = await kontoLaden((await params).id);
  if (!k) return fehler(404, 'Konto nicht gefunden.');
  const text = await req.text();
  if (text.length > MAX_BYTES) return fehler(413, 'Spielstand ist zu groß.');
  let roh: unknown;
  try { roh = JSON.parse(text); } catch { return fehler(400, 'Kein gültiges JSON.'); }
  const p = pruefeSpielstand(roh);
  if (!p) return fehler(400, 'Das sieht nicht wie ein Spielstand aus.');
  await spielstandErsetzen(k.id, k.username, p.daten, p.meta, b.sitzung);
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const k = await kontoLaden((await params).id);
  if (!k) return fehler(404, 'Konto nicht gefunden.');
  await spielstandZuruecksetzen(k.id, b.sitzung);
  return Response.json({ ok: true });
}
