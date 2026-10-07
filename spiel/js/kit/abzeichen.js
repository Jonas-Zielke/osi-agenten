/* OSI-Agenten – Abzeichen als selbst gezeichnetes SVG. Die Form zeigt die Art, die Farbe ist ein Design-Token:
     medaille – Einsatz abgeschlossen (in der Farbe des Einsatzes, mit Band)
     schild   – Einsatz ohne Tipp (Wappen mit goldenem Stern)
     sechseck – Training, Sortierer und Zeit-Challenge
     siegel   – geheime Abzeichen; noch nicht gefundene zeigen ein Fragezeichen
   form, farbe und motiv stehen je Abzeichen in OSI.abzeichen (meta.js). Ohne bekanntes Motiv wird das Emoji aus icon gezeigt.
   Reine Funktionen, viewBox 0 0 100 100. Motive sind um (0|0) gezeichnet und etwa 44 Einheiten groß. */
(function () {
  'use strict';
  const Kit = window.OSIKit = window.OSIKit || {};

  // Farben nur über Tokens (tokens.css). Hautfarben wie bei den Figuren (avatars.js).
  const INK = 'on-color', WS = 'on-strong';
  const HAUT = ['#efbf98', '#a86e45'];
  const c = t => t[0] === '#' ? t : `var(--${t})`;
  const f = (t, op) => `style="fill:${c(t)}${op != null ? `;opacity:${op}` : ''}"`;
  const s = (t, w, op) => `style="fill:none;stroke:${c(t)};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round${op != null ? `;opacity:${op}` : ''}"`;
  const K = 'style="fill:var(--k)"';

  const punkte = (n, ra, ri, cx, cy, start = -90) => Array.from({ length: n * 2 }, (_, i) => {
    const w = (start + i * 180 / n) * Math.PI / 180, r = i % 2 ? ri : ra;
    return `${(cx + r * Math.cos(w)).toFixed(2)},${(cy + r * Math.sin(w)).toFixed(2)}`;
  }).join(' ');
  const ecken = (n, r, cx, cy) => punkte(n / 2, r, r, cx, cy);
  const stern = (cx, cy, r, st) => `<polygon points="${punkte(5, r, r * .46, cx, cy)}" ${st}/>`;

  // Form mit 3D-Kante wie bei Knöpfen und Kartenstationen: dieselbe Form tiefer und dunkler darunter.
  // el(style) liefert das Element; rund > 0 rundet die Ecken über eine Kontur in derselben Farbe.
  const fuellung = (farbe, op, rund) => `style="fill:${farbe};opacity:${op}${rund ? `;stroke:${farbe};stroke-width:${rund};stroke-linejoin:round` : ''}"`;
  const mitKante = (el, rund = 0, dy = 5) => `<g transform="translate(0 ${dy})">${el(fuellung('var(--k)', 1, rund))}${el(fuellung(`var(--${INK})`, .28, rund))}</g>${el(fuellung('var(--k)', 1, rund))}`;
  const spiegel = el => el(f(INK, .1)) + el(s(WS, 1.8, .55));
  const glanz = d => `<path d="${d}" ${s(WS, 3, .6)}/>`;
  const platz = (motiv, x, y, g = 1) => `<g transform="translate(${x} ${y}) scale(${g})">${motiv}</g>`;

  // ---------- Formen
  const FORMEN = {
    medaille(m) {
      const band = (d, op) => `<path d="${d}" ${K}/><path d="${d}" ${f(INK, op)}/>`;
      return band('M37,50 L23,92 L31,87.5 L36,96 L51,57 Z', .38) + band('M63,50 L77,92 L69,87.5 L64,96 L49,57 Z', .22)
        + `<path d="M30,62 L26.5,73 M70,62 L73.5,73" ${s(WS, 2.4, .45)}/>`
        + mitKante(st => `<circle cx="50" cy="42" r="33" ${st}/>`)
        + spiegel(st => `<circle cx="50" cy="42" r="26" ${st}/>`)
        + glanz('M22.5,34 A29.5,29.5 0 0 1 38,15')
        + platz(m, 50, 42, .92);
    },
    schild(m) {
      const d = 'M50,11 C60,16 72,18 84,18 L84,47 C84,70 69,84 50,92 C31,84 16,70 16,47 L16,18 C28,18 40,16 50,11 Z';
      return mitKante(st => `<path d="${d}" ${st}/>`)
        + spiegel(st => `<path d="${d}" transform="translate(50 52) scale(.8) translate(-50 -52)" ${st}/>`)
        + glanz('M22,30 L22,46 C22,54 24,60 28,65')
        + platz(m, 50, 53, .86)
        + `<g transform="translate(0 2.5)">${stern(50, 14.5, 12.5, f('gold-edge'))}</g>${stern(50, 14.5, 12.5, f('gold'))}`;
    },
    sechseck(m) {
      return mitKante(st => `<polygon points="${ecken(6, 37, 50, 47)}" ${st}/>`, 10)
        + spiegel(st => `<polygon points="${ecken(6, 29, 50, 47)}" ${st}/>`)
        + glanz('M17,32 L17,50')
        + platz(m, 50, 47, .9);
    },
    siegel(m) {
      return mitKante(st => `<polygon points="${punkte(16, 41, 36, 50, 46)}" ${st}/>`, 3)
        + spiegel(st => `<circle cx="50" cy="46" r="28" ${st}/>`)
        + `<circle cx="50" cy="46" r="31.5" ${s(WS, 1.6, .35)} stroke-dasharray="2 3.2"/>`
        + platz(m, 50, 46, .92);
    }
  };

  // ---------- Motive (nach den bisherigen Emojis)
  const MOTIVE = {
    hut: () => `
      <path d="M-12,0 L-12,9 C-12,15.5 12,15.5 12,9 L12,0 Z" ${f(INK)}/>
      <path d="M-12,3.5 C-5,7 5,7 12,3.5" ${s(WS, 1.6, .25)}/>
      <path d="M0,-15 L23,-4.5 L0,6 L-23,-4.5 Z" ${f(INK)}/>
      <path d="M-18,-4.5 L0,-12.5 L18,-4.5" ${s(WS, 1.6, .3)}/>
      <circle cy="-4.5" r="2.6" ${f('gold')}/>
      <path d="M0,-4.5 L16,1 L16,11" ${s('gold', 2.4)}/>
      <path d="M13.2,10 L18.8,10 L20,19 L12,19 Z" ${f('gold')}/>`,

    taschenlampe: () => `<g transform="translate(-4 4) rotate(-38)">
      <path d="M10,-8.5 L27,-16 L27,16 L10,8.5 Z" ${f(WS, .55)}/>
      <path d="M10,-4 L27,-7 L27,7 L10,4 Z" ${f(WS, .5)}/>
      <rect x="-20" y="-5.5" width="21" height="11" rx="3.5" ${f(INK)}/>
      <path d="M0,-5.5 L9,-10 L9,10 L0,5.5 Z" ${f(INK)}/>
      <rect x="8" y="-10.5" width="3.4" height="21" rx="1.7" ${f('gold')}/>
      <rect x="-13" y="-8.2" width="6" height="4" rx="1.6" ${f('red')}/>
      <rect x="-18" y="-3.4" width="15" height="2.2" rx="1.1" ${f(WS, .3)}/></g>`,

    gehirn: () => `
      <rect x="-1" y="9" width="7" height="11" rx="3.5" ${f(WS)}/>
      <g ${f(WS)}><circle cx="-9" cy="-7" r="9"/><circle cx="2" cy="-11" r="9"/><circle cx="11" cy="-4.5" r="8.5"/>
        <circle cx="-12.5" cy="3.5" r="8"/><circle cx="12" cy="6" r="7.5"/><circle cx="0" cy="3" r="10"/></g>
      <path d="M1,-20 C-3,-11 4,-5 0,5 C-2,9 1,11 2,12" ${s(INK, 1.8, .3)}/>
      <path d="M-16,-4 C-12,-1 -10,-7 -6,-4 M-9,-14 C-8,-11 -11,-9 -9,-6 M7,-13 C9,-9 13,-11 15,-7 M8,-1 C11,1 13,-2 17,0
        M-16,8 C-12,6 -9,10 -5,8 M5,7 C8,11 11,7 15,9" ${s(INK, 1.8, .3)}/>`,

    eule: () => `
      <path d="M-15,-5 C-15,-13 -12,-18 -8,-20 L-4,-13 L4,-13 L8,-20 C12,-18 15,-13 15,-5 L15,8 C15,16 8,20 0,20 C-8,20 -15,16 -15,8 Z" ${f('papier-braun')}/>
      <ellipse cx="-13" cy="6" rx="4" ry="9" ${f(INK, .25)}/><ellipse cx="13" cy="6" rx="4" ry="9" ${f(INK, .25)}/>
      <ellipse cx="0" cy="10" rx="9" ry="8.5" ${f('papier-2')}/>
      <path d="M-5,7 l2.5,2.2 l2.5,-2.2 M0,7 l2.5,2.2 l2.5,-2.2 M-2.5,12 l2.5,2.2 l2.5,-2.2" ${s('papier-braun', 1.3, .7)}/>
      <circle cx="-6.5" cy="-5" r="7" ${f(WS)}/><circle cx="6.5" cy="-5" r="7" ${f(WS)}/>
      <circle cx="-6.5" cy="-5" r="7" ${s('gold', 1.6)}/><circle cx="6.5" cy="-5" r="7" ${s('gold', 1.6)}/>
      <circle cx="-5.5" cy="-4.5" r="3.5" ${f(INK)}/><circle cx="7.5" cy="-4.5" r="3.5" ${f(INK)}/>
      <circle cx="-4.3" cy="-5.9" r="1.2" ${f(WS)}/><circle cx="8.7" cy="-5.9" r="1.2" ${f(WS)}/>
      <path d="M-2.8,1 L2.8,1 L0,6 Z" ${f('gold')}/>
      <path d="M-5,20 v2.5 M-2,20 v2.5 M2,20 v2.5 M5,20 v2.5" ${s('gold', 1.8)}/>`,

    ausweis: () => `<g transform="rotate(-8)">
      <rect x="-21" y="-14" width="42" height="28" rx="4" ${f(WS)}/>
      <path d="M-21,-8 L-21,-10 A4,4 0 0 1 -17,-14 L17,-14 A4,4 0 0 1 21,-10 L21,-8 Z" ${f(INK)}/>
      <rect x="-17" y="-4.5" width="12" height="14.5" rx="2" ${f('papier-2')}/>
      <circle cx="-11" cy="0.5" r="3.2" ${f(INK, .8)}/><path d="M-16,10 C-16,4.5 -6,4.5 -6,10 Z" ${f(INK, .8)}/>
      <rect x="-2" y="-3.5" width="17" height="2.8" rx="1.4" ${f(INK, .55)}/>
      <rect x="-2" y="1.5" width="12" height="2.8" rx="1.4" ${f(INK, .3)}/>
      <rect x="-2" y="6.5" width="14" height="2.8" rx="1.4" ${f(INK, .3)}/></g>
      <circle cx="15" cy="12" r="7" ${f('green')}/><path d="M11.6,12 l2.4,2.4 l4.4,-4.8" ${s(WS, 2.4)}/>`,

    lupe: () => `
      <path d="M5,5 L17,17" ${s(INK, 7.5)}/>
      <path d="M11,11 L16.5,16.5" ${s('brand', 7.5)}/>
      <circle cx="-4" cy="-4" r="13.5" ${f(WS, .55)}/>
      <circle cx="-4" cy="-4" r="13.5" ${s(INK, 5)}/>
      <path d="M-12,-7 A8.5,8.5 0 0 1 -7,-12.2" ${s(WS, 2.8)}/>`,

    kompass: () => `
      <circle cy="-20.5" r="3.4" ${s(INK, 2.6)}/>
      <circle r="19" ${f(INK)}/><circle r="15" ${f(WS)}/>
      <path d="M0,-13 v3 M13,0 h-3 M0,13 v-3 M-13,0 h3" ${s(INK, 2, .5)}/>
      <g transform="rotate(35)"><path d="M0,-12.5 L4.2,0 L-4.2,0 Z" ${f('red')}/><path d="M0,12.5 L4.2,0 L-4.2,0 Z" ${f(INK, .75)}/></g>
      <circle r="2.4" ${f('gold')}/>`,

    karte: () => `
      <path d="M-21,-12 L-7,-16 L-7,13 L-21,17 Z" ${f('papier')}/>
      <path d="M-7,-16 L7,-12 L7,17 L-7,13 Z" ${f('papier-2')}/>
      <path d="M7,-12 L21,-16 L21,13 L7,17 Z" ${f('papier')}/>
      <path d="M-21,3 C-15,0 -11,6 -7,4 C-2,2 2,9 7,7 C12,5 16,10 21,8" ${s('blue', 2.6, .8)}/>
      <ellipse cx="-14" cy="-6" rx="4.5" ry="3.5" ${f('green', .8)}/><ellipse cx="0" cy="-8" rx="3.5" ry="2.8" ${f('green', .8)}/>
      <path d="M-15,11 C-11,4 -5,8 -1,2 C2,-3 7,-3 10,-5" ${s('red', 2)} stroke-dasharray="2.6 2.6"/>
      <path d="M13,1 C9,-4 8,-6.5 8,-8.5 A5,5 0 0 1 18,-8.5 C18,-6.5 17,-4 13,1 Z" ${f('red')}/><circle cx="13" cy="-8.5" r="1.9" ${f(WS)}/>`,

    tuer: () => `
      <rect x="-14" y="-20" width="28" height="40" rx="2.5" ${f(INK)}/>
      <rect x="-10.5" y="-16.5" width="21" height="36.5" ${f(WS, .92)}/>
      <path d="M-10.5,20 L10.5,20 L19,24 L4,24 Z" ${f(WS, .45)}/>
      <path d="M-10.5,-16.5 L4,-20 L4,24 L-10.5,20 Z" ${f('papier-braun')}/>
      <path d="M-7.5,-12.5 L1,-14.5 L1,-1.5 L-7.5,-1 Z M-7.5,3.5 L1,3.8 L1,18 L-7.5,16.5 Z" ${f(INK, .22)}/>
      <circle cx="1.8" cy="1.2" r="1.9" ${f('gold')}/>`,

    handschlag: () => {
      const finger = [[-5.8, -10.5], [-1.8, -12], [2.2, -11.5], [6, -9]];
      return `<g transform="scale(1.12)">
      <g transform="translate(-19 3) rotate(-18)"><rect x="-8" y="-7.5" width="13" height="15" rx="2.5" ${f('blue')}/><rect x="3" y="-8" width="4.5" height="16" rx="2" ${f(WS)}/></g>
      <g transform="translate(19 3) rotate(18)"><rect x="-5" y="-7.5" width="13" height="15" rx="2.5" ${f('brand')}/><rect x="-7.5" y="-8" width="4.5" height="16" rx="2" ${f(WS)}/></g>
      <path d="M-15,-4.5 C-9,-9.5 0,-9.5 7,-7 C9,-2 9,4 6,8.5 C-1,10.5 -9,10 -15,6 Z" ${f(HAUT[1])}/>
      <path d="M15,-5.5 C11,-9 6,-9.5 3,-8 L3,9.5 C8,10.5 12,9 15,6 Z" ${f(HAUT[0])}/>
      ${finger.map(([y, x]) => `<path d="M5,${y} L${x},${y + .8}" ${s(INK, 4.9, .22)}/><path d="M5,${y} L${x},${y + .8}" ${s(HAUT[0], 3.9)}/>`).join('')}
      <path d="M-13.5,-5 C-8,-9.5 -1,-11 5,-9" ${s(INK, 5, .15)}/><path d="M-13.5,-5 C-8,-9.5 -1,-11 5,-9" ${s(HAUT[1], 4)}/></g>`;
    },

    schloss: () => `
      <path d="M-7,-2 L-7,-11 C-7,-21.5 9,-21.5 9,-11 L9,-7.5" ${s(INK, 4.6, .75)}/>
      <rect x="-14" y="-1" width="28" height="21" rx="4.5" ${f('gold-edge')}/>
      <rect x="-14" y="-3" width="28" height="20" rx="4.5" ${f('gold')}/>
      <circle cy="4.5" r="3" ${f(INK)}/><path d="M-1.4,5.5 L1.4,5.5 L2.2,11.5 L-2.2,11.5 Z" ${f(INK)}/>
      <rect x="-11" y="0" width="3.5" height="13" rx="1.75" ${f(WS, .45)}/>`,

    schriftrolle: () => `
      <rect x="-13" y="-15" width="26" height="29" ${f('papier')}/>
      <rect x="-13" y="-12" width="26" height="2.5" ${f(INK, .1)}/>
      <path d="M-8,-6 h16 M-8,-1 h12 M-8,4 h15 M-8,9 h9" ${s(INK, 2, .45)}/>
      <rect x="-17" y="-20" width="34" height="8" rx="4" ${f('papier-2')}/>
      <rect x="-17" y="11" width="34" height="8" rx="4" ${f('papier-2')}/>
      <path d="M-14,-17.5 h28 M-14,13.5 h28" ${s(WS, 1.4, .6)}/>
      <circle cx="-17" cy="-16" r="3" ${f('papier-braun')}/><circle cx="17" cy="-16" r="3" ${f('papier-braun')}/>
      <circle cx="-17" cy="15" r="3" ${f('papier-braun')}/><circle cx="17" cy="15" r="3" ${f('papier-braun')}/>
      <circle cx="9.5" cy="7.5" r="4.2" ${f('red')}/><circle cx="9.5" cy="7.5" r="2" ${f('red-edge')}/>`,

    waage: () => `
      <path d="M-11,19 L11,19 L7,14 L-7,14 Z" ${f(INK)}/>
      <rect x="-1.8" y="-14" width="3.6" height="29" ${f(INK)}/>
      <rect x="-19" y="-12.5" width="38" height="3.6" rx="1.8" ${f(INK)}/>
      <circle cy="-15.5" r="3.4" ${f(WS)}/><circle cy="-15.5" r="3.4" ${s(INK, 1.6)}/>
      <path d="M-16,-9 L-22,4 M-16,-9 L-10,4 M16,-9 L10,4 M16,-9 L22,4" ${s(INK, 1.4)}/>
      <path d="M-24,3.5 L-8,3.5 C-8.5,9.5 -23.5,9.5 -24,3.5 Z" ${f(WS)}/>
      <path d="M8,3.5 L24,3.5 C23.5,9.5 8.5,9.5 8,3.5 Z" ${f(WS)}/>
      <path d="M-24,3.5 L-8,3.5 M8,3.5 L24,3.5" ${s(INK, 1.6)}/>`,

    gericht: () => `
      <path d="M0,-20 L23,-8 L-23,-8 Z" ${f(INK)}/>
      <circle cy="-12.5" r="2.4" ${f('gold')}/>
      <rect x="-20" y="-7" width="40" height="3.5" ${f(WS)}/>
      <g ${f(WS)}><rect x="-17" y="-2" width="5.5" height="16" rx="1"/><rect x="-7.5" y="-2" width="5.5" height="16" rx="1"/>
        <rect x="2" y="-2" width="5.5" height="16" rx="1"/><rect x="11.5" y="-2" width="5.5" height="16" rx="1"/></g>
      <path d="M-14.2,0 v12 M-4.7,0 v12 M4.8,0 v12 M14.3,0 v12" ${s(INK, 1.2, .25)}/>
      <rect x="-21" y="14" width="42" height="3" ${f(INK)}/><rect x="-24" y="17" width="48" height="3.5" rx="1" ${f(INK)}/>`,

    detektiv: () => `
      <path d="M-19,21 C-19,9 -11,5 0,5 C11,5 19,9 19,21 Z" ${f('papier-2')}/>
      <path d="M-9,5 L0,16 L9,5 L4.5,4 L0,9.5 L-4.5,4 Z" ${f('papier-braun')}/>
      <path d="M0,16 L0,21" ${s('papier-braun', 1.6)}/>
      <circle cy="-3" r="8.5" ${f(HAUT[0])}/>
      <rect x="-7.5" y="-5" width="6.2" height="3.8" rx="1.6" ${f(INK)}/><rect x="1.3" y="-5" width="6.2" height="3.8" rx="1.6" ${f(INK)}/>
      <path d="M-1.5,-3.6 h3" ${s(INK, 1.2)}/>
      <ellipse cy="-9.5" rx="15.5" ry="3.6" ${f(INK)}/>
      <path d="M-9,-9.5 C-9.5,-19.5 -4,-20.5 0,-17.5 C4,-20.5 9.5,-19.5 9,-9.5 Z" ${f(INK)}/>
      <rect x="-9" y="-12.8" width="18" height="2.8" ${f('brand')}/>`,

    zielscheibe: () => `
      <circle r="19" ${f(WS)}/><circle r="14.5" ${f('red')}/><circle r="10" ${f(WS)}/><circle r="5.5" ${f('red')}/>
      <path d="M0,0 L16,-16" ${s(INK, 2.6)}/>
      <path d="M14.5,-14.5 L14,-22 L18.5,-18.5 Z" ${f('gold')}/><path d="M14.5,-14.5 L22,-14 L18.5,-18.5 Z" ${f('gold-edge')}/>
      <circle r="1.8" ${f(INK)}/>`,

    hantel: () => `
      <rect x="-22" y="-9.8" width="44" height="3.6" rx="1.8" ${f(INK)}/>
      <rect x="-18" y="-18" width="6" height="20" rx="2.4" ${f(INK)}/><rect x="12" y="-18" width="6" height="20" rx="2.4" ${f(INK)}/>
      <rect x="-12" y="-15" width="4.4" height="14" rx="2" ${f(INK, .8)}/><rect x="7.6" y="-15" width="4.4" height="14" rx="2" ${f(INK, .8)}/>
      <rect x="-16.8" y="-16" width="1.6" height="9" rx=".8" ${f(WS, .35)}/><rect x="13.2" y="-16" width="1.6" height="9" rx=".8" ${f(WS, .35)}/>
      ${[-19, -9.5, 0, 9.5, 19].map(x => stern(x, 13.3, 4.6, f('gold-edge')) + stern(x, 12, 4.6, f('gold'))).join('')}`,

    blitz: () => `
      <path d="M-20,-6 h8 M-22,1 h7 M-19,8 h6" ${s(WS, 2.6, .75)}/>
      <path d="M7,-21 L-9,3 L1,3 L-3,21 L14,-5 L4,-5 Z" transform="translate(1.5 2)" ${f('gold-edge')}/>
      <path d="M7,-21 L-9,3 L1,3 L-3,21 L14,-5 L4,-5 Z" ${f('gold')}/>
      <path d="M5,-15 L-4,-1" ${s(WS, 1.8, .6)}/>`,

    rakete: () => `
      <path d="M-21,4 h6 M-17,11 h7 M-11,17 h5" ${s(WS, 2.4, .7)}/>
      <g transform="translate(3 -3) rotate(45) scale(1.15)">
        <path d="M-4.5,11 L0,22 L4.5,11 Z" ${f('brand')}/><path d="M-2.2,11 L0,17 L2.2,11 Z" ${f('gold')}/>
        <path d="M-6,2 L-12.5,13 L-5,11 Z" ${f('red')}/><path d="M6,2 L12.5,13 L5,11 Z" ${f('red')}/>
        <path d="M0,-21 C9,-13 9,3 6,11 L-6,11 C-9,3 -9,-13 0,-21 Z" ${f(WS)}/>
        <path d="M0,-21 C4.5,-17 6.8,-13 7.6,-9 L-7.6,-9 C-6.8,-13 -4.5,-17 0,-21 Z" ${f('red')}/>
        <path d="M-6,11 L6,11" ${s(INK, 1.4, .25)}/>
        <circle cy="-1" r="4.2" ${f('blue')}/><circle cy="-1" r="4.2" ${s(INK, 1.8)}/></g>`,

    kaffee: () => `
      <path d="M-6,-10 C-9,-13 -3,-15 -6,-19 M0,-10 C-3,-13 3,-15 0,-19 M6,-10 C3,-13 9,-15 6,-19" ${s(WS, 2.4, .85)}/>
      <ellipse cy="16.5" rx="18.5" ry="4" ${f(INK, .25)}/><ellipse cy="15" rx="18.5" ry="4" ${f(WS)}/>
      <path d="M10,-1 C19.5,-2 19.5,10.5 9,9.5" ${s(WS, 3.8)}/>
      <path d="M-13,-5 L13,-5 L11,10 C10,14 -10,14 -11,10 Z" ${f(WS)}/>
      <path d="M-10.5,0 C-10,6 -9,9 -7,10.5" ${s(INK, 1.4, .15)}/>
      <ellipse cy="-5" rx="13" ry="3" ${f('papier-braun')}/>`,

    pizza: () => `<g transform="rotate(-10)">
      <path d="M0,21 L-17,-11 C-6,-16 6,-16 17,-11 Z" ${f('gold')}/>
      <path d="M-9,4.5 C-9,8 -7,8 -7,5.5" ${s('gold', 2.6)}/>
      <path d="M-17,-11 C-6,-16 6,-16 17,-11 L18.5,-14.5 C6,-20.5 -6,-20.5 -18.5,-14.5 Z" ${f('brand-edge')}/>
      <circle cx="-5" cy="-5.5" r="3.5" ${f('red')}/><circle cx="6" cy="-3.5" r="3.5" ${f('red')}/><circle cx="0" cy="7" r="3" ${f('red')}/>
      <circle cx="-6" cy="-6.5" r="1" ${f(WS, .5)}/><circle cx="5" cy="-4.5" r="1" ${f(WS, .5)}/></g>`,

    matrix: () => {
      // Zeichenregen: je Spalte x, Zeile des hellen Kopfes und Länge der Spur darüber
      const spalten = [[-16, 3, 3], [-11.5, 5, 5], [-7, 2, 3], [-2.5, 4, 5], [2, 1, 2], [6.5, 5, 3], [11, 3, 4], [15.5, 4, 2]];
      return `
      <rect x="-21" y="-17" width="42" height="30" rx="4" ${f(INK)}/>
      <rect x="-5" y="13" width="10" height="4" ${f(INK, .85)}/><rect x="-11" y="16.5" width="22" height="3.5" rx="1.75" ${f(INK)}/>
      ${spalten.map(([x, kopf, n]) => Array.from({ length: n }, (_, i) => {
        const zeile = kopf - n + 1 + i;
        if (zeile < 0) return '';
        return `<rect x="${x - 1.1}" y="${-14 + zeile * 4.4}" width="2.2" height="3.2" rx=".5" ${i === n - 1 ? f(WS, .95) : f('green', .3 + .6 * (i + 1) / n)}/>`;
      }).join('')).join('')}`;
    },

    frage: () => `<path d="M-7.5,-8 C-7.5,-17 7.5,-17 7.5,-8 C7.5,-2 0,-1.5 0,5" ${s(INK, 5.5, .5)}/><circle cy="13" r="3.5" ${f(INK, .5)}/>`
  };

  const esc = t => Kit.util.esc(t);
  const emoji = icon => `<text y="1" font-size="30" text-anchor="middle" dominant-baseline="central">${esc(icon || '🏅')}</text>`;

  // b: Abzeichen aus OSI.abzeichen oder seine id. opt.geheim: noch nicht gefundenes geheimes Abzeichen (nur ein Fragezeichen).
  function svg(b, opt = {}) {
    if (typeof b === 'string') b = ((window.OSI && window.OSI.abzeichen) || []).find(x => x.id === b) || { id: b };
    const geheim = !!opt.geheim;
    const form = geheim ? 'siegel' : FORMEN[b.form] ? b.form : 'medaille';
    const farbe = geheim ? 'subtle' : b.farbe || 'gold';
    const motiv = geheim ? MOTIVE.frage() : MOTIVE[b.motiv] ? MOTIVE[b.motiv]() : emoji(b.icon);
    return `<svg class="abz ${opt.klasse || ''}" viewBox="0 0 100 100" style="--k:var(--${farbe})" aria-hidden="true" focusable="false" data-abz="${esc(geheim ? '' : b.id)}">${FORMEN[form](motiv)}</svg>`;
  }

  Kit.abzeichen = { svg, formen: Object.keys(FORMEN), motive: Object.keys(MOTIVE).filter(m => m !== 'frage') };
})();
