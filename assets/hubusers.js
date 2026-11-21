/* My data › Settings › Users and logins (owner 20 Nov 2026, SQLite Stage 2), through NS.hubExt (my.js).
   Off: the owner turns logins on (name + password; the data files get locked with a key only passwords open) and prints the
   recovery code. On: the owner (or a user with the Users right) adds users, gives each a role, switches users off, resets
   passwords and makes own roles; every user changes their own password; the idle lock time is set per computer.
   Words: 'us.*' (My data is a site of its own, so they are in every language; Release B, 21 Nov 2026). */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, T = function (k, o) { return NS.t('us.' + k, o); };
  var AREAS = ['sales', 'purchase', 'money', 'stock', 'masters', 'reports', 'gst', 'settings', 'users'];
  var ACTS = ['view', 'add', 'edit', 'del', 'print', 'export'];
  var FIXED = { owner: 1, accountant: 1, billing: 1, store: 1, viewer: 1 };
  function areaName(a) { return T('a_' + a); }
  function actName(a) { return T('x_' + a); }
  function roleName(r) { return r && FIXED[r.id] ? T('r_' + r.id) : (r && r.name || ''); }
  function settings() { return '<fieldset class="card us-set" data-usset><legend>' + esc(T('title')) + '</legend><div data-usbox><p class="soft">…</p></div></fieldset>'; }
  function say(pane, t, bad) { var m = $('[data-usmsg]', pane); if (m) { m.textContent = t; m.className = bad ? 'bad' : 'soft'; } }
  function err(e) { return NS.login && NS.login.word ? NS.login.word(e) : String(e && e.message || e || '').replace(/^NSAUTH: /, ''); }
  function offHtml(st) {
    if (st.sqlite === false) return '<p class="soft">' + esc(T('nostore')) + '</p>';
    return '<p>' + esc(T('offp')) + '</p>' +
      '<form data-usup class="grid2"><label>' + esc(T('oname')) + ' <input name="n" required autocomplete="username"></label><span></span>' +
      '<label>' + esc(T('opw')) + ' <input name="p" type="password" required minlength="6" autocomplete="new-password"></label>' +
      '<label>' + esc(T('pw2')) + ' <input name="p2" type="password" required minlength="6" autocomplete="new-password"></label>' +
      '<label class="full"><input type="checkbox" name="enc" checked> ' + esc(T('enc')) + '</label>' +
      '<p class="full warn"><b>' + esc(T('imp')) + '</b> ' + esc(T('impp')) + '</p>' +
      '<p class="full"><button class="btn primary" type="submit">' + esc(T('turnon')) + '</button> <span data-usmsg class="soft"></span></p></form>';
  }
  function roleSel(roles, cur) { return roles.filter(function (r) { return r.id !== 'owner'; }).map(function (r) { return '<option value="' + esc(r.id) + '"' + (r.id === cur ? ' selected' : '') + '>' + esc(roleName(r)) + '</option>'; }).join(''); }
  function grid(r, edit) {
    return '<div class="tbl-wrap"><table class="tbl us-grid"><thead><tr><th class="l">' + esc(T('area')) + '</th>' + ACTS.map(function (a) { return '<th>' + esc(actName(a)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      AREAS.map(function (ar) {
        return '<tr><th scope="row" class="l">' + esc(areaName(ar)) + '</th>' + ACTS.map(function (a) {
          var on = r.rights && r.rights[ar] && r.rights[ar][a];
          return '<td>' + (edit ? '<input type="checkbox" data-rg="' + ar + '.' + a + '"' + (on ? ' checked' : '') + ' aria-label="' + esc(areaName(ar) + ' ' + actName(a)) + '">' : on ? '✓' : '·') + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  function onHtml(st, users) {
    var me = st.me || {}, canU = me.rights && me.rights.users && me.rights.users.edit, roles = st.roles || [];
    var h = '<p>' + esc(T(st.cipher ? 'onlocked' : 'on')) + ' ' + esc(T('youare', { name: me.name, role: roleName({ id: me.role, name: me.roleName }) || me.role })) +
      ' <button type="button" class="btn sm" data-uslogout>' + esc(T('logout')) + '</button> <button type="button" class="btn sm" data-usswitch>' + esc(T('switch')) + '</button></p>';
    if (canU) {
      h += '<h3>' + esc(T('users')) + '</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th class="l">' + esc(T('name')) + '</th><th class="l">' + esc(T('role')) + '</th><th>' + esc(T('canlog')) + '</th><th></th></tr></thead><tbody>' +
        users.map(function (u) {
          return '<tr data-uid="' + esc(u.id) + '"><th scope="row" class="l">' + esc(u.name) + '</th><td class="l">' + (u.role === 'owner' ? esc(T('r_owner')) : '<select data-usrole>' + roleSel(roles, u.role) + '</select>') + '</td>' +
            '<td>' + (u.role === 'owner' ? '✓' : '<input type="checkbox" data-usact' + (u.active ? ' checked' : '') + ' aria-label="' + esc(T('canlogof', { name: u.name })) + '">') + '</td>' +
            '<td><button type="button" class="btn sm" data-uspw>' + esc(T('newpw')) + '</button></td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<form data-usadd class="grid2" style="margin-top:10px"><label>' + esc(T('nuname')) + ' <input name="n" required autocomplete="off"></label><label>' + esc(T('role')) + ' <select name="r">' + roleSel(roles, 'billing') + '</select></label>' +
        '<label>' + esc(T('pw')) + ' <input name="p" type="password" required minlength="6" autocomplete="new-password"></label><p><button class="btn" type="submit">' + esc(T('add')) + '</button></p></form>' +
        '<h3>' + esc(T('roles')) + '</h3><p class="soft">' + esc(T('rolesp')) + '</p>' +
        '<label>' + esc(T('role')) + ' <select data-usrview>' + roles.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(roleName(r)) + '</option>'; }).join('') + '</select></label>' +
        '<div data-usgrid>' + grid(roles[0], false) + '</div>' +
        '<form data-usnewrole class="grid2" style="margin-top:10px"><label>' + esc(T('nrname')) + ' <input name="n" required></label><label>' + esc(T('copyof')) + ' <select name="from">' + roles.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(roleName(r)) + '</option>'; }).join('') + '</select></label>' +
        '<label>' + esc(T('backdays')) + ' <input name="bd" type="number" min="0" value="3"></label><label>' + esc(T('maxdisc')) + ' <input name="md" type="number" min="0" value="0"></label>' +
        '<label class="full"><input type="checkbox" name="cost"> ' + esc(T('seecost')) + '</label><div class="full" data-usnewgrid></div><p><button class="btn" type="submit">' + esc(T('saverole')) + '</button></p></form>';
    }
    if (me.role === 'owner') h += '<h3>' + esc(T('lo_t')) + '</h3><p class="soft">' + esc(T('lo_p')) + '</p><form data-usoff class="grid2"><label>' + esc(T('lo_pw')) + ' <input name="p" type="password" required autocomplete="current-password"></label><p><button class="btn danger" type="submit">' + esc(T('lo_t')) + '</button></p></form>';
    h += '<h3>' + esc(T('mypw')) + '</h3><form data-usmypw class="grid2"><label>' + esc(T('oldpw')) + ' <input name="o" type="password" required autocomplete="current-password"></label><label>' + esc(T('newpw2')) + ' <input name="p" type="password" required minlength="6" autocomplete="new-password"></label><p><button class="btn" type="submit">' + esc(T('changemy')) + '</button></p></form>' +
      '<p><label>' + esc(T('idle1')) + ' <input type="number" min="1" max="240" value="' + (localStorage.getItem('nsbiz-idle') || 15) + '" data-usidle style="width:5em"> ' + esc(T('idle2')) + '</label></p>';
    return h + '<p data-usmsg class="soft"></p>';
  }
  function draw(pane) {
    var box = $('[data-usbox]', pane); if (!box) return;
    NSStore.auth('authStatus').then(function (st) {
      if (!st.on) { box.innerHTML = offHtml(st); wireOff(pane); return; }
      var me = st.me || {};
      (me.rights && me.rights.users && me.rights.users.edit ? NSStore.auth('users') : Promise.resolve([])).then(function (users) { box.innerHTML = onHtml(st, users); wireOn(pane, st); });
    }, function (e) { box.innerHTML = '<p class="bad">' + esc(err(e)) + '</p>'; });
  }
  function wireOff(pane) {
    var f = $('[data-usup]', pane); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.p.value !== f.p2.value) return say(pane, T('notsame'), true);
      say(pane, T('turning'));
      NSStore.auth('setupOwner', { name: f.n.value, pw: f.p.value, encrypt: f.enc.checked }).then(function (r) {
        var box = $('[data-usbox]', pane);
        box.innerHTML = '<div class="us-rc"><p><b>' + esc(T('nowon')) + '</b> ' + esc(T('keeprc')) + '</p>' +
          '<p class="us-code" dir="ltr">' + esc(r.recovery) + '</p><p><button class="btn" type="button" data-usprint>' + esc(T('print')) + '</button> <button class="btn primary" type="button" data-usdone>' + esc(T('kept')) + '</button></p></div>';
        $('[data-usprint]', box).addEventListener('click', function () { window.print(); });
        $('[data-usdone]', box).addEventListener('click', function () { location.reload(); });
      }, function (er) { say(pane, err(er), true); });
    });
  }
  function wireOn(pane, st) {
    var q = function (s) { return $(s, pane); }, roles = st.roles || [];
    var lo = q('[data-uslogout]'); if (lo) lo.addEventListener('click', function () { NS.login ? NS.login.logout() : NSStore.auth('logout').then(function () { location.reload(); }); });
    var sw = q('[data-usswitch]'); if (sw) sw.addEventListener('click', function () { if (NS.login) NS.login.switchUser(); });
    $$('[data-uid]', pane).forEach(function (tr) {
      var id = tr.getAttribute('data-uid'), r = $('[data-usrole]', tr), a = $('[data-usact]', tr), pw = $('[data-uspw]', tr);
      if (r) r.addEventListener('change', function () { NSStore.auth('setUser', { id: id, role: r.value }).then(function () { say(pane, T('rolechanged')); }, function (e) { say(pane, err(e), true); }); });
      if (a) a.addEventListener('change', function () { NSStore.auth('setUser', { id: id, active: a.checked }).then(function () { say(pane, T(a.checked ? 'canagain' : 'cannot')); }, function (e) { say(pane, err(e), true); }); });
      if (pw) pw.addEventListener('click', function () { var p = prompt(T('newpwask')); if (p) NSStore.auth('setUser', { id: id, pw: p }).then(function () { say(pane, T('pwchanged')); }, function (e) { say(pane, err(e), true); }); });
    });
    var ad = q('[data-usadd]'); if (ad) ad.addEventListener('submit', function (e) { e.preventDefault(); NSStore.auth('addUser', { name: ad.n.value, pw: ad.p.value, role: ad.r.value }).then(function () { draw(pane); }, function (er) { say(pane, err(er), true); }); });
    var rv = q('[data-usrview]'); if (rv) rv.addEventListener('change', function () { var r = roles.filter(function (x) { return x.id === rv.value; })[0]; q('[data-usgrid]').innerHTML = grid(r, false); });
    var nr = q('[data-usnewrole]');
    if (nr) {
      var fill = function () { var r = roles.filter(function (x) { return x.id === nr.from.value; })[0]; q('[data-usnewgrid]').innerHTML = grid(r, true); };
      nr.from.addEventListener('change', fill); fill();
      nr.addEventListener('submit', function (e) {
        e.preventDefault();
        var rights = {}; AREAS.forEach(function (a) { rights[a] = {}; ACTS.forEach(function (x) { rights[a][x] = false; }); });
        $$('[data-rg]', nr).forEach(function (c) { var k = c.getAttribute('data-rg').split('.'); rights[k[0]][k[1]] = c.checked; });
        var id = 'r-' + (nr.n.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Date.now().toString(36));
        NSStore.auth('setRole', { role: { id: id, name: nr.n.value, rights: rights, limits: { backDays: +nr.bd.value || 0, maxDisc: +nr.md.value || 0, seeCost: nr.cost.checked } } }).then(function () { draw(pane); }, function (er) { say(pane, err(er), true); });
      });
    }
    var mp = q('[data-usmypw]'); if (mp) mp.addEventListener('submit', function (e) { e.preventDefault(); NSStore.auth('changePw', { old: mp.o.value, pw: mp.p.value }).then(function () { mp.reset(); say(pane, T('mychanged')); }, function (er) { say(pane, err(er), true); }); });
    var of = q('[data-usoff]');
    if (of) of.addEventListener('submit', function (e) {
      e.preventDefault();
      var go = function () {
        say(pane, T('lo_ing'));
        NSStore.auth('loginsOff', { pw: of.p.value }).then(function () { say(pane, T('lo_done')); setTimeout(function () { location.reload(); }, 1200); }, function (er) { of.p.value = ''; say(pane, err(er), true); });
      };
      (NS.ask ? NS.ask(T('lo_ask'), { ok: T('lo_t'), danger: 1 }) : Promise.resolve(confirm(T('lo_ask')))).then(function (yes) { if (yes) go(); });
    });
    var il = q('[data-usidle]'); if (il) il.addEventListener('change', function () { if (NS.login) NS.login.setIdle(il.value); say(pane, T('idlesaved')); });
  }
  (NS.hubExt = NS.hubExt || []).push({ settings: settings, wireSettings: draw });
})();
