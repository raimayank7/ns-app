/* NS.apptUi: the shared screens of the clinic site and the salon, gym and coaching site: an appointment book (a day at a time, free
   slots, reminders), the list of patients or clients with their bills, renewals due for memberships and packages, and a day summary.
   A site file calls NS.apptUi({ K, site, personType, fields, ... }) after NS.kit and puts ui.bar() into its form. All logic that needs
   no page is in apptcore.js (NSAppt). Everything is stored in the shared 'doc' store, filtered by the business name, so nothing
   leaves this device and no second storage exists. */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, t = NS.t, A = window.NSAppt;
  function key(s) { return String(s || '').trim().toLowerCase(); }
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function download(name, text) {
    var b = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }), u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
  }
  /* current age of a person record: from the birth date, or the age typed on a date plus the years since */
  A.ageNow = function (p, today) {
    if (p.dob) { var a = A.age(p.dob, today); return a ? a.text : ''; }
    var n = num(p.age); if (!n) return '';
    var since = p.ageAt && p.ageAt < today ? Math.floor(A.daysBetween(p.ageAt, today) / 365.25) : 0;
    return (Math.floor(n) + since) + ' y';
  };

  NS.apptUi = function (cfg) {
    var K = cfg.K, site = cfg.site, dlg, tab = 'appt', date = NS.today(), data = { appts: [], people: [], bills: [] }, editing = null, openHist = {}, hrs = lsGet('ns-hours-' + site, { open: '09:00', close: '18:00', step: 15 });
    var billType = cfg.billType, PT = cfg.personType;

    function biz() { return String(K.doc().seller.name || '').trim(); }
    function load() {
      var who = key(biz());
      return NSStore.list('doc').then(function (all) {
        var mine = all.filter(function (d) { return key(d.seller && d.seller.name) === who && (!d.site || d.site === site || d.type === billType); });
        data.appts = mine.filter(function (d) { return d.type === 'appt'; });
        data.people = mine.filter(function (d) { return d.type === PT; });
        data.bills = mine.filter(function (d) { return d.type === billType; });
      });
    }
    function billsOf(pk) { return data.bills.filter(function (d) { return A.personKey(d) === pk; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }); }
    function ptKey(p) { return A.personKey(p); }
    function findPerson(name, phone) { var pk = A.personKey({ buyer: { name: name, phone: phone } }); return data.people.filter(function (p) { return ptKey(p) === pk || (key(p.buyer.name) === key(name) && !A.digits(phone)); })[0] || null; }

    /* ---------- shell ---------- */
    function build() {
      if (dlg) return;
      dlg = NS.el('dialog', { id: 'ap-dlg', 'aria-labelledby': 'ap-h', class: 'md-dlg ap-dlg' }, '<div class="dlg-h"><h2 id="ap-h"></h2><button type="button" class="btn sm" data-ap-close></button></div><div class="ap-tabs" role="tablist"></div><div class="dlg-b ap-body"></div>');
      document.body.appendChild(dlg);
      $('[data-ap-close]', dlg).addEventListener('click', function () { dlg.close(); });
      dlg.addEventListener('click', onClick);
      dlg.addEventListener('input', onInput); dlg.addEventListener('change', onInput);
      document.addEventListener('ns-lang', function () { if (dlg.open) draw(); });
    }
    function tabs() { var l = [['appt', 'ap.t.appt'], ['people', cfg.peopleKey], ['today', 'ap.t.today']]; if (cfg.plans) l.splice(2, 0, ['renew', 'ap.t.renew']); return l; }
    function open(which) {
      if (!biz()) { NS.toast(t('ap.needbiz'), 'bad'); var f = $('#k-seller-name'); if (f) f.focus(); return; }
      build(); tab = which || tab; editing = null; date = NS.today();
      load().then(function () { draw(); dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', ''); });
    }
    function draw() {
      $('#ap-h').textContent = t(cfg.titleKey); $('[data-ap-close]', dlg).textContent = t('close');
      $('.ap-tabs', dlg).innerHTML = tabs().map(function (x) { return '<button type="button" role="tab" data-ap-tab="' + x[0] + '" aria-selected="' + (x[0] === tab) + '">' + esc(t(x[1])) + '</button>'; }).join('');
      var body = $('.ap-body', dlg);
      body.innerHTML = tab === 'appt' ? drawAppt() : tab === 'people' ? drawPeople() : tab === 'renew' ? drawRenew() : drawToday();
      if (tab === 'appt') apptWire(); if (tab === 'people') peopleWire();
    }
    function refresh() { return load().then(draw); }

    /* ---------- appointments ---------- */
    function rowsOf(d) { return A.dayRows(data.appts, d, site); }
    function drawAppt() {
      var rows = rowsOf(date), c = A.dayCounts(rows), today = NS.today();
      var h = '<div class="ap-bar"><button type="button" class="btn sm" data-ap-day="-1" aria-label="' + esc(t('ap.prev')) + '">‹</button><input type="date" id="ap-day" value="' + date + '" aria-label="' + esc(t('l.date')) + '"><button type="button" class="btn sm" data-ap-day="1" aria-label="' + esc(t('ap.next')) + '">›</button><button type="button" class="btn sm" data-ap-day="0">' + esc(t('ap.today')) + '</button><button type="button" class="btn sm primary" data-ap-new>' + esc(t('ap.new')) + '</button></div>';
      h += '<p class="ap-sum">' + esc(t('ap.counts', { n: c.total, w: c.booked + c.arrived, d: c.done, c: c.cancelled + c.noshow })) + '</p>';
      if (editing !== null) h += apptForm();
      h += rows.length ? '<ul class="ap-list">' + rows.map(function (a, i) {
        var late = a.status === 'booked' && date < today;
        return '<li class="ap-' + esc(a.status) + '"><div class="ap-main"><b class="mono">' + (a.time ? esc(A.clock(a.time)) : '#' + (i + 1)) + '</b> <span class="ap-who">' + esc(a.buyer.name || '') + '</span>' + (a.buyer.phone ? ' <small dir="ltr">' + esc(a.buyer.phone) + '</small>' : '') +
          '<br><small>' + esc([a.reason, a.staff, a.dur ? a.dur + ' ' + t('ap.min') : ''].filter(Boolean).join(' · ')) + '</small></div><div class="ap-acts">' +
          '<button type="button" class="pill ' + (a.status === 'done' ? 'ok' : a.status === 'cancelled' || a.status === 'noshow' || late ? '' : 'mid') + '" data-ap-st="' + a.id + '" title="' + esc(t('ap.stepst')) + '">' + esc(t('ap.s.' + a.status)) + '</button>' +
          (a.status !== 'cancelled' && a.status !== 'done' ? '<button type="button" class="btn sm" data-ap-bill="' + a.id + '">' + esc(t(cfg.billKey)) + '</button>' : '') +
          '<button type="button" class="btn sm" data-ap-edit="' + a.id + '">' + esc(t('ap.edit')) + '</button>' +
          '<button type="button" class="btn sm" data-ap-x="' + a.id + '">' + esc(t('ap.cancelit')) + '</button></div></li>';
      }).join('') + '</ul>' : '<p class="note">' + esc(t('ap.none')) + '</p>';
      var rem = A.reminders(rows);
      h += '<div class="btns">' + (rem.length ? '<button type="button" class="btn sm" data-ap-rem>' + esc(t('ap.remind', { n: rem.length })) + '</button>' : '') + '<button type="button" class="btn sm" data-ap-csv>' + esc(t('ap.csv')) + '</button></div><div id="ap-rem"></div>';
      return h;
    }
    function apptForm() {
      var a = editing === 'new' ? { date: date, time: '', dur: String(hrs.dur || cfg.dur || 15), staff: '', status: 'booked', buyer: { name: '', phone: '' }, reason: '', notes: '' } : editing;
      var staff = cfg.staffList ? cfg.staffList(data) : [];
      return '<fieldset class="card ap-form"><legend>' + esc(t(editing === 'new' ? 'ap.new' : 'ap.edit')) + '</legend><div class="fg">' +
        field('ap-name', t('ap.name'), '<input id="ap-name" dir="auto" value="' + esc(a.buyer.name) + '" autocomplete="off">', 1) +
        field('ap-phone', t('l.phone'), '<input id="ap-phone" type="tel" inputmode="tel" dir="ltr" value="' + esc(a.buyer.phone) + '">') +
        field('ap-date', t('l.date'), '<input id="ap-adate" type="date" value="' + esc(a.date) + '">') +
        field('ap-time', t('ap.time'), '<input id="ap-time" type="time" value="' + esc(a.time || '') + '">') +
        field('ap-dur', t('ap.dur'), '<input id="ap-dur" type="number" min="5" step="5" inputmode="numeric" dir="ltr" value="' + esc(a.dur) + '">') +
        field('ap-staff', t(cfg.staffKey), '<input id="ap-staff" dir="auto" list="ap-staff-dl" value="' + esc(a.staff) + '"><datalist id="ap-staff-dl">' + staff.map(function (s) { return '<option value="' + esc(s) + '">'; }).join('') + '</datalist>') +
        field('ap-reason', t(cfg.reasonKey), '<input id="ap-reason" dir="auto" value="' + esc(a.reason) + '">', 1) +
        field('ap-notes', t('l.notes'), '<textarea id="ap-notes" rows="2" dir="auto">' + esc(a.notes || '') + '</textarea>', 1) +
        '</div><p class="warn" id="ap-warn" aria-live="polite"></p><div class="ap-slots" id="ap-slots"></div>' +
        '<details class="more"><summary>' + esc(t('ap.hours')) + '</summary><div class="fg">' +
        field('ap-open', t('ap.open'), '<input id="ap-open" type="time" value="' + esc(hrs.open) + '">') + field('ap-close', t('ap.close'), '<input id="ap-close" type="time" value="' + esc(hrs.close) + '">') +
        field('ap-step', t('ap.step'), '<input id="ap-step" type="number" min="5" step="5" dir="ltr" value="' + esc(hrs.step) + '">') + '</div></details>' +
        '<div class="btns"><button type="button" class="btn primary" data-ap-save>' + esc(t('b.save')) + '</button><button type="button" class="btn" data-ap-stop>' + esc(t('ap.close2')) + '</button></div></fieldset>';
    }
    function field(id, label, input, wide) { return '<div class="f' + (wide ? ' wide' : '') + '"><label for="' + id.replace('ap-date', 'ap-adate') + '">' + esc(label) + '</label>' + input + '</div>'; }
    function formVals() {
      var v = function (i) { return ($('#' + i, dlg) || {}).value || ''; };
      return { date: v('ap-adate'), time: v('ap-time'), dur: v('ap-dur'), staff: v('ap-staff').trim(), buyer: { name: v('ap-name').trim(), phone: v('ap-phone').trim() }, reason: v('ap-reason').trim(), notes: v('ap-notes').trim() };
    }
    function apptWire() {
      var nm = $('#ap-name', dlg);
      if (nm) NS.suggest(nm, function () { return Promise.resolve(data.people.map(function (p) { return { name: p.buyer.name, phone: p.buyer.phone }; })); }, function (x) { return x.name + (x.phone ? ' · ' + x.phone : ''); }, function (p) { nm.value = p.name; $('#ap-phone', dlg).value = p.phone || ''; });
      slots();
    }
    /* conflict warning and the free times of the chosen day for that staff member */
    function slots() {
      var f = $('#ap-slots', dlg); if (!f) return;
      var v = formVals(), me = editing === 'new' ? { id: '' } : editing, probe = { type: 'appt', status: 'booked', id: me.id, date: v.date, time: v.time, dur: num(v.dur) || 15, staff: v.staff };
      var cl = v.time ? A.conflicts(data.appts.filter(function (a) { return !a.site || a.site === site; }), probe) : [];
      $('#ap-warn', dlg).textContent = cl.length ? t('ap.clash', { n: cl[0].buyer.name || '', t: A.clock(cl[0].time) }) : '';
      var free = A.freeSlots(data.appts.filter(function (a) { return !a.site || a.site === site; }).filter(function (a) { return a.id !== me.id; }), v.date, { open: hrs.open, close: hrs.close, step: hrs.step, dur: probe.dur, staff: v.staff, today: NS.today(), now: new Date().toTimeString().slice(0, 5) });
      f.innerHTML = '<small>' + esc(t('ap.free')) + '</small> ' + (free.length ? free.slice(0, 24).map(function (s) { return '<button type="button" class="btn sm chip" data-ap-slot="' + s + '">' + esc(A.clock(s)) + '</button>'; }).join('') : '<small>' + esc(t('ap.nofree')) + '</small>');
    }
    function saveAppt() {
      var v = formVals();
      if (!v.buyer.name) { NS.toast(t('ap.v.name'), 'bad'); $('#ap-name', dlg).focus(); return; }
      if (!v.date) { NS.toast(t('ap.v.date'), 'bad'); return; }
      var rec = editing === 'new' ? { type: 'appt', site: site, seller: { name: biz() }, status: 'booked' } : editing;
      Object.assign(rec, v);
      var probe = A.conflicts(data.appts.filter(function (a) { return !a.site || a.site === site; }), rec);
      if (probe.length && !confirm(t('ap.clash', { n: probe[0].buyer.name || '', t: A.clock(probe[0].time) }) + '\n\n' + t('ap.clashq'))) return;
      NSStore.put('doc', rec).then(function () { date = rec.date; editing = null; NS.toast(t('ap.saved')); return refresh(); }, function (e) { NS.toast(t('nosave', { e: e.message }), 'bad'); });
    }
    function setStatus(id, st) { var a = data.appts.filter(function (x) { return x.id === id; })[0]; if (!a) return Promise.resolve(); a.status = st; return NSStore.put('doc', a); }

    /* ---------- people ---------- */
    function drawPeople() {
      var q = key(($('#ap-q', dlg) || {}).value || dlg._q || ''), today = NS.today();
      var list = data.people.slice();
      /* people who have a bill but no record yet (the bill saves one, older bills may not have) */
      data.bills.forEach(function (b) { var k = A.personKey(b); if (key(b.buyer && b.buyer.name) && !list.some(function (p) { return ptKey(p) === k; })) list.push({ type: PT, virtual: 1, seller: b.seller, buyer: { name: b.buyer.name, phone: b.buyer.phone || '' } }); });
      list = list.filter(function (p) { return !q || (p.buyer.name + ' ' + p.buyer.phone + ' ' + (cfg.fields || []).map(function (f) { return p[f[0]] || ''; }).join(' ')).toLowerCase().indexOf(q) >= 0; })
        .sort(function (a, b) { return key(a.buyer.name).localeCompare(key(b.buyer.name)); });
      var h = '<div class="ap-bar"><input type="search" id="ap-q" placeholder="' + esc(t('ap.search')) + '" value="' + esc(dlg._q || '') + '" aria-label="' + esc(t('ap.search')) + '"><button type="button" class="btn sm primary" data-ap-pnew>' + esc(t(cfg.addKey)) + '</button><button type="button" class="btn sm" data-ap-pcsv>' + esc(t('ap.csv')) + '</button></div>';
      if (editing !== null && tab === 'people') h += personForm();
      h += '<p class="ap-sum">' + esc(t('ap.pcount', { n: list.length })) + '</p>';
      h += list.length ? '<ul class="ap-list">' + list.map(function (p) {
        var pk = ptKey(p), bs = billsOf(pk), last = bs[0], age = A.ageNow(p, today), id = p.id || 'v' + pk, plan = cfg.plans ? latestPlan(bs) : null;
        var extra = cfg.listExtra ? cfg.listExtra(p) : '';
        return '<li><div class="ap-main"><b>' + esc(p.buyer.name) + '</b>' + (age ? ' <small>' + esc(age) + '</small>' : '') + (p.sex ? ' <small>' + esc(t('sx.' + p.sex)) + '</small>' : '') + (p.buyer.phone ? ' <small dir="ltr">' + esc(p.buyer.phone) + '</small>' : '') +
          (plan ? ' ' + planPill(plan) : '') + '<br><small>' + esc(t('ap.nbills', { n: bs.length })) + (last ? ' · ' + esc(t('ap.last', { d: NS.fmtDate(last.date) })) : '') + '</small>' + extra + '</div><div class="ap-acts">' +
          '<button type="button" class="btn sm" data-ap-hist="' + esc(id) + '">' + esc(t('ap.history')) + '</button>' +
          '<button type="button" class="btn sm" data-ap-pappt="' + esc(id) + '">' + esc(t('ap.book')) + '</button>' +
          '<button type="button" class="btn sm" data-ap-pbill="' + esc(id) + '">' + esc(t(cfg.billKey)) + '</button>' +
          '<button type="button" class="btn sm" data-ap-pedit="' + esc(id) + '">' + esc(t('ap.edit')) + '</button></div>' +
          (openHist[id] ? histList(bs) : '') + '</li>';
      }).join('') + '</ul>' : '<p class="note">' + esc(t('ap.pnone')) + '</p>';
      return h;
    }
    function histList(bs) {
      return '<ul class="ap-hist">' + (bs.length ? bs.slice(0, 30).map(function (b) { return '<li><span class="mono">' + esc(b.no) + '</span> · ' + NS.fmtDate(b.date) + ' · ' + esc(cfg.histText ? cfg.histText(b) : '') + ' · ' + NS.money(b.total || 0) + ' <button type="button" class="btn sm" data-ap-open="' + b.id + '">' + esc(t('h.open')) + '</button></li>'; }).join('') : '<li>' + esc(t('h.none')) + '</li>') + '</ul>';
    }
    function personById(id) { if (/^v/.test(id)) { var pk = id.slice(1), b = data.bills.filter(function (x) { return A.personKey(x) === pk; })[0]; return b ? { type: PT, virtual: 1, seller: b.seller, buyer: { name: b.buyer.name, phone: b.buyer.phone || '' } } : null; } return data.people.filter(function (p) { return p.id === id; })[0] || null; }
    function personForm() {
      var p = editing === 'new' ? { buyer: { name: '', phone: '' } } : editing;
      return '<fieldset class="card ap-form"><legend>' + esc(t(cfg.addKey)) + '</legend><div class="fg">' +
        '<div class="f wide"><label for="pf-name">' + esc(t('ap.name')) + '</label><input id="pf-name" dir="auto" value="' + esc(p.buyer.name) + '"></div>' +
        '<div class="f"><label for="pf-phone">' + esc(t('l.phone')) + '</label><input id="pf-phone" type="tel" inputmode="tel" dir="ltr" value="' + esc(p.buyer.phone) + '"></div>' +
        (cfg.fields || []).map(function (f) {
          var id = 'pf-' + f[0], v = p[f[0]] == null ? '' : p[f[0]], o = f[3] || {};
          var inp = f[2] === 'area' ? '<textarea id="' + id + '" rows="2" dir="auto">' + esc(v) + '</textarea>' : f[2] === 'sel' ? '<select id="' + id + '">' + o.opts.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (String(v) === String(x[0]) ? ' selected' : '') + '>' + esc(t(x[1])) + '</option>'; }).join('') + '</select>' : '<input id="' + id + '" type="' + (f[2] || 'text') + '"' + (o.mode ? ' inputmode="' + o.mode + '"' : '') + ' dir="auto" value="' + esc(v) + '">';
          return '<div class="f' + (o.wide ? ' wide' : '') + '"><label for="' + id + '">' + esc(t(f[1])) + '</label>' + inp + '</div>';
        }).join('') + '</div><div class="btns"><button type="button" class="btn primary" data-ap-psave>' + esc(t('b.save')) + '</button><button type="button" class="btn" data-ap-stop>' + esc(t('ap.close2')) + '</button>' +
        (editing !== 'new' && !editing.virtual ? '<button type="button" class="btn danger" data-ap-pdel>' + esc(t('h.del')) + '</button>' : '') + '</div></fieldset>';
    }
    function peopleWire() { var q = $('#ap-q', dlg); if (q) q.addEventListener('input', function () { dlg._q = q.value; var pos = q.selectionStart; draw(); var n = $('#ap-q', dlg); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} }); }
    function savePerson() {
      var nm = ($('#pf-name', dlg).value || '').trim(); if (!nm) { NS.toast(t('ap.v.name'), 'bad'); return; }
      var rec = editing === 'new' || editing.virtual ? { type: PT, site: site, seller: { name: biz() } } : editing;
      rec.buyer = { name: nm, phone: ($('#pf-phone', dlg).value || '').trim() };
      (cfg.fields || []).forEach(function (f) { rec[f[0]] = ($('#pf-' + f[0], dlg).value || '').trim(); });
      if (cfg.fields.some(function (f) { return f[0] === 'age'; }) && rec.age && !rec.dob) rec.ageAt = rec.ageAt || NS.today();
      NSStore.put('doc', rec).then(function () { editing = null; NS.toast(t('ap.saved')); return refresh(); }, function (e) { NS.toast(t('nosave', { e: e.message }), 'bad'); });
    }

    /* ---------- renewals (memberships and packages) ---------- */
    function latestPlan(bs) { var l = bs.filter(function (b) { return b.mship && b.mship.to; }).sort(function (a, b) { return String(b.mship.to).localeCompare(String(a.mship.to)); })[0]; return l || null; }
    function planPill(rec) {
      var s = A.planState(rec, NS.today(), cfg.soon), ok = s.state === 'active' || s.state === 'upcoming';
      return '<span class="pill ' + (ok ? 'ok' : s.state === 'soon' ? 'mid' : '') + '">' + esc(t('ap.pl.' + s.state)) + (s.daysLeft != null && s.state !== 'expired' && s.state !== 'upcoming' ? ' · ' + esc(t('ap.dleft', { n: s.daysLeft })) : '') + '</span>';
    }
    function drawRenew() {
      var today = NS.today(), grace = lsGet('ns-grace-' + site, 60);
      var due = A.renewalsDue(data.bills, today, cfg.soon, grace, site);
      var h = '<p class="note">' + esc(t('ap.renewh', { n: cfg.soon || 7, g: grace })) + '</p><div class="btns"><button type="button" class="btn sm" data-ap-rcsv>' + esc(t('ap.csv')) + '</button></div>';
      h += due.length ? '<ul class="ap-list">' + due.map(function (x) {
        var d = x.d, s = x.s, ms = d.mship;
        return '<li class="' + (s.state === 'expired' ? 'ap-cancelled' : '') + '"><div class="ap-main"><b>' + esc(d.buyer.name) + '</b>' + (d.buyer.phone ? ' <small dir="ltr">' + esc(d.buyer.phone) + '</small>' : '') + ' ' + planPill(d) +
          '<br><small>' + esc(ms.plan || '') + ' · ' + esc(NS.fmtDate(ms.from)) + ' – ' + esc(NS.fmtDate(ms.to)) + (s.total ? ' · ' + esc(t('ap.sess', { l: Math.max(0, s.sessionsLeft), n: s.total })) : '') + '</small></div><div class="ap-acts">' +
          '<a class="btn sm" target="_blank" rel="noopener" href="' + A.waLink(d.buyer.phone, cfg.renewText(d, s)) + '">' + esc(t('ap.wa')) + '</a>' +
          '<button type="button" class="btn sm primary" data-ap-renew="' + d.id + '">' + esc(t('ap.renew')) + '</button></div></li>';
      }).join('') + '</ul>' : '<p class="note">' + esc(t('ap.norenew')) + '</p>';
      /* running plans: use a session */
      var run = A.latestPlans(data.bills, site).filter(function (d) { var s = A.planState(d, today, cfg.soon); return d.mship.sessions && (s.state === 'active' || s.state === 'soon'); });
      if (run.length) h += '<h3>' + esc(t('ap.running')) + '</h3><ul class="ap-list">' + run.map(function (d) {
        var s = A.planState(d, today, cfg.soon);
        return '<li><div class="ap-main"><b>' + esc(d.buyer.name) + '</b> ' + planPill(d) + '<br><small>' + esc(d.mship.plan || '') + ' · ' + esc(t('ap.sess', { l: Math.max(0, s.sessionsLeft), n: s.total })) + '</small></div><div class="ap-acts"><button type="button" class="btn sm" data-ap-use="' + d.id + '">' + esc(t('ap.usesess')) + '</button>' +
          ((d.used || []).length ? '<button type="button" class="btn sm" data-ap-unuse="' + d.id + '">' + esc(t('ap.unuse')) + '</button>' : '') + '</div></li>';
      }).join('') + '</ul>';
      return h;
    }

    /* ---------- a day's summary ---------- */
    function drawToday() {
      var rows = rowsOf(date), c = A.dayCounts(rows), from = dlg._from || date.slice(0, 8) + '01', to = dlg._to || date;
      var day = data.bills.filter(function (b) { return b.date === date; }), tot = 0, unpaid = 0;
      day.forEach(function (b) { tot += num(b.total); if (b.status !== 'paid') unpaid += num(b.total); });
      var staff = {}; if (cfg.byStaff) day.forEach(function (b) { cfg.byStaff(b).forEach(function (x) { staff[x[0] || t('ap.nostaff')] = (staff[x[0] || t('ap.nostaff')] || 0) + x[1]; }); });
      var h = '<div class="ap-bar"><input type="date" id="ap-day" value="' + date + '" aria-label="' + esc(t('l.date')) + '"><button type="button" class="btn sm" data-ap-day="0">' + esc(t('ap.today')) + '</button></div>';
      h += '<table class="ap-t"><tbody><tr><th>' + esc(t('ap.s.booked')) + '</th><td>' + c.booked + '</td></tr><tr><th>' + esc(t('ap.s.arrived')) + '</th><td>' + c.arrived + '</td></tr><tr><th>' + esc(t('ap.s.done')) + '</th><td>' + c.done + '</td></tr><tr><th>' + esc(t('ap.s.cancelled')) + ' / ' + esc(t('ap.s.noshow')) + '</th><td>' + (c.cancelled + c.noshow) + '</td></tr>' +
        '<tr class="grand"><th>' + esc(t('ap.billsday')) + '</th><td>' + day.length + ' · ' + NS.money(tot) + '</td></tr><tr><th>' + esc(t('ap.unpaid')) + '</th><td>' + NS.money(unpaid) + '</td></tr>' +
        Object.keys(staff).sort().map(function (k) { return '<tr><th>' + esc(k) + '</th><td>' + NS.money(staff[k]) + '</td></tr>'; }).join('') + '</tbody></table>';
      h += '<h3>' + esc(t('ap.range')) + '</h3><div class="ap-bar"><input type="date" id="ap-from" value="' + from + '" aria-label="' + esc(t('ap.from')) + '"><input type="date" id="ap-to" value="' + to + '" aria-label="' + esc(t('ap.to')) + '"><button type="button" class="btn sm" data-ap-bcsv>' + esc(t('ap.bcsv')) + '</button></div><p class="hint">' + esc(t('ap.privacy')) + '</p>';
      return h;
    }

    /* ---------- events ---------- */
    function onInput(e) {
      var el = e.target;
      if (el.id === 'ap-day' && e.type === 'change') { date = el.value || NS.today(); draw(); return; }
      if (el.id === 'ap-from') dlg._from = el.value; if (el.id === 'ap-to') dlg._to = el.value;
      if (/^ap-(open|close|step)$/.test(el.id)) { hrs = { open: $('#ap-open', dlg).value || '09:00', close: $('#ap-close', dlg).value || '18:00', step: Math.max(5, num($('#ap-step', dlg).value) || 15) }; lsSet('ns-hours-' + site, hrs); }
      if (el.closest && el.closest('.ap-form') && tab === 'appt') slots();
    }
    function onClick(e) {
      var b = e.target.closest('button,a'); if (!b) return; var g = function (n) { return b.getAttribute(n); };
      if (g('data-ap-tab')) { tab = g('data-ap-tab'); editing = null; return draw(); }
      if (g('data-ap-day') != null) { var n = +g('data-ap-day'); date = n ? A.addDays(date, n) : NS.today(); return draw(); }
      if (b.hasAttribute('data-ap-new')) { editing = 'new'; return draw(); }
      if (b.hasAttribute('data-ap-stop')) { editing = null; return draw(); }
      if (b.hasAttribute('data-ap-save')) return saveAppt();
      if (g('data-ap-slot')) { $('#ap-time', dlg).value = g('data-ap-slot'); return slots(); }
      if (g('data-ap-edit')) { editing = data.appts.filter(function (a) { return a.id === g('data-ap-edit'); })[0] || null; return draw(); }
      if (g('data-ap-st')) { var a = data.appts.filter(function (x) { return x.id === g('data-ap-st'); })[0]; if (a) setStatus(a.id, a.status === 'cancelled' || a.status === 'noshow' ? 'booked' : A.nextStatus(a.status)).then(draw); return; }
      if (g('data-ap-x')) { var c = data.appts.filter(function (x) { return x.id === g('data-ap-x'); })[0]; if (!c) return; if (c.status === 'cancelled') { if (confirm(t('b1.cdel', { x: c.buyer.name }))) NSStore.del('doc', c.id).then(refresh); return; } return setStatus(c.id, 'cancelled').then(draw); }
      if (g('data-ap-bill')) { var ap = data.appts.filter(function (x) { return x.id === g('data-ap-bill'); })[0]; if (ap) { var pp = findPerson(ap.buyer.name, ap.buyer.phone); dlg.close(); cfg.onBill({ name: ap.buyer.name, phone: ap.buyer.phone, person: pp, appt: ap }); } return; }
      if (b.hasAttribute('data-ap-rem')) { var tm = rowsOf(date); $('#ap-rem', dlg).innerHTML = '<ul class="ap-list">' + A.reminders(tm).map(function (a) { return '<li><div class="ap-main"><b>' + esc(a.buyer.name) + '</b> <small>' + esc(A.clock(a.time) || '') + '</small></div><div class="ap-acts"><a class="btn sm" target="_blank" rel="noopener" href="' + A.waLink(a.buyer.phone, cfg.remindText(a, NS.fmtDate(a.date))) + '">' + esc(t('ap.wa')) + '</a></div></li>'; }).join('') + '</ul>'; return; }
      if (b.hasAttribute('data-ap-csv')) { var all = data.appts.filter(function (a) { return !a.site || a.site === site; }).sort(function (x, y) { return (x.date + (x.time || '')).localeCompare(y.date + (y.time || '')); });
        return download('appointments-' + NS.today() + '.csv', A.csv(['Date', 'Time', 'Name', 'Phone', 'Duration (min)', cfg.staffEn, cfg.reasonEn, 'Status', 'Notes'], all.map(function (a) { return [a.date, a.time || '', a.buyer.name, a.buyer.phone, a.dur || '', a.staff, a.reason, a.status, a.notes || '']; }))); }
      /* people */
      if (b.hasAttribute('data-ap-pnew')) { editing = 'new'; return draw(); }
      if (b.hasAttribute('data-ap-psave')) return savePerson();
      if (b.hasAttribute('data-ap-pdel')) { if (editing && editing.id && confirm(t('b1.cdel', { x: editing.buyer.name }))) NSStore.del('doc', editing.id).then(function () { editing = null; return refresh(); }); return; }
      if (g('data-ap-pedit')) { editing = personById(g('data-ap-pedit')); return draw(); }
      if (g('data-ap-hist')) { openHist[g('data-ap-hist')] = !openHist[g('data-ap-hist')]; return draw(); }
      if (g('data-ap-open')) { var id = g('data-ap-open'); dlg.close(); return NSStore.get('doc', id).then(function (r) { if (r) K.openDoc(r, false); }); }
      if (g('data-ap-pappt')) { var p = personById(g('data-ap-pappt')); tab = 'appt'; editing = 'new'; draw(); if (p) { $('#ap-name', dlg).value = p.buyer.name; $('#ap-phone', dlg).value = p.buyer.phone || ''; slots(); } return; }
      if (g('data-ap-pbill')) { var q = personById(g('data-ap-pbill')); if (q) { dlg.close(); cfg.onBill({ name: q.buyer.name, phone: q.buyer.phone, person: q }); } return; }
      if (b.hasAttribute('data-ap-pcsv')) { var pl = data.people.slice().sort(function (x, y) { return key(x.buyer.name).localeCompare(key(y.buyer.name)); });
        return download(cfg.peopleFile + '-' + NS.today() + '.csv', A.csv(['Name', 'Phone'].concat(cfg.fields.map(function (f) { return f[4] || f[0]; })), pl.map(function (p) { return [p.buyer.name, p.buyer.phone].concat(cfg.fields.map(function (f) { return p[f[0]] || ''; })); }))); }
      /* renewals */
      if (g('data-ap-renew')) { var r = data.bills.filter(function (x) { return x.id === g('data-ap-renew'); })[0]; if (r) { dlg.close(); cfg.onBill({ name: r.buyer.name, phone: r.buyer.phone, renew: r }); } return; }
      if (g('data-ap-use') || g('data-ap-unuse')) { var uid = g('data-ap-use') || g('data-ap-unuse'), rec = data.bills.filter(function (x) { return x.id === uid; })[0]; if (!rec) return; rec.used = rec.used || []; if (g('data-ap-use')) { if (A.planState(rec, NS.today()).sessionsLeft <= 0) return NS.toast(t('ap.nosess'), 'bad'); rec.used.push(NS.today()); } else rec.used.pop(); NSStore.put('doc', rec).then(refresh); return; }
      if (b.hasAttribute('data-ap-rcsv')) { var due = A.renewalsDue(data.bills, NS.today(), cfg.soon, 365, site);
        return download('renewals-' + NS.today() + '.csv', A.csv(['Name', 'Phone', 'Plan', 'From', 'To', 'Sessions left', 'Status'], due.map(function (x) { return [x.d.buyer.name, x.d.buyer.phone, x.d.mship.plan, x.d.mship.from, x.d.mship.to, x.s.total ? Math.max(0, x.s.sessionsLeft) : '', x.s.state]; }))); }
      /* day summary export: the bills of a range */
      if (b.hasAttribute('data-ap-bcsv')) { var f1 = $('#ap-from', dlg).value, t1 = $('#ap-to', dlg).value, bl = data.bills.filter(function (x) { return (!f1 || x.date >= f1) && (!t1 || x.date <= t1); }).sort(function (x, y) { return String(x.date).localeCompare(String(y.date)) || String(x.no).localeCompare(String(y.no)); });
        return download(cfg.billsFile + '-' + (f1 || '') + '-' + (t1 || '') + '.csv', A.csv(['No', 'Date', 'Name', 'Phone', 'Total', 'Paid'].concat(cfg.csvHead || []), bl.map(function (x) { return [x.no, x.date, x.buyer.name, x.buyer.phone, x.total || 0, x.status === 'paid' ? 'Yes' : 'No'].concat(cfg.csvRow ? cfg.csvRow(x) : []); }))); }
    }

    return {
      open: open, load: load, data: function () { return data; },
      bar: function (KK) {
        return KK.card(t('ap.desk'), '<div class="row ap-deskbtns">' + tabs().map(function (x) { return '<button type="button" class="btn" data-ap-open-tab="' + x[0] + '">' + esc(t(x[1])) + '</button>'; }).join('') + '</div>');
      },
      wire: function (ed) { $$('[data-ap-open-tab]', ed).forEach(function (b) { b.addEventListener('click', function () { open(b.getAttribute('data-ap-open-tab')); }); }); },
      /* for the site file: a saved bill marks its appointment done and keeps the person's record up to date */
      doneAppt: function (id) { if (!id) return Promise.resolve(); return NSStore.get('doc', id).then(function (a) { if (a && a.status !== 'done') { a.status = 'done'; return NSStore.put('doc', a); } }); },
      upsertPerson: function (seller, buyer, extra) {
        var who = key(seller.name), pk = A.personKey({ buyer: buyer });
        return NSStore.list('doc').then(function (all) {
          var hit = all.filter(function (p) { return p.type === PT && key(p.seller && p.seller.name) === who && (A.personKey(p) === pk); })[0];
          var rec = Object.assign(hit || { type: PT, site: site, seller: { name: seller.name } }, { buyer: { name: buyer.name.trim(), phone: buyer.phone || (hit && hit.buyer.phone) || '' } });
          Object.keys(extra || {}).forEach(function (k) { if (extra[k] !== '' && extra[k] != null) rec[k] = extra[k]; });
          return NSStore.put('doc', rec);
        });
      },
      findPerson: function (seller, name, phone) {
        var who = key(seller.name), pk = A.personKey({ buyer: { name: name, phone: phone } });
        return NSStore.list('doc').then(function (all) { return all.filter(function (p) { return p.type === PT && key(p.seller && p.seller.name) === who && (A.personKey(p) === pk || key(p.buyer.name) === key(name)); })[0] || null; });
      }
    };
  };
})();
