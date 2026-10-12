// Rolle samt Freischaltung als EIN Wert – so zeigt und ändert der Admin sie. Ohne Server-Importe, auch im Browser nutzbar.
export type Rolle = 'lernend' | 'lehrkraft' | 'admin';
export type Zugang = 'lernend' | 'beantragt' | 'lehrkraft' | 'admin';

export const ZUGAENGE: { id: Zugang; name: string; rolle: Rolle; status: string | null }[] = [
  { id: 'lernend', name: 'Lernende', rolle: 'lernend', status: null },
  { id: 'beantragt', name: 'Lehrkraft (wartet auf Freischaltung)', rolle: 'lehrkraft', status: 'beantragt' },
  { id: 'lehrkraft', name: 'Lehrkraft', rolle: 'lehrkraft', status: 'frei' },
  { id: 'admin', name: 'Admin', rolle: 'admin', status: 'frei' }
];

export const zugangVon = (rolle: string, status: string | null): Zugang =>
  rolle === 'admin' ? 'admin' : rolle === 'lehrkraft' ? (status === 'frei' ? 'lehrkraft' : 'beantragt') : 'lernend';
export const zugangName = (z: Zugang) => ZUGAENGE.find(x => x.id === z)!.name;
