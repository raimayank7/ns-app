/* My data › Backup › "Copies of the data files" (owner 21 Nov 2026, SQLite Stage 4), through NS.hubBackupExt (my.js).
   Like Tally and Evershine: the data files themselves are copied every day into NSBiz › Backup › Mon … Sun (the last seven days
   are always there), and the whole data can be saved as one .nsbiz file (pen drive, another PC). Once logins are on, the copies
   stay locked: they open only with the NSBiz passwords of that data. Bringing a copy back replaces all data on this device; the
   data as it is now is saved first (Backup › Before restore, or a downloaded file). The copying itself is in core.js
   (NS.fileBackup); the Windows program copies into Public Documents\NSBiz\Backup by itself (ns-desktop sqlhome.js).
   Words: 'fb.*' (My data is a site of its own, so they are in every language). */
(function () {
  'use strict';
  if (!window.NS || !NS.fileBackup) return;
  var $ = NS.$, esc = NS.esc, FB = NS.fileBackup, T = function (k, o) { return NS.t('fb.' + k, o); };
  var DESK = false;
  var DAYKEY = { Sun: 'd_sun', Mon: 'd_mon', Tue: 'd_tue', Wed: 'd_wed', Thu: 'd_thu', Fri: 'd_fri', Sat: 'd_sat', 'Before restore': 'd_before' };
  function dayName(f) { return DAYKEY[f] ? T(DAYKEY[f]) : f; }
  function mb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function when(at) { var d = new Date(at); return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); }
  function err(e) { return String(e && e.message || e || '').replace(/^NSAUTH: /, ''); }
  function say(box, t, bad) { var m = $('[data-fbmsg]', box); if (m) { m.textContent = t || ''; m.className = bad ? 'bad' : 'soft'; } }

  function rows(list, desk) {
    if (!list || !list.length) return '<p class="soft">' + esc(T(desk ? 'none_desk' : 'none')) + '</p>';
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr><th class="l">' + esc(T('th_copy')) + '</th><th class="l">' + esc(T('th_saved')) + '</th><th>' + esc(T('th_files')) + '</th><th>' + esc(T('th_size')) + '</th><th></th></tr></thead><tbody>' +
      list.map(function (c) {
        return '<tr><th scope="row" class="l">' + esc(dayName(c.folder)) + (c.logins ? ' <span class="soft" title="' + esc(T('lockedtip')) + '">· ' + esc(T('lockedtag')) + '</span>' : '') + '</th>' +
          '<td class="l">' + esc(when(c.at)) + '</td><td>' + (c.n || 0) + '</td><td>' + esc(mb(c.size || 0)) + '</td>' +
          '<td><button type="button" class="btn sm" data-fbback="' + esc(c.folder) + '">' + esc(T('back')) + '</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function card(x) {
    var box = NS.el('div', { class: 'card fb-card' });
    box.innerHTML = '<h3>' + esc(T('title')) + '</h3><p class="soft">…</p>';
    x.appendChild(box);
    /* only where the data is in the NSBiz files (SQLite): the Windows program, or Chrome / Edge with the newer data store */
    Promise.all([NSStore.deskBackup ? NSStore.deskBackup('bkDays').catch(function () { return null; }) : null, NSStore.auth('authStatus').catch(function () { return {}; })]).then(function (r) {
      var desk = r[0], st = r[1] || {};
      DESK = !!desk;
      if (!desk && st.sqlite === false) { box.remove(); return; }
      if (desk) return draw(box, desk.days || [], { desk: desk, st: st });
      var pick = NS.folderSupported && NS.folderSupported();
      return (pick ? FB.list().catch(function () { return null; }) : Promise.resolve(null)).then(function (list) { draw(box, list, { st: st, pick: pick }); });
    });
  }

  function draw(box, list, o) {
    var desk = o.desk, folderOn = !!list;
    var where = desk ? '<b>' + esc(desk.dir) + '</b>' : esc(T('where'));
    box.innerHTML = '<h3>' + esc(T('title')) + '</h3>' +
      '<p>' + esc(T('p1', { where: '\u0001' })).replace('\u0001', where) + (o.st.on ? ' ' + esc(T('locked_p')) : '') + '</p>' +
      (desk || folderOn ? rows(list, !!desk) : '<p class="soft">' + esc(T(o.pick ? 'need_folder' : 'on_computer')) + '</p>') +
      '<div class="btns">' +
      (desk || folderOn ? '<button type="button" class="btn" data-fbnow>' + esc(T('now')) + '</button>' : '') +
      '<button type="button" class="btn" data-fbsave>' + esc(T('save')) + '</button>' +
      '<label class="btn"><span>' + esc(T('fromfile')) + '</span><input type="file" accept=".nsbiz" data-fbfile hidden></label>' +
      (o.pick && !desk ? '<button type="button" class="btn" data-fbdir>' + esc(T('fromdir')) + '</button>' : '') +
      '</div><p data-fbmsg class="soft"></p>' +
      '<p class="soft">' + esc(T(desk ? 'rep_pc' : 'rep_dev')) + (o.st.on ? ' ' + esc(T('owneronly')) : '') + '</p>';
    wire(box, o);
  }

  function again(box) { var x = box.parentNode; box.remove(); if (x) card(x); }
  function ask(what, at) {
    var msg = T(DESK ? 'ask_pc' : 'ask_dev', { what: what + (at ? T('saved_at', { when: when(at) }) : '') });
    return NS.ask ? NS.ask(msg, { ok: T('ok'), danger: 1 }) : Promise.resolve(confirm(msg));
  }
  function done(r) {
    NS.toast(T('done', { n: r.n }) + (r.saved === 'download' ? ' ' + T('done_dl') : ''));
    try { localStorage.setItem('nsbiz-restored', String(Date.now())); } catch (e) {}
    /* the whole App starts again (its screens and the login belonged to the replaced data) */
    setTimeout(function () { var w = window; try { if (window.top !== window && window.top.location.origin === location.origin) w = window.top; } catch (e) {} w.location.reload(); }, 1200);
  }

  function wire(box, o) {
    var desk = o.desk, busy = false;
    function run(btn, fn) {
      if (busy) return; busy = true; if (btn) btn.disabled = true; say(box, T('working'));
      return Promise.resolve().then(fn).then(function (v) { busy = false; if (btn) btn.disabled = false; return v; }, function (e) { busy = false; if (btn) btn.disabled = false; say(box, err(e), true); });
    }
    var now = $('[data-fbnow]', box);
    if (now) now.addEventListener('click', function () {
      run(now, function () {
        return (desk ? NSStore.deskBackup('bkNow') : FB.copy()).then(function (st) {
          if (st === 'ask') { NS.folderAllow && NS.folderAllow(); throw new Error(T('askok')); }
          NS.toast(T('copied')); again(box);
        });
      });
    });
    $('[data-fbsave]', box).addEventListener('click', function (e) {
      run(e.currentTarget, function () {
        return FB.pack().then(function (blob) {
          var name = 'NSBiz-backup-' + NS.today() + '.nsbiz';
          var a = NS.el('a', { href: URL.createObjectURL(blob), download: name });
          document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
          say(box, T('savedfile', { name: name, size: mb(blob.size) }));
          return NSStore.meta('lastBackup', Date.now());
        });
      });
    });
    var fi = $('[data-fbfile]', box);
    fi.addEventListener('change', function () {
      var f = fi.files && fi.files[0]; fi.value = '';
      if (!f) return;
      run(null, function () {
        return FB.unpack(f).then(function (set) {
          say(box, '');
          return ask(T('w_file', { name: f.name }), set.head.at).then(function (yes) {
            if (!yes) return;
            say(box, T('bringing'));
            return FB.restore(set, f.name).then(done);
          });
        });
      });
    });
    var dirB = $('[data-fbdir]', box);
    if (dirB) dirB.addEventListener('click', function () {
      run(dirB, function () {
        return window.showDirectoryPicker({ id: 'ns-restore', mode: 'read' }).then(function (h) {
          return FB.readFolder(null, h).then(function (set) {
            return ask(T('w_dir', { name: h.name }), set.head.at).then(function (yes) {
              if (!yes) return;
              say(box, T('bringing'));
              return FB.restore(set, 'folder ' + h.name).then(done);
            });
          });
        }, function () { say(box, ''); });
      });
    });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fbback]'); if (!b) return;
      var day = b.getAttribute('data-fbback'), name = day === 'Before restore' ? T('w_before') : T('w_day', { day: dayName(day) });
      run(b, function () {
        if (desk) {
          return ask(name).then(function (yes) {
            if (!yes) return;
            say(box, T('bringing'));
            return NSStore.deskBackup('bkRestoreDay', { day: day }).then(function (r) { r.saved = 'folder'; done(r); });
          });
        }
        return FB.readFolder(day).then(function (set) {
          return ask(name, set.head.at).then(function (yes) {
            if (!yes) return;
            say(box, T('bringing'));
            return FB.restore(set, 'Backup › ' + day).then(done);
          });
        });
      });
    });
  }

  NS.hubBackupExt = (NS.hubBackupExt || []).concat([function (pane) { var x = $('[data-backup-ext]', pane) || pane; card(x); }]);
})();
