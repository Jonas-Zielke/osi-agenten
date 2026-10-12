// Admin: ein Konto ändern (Benutzername, Codename, Figur, Rolle, Klasse) oder löschen
import { abfrage } from '@/lib/db';
import { adminOderFehler, fehler, gueltigeId } from '@/lib/rechte';
import { kontoLaden, kontoLoeschen, letzterAdmin, LETZTER_ADMIN, profilPruefen, profilSchreiben, transaktion } from '@/lib/verwaltung';
import { ZUGAENGE, zugangVon } from '@/lib/zugang';

type Ctx = { params: Promise<{ id: string }> };
type Aenderung = { benutzername?: string; codename?: string; avatar?: string; rolle?: string; klasse?: string | null };

export async function PATCH(req: Request, { params }: Ctx) {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const k = await kontoLaden((await params).id);
  if (!k) return fehler(404, 'Konto nicht gefunden.');
  const d = ((await req.json().catch(() => null)) || {}) as Aenderung;

  // Prüfen, bevor irgendetwas geschrieben wird
  const p = await profilPruefen(d, k);
  if (p instanceof Response) return p;
  let zugang = null;
  if (d.rolle != null && d.rolle !== zugangVon(k.rolle, k.status)) {
    zugang = ZUGAENGE.find(x => x.id === d.rolle);
    if (!zugang) return fehler(400, 'Unbekannte Rolle.');
    if (k.rolle === 'admin' && zugang.rolle !== 'admin' && await letzterAdmin(k.id)) return fehler(409, LETZTER_ADMIN);
    if (zugang.rolle === 'lernend') {
      const [n] = await abfrage<{ n: number }>('select count(*)::int as n from klasse where lehrkraft_id = $1', [k.id]);
      if (n.n) return fehler(409, `Zu dieser Person gehören noch ${n.n} Klasse(n). Gebt sie erst einer anderen Lehrkraft oder löscht sie.`);
    }
  }
  // klasse: Klassen-ID, oder null/'' für „keine Klasse“
  let klasse: string | null | undefined;
  if (d.klasse !== undefined && (d.klasse || null) !== k.klasse_id) {
    klasse = d.klasse || null;
    if (klasse && !(gueltigeId(klasse) && (await abfrage('select 1 from klasse where id = $1', [klasse])).length)) return fehler(404, 'Klasse nicht gefunden.');
  }

  const f = await transaktion(async c => {
    await profilSchreiben(c, k.id, p);
    if (zugang) await c.query('update "user" set rolle = $2, "lehrkraftStatus" = $3, "updatedAt" = now() where id = $1', [k.id, zugang.rolle, zugang.status]);
    if (klasse === null) await c.query('delete from mitgliedschaft where user_id = $1', [k.id]);
    else if (klasse) await c.query(
      `insert into mitgliedschaft (user_id, klasse_id) values ($1, $2)
       on conflict (user_id) do update set klasse_id = excluded.klasse_id, beigetreten = now()`, [k.id, klasse]);
  });
  if (f) return f;
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const k = await kontoLaden((await params).id);
  if (!k) return fehler(404, 'Konto nicht gefunden.');
  if (k.rolle === 'admin' && await letzterAdmin(k.id)) return fehler(409, LETZTER_ADMIN);
  await kontoLoeschen(k.id); // mit Spielstand, Mitgliedschaft, Sitzungen und – bei Lehrkräften – den eigenen Klassen
  return Response.json({ ok: true, selbst: k.id === b.id });
}
