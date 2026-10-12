// Rahmen aller Admin-Seiten: Zugangsprüfung, Kopfleiste und Reiter
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { benutzer, istAdmin, type Benutzer } from '@/lib/rechte';
import { zugangName, zugangVon } from '@/lib/zugang';
import { Kopf } from '../_teile/Kopf';
import { Fuss } from '../_teile/Fuss';

// Jede Admin-Seite prüft selbst (nicht nur ein Layout), bevor sie Daten liest
export async function adminSeite(pfad: string): Promise<Benutzer> {
  const b = await benutzer();
  if (!b) redirect(`/anmelden?weiter=${encodeURIComponent(pfad)}`);
  if (!istAdmin(b)) redirect('/');
  return b;
}

const REITER = [
  { href: '/admin', ic: '📊', name: 'Übersicht' },
  { href: '/admin/konten', ic: '👥', name: 'Konten' },
  { href: '/admin/klassen', ic: '🏫', name: 'Klassen' },
  { href: '/admin/spielstaende', ic: '💾', name: 'Spielstände' }
];

export function AdminRahmen({ aktiv, children }: { aktiv: string; children: React.ReactNode }) {
  return (
    <>
      <Kopf />
      <main className="seite breit">
        <h2>🛡️ Admin</h2>
        <nav className="admin-nav" aria-label="Admin-Bereich">
          {REITER.map(r => (
            <Link key={r.href} href={r.href} className={`hub-tab ${r.href === aktiv ? 'on' : ''}`} aria-current={r.href === aktiv ? 'page' : undefined}>
              <span className="hub-tab-ic" aria-hidden="true">{r.ic}</span>{r.name}
            </Link>
          ))}
        </nav>
        {children}
        <Fuss />
      </main>
    </>
  );
}

export function RolleChip({ rolle, status }: { rolle: string; status: string | null }) {
  const z = zugangVon(rolle, status);
  return <span className={`chip-rolle ${z}`}>{zugangName(z)}</span>;
}

export const datum = (d: Date | string | null) => (d ? new Date(d).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : '–');
export const prozent = (x: number | null) => `${Math.round((x ?? 0) * 100)} %`;
