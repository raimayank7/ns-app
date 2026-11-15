/* Trade packs, the pure part (NSPacks): the pack list, what applying one WOULD do, and how to take it back. No screen, no storage:
   the App passes in what is saved (items, the business's settings, its feature switches) and gets a plan back; scripts/test_packs.js checks it.

   A pack = one tap that gives a trade a start:
     items      goods and services of the trade: { d: name, h: HSN/SAC, u: unit, g: GST % or '' (typed by the owner when we are not sure), k: 'goods'|'services' }
                Selling rates are always left empty (they are the shop's own prices).
     set        document defaults and number series, written ONLY into an empty place: invoice {gst, unit, round, notes, terms}, <document type>.prefix
     feats      App features (firstrun.js names) that are switched ON when they are off; nothing is ever switched off
     optional   features that belong to a trade tool still on another branch (clinic, salon, hotel ...): switched on only when that feature exists in this App
     boxes      boxes on the App's home screen ('shortcuts', 'overdue', 'topdue'), shown while the pack is applied
     links      the shortcuts box: tool site ids with a name key
     asof / src the date the GST rates were read and where (secondary summaries of the 56th GST Council decisions, in force from 22 Sep 2025; the rate
                notification itself was not opened: every rate is marked "check") ; a rate we could not confirm is '' and the owner types it.
   Never deletes or overwrites: an item with the same name is skipped, a filled setting is kept, a switch that is on stays on.
   Removing a pack takes away exactly what it added and that is still unchanged (items edited meanwhile, settings changed meanwhile stay). */
(function () {
  'use strict';
  var root = typeof window !== 'undefined' ? window : globalThis;
  var ASOF = '2025-09-22';
  var SRC = 'GST rates in force from 22 Sep 2025 (56th GST Council), read from trade-press summaries; check the CBIC rate notifications before relying on them';

  function I(d, h, u, g, k) { return { d: d, h: h, u: u, g: g, k: k || 'goods' }; }
  var S = 'services';

  var PACKS = [
    { id: 'kirana', name: 'Kirana and general store', kind: 'shop', asof: ASOF, src: SRC,
      desc: 'Daily-need goods with their HSN and GST rate, POS, stock and khata on, cash memo series and a home box for what is overdue.',
      feats: ['stock', 'barcode', 'khata', 'pos', 'chq'], boxes: ['shortcuts', 'overdue'], links: [['pos', 'nav.pos'], ['stock', 'nav.stock'], ['khata', 'nav.khata']],
      set: { invoice: { unit: 'Nos', round: true }, cashmemo: { prefix: 'CM' } },
      items: [I('Toilet soap', '3401', 'Nos', 5), I('Toothpaste', '3306', 'Nos', 5), I('Hair oil', '3305', 'Nos', 5), I('Shampoo', '3305', 'Nos', 5),
        I('Ghee', '0405', 'Kg', 5), I('Paneer', '0406', 'Kg', 0), I('Namkeen / bhujia (pre-packed)', '2106', 'Pkt', 5), I('Sugar', '1701', 'Kg', 5),
        I('Tea', '0902', 'Kg', 5), I('Mustard oil', '1514', 'Ltr', 5), I('Salt', '2501', 'Kg', 0),
        I('Atta (wheat flour)', '1101', 'Kg', ''), I('Rice', '1006', 'Kg', ''), I('Pulses (dal)', '0713', 'Kg', ''), I('Biscuits', '1905', 'Pkt', ''), I('Detergent powder', '3402', 'Kg', '')] },
    { id: 'salon', name: 'Salon and beauty parlour', kind: 'salon', asof: ASOF, src: SRC,
      desc: 'Hair, beauty and spa services with SAC codes at the 5% rate in force since 22 Sep 2025 (without input tax credit), a service bill series and repeat bills on.',
      feats: ['repeat', 'salary'], optional: ['salon', 'gym'], boxes: ['shortcuts', 'overdue'], links: [['billing', 'nav.billing']],
      set: { invoice: { gst: 5, unit: 'Nos', round: true, notes: 'GST at 5% without input tax credit for beauty and physical well-being services.' }, cashmemo: { prefix: 'SLN' } },
      items: [I('Haircut', '999721', 'Nos', 5, S), I('Shave / beard trim', '999721', 'Nos', 5, S), I('Hair colour', '999722', 'Nos', 5, S), I('Facial', '999722', 'Nos', 5, S),
        I('Waxing', '999722', 'Nos', 5, S), I('Threading', '999722', 'Nos', 5, S), I('Manicure', '999722', 'Nos', 5, S), I('Pedicure', '999722', 'Nos', 5, S),
        I('Bridal makeup', '999722', 'Nos', 5, S), I('Hair spa', '999723', 'Nos', 5, S), I('Massage', '999723', 'Nos', 5, S)] },
    { id: 'clinic', name: 'Clinic and doctor', kind: 'clinic', asof: ASOF, src: 'Notification 12/2017-Central Tax (Rate), entry 74: health care services by a clinical establishment or an authorised medical practitioner are exempt; check before relying on it',
      desc: 'Consultation and procedure items marked exempt, a receipt series and repeat bills. Patient records need the clinic tool (switched on when it is in this App). Not medical advice.',
      feats: ['repeat', 'salary'], optional: ['clinic'], boxes: ['shortcuts', 'overdue'], links: [['billing', 'nav.billing']],
      set: { invoice: { gst: 0, unit: 'Nos', round: true }, cashmemo: { prefix: 'OPD' } },
      items: [I('Consultation', '999312', 'Nos', 0, S), I('Follow-up visit', '999312', 'Nos', 0, S), I('Dressing', '999312', 'Nos', 0, S), I('Injection / infusion', '999312', 'Nos', 0, S),
        I('Minor procedure', '999312', 'Nos', 0, S), I('Dental check-up', '999312', 'Nos', 0, S), I('Health check-up package', '999312', 'Nos', '', S), I('Medical certificate', '999312', 'Nos', '', S)] },
    { id: 'school', name: 'School and coaching', kind: 'school', asof: ASOF, src: 'Notification 12/2017-Central Tax (Rate): education by a recognised institution up to higher secondary is exempt; commercial coaching is taxable. Check before relying on it',
      desc: 'Fee heads (school fees exempt, coaching 18%), fee receipt series, salary and repeat bills on. Choose the heads that apply to you; delete the others.',
      feats: ['fee', 'salary', 'repeat'], boxes: ['shortcuts', 'overdue', 'topdue'], links: [['fee-receipt', 'nav.feereceipt'], ['salary-slip', 'nav.salary']],
      set: { invoice: { unit: 'Nos', round: true }, fee: { prefix: 'FEE' } },
      items: [I('Tuition fee (recognised school)', '9992', 'Nos', 0, S), I('Admission / registration fee', '9992', 'Nos', 0, S), I('Annual charges', '9992', 'Nos', 0, S),
        I('Coaching class fee (commercial coaching)', '999293', 'Nos', 18, S), I('Test series / study material fee', '999293', 'Nos', 18, S), I('Printed books', '4901', 'Nos', 0),
        I('School uniform', '', 'Set', ''), I('Transport fee', '9964', 'Nos', '', S)] },
    { id: 'contractor', name: 'Contractor and builder', kind: 'contr', asof: ASOF, src: SRC,
      desc: 'Works-contract and labour items at 18%, running account bills, TDS and sales orders on, an invoice series. Government contracts can have another rate: type it on the bill.',
      feats: ['rabill', 'tds', 'orders', 'fa'], boxes: ['shortcuts', 'overdue', 'topdue'], links: [['contractor-bill', 'nav.contractorbill'], ['tds', 'nav.tds']],
      set: { invoice: { gst: 18, unit: 'Nos', round: true }, rabill: { prefix: 'RA' } },
      items: [I('Works contract service', '9954', 'Nos', 18, S), I('Labour supply', '9985', 'Nos', 18, S), I('Repair and maintenance work', '9987', 'Nos', 18, S),
        I('Plumbing / electrical work', '9954', 'Nos', 18, S), I('Painting work', '9954', 'Sqft', 18, S), I('Cement', '2523', 'Bag', ''), I('Steel bars (TMT)', '7214', 'Kg', ''),
        I('Bricks', '6901', 'Nos', ''), I('Sand / aggregate', '2505', 'Cft', '')] },
    { id: 'transporter', name: 'Transporter', kind: 'trans', asof: ASOF, src: SRC,
      desc: 'Freight items at the goods transport agency rate (5% without input tax credit; 18% with credit is an option you declare), bilty / LR, TDS and cheques on.',
      feats: ['bilty', 'tds', 'chq'], boxes: ['shortcuts', 'overdue', 'topdue'], links: [['bilty', 'nav.bilty'], ['tds', 'nav.tds']],
      set: { invoice: { gst: 5, unit: 'Nos', round: true, notes: 'GTA service: GST 5% without input tax credit (or 18% with credit if declared). Payable by the recipient when it is a registered person and the supplier is a GTA.' }, lr: { prefix: 'LR' } },
      items: [I('Freight (full truck load)', '9965', 'Trip', 5, S), I('Freight (part load)', '9965', 'Kg', 5, S), I('Loading / unloading charges', '9965', 'Nos', '', S),
        I('Detention / waiting charges', '9965', 'Day', '', S), I('Parcel / courier carriage', '996812', 'Nos', '', S)] },
    { id: 'cafe', name: 'Cafe and small restaurant', kind: 'resto', asof: ASOF, src: SRC,
      desc: 'Menu starter with restaurant service at 5% (no input tax credit), the restaurant billing tool and stock on. Prices are yours: fill them in the item list.',
      feats: ['resto', 'stock'], optional: ['cafe'], boxes: ['shortcuts', 'overdue'], links: [['restaurant', 'nav.restaurant'], ['stock', 'nav.stock']],
      set: { invoice: { gst: 5, unit: 'Nos', round: true, notes: 'Restaurant service: GST 5% without input tax credit.' }, resto: { prefix: 'RB' } },
      items: [I('Tea', '996331', 'Cup', 5, S), I('Coffee', '996331', 'Cup', 5, S), I('Cold coffee', '996331', 'Glass', 5, S), I('Sandwich', '996331', 'Nos', 5, S), I('Burger', '996331', 'Nos', 5, S),
        I('Samosa', '996331', 'Nos', 5, S), I('Pasta', '996331', 'Plate', 5, S), I('Maggi / noodles', '996331', 'Plate', 5, S), I('French fries', '996331', 'Plate', 5, S), I('Brownie', '996331', 'Nos', 5, S)] },
    /* stubs: the tools live on branches vert-a..e; a stub shows only when its feature exists, and then only switches it on and sets a series */
    { id: 'hotel', stub: 'hotel', name: 'Hotel and rooms', kind: 'other', desc: 'Switches the hotel / rooms tool on.', feats: [], boxes: ['shortcuts'], links: [['hotel', 'nav.billing']], set: {}, items: [] },
    { id: 'rent', stub: 'rent', name: 'Rent and property', kind: 'other', desc: 'Switches the rent management tool on.', feats: [], boxes: ['overdue'], links: [], set: {}, items: [] },
    { id: 'jewellery', stub: 'jewellery', name: 'Jewellery', kind: 'other', desc: 'Switches the jewellery tool on.', feats: [], boxes: ['shortcuts'], links: [], set: {}, items: [] },
    { id: 'garment', stub: 'garment', name: 'Garments', kind: 'other', desc: 'Switches the garments (size and colour) tool on.', feats: [], boxes: ['shortcuts'], links: [], set: {}, items: [] },
    { id: 'garage', stub: 'garage', name: 'Garage and repair', kind: 'other', desc: 'Switches the garage tool on.', feats: [], boxes: ['shortcuts'], links: [], set: {}, items: [] },
    { id: 'amc', stub: 'amc', name: 'AMC and subscriptions', kind: 'svc', desc: 'Switches the AMC tool on.', feats: ['repeat'], boxes: ['overdue'], links: [], set: {}, items: [] },
    { id: 'mandi', stub: 'mandi', name: 'Mandi and commission agent', kind: 'other', desc: 'Switches the mandi tool on.', feats: [], boxes: ['shortcuts'], links: [], set: {}, items: [] },
    { id: 'petrol', stub: 'petrol', name: 'Petrol pump', kind: 'other', desc: 'Switches the petrol pump tool on.', feats: [], boxes: ['shortcuts'], links: [], set: {}, items: [] },
    { id: 'marketplace', stub: 'marketplace', name: 'Online seller', kind: 'other', desc: 'Switches the marketplace reconcile tool on.', feats: [], boxes: ['shortcuts'], links: [], set: {}, items: [] }
  ];
  var BOXES = ['shortcuts', 'overdue', 'topdue'];

  function get(id) { return PACKS.filter(function (p) { return p.id === id; })[0] || null; }
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function isSet(v) { return v !== undefined && v !== null && v !== ''; }
  /* the part of an item a person may change: if it still reads like this, removing the pack may delete it */
  function sig(r) { return [key(r.desc), r.hsn || '', r.unit || '', r.gst === '' || r.gst == null ? '' : +r.gst, r.rate === '' || r.rate == null ? '' : +r.rate].join('|'); }
  function itemRec(p, it, biz) {
    var r = { desc: it.d, hsn: it.h, unit: it.u, rate: '', gst: it.g === '' ? '' : +it.g, kind: it.k, pack: p.id };
    if (biz) r.biz = biz;
    return r;
  }
  /* the settings paths a pack wants: [{ path: ['invoice','gst'], value }] */
  function setList(p) {
    var out = [];
    Object.keys(p.set || {}).forEach(function (a) {
      var v = p.set[a];
      Object.keys(v).forEach(function (b) { out.push({ path: [a, b], value: v[b] }); });
    });
    return out;
  }
  function getp(o, path) { for (var i = 0; i < path.length; i++) { if (o == null) return undefined; o = o[path[i]]; } return o; }
  function setp(o, path, v) {
    for (var i = 0; i < path.length - 1; i++) { if (o[path[i]] == null || typeof o[path[i]] !== 'object') o[path[i]] = {}; o = o[path[i]]; }
    if (v === undefined) delete o[path[path.length - 1]]; else o[path[path.length - 1]] = v;
  }

  /* ctx: { items: saved items, cfg: the business's settings view (NS.cfgFor), biz: id,
            feats: { known: function(f), on: function(f), managed: bool } (managed = the business has feature switches) } */
  function plan(p, ctx) {
    ctx = ctx || {};
    var have = {}; (ctx.items || []).forEach(function (r) { have[key(r.desc)] = 1; });
    var add = [], skip = [];
    (p.items || []).forEach(function (it) { (have[key(it.d)] ? skip : add).push(it); });
    var sets = [], kept = [];
    setList(p).forEach(function (s) { (isSet(getp(ctx.cfg || {}, s.path)) ? kept : sets).push(s); });
    var F = ctx.feats || { known: function () { return true; }, on: function () { return true; }, managed: false };
    var on = [], already = [], wait = [];
    (p.feats || []).concat(p.optional || []).concat(p.stub ? [p.stub] : []).forEach(function (f) {
      if (!F.known(f)) { wait.push(f); return; }
      if (!F.managed || F.on(f)) already.push(f); else on.push(f);
    });
    return { add: add, skip: skip, sets: sets, kept: kept, featOn: on, featAlready: already, featWait: wait, boxes: (p.boxes || []).slice(), unmanaged: !F.managed };
  }
  function applyCfg(view, sets) { sets.forEach(function (s) { setp(view, s.path, s.value); }); return view; }
  /* take back only what is still as the pack left it */
  function undoCfg(view, sets) {
    var gone = [], kept = [];
    sets.forEach(function (s) { if (JSON.stringify(getp(view, s.path)) === JSON.stringify(s.value)) { setp(view, s.path, undefined); gone.push(s); } else kept.push(s); });
    /* an emptied group stays as {}: NS.cfgSave only writes the keys that are present, so deleting the key would leave the old values saved */
    return { gone: gone, kept: kept };
  }
  /* which saved items a record of an applied pack may delete: same pack tag and unchanged */
  function removable(rec, items) {
    var del = [], keep = [], byId = {}; (items || []).forEach(function (r) { byId[r.id] = r; });
    (rec.items || []).forEach(function (x) {
      var cur = byId[x.id];
      if (!cur) return;
      (sig(cur) === x.sig ? del : keep).push(cur);
    });
    return { del: del, keep: keep };
  }
  /* boxes shown now: the union of the boxes of the applied packs, in the order of BOXES */
  function boxesFor(applied) {
    var on = {};
    Object.keys(applied || {}).forEach(function (id) { var p = get(id); if (p) (p.boxes || []).forEach(function (b) { on[b] = 1; }); });
    return BOXES.filter(function (b) { return on[b]; });
  }
  function linksFor(applied) {
    var seen = {}, out = [];
    Object.keys(applied || {}).forEach(function (id) { var p = get(id); if (p) (p.links || []).forEach(function (l) { if (!seen[l[0]]) { seen[l[0]] = 1; out.push(l); } }); });
    return out;
  }
  /* the pack that suits a business type first */
  function suggest(kind) { var o = PACKS.filter(function (p) { return !p.stub && p.kind === kind; }); return o.length ? o[0].id : ''; }

  root.NSPacks = { PACKS: PACKS, BOXES: BOXES, get: get, plan: plan, itemRec: itemRec, sig: sig, setList: setList, applyCfg: applyCfg, undoCfg: undoCfg,
    removable: removable, boxesFor: boxesFor, linksFor: linksFor, suggest: suggest, key: key };
})();
