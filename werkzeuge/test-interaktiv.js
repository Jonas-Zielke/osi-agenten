// Prüft den Schritt-Typ „interaktiv“ mit dem Beispiel aus docs/beispiele/interaktiv-frame.js:
// Fehlversuch und Tipp kosten Punkte, richtige Lösung gibt Punkte, „Weiter“ schließt den Schritt ab,
// „Nochmal üben“ startet frisch ohne Punkte, Aufgaben stehen in der Aufgabenliste (Zentrale, Lösungen).
const path = require('path');
const { browser, seite, klick, sleep, shot, ROOT } = require('./lib');

(async () => {
  const b = await browser();
  const p = await seite(b, 'spiel/index.html');
  const fehler = [];
  const pruefe = (bed, text) => { if (!bed) fehler.push(text); };
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) { } }); await p.reload(); await sleep(300);
  await p.type('#st-code', 'Werkstatt'); await p.type('#st-k1', 'W1'); await klick(p, '#st-neu'); await sleep(200);
  await p.addScriptTag({ path: path.join(ROOT, 'docs/beispiele/interaktiv-frame.js') });
  pruefe((await p.evaluate(() => OSI.pruefen())).length === 0, 'Beispiel verletzt die Inhaltsprüfung');
  await p.evaluate(() => { OSIGame.teacher = true; OSIGame.gotoStep('e2', 'bsp-frame'); }); await sleep(300);

  pruefe((await p.$$('.ia-buehne .pool .chip')).length === 5, 'Bühne zeigt nicht die 5 Frame-Teile');
  pruefe(/Mitmachen/.test(await p.$eval('.step-typ', el => el.textContent)), 'Kopf zeigt den Schritt-Typ nicht');
  // 1) Fehlversuch + Tipp
  await klick(p, '.pool .chip[data-k="fcs"]'); await sleep(80);
  pruefe(!!(await p.$('.feedback.bad')), 'Fehlversuch zeigt keine rote Leiste');
  await klick(p, '.hintbtn'); await sleep(80);
  pruefe(!!(await p.$('.hints .hint')), 'Tipp wird nicht angezeigt');
  const it1 = await p.evaluate(() => OSIGame.save.items['bsp-frame-bauen']);
  pruefe(it1 && it1.f === 1 && it1.h === 1 && it1.w[0] === 'fcs', `Fehlversuch/Tipp nicht gespeichert: ${JSON.stringify(it1)}`);
  // 2) richtig bauen, dann Trailer erst falsch, dann richtig
  for (const k of ['ziel', 'quelle', 'typ', 'daten', 'fcs']) { await klick(p, `.pool .chip[data-k="${k}"]`); await sleep(40); }
  pruefe(!!(await p.$('.feedback.ok')), 'Richtige Reihenfolge zeigt keine grüne Leiste');
  pruefe(!(await p.$('#st-weiter')), '„Weiter“ erscheint, obwohl noch eine Aufgabe offen ist');
  await klick(p, '.bsp-feld[data-k="ziel"]'); await sleep(60);
  await klick(p, '.bsp-feld[data-k="fcs"]'); await sleep(80);
  await p.screenshot({ path: shot('interaktiv_beispiel'), fullPage: true });
  const s = await p.evaluate(() => ({ a: OSIGame.save.items['bsp-frame-bauen'], b: OSIGame.save.items['bsp-frame-trailer'] }));
  pruefe(s.a.ok && s.a.p === 5 && s.b.ok && s.b.p === 5, `Punkte falsch (erwartet 15 × (0,5 − 0,2) = 5 und 10 × 0,5 = 5): ${JSON.stringify(s)}`);
  pruefe(!!(await p.$('#st-weiter')), 'Nach der letzten Aufgabe fehlt „Weiter“');
  await klick(p, '#st-weiter'); await sleep(200);
  pruefe(await p.evaluate(() => !!OSIGame.save.steps['bsp-frame']), 'Schritt nicht als erledigt gespeichert');

  // 3) wieder öffnen: fertiger Zustand + „Nochmal üben“ (frisch, ohne Punkte)
  const punkte = await p.evaluate(() => OSIGame.punkte());
  await p.evaluate(() => OSIGame.gotoStep('e2', 'bsp-frame')); await sleep(300);
  pruefe((await p.$$('.bsp-feld.gelegt')).length === 5 && !!(await p.$('#st-weiter')), 'Erledigter Schritt zeigt nicht den fertigen Frame mit „Weiter“');
  await klick(p, '#ub-start'); await sleep(300);
  pruefe((await p.$$('.ia-buehne .pool .chip')).length === 5, 'Übung startet nicht frisch');
  await p.evaluate(() => OSIGame.interaktiv.loesen()); await sleep(200);
  const u = await p.evaluate(() => OSIGame.save.uebung['bsp-frame']);
  pruefe(u && u.gemeistert, `Fehlerfreie Übung nicht als gemeistert gespeichert: ${JSON.stringify(u)}`);
  pruefe((await p.evaluate(() => OSIGame.punkte())) === punkte, 'Übung verändert die Punkte');

  // 4) Aufgaben stehen in der Aufgabenliste (Grundlage für Zentrale und Lösungs-PDF)
  const ids = await p.evaluate(() => OSIStore.alleItems(OSI).map(i => i.id));
  pruefe(ids.includes('bsp-frame-bauen') && ids.includes('bsp-frame-trailer'), 'Aufgaben fehlen in OSIStore.alleItems');

  // 5) Ein fehlerhafter Inhalt legt das Spiel nicht lahm
  await p.evaluate(() => { OSI.schritte('e2', [{ id: 'bsp-kaputt', type: 'interaktiv', titel: 'kaputt', aufgaben: [{ id: 'bsp-kaputt-a', text: 'x' }], start() { throw new Error('absichtlich'); }, loesen() { } }]); OSIGame.gotoStep('e2', 'bsp-kaputt'); });
  await sleep(200);
  pruefe(/Fehler/.test(await p.$eval('.ia-buehne', el => el.textContent)), 'Fehler im Inhalt wird nicht abgefangen');

  fehler.push(...p.fehler.filter(f => !f.includes('bsp-kaputt'))); // die absichtliche Fehlermeldung aus 5) ist erwartet
  await b.close();
  if (fehler.length) { console.log('❌ INTERAKTIV FEHLGESCHLAGEN:\n  ' + fehler.join('\n  ')); process.exit(1); }
  console.log('✅ Interaktive Schritte bestanden (Beispiel „Frame bauen“, Punkte, Tipps, Übung, Fehler im Inhalt)');
})().catch(e => { console.error('❌ TESTFEHLER', e); process.exit(1); });
