// Prüfen und Erzeugen von Werten: Benutzernamen, Klassencodes, Startpasswörter, Spielstände
import { randomInt } from 'node:crypto';
import { BENUTZERNAME } from './auth-optionen.mjs';

export const normName = (s: unknown) => String(s ?? '').trim().toLowerCase();
export const gueltigerName = (s: string) => BENUTZERNAME.test(s);
export const gueltigesPasswort = (s: unknown) => typeof s === 'string' && s.length >= 8 && s.length <= 128;
// wie im Spiel: Codename höchstens 24 Zeichen, Figuren a01 … a15
export const normCodename = (s: unknown) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24);
export const gueltigeFigur = (s: unknown) => typeof s === 'string' && /^a(0[1-9]|1[0-5])$/.test(s);

const WOERTER = ['FALKE', 'KABEL', 'PAKET', 'ROUTER', 'SWITCH', 'FRAME', 'PORT', 'LOTSE', 'RADAR', 'SIGNAL', 'ANKER', 'TANKER'];
const ZEICHEN = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // ohne 0/O, 1/I/L
export const klassencode = () => `${WOERTER[randomInt(WOERTER.length)]}-${Array.from({ length: 3 }, () => ZEICHEN[randomInt(ZEICHEN.length)]).join('')}`;

const PW = ['Kabel', 'Falke', 'Paket', 'Anker', 'Radar', 'Lotse', 'Signal', 'Router', 'Tanker', 'Frame', 'Hafen', 'Funke'];
export const startpasswort = () => `${PW[randomInt(PW.length)]}-${PW[randomInt(PW.length)]}-${randomInt(10, 100)}`;

// Spielstand aus dem Spiel: grobe Formprüfung (das Spiel ist nicht schummelsicher – hier geht es um kaputte oder fremde Daten)
export type Meta = { codename: string; avatar: string; punkte: number; front: string | null; fall: number };
export function pruefeSpielstand(body: unknown): { daten: Record<string, unknown>; meta: Meta } | null {
  if (!body || typeof body !== 'object') return null;
  const { daten, meta } = body as { daten?: Record<string, unknown>; meta?: Record<string, unknown> };
  if (!daten || typeof daten !== 'object' || Array.isArray(daten)) return null;
  const duo = daten.duo as Record<string, unknown> | undefined;
  if (typeof daten.id !== 'string' || !duo || typeof duo !== 'object' || typeof daten.items !== 'object' || typeof daten.steps !== 'object') return null;
  const m = meta || {};
  return {
    daten,
    meta: {
      codename: String(m.codename ?? duo.codename ?? '').slice(0, 24),
      avatar: /^a\d\d$/.test(String(m.avatar)) ? String(m.avatar) : 'a01',
      punkte: Math.max(0, Math.min(100000, Math.round(Number(m.punkte) || 0))),
      front: typeof m.front === 'string' ? m.front.slice(0, 60) : null,
      fall: Math.max(0, Math.min(1, Number(m.fall) || 0))
    }
  };
}
