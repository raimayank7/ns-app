/* Shared folder mode (App and My data, computers with Chrome or Edge).
   Several computers keep one folder (a Windows shared folder, or a OneDrive / Google Drive folder). Each computer writes only its own
   files there (entries/<computer>/<month>.ndjson) and reads everybody's; the merge rules are in sfcore.js. Every computer also keeps its
   own copy of all records in its browser, as always, so the App stays fast and keeps working when the folder is out of reach.
   Off by default. When off, nothing in this file runs and nothing about saving changes.
   The folder is chosen by a TOP-LEVEL page of the App (or My data), like the auto save folder (core.js): a browser only asks for it there.
   Roles (owner PIN, staff PINs) are a convenience lock for everyday use. They are NOT security: anyone who can open the folder can read it. */
(function () {
  'use strict';
  var C = window.NSSF;
  if (!C || !window.NS) return;
  var NS = window.NS, T = function (k, v) { return NS.t(k, v); }, E = function (s) { return NS.esc(s); };

  /* ---------- the engine: no page, no NSStore in here, so it can be run twice in one test page ---------- */
  /* o = { dir: () => Promise<DirectoryHandle|null>, kv: { get(k), set(k, v) }, store: { list(s), put(s, rec), del(s, id), meta(k, v?) },
           now(), onEvent(name), who(), perm(handle) => Promise<'granted'|...> } */
  function create(o) {
    var now = o.now || Date.now, rep = null, dev = null, devInfo = null, team = null, teamRev = 0, locked = false;
    var fileCache = {}, st = { state: 'off', last: 0, users: 0, devices: [], conflicts: [], dups: [], held: 0, copies: 0, bad: 0, skew: [], err: '' };
    var newOps = 0, dirty = true, timer = 0, queued = false, running = null, lastDocs = [], lastLocal = {}, confirmDel = false;
    var held = {}, editing = {}, claimQ = Promise.resolve(), lastBeat = 0, beatDirty = false;

    function sub(dir, names, make) {   /* entries/<id>: walk down, creating when asked */
      return names.reduce(function (p, n) { return p.then(function (d) { return d.getDirectoryHandle(n, { create: !!make }); }); }, Promise.resolve(dir));
    }
    function readText(fh) { return fh.getFile().then(function (f) { return f.text().then(function (t) { return { text: t, size: f.size, mod: f.lastModified }; }); }); }
    function tryRead(dir, names, file) {
      return sub(dir, names, false).then(function (d) { return d.getFileHandle(file); }).then(readText).then(function (r) { return r.text; }, function () { return null; });
    }
    function writeWhole(dir, names, file, text) {
      return sub(dir, names, true).then(function (d) { return d.getFileHandle(file, { create: true }); }).then(function (fh) { return fh.createWritable(); })
        .then(function (w) { return w.write(text).then(function () { return w.close(); }); });
    }
    function appendTo(dir, names, file, text) {
      return sub(dir, names, true).then(function (d) { return d.getFileHandle(file, { create: true }); }).then(function (fh) {
        return fh.getFile().then(function (f) {
          /* a file that does not end with a line break (cut by a crash or a copy): start on a new line, so the next op is never glued to the broken one */
          return (f.size ? f.slice(f.size - 1).text() : Promise.resolve('\n')).then(function (last) {
            return fh.createWritable({ keepExistingData: true }).then(function (w) { return w.seek(f.size).then(function () { return w.write((last === '\n' ? '' : '\n') + text); }).then(function () { return w.close(); }); });
          });
        });
      });
    }
    function eachEntry(dh, fn) {   /* async iterator over a directory */
      var it = dh.values(), out = [];
      return (function step() { return it.next().then(function (r) { if (r.done) return out; out.push(r.value); return step(); }); })();
    }

    /* ---- this computer ---- */
    function uid(n) { var s = '', a = 'abcdefghjkmnpqrstuvwxyz23456789'; for (var i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
    function loadDev() {
      return o.kv.get('sfdev').then(function (d) {
        if (!d || !d.id) { d = { id: 'c' + uid(6), inst: uid(10), name: '', joined: now() }; return o.kv.set('sfdev', d).then(function () { return d; }); }
        return d;
      });
    }
    /* two computers with one id (a browser profile copied): the folder says someone else is using it -> take a new id */
    function checkInst(dir) {
      return tryRead(dir, ['devices'], dev.id + '.json').then(function (t) {
        var j = null; try { j = t && JSON.parse(t); } catch (e) {}
        if (j && j.inst && j.inst !== dev.inst && now() - (j.last || 0) < 3600e3) {
          dev = { id: 'c' + uid(6), inst: uid(10), name: dev.name, joined: now() };
          return o.kv.set('sfdev', dev).then(function () { return o.kv.set('sfstate', null); }).then(function () { rep = null; });
        }
      });
    }
    function loadRep() {
      if (rep) return Promise.resolve();
      return Promise.all([o.kv.get('sfstate'), o.store.meta('sf-vault')]).then(function (r) {
        var s = r[0] || {}, vault = r[1];
        function build(v) {
          /* the records here are not the ones this state was made for (a backup restored, browser data cleared): start the "what I have seen" list over,
             so nothing missing here is taken as deleted */
          if (s.vault !== v) s = { seq: s.seq || 0, h: s.h || 0, seen: {}, vault: v };
          rep = new C.Replica(dev.id, o.who ? o.who() : '', s); rep.vault = v; fileCache = {};
        }
        if (vault) return build(vault);
        var v = 'v' + uid(10); return o.store.meta('sf-vault', v).then(function () { build(v); });
      });
    }

    /* ---- read everything the others wrote ---- */
    function readEntries(dir) {
      return sub(dir, [], false).then(function (root) {
        return root.getDirectoryHandle('entries').then(function (ent) {
          return eachEntry(ent).then(function (devs) {
            var jobs = [];
            devs.forEach(function (dd) {
              if (dd.kind !== 'directory') return;
              jobs.push(eachEntry(dd).then(function (files) {
                return Promise.all(files.filter(function (f) { return f.kind === 'file' && /\.ndjson$/i.test(f.name); }).map(function (f) {
                  var key = dd.name + '/' + f.name;
                  return f.getFile().then(function (file) {
                    var c = fileCache[key];
                    if (c && c.size === file.size && c.mod === file.lastModified) return 0;
                    return file.text().then(function (text) {
                      var pos = c && c.size <= file.size ? c.pos : 0, r = C.parseNdjson(text, pos);
                      fileCache[key] = { size: file.size, mod: file.lastModified, pos: r.pos };
                      st.bad += r.bad;
                      if (!/^\d{4}-\d\d\.ndjson$/.test(f.name)) st.copies++;   /* "2026-11 (1).ndjson", "...-PCNAME.ndjson": a copy made by the sync program */
                      var k = rep.ingest(r.ops, now()); newOps += k; return k;
                    });
                  }, function () { return 0; });
                }));
              }));
            });
            return Promise.all(jobs);
          });
        }, function () { return []; });   /* no entries folder yet: first computer */
      });
    }
    function readDevices(dir) {
      return sub(dir, [], false).then(function (root) {
        return root.getDirectoryHandle('devices').then(function (dd) {
          return eachEntry(dd).then(function (fs) {
            return Promise.all(fs.filter(function (f) { return f.kind === 'file' && /\.json$/.test(f.name); }).map(function (f) {
              return readText(f).then(function (r) { try { return JSON.parse(r.text); } catch (e) { return null; } }, function () { return null; });
            }));
          });
        }, function () { return []; });
      }).then(function (l) { return l.filter(function (x) { return x && x.id; }); });
    }
    function readTeam(dir) {
      return tryRead(dir, [], 'team.json').then(function (t) { try { var j = t && JSON.parse(t); if (j && (j.rev || 0) >= teamRev) { team = j; teamRev = j.rev || 0; } } catch (e) {} });
    }

    /* ---- one round ---- */
    function cycle(dir, opts) {
      var stores = ['biz', 'party', 'item', 'doc', 'meta', 'log'];
      newOps = 0;
      return (opts && opts.beatOnly && lastLocal.doc ? Promise.resolve() : readEntries(dir)).then(function () { return readDevices(dir); }).then(function (devices) {
        /* a poll with nothing new in the folder and nothing saved here: only the heartbeat (the work grows with the number of records) */
        if ((opts && opts.poll && !dirty && !newOps || opts && opts.beatOnly) && lastLocal.doc) return { out: { ops: [], actions: [], held: st.held, conflicts: st.conflicts }, devices: devices };
        return readTeam(dir).then(function () {
          if (o.who) rep.setWho(o.who());
          return Promise.all(stores.map(function (s) { return o.store.list(s); })).then(function (lists) {
            var local = {}; stores.forEach(function (s, i) { local[s] = lists[i] || []; });
            local.meta = local.meta.filter(function (r) { return C.META_OK[r.id]; });
            lastLocal = local; lastDocs = local.doc;
            Object.keys(held).forEach(function (k) { if (lastDocs.some(function (d) { return d.no === held[k].no; })) delete held[k]; });   /* saved: the number is used now */
            var out = rep.cycle(local, { confirmDeletes: confirmDel || (opts && opts.confirmDeletes) }, now());
            confirmDel = false; dirty = false;
            /* write what this computer did, then change the records here */
            var byFile = {};
            out.ops.forEach(function (op) { var f = C.fileFor(op); (byFile[f] || (byFile[f] = [])).push(op); });
            return Promise.all(Object.keys(byFile).map(function (f) {
              var p = f.split('/'); return appendTo(dir, [p[0], p[1]], p[2], byFile[f].map(C.line).join(''));
            })).then(function () {
              var seq = Promise.resolve();
              out.actions.forEach(function (a) {
                seq = seq.then(function () { return a.act === 'put' ? o.store.put(a.store, a.rec) : o.store.del(a.store, a.id); }).catch(function () { rep.undoSeen(a.store, a.rec ? a.rec.id : a.id); });
              });
              return seq.then(function () { return { out: out, devices: devices, wrote: out.ops.length }; });
            });
          });
        });
      }).then(function (r) {
        /* the folder says who is here: heartbeat (also: which bill each computer is editing), and the letter in letters mode */
        var devices = r.devices.filter(function (d) { return d.id !== dev.id; });
        var mine = r.devices.filter(function (d) { return d.id === dev.id; })[0] || {};
        var tag = '';
        if (numbering() === 'letters') {
          tag = mine.tag || '';
          if (!tag || C.mustRepick(r.devices.concat(mine.id ? [] : [{ id: dev.id, tag: tag, joined: dev.joined }]), dev.id)) tag = C.pickTag(devices, dev.id);
        }
        var edit = []; Object.keys(editing).forEach(function (k) { edit.push({ id: editing[k].id, no: editing[k].no }); });
        devInfo = { v: 1, id: dev.id, inst: dev.inst, name: dev.name || '', tag: tag, joined: dev.joined, last: now(), who: o.who ? o.who() : '', ops: rep.seq, edit: edit };
        var due = !(opts && opts.poll) || r.wrote || beatDirty || now() - lastBeat > 10000;   /* a quick poll rewrites the heartbeat file only every 10 s */
        var show = function () {
          var all = devices.concat([devInfo]);
          st.devices = all; st.users = C.activeDevices(all, now(), 10).length; st.tag = tag; st.numbering = numbering();
          st.live = devices.filter(function (d) { return now() - (d.last || 0) < 45000; }).length;
          st.conflicts = r.out.conflicts; st.held = r.out.held; st.dups = C.dupNumbers(lastDocs); st.reserved = reservedList();
          st.state = r.out.held ? 'hold' : 'ok'; st.last = now(); st.err = '';
          if (o.setTag) o.setTag(tag);
        };
        if (!due) { show(); return; }
        beatDirty = false; lastBeat = now();
        return writeWhole(dir, ['devices'], dev.id + '.json', JSON.stringify(devInfo)).then(function () {
          show();
          var s = rep.state(); s.vault = rep.vault;
          /* the file's own "modified" time is set by the folder's computer or by this one: a big difference to this clock means the clock is wrong */
          return o.kv.set('sfstate', s).then(function () { return sub(dir, ['devices'], false).then(function (d) { return d.getFileHandle(dev.id + '.json'); }).then(function (fh) { return fh.getFile(); }); })
            .then(function (f) { st.clockOff = Math.round((f.lastModified - now()) / 60000); }, function () {});
        });
      });
    }
    function run(opts) {
      if (running) { queued = true; return running; }
      running = Promise.resolve().then(function () { return o.dir(); }).then(function (h) {
        if (!h) { st.state = 'off'; return; }
        return o.perm(h).then(function (p) {
          if (p !== 'granted') { st.state = 'ask'; return; }
          return (dev ? Promise.resolve() : loadDev().then(function (d) { dev = d; })).then(function () { return checkInst(h); }).then(function () { return loadRep(); }).then(function () { return cycle(h, opts); });
        });
      }).catch(function (e) { st.state = 'err'; st.err = String(e && e.message || e); }).then(function () {
        running = null; if (o.onEvent) o.onEvent('status');
        if (queued) { queued = false; return run(); }
      });
      return running;
    }
    /* ---- one common series: numbers reserved live (see sfcore.js claimNumber) ---- */
    function cfgv() { var r = (lastLocal.meta || []).filter(function (x) { return x.id === 'sfcfg'; })[0]; return r && r.v || {}; }
    function numbering() { return cfgv().numbering === 'letters' ? 'letters' : 'common'; }
    function settleMs() { return cfgv().slow ? 2000 : 700; }
    function reservedList() { return Object.keys(held).map(function (k) { return held[k].no; }); }
    function heldSet(sid) { var s = {}; Object.keys(held).forEach(function (k) { if (held[k].sid === sid) s[held[k].n] = 1; }); return s; }
    function claimIo(dir) {
      return {
        list: function (series) { return sub(dir, ['numbers', series], true).then(function (d) { return eachEntry(d).then(function (es) { return es.filter(function (e) { return e.kind === 'file'; }).map(function (e) { return e.name; }); }); }); },
        put: function (series, name) {
          return sub(dir, ['numbers', series], true).then(function (d) { return d.getFileHandle(name, { create: true }); })
            .then(function (fh) { return fh.createWritable(); }).then(function (w) { return w.write(String(now())).then(function () { return w.close(); }); });
        },
        del: function (series, name) { return sub(dir, ['numbers', series], true).then(function (d) { return d.removeEntry(name); }).catch(function () {}); },
        wait: function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
      };
    }
    function dropHeld(owner, h) {
      var e = held[owner]; if (!e) return Promise.resolve();
      delete held[owner];
      if (lastDocs.some(function (d) { return d.no === e.no; })) return Promise.resolve();   /* a bill has it: the number stays used */
      return claimIo(h).del(e.sid, e.name);
    }
    function doClaim(a) {
      return Promise.resolve().then(function () { return o.dir(); }).then(function (h) {
        if (!h) return null;
        return o.perm(h).then(function (p) {
          if (p !== 'granted') return null;
          return (dev && rep ? Promise.resolve() : run()).then(function () {
            if (!dev || numbering() !== 'common') return null;
            var sid = C.seriesDir(a.scope, a.prefix), cur = held[a.owner], used = {};
            (a.nos || []).forEach(function (no) { var n = C.tailNum(no); if (n) used[n] = 1; });
            /* this form already has a number reserved in this series and no bill took it yet: the same number again */
            if (cur && cur.sid === sid && !used[cur.n]) return cur.no;
            return dropHeld(a.owner, h).then(function () { return readDevices(h); }).then(function (devs) {
              var by = {}, t = now(); devs.forEach(function (d) { by[d.id] = d; });
              var fresh = function (id) { if (id === dev.id) return true; var d = by[id]; return !d || t - (d.last || 0) < 180000; };
              return C.claimNumber(claimIo(h), { series: sid, me: dev.id, used: used, held: heldSet(sid), fresh: fresh, settle: settleMs() }).then(function (n) {
                var no = a.prefix + String(n).padStart(a.digits || 3, '0');
                held[a.owner] = { sid: sid, n: n, no: no, name: C.claimName(n, dev.id) };
                st.reserved = reservedList(); return no;
              });
            });
          });
        });
      });
    }
    function claim(a) {   /* a = { owner, scope, prefix, digits, nos }; null = no common number (mode off, letters mode, folder out of reach): the maker numbers as usual */
      claimQ = claimQ.then(function () { return doClaim(a); }).catch(function (e) { st.err = String(e && e.message || e); return null; });
      return claimQ;
    }
    function release(owner) {
      /* read the bills again first: a bill saved a moment ago has used its number and must keep it */
      return Promise.all([o.dir(), o.store.list('doc')]).then(function (r) { if (r[1]) lastDocs = r[1]; return r[0] ? dropHeld(owner, r[0]) : null; }).then(function () { st.reserved = reservedList(); }, function () {});
    }
    function setEditing(owner, id, no) {
      if (id) editing[owner] = { id: id, no: no || '' }; else delete editing[owner];
      beatDirty = true; return run({ poll: true });
    }
    function editorOf(id) {
      var t = now(), hit = null;
      (st.devices || []).forEach(function (d) {
        if (hit || !dev || d.id === dev.id || t - (d.last || 0) > 90000) return;
        if ((d.edit || []).some(function (e) { return String(e.id) === String(id); })) hit = { name: d.name || d.id, who: d.who || '' };
      });
      return hit;
    }
    function soon(ms) { dirty = true; clearTimeout(timer); timer = setTimeout(run, ms == null ? 1200 : ms); }

    return {
      run: run, soon: soon, status: function () { return st; }, team: function () { return team; }, setTeam: function (t, dir) { t.rev = (teamRev || 0) + 1; team = t; teamRev = t.rev; return writeWhole(dir, [], 'team.json', JSON.stringify(t)); },
      device: function () { return dev; }, setName: function (n) { return loadDev().then(function (d) { dev = d; dev.name = n; return o.kv.set('sfdev', dev); }); },
      claim: claim, release: release, setEditing: setEditing, editorOf: editorOf, numbering: numbering, reserved: reservedList,
      ack: function (key) { rep.ack(key); return run(); }, confirmDeletes: function () { confirmDel = true; return run(); },
      replica: function () { return rep; }, local: function () { return lastLocal; },
      reset: function () { rep = null; dev = null; fileCache = {}; st.state = 'off'; return o.kv.set('sfstate', null); },
      label: function (store, rid) {
        var r = (lastLocal[store] || []).filter(function (x) { return String(x.id) === String(rid); })[0];
        return r ? (r.no ? r.no + (r.buyer && r.buyer.name ? ' · ' + r.buyer.name : '') : r.name || r.desc || String(rid)) : String(rid);
      }
    };
  }

  /* ---------- this page: the real folder, the real browser storage ---------- */
  var FOLDER_DB = 'ns-folder';
  function kdb() { return new Promise(function (res, rej) { var r = indexedDB.open(FOLDER_DB, 1); r.onupgradeneeded = function () { r.result.createObjectStore('h'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  var kv = {
    get: function (k) { return kdb().then(function (d) { return new Promise(function (res) { var q = d.transaction('h').objectStore('h').get(k); q.onsuccess = function () { res(q.result); }; q.onerror = function () { res(null); }; }); }); },
    set: function (k, v) { return kdb().then(function (d) { return new Promise(function (res) { var t = d.transaction('h', 'readwrite'); v == null ? t.objectStore('h').delete(k) : t.objectStore('h').put(v, k); t.oncomplete = res; t.onerror = res; }); }); }
  };
  var SS = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} } };
  var curTag = null;
  function setTag(t) { t = t || ''; if (t === curTag) return; curTag = t; NSStore.meta('sf-tag', t || null).catch(function () {}); try { if (t) localStorage.setItem('ns-sf-tag', t); else localStorage.removeItem('ns-sf-tag'); } catch (e) {} }
  var pageStore = {
    list: function (s) { return NSStore._call('list', { store: s }).then(function (r) { return r || []; }, function () { return []; }); },
    put: function (s, rec) { return NSStore._call('put', { store: s, value: rec }); },
    del: function (s, id) { return NSStore._call('del', { store: s, id: id }); },
    meta: function (k, v) { return arguments.length < 2 ? NSStore.meta(k) : NSStore.meta(k, v); }
  };
  function role() { return SS.get('ns-sf-role') || ''; }
  function who() { return SS.get('ns-sf-who') || ''; }

  var eng = null, On = false, dirH = null;
  function pageEngine() {
    if (eng) return eng;
    eng = create({
      dir: function () { return dirH ? Promise.resolve(dirH) : kv.get('sfdir').then(function (h) { dirH = h || null; return dirH; }); },
      kv: kv, store: pageStore, who: who, setTag: setTag,
      perm: function (h) { return h.queryPermission({ mode: 'readwrite' }); },
      onEvent: function (n) { if (n === 'status') { afterRun(); } }
    });
    return eng;
  }
  function afterRun() {
    document.dispatchEvent(new CustomEvent('ns-sf'));
    var s = eng.status();
    if (s.state === 'ok' || s.state === 'hold') { document.dispatchEvent(new CustomEvent('ns-data')); }
    bar(s.state === 'ask' ? 'sfd.paused' : null);
    gate();
  }
  var barOn = null;
  function bar(key) {
    var b = NS.$('#ns-sfbar');
    if (!key) { if (b) b.remove(); return; }
    if (b || !document.body || window.top !== window) return;
    b = NS.el('div', { id: 'ns-sfbar', class: 'remind', role: 'status' });
    b.innerHTML = '<div class="wrap"><span></span><button type="button" class="btn" data-sf="allow"></button></div>';
    NS.$('span', b).textContent = T(key); NS.$('button', b).textContent = T('sfd.allow');
    var at = NS.$('#main') || document.body; at.insertBefore(b, at.firstChild);
  }

  /* ---------- roles ---------- */
  function b64(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
  function unb64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function hashPin(pin, salt) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' }, k, 256);
    }).then(b64);
  }
  function mkPin(pin) { var salt = crypto.getRandomValues(new Uint8Array(16)); return hashPin(pin, salt).then(function (h) { return { salt: b64(salt), hash: h }; }); }
  function chkPin(rec, pin) { return rec ? hashPin(pin, unb64(rec.salt)).then(function (h) { return h === rec.hash; }) : Promise.resolve(false); }
  function applyRole(r, name) {
    SS.set('ns-sf-role', r); SS.set('ns-sf-who', name);
    document.documentElement.classList.toggle('sf-staff', r === 'staff');
    /* the name written into the edit history: the staff member's; the owner keeps whatever name was typed in Settings */
    if (r === 'staff') {
      if (SS.get('ns-sf-prev') == null) NSStore.meta('who').then(function (w) { SS.set('ns-sf-prev', w || ''); NSStore.meta('who', name).catch(function () {}); }, function () {});
      else NSStore.meta('who', name).catch(function () {});
      guardHash();
    } else if (SS.get('ns-sf-prev') != null) { var pw = SS.get('ns-sf-prev'); SS.set('ns-sf-prev', null); NSStore.meta('who', pw).catch(function () {}); }
    document.dispatchEvent(new CustomEvent('ns-sf'));
  }
  /* sign out: the role is forgotten and the name in the edit history goes back to what was typed in Settings */
  function clearRole() {
    SS.set('ns-sf-role', null); SS.set('ns-sf-who', null); document.documentElement.classList.toggle('sf-staff', false);
    var pw = SS.get('ns-sf-prev'); if (pw != null) { SS.set('ns-sf-prev', null); NSStore.meta('who', pw).catch(function () {}); }
  }
  function guardHash() { if (C.blockedHash('staff', location.hash)) location.hash = '#home'; }
  window.addEventListener('hashchange', function () { if (role() === 'staff') guardHash(); });
  var wrong = 0, waitUntil = 0;
  /* sign-in box: shown on the App page when the folder is shared and an owner PIN is set */
  function gate() {
    if (!On || window.top !== window || role() || NS.$('#ns-sfgate')) return;
    var tm = eng && eng.team();
    if (!tm || !tm.owner) { applyRole('owner', T('sfd.g.owner')); return; }   /* nobody set a PIN yet: everybody is the owner */
    var d = NS.el('dialog', { id: 'ns-sfgate', class: 'sf-gate', 'aria-labelledby': 'sf-g-h' });
    var names = [{ v: '', t: T('sfd.g.owner') }].concat((tm.staff || []).map(function (s, i) { return { v: String(i + 1), t: s.name }; }));
    d.innerHTML = '<form novalidate><h2 id="sf-g-h"></h2><div class="f"><label for="sf-g-who"></label><select id="sf-g-who"></select></div>' +
      '<div class="f"><label for="sf-g-pin"></label><input id="sf-g-pin" type="password" inputmode="numeric" maxlength="8" autocomplete="off" dir="ltr"></div>' +
      '<p class="sf-msg" aria-live="assertive"></p><button type="submit" class="btn primary"></button></form>';
    NS.$('h2', d).textContent = T('sfd.g.t'); NS.$('label[for=sf-g-who]', d).textContent = T('sfd.g.who'); NS.$('label[for=sf-g-pin]', d).textContent = T('sfd.pin');
    NS.$('button', d).textContent = T('sfd.g.go');
    NS.$('select', d).innerHTML = names.map(function (n) { return '<option value="' + E(n.v) + '">' + E(n.t) + '</option>'; }).join('');
    document.body.appendChild(d); d.showModal ? d.showModal() : d.setAttribute('open', '');
    d.addEventListener('cancel', function (e) { e.preventDefault(); });
    NS.$('form', d).addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = NS.$('.sf-msg', d), v = NS.$('select', d).value, pin = NS.$('#sf-g-pin', d).value;
      if (Date.now() < waitUntil) { msg.textContent = T('sfd.g.wait', { n: Math.ceil((waitUntil - Date.now()) / 1000) }); return; }
      var rec = v ? (tm.staff || [])[+v - 1] : tm.owner;
      chkPin(rec, pin).then(function (ok) {
        if (ok) { wrong = 0; applyRole(v ? 'staff' : 'owner', v ? rec.name : T('sfd.g.owner')); d.close(); d.remove(); return; }
        wrong++; NS.$('#sf-g-pin', d).value = ''; msg.textContent = T('sfd.g.wrong');
        if (wrong >= 5) { waitUntil = Date.now() + 30000; wrong = 0; msg.textContent = T('sfd.g.wait', { n: 30 }); }
      });
    });
  }

  /* ---------- turning it on and off ---------- */
  var SUPPORT = function () { return NS.folderSupported && NS.folderSupported(); };
  function choose() {
    if (!NS.folderHere()) { NS.folderHome(); return Promise.reject(new Error('elsewhere')); }
    var pick = window.__sfPick || function () { return window.showDirectoryPicker({ id: 'ns-shared', mode: 'readwrite', startIn: 'documents' }); };
    return pick().then(function (h) {
      dirH = h;
      return kv.set('sfdir', h).then(function () { return NSStore.meta('sf', { on: true, name: h.name, since: Date.now() }); }).then(function () { On = true; return pageEngine().run(); });
    });
  }
  function allow() {
    return kv.get('sfdir').then(function (h) { return h ? h.requestPermission({ mode: 'readwrite' }).then(function (p) { return p === 'granted' ? pageEngine().run() : null; }) : null; });
  }
  function stop() {
    On = false; dirH = null; setTag('');
    return Promise.all([kv.set('sfdir', null), NSStore.meta('sf', null)]).then(function () { return eng ? eng.reset() : null; }).then(function () { clearRole(); bar(null); document.dispatchEvent(new CustomEvent('ns-sf')); });
  }

  /* ---------- the tab in My data ---------- */
  function ago(ts) {
    if (!ts) return T('sfd.never');
    var m = Math.round((Date.now() - ts) / 60000);
    return m < 1 ? T('sfd.just') : m < 60 ? T('sfd.ago.m', { n: m }) : T('sfd.ago.h', { n: Math.round(m / 60) });
  }
  function shortV(v) { var s = typeof v === 'string' ? v : v === undefined ? '' : JSON.stringify(v); return s.length > 60 ? s.slice(0, 57) + '...' : s || '—'; }
  function conflictRow(c) {
    var lab = eng.label(c.store, c.rid);
    if (c.kind === 'del') return '<li><span>' + E(T('sfd.c.del', { rec: lab, who: c.who || '?' })) + '</span><span class="sf-act"><button type="button" class="btn sm" data-sf="ack" data-k="' + E(c.key) + '">' + E(T('sfd.keep')) + '</button>' +
      (role() !== 'staff' ? '<button type="button" class="btn sm danger" data-sf="deleteit" data-k="' + E(c.key) + '" data-s="' + E(c.store) + '" data-r="' + E(c.rid) + '">' + E(T('sfd.del')) + '</button>' : '') + '</span></li>';
    return '<li><span>' + E(T('sfd.c.f', { rec: lab, field: c.field, a: shortV(c.a), aw: c.aWho || '?', b: shortV(c.b), bw: c.bWho || '?' })) + '</span><span class="sf-act">' +
      '<button type="button" class="btn sm" data-sf="ack" data-k="' + E(c.key) + '">' + E(T('sfd.keep')) + '</button>' +
      '<button type="button" class="btn sm" data-sf="useother" data-k="' + E(c.key) + '" data-s="' + E(c.store) + '" data-r="' + E(c.rid) + '" data-f="' + E(c.field) + '">' + E(T('sfd.use')) + '</button></span></li>';
  }
  function panelHtml() {
    if (!SUPPORT()) return '<p class="note">' + E(T('sfd.no')) + '</p>';
    var s = eng ? eng.status() : { state: 'off' }, h = '<p>' + E(T('sfd.p')) + '</p>';
    if (!On) {
      return h + '<p class="soft">' + E(T('sfd.safe')) + '</p><div class="md-bar"><button type="button" class="btn primary" data-sf="choose">' + E(T('sfd.choose')) + (NS.folderHere() ? '' : ' ↗') + '</button></div>';
    }
    var dot = s.state === 'ok' ? 'on' : s.state === 'err' || s.state === 'hold' || s.state === 'ask' ? 'warn' : '';
    h += '<dl class="md-stat"><div><dt>' + E(T('sfd.folder')) + '</dt><dd><i class="md-dot ' + dot + '"></i><bdi class="mono">' + E(dirH ? dirH.name : '') + '</bdi></dd></div>' +
      '<div><dt>' + E(T('sfd.st')) + '</dt><dd>' + E(s.state === 'ask' ? T('sfd.paused') : s.state === 'err' ? T('sfd.err', { e: s.err }) : T('sfd.synced', { when: ago(s.last) })) + (s.users > 1 ? ' · ' + E(T('sfd.users', { n: s.users })) : s.last ? ' · ' + E(T('sfd.user1')) : '') + '</dd></div>' +
      '<div><dt>' + E(T('sfd.signed')) + '</dt><dd>' + E(who() || T('sfd.g.owner')) + (role() === 'staff' ? '' : '') + '</dd></div></dl>' +
      '<div class="md-bar"><button type="button" class="btn sm primary" data-sf="sync">' + E(T('sfd.sync')) + '</button>' + (s.state === 'ask' ? '<button type="button" class="btn sm" data-sf="allow">' + E(T('sfd.allow')) + '</button>' : '') +
      (role() && team() && team().owner ? '<button type="button" class="btn sm" data-sf="switch">' + E(T('sfd.switch')) + '</button>' : '') +
      (role() !== 'staff' ? '<button type="button" class="btn sm danger" data-sf="stop">' + E(T('sfd.stop')) + '</button>' : '') + '</div>';
    if (s.held) h += '<p class="note bad">' + E(T('sfd.held', { n: s.held })) + ' <button type="button" class="btn sm" data-sf="confirmdel">' + E(T('sfd.held.ok')) + '</button></p>';
    if (Math.abs(s.clockOff || 0) >= 3) h += '<p class="note bad">' + E(T('sfd.skew', { m: Math.abs(s.clockOff) })) + '</p>';
    if (s.copies) h += '<p class="soft">' + E(T('sfd.copies', { n: s.copies })) + '</p>';
    h += '<h3>' + E(T('sfd.conf.t', { n: s.conflicts.length })) + '</h3>' + (s.conflicts.length ? '<ul class="sf-list">' + s.conflicts.slice(0, 50).map(conflictRow).join('') + '</ul>' : '<p class="soft">' + E(T('sfd.conf.none')) + '</p>');
    if (s.dups.length) h += '<h3>' + E(T('sfd.dup.t')) + '</h3><ul class="sf-list">' + s.dups.map(function (d) { return '<li><span>' + E(T('sfd.dup', { no: d.no, n: d.docs.length })) + '</span></li>'; }).join('') + '</ul>';
    var dv = eng.device() || {}, tag = s.tag || '';
    h += numHtml(s);
    h += '<h3>' + E(T('sfd.comp')) + '</h3><div class="f"><label for="sf-name">' + E(T('sfd.comp.n')) + '</label><input id="sf-name" data-sf-name maxlength="30" value="' + E(dv.name || '') + '"><small class="hint">' + E(T('sfd.comp.h')) + '</small></div>' +
      (tag ? '<p class="soft">' + E(T('sfd.series', { tag: tag })) + ' ' + E(T('sfd.sites')) + '</p>' : '') +
      '<ul class="sf-list">' + (s.devices || []).map(function (d) { return '<li><span><b>' + E(d.name || d.id) + '</b> · ' + E(d.who || '') + (d.tag ? ' · ' + E(d.tag) : '') + '</span><span class="soft">' + E(ago(d.last)) + '</span></li>'; }).join('') + '</ul>';
    if (role() !== 'staff') h += rolesHtml();
    return h + '<p class="soft">' + E(T('sfd.limits')) + '</p>';
  }
  function team() { return eng && eng.team(); }
  /* bill numbers: one common series (default) or a letter for every computer */
  function numHtml(s) {
    var mode = s.numbering === 'letters' ? 'letters' : 'common', dis = role() === 'staff' ? ' disabled' : '';
    var h = '<h3>' + E(T('sfd.num.t')) + '</h3><div class="sf-num" role="radiogroup" aria-label="' + E(T('sfd.num.t')) + '">' +
      '<label class="sf-opt"><input type="radio" name="sfnum" data-sf-num="common"' + (mode === 'common' ? ' checked' : '') + dis + '> <span><b>' + E(T('sfd.num.common')) + '</b><small class="hint">' + E(T('sfd.num.common.h')) + '</small></span></label>' +
      '<label class="sf-opt"><input type="radio" name="sfnum" data-sf-num="letters"' + (mode === 'letters' ? ' checked' : '') + dis + '> <span><b>' + E(T('sfd.num.letters')) + '</b><small class="hint">' + E(T('sfd.num.letters.h')) + '</small></span></label></div>';
    if (mode === 'common') {
      h += '<label class="sf-opt"><input type="checkbox" data-sf-slow' + (cfgNow().slow ? ' checked' : '') + dis + '> <span>' + E(T('sfd.num.slow')) + '</span></label>';
      var res = (s.reserved || []);
      h += '<p class="soft">' + E(res.length ? T('sfd.reserved', { list: res.join(', ') }) : T('sfd.reserved.none')) + '</p>';
    }
    return h;
  }
  var cfgCache = {};
  function cfgNow() { return cfgCache; }
  function loadCfg() { return NSStore.meta('sfcfg').then(function (v) { cfgCache = v || {}; return cfgCache; }, function () { return cfgCache; }); }
  function rolesHtml() {
    var tm = team() || {}, h = '<h3>' + E(T('sfd.roles.t')) + '</h3><p class="soft">' + E(T('sfd.roles.p')) + '</p>';
    h += '<form class="sf-form" data-sf-owner novalidate><div class="f"><label for="sf-op">' + E(T(tm.owner ? 'sfd.owner.new' : 'sfd.owner.pin')) + '</label><input id="sf-op" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password" dir="ltr"></div><button type="submit" class="btn sm">' + E(T('sfd.set')) + '</button></form>';
    if (tm.owner) {
      h += '<ul class="sf-list">' + (tm.staff || []).map(function (s, i) { return '<li><span>' + E(s.name) + '</span><button type="button" class="btn sm" data-sf="rmstaff" data-i="' + i + '">' + E(T('sfd.remove')) + '</button></li>'; }).join('') + '</ul>' +
        '<form class="sf-form" data-sf-staff novalidate><div class="f"><label for="sf-sn">' + E(T('sfd.staff.name')) + '</label><input id="sf-sn" maxlength="30"></div><div class="f"><label for="sf-sp">' + E(T('sfd.pin')) + '</label><input id="sf-sp" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password" dir="ltr"></div><button type="submit" class="btn sm">' + E(T('sfd.staff.add')) + '</button></form>';
    }
    return h;
  }
  function render() {
    var pane = NS.$('[data-md-pane="sf"]');
    if (!pane) return;
    loadCfg().then(function () {
      if (NS.$('[data-md-pane="sf"]') !== pane) return;
      /* a round every few seconds must not wipe what is being typed (a PIN, the name of this computer) */
      var ae = document.activeElement;
      if (ae && pane.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.type !== 'radio' && ae.type !== 'checkbox') return;
      var html = panelHtml(); if (html === NS.sfHtml && pane.innerHTML) return;
      NS.sfHtml = pane.innerHTML = html; wireName();
    });
    return;
  }
  function wireName() {
    var pane = NS.$('[data-md-pane="sf"]'); if (!pane) return;

    var again = NS.$('#sf-name'); if (again) again.addEventListener('change', function () { eng.setName(again.value.trim()).then(function () { eng.run(); }); });
  }
  function mdPart(body) {
    var nav = NS.$('.md-nav', body), panes = NS.$('.md-panes', body);
    if (!nav || !panes) return;
    var cur = NS._mdTab === 'sf';
    var b = NS.el('button', { type: 'button', role: 'tab', id: 'md-t-sf', 'aria-controls': 'md-p-sf', 'aria-selected': String(cur), tabindex: cur ? '0' : '-1', 'data-md-tab': 'sf', 'data-ic': 'data' });
    b.textContent = T('sfd.tab'); nav.appendChild(b);
    var p = NS.el('section', { class: 'md-pane', role: 'tabpanel', id: 'md-p-sf', 'aria-labelledby': 'md-t-sf', 'data-md-pane': 'sf' }); if (!cur) p.hidden = true;
    panes.appendChild(p);
    if (cur) {   /* opened on this tab: the others step back */
      NS.$$('[data-md-tab]', body).forEach(function (x) { if (x !== b) { x.setAttribute('aria-selected', 'false'); x.tabIndex = -1; } });
      NS.$$('.md-pane', body).forEach(function (x) { if (x !== p) x.hidden = true; });
    }
    kv.get('sfdir').then(function (h) { dirH = h || dirH; On = !!dirH; if (On) pageEngine(); render(); }, render);
    if (On && eng) eng.run();
  }
  NS.mdExt = (NS.mdExt || []).concat([mdPart]);
  document.addEventListener('ns-sf', render);

  /* ---------- clicks ---------- */
  function done(p) { return Promise.resolve(p).then(render, function (e) { if (e && e.name !== 'AbortError' && e.message !== 'elsewhere') NS.toast(T('sfd.err', { e: e && e.message || e }), 'bad'); render(); }); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-sf]'); if (!b) return;
    var a = b.getAttribute('data-sf'), k = b.getAttribute('data-k');
    if (a === 'choose') done(choose());
    else if (a === 'allow') done(allow());
    else if (a === 'sync') done(eng.run());
    else if (a === 'switch') { clearRole(); NS.$('#ns-mydata') && NS.$('#ns-mydata').close(); gate(); }
    else if (a === 'stop') { var go = function () { return stop(); }; NS.ask ? NS.ask(T('sfd.stopq'), { danger: true, ok: T('sfd.stop') }).then(function (y) { if (y) done(go()); }) : done(go()); }
    else if (a === 'confirmdel') done(eng.confirmDeletes());
    else if (a === 'ack') done(eng.ack(k));
    else if (a === 'useother') {
      var c = eng.status().conflicts.filter(function (x) { return x.key === k; })[0]; if (!c) return;
      var store = b.getAttribute('data-s'), rid = b.getAttribute('data-r'), f = b.getAttribute('data-f');
      done(NSStore.get(store, rid).then(function (rec) { if (!rec) return; rec = JSON.parse(JSON.stringify(rec)); rec[f] = c.a; return NSStore.put(store, rec); }).then(function () { return eng.ack(k); }));
    }
    else if (a === 'deleteit') done(NSStore.del(b.getAttribute('data-s'), b.getAttribute('data-r')).then(function () { return eng.ack(k); }));
    else if (a === 'rmstaff') { var tm = JSON.parse(JSON.stringify(team())); tm.staff.splice(+b.getAttribute('data-i'), 1); done(kv.get('sfdir').then(function (h) { return eng.setTeam(tm, h); })); }
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t || !t.matches) return;
    var set = function (patch) { return NSStore.meta('sfcfg').then(function (c) { return NSStore.meta('sfcfg', Object.assign({}, c || {}, patch)); }).then(function () { cfgCache = Object.assign({}, cfgCache, patch); return eng ? eng.run() : null; }); };
    if (t.matches('[data-sf-num]')) done(set({ numbering: t.getAttribute('data-sf-num') }));
    else if (t.matches('[data-sf-slow]')) done(set({ slow: !!t.checked }));
  });
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f.matches) return;
    if (f.matches('[data-sf-owner]')) {
      e.preventDefault(); var pin = NS.$('input', f).value;
      if (!/^\d{4,8}$/.test(pin)) { NS.toast(T('sfd.pin.bad'), 'bad'); return; }
      done(mkPin(pin).then(function (rec) { var tm = JSON.parse(JSON.stringify(team() || { v: 1, staff: [] })); tm.owner = rec; return kv.get('sfdir').then(function (h) { return eng.setTeam(tm, h); }); }).then(function () { applyRole('owner', T('sfd.g.owner')); NS.toast(T('sfd.saved')); }));
    } else if (f.matches('[data-sf-staff]')) {
      e.preventDefault(); var nm = NS.$('#sf-sn', f).value.trim(), sp = NS.$('#sf-sp', f).value;
      if (!nm || !/^\d{4,8}$/.test(sp)) { NS.toast(T('sfd.pin.bad'), 'bad'); return; }
      done(mkPin(sp).then(function (rec) { rec.name = nm; var tm = JSON.parse(JSON.stringify(team())); tm.staff = (tm.staff || []).concat([rec]); return kv.get('sfdir').then(function (h) { return eng.setTeam(tm, h); }); }).then(function () { NS.toast(T('sfd.saved')); }));
    }
  });

  /* ---------- page start: the App (or My data) as a top-level page, when it was switched on ---------- */
  var readyRes, readyP = new Promise(function (r) { readyRes = r; });   /* the makers wait for this before asking for a number: the mode is known to be on or off */
  function start() {
    if (window.top !== window || !window.NSStore || !SUPPORT() || !NS.folderHere()) { readyRes(); return; }
    NSStore.ready().then(function () { return Promise.all([NSStore.meta('sf'), kv.get('sfdir')]); }).then(function (r) {
      if (!r[0] || !r[0].on || !r[1]) { readyRes(); return; }
      On = true; dirH = r[1]; pageEngine(); readyRes();
      if (role() === 'staff') document.documentElement.classList.add('sf-staff');
      return eng.run().then(function () {
        /* the folder is read again now and then, and when the person comes back to this window */
        (function tick() {   /* live: every 3 s while another computer is here, every 15 s alone, a heartbeat only (45 s) while this window is in the background */
          var s = eng.status(), wait = document.hidden ? 45000 : s.live > 0 ? 3000 : 15000;
          setTimeout(function () { if (!On) return tick(); eng.run({ poll: true, beatOnly: document.hidden }).then(tick, tick); }, wait);
        })();
        document.addEventListener('visibilitychange', function () { if (!document.hidden && On) eng.run(); });
        document.addEventListener('ns-saved', function () { if (On) eng.soon(); });
        document.addEventListener('ns-autosave', function (ev) { if (On && ev.detail === 'chg') eng.soon(); });
        var f = function () { if (On && eng.status().state === 'ask') { /* the browser asks again only after a click */ } };
        document.addEventListener('pointerdown', function h() { if (On && eng.status().state === 'ask') { document.removeEventListener('pointerdown', h, true); allow(); } }, true);
      });
    }).catch(function () { readyRes(); });
  }
  if (document.readyState === 'complete') setTimeout(start, 1800); else window.addEventListener('load', function () { setTimeout(start, 1800); });

  NS.sf = { create: create, role: role, who: who, can: function (cap) { return C.can(role() || 'owner', cap); }, engine: function () { return eng; }, choose: choose, stop: stop, ready: function () { return Promise.race([readyP, new Promise(function (r) { setTimeout(r, 8000); })]); },
    /* for the makers (through NSStore.sfClaim / sfRelease / sfEditing): the number of a new bill, and who is editing which bill */
    claim: function (a) { return On && eng ? eng.claim(a) : Promise.resolve(null); }, release: function (owner) { return eng ? eng.release(owner) : Promise.resolve(); },
    setEditing: function (owner, id, no) { return On && eng ? eng.setEditing(owner, id, no) : Promise.resolve(); }, editorOf: function (id) { return On && eng ? eng.editorOf(id) : null; } };
})();
