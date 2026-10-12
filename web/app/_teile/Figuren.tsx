'use client';
// Zeigt Spielfiguren aus spiel/js/kit/avatars.js (dasselbe SVG wie im Spiel)
import { useEffect, useState } from 'react';

type Kit = { avatars: { svg: (id: string, opt?: { titel?: boolean; pose?: string }) => string; liste: { id: string; name: string }[] } };
let laden: Promise<Kit> | null = null;
export function kit(): Promise<Kit> {
  const w = window as unknown as { OSIKit?: Kit };
  if (w.OSIKit?.avatars) return Promise.resolve(w.OSIKit);
  return laden ??= new Promise(ok => {
    const s = document.createElement('script');
    s.src = '/spiel/js/kit/avatars.js';
    s.onload = () => ok((window as unknown as { OSIKit: Kit }).OSIKit);
    document.head.appendChild(s);
  });
}

export function Figur({ id, pose, className }: { id: string; pose?: string; className?: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => { kit().then(k => setSvg(k.avatars.svg(id, { titel: false, pose }))); }, [id, pose]);
  return <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Parade({ ids }: { ids: string[] }) {
  return (
    <div className="start-parade" aria-hidden="true" style={{ position: 'static', justifyContent: 'center', marginTop: 10 }}>
      {ids.map((id, i) => <Figur key={id} id={id} className="parade-figur" />)}
    </div>
  );
}

// Auswahl aus allen 15 Figuren (wie beim Spielstart). Lädt die Figuren erst, wenn sie angezeigt wird.
export function FigurWahl({ wert, onWahl }: { wert: string | null; onWahl: (id: string) => void }) {
  const [figuren, setFiguren] = useState<{ id: string; name: string; svg: string }[]>([]);
  useEffect(() => { kit().then(k => setFiguren(k.avatars.liste.map(a => ({ id: a.id, name: a.name, svg: k.avatars.svg(a.id, { titel: false }) })))); }, []);
  return (
    <div className="av-picker" role="radiogroup" aria-label="Figur wählen">
      {figuren.map(a => (
        <button key={a.id} type="button" role="radio" className="av-wahl" data-av={a.id} aria-checked={a.id === wert} title={a.name}
          onClick={() => onWahl(a.id)}><span dangerouslySetInnerHTML={{ __html: a.svg }} /><span>{a.name}</span></button>
      ))}
    </div>
  );
}
