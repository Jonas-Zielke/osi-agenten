// Admin: jede Klasse ändern (Name, Registrierung offen/gesperrt, zuständige Lehrkraft, neuer Klassencode) oder löschen.
// ?konten=loeschen löscht beim Löschen auch die Konten der Lernenden darin (z. B. am Schuljahresende).
import { abfrage, pool } from '@/lib/db';
import { adminOderFehler, fehler, gueltigeId, type Klasse } from '@/lib/rechte';
import { kontoLoeschen, neuerKlassencode } from '@/lib/verwaltung';

type Ctx = { params: Promise<{ id: string }> };

async function klasse(id: string) {
  if (!gueltigeId(id)) return null;
  const [k] = await abfrage<Klasse>('select id, name, code, aktiv, lehrkraft_id from klasse where id = $1', [id]);
  return k ?? null;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const k = await klasse((await params).id);
  if (!k) return fehler(404, 'Klasse nicht gefunden.');
  const d = ((await req.json().catch(() => null)) || {}) as { name?: string; aktiv?: boolean; lehrkraft?: string; neuerCode?: boolean };
  const name = d.name != null ? String(d.name).trim().slice(0, 60) || k.name : k.name;
  const aktiv = typeof d.aktiv === 'boolean' ? d.aktiv : k.aktiv;
  let lehrkraft = k.lehrkraft_id;
  if (d.lehrkraft != null && d.lehrkraft !== k.lehrkraft_id) {
    const [lk] = await abfrage<{ id: string }>(`select id from "user" where id = $1 and rolle in ('lehrkraft', 'admin')`, [String(d.lehrkraft)]);
    if (!lk) return fehler(404, 'Lehrkraft nicht gefunden.');
    lehrkraft = lk.id;
  }
  await pool.query('update klasse set name = $2, aktiv = $3, lehrkraft_id = $4 where id = $1', [k.id, name, aktiv, lehrkraft]);
  if (d.neuerCode) {
    const code = await neuerKlassencode(k.id);
    if (code instanceof Response) return code;
    return Response.json({ ok: true, code });
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const k = await klasse((await params).id);
  if (!k) return fehler(404, 'Klasse nicht gefunden.');
  let geloescht = 0;
  if (new URL(req.url).searchParams.get('konten') === 'loeschen') {
    // nur Lernende – Lehrkräfte und Admins in der Klasse behalten ihr Konto
    const konten = await abfrage<{ id: string }>(
      `select u.id from mitgliedschaft m join "user" u on u.id = m.user_id where m.klasse_id = $1 and u.rolle = 'lernend'`, [k.id]);
    for (const u of konten) await kontoLoeschen(u.id);
    geloescht = konten.length;
  }
  await pool.query('delete from klasse where id = $1', [k.id]); // übrige Mitgliedschaften fallen mit weg
  return Response.json({ ok: true, geloescht });
}
