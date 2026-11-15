/* NSBill: turns the text that in-browser OCR read from a photo of a supplier's bill into a purchase bill DRAFT (pure functions, node-testable).
   Nothing here saves anything: the App opens its normal purchase bill form with the draft, marks what is uncertain, and the user confirms every field.
   parse(text, ctx) -> { supplier:{name,gstin,state,match:'gstin'|'name'|'new', party}, no, date, items:[{desc,hsn,qty,rate,gst,amt}],
                         taxable, cgst, sgst, igst, total, round, gstRate, status:{field:'ok'|'check'|'missing'}, checks:[{id,level,a,b}] }
   ctx = { ownGstin, ownState, parties:[{name,gstin,state,role}], docs:[saved documents] }
   The text may be English, Hindi (Devanagari digits and labels) or mixed. OCR mistakes are expected: every number is cross-checked
   (lines against the taxable total, taxable + tax against the bill total, CGST = SGST, tax kind against the two states, check digit of the GSTIN). */
(function (G) {
  'use strict';
  var SLABS = [0, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28, 40];
  var UNITS = /^(nos?|pcs?|pc|kgs?|kg|gm|gms|g|ltr|ltrs|l|mtr|mtrs|m|bag|bags|box|boxes|set|sets|pkt|pkts|pair|pairs|doz|ton|tons|qtl|sqft|sq\.?ft|rft|bdl|bundle|roll|rolls|can|cans|drum|unit|units|each|ea|no\.?|नग|किलो|पीस|बैग|डिब्बा)\.?$/i;
  var STOP = /^(m\/s|ms|messrs|traders|trader|enterprises|enterprise|pvt|ltd|private|limited|co|and|&|the|store|stores|agency|agencies|industries|industry|company|corporation|sons|brothers|bros)$/i;
  var SKIP_LINE = /(gstin|gst\s*no|invoice|bill\s*no|date|dated|state|phone|ph\b|mob|email|e-mail|website|www\.|bank|a\/c|ifsc|terms|subject|jurisdiction|signature|signatory|declaration|thank|received|e\.?\s*&?\s*o\.?\s*e|authori[sz]ed|total|sub\s*total|taxable|cgst|sgst|utgst|igst|round|grand|payable|amount\s*in\s*words|rupees|only\b|pan\b|hsn|description|particulars|s\.?\s*no|sr\.?\s*no|qty|quantity|rate|amount|कुल|बिल|दिनांक|तारीख)/i;

  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function ascii(s) { return String(s == null ? '' : s).replace(/[०-९]/g, function (c) { return String(c.charCodeAt(0) - 0x0966); }).replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 0x0660); }); }
  function norm(s) { return ascii(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/₹|\bRs\.?\b|\bINR\b/gi, ' ').replace(/[|¦]/g, ' ').replace(/\r/g, ''); }
  function lines(text) { return norm(text).split('\n').map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean); }

  /* one number token: 1,23,456.50 ; 1234.5 ; OCR letters inside numbers (O 0, l 1, S 5) only when the token is mostly digits */
  function numTok(tok) {
    var s = String(tok).replace(/[,\s]/g, '').replace(/[()]/g, '');
    if (!s) return null;
    var digs = (s.match(/\d/g) || []).length;
    if (digs >= 2 && digs / s.length >= 0.6) s = s.replace(/[Oo]/g, '0').replace(/[lI|]/g, '1').replace(/S/g, '5');
    if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
    var n = parseFloat(s); return isFinite(n) ? n : null;
  }
  function numbers(line) {   /* every number on a line with its text, ignoring % tokens (returned apart) */
    var out = [], re = /(-?\d[\d,]*(?:\.\d+)?)(\s*%)?/g, m;
    while ((m = re.exec(line))) { var n = numTok(m[1]); if (n != null) out.push({ n: n, pct: !!m[2], raw: m[1], at: m.index }); }
    return out;
  }

  /* ---------- GSTIN ---------- */
  var CH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function gstinCheck(g) {
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(g)) return false;
    var sum = 0;
    for (var i = 0; i < 14; i++) { var v = CH.indexOf(g[i]) * (i % 2 ? 2 : 1); sum += Math.floor(v / 36) + (v % 36); }
    return CH[(36 - (sum % 36)) % 36] === g[14];
  }
  var D2L = { '0': 'O', '1': 'I', '5': 'S', '8': 'B', '2': 'Z' }, L2D = { O: '0', Q: '0', D: '0', I: '1', L: '1', S: '5', B: '8', Z: '2', G: '6' };
  function gstinFix(w) {   /* 15 characters: repair look-alike characters by position (digit places, letter places) */
    var o = '';
    for (var i = 0; i < 15; i++) {
      var c = w[i], digit = i < 2 || (i >= 7 && i <= 10);
      if (digit) o += /\d/.test(c) ? c : (L2D[c] || c);
      else if (i === 13) o += c === '2' || c === 'z' ? 'Z' : c;
      else if (i === 11 || (i >= 2 && i <= 6)) o += /[A-Z]/.test(c) ? c : (D2L[c] || c);
      else o += c;
    }
    return o;
  }
  var SHAPE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/, ALT = { '0': 'OQD', '1': 'IL', '2': 'Z', '5': 'S', '6': 'G', '8': 'B', O: '0', Q: '0', D: '0', I: '1', L: '1', Z: '2', S: '5', G: '6', B: '8' };
  /* a GSTIN that fails its check letter is repaired only when ONE change (a dropped extra character, or one look-alike character) makes the check letter right */
  function repair(w16) {
    var i, c, k, g;
    if (w16.length === 16) for (i = 0; i < 16; i++) { g = gstinFix(w16.slice(0, i) + w16.slice(i + 1)); if (SHAPE.test(g) && gstinCheck(g)) return g; }
    var w = w16.slice(0, 15);
    for (i = 0; i < 15; i++) { var alts = ALT[w[i]] || ''; for (k = 0; k < alts.length; k++) { g = gstinFix(w.slice(0, i) + alts[k] + w.slice(i + 1)); if (SHAPE.test(g) && gstinCheck(g)) return g; } }
    return '';
  }
  function findGstins(ls) {
    var out = [], seen = {};
    ls.forEach(function (l, li) {
      var w = l.toUpperCase().replace(/[^0-9A-Z]/g, ''), m = /GSTIN|GSTNO|GST/.exec(w);
      for (var i = 0; i + 15 <= w.length; i++) {
        var raw = w.slice(i, i + 15), g = gstinFix(raw), labelled = m && i >= m.index;   /* look-alike repair by position only on a line that says GSTIN */
        if (SHAPE.test(g) && (labelled || SHAPE.test(raw)) && !seen[g]) { seen[g] = 1; out.push({ g: g, ok: gstinCheck(g), line: li }); i += 14; continue; }
        /* a window that is nearly a GSTIN (right state digits and five letters) but fails: try one repair */
        if (labelled && /^[0-9OQDIL]{2}[A-Z0-9]{5}/.test(w.slice(i, i + 7))) {
          var f = repair(w.slice(i, i + 16));
          if (f && !seen[f]) { seen[f] = 1; out.push({ g: f, ok: true, fixed: true, line: li }); i += 14; }
        }
      }
    });
    return out;
  }

  /* ---------- date ---------- */
  var MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
  function iso(y, m, d) {
    if (y < 100) y += 2000;
    if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return '';
    var dt = new Date(Date.UTC(y, m - 1, d)); if (dt.getUTCMonth() !== m - 1) return '';
    return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }
  function dates(l) {
    var out = [], m, re = /(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{4}|\d{2})\b/g;
    while ((m = re.exec(l))) { var d = iso(+m[3], +m[2], +m[1]); if (d) out.push(d); }
    re = /(\d{1,2})(?:st|nd|rd|th)?[\s\-.,]*([A-Za-z]{3,9})[\s\-.,]*(\d{4}|\d{2})\b/g;
    while ((m = re.exec(l))) { var mo = MON[m[2].slice(0, 3).toLowerCase()]; if (mo && /^[A-Za-z]+$/.test(m[2])) { var d2 = iso(+m[3], mo, +m[1]); if (d2) out.push(d2); } }
    return out;
  }

  function snap(rate) {
    var best = null; SLABS.forEach(function (s) { if (best == null || Math.abs(s - rate) < Math.abs(best - rate)) best = s; });
    return Math.abs(best - rate) <= 0.35 ? best : null;
  }
  function lastNum(l) { var a = numbers(l).filter(function (x) { return !x.pct; }); return a.length ? a[a.length - 1] : null; }

  /* ---------- the parts ---------- */
  function findNo(ls) {
    var re = /(?:tax\s*invoice|invoice|inv|bill|receipt|challan|memo|बिल|इनवॉइस|चालान)[\s.]*(?:no|number|num|#|नं|संख्या|क्र)?[\s.:\-#]*([A-Z0-9][A-Z0-9\/\-.]{0,24})/i, best = '';
    for (var i = 0; i < ls.length; i++) {
      if (/gstin|gst\s*no|e-?way/i.test(ls[i]) && !/invoice|bill/i.test(ls[i])) continue;
      var m = re.exec(ls[i].replace(/\bdate.*$/i, ''));
      if (m && /\d/.test(m[1]) && !/^(date|dated|no|to|of)$/i.test(m[1]) && !dates(m[1]).length) { best = m[1].replace(/[.\-\/]+$/, ''); if (/(?:no|number|#|नं)/i.test(ls[i])) break; }
    }
    return best;
  }
  function findDate(ls) {
    var pref = '', any = '';
    ls.forEach(function (l) {
      var d = dates(l); if (!d.length) return;
      if (!any) any = d[0];
      if (!pref && /(date|dated|dt\b|दिनांक|तारीख)/i.test(l) && !/due|valid|expiry|exp\b|delivery|supply/i.test(l)) pref = d[0];
    });
    return { v: pref || any, certain: !!pref };
  }
  function findSupplierName(ls, gs) {
    var firstG = gs.length ? gs[0].line : ls.length;
    var cand = ls.slice(0, Math.max(3, Math.min(firstG + 1, 8))).filter(function (l) {
      return /[A-Za-zऀ-ॿ]{3}/.test(l) && !/^(tax\s*invoice|original|duplicate|triplicate|invoice|cash\s*memo|bill\s*of\s*supply|gst\s*invoice|\(?original|\(?duplicate)/i.test(l) && !/^(gstin|gst\s*no|invoice|bill\s*no|date|phone|mob|email|address|pan)\b/i.test(l);
    });
    var prefer = cand.filter(function (l) { return /(traders?|enterprises?|industries|pvt|ltd|store|stores|agency|agencies|& ?co|and co|sons|bros|corporation|works|steel|hardware|electric|medical|foods?|mart|motors|tools|company|मेसर्स|ट्रेडर्स|एंटरप्राइज)/i.test(l); })[0];
    var n = (prefer || cand[0] || '').replace(/^(m\/s\.?|messrs\.?|मेसर्स)\s*/i, '').replace(/[^\wऀ-ॿ&.,'\- ]/g, ' ').replace(/\s+/g, ' ').trim();
    return n.length > 60 ? n.slice(0, 60).trim() : n;
  }
  function tokens(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9ऀ-ॿ ]/g, ' ').split(/\s+/).filter(function (w) { return w.length >= 3 && !STOP.test(w); }); }
  function matchParty(parties, gs, ownG, text, nameGuess) {
    var sup = (parties || []).filter(function (p) { return p.role !== 'customer'; }), i, g;
    var cand = gs.filter(function (x) { return x.g !== ownG; });
    for (i = 0; i < cand.length; i++) {
      g = cand[i];
      var hit = sup.filter(function (p) { return String(p.gstin || '').toUpperCase().replace(/\s/g, '') === g.g; })[0] || (parties || []).filter(function (p) { return String(p.gstin || '').toUpperCase().replace(/\s/g, '') === g.g; })[0];
      if (hit) return { by: 'gstin', party: hit, g: g };
    }
    var low = String(text || '').toLowerCase(), best = null;
    sup.forEach(function (p) {
      var tk = tokens(p.name); if (!tk.length) return;
      var found = tk.filter(function (w) { return low.indexOf(w) >= 0; }).length;
      if (found === tk.length && (!best || tk.length > best.n)) best = { p: p, n: tk.length };
    });
    if (best) return { by: 'name', party: best.p, g: cand[0] || null };
    return { by: 'new', party: null, g: cand[0] || null };
  }

  /* an item row: the last number is the amount; two numbers before it multiply to the amount (qty x rate) */
  function itemRow(l) {
    var nums = numbers(l); if (nums.length < 3) return null;
    var pct = nums.filter(function (x) { return x.pct; }).map(function (x) { return x.n; })[0];
    var plain = nums.filter(function (x) { return !x.pct; });
    if (plain.length < 3) return null;
    var amt = plain[plain.length - 1], head = plain.slice(0, -1), hsn = '';
    var hi = -1; head.forEach(function (x, i) { if (hi < 0 && /^\d{4}(\d{2}(\d{2})?)?$/.test(x.raw.replace(/,/g, '')) && x.n >= 1000 && x.at > 3) hi = i; });
    var cands = head.map(function (x, i) { return { x: x, i: i }; }).filter(function (c) { return c.i !== hi && c.x.n > 0; });
    var best = null;
    for (var a = 0; a < cands.length; a++) for (var b = 0; b < cands.length; b++) {
      if (a === b) continue;
      var q = cands[a].x.n, r = cands[b].x.n;
      if (cands[a].x.at > cands[b].x.at) continue;   /* quantity stands left of the rate */
      var diff = Math.abs(q * r - amt.n);
      var tol = Math.max(1, amt.n * 0.006);
      if (diff <= tol && (!best || diff < best.diff - 1e-9 || (Math.abs(diff - best.diff) < 1e-9 && cands[b].x.at - cands[a].x.at < best.gap))) best = { q: q, r: r, diff: diff, gap: cands[b].x.at - cands[a].x.at, qa: cands[a].x, ra: cands[b].x };
    }
    if (!best) return null;
    if (hi >= 0) hsn = head[hi].raw.replace(/,/g, '');
    var first = Math.min(best.qa.at, hi >= 0 ? head[hi].at : 1e9, best.ra.at);
    var desc = l.slice(0, first).replace(/^\s*\d{1,3}(?:[.)\-]\s*|\s+)/, '').replace(/[\s:;,\-|]+$/, '').trim();
    var tail = l.slice(first).split(/\s+/);   /* a unit word right after the quantity: keep out of the description */
    if (!/[A-Za-zऀ-ॿ]{2}/.test(desc)) return null;
    var words = desc.split(' '); while (words.length > 1 && UNITS.test(words[words.length - 1])) words.pop(); desc = words.join(' ');
    return { desc: desc, hsn: hsn, qty: best.q, rate: best.r, gst: pct != null ? pct : null, amt: amt.n, unit: (tail.filter(function (w) { return UNITS.test(w); })[0] || '') };
  }

  function parse(text, ctx) {
    ctx = ctx || {};
    var ls = lines(text), all = ls.join('\n'), out = { status: {}, checks: [], items: [], supplier: { name: '', gstin: '', state: '', match: 'new', party: null } };
    var ownG = String(ctx.ownGstin || '').toUpperCase().replace(/\s/g, ''), gs = findGstins(ls);
    var nameGuess = findSupplierName(ls, gs.filter(function (x) { return x.g !== ownG; }));
    var m = matchParty(ctx.parties, gs, ownG, all, nameGuess), S = out.supplier;
    S.match = m.by; S.party = m.party;
    S.gstin = m.g ? m.g.g : (m.party && m.party.gstin) || '';
    S.name = m.party ? m.party.name : nameGuess;
    S.state = S.gstin && /^\d\d/.test(S.gstin) ? S.gstin.slice(0, 2) : (m.party && m.party.state) || '';
    out.status.party = m.by === 'gstin' ? 'ok' : m.by === 'name' ? 'check' : S.name ? 'check' : 'missing';
    out.status.gstin = !S.gstin ? 'missing' : (m.g && m.g.ok) || (m.by === 'gstin') ? 'ok' : 'check';
    if (S.gstin && m.g && !m.g.ok && m.by !== 'gstin') out.checks.push({ id: 'gstin', level: 'warn', a: S.gstin });

    out.no = findNo(ls); out.status.no = out.no ? 'check' : 'missing';
    var dt = findDate(ls); out.date = dt.v; out.status.date = !dt.v ? 'missing' : dt.certain ? 'ok' : 'check';

    /* labelled amounts: the number at the end of the line (not a % figure) */
    var lab = { taxable: [], cgst: [], sgst: [], igst: [], round: [], total: [], rate: { cgst: null, sgst: null, igst: null } };
    ls.forEach(function (l) {
      var low = l.toLowerCase(), v = lastNum(l);
      var pcts = numbers(l).filter(function (x) { return x.pct; }).map(function (x) { return x.n; });
      if (/round/.test(low) && v) { var neg = /-\s*\d/.test(l) || /\(\s*-?\d/.test(l); lab.round.push(neg ? -Math.abs(v.n) : v.n); return; }
      if (/\bigst\b|\bi\.?g\.?s\.?t\b/.test(low) && v) { lab.igst.push(v.n); if (pcts.length) lab.rate.igst = pcts[0]; return; }
      if (/\bcgst\b|central\s*(gst|tax)/.test(low) && v) { lab.cgst.push(v.n); if (pcts.length) lab.rate.cgst = pcts[0]; return; }
      if (/\b(sgst|utgst)\b|state\s*(gst|tax)/.test(low) && v) { lab.sgst.push(v.n); if (pcts.length) lab.rate.sgst = pcts[0]; return; }
      if (/taxable|before\s*tax|net\s*amount|कर\s*योग्य/.test(low) && v) { lab.taxable.push(v.n); return; }
      if (/(grand\s*total|total\s*amount|total\s*invoice|invoice\s*(total|value|amount)|net\s*payable|amount\s*payable|bill\s*amount|कुल\s*(राशि|योग)?|payable)/.test(low) && v && !/in\s*words|rupees/.test(low)) lab.total.push(v.n);
      else if (/^\s*total\b/.test(low) && v && !/qty|tax\b|gst/.test(low)) lab.total.push(v.n);
    });
    out.cgst = lab.cgst.length ? Math.max.apply(null, lab.cgst) : 0;
    out.sgst = lab.sgst.length ? Math.max.apply(null, lab.sgst) : 0;
    out.igst = lab.igst.length ? Math.max.apply(null, lab.igst) : 0;
    out.round = lab.round.length ? lab.round[0] : 0;

    /* item rows, between the header row and the totals */
    ls.forEach(function (l) { if (/^\s*(gstin|gst\s*no|gst|ph|phone|mob|pan|state|bill\s*to|ship\s*to|invoice|inv|date|e-?way|bank|a\/c|ifsc|vehicle|place)\b/i.test(l) || findGstins([l]).length) return; var it = itemRow(l); if (it && !/(cgst|sgst|igst|taxable|total|round)/i.test(l.slice(0, 30))) out.items.push(it); });
    var sumItems = r2(out.items.reduce(function (a, x) { return a + x.amt; }, 0));
    out.taxable = lab.taxable.length ? Math.max.apply(null, lab.taxable) : (out.items.length ? sumItems : 0);
    out.status.taxable = lab.taxable.length ? 'ok' : out.items.length ? 'check' : 'missing';
    var taxSum = r2(out.cgst + out.sgst + out.igst);
    var rawTotal = lab.total.length ? Math.max.apply(null, lab.total) : 0;
    out.total = rawTotal || (out.taxable ? r2(out.taxable + taxSum + out.round) : 0);
    out.status.total = rawTotal ? 'ok' : out.total ? 'check' : 'missing';

    /* GST rate per bill: from the printed rate, else from the tax shown against the taxable total */
    var rate = null, tp = lab.rate.cgst != null && lab.rate.sgst != null ? lab.rate.cgst + lab.rate.sgst : lab.rate.igst;
    if (tp != null) rate = snap(tp);
    if (rate == null && out.taxable > 0 && taxSum > 0) rate = snap(taxSum / out.taxable * 100);
    out.gstRate = rate;
    out.items.forEach(function (it) { if (it.gst == null || snap(it.gst) == null) it.gst = rate != null ? rate : 18; else it.gst = snap(it.gst); });

    /* ---- cross-checks ---- */
    var C = out.checks, ok = function (id, a, b) { C.push({ id: id, level: 'ok', a: a, b: b }); }, bad = function (id, lv, a, b) { C.push({ id: id, level: lv, a: a, b: b }); };
    if (!out.items.length) bad('noitems', 'warn');
    out.status.items = out.items.length ? 'check' : 'missing';
    if (lab.taxable.length && out.items.length) { if (Math.abs(sumItems - out.taxable) <= Math.max(1, out.taxable * 0.002)) ok('items_taxable', sumItems, out.taxable); else bad('items_taxable', 'bad', sumItems, out.taxable); }
    if (out.taxable && (taxSum || out.total)) {
      var calc = r2(out.taxable + taxSum), diff = r2(out.total - calc);
      if (rawTotal) {
        if (Math.abs(diff) <= 1.0 + 1e-9) { ok('total', calc, out.total); if (!out.round && Math.abs(diff) >= 0.005) out.round = diff; }
        else if (out.items.length && Math.abs(sumItems - out.total) <= 1 && taxSum > 0) bad('inclusive', 'warn', sumItems, out.total);   /* line amounts already include GST */
        else bad('total', 'bad', calc, out.total);
      }
    }
    if (out.cgst || out.sgst) { if (Math.abs(out.cgst - out.sgst) <= 0.02) ok('cgst_sgst', out.cgst, out.sgst); else bad('cgst_sgst', 'bad', out.cgst, out.sgst); }
    if (out.cgst + out.sgst > 0 && out.igst > 0) bad('both_taxes', 'bad');
    if (out.taxable > 0 && taxSum > 0) { if (rate != null) ok('rate', rate); else bad('rate', 'warn', r2(taxSum / out.taxable * 100)); }
    var os = String(ctx.ownState || '').slice(0, 2);
    if (S.state && os && taxSum > 0) {
      var inter = S.state !== os;
      if ((inter && (out.cgst || out.sgst) && !out.igst) || (!inter && out.igst && !(out.cgst || out.sgst))) bad('state_tax', 'warn', S.state, os); else ok('state_tax', S.state, os);
    }
    if (out.date && ctx.today && out.date > ctx.today) bad('future', 'warn', out.date);
    var dup = (ctx.docs || []).filter(function (d) {
      return d.type === 'pbill' && d.kind !== 'return' && out.no && String(d.no || '').toLowerCase() === out.no.toLowerCase() &&
        ((d.buyer && d.buyer.gstin && S.gstin && d.buyer.gstin === S.gstin) || (d.buyer && S.name && String(d.buyer.name || '').toLowerCase() === S.name.toLowerCase()));
    })[0];
    if (dup) bad('dup', 'bad', dup.no, dup.date);
    /* a bill whose line amounts do not add up to its taxable value is only a draft: mark every figure to check */
    if (C.some(function (c) { return c.level === 'bad'; })) { out.status.items = 'check'; out.status.total = out.status.total === 'ok' ? 'check' : out.status.total; }
    return out;
  }

  /* Hindi bills: the English reader gives the numbers and codes exactly, the Hindi reader gives the Hindi words. When the Hindi reading has
     as many item rows as the English one, each row's Devanagari words replace that item's description (marked hindi, so the form flags it). */
  function mergeHindi(p, hinText) {
    function digits(x) { return String(x).replace(/[^0-9]/g, ''); }
    var rows = lines(hinText).filter(function (l) { return /[ऀ-ॿ]{3}/.test(l) && /\d{3}/.test(l) && !/(बिल|दिनांक|चालान|कुल|राशि|total|gst)/i.test(l); });
    var used = {}, got = 0;
    function words(l) { var k = l.search(/[ऀ-ॿ]/); return l.slice(k).split(/[0-9]/)[0].replace(/[|¦_]+/g, ' ').replace(/\s+/g, ' ').trim(); }
    /* 1) a row whose numbers include this item's amount, rate or quantity-with-HSN is that item's row */
    p.items.forEach(function (it) {
      var want = [digits(it.amt.toFixed(2)), digits(it.rate.toFixed(2))];
      rows.forEach(function (l, j) {
        if (used[j] || it.hindi) return;
        var ds = numbers(l).map(function (x) { return digits(x.raw); });
        if (ds.some(function (d) { return d.length >= 4 && (d === want[0] || d === want[1] || d === digits(want[0].slice(0, -2))); }) && words(l).length >= 2) { used[j] = 1; it.desc = words(l); it.hindi = true; got++; }
      });
    });
    /* 2) what is left goes by order when the counts agree */
    var left = p.items.filter(function (it) { return !it.hindi; }), spare = rows.filter(function (l, j) { return !used[j]; });
    if (left.length && left.length === spare.length) left.forEach(function (it, i) { var d = words(spare[i]); if (d.length >= 2) { it.desc = d; it.hindi = true; got++; } });
    return got > 0;
  }

  /* the draft in the shape of the App's purchase bill form (app.js openForm 'pbill', option draft) */
  function toDraft(p) {
    var items = p.items.length ? p.items.map(function (x) { return { desc: x.desc, hsn: x.hsn, qty: x.qty, rate: x.rate, gst: x.gst }; })
      : [{ desc: '', hsn: '', qty: 1, rate: p.taxable || '', gst: p.gstRate != null ? p.gstRate : 18 }];
    return { buyer: { name: p.supplier.name, gstin: p.supplier.gstin, state: p.supplier.state }, no: p.no, date: p.date, items: items, round: true };
  }

  var API = { parse: parse, toDraft: toDraft, mergeHindi: mergeHindi, gstinCheck: gstinCheck, findGstins: findGstins, itemRow: itemRow, numTok: numTok, dates: dates, snap: snap };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSBill = API;
})(this);
