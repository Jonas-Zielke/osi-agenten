/* OSI-Agenten – Spielkern: Spielstand, Punkte, Abzeichen, Übungsmodus, Navigation, Toasts und Dialoge.
   Öffentlich als window.OSIGame (auch von Inhalten und Tests genutzt). Kein Seiten-Rendering hier. */
(function () {
  'use strict';
  const OSI = window.OSI, S = window.OSIStore, A = window.OSIAudio, Kit = window.OSIKit;
  const P = Kit.progress, fx = Kit.fx;
  const { esc, $ } = Kit.util;

  // online: wird nur in der Online-Fassung gesetzt (js/online/sync.js) – in der Lite-Version bleibt es null
  const G = window.OSIGame = { save: null, teacher: false, view: null, uebung: null, kombo: 0, renderer: {}, util: Kit.util, online: null };
  const now = () => new Date().toISOString();
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  // ---------------------------------------------------------------- Rückmeldungen
  function toast(html, ms = 3200, art = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + art;
    t.innerHTML = html;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('weg'); setTimeout(() => t.remove(), 300); }, ms);
  }

  function modal(html, onOpen, klasse = '') {
    const m = document.createElement('div');
    m.id = 'modal';
    m.innerHTML = `<div class="box ${klasse}" role="dialog" aria-modal="true"><button class="modal-x" data-close title="Schließen" aria-label="Schließen">×</button>${html}</div>`;
    const zu = () => { m.remove(); document.removeEventListener('keydown', esc_); };
    const esc_ = e => { if (e.key === 'Escape') zu(); };
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) zu(); });
    document.addEventListener('keydown', esc_);
    document.body.appendChild(m);
    if (onOpen) onOpen(m, zu);
    return m;
  }

  // Element sanft in den sichtbaren Bereich holen (nur wenn nötig)
  function zeige(el) {
    if (!el) return;
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const oben = 80, unten = window.innerHeight - 16;
      if (r.bottom > unten || r.top < oben) el.scrollIntoView({ behavior: Kit.util.reducedMotion() ? 'auto' : 'smooth', block: r.height > unten - oben ? 'start' : 'nearest' });
    });
  }

  // ---------------------------------------------------------------- Spielstand
  function neuerSpielstand(codename, k1, k2, avatar) {
    return S.migrate({
      schema: 1, id: uid(), version: OSI.version, erstellt: now(), aktualisiert: now(),
      duo: { codename, agenten: [k1, k2].filter(Boolean), avatar },
      pos: null, items: {}, steps: {}, badges: {}, bonus: {}, exportiert: null, aenderungenSeitExport: 0
    });
  }

  // Spielstand ablegen: Lite im Browser-Speicher, online zusätzlich (entprellt) auf dem Server
  function sichern() {
    if (!G.save) return;
    if (G.online) { G.lokalOk = G.online.puffer(G.save); G.online.speichern(G.save); }
    else G.lokalOk = S.saveLocal(G.save);
  }

  function persist() {
    const s = G.save; if (!s) return;
    s.aktualisiert = now();
    s.version = OSI.version;
    sichern();
    if (G.renderTopbar) G.renderTopbar();
  }

  function exportieren() {
    S.download(G.save);
    G.save.exportiert = now();
    G.save.aenderungenSeitExport = 0;
    sichern();
    G.renderTopbar();
    toast('💾 <b>Spielstand exportiert.</b><br>Die Datei liegt in eurem Download-Ordner.', 3600, 'ok');
  }

  async function importieren(file, danach) {
    const r = await S.readFile(file);
    if (!r.ok) { alert(r.fehler); return; }
    const neu = r.save;
    if (G.save && G.save.id === neu.id) {
      const alt = P.geloest(G.save), nn = P.geloest(neu);
      if (nn < alt && !confirm(`Achtung: Die Datei enthält WENIGER Fortschritt (${nn} gelöste Aufgaben) als der aktuelle Stand (${alt}). Trotzdem laden?`)) return;
    } else if (G.save && !confirm(`Spielstand von Duo „${neu.duo.codename}“ laden? Der aktuelle Stand von „${G.save.duo.codename}“ wird im Browser ersetzt.`)) return;
    if (G.online) neu.duo.agenten = [G.online.benutzer.name]; // online gehört der Stand immer zum angemeldeten Konto
    G.save = neu;
    persist();
    if (danach) danach();
    toast(`👋 <b>Spielstand geladen.</b><br>Willkommen zurück, Duo ${esc(neu.duo.codename)}!`, 3600, 'ok');
    G.render();
  }

  // ---------------------------------------------------------------- Punkte, Ränge, Abzeichen
  const VERSUCH = [1, 0.5, 0.3, 0.2];
  function itemPunkte(base, falsch, hinweise) {
    const m = Math.max(0.1, VERSUCH[Math.min(falsch, VERSUCH.length - 1)] - hinweise * 0.2);
    return Math.max(1, Math.round(base * m));
  }
  // Im Übungsmodus zählt ein eigener, flüchtiger Satz – der gewertete Stand bleibt unberührt
  function itemState(id) {
    const ziel = G.uebung ? G.uebung.items : G.save.items;
    return ziel[id] || (ziel[id] = { f: 0, h: 0, p: 0, ok: false, w: [] });
  }
  const punkte = () => P.punkte(G.save);
  const rang = (p = punkte()) => P.rang(p);

  function mitRangCheck(fn) {
    const vor = rang().r.name;
    fn();
    const r = rang();
    if (vor !== r.r.name) {
      A.play('rang');
      fx.belohnung({ icon: '🎖️', titel: 'Beförderung!', text: `Neue Freigabe: <b>${esc(r.r.name)}</b>`, figur: Kit.avatars.svg(G.save.duo.avatar, { pose: 'jubel', klasse: 'av-gross' }) });
      fx.konfetti(60);
    }
  }

  // Kombo: richtige Antworten in Folge beim ersten Versuch ohne Tipp – nur Anzeige, keine Punkte
  function kombo(ersterVersuch) {
    if (!ersterVersuch) { G.kombo = 0; return; }
    G.kombo++;
    if ([3, 5, 10, 15, 20].includes(G.kombo)) {
      A.play('kombo');
      toast(`🔥 <b>${G.kombo} in Folge!</b><br>${G.kombo >= 10 ? 'Nicht zu stoppen.' : G.kombo >= 5 ? 'Starke Serie!' : 'Läuft bei euch.'}`, 2600, 'kombo');
    }
  }

  // Richtige Antwort: Punkte vergeben, speichern. vonEl: Element, von dem die XP losfliegen. Liefert vergebene Punkte.
  function richtig(id, base = 10, vonEl) {
    const it = itemState(id);
    if (it.ok) return 0;
    A.play('richtig');
    if (G.uebung) { it.ok = true; return 0; }
    let gained = 0;
    kombo(it.f === 0 && it.h === 0);
    mitRangCheck(() => {
      it.ok = true;
      it.p = itemPunkte(base, it.f, it.h);
      it.t = now();
      gained = it.p;
      G.save.aenderungenSeitExport = (G.save.aenderungenSeitExport || 0) + 1;
      persist();
    });
    if (vonEl) fx.xpFlug(vonEl, `+${gained} XP`);
    return gained;
  }
  function falsch(id, wert) {
    const it = itemState(id);
    if (it.ok) return;
    it.f++;
    if (wert != null && it.w.length < 12) it.w.push(String(wert));
    G.kombo = 0;
    if (!G.uebung) persist();
    A.play('falsch');
  }
  function hinweisNutzen(id) {
    const it = itemState(id);
    it.h++;
    G.kombo = 0;
    if (!G.uebung) persist();
    A.play('tipp');
    return it.h;
  }

  function bonusPunkte(key, p) {
    if (G.save.bonus[key] != null) return;
    mitRangCheck(() => { G.save.bonus[key] = p; persist(); });
  }

  function abzeichen(id) {
    if (G.save.badges[id]) return;
    const b = OSI.abzeichen.find(x => x.id === id);
    if (!b) return;
    G.save.badges[id] = now();
    persist();
    A.play('abzeichen');
    toast(`<span class="toast-medaille">${Kit.abzeichen.svg(b)}</span><div><b>Abzeichen: ${esc(b.name)}</b><br>${esc(b.text)}</div>`, 5000, 'medaille');
  }

  // ---------------------------------------------------------------- Struktur & Navigation
  const einsatz = P.einsatz;
  const stepDone = st => P.stepDone(G.save, st);
  const einsatzFertig = e => P.einsatzFertig(G.save, e);
  const einsatzOffen = e => P.einsatzOffen(G.save, e, G.teacher);
  const stepOffen = (e, idx) => P.stepOffen(G.save, e, idx, G.teacher);
  const einsatzVon = st => OSI.einsaetze.find(e => e.steps.includes(st));

  function stepAbschliessen(st) {
    if (G.save.steps[st.id]) return;
    G.save.steps[st.id] = now();
    if (st.setzt) Object.assign(G.save.board, st.setzt);
    persist();
  }

  function gotoStep(eid, sid) {
    G.save.pos = { e: eid, s: sid };
    sichern();
    G.render();
    window.scrollTo(0, 0);
  }
  // Zur Karte: mit Einsatz-ID auf dessen Pfad, ohne auf die Weltkarte
  function zurKarte(eid) {
    G.kartenEinsatz = typeof eid === 'string' ? eid : null;
    G.hubTab = 'karte';
    G.uebung = null;
    G.save.pos = null;
    sichern();
    G.render();
  }
  function naechsterStep(e, st) {
    const n = e.steps[e.steps.indexOf(st) + 1];
    if (n) gotoStep(e.id, n.id);
    else zurKarte();
  }

  // Aktuelle Position robust bestimmen (auch nach Updates mit geänderten Schritten)
  function aktuellePosition() {
    const p = G.save.pos;
    if (!p) return null;
    const e = einsatz(p.e);
    if (!e || !einsatzOffen(e)) return null;
    const i = e.steps.findIndex(s => s.id === p.s);
    return i >= 0 && stepOffen(e, i) ? { e, st: e.steps[i] } : null;
  }

  // ---------------------------------------------------------------- Übungsmodus („Nochmal üben“)
  // Der erste Durchgang bleibt maßgeblich. Übungen geben keine Punkte und ziehen keine ab.
  const UEBBAR = ['quiz', 'sort', 'kapsel', 'anklage'];
  function uebungStarten(e, st) {
    G.uebung = { stepId: st.id, items: {}, fertig: false };
    A.play('klick');
    G.renderStepView(e, st);
    window.scrollTo(0, 0);
  }
  function uebungFertig(st) {
    const u = G.uebung;
    if (!u || u.stepId !== st.id || u.fertig) return;
    u.fertig = true;
    const recs = Object.values(u.items);
    const f = recs.reduce((a, r) => a + r.f, 0), h = recs.reduce((a, r) => a + r.h, 0);
    const rec = G.save.uebung[st.id] || (G.save.uebung[st.id] = { runs: 0, gemeistert: null });
    rec.runs++;
    rec.letzte = { f, h, t: now() };
    const neu = !f && !h && !rec.gemeistert;
    if (neu) rec.gemeistert = now();
    persist();
    const zusammenfassung = `${f} Fehlversuch${f === 1 ? '' : 'e'}, ${h} Tipp${h === 1 ? '' : 's'}`;
    const ub = $('#uebbar');
    if (ub) {
      const e = einsatzVon(st);
      ub.innerHTML = `<div class="uebbar on">🔁 <b>Übung beendet</b> – ${zusammenfassung}${rec.gemeistert ? ' · ⭐ gemeistert' : ''}<span class="spacer"></span><button class="btn sec klein" id="ub-again">🔁 Nochmal</button><button class="btn sec klein" id="ub-stop2">Übung beenden</button></div>`;
      $('#ub-again').onclick = () => uebungStarten(e, st);
      $('#ub-stop2').onclick = () => { G.uebung = null; G.renderStepView(e, st); };
    }
    if (neu) {
      A.play('abzeichen');
      fx.belohnung({ icon: '⭐', titel: 'Gemeistert!', text: 'Fehlerfrei und ohne Tipp geübt.', dauer: 2600 });
      if (Object.values(G.save.uebung).filter(x => x.gemeistert).length >= 5) abzeichen('training-5');
    } else {
      toast(`🔁 <b>Übung beendet.</b><br>${zusammenfassung}.${rec.gemeistert ? '' : ' Fehlerfrei und ohne Tipp gibt es ⭐.'}`, 4500);
    }
  }

  const figur = id => OSI.figuren[id] || OSI.figuren.system;

  Object.assign(G, {
    toast, modal, zeige, figur,
    neuerSpielstand, persist, sichern, exportieren, importieren,
    itemState, punkte, rang, richtig, falsch, hinweisNutzen, bonusPunkte, abzeichen,
    einsatz, stepDone, einsatzFertig, einsatzOffen, stepOffen, einsatzVon, stepAbschliessen,
    gotoStep, zurKarte, naechsterStep, aktuellePosition,
    UEBBAR, uebungStarten, uebungFertig
  });
})();
