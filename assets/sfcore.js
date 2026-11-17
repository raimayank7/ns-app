/* NSSF: the merge rules of the SHARED FOLDER mode (pure functions, no browser needed: node scripts/test_sharedfolder.js).
   Several computers keep one folder (a Windows shared folder, or a OneDrive / Google Drive folder). Nothing here talks to the folder:
   sharedfolder.js reads and writes the files, this file decides what the records are.

   Every computer writes ONLY its own files:  entries/<device>/<yyyy-mm>.ndjson   (one operation per line, only ever added to).
   An operation (op):
     i  id "<device>-<n>"           d  device            n  number on that device (1, 2, 3 ...)
     h  clock (hybrid: never behind anything this device has seen, even when its own clock is wrong)
     s  store (biz party item doc meta log)   r  record id
     o  'p' = the record as saved (rec holds the whole record)   'x' = the record was deleted   'k' = a conflict was looked at (key)
     par  ids of the ops this edit was made on top of (what this computer had when the person pressed Save)
     ch  names of the fields that changed   cf  conflicts that were still open when this edit was made (so they are never lost)
     who  who was signed in   t  wall clock time (for the month file and for people to read)
   A record is the result of all its ops:
     - one newest op (nothing concurrent)                      -> that op
     - several ops made without knowing of each other (heads)  -> field by field against their common ancestor: a field changed by
       one side only is taken; changed by both with different values -> the later clock wins AND it is listed as a conflict
     - delete against an edit made without knowing of each other -> the record stays (the edit survives) and it is listed
   Nothing is ever dropped silently: every op stays in the files, and every lost value stays listed until someone looks at it. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.NSSF = factory();
})(this, function () {
  'use strict';
  var SYNC = { biz: 1, party: 1, item: 1, doc: 1, meta: 1, log: 1 };
  /* only these meta records are shared; the rest (lastBackup, pin, who, language ...) belongs to one computer */
  var META_OK = { settings: 1, groups: 1, heads: 1, staff: 1 };
  var MAX_CF = 20;

  function stable(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).sort().filter(function (k) { return v[k] !== undefined; }).map(function (k) { return JSON.stringify(k) + ':' + stable(v[k]); }).join(',') + '}';
  }
  function hash(v) {   /* FNV-1a twice with different seeds: 52 bits, enough to tell two versions of one record apart */
    var s = stable(v), a = 0x811c9dc5, b = 0x01000193 ^ 0x9e3779b9, i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      a ^= c; a = Math.imul(a, 16777619) >>> 0;
      b ^= c + i; b = Math.imul(b, 2246822519) >>> 0;
    }
    return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
  }
  function eq(a, b) { return stable(a) === stable(b); }
  function clone(v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); }
  function keyOf(store, rid) { return store + '/' + rid; }
  function cmpOp(a, b) { return a.h - b.h || (a.d < b.d ? -1 : a.d > b.d ? 1 : 0) || a.n - b.n; }
  function syncable(store, rec) {
    if (!SYNC[store] || !rec || typeof rec !== 'object' || rec.id == null || rec.sample) return false;
    return store !== 'meta' || !!META_OK[rec.id];
  }

  /* ---------- the clock ---------- */
  function Clock(h) { this.h = h || 0; }
  Clock.prototype.tick = function (now) { this.h = Math.max(now == null ? Date.now() : now, this.h + 1); return this.h; };
  /* an op from another computer: this clock never falls behind it (so an edit made after seeing it always sorts after it, even when this
     computer's own clock is wrong). A computer whose clock is far off is shown as a warning, see skew(). */
  Clock.prototype.see = function (h) { if (h > this.h) this.h = h; };

  /* ---------- the files: one JSON op per line ---------- */
  function validOp(o) {
    if (!o || typeof o !== 'object' || typeof o.i !== 'string' || typeof o.d !== 'string' || !(o.n >= 0) || !(o.h >= 0)) return false;
    if (o.o === 'k') return typeof o.key === 'string';
    if (!SYNC[o.s] || o.r == null) return false;
    if (o.o === 'x') return true;
    return o.o === 'p' && o.rec && typeof o.rec === 'object' && String(o.rec.id) === String(o.r) && (o.s !== 'meta' || !!META_OK[o.r]);
  }
  /* text from byte position `pos` on (file only grows). Returns the good ops, how many lines were not understood, and the new position:
     a last line without its end-of-line (the other computer is still writing, or the copy was cut) is left for next time */
  function parseNdjson(text, pos) {
    var ops = [], bad = 0, p = pos || 0, nl;
    while (p < text.length) {
      nl = text.indexOf('\n', p);
      if (nl < 0) {   /* no end of line: whole if it reads as JSON, otherwise wait */
        var tail = text.slice(p);
        try { var t = JSON.parse(tail); if (validOp(t)) { ops.push(t); p = text.length; } else { bad++; p = text.length; } } catch (e) {}
        break;
      }
      var line = text.slice(p, nl).trim(); p = nl + 1;
      if (!line) continue;
      try { var o = JSON.parse(line); if (validOp(o)) ops.push(o); else bad++; } catch (e) { bad++; }
    }
    return { ops: ops, bad: bad, pos: p };
  }
  function line(op) { return JSON.stringify(op) + '\n'; }
  function monthOf(t) { return new Date(t).toISOString().slice(0, 7); }
  function fileFor(op) { return 'entries/' + op.d + '/' + monthOf(op.t || op.h) + '.ndjson'; }

  /* ---------- the log: every op of every computer ---------- */
  function Log() { this.ops = {}; this.byRec = {}; this.acks = {}; this.bad = 0; this.devs = {}; }
  Log.prototype.add = function (op) {
    if (!validOp(op)) { this.bad++; return false; }
    if (this.ops[op.i]) return false;   /* the same op twice (a OneDrive copy of a file, a re-read): ignored */
    this.ops[op.i] = op;
    var d = this.devs[op.d] || (this.devs[op.d] = { n: 0, h: 0, t: 0 });
    if (op.n > d.n) d.n = op.n; if (op.h > d.h) d.h = op.h; if ((op.t || 0) > d.t) d.t = op.t;
    if (op.o === 'k') { this.acks[op.key] = op; return true; }
    var k = keyOf(op.s, op.r);
    (this.byRec[k] || (this.byRec[k] = [])).push(op);
    return true;
  };
  Log.prototype.addAll = function (ops) { var n = 0; for (var i = 0; i < ops.length; i++) if (this.add(ops[i])) n++; return n; };
  Log.prototype.heads = function (key) {
    var list = this.byRec[key]; if (!list) return [];
    var refs = {}; list.forEach(function (o) { (o.par || []).forEach(function (p) { refs[p] = 1; }); });
    return list.filter(function (o) { return !refs[o.i]; }).sort(cmpOp);
  };
  /* ids of the ops an op was made on, all the way back (only those that are here) */
  Log.prototype.ancestors = function (op) {
    var seen = {}, st = [op], me = this;
    while (st.length) { var o = st.pop(); if (!o || seen[o.i]) continue; seen[o.i] = 1; (o.par || []).forEach(function (p) { if (me.ops[p]) st.push(me.ops[p]); }); }
    return seen;
  };
  /* the newest saved version that both sides were made from (null when it is not here: the older file is missing, or was tidied away) */
  Log.prototype.base = function (op, others) {
    var mine = this.ancestors(op), common = {}, me = this, best = null;
    others.forEach(function (o) { var a = me.ancestors(o); Object.keys(a).forEach(function (id) { if (mine[id]) common[id] = 1; }); });
    Object.keys(common).forEach(function (id) { var c = me.ops[id]; if (c.o === 'p' && (!best || cmpOp(c, best) > 0)) best = c; });
    return best;
  };
  function cfKey(store, rid, field, a, b) { var x = hash(a), y = hash(b); return store + '/' + rid + '/' + field + '/' + (x < y ? x + '|' + y : y + '|' + x); }
  /* b (the later one) over a, against base. Returns the record and the fields where both sides had changed it differently */
  function merge2(a, b, base, opA, opB) {
    var out = {}, conf = [], keys = {}, k;
    Object.keys(a).forEach(function (x) { keys[x] = 1; }); Object.keys(b).forEach(function (x) { keys[x] = 1; });
    Object.keys(keys).forEach(function (f) {
      var va = a[f], vb = b[f], vo = base ? base[f] : undefined, pick;
      if (f === 'updated') pick = Math.max(va || 0, vb || 0);
      else if (f === 'created') pick = Math.min(va || Infinity, vb || Infinity);
      else if (eq(va, vb)) pick = va;
      else if (base && eq(va, vo)) pick = vb;
      else if (base && eq(vb, vo)) pick = va;
      else {
        pick = vb;
        conf.push({ kind: 'field', store: opB.s, rid: opB.r, field: f, a: clone(va), b: clone(vb), aWho: opA.who || '', bWho: opB.who || '', aT: opA.t, bT: opB.t, key: cfKey(opB.s, opB.r, f, va, vb), baseKnown: !!base });
      }
      if (pick !== undefined && pick !== Infinity) out[f] = clone(pick);
    });
    return { rec: out, conflicts: conf };
  }
  /* what the record is now: { dead } | { rec }, with the ids of the heads (the next edit is made on top of all of them) and the open conflicts */
  Log.prototype.resolve = function (key) {
    var heads = this.heads(key); if (!heads.length) return null;
    var ids = heads.map(function (o) { return o.i; });
    if (heads.length === 1) return heads[0].o === 'x' ? { dead: true, heads: ids, conflicts: [] } : { rec: clone(heads[0].rec), heads: ids, conflicts: [] };
    var puts = heads.filter(function (o) { return o.o === 'p'; }), dels = heads.filter(function (o) { return o.o === 'x'; });
    if (!puts.length) return { dead: true, heads: ids, conflicts: [] };
    var rec = clone(puts[0].rec), conflicts = [], acc = puts[0], me = this, prev = [puts[0]];
    for (var i = 1; i < puts.length; i++) {
      var b = puts[i], base = me.base(b, prev), m = merge2(rec, b.rec, base ? base.rec : null, acc, b);
      rec = m.rec; conflicts = conflicts.concat(m.conflicts); acc = b; prev.push(b);
    }
    dels.forEach(function (x) {
      conflicts.push({ kind: 'del', store: x.s, rid: x.r, field: '', who: x.who || '', t: x.t, key: x.s + '/' + x.r + '/del/' + x.i, editedBy: puts.map(function (p) { return p.who || ''; }).join(', ') });
    });
    return { rec: rec, heads: ids, conflicts: conflicts };
  };
  /* every conflict still to be looked at: those of records with several heads now, and those that were open when someone saved over them */
  Log.prototype.conflicts = function () {
    var out = [], seen = {}, me = this;
    function put(c) { if (seen[c.key] || me.acks[c.key]) return; seen[c.key] = 1; out.push(c); }
    Object.keys(this.byRec).forEach(function (k) {
      var list = me.byRec[k];
      if (list.length > 1) { var r = me.resolve(k); if (r && r.conflicts) r.conflicts.forEach(put); }
      list.forEach(function (o) { (o.cf || []).forEach(put); });
    });
    return out;
  };
  Log.prototype.keys = function () { return Object.keys(this.byRec); };

  /* ---------- one computer ---------- */
  /* state = { seen: { store: { rid: { hash, heads: [op ids] } } }, seq: last op number, h: last clock }. It belongs to this computer only (never to a backup). */
  function Replica(dev, who, state) {
    this.dev = dev; this.who = who || '';
    state = state || {};
    this.pending = []; this.seen = state.seen || {}; this.seq = state.seq || 0; this.clock = new Clock(state.h || 0);
    this.log = new Log();
  }
  Replica.prototype.state = function () { return { seen: this.seen, seq: this.seq, h: this.clock.h }; };
  Replica.prototype.setWho = function (w) { this.who = w || ''; };
  /* ops read from the folder (this computer's own included: after a restart they bring seq and clock back) */
  Replica.prototype.ingest = function (ops, now) {
    var n = 0, me = this;
    ops.forEach(function (o) {
      if (me.log.add(o)) { n++; me.clock.see(o.h); if (o.d === me.dev && o.n > me.seq) me.seq = o.n; }
    });
    return n;
  };
  Replica.prototype.mk = function (fields, now) {
    var n = ++this.seq, op = { i: this.dev + '-' + n, d: this.dev, n: n, h: this.clock.tick(now), who: this.who, t: now == null ? Date.now() : now };
    for (var k in fields) op[k] = fields[k];
    return op;
  };
  Replica.prototype.ack = function (key, now) { var op = this.mk({ o: 'k', key: key }, now); this.log.add(op); this.pending.push(op); return op; };
  /* Save pressed on a record: the op for it. Used by the cycle, and by the conflict screen. */
  Replica.prototype.putOp = function (store, rec, now) {
    var key = keyOf(store, rec.id), s = (this.seen[store] || {})[rec.id], par = s ? s.heads.slice() : [];
    var prev = s && s.heads.length ? this.log.resolve(key) : null, ch = [];
    var before = prev && prev.rec || {};
    Object.keys(Object.assign({}, before, rec)).forEach(function (f) { if (!eq(before[f], rec[f])) ch.push(f); });
    var f = { s: store, r: String(rec.id), o: 'p', rec: clone(rec), par: par, ch: ch.slice(0, 60) };
    if (prev && prev.heads.length > 1) { var cf = this.log.conflicts().filter(function (c) { return c.store === store && String(c.rid) === String(rec.id); }); if (cf.length) f.cf = cf.slice(0, MAX_CF); }
    var op = this.mk(f, now);
    this.log.add(op);
    (this.seen[store] || (this.seen[store] = {}))[rec.id] = { hash: hash(rec), heads: [op.i] };
    return op;
  };
  Replica.prototype.delOp = function (store, rid, now) {
    var s = (this.seen[store] || {})[rid];
    var op = this.mk({ s: store, r: String(rid), o: 'x', par: s ? s.heads.slice() : [] }, now);
    this.log.add(op);
    if (this.seen[store]) delete this.seen[store][rid];
    return op;
  };
  /* The whole round, given this computer's records now: local = { store: [records] }.
       1. what was saved or deleted here since last time becomes ops (to be appended to this computer's file)
       2. what the log says the records are (all computers) is compared with what is here: the actions to make here
     opts.confirmDeletes: allow a big delete batch.  Returns { ops, actions, held, conflicts }. */
  Replica.prototype.cycle = function (local, opts, now) {
    opts = opts || {}; var me = this, ops = this.pending.splice(0), actions = [], held = 0, localMap = {};
    Object.keys(SYNC).forEach(function (st) {
      localMap[st] = {}; (local[st] || []).forEach(function (r) { if (syncable(st, r)) localMap[st][r.id] = r; });
    });
    /* 1a. new or changed here */
    Object.keys(localMap).forEach(function (st) {
      Object.keys(localMap[st]).forEach(function (rid) {
        var r = localMap[st][rid], s = (me.seen[st] || {})[rid], h = hash(r);
        if (s && s.hash === h) return;
        if (!s) {   /* never seen here: if the log already says exactly this, adopt it; else it is new here (or an old copy: written as concurrent, so nothing is overwritten) */
          var res = me.log.resolve(keyOf(st, rid));
          if (res && !res.dead && hash(res.rec) === h) { (me.seen[st] || (me.seen[st] = {}))[rid] = { hash: h, heads: res.heads }; return; }
        }
        if (st === 'log' && s) return;   /* the audit log is only ever added to */
        ops.push(me.putOp(st, r, now));
      });
    });
    /* 1b. gone from here (the log store is never deleted from) */
    var gone = [], total = 0;
    Object.keys(this.seen).forEach(function (st) {
      if (st === 'log') return;
      Object.keys(me.seen[st]).forEach(function (rid) { total++; if (!localMap[st] || !localMap[st][rid]) gone.push([st, rid]); });
    });
    if (gone.length && gone.length > Math.max(5, total * 0.2) && !opts.confirmDeletes) held = gone.length;
    else gone.forEach(function (g) { ops.push(me.delOp(g[0], g[1], now)); });
    /* 2. what the log says */
    this.log.keys().forEach(function (k) {
      var i = k.indexOf('/'), st = k.slice(0, i), rid = k.slice(i + 1), res = me.log.resolve(k);
      if (!res) return;
      var cur = localMap[st] && localMap[st][rid], s = (me.seen[st] || (me.seen[st] = {}))[rid];
      var unchanged = cur && s && s.hash === hash(cur);
      if (res.dead) {
        if (cur && unchanged) { actions.push({ act: 'del', store: st, id: cur.id }); delete me.seen[st][rid]; }
        else if (!cur && s && !held) delete me.seen[st][rid];
        return;
      }
      var h = hash(res.rec);
      if (!cur) { if (s && held) return; actions.push({ act: 'put', store: st, rec: res.rec }); me.seen[st][rid] = { hash: h, heads: res.heads }; return; }
      if (hash(cur) === h) { me.seen[st][rid] = { hash: h, heads: res.heads }; return; }
      if (unchanged) { actions.push({ act: 'put', store: st, rec: res.rec }); me.seen[st][rid] = { hash: h, heads: res.heads }; }
      /* changed here after step 1 (typing right now): left for the next round */
    });
    return { ops: ops, actions: actions, held: held, conflicts: this.log.conflicts() };
  };
  /* an action could not be done (storage busy): forget that it was, so the next round tries again */
  Replica.prototype.undoSeen = function (store, rid) { if (this.seen[store]) delete this.seen[store][rid]; };

  /* ---------- documents numbered twice ---------- */
  function dupNumbers(docs) {
    var by = {}, out = [];
    (docs || []).forEach(function (d) {
      if (!d || !d.no || d.counter) return;
      var k = [d.type, String(d.seller && d.seller.name || '').trim().toLowerCase(), String(d.no).trim().toUpperCase()].join('|');
      (by[k] || (by[k] = [])).push(d);
    });
    Object.keys(by).forEach(function (k) { if (by[k].length > 1) out.push({ no: by[k][0].no, type: by[k][0].type, docs: by[k].map(function (d) { return { id: d.id, date: d.date, who: d.by || '' }; }) }); });
    return out;
  }
  /* the letter that makes this computer's invoice numbers its own: INV/26-27/A001. devices = [{id, tag, joined}] from the devices folder. */
  var LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   /* no I or O (look like 1 and 0) */
  function pickTag(devices, me) {
    var taken = {};
    devices.forEach(function (d) { if (d.id !== me && d.tag) taken[d.tag] = 1; });
    for (var i = 0; i < LETTERS.length; i++) if (!taken[LETTERS[i]]) return LETTERS[i];
    for (var j = 0; j < LETTERS.length; j++) for (var k = 0; k < LETTERS.length; k++) if (!taken[LETTERS[j] + LETTERS[k]]) return LETTERS[j] + LETTERS[k];
    return 'Z' + me.slice(-3).toUpperCase();
  }
  /* two computers took the same letter at the same moment: the one that joined later (then the larger id) takes another for FUTURE numbers */
  function mustRepick(devices, me) {
    var mine = devices.filter(function (d) { return d.id === me; })[0];
    if (!mine || !mine.tag) return true;
    return devices.some(function (d) {
      return d.id !== me && d.tag === mine.tag && ((d.joined || 0) < (mine.joined || 0) || ((d.joined || 0) === (mine.joined || 0) && d.id < me));
    });
  }
  /* how far a computer's clock is from the others: ops of the last hour whose wall time is far from the newest clock seen */
  function skew(log, dev, now) {
    var d = log.devs[dev]; return d && d.t ? d.t - now : 0;
  }
  /* the next number of a series, as the makers work it out: prefix = "INV/26-27/" + this computer's letter; only numbers that start with the
     whole prefix count, so every computer counts its own series */
  var AUTO_NO = /^[A-Z]+\/\d\d-\d\d\/[A-Z]{0,3}\d+$/;
  function nextNumber(nos, prefix, digits) {
    var max = 0;
    (nos || []).forEach(function (n) { n = String(n || ''); if (n.indexOf(prefix) !== 0) return; var m = n.match(/(\d+)\s*$/); if (m) max = Math.max(max, +m[1]); });
    return prefix + String(max + 1).padStart(digits || 3, '0');
  }
  function activeDevices(devices, now, mins) { return devices.filter(function (d) { return now - (d.last || 0) <= (mins || 10) * 60000; }); }

  /* ---------- roles: a convenience lock, not security (anyone who can open the folder can read and change its files) ---------- */
  var CAN = { owner: { bill: 1, del: 1, settings: 1, fin: 1, backup: 1, team: 1, conflicts: 1 }, staff: { bill: 1, conflicts: 1 } };
  function can(role, cap) { return !!(CAN[role] && CAN[role][cap]); }
  var STAFF_HIDDEN = ['fin', 'fam', 'capl', 'acx', 'stf', 'grp'];   /* App sections a staff member does not see */
  function blockedHash(role, hash) { return role === 'staff' && STAFF_HIDDEN.indexOf(String(hash || '').replace(/^#/, '').split('/')[0]) >= 0; }
  var STAFF_NO_META = { settings: 1, pin: 1, groups: 1, heads: 1, sf: 1 };
  function denied(role, op, store, id) { return role === 'staff' && (op === 'del' || (store === 'meta' && !!STAFF_NO_META[id])); }

  return {
    SYNC: SYNC, META_OK: META_OK, stable: stable, hash: hash, eq: eq, clone: clone, Clock: Clock, Log: Log, Replica: Replica, merge2: merge2,
    parseNdjson: parseNdjson, line: line, fileFor: fileFor, monthOf: monthOf, validOp: validOp, syncable: syncable,
    dupNumbers: dupNumbers, pickTag: pickTag, mustRepick: mustRepick, activeDevices: activeDevices, nextNumber: nextNumber, AUTO_NO: AUTO_NO, skew: skew,
    can: can, blockedHash: blockedHash, denied: denied, STAFF_HIDDEN: STAFF_HIDDEN
  };
});
