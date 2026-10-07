/* OSI-Agenten – Einsatzzentrale (Lehrkraft): lädt .osiagent-Dateien und wertet sie aus.
   Reiter: Karte (alle Figuren auf der Kletterkarte), Beamer, Duos, Aufgaben-Analyse, Abschlussverhör, CSV.
   Es wird nichts gespeichert – alles lebt nur in dieser geöffneten Seite. */
(function () {
  'use strict';
  const S = window.OSIStore, OSI = window.OSI, Kit = window.OSIKit;
  const P = Kit.progress, AV = Kit.avatars, MAP = Kit.map;
  const { esc, strip, pct, $, $$, datumZeit, csvSpeichern } = Kit.util;
  const duos = new Map();
  let tab = 'karte';

  // ---------------------------------------------------------------- Aufgaben-Katalog aus dem Spielinhalt
  const katalog = [];
  OSI.einsaetze.forEach(e => e.steps.forEach(st => {
    const base = { einsatz: e, step: st, bonus: !!st.bonus };
    (st.fragen || []).forEach(q => katalog.push(Object.assign({}, base, {
      id: q.id, titel: strip(q.ticket || q.frage),
      dekodiere: v => q.layer ? 'L' + v : q.pick ? 'Klick: ' + v : q.meldung ? 'Frame ' + v : q.eingabe ? '„' + v + '“' : q.multi ? String(v).split('+').map(i => strip(q.optionen[i])).join(' + ') : strip((q.optionen || [])[v] || v)
    })));
    (st.items || []).forEach(it => katalog.push(Object.assign({}, base, { id: it.id, titel: st.titel + ': ' + it.text, dekodiere: v => { const b = (st.bins || []).find(b => String(b.id) === String(v)); return b ? (b.kurz || b.label) : v; } })));
    (st.aufgaben || []).forEach(a => katalog.push(Object.assign({}, base, { id: a.id, titel: st.titel + ': ' + strip(a.text), dekodiere: v => a.werte && a.werte[v] != null ? strip(String(a.werte[v])) : String(v) })));
    (st.phasen || []).forEach(ph => katalog.push(Object.assign({}, base, { id: ph.id, titel: st.titel + ': ' + strip(ph.titel), dekodiere: v => { const o = ph.optionen.find(o => o.key === v); return o ? strip(o.label) + ' (zu früh)' : v; } })));
  }));

  // ---------------------------------------------------------------- Kennzahlen je Duo
  function kennzahlen(s) {
    const items = Object.values(s.items || {});
    const geloest = items.filter(it => it.ok);
    const punkte = P.punkte(s);
    const erst = geloest.filter(it => it.f === 0).length;
    const tipps = items.reduce((a, it) => a + (it.h || 0), 0);
    const woche = Date.now() - 7 * 864e5;
    const sprung = geloest.filter(it => it.t && Date.parse(it.t) >= woche).reduce((a, it) => a + (it.p || 0), 0);
    const front = P.front(s);
    let pos = 'alles Verfügbare erledigt';
    const gemerkt = s.pos && P.einsatz(s.pos.e) && P.einsatz(s.pos.e).steps.find(x => x.id === s.pos.s);
    if (gemerkt) pos = `${P.einsatz(s.pos.e).nrText}: ${gemerkt.titel || gemerkt.id}`;
    else if (front) pos = `${front.e.nrText}: ${front.st.titel || front.st.id}`;
    const ueb = Object.values(s.uebung || {});
    return {
      punkte, rang: P.rang(punkte).r.name, geloest: geloest.length, erstQuote: geloest.length ? erst / geloest.length : 0,
      tipps, tippsProAufgabe: geloest.length ? tipps / geloest.length : 0, sprung,
      proEinsatz: OSI.einsaetze.map(e => P.einsatzFortschritt(s, e)), fall: P.fallFortschritt(s), front, pos,
      geuebt: ueb.filter(u => u.runs > 0).length, gemeistert: ueb.filter(u => u.gemeistert).length,
      challenge: (s.challenge || {}).best || 0, zuletzt: s.aktualisiert
    };
  }

  // ---------------------------------------------------------------- Laden
  async function laden(files) {
    const log = [];
    for (const f of files) {
      const r = await S.readFile(f);
      if (!r.ok) { log.push(`<span class="bad">✘ ${esc(f.name)}: ${esc(r.fehler)}</span>`); continue; }
      const s = r.save, alt = duos.get(s.id);
      if (!alt || Date.parse(s.aktualisiert) > Date.parse(alt.save.aktualisiert)) duos.set(s.id, { save: s, datei: f.name, k: kennzahlen(s) });
      log.push(`✔ ${esc(f.name)} → Duo <b>${esc(s.duo.codename)}</b>${alt ? ' (Duplikat erkannt, neuester Stand zählt)' : ''}`);
    }
    $('#filelist').innerHTML = log.join('<br>');
    $('#drop').classList.toggle('kompakt', duos.size > 0);
    render(true);
  }

  // Online (Live-Einsatzzentrale): Spielstände kommen vom Server statt aus Dateien. Neu gezeichnet wird nur bei Änderungen.
  let onlineStempel = '';
  function uebernehmen(liste, quelle) {
    const stempel = liste.map(x => x.id + x.aktualisiert).join('|');
    if (stempel === onlineStempel) return false;
    const erstes = !onlineStempel;
    onlineStempel = stempel;
    duos.clear();
    liste.forEach(x => { const s = S.migrate(x); duos.set(s.id, { save: s, datei: quelle || 'online', k: kennzahlen(s) }); });
    $('#drop').classList.toggle('kompakt', duos.size > 0);
    render(erstes);
    return true;
  }

  // ---------------------------------------------------------------- Ansichten
  function render(neuGeladen) {
    $('#cnt').textContent = duos.size ? `${duos.size} Duo${duos.size === 1 ? '' : 's'} geladen` : '';
    $$('.tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const L = [...duos.values()];
    if (!L.length) { $('#view').innerHTML = '<div class="card leer"><div class="leer-figuren">' + ['a03', 'a09', 'a13'].map(id => AV.svg(id)).join('') + '</div><p class="muted">Noch keine Spielstände geladen.</p></div>'; return; }
    ({ karte, beamer, duos: duoTabelle, aufgaben, verhoer })[tab](L, neuGeladen);
  }

  // ---------- Karte: alle Duos als Figuren mit Namensschild
  function karte(L, neuGeladen) {
    const fall = L.reduce((a, d) => a + d.k.fall, 0) / L.length;
    const top = L.slice().sort((a, b) => b.k.punkte - a.k.punkte).slice(0, 3);
    $('#view').innerHTML = `<div class="zk-kopf">
        <div class="card zk-fall"><div class="eyebrow">Operation Lohnzettel · gemeinsam aufgeklärt</div>
          <div class="zk-fall-zeile"><div class="fortschritt"><i style="width:${Math.round(fall * 100)}%"></i></div><b>${pct(fall)}</b></div></div>
        <div class="card zk-top">${top.map((d, i) => `<div class="zk-top-duo"><span class="zk-platz">${['🥇', '🥈', '🥉'][i]}</span>${AV.svg(d.save.duo.avatar, { titel: false })}<div><b>${esc(d.save.duo.codename)}</b><small>${d.k.punkte} XP</small></div></div>`).join('')}</div>
      </div>
      <div class="card zk-karte-card">
        <div class="zk-karte-leiste">
          <div class="zk-ansicht" role="tablist">
            <button data-ansicht="welt" class="${ansicht === 'welt' ? 'on' : ''}">🌍 Weltkarte</button>
            <select id="zk-einsatz" class="${ansicht.startsWith('e:') ? 'on' : ''}" aria-label="Einsatz-Pfad zeigen"><option value="">🗺️ Einsatz …</option>${P.sichtbar(false).map(e => `<option value="${e.id}" ${ansicht === 'e:' + e.id ? 'selected' : ''}>${esc(e.icon + ' ' + e.nrText + ' · ' + e.titel)}</option>`).join('')}</select>
            <button data-ansicht="alle" class="${ansicht === 'alle' ? 'on' : ''}">🏔️ Alle Schritte</button>
          </div>
          <span class="spacer"></span>
          <button class="btn sec klein" id="zk-lauf">▶ Nochmal hochlaufen</button><button class="btn sec klein" id="zk-voll">⛶ Vollbild</button></div>
        <div class="small muted" id="zk-info"></div>
        <div class="zk-karte" id="zk-karte"><div id="zk-map"></div></div>
        <div id="zk-mehr" class="small"></div></div>`;
    $$('[data-ansicht]').forEach(b => b.onclick = () => { ansicht = b.dataset.ansicht; karte(L, true); });
    $('#zk-einsatz').onchange = ev => { if (ev.target.value) { ansicht = 'e:' + ev.target.value; karte(L, true); } };
    const { lay, k, pins, info } = kartenAnsicht(L);
    $('#zk-info').textContent = info;
    const skalieren = () => {
      const huelle = $('#zk-karte');
      if (!huelle) return;
      // im Vollbild (Beamer) passt die ganze Karte auf den Schirm, sonst nach Breite (schmale Karten dürfen wachsen)
      const voll = document.fullscreenElement, max = lay.modus === 'spalten' ? 1 : 1.5;
      const f = Math.min(max, huelle.clientWidth / lay.breite, voll ? (window.innerHeight - 110) / lay.hoehe : Infinity);
      k.root.style.transform = `scale(${f})`;
      k.root.style.marginLeft = Math.max(0, (huelle.clientWidth - lay.breite * f) / 2) + 'px';
      huelle.style.height = Math.ceil(lay.hoehe * f) + 'px';
    };
    skalieren();
    window.onresize = skalieren;
    const laufen = lauf => MAP.pinne(k, pins, {
      lauf, von: 0, staffel: 140, maxDauer: 3200, ...(lay.modus === 'welt' ? { max: 12, proReihe: 4, versatz: 50, reihenAbstand: 40 } : {}),
      onMehr: ps => { $('#zk-mehr').innerHTML = `<div class="merk"><b>Hier stehen:</b> ${ps.map(p => esc(p.name)).join(', ')}</div>`; }
    });
    laufen(!!neuGeladen);
    $('#zk-lauf').onclick = () => { $('.map-pins', k.root).innerHTML = ''; laufen(true); };
    $('#zk-voll').onclick = () => { const el = $('.zk-karte-card'); if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().then(() => setTimeout(skalieren, 100)); };
    document.onfullscreenchange = () => setTimeout(skalieren, 100);
  }

  // Die drei Kartenansichten: Weltkarte (Station je Einsatz), Pfad eines Einsatzes, alle Schritte als Türme
  let ansicht = 'welt';
  function kartenAnsicht(L) {
    const kapitel = P.sichtbar(false);
    const pin = (d, ziel) => ({ ziel, avatar: d.save.duo.avatar, name: d.save.duo.codename, titel: `${d.save.duo.codename} (${d.save.duo.agenten.join(' & ')}) · ${d.k.punkte} XP · ${d.k.pos}` });
    const mittel = e => L.reduce((a, d) => a + P.einsatzFortschritt(d.save, e), 0) / L.length;
    if (ansicht === 'welt') {
      const lay = MAP.layout(kapitel, 'welt', { quer: true });
      const k = MAP.render($('#zk-map'), lay, {
        status: n => L.every(d => P.einsatzFertig(d.save, n.e)) ? 'done' : L.some(d => P.einsatzFortschritt(d.save, n.e) > 0 || (d.k.front && d.k.front.e === n.e)) ? 'open' : 'locked',
        fortschritt: mittel
      });
      return { lay, k, pins: L.map(d => pin(d, d.k.front ? d.k.front.e.id : 'ziel')), info: 'Jede Figur steht am Einsatz, an dem ihr Duo gerade arbeitet. Der goldene Ring zeigt, wie weit die Klasse im Mittel ist.' };
    }
    if (ansicht.startsWith('e:')) {
      const e = P.einsatz(ansicht.slice(2));
      const lay = MAP.layout([e], 'pfad', { ziel: false });
      const hier = L.filter(d => d.k.front && d.k.front.e === e);
      const weiter = L.filter(d => P.einsatzFertig(d.save, e)).length, davor = L.length - hier.length - weiter;
      const k = MAP.render($('#zk-map'), lay, {
        status: n => { const f = L.filter(d => P.stepDone(d.save, n.st)).length; return f === L.length ? 'done' : f || hier.some(d => d.k.front.st === n.st) ? 'open' : 'locked'; },
        start: false, fortschritt: mittel
      });
      return { lay, k, pins: hier.map(d => pin(d, d.k.front.st.id)), info: `${hier.length} Duo${hier.length === 1 ? '' : 's'} in diesem Einsatz · ${weiter} schon weiter · ${davor} noch davor.` };
    }
    const lay = MAP.layout(kapitel, 'spalten');
    const besetzt = new Set(L.map(d => d.k.front && d.k.front.st.id));
    const k = MAP.render($('#zk-map'), lay, {
      // erledigt = alle Duos, farbig = mindestens ein Duo war schon dort, grau = noch niemand
      status: n => { const f = L.filter(d => P.stepDone(d.save, n.st)).length; return f === L.length ? 'done' : f || besetzt.has(n.st.id) ? 'open' : 'locked'; },
      start: false, fortschritt: mittel
    });
    return { lay, k, pins: L.map(d => pin(d, d.k.front ? d.k.front.st.id : 'ziel')), info: 'Jede Figur steht am nächsten offenen Schritt ihres Duos.' };
  }

  // ---------- Beamer: Podium und Kategorien
  function sieger(L, fn, besser, min, fmt) {
    const kand = L.filter(d => d.k.geloest >= (min || 0));
    if (!kand.length) return null;
    kand.sort((a, b) => besser === 'max' ? fn(b) - fn(a) : fn(a) - fn(b));
    const top = fn(kand[0]);
    if (besser === 'max' && !(top > 0)) return null; // „0 Richtige“ ist kein Titel
    const alle = kand.filter(d => fn(d) === top).map(d => d.save.duo.codename);
    return { namen: alle.slice(0, 3).join(' & ') + (alle.length > 3 ? ` + ${alle.length - 3} weitere` : ''), wert: fmt(top) };
  }
  function beamer(L) {
    const fall = L.reduce((a, d) => a + d.k.fall, 0) / L.length;
    const top = L.slice().sort((a, b) => b.k.punkte - a.k.punkte).slice(0, 3);
    const pod = [top[1], top[0], top[2]].map((d, i) => d ? `<div class="pod ${['p2', 'p1', 'p3'][i]}"><div class="pod-figur">${AV.svg(d.save.duo.avatar, { pose: i === 1 ? 'jubel' : 'stand', titel: false })}</div><div class="pl">${['🥈', '🥇', '🥉'][i]}</div><div class="nm">${esc(d.save.duo.codename)}</div><div class="pt">${d.k.punkte} XP</div><div class="small muted">${esc(d.k.rang)}</div></div>` : '<div></div>').join('');
    const minA = 10;
    const cats = [
      ['🏆 Meiste Punkte', sieger(L, d => d.k.punkte, 'max', 0, v => v + ' P')],
      ['🧠 Wenigste Tipps', sieger(L, d => d.k.tippsProAufgabe, 'min', minA, v => v.toFixed(2).replace('.', ',') + ' pro Aufgabe')],
      ['🎯 Beste Erstversuch-Quote', sieger(L, d => d.k.erstQuote, 'max', minA, pct)],
      ['⚡ Zeit-Challenge-Rekord', sieger(L, d => d.k.challenge, 'max', 0, v => v + ' Richtige')],
      ['🚀 Größter Sprung (7 Tage)', sieger(L, d => d.k.sprung, 'max', 0, v => '+' + v + ' P')]
    ].filter(([, s]) => s).map(([t, s]) => `<div class="cat"><div class="ct">${t}</div><div class="cw">${esc(s.namen)}</div><div class="cv">${esc(s.wert)}</div></div>`).join('');
    $('#view').innerHTML = `<div class="beamer">
      <div class="card"><h2>Operation Lohnzettel – Stand der Ermittlungen</h2>
        <div class="classbar"><i style="width:${Math.round(fall * 100)}%"></i></div>
        <div class="zk-fall-zeile"><span class="muted">Die Einheit 7 hat gemeinsam</span><span class="big">${pct(fall)}</span></div>
        <div class="muted">des Falls aufgeklärt (Durchschnitt aller ${L.length} Duos über alle Akten des Falls).</div></div>
      <div class="podium">${pod}</div>
      <div class="cats">${cats}</div>
      <p class="small muted">„Wenigste Tipps“ und „Erstversuch-Quote“ zählen erst ab ${minA} gelösten Aufgaben.</p></div>`;
  }

  // ---------- Duos (Tabelle)
  let sortKey = 'punkte', sortDir = -1;
  const eins = () => OSI.einsaetze.filter(e => e.steps.length);
  function duoTabelle(L) {
    const val = (d, k) => ({ codename: d.save.duo.codename.toLowerCase(), punkte: d.k.punkte, geloest: d.k.geloest, erst: d.k.erstQuote, tipps: d.k.tipps, challenge: d.k.challenge, geuebt: d.k.geuebt, zuletzt: Date.parse(d.k.zuletzt) || 0, fall: d.k.fall })[k];
    L.sort((a, b) => (val(a, sortKey) > val(b, sortKey) ? 1 : val(a, sortKey) < val(b, sortKey) ? -1 : 0) * sortDir);
    const rows = L.map(d => `<tr>
      <td><div class="zk-duo">${AV.svg(d.save.duo.avatar, { titel: false })}<div><b>${esc(d.save.duo.codename)}</b><br><span class="small muted">${d.save.duo.agenten.map(esc).join(' & ')}</span></div></div></td>
      <td class="num">${d.k.punkte}</td><td>${esc(d.k.rang)}</td>
      ${eins().map(e => `<td class="num">${pct(d.k.proEinsatz[OSI.einsaetze.indexOf(e)])}</td>`).join('')}
      <td class="small">${esc(d.k.pos)}</td>
      <td class="num">${d.k.geloest}</td><td class="num">${pct(d.k.erstQuote)}</td><td class="num">${d.k.tipps}</td><td class="num">${d.k.geuebt} / ${d.k.gemeistert}</td><td class="num">${d.k.challenge}</td>
      <td class="small">${datumZeit(d.k.zuletzt)}<br><span class="muted">v${esc(d.save.version)} · ${esc(d.datei)}</span></td></tr>`).join('');
    $('#view').innerHTML = `<div class="card tabelle-scroll"><h2>Duos</h2>
      <p class="small muted">Spaltenköpfe anklicken zum Sortieren. Die Zuordnung Codename ↔ Personen erfolgt über die Kürzel.</p>
      <table class="t"><tr><th data-sort="codename">Duo</th><th data-sort="punkte" class="num">Punkte</th><th>Rang</th>
      ${eins().map(e => `<th class="num">${esc(e.nrText.replace('EINSATZ', 'E'))}</th>`).join('')}
      <th>steht bei</th><th data-sort="geloest" class="num">gelöst</th><th data-sort="erst" class="num">1. Versuch</th><th data-sort="tipps" class="num">Tipps</th><th data-sort="geuebt" class="num" title="Schritte freiwillig wiederholt / davon fehlerfrei gemeistert">geübt / ⭐</th><th data-sort="challenge" class="num">Challenge</th><th data-sort="zuletzt">zuletzt aktiv</th></tr>${rows}</table></div>`;
    $$('th[data-sort]').forEach(th => th.onclick = () => { if (sortKey === th.dataset.sort) sortDir *= -1; else { sortKey = th.dataset.sort; sortDir = -1; } render(); });
  }

  // ---------- Aufgaben-Analyse
  function aufgaben(L) {
    const daten = katalog.map(k => {
      const recs = L.map(d => d.save.items[k.id]).filter(Boolean);
      const geloest = recs.filter(r => r.ok);
      const falsch = {};
      recs.forEach(r => (r.w || []).forEach(v => { falsch[v] = (falsch[v] || 0) + 1; }));
      const h = Object.entries(falsch).sort((a, b) => b[1] - a[1])[0];
      return { k, n: geloest.length, quote: geloest.length ? geloest.filter(r => r.f > 0).length / geloest.length : 0, fehlSchnitt: geloest.length ? geloest.reduce((a, r) => a + r.f, 0) / geloest.length : 0, tipps: recs.reduce((a, r) => a + (r.h || 0), 0), haeufig: h ? `${k.dekodiere(h[0])} (${h[1]}×)` : '' };
    }).filter(a => a.n > 0).sort((a, b) => b.quote - a.quote || b.fehlSchnitt - a.fehlSchnitt);
    const rows = daten.map(a => `<tr><td class="small">${esc(a.k.einsatz.nrText)}${a.k.bonus ? ' ★' : ''}</td><td class="small">${esc(a.k.titel).slice(0, 140)}</td>
      <td class="num">${a.n}</td><td class="num"><span class="bar" style="width:${Math.round(a.quote * 60)}px"></span> ${pct(a.quote)}</td>
      <td class="num">${a.fehlSchnitt.toFixed(1).replace('.', ',')}</td><td class="num">${a.tipps}</td><td class="small">${esc(a.haeufig)}</td></tr>`).join('');
    $('#view').innerHTML = `<div class="card tabelle-scroll"><h2>Aufgaben-Analyse</h2>
      <p class="small muted">Sortiert nach Fehlerquote = Anteil der Duos, die die Aufgabe <i>nicht</i> beim ersten Versuch gelöst haben. Oben stehen die Kandidaten fürs Debriefing. „Häufigste falsche Antwort“ zeigt typische Fehlvorstellungen.</p>
      <table class="t"><tr><th>Einsatz</th><th>Aufgabe</th><th class="num">gelöst von</th><th class="num">Fehlerquote</th><th class="num">Ø Fehlversuche</th><th class="num">Tipps gesamt</th><th>häufigste falsche Antwort</th></tr>${rows || '<tr><td colspan="7" class="muted">Noch keine gelösten Aufgaben.</td></tr>'}</table></div>`;
  }

  // ---------- Abschlussverhör: Diagnose pro Kürzel und Bereich (keine Punkte)
  const vStep = (P.einsatz('verhoer') || { steps: [] }).steps.find(x => x.verhoerFragen);
  const vFragen = vStep ? vStep.verhoerFragen : [];
  const BER = ['Modell', 'L1', 'L2', 'L3', 'L4', 'L5–7'];
  const vBereiche = [...new Set(vFragen.map(q => q.bereich))].sort((a, b) => BER.indexOf(a) - BER.indexOf(b));
  const vDekodiere = (q, v) => v === '?' ? 'Weiß ich nicht' : q.layer ? 'L' + v : q.eingabe ? '„' + v + '“' : q.multi ? String(v).split('+').map(i => strip(q.optionen[i])).join(' + ') : strip((q.optionen || [])[v] || v);
  function verhoerPersonen(L) {
    const out = [];
    L.forEach(d => Object.entries(d.save.verhoer || {}).forEach(([k, r]) => {
      if (!r || !r.start) return;
      const proBereich = vBereiche.map(b => { const f = vFragen.filter(q => q.bereich === b); return { b, n: f.filter(q => r.a[q.id] && r.a[q.id].ok).length, von: f.filter(q => r.a[q.id]).length, max: f.length }; });
      out.push({
        k, duo: d.save.duo.codename, r, proBereich, richtig: vFragen.filter(q => r.a[q.id] && r.a[q.id].ok).length,
        wn: Object.values(r.a).filter(x => x.wn).length, beantwortet: Object.keys(r.a).length,
        dauer: r.ende ? Math.round((Date.parse(r.ende) - Date.parse(r.start)) / 6e4) : null
      });
    }));
    return out.sort((a, b) => a.k.localeCompare(b.k));
  }
  function zelle(x) {
    if (!x.von) return '<td class="num muted">–</td>';
    const q = x.n / x.max;
    return `<td class="num ampel ${q >= 1 ? 'gruen' : q > 0 ? 'gelb' : 'rot'}">${x.n} / ${x.max}</td>`;
  }
  function verhoer(L) {
    const Pn = verhoerPersonen(L);
    if (!Pn.length) { $('#view').innerHTML = '<div class="card muted">Noch niemand hat das Abschlussverhör begonnen.</div>'; return; }
    const fertig = Pn.filter(p => p.r.ende);
    const klasse = vBereiche.map(b => { const xs = fertig.map(p => p.proBereich.find(x => x.b === b)); const sum = xs.reduce((a, x) => a + x.n, 0), max = xs.reduce((a, x) => a + x.max, 0); return { b, q: max ? sum / max : 0 }; });
    const rows = Pn.map(p => `<tr data-k="${esc(p.k)}"><td><b>${esc(p.k)}</b><br><span class="small muted">Duo ${esc(p.duo)}</span></td>${p.proBereich.map(zelle).join('')}
      <td class="num"><b>${p.richtig}</b> / ${vFragen.length}</td><td class="num">${p.wn || '–'}</td><td class="small">${p.r.ende ? 'abgeschlossen' : `begonnen (${p.beantwortet}/${vFragen.length})`}</td>
      <td class="num">${p.dauer != null ? p.dauer + ' min' : '—'}</td><td class="small">${datumZeit(p.r.start)}</td></tr>`).join('');
    const auf = vFragen.map(q => {
      const recs = Pn.map(p => p.r.a[q.id]).filter(Boolean);
      const falsch = {}; recs.filter(x => !x.ok && !x.wn).forEach(x => { falsch[x.v] = (falsch[x.v] || 0) + 1; });
      const h = Object.entries(falsch).sort((a, b) => b[1] - a[1])[0];
      return { q, n: recs.length, wn: recs.filter(x => x.wn).length, quote: recs.length ? recs.filter(x => x.ok).length / recs.length : 0, haeufig: h ? `${vDekodiere(q, h[0])} (${h[1]}×)` : '' };
    }).sort((a, b) => a.quote - b.quote);
    $('#view').innerHTML = `<div class="card tabelle-scroll"><h2>Abschlussverhör – Diagnose pro Person</h2>
      <p class="small muted">Einzeln pro Kürzel beantwortet, ein Versuch, ohne Tipps und ohne Punkte. Grün = alles richtig, orange = teilweise, rot = keine richtig. 🤷 = Anzahl „Weiß ich nicht“ (zählt als nicht gelöst, ist aber keine falsche Vorstellung). Nicht gegen Wiederholung abgesichert (keine Note) – auffällig kurze Dauer oder mehrere Dateien desselben Duos im Blick behalten.</p>
      <table class="t" id="vh-personen"><tr><th>Kürzel</th>${vBereiche.map(b => `<th class="num">${esc(b)}</th>`).join('')}<th class="num">gesamt</th><th class="num" title="Anzahl „Weiß ich nicht“">🤷</th><th>Status</th><th class="num">Dauer</th><th>begonnen</th></tr>${rows}
      <tr><td class="muted">Klasse (abgeschlossene Verhöre)</td>${klasse.map(x => `<td class="num muted">${pct(x.q)}</td>`).join('')}<td colspan="5"></td></tr></table>
      <div class="btnrow"><button class="btn sec" id="vh-csv">⬇ Verhör als CSV</button></div></div>
      <div class="card tabelle-scroll"><h2>Verhörfragen</h2>
      <p class="small muted">Sortiert nach Anteil richtiger Antworten – oben stehen die Kandidaten fürs Nachschulen.</p>
      <table class="t"><tr><th>Bereich</th><th>Frage</th><th class="num">beantwortet</th><th class="num">richtig</th><th class="num" title="Anzahl „Weiß ich nicht“">🤷</th><th>häufigste falsche Antwort</th></tr>
      ${auf.map(a => `<tr><td>${esc(a.q.bereich)}</td><td class="small">${esc(strip(a.q.ticket ? a.q.ticket + ' ' + a.q.frage : a.q.frage)).slice(0, 160)}</td><td class="num">${a.n}</td><td class="num"><span class="bar" style="width:${Math.round(a.quote * 60)}px"></span> ${pct(a.quote)}</td><td class="num">${a.wn || '–'}</td><td class="small">${esc(a.haeufig)}</td></tr>`).join('')}</table></div>`;
    $('#vh-csv').onclick = () => {
      const head = ['Kuerzel', 'Duo', ...vBereiche, 'gesamt', 'von', 'weiss nicht', 'abgeschlossen', 'Dauer min', 'begonnen', ...vFragen.map(q => q.id)];
      const lines = Pn.map(p => [p.k, p.duo, ...p.proBereich.map(x => x.n + '/' + x.max), p.richtig, vFragen.length, p.wn, p.r.ende ? 'ja' : 'nein', p.dauer != null ? p.dauer : '', datumZeit(p.r.start), ...vFragen.map(q => p.r.a[q.id] ? (p.r.a[q.id].ok ? 1 : p.r.a[q.id].wn ? '?' : 0) : '')]);
      csvSpeichern([head, ...lines], 'Verhoer');
    };
  }

  function csv() {
    const L = [...duos.values()];
    if (!L.length) return;
    const head = ['Codename', 'Kuerzel', 'Figur', 'Punkte', 'Rang', ...eins().map(e => e.nrText + ' %'), 'steht bei', 'geloest', 'Erstversuch-Quote %', 'Tipps', 'geuebt', 'gemeistert', 'Challenge', 'zuletzt aktiv'];
    const lines = L.map(d => [d.save.duo.codename, d.save.duo.agenten.join(' & '), AV.name(d.save.duo.avatar), d.k.punkte, d.k.rang, ...eins().map(e => Math.round(d.k.proEinsatz[OSI.einsaetze.indexOf(e)] * 100)), d.k.pos, d.k.geloest, Math.round(d.k.erstQuote * 100), d.k.tipps, d.k.geuebt, d.k.gemeistert, d.k.challenge, d.k.zuletzt ? datumZeit(d.k.zuletzt) : '']);
    csvSpeichern([head, ...lines], 'Auswertung');
  }

  // ---------------------------------------------------------------- Bedienung
  const drop = $('#drop');
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); laden([...e.dataTransfer.files]); };
  $('#pick').onclick = ev => { ev.preventDefault(); $('#file').click(); };
  $('#file').onchange = e => laden([...e.target.files]);
  $$('.tabs [data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(tab === 'karte'); });
  $('#csv').onclick = csv;
  $('#reset').onclick = () => { if (confirm('Alle geladenen Spielstände aus der Ansicht entfernen?')) { duos.clear(); $('#filelist').innerHTML = ''; $('#drop').classList.remove('kompakt'); render(); } };
  $('#tb-theme').onclick = () => { Kit.theme.umschalten(); $('#tb-theme').textContent = Kit.theme.aktuell() === 'dark' ? '☀️' : '🌙'; };
  $('#tb-theme').textContent = Kit.theme.aktuell() === 'dark' ? '☀️' : '🌙';
  window.OSIZentrale = { laden, uebernehmen, duos, render };
  render();
})();
