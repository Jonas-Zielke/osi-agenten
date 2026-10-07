// Spielt ALLE freigegebenen Einsätze automatisch durch – inkl. je einer absichtlich
// falschen Antwort und eines Tipps pro Schritt – und prüft Speichern, Export/Import
// und Weiterspielen nach Neuladen.
// Aufruf: node test-durchlauf.js [schritt-id ...|all]   (IDs = Screenshots in werkzeuge/shots)
const { browser, seite, klick, sleep, shot } = require('./lib');

(async () => {
  const b = await browser();
  const page = await seite(b, 'spiel/index.html');
  const shots = new Set(process.argv.slice(2));
  const fehler = [];
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { } });
  await page.reload(); await sleep(300);
  await page.type('#st-code', 'Testlauf');
  await page.type('#st-k1', 'T1');
  await page.type('#st-k2', 'T2');
  await klick(page, '#st-neu');
  await sleep(200);

  const einsaetze = await page.evaluate(() => OSI.einsaetze.filter(e => e.status !== 'bearbeitung' && e.steps.length).map(e => e.id));
  let guard = 0;
  const falschGemacht = new Set();
  for (const e of einsaetze) {
    await page.evaluate(eid => { const E = OSI.einsaetze.find(x => x.id === eid); OSIGame.gotoStep(eid, E.steps[0].id); }, e);
    while (guard++ < 1000) {
      const st = await page.evaluate(() => { const p = OSIGame.save.pos; if (!p) return null; const E = OSI.einsaetze.find(x => x.id === p.e); const s = E.steps.find(s => s.id === p.s); return { e: p.e, id: s.id, type: s.type }; });
      if (!st || st.e !== e) break;
      if (shots.has(st.id) || shots.has('all')) await page.screenshot({ path: shot(st.id), fullPage: true });
      try {
        if (st.type === 'story') {
          while (await page.$('#dl-next')) { await klick(page, '#dl-next'); await sleep(20); }
          await klick(page, '#st-weiter');
        } else if (st.type === 'lesson' || st.type === 'sealed') {
          await klick(page, '#st-weiter');
        } else if (st.type === 'quiz' || st.type === 'anklage') {
          const qs = await page.evaluate(id => { const p = OSIGame.save.pos; const s = OSI.einsaetze.find(x => x.id === p.e).steps.find(s => s.id === id); return s.fragen.map(q => ({ id: q.id, richtig: q.richtig, layer: !!q.layer, pick: !!q.pick, multi: !!q.multi, eingabe: q.eingabe || null, meldung: !!q.meldung })); }, st.id);
          for (const q of qs) {
            if (!falschGemacht.has(st.id)) {
              falschGemacht.add(st.id);
              if (await page.$('.hintbtn')) { await klick(page, '.hintbtn'); await sleep(40); }
              if (q.layer) await klick(page, `.triage-btns button[data-v="${[1, 2, 3, 4, 5, 6, 7].find(n => ![].concat(q.richtig).includes(n))}"]`);
              else if (q.eingabe) { await page.$eval('#q-in', el => { el.value = '0.0.0.0'; }); await klick(page, '#q-check'); }
              else if (q.meldung) { await page.evaluate(sid => { OSIGame.wsState[sid].sel = 1; }, st.id); await klick(page, '#q-melden'); }
              else if (!q.pick && !q.multi) await klick(page, `.opt[data-i="${q.richtig === 0 ? 1 : 0}"]`);
              await sleep(40);
            }
            if (q.eingabe) { await page.$eval('#q-in', (el, v) => { el.value = v; }, [].concat(q.richtig)[0]); await klick(page, '#q-check'); }
            else if (q.meldung) { await page.evaluate((sid, n) => { OSIGame.wsState[sid].sel = n; }, st.id, [].concat(q.richtig)[0]); await klick(page, '#q-melden'); }
            else if (q.layer) await klick(page, `.triage-btns button[data-v="${[].concat(q.richtig)[0]}"]`);
            else if (q.pick) await klick(page, `[data-pick="${q.richtig}"]`);
            else if (q.multi) { for (const i of q.richtig) await klick(page, `.opt[data-i="${i}"]`); await klick(page, '#q-check'); }
            else await klick(page, `.opt[data-i="${q.richtig}"]`);
            await sleep(50);
            if (shots.has(q.id)) await page.screenshot({ path: shot(q.id), fullPage: true });
            await klick(page, '#q-next');
            await sleep(30);
          }
          await klick(page, '#st-weiter');
        } else if (st.type === 'sort') {
          const items = await page.evaluate(id => { const p = OSIGame.save.pos; const s = OSI.einsaetze.find(x => x.id === p.e).steps.find(s => s.id === id); return s.items.map(i => ({ id: i.id, ziel: String([].concat(i.ziel)[0]), alle: [].concat(i.ziel).map(String) })); }, st.id);
          let erstes = true;
          for (const it of items) {
            await klick(page, `.chip[data-id="${it.id}"]`);
            if (erstes) { erstes = false; const bins = await page.$$eval('.bin', x => x.map(y => y.dataset.bin)); await klick(page, `.bin[data-bin="${bins.find(x => !it.alle.includes(x))}"]`); await sleep(30); }
            await klick(page, `.bin[data-bin="${it.ziel}"]`);
            await sleep(20);
          }
          await klick(page, '#st-weiter');
        } else if (st.type === 'kapsel') {
          const ph = await page.evaluate(id => { const p = OSIGame.save.pos; const s = OSI.einsaetze.find(x => x.id === p.e).steps.find(s => s.id === id); return s.phasen.map(f => f.korrekt); }, st.id);
          for (const korr of ph) { for (const k of korr) { await klick(page, `.opt[data-k="${k}"]`); await sleep(30); } await klick(page, '#k-next'); await sleep(30); }
          await klick(page, '#st-weiter');
        } else if (st.type === 'verhoer') {
          const vq = await page.evaluate(id => { const p = OSIGame.save.pos; const s = OSI.einsaetze.find(x => x.id === p.e).steps.find(s => s.id === id); return s.verhoerFragen.map(q => ({ id: q.id, richtig: q.richtig, layer: !!q.layer, multi: !!q.multi, eingabe: q.eingabe || null })); }, st.id);
          const agenten = await page.evaluate(() => OSIGame.save.duo.agenten);
          for (const [ai, k] of agenten.entries()) {
            await klick(page, `[data-k="${k}"]`); await sleep(40);
            for (const [qi, q] of vq.entries()) {
              const falschMachen = ai === 0 && qi === 0;
              if (ai === 0 && qi === 1) { await klick(page, '#vh-weissnicht'); await sleep(30); await klick(page, '#vh-next'); await sleep(30); continue; }
              if (q.eingabe) { await page.$eval('#vh-in', (el, v) => { el.value = v; }, falschMachen ? 'falsch' : String([].concat(q.richtig)[0])); await klick(page, '#vh-send'); }
              else if (q.layer) await klick(page, `.triage-btns button[data-v="${falschMachen ? [1, 2, 3, 4, 5, 6, 7].find(n => ![].concat(q.richtig).includes(n)) : [].concat(q.richtig)[0]}"]`);
              else if (q.multi) { for (const i of q.richtig) await klick(page, `.opt[data-i="${i}"]`); await klick(page, '#vh-send'); }
              else await klick(page, `.opt[data-i="${falschMachen ? (q.richtig === 0 ? 1 : 0) : q.richtig}"]`);
              await sleep(30);
              if (shots.has(q.id)) await page.screenshot({ path: shot(q.id), fullPage: true });
              await klick(page, '#vh-next'); await sleep(30);
            }
            if (shots.has(st.id) || shots.has('all')) await page.screenshot({ path: shot(st.id + '_' + k), fullPage: true });
            await klick(page, '#vh-back'); await sleep(40);
          }
          const vh = await page.evaluate(n => { const V = OSIGame.save.verhoer; return OSIGame.save.duo.agenten.map(k => V[k] && V[k].ende && Object.keys(V[k].a).length === n ? Object.values(V[k].a).filter(x => x.ok).length : -1); }, vq.length);
          if (vh[0] !== vq.length - 2 || vh.slice(1).some(x => x !== vq.length)) fehler.push(`Verhör falsch gespeichert: ${JSON.stringify(vh)} richtig von ${vq.length}`);
          if (!(await page.evaluate(id => OSIGame.save.verhoer[OSIGame.save.duo.agenten[0]].a[id].wn, vq[1].id))) fehler.push('„Weiß ich nicht“ wird nicht gekennzeichnet');
          await page.screenshot({ path: shot(st.id + '_fertig'), fullPage: true });
          await klick(page, '#st-weiter');
        } else if (st.type === 'interaktiv') {
          // eigene Interaktion: der Inhalt bringt mit loesen(el, api) seinen eigenen Lösungsweg mit
          await page.evaluate(() => OSIGame.interaktiv.loesen()); await sleep(80);
          await klick(page, '#st-weiter');
        } else if (st.type === 'urkunde') {
          await sleep(300);
          await page.screenshot({ path: shot(st.id), fullPage: true });
          if (!(await page.$('.urkunde'))) fehler.push('Urkunde fehlt im Abschluss');
          await page.evaluate(() => { window.print = () => {}; });
          await klick(page, '#uk-druck');
          const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
          const seiten = Math.max(0, ...[...Buffer.from(pdf).toString('latin1').matchAll(/\/Count\s+(\d+)/g)].map(m => +m[1]));
          require('fs').writeFileSync(shot('urkunde_druck').replace(/\.png$/, '.pdf'), pdf);
          if (seiten !== 1) fehler.push(`Urkunde druckt auf ${seiten} statt 1 Seite`);
          await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
          await klick(page, '#en-hub');
          break;
        } else if (st.type === 'ende') {
          await page.screenshot({ path: shot(st.id), fullPage: true });
          await klick(page, '#en-hub');
          break;
        } else {
          fehler.push(`Unbekannter Schritt-Typ im Test: ${st.type} (${st.id})`);
          break;
        }
      } catch (err) { fehler.push(`Schritt ${st.id}: ${err.message}`); break; }
      await sleep(40);
    }
  }
  await sleep(200);
  await page.screenshot({ path: shot('zz_uebersicht'), fullPage: true });
  const s = await page.evaluate(() => ({ punkte: OSIGame.punkte(), rang: OSIGame.rang().r.name, geloest: Object.values(OSIGame.save.items).filter(i => i.ok).length, gesamt: OSIStore.alleItems(OSI).length, schritte: Object.keys(OSIGame.save.steps).length, abzeichen: Object.keys(OSIGame.save.badges) }));
  console.log(`Einsätze: ${einsaetze.join(', ')} · Punkte ${s.punkte} (${s.rang}) · Aufgaben ${s.geloest}/${s.gesamt} · Schritte ${s.schritte} · Abzeichen ${s.abzeichen.join(', ')}`);
  if (s.geloest !== s.gesamt) fehler.push(`Nicht alle Aufgaben gelöst: ${s.geloest}/${s.gesamt}`);
  const rt = await page.evaluate(() => { const t = OSIStore.encode(OSIGame.save); const r = OSIStore.decode(t); const bad = OSIStore.decode(t.slice(0, -2) + 'xx'); return { ok: r.ok && JSON.stringify(r.save) === JSON.stringify(OSIGame.save), badAbgelehnt: !bad.ok }; });
  if (!rt.ok) fehler.push('Export/Import liefert nicht denselben Spielstand');
  if (!rt.badAbgelehnt) fehler.push('Manipulierte Datei wurde NICHT abgelehnt');
  await page.reload(); await sleep(300);
  if (!(await page.$('#st-weiter'))) fehler.push('Nach dem Neuladen fehlt „Weiterspielen“');
  fehler.push(...page.fehler);
  await b.close();
  if (fehler.length) { console.log('❌ DURCHLAUF FEHLGESCHLAGEN:\n  ' + fehler.join('\n  ')); process.exit(1); }
  console.log('✅ Durchlauf bestanden');
})().catch(e => { console.error('❌ TESTFEHLER', e); process.exit(1); });
