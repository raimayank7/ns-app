/* Free tools batch 2: Money and tax (branch ft-money, 25 Nov 2026). Registers with NSFreeTools.add(key, label, group, make):
     upiqr     UPI QR with an amount: upi://pay link, QR as PNG, a printed table card, share.
     lateint   Late payment interest and late fees, four tabs: GST (s.50(1) interest, s.50(3) interest on wrongly used ITC, late fee for GSTR-3B, 1, 4, 7, 9, 10 as CGST + SGST), TDS (s.398(3),
               s.427 fee), income tax (s.423, 424, 425) and MSME late payment (MSMED Act s.15-16). Working shown month by month.
     cashcount Cash counter: notes and coins by count, total in words, difference from the cash in hand.
     paytax    Gratuity, professional tax by state, depreciation (block of assets) and capital gains, one tab each.
   Pure working = NSMoneyCalc (top of this file), also loaded by node for scripts/test_ft-money.js. Everything runs in the browser.
   Library: qrcode-generator 1.4.4 (Kazuhiko Arase, MIT), a copy in engine/vendor (served as /assets/vendor/), loaded only by the
   UPI QR tool, so it works offline.

   OFFICIAL SOURCES, every one read on 25 Nov 2026 (shown on screen as short dated notes):
   - CGST Act s.50 (taxinformation.cbic.gov.in, Section 50 v1.00): interest up to 18% notified; proviso (substituted by Finance Act 2021
     s.112 WITH EFFECT FROM 1 JULY 2017, in force 1 Jun 2021 by Notification 16/2021-CT): for a return filed late, interest only on the
     tax paid by debiting the electronic cash ledger (not when the return is filed after s.73/74/74A proceedings start); s.50(2) from the
     day after the due date. Notification 13/2017-CT (28 Jun 2017, gstcouncil.gov.in PDF): rate per annum 18% for s.50(1).
     s.50(3) (wrongly availed and utilised ITC): 18% from 1 Jul 2017 (Finance Act 2022 s.116 + Sixth Schedule changed 13/2017's 24 to 18);
     rule 88B (Notification 14/2022-CT). Branch ft-gst2 added it; full sources next to C.gstItc below.
   - CGST Act s.47(1) (taxinformation.cbic.gov.in): Rs 100 a day, at most Rs 5,000. Notification 76/2018-CT: GSTR-3B fee above Rs 25 a
     day (Rs 10 when the central tax payable is nil) waived. Notification 4/2018-CT: the same for GSTR-1 (Rs 10 when no outward
     supplies). Notifications 19/2021-CT and 20/2021-CT (1 Jun 2021): for tax periods from June 2021 the total fee is capped at Rs 250
     (nil), Rs 1,000 (turnover up to Rs 1.5 crore), Rs 2,500 (above 1.5 up to 5 crore); above 5 crore the Act's Rs 5,000. All central tax.
     GSTR-4, GSTR-7, GSTR-9, GSTR-10 and the equal State tax part (no IGST late fee): sources next to C.gstLateFee below (ft-gst2).
   - Income-tax Act, 2025 (incometaxindia.gov.in section pages): s.398(3)(a) interest 1% (not deducted / late deduction) and 1.5% (deducted,
     paid late) for every month or part of a month [old 201(1A)]; s.427 fee Rs 200 a day, at most the tax deductible [old 234E];
     s.423 return late: 1% x tax x number of months from the day after the due date [old 234A]; s.424 advance tax below 90%: 1% for every
     month or part from 1 April after the tax year [old 234B]; s.425 deferment: 3% on the shortfall at 15 Jun (15%), 15 Sep (45%),
     15 Dec (75%), 1% at 15 Mar (100%), none if 12% by 15 Jun / 36% by 15 Sep; s.58(2) presumptive: 1% on the 15 Mar shortfall [old 234C].
   - MSMED Act 2006 s.15-16 (dcmsme.gov.in: Legal Framework note and FAQs on delayed payments): compound interest with monthly rests at
     three times the bank rate notified by RBI; appointed day = day after 15 days from acceptance; agreed date at most 45 days.
     RBI Bank Rate 5.75% (rbi.org.in home page "Current Rates", rates as on 23 Nov 2026).
   - RBI FAQ "Rs 2000 banknotes - withdrawal from circulation - will continue as legal tender" (updated 30 Sep 2023, rbi.org.in) and RBI
     FAQ "Indian Currency" (updated 15 Apr 2025): notes 10, 20, 50, 100, 200, 500, 2000; earlier Rs 1, 2, 5 notes still valid; coins
     50 paise, 1, 2, 5, 10, 20.
   - Code on Social Security, 2020 s.53 (egazette.gov.in, Act 36 of 2020): 15 days' wages per completed year or part above six months,
     monthly rated = monthly wages / 26 x 15 (Explanation 3); five years' service not needed on death, disablement or end of fixed term;
     fixed term pro rata; ceiling as notified. Ministry of Labour "Compilation of FAQs on Four Labour Codes & Central Rules (as on
     25.10.2026)", labour.gov.in: in force from 21.11.2025, ceiling currently Rs 20 lakh, fixed-term employee eligible after one year.
   - Professional tax: NSStatRates (engine/statrates.js, read 4 and 19 Nov 2026 by the payroll work) is reused, not copied.
   - Depreciation: Income-tax Act, 2025 s.33 (half rate when put to use under 180 days in the year of purchase, s.33(4); additional 20%
     / 10% for new plant in manufacturing, s.33(8)-(9)); rates from Income-tax Rules, 2026 Appendix I (see rule 25), incometaxindia.gov.in
     upload 05/05/2026.
   - Capital gains: Income-tax Act, 2025 s.2(101) (short-term = held not more than 24 months; 12 months for listed securities, UTI units,
     equity-oriented fund units, zero-coupon bonds), s.196 (STCG on STT-paid equity 20%), s.197 (LTCG 12.5%; s.197(3) resident individual
     / HUF, land or building bought before 23 July 2024: tax above 20% with indexation ignored), s.198 (LTCG on STT-paid equity 12.5%
     above Rs 1,25,000); Cost Inflation Index table (incometaxindia.gov.in, Notification 70/2025 as amended by Finance Act 2026). */
(function (root) {
  'use strict';

  /* ===================== pure working (no screen) ===================== */
  var C = {};
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function r2(n) { return Math.round((n + (n >= 0 ? 1e-9 : -1e-9)) * 100) / 100; }
  function utc(iso) { var p = String(iso || '').split('-'); if (p.length !== 3) return NaN; return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function okDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && isFinite(utc(s)); }
  function days(a, b) { return Math.round((utc(b) - utc(a)) / 864e5); }
  function addDays(s, n) { return iso(utc(s) + n * 864e5); }
  function addMonths(s, n) {   /* same day n months later; a day that does not exist moves to the month's last day (31 Jan + 1 = 28/29 Feb) */
    var p = s.split('-'), y = +p[0], m = +p[1] - 1 + n, d = +p[2];
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return iso(Date.UTC(y, m, Math.min(d, last)));
  }
  C.num = num; C.r2 = r2; C.days = days; C.addDays = addDays; C.addMonths = addMonths; C.okDate = okDate;

  /* "every month or part of a month" for a delay that runs from the day after a to day b (both dates ISO).
     mode 'cal': each calendar month that the delay touches counts as one (11 Jan to 5 Feb = 2).
     mode 'date': whole months counted from date a, a part left over is one more (10 Jan to 10 Feb = 1, to 11 Feb = 2). */
  C.monthsPart = function (a, b, mode) {
    if (!okDate(a) || !okDate(b) || utc(b) <= utc(a)) return 0;
    if (mode === 'date') { var n = 0; while (utc(addMonths(a, n + 1)) <= utc(b)) n++; if (utc(addMonths(a, n)) < utc(b)) n++; return n; }
    var s = addDays(a, 1), y1 = +s.slice(0, 4), m1 = +s.slice(5, 7), y2 = +b.slice(0, 4), m2 = +b.slice(5, 7);
    return (y2 - y1) * 12 + (m2 - m1) + 1;
  };

  /* ---------- GST ---------- */
  C.GST = { rate: 18, read: '25 Nov 2026' };
  /* o: { tax, cash (part paid from the cash ledger), late (return filed late: interest only on cash), due, paid, rate } */
  C.gstInterest = function (o) {
    var rate = o.rate == null || o.rate === '' ? C.GST.rate : num(o.rate);
    if (!okDate(o.due) || !okDate(o.paid)) return { err: 'Type the due date and the date of payment.' };
    var d = days(o.due, o.paid); if (d <= 0) return { days: 0, base: 0, interest: 0, rate: rate, note: 'Paid on or before the due date: no interest.' };
    var base = o.late ? num(o.cash) : num(o.tax);
    if (!(base > 0)) return { err: o.late ? 'Type the tax paid in cash (from the electronic cash ledger).' : 'Type the tax paid late.' };
    var i = base * rate / 100 * d / 365;
    return { days: d, base: r2(base), rate: rate, interest: r2(i), rounded: Math.round(i), formula: r2(base) + ' × ' + rate + '% × ' + d + ' days ÷ 365' };
  };
  /* Interest on input tax credit wrongly availed AND utilised, s.50(3) CGST Act with rule 88B(3) CGST Rules (read 25 Nov 2026):
     - s.50(3) as substituted by Finance Act 2022 s.111 "deemed ... with effect from the 1st day of July, 2017" (in force 5 Jul 2022,
       Notification 9/2022-Central Tax): interest "at such rate not exceeding twenty-four per cent. as may be notified".
       Text confirmed in the CGST Act on indiacode.nic.in (copy "As on the 11th June, 2026").
     - Rate: Notification 13/2017-Central Tax (G.S.R. 661(E), 28 Jun 2017) serial 2 said 24; the Finance Act 2022 s.116(1) with the
       SIXTH SCHEDULE substituted "18" for "24" against serial number 2, with effect from 1 July 2017 (Finance Act 2022, Gazette
       30 Mar 2022, copy on thc.nic.in). So 18% a year.
     - Rule 88B(3) (Notification 14/2022-Central Tax, 5 Jul 2022, inserted with effect from 1 July 2017): interest on the amount
       wrongly availed and utilised, from the date of utilisation till the date of reversal or payment. Explanation: credit is used
       when the electronic credit ledger balance falls below the amount wrongly availed, to the extent it falls below; the date of
       use is (a) the due date of the return or the date it was filed, whichever is earlier, when it fell because of tax paid in that
       return, or (b) the date of the debit in all other cases.
     o: { amt, low (lowest balance after availing; '' = not known, all treated as used), how 'return'|'debit', rdue, rfiled, ddate, rev, rate } */
  C.GSTITC = { rate: 18, read: '25 Nov 2026' };
  C.gstItc = function (o) {
    var rate = o.rate == null || o.rate === '' ? C.GSTITC.rate : num(o.rate), amt = num(o.amt);
    if (!(amt > 0)) return { err: 'Type the input tax credit wrongly availed.' };
    var known = !(o.low == null || String(o.low).trim() === ''), low = known ? Math.max(0, num(o.low)) : 0;
    var used = known ? Math.min(amt, Math.max(0, amt - low)) : amt;
    if (!(used > 0)) return { none: true, used: 0, note: 'The credit ledger never fell below the wrong credit, so it was not used: no interest under section 50(3). Reverse the credit all the same.' };
    var util;
    if (o.how === 'debit') { if (!okDate(o.ddate)) return { err: 'Type the date of the debit that took the credit ledger below the wrong credit.' }; util = o.ddate; }
    else {
      if (!okDate(o.rdue)) return { err: 'Type the due date of the return in which the credit was used.' };
      util = okDate(o.rfiled) && utc(o.rfiled) < utc(o.rdue) ? o.rfiled : o.rdue;   /* rule 88B Explanation (2)(a): the earlier date */
    }
    if (!okDate(o.rev)) return { err: 'Type the date the credit was reversed or the tax paid.' };
    var d = days(util, o.rev);
    if (d <= 0) return { used: r2(used), util: util, days: 0, interest: 0, rate: rate, note: 'Reversed on or before the date of use: no interest.' };
    var i = used * rate / 100 * d / 365;
    return { used: r2(used), util: util, days: d, rate: rate, interest: r2(i), rounded: Math.round(i), partial: known && used < amt, formula: r2(used) + ' × ' + rate + '% × ' + d + ' days ÷ 365' };
  };

  /* Late fee, s.47 CGST Act (indiacode.nic.in copy "As on the 11th June, 2026"): (1) GSTR-1 (s.37), returns under s.39 (GSTR-3B,
     GSTR-4), s.45 (GSTR-10) and s.52: Rs 100 a day, at most Rs 5,000; (2) annual return s.44 (GSTR-9): Rs 100 a day, at most 0.25%
     of the turnover in the State or Union territory. These are the CENTRAL tax amounts; each State GST Act has the same s.47.
     Waivers under s.128 (all read 25 Nov 2026 on gstcouncil.gov.in, the State copies on mahagst.gov.in and comtax.wb.gov.in):
     - GSTR-3B: 76/2018-CT (Rs 25 a day, Rs 10 when central tax payable is nil) + 19/2021-CT (tax period / quarter June 2021 on, total
       at most Rs 250 nil, Rs 1,000 turnover up to 1.5 crore, Rs 2,500 above 1.5 up to 5 crore; above 5 crore the Act's Rs 5,000).
     - GSTR-1: 4/2018-CT (Rs 25 a day, Rs 10 with no outward supplies) + 20/2021-CT (same caps from June 2021).
     - GSTR-4: 73/2017-CT (Rs 25 a day, Rs 10 when central tax payable is nil) + 21/2021-CT (FY 2021-22 on: at most Rs 250 nil, Rs 1,000 others).
     - GSTR-7: 23/2024-CT (in force 1 Nov 2024, supersedes 22/2021-CT): from June 2021 Rs 25 a day, at most Rs 1,000; nil when the
       central tax deducted in the month is nil.
     - GSTR-9: 7/2023-CT (FY 2022-23 on): aggregate turnover up to 5 crore Rs 25 a day, 5 to 20 crore Rs 50 a day, each at most 0.02%
       of the turnover in the State/UT; above 20 crore no waiver (the Act).
     - GSTR-10: no standing waiver found; the 2023 amnesty (8/2023-CT, extended by 26/2023-CT) ended on 31 Aug 2023.
     State tax: Maharashtra 19/2021, 20/2021, 21/2021-State Tax (9 Jun 2021) and 07/2023-State Tax (24 May 2023), and West Bengal 634-F.T.
     (14 Jun 2021) repeat the same amounts word for word for State tax; the Punjab Excise and Taxation Department's own "GST Update
     March 2023" (taxation.punjab.gov.in) states the annual return fee as "25 CGST+25 SGST" and "0.02+0.02" per cent. So the State tax
     fee equals the central tax fee. IGST Act s.20(viii) applies the CGST provisions on "returns, other than late fee": no IGST late fee.
     UTGST Act s.21(ix) applies the CGST provisions on returns to Union territory tax.
     o: { form '3b'|'1'|'4'|'7'|'9'|'10', nil, band 'a'|'b'|'c' (3B/1), band9 'a' (up to 5 crore) | 'b' (5-20) | 'c' (above 20),
          turn (turnover in the State/UT, GSTR-9), fy (first year of the financial year, GSTR-4 / GSTR-9), period 'YYYY-MM', due, filed } */
  C.GSTFEE = { day: 25, dayNil: 10, act: 100, actMax: 5000, cap: { nil: 250, a: 1000, b: 2500, c: 5000 }, read: '25 Nov 2026',
    gstr4: { nil: 250, other: 1000, fromFy: 2021 }, gstr7: { day: 25, cap: 1000, from: '2021-06', nilFrom: '2024-11-01' },
    gstr9: { fromFy: 2022, a: 25, b: 50, pct: 0.02, actPct: 0.25 } };
  C.gstLateFee = function (o) {
    var F = C.GSTFEE, form = o.form || '3b';
    if (!okDate(o.due) || !okDate(o.filed)) return { err: 'Type the due date and the date you filed.' };
    var fy = parseInt(o.fy, 10);
    if ((form === '4' || form === '9') && !(fy > 2016)) return { err: 'Pick the financial year of the return.' };
    var turn = num(o.turn);
    if (form === '9' && !(turn > 0)) return { err: 'Type the turnover in this State or Union territory for the year.' };
    var d = days(o.due, o.filed); if (d <= 0) return { days: 0, fee: 0, sgst: 0, total: 0, note: 'Filed on or before the due date: no late fee.' };
    var per, cap, old = false, rule, okPeriod = o.period && /^\d{4}-\d{2}$/.test(o.period);
    if (form === '3b' || form === '1') {
      per = o.nil ? F.dayNil : F.day; cap = o.nil ? F.cap.nil : F.cap[o.band] || F.actMax;
      old = okPeriod && o.period < '2021-06';   /* caps of 19/2021 and 20/2021 apply from tax period June 2021 */
      if (old) cap = F.actMax;
      rule = form === '3b' ? (old ? '76/2018-CT; the 2021 caps start with June 2021' : '76/2018-CT and 19/2021-CT') : (old ? '4/2018-CT; the 2021 caps start with June 2021' : '4/2018-CT and 20/2021-CT');
    } else if (form === '4') {
      per = o.nil ? F.dayNil : F.day; old = fy < F.gstr4.fromFy;
      cap = old ? F.actMax : o.nil ? F.gstr4.nil : F.gstr4.other;
      rule = old ? '73/2017-CT; the 2021 caps start with FY 2021-22' : '73/2017-CT and 21/2021-CT';
    } else if (form === '7') {
      old = okPeriod && o.period < F.gstr7.from;
      if (o.nil && !old && o.filed >= F.gstr7.nilFrom) return { days: d, per: 0, cap: 0, raw: 0, fee: 0, sgst: 0, total: 0, rule: '23/2024-CT',
        note: 'No tax deducted in the month: the whole late fee is waived (Notification 23/2024-Central Tax, from 1 Nov 2024).' };
      per = old ? F.act : F.gstr7.day; cap = old ? F.actMax : F.gstr7.cap;
      rule = old ? 'section 47(1); the 2021 waiver starts with June 2021' : '23/2024-CT (earlier 22/2021-CT)';
    } else if (form === '9') {
      var G = F.gstr9; old = fy < G.fromFy;
      if (old || o.band9 === 'c') { per = F.act; cap = r2(turn * G.actPct / 100); rule = old ? 'section 47(2); 7/2023-CT starts with FY 2022-23' : 'section 47(2), no waiver above ₹20 crore'; }
      else { per = o.band9 === 'b' ? G.b : G.a; cap = r2(turn * G.pct / 100); rule = '7/2023-CT'; }
    } else if (form === '10') { per = F.act; cap = F.actMax; rule = 'section 47(1)'; }
    else return { err: 'Pick the return.' };
    var raw = per * d, fee = r2(Math.min(raw, cap, form === '9' ? Infinity : F.actMax));
    return { days: d, per: per, cap: cap, raw: raw, fee: fee, sgst: fee, total: r2(fee * 2), old: !!old, rule: rule };
  };

  /* ---------- TDS (Income-tax Act, 2025) ---------- */
  /* o: { tax, due (date the tax was deductible), ded (date deducted, '' = not yet), paid (date paid to the Government), mode } */
  C.tdsInterest = function (o) {
    var tax = num(o.tax); if (!(tax > 0)) return { err: 'Type the TDS amount.' };
    if (!okDate(o.due)) return { err: 'Type the date the tax was to be deducted.' };
    var ded = okDate(o.ded) ? o.ded : '', paid = okDate(o.paid) ? o.paid : '';
    if (!ded && !paid) return { err: 'Type the date it was deducted, or the date it was paid.' };
    var end1 = ded || paid;   /* not deducted at all but paid from own pocket: the 1% runs up to the payment */
    var m1 = C.monthsPart(o.due, end1, o.mode), m2 = ded && paid ? C.monthsPart(ded, paid, o.mode) : 0;
    var a = tax * 0.01 * m1, b = tax * 0.015 * m2;
    return { m1: m1, m2: m2, a: r2(a), b: r2(b), total: r2(a + b), rounded: Math.round(a + b) };
  };
  C.tdsFee = function (o) {
    if (!okDate(o.due) || !okDate(o.filed)) return { err: 'Type the due date of the statement and the date it was filed.' };
    var d = days(o.due, o.filed); if (d <= 0) return { days: 0, fee: 0, raw: 0 };
    var raw = 200 * d, tax = num(o.tax), fee = tax > 0 ? Math.min(raw, tax) : raw;
    return { days: d, raw: raw, fee: fee, capped: tax > 0 && raw > tax };
  };

  /* ---------- income tax (Income-tax Act, 2025) ---------- */
  /* s.423: o { tax (tax on income less taxes paid), due (due date of the return), filed (date filed), mode } */
  C.it423 = function (o) {
    var A = num(o.tax); if (!okDate(o.due) || !okDate(o.filed)) return { err: 'Type the due date of the return and the date you filed it.' };
    var T = C.monthsPart(o.due, o.filed, o.mode);
    return { months: T, base: r2(A), interest: r2(A * 0.01 * T), rounded: Math.round(A * 0.01 * T) };
  };
  /* s.424: o { assessed (assessed tax after TDS/TCS), adv (advance tax paid), year (tax year start, e.g. 2026), upto (date), mode } */
  C.it424 = function (o) {
    var at = num(o.assessed), adv = num(o.adv), y = parseInt(o.year, 10);
    if (!(at > 0)) return { err: 'Type the assessed tax (tax on your income less TDS and TCS).' };
    if (!(y > 2000) || !okDate(o.upto)) return { err: 'Pick the tax year and the date up to which to work it out.' };
    if (adv >= at * 0.9) return { none: true, base: 0, months: 0, interest: 0, note: 'Advance tax paid is 90% or more of the assessed tax: no interest under section 424.' };
    var start = (y + 1) + '-04-01', m = C.monthsPart(addDays(start, -1), o.upto, o.mode), base = at - adv;
    return { base: r2(base), months: m, from: start, interest: r2(base * 0.01 * m), rounded: Math.round(base * 0.01 * m) };
  };
  /* s.425: o { tax (tax due on returned income), p1..p4 (advance tax paid by 15 Jun, 15 Sep, 15 Dec, 15 Mar, each the TOTAL so far),
     presumptive (s.58(2)) } -> rows with the shortfall and interest. The 12% / 36% relief (s.425(2)) is applied to the June and September
     rows only. */
  C.it425 = function (o) {
    var t = num(o.tax); if (!(t > 0)) return { err: 'Type the tax due on the income in your return (less TDS and TCS).' };
    var paid = [num(o.p1), num(o.p2), num(o.p3), num(o.p4)];
    if (o.presumptive) { var sf = Math.max(0, t - paid[3]); return { rows: [{ when: '15 March', due: t, paid: paid[3], short: r2(sf), rate: 1, interest: r2(sf * 0.01) }], total: r2(sf * 0.01) }; }
    var P = [[15, 3, 12, '15 June'], [45, 3, 36, '15 September'], [75, 3, null, '15 December'], [100, 1, null, '15 March']];
    var rows = P.map(function (p, i) {
      var due = t * p[0] / 100, sf = Math.max(0, due - paid[i]), safe = p[2] != null && paid[i] >= t * p[2] / 100;
      var it = safe ? 0 : sf * p[1] / 100;
      return { when: p[3], pct: p[0], due: r2(due), paid: paid[i], short: r2(sf), rate: p[1], safe: safe, interest: r2(it) };
    });
    return { rows: rows, total: r2(rows.reduce(function (s, r) { return s + r.interest; }, 0)) };
  };

  /* ---------- MSME late payment (MSMED Act 2006) ---------- */
  C.MSME = { bankRate: 5.75, rateDate: '23 Nov 2026' };
  /* the day interest starts: agreed 'none' -> appointed day (the day after the 15 days that follow acceptance); agreed n days (<=45)
     -> that date; agreed above 45 -> 45 days from acceptance */
  C.msmeStart = function (accepted, agreed) {
    if (!okDate(accepted)) return '';
    var a = parseInt(agreed, 10);
    if (!(a > 0)) return addDays(accepted, 16);
    return addDays(accepted, Math.min(a, 45));
  };
  /* o { amount, start (first day of interest), paid (date paid), bankRate } -> monthly rests, compound; days after the last full month
     at the same rate, simple, on the balance */
  C.msmeInterest = function (o) {
    var P = num(o.amount), br = o.bankRate === '' || o.bankRate == null ? C.MSME.bankRate : num(o.bankRate);
    if (!(P > 0)) return { err: 'Type the amount due.' };
    if (!okDate(o.start) || !okDate(o.paid)) return { err: 'Type the dates.' };
    if (utc(o.paid) < utc(o.start)) return { rows: [], interest: 0, total: r2(P), rate: br * 3, note: 'Paid before interest starts: no interest.' };
    var yr = br * 3, mr = yr / 12 / 100, bal = P, rows = [], cur = o.start, n = 0, end = addDays(o.paid, 1);   /* the payment day counts */
    while (utc(addMonths(o.start, n + 1)) <= utc(end)) {
      var next = addMonths(o.start, n + 1), it = bal * mr;
      rows.push({ from: cur, to: addDays(next, -1), open: r2(bal), interest: r2(it), close: r2(bal + it) });
      bal += it; cur = next; n++;
    }
    var left = days(cur, end);
    if (left > 0) { var it2 = bal * yr / 100 * left / 365; rows.push({ from: cur, to: o.paid, open: r2(bal), interest: r2(it2), close: r2(bal + it2), days: left }); bal += it2; }
    return { rate: yr, months: n, rows: rows, interest: r2(bal - P), total: r2(bal) };
  };

  /* ---------- gratuity (Code on Social Security, 2020, s.53) ---------- */
  C.GRAT = { cap: 2000000, days: 15, div: 26 };
  /* o { wage (monthly wages last drawn: basic + DA + retaining allowance, plus the part of allowances above 50%), from, to,
       why 'retire'|'resign'|'death'|'disable'|'fixed' } */
  C.gratuity = function (o) {
    var w = num(o.wage); if (!(w > 0)) return { err: 'Type the monthly wages last drawn.' };
    if (!okDate(o.from) || !okDate(o.to) || utc(o.to) <= utc(o.from)) return { err: 'Type the date of joining and the last working day.' };
    var end = addDays(o.to, 1), yrs = 0; while (utc(addMonths(o.from, (yrs + 1) * 12)) <= utc(end)) yrs++;
    var mo = 0, base = addMonths(o.from, yrs * 12); while (utc(addMonths(base, mo + 1)) <= utc(end)) mo++;
    var dd = days(addMonths(base, mo), end), fixed = o.why === 'fixed', need5 = !(o.why === 'death' || o.why === 'disable' || fixed);
    var service = yrs + ' years, ' + mo + ' months, ' + dd + ' days';
    if (need5 && yrs < 5) return { service: service, yrs: yrs, none: true, note: 'Less than five years of continuous service: no gratuity on retirement or resignation.' };
    if (fixed && yrs < 1) return { service: service, yrs: yrs, none: true, note: 'A fixed-term employee is paid gratuity after one year of service under the contract.' };
    var counted = fixed ? yrs + mo / 12 : yrs + ((mo > 6 || (mo === 6 && dd > 0)) ? 1 : 0);
    var amt = w / C.GRAT.div * C.GRAT.days * counted, capped = amt > C.GRAT.cap;
    return { service: service, yrs: yrs, counted: r2(counted), perYear: r2(w / 26 * 15), amount: r2(Math.min(amt, C.GRAT.cap)), full: r2(amt), capped: capped, fixed: fixed };
  };

  /* ---------- depreciation (Income-tax Act, 2025 s.33; Income-tax Rules, 2026 Appendix I) ---------- */
  C.BLOCKS = [
    ['bres', 'Buildings used mainly for living in (not hotels or boarding houses)', 5],
    ['both', 'Other buildings (shop, office, factory, hotel)', 10],
    ['btmp', 'Purely temporary structures such as wooden structures', 40],
    ['furn', 'Furniture and fittings, including electrical fittings', 10],
    ['pm', 'Machinery and plant (general)', 15],
    ['car', 'Motor cars, other than those run on hire', 15],
    ['hire', 'Motor buses, lorries and taxis used in a business of running them on hire', 30],
    ['comp', 'Computers including computer software', 40],
    ['mould', 'Moulds used in rubber and plastic goods factories', 30],
    ['poll', 'Air or water pollution control equipment (as listed in the Rules)', 40],
    ['intan', 'Know-how, patents, copyrights, trademarks, licences, franchises', 25]
  ];
  /* o { rate, open (written down value on 1 April), addFull (bought and put to use 180 days or more), addHalf (put to use for less
     than 180 days this year), sold (money from assets of this block sold), extra (claim additional depreciation on new plant) } */
  C.depreciation = function (o) {
    var R = num(o.rate), op = num(o.open), af = num(o.addFull), ah = num(o.addHalf), sold = num(o.sold);
    if (!(R > 0)) return { err: 'Pick a block of assets or type the rate.' };
    var total = op + af + ah - sold;
    if (total <= 0) return { total: r2(total), dep: 0, close: r2(Math.max(0, total)), gain: r2(Math.max(0, -total)), note: total < 0 ? 'The money from sales is more than the whole block: the extra is a short-term capital gain, and no depreciation is allowed.' : 'Nothing is left in the block: no depreciation.' };
    /* sales come off the full-rate part first, then off the new part used under 180 days */
    var full = op + af - sold, half = ah;
    if (full < 0) { half += full; full = 0; }
    var d1 = full * R / 100, d2 = half * R / 200, ex = 0, exNext = 0;
    if (o.extra) { ex = af * 0.20 + ah * 0.10; exNext = ah * 0.10; }
    var dep = d1 + d2 + ex;
    return { total: r2(total), full: r2(full), half: r2(half), d1: r2(d1), d2: r2(d2), extra: r2(ex), extraNext: r2(exNext), dep: r2(dep), close: r2(total - d1 - d2 - ex) };
  };

  /* ---------- capital gains (Income-tax Act, 2025) ---------- */
  C.CII = { '2001-02': 100, '2002-03': 105, '2003-04': 109, '2004-05': 113, '2005-06': 117, '2006-07': 122, '2007-08': 129, '2008-09': 137, '2009-10': 148, '2010-11': 167, '2011-12': 184, '2012-13': 200, '2013-14': 220, '2014-15': 240, '2015-16': 254, '2016-17': 264, '2017-18': 272, '2018-19': 280, '2019-20': 289, '2020-21': 301, '2021-22': 317, '2022-23': 331, '2023-24': 348, '2024-25': 363, '2025-26': 376, '2026-27': 384 };
  C.fyOf = function (d) { var y = +d.slice(0, 4), m = +d.slice(5, 7), s = m >= 4 ? y : y - 1; return s + '-' + String(s + 1).slice(2); };
  C.ciiOf = function (d) { if (!okDate(d)) return null; var f = C.fyOf(d); if (f < '2001-02') f = '2001-02'; return C.CII[f] || null; };
  /* o { kind 'eq' (equity share / equity fund unit, STT paid) | 'list' (other listed security, UTI unit, zero-coupon bond) | 'land'
       (land or building) | 'other', bought, sold (dates), cost, impr, imprDate, sale, exp (selling expenses), resident (individual or
       HUF, resident) } */
  C.capGains = function (o) {
    if (!okDate(o.bought) || !okDate(o.sold) || utc(o.sold) < utc(o.bought)) return { err: 'Type the date bought and the date sold.' };
    var cost = num(o.cost), impr = num(o.impr), sale = num(o.sale), exp = num(o.exp);
    if (!(sale > 0)) return { err: 'Type the sale price.' };
    var limit = o.kind === 'eq' || o.kind === 'list' ? 12 : 24, longT = utc(o.sold) > utc(addMonths(o.bought, limit));
    var gain = sale - exp - cost - impr, r = { months: limit, long: longT, gain: r2(gain), net: r2(sale - exp) };
    if (!longT) {
      if (o.kind === 'eq') { r.rate = 20; r.sec = '196 (old 111A)'; r.tax = r2(Math.max(0, gain) * 0.20); }
      else { r.slab = true; r.sec = 'normal slab rates'; }
      return r;
    }
    if (o.kind === 'eq') {
      r.sec = '198 (old 112A)'; r.rate = 12.5; r.exempt = 125000;
      r.taxable = r2(Math.max(0, gain - 125000)); r.tax = r2(r.taxable * 0.125); return r;
    }
    r.sec = '197 (old 112)'; r.rate = 12.5; r.tax = r2(Math.max(0, gain) * 0.125);
    if (o.kind === 'land' && o.resident && utc(o.bought) < utc('2024-07-23')) {
      var cs = C.ciiOf(o.sold), cb = C.ciiOf(o.bought), ci = impr ? C.ciiOf(o.imprDate || o.bought) : 0;
      if (!cs) { r.noCii = true; return r; }
      var ic = cost * cs / cb, ii = impr ? impr * cs / (ci || cb) : 0, ig = sale - exp - ic - ii;
      r.idx = { ciiSold: cs, ciiBought: cb, ciiImpr: ci, cost: r2(ic), impr: r2(ii), gain: r2(ig), tax: r2(Math.max(0, ig) * 0.20) };
      r.best = r.idx.tax < r.tax ? 'idx' : 'plain';
      r.final = Math.min(r.tax, r.idx.tax);
    }
    return r;
  };

  /* ---------- cash counter ---------- */
  C.NOTES = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
  C.COINS = [20, 10, 5, 2, 1, 0.5];
  C.cashTotal = function (counts) {   /* counts { 'n500': 3, 'c10': 4, ... } */
    var t = 0, pcs = 0;
    C.NOTES.forEach(function (v) { var k = Math.max(0, Math.floor(num(counts['n' + v]))); t += k * v; pcs += k; });
    C.COINS.forEach(function (v) { var k = Math.max(0, Math.floor(num(counts['c' + v]))); t += k * v; pcs += k; });
    return { total: r2(t), pieces: pcs };
  };

  /* ---------- UPI ---------- */
  C.upiOk = function (s) { return /^[A-Za-z0-9._-]{2,256}@[A-Za-z][A-Za-z0-9.-]{1,63}$/.test(String(s || '').trim()); };
  C.upiLink = function (o) {
    var q = 'pa=' + encodeURIComponent(String(o.pa || '').trim()) + (o.pn ? '&pn=' + encodeURIComponent(String(o.pn).trim().slice(0, 50)) : '');
    var a = num(o.am); if (a > 0) q += '&am=' + a.toFixed(2);
    q += '&cu=INR'; if (o.tn) q += '&tn=' + encodeURIComponent(String(o.tn).trim().slice(0, 80));
    return 'upi://pay?' + q;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = C;
  root.NSMoneyCalc = C;
  if (typeof document === 'undefined') return;

  /* ===================== screens ===================== */
  var A = window.NSApp; if (!A || !window.NS || !window.NSFreeTools) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc;
  var QRJS = '/assets/vendor/qrcode-generator-1.4.4.min.js';
  var READ = '25 Nov 2026';
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function money(n) { return NS.money ? NS.money(n) : '₹' + (+n || 0).toFixed(2); }
  function fmt(n, d) { return (+n || 0).toLocaleString('en-IN', { maximumFractionDigits: d == null ? 2 : d }); }
  function fd(s) { return NS.fmtDate ? NS.fmtDate(s) : s; }
  function today() { return NS.today ? NS.today() : new Date().toISOString().slice(0, 10); }
  function res(items) { return items.map(function (x) { return '<div><span>' + esc(x[0]) + '</span><b>' + esc(x[1]) + '</b></div>'; }).join(''); }
  function note(t) { return '<p class="fz-note fm-src">' + t + '</p>'; }
  function dl(blob, name) { var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }
  function printHtml(title, body) {   /* a hidden frame with its own page, printed; the App screen is left as it is */
    var f = document.createElement('iframe'); f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
    document.body.appendChild(f);
    var d = f.contentWindow.document;
    d.open(); d.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font:14px/1.45 system-ui,Segoe UI,Arial,sans-serif;color:#111;margin:18px}h1{font-size:20px;margin:0 0 8px}table{border-collapse:collapse;width:100%;margin:8px 0}td,th{border:1px solid #999;padding:5px 8px;text-align:left}td.n,th.n{text-align:right}.c{text-align:center}img{max-width:100%}small{color:#444}@page{margin:12mm}</style></head><body>' + body + '</body></html>'); d.close();
    setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(function () { f.remove(); }, 2000); }, 350);
  }
  function shareText(title, text) {
    if (navigator.share) { navigator.share({ title: title, text: text }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { NS.toast('Copied. Paste it in a message.'); }, function () { NS.toast('Could not copy.', 'bad'); });
  }
  function subTabs(list, cur) {
    return '<div class="pr-bar fz-tabs fm-sub" role="group" aria-label="Choose">' + list.map(function (t) { return '<button type="button" class="btn' + (t[0] === cur ? ' primary' : '') + '" data-st="' + t[0] + '" aria-pressed="' + (t[0] === cur) + '">' + t[1] + '</button>'; }).join('') + '</div>';
  }
  function wireTabs(n) {
    n.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-st]'); if (!b || !n.contains(b)) return;
      var k = b.getAttribute('data-st');
      $$('[data-st]', b.parentNode).forEach(function (x) { var on = x === b; x.classList.toggle('primary', on); x.setAttribute('aria-pressed', on); });
      $$('[data-pane]', n).forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== k; });
    });
  }
  var styled = false;
  function css() {
    if (styled) return; styled = true;
    var s = document.createElement('style');
    s.textContent = '.fm-src{border-left:3px solid var(--line);padding-left:8px}' +
      '.fm-sum{margin:4px 0 8px;font-size:1.05rem;overflow-wrap:anywhere}.fm-sub{margin:8px 0}.fz-tool h4{margin:16px 0 4px}' +
      '.fm-tbl{width:100%;border-collapse:collapse;margin:8px 0;font-size:.92rem}.fm-tbl th,.fm-tbl td{border-bottom:1px solid var(--line);padding:6px 6px;text-align:left;vertical-align:top}.fm-tbl td.n,.fm-tbl th.n{text-align:right;white-space:nowrap}' +
      '.fm-wrap{overflow-x:auto;max-width:100%}' +
      '.fm-qr{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}.fm-qr canvas{background:#fff;border-radius:10px;padding:10px;max-width:100%;height:auto;width:240px;box-sizing:border-box}' +
      '.fm-link{font-family:var(--mono,monospace);font-size:.85rem;overflow-wrap:anywhere;word-break:break-all;background:var(--surface2);padding:6px 8px;border-radius:8px}' +
      '.fm-cash{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}' +
      '.fm-cash label{display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--surface2);border-radius:10px;padding:6px 10px;font-weight:600;min-width:0}' +
      '.fm-cash input{width:80px;min-height:40px;text-align:right;box-sizing:border-box}.fm-cash small{display:block;font-weight:400;color:var(--soft);font-size:.78rem}' +
      '.fm-bad{color:var(--bad,#c0392b);font-weight:600}.fm-ok{color:var(--good,#1e8449);font-weight:600}' +
      '.fm-blk{flex:1 1 260px}.fm-blk select{width:100%}' +
      '@media (max-width:420px){.fm-cash{grid-template-columns:1fr 1fr}.fm-cash label{padding:6px}.fm-cash input{width:56px}.fm-tbl{font-size:.85rem}}';
    document.head.appendChild(s);
  }
  function f(key, label, type, attrs) {
    type = type || 'number';
    var a = attrs || '';
    if (type === 'number') return '<label>' + label + ' <input type="number" step="any" min="0" inputmode="decimal" data-k="' + key + '"' + a + '></label>';
    if (type === 'date') return '<label>' + label + ' <input type="date" data-k="' + key + '"' + a + '></label>';
    if (type === 'check') return '<label class="fz-chk"><input type="checkbox" data-k="' + key + '"' + a + '> ' + label + '</label>';
    return '<label>' + label + ' <input type="text" data-k="' + key + '"' + a + '></label>';
  }
  function sel(key, label, opts, cls) { return '<label' + (cls ? ' class="' + cls + '"' : '') + '>' + label + ' <select data-k="' + key + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('') + '</select></label>'; }
  function vals(box) { var o = {}; $$('[data-k]', box).forEach(function (i) { o[i.getAttribute('data-k')] = i.type === 'checkbox' ? i.checked : i.value; }); return o; }
  var MODES = [['cal', 'Each calendar month touched counts'], ['date', 'Months counted from the date']];

  /* ---------------- 1. UPI QR ---------------- */
  function upiNode() {
    css();
    var n = el('div', 'fz-tool'), biz = (A.biz && A.biz()) || {};
    n.innerHTML = '<h3>UPI QR with amount</h3><p class="soft">Make a QR code that any UPI app can scan to pay you. Put an amount in it, or leave the amount empty so the payer types it.</p>' +
      '<div class="fz-card"><div class="fz-row"><label class="fz-wide">Your UPI ID <input type="text" data-k="pa" autocomplete="off" spellcheck="false" placeholder="name@bank" inputmode="email"></label>' +
      '<label class="fz-wide">Name shown to the payer <input type="text" data-k="pn" maxlength="50"></label></div>' +
      '<div class="fz-row"><label>Amount ₹ <input type="number" step="0.01" min="0" inputmode="decimal" data-k="am" placeholder="optional"></label>' +
      '<label class="fz-wide">Note (shown in the payer\'s app) <input type="text" data-k="tn" maxlength="80" placeholder="optional, e.g. Bill 123"></label></div>' +
      '<p class="fz-note" data-msg aria-live="polite"></p></div>' +
      '<div class="fm-qr" data-out hidden><canvas data-cv width="300" height="300" role="img" aria-label="UPI QR code"></canvas><div style="min-width:0;flex:1 1 220px"><div class="fm-sum"><b data-sum></b></div><p class="fm-link" data-link></p>' +
      '<div class="pr-bar"><button type="button" class="btn primary" data-png data-ic="download">Download PNG</button><button type="button" class="btn" data-card>Print a table card</button><button type="button" class="btn" data-share>Share</button><button type="button" class="btn" data-copy>Copy the link</button></div></div></div>' +
      note('The QR holds a standard <span class="mono">upi://pay</span> link. Before you put it up, scan it once with your own phone and check the name and amount your app shows. A QR with an amount is fine for one bill; for a counter card, leave the amount empty.');
    var inp = function (k) { return $('[data-k="' + k + '"]', n); };
    if (biz.upi) inp('pa').value = biz.upi;
    inp('pn').value = biz.name || '';
    function draw() {
      var o = vals(n), msg = $('[data-msg]', n), out = $('[data-out]', n), qr;
      if (!String(o.pa).trim()) { msg.textContent = 'Type your UPI ID. Tip: save it in My data › your business, then it fills by itself here and on your bills.'; out.hidden = true; return; }
      if (!C.upiOk(o.pa)) { msg.innerHTML = '<span class="fm-bad">This does not look like a UPI ID. It looks like name@bank, with no spaces.</span>'; out.hidden = true; return; }
      if (o.am !== '' && !(num(o.am) > 0)) { msg.innerHTML = '<span class="fm-bad">The amount must be more than zero, or empty.</span>'; out.hidden = true; return; }
      msg.textContent = '';
      var link = C.upiLink(o);
      if (!window.qrcode) { NS.loadJs(QRJS).then(function () { if (window.qrcode) draw(); }, function () { msg.innerHTML = '<span class="fm-bad">The QR part did not load. Open NSBiz once with the internet on, then it works offline too.</span>'; }); return; }
      try { qr = window.qrcode(0, 'M'); qr.addData(link); qr.make(); } catch (e) { msg.textContent = 'The text is too long for a QR code. Shorten the note.'; out.hidden = true; return; }
      var cv = $('[data-cv]', n), cnt = qr.getModuleCount(), px = Math.max(4, Math.floor(300 / (cnt + 8))), size = px * (cnt + 8);
      cv.width = cv.height = size; var x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, size, size); x.fillStyle = '#000';
      for (var r = 0; r < cnt; r++) for (var c = 0; c < cnt; c++) if (qr.isDark(r, c)) x.fillRect((c + 4) * px, (r + 4) * px, px, px);
      $('[data-sum]', n).textContent = (o.pn ? o.pn + ' · ' : '') + String(o.pa).trim() + (num(o.am) > 0 ? ' · ' + money(num(o.am)) : ' · amount typed by the payer');
      $('[data-link]', n).textContent = link; out.hidden = false;
    }
    function poster() {   /* a 1000 x 1400 card: name, QR, UPI ID, amount, note */
      var o = vals(n), W = 1000, H = 1400, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      var x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#0e746a'; x.fillRect(0, 0, W, 170); x.fillStyle = '#fff'; x.textAlign = 'center';
      x.font = 'bold 60px system-ui, Segoe UI, Arial'; x.fillText('Scan and pay by UPI', W / 2, 108);
      x.fillStyle = '#111'; x.font = 'bold 56px system-ui, Segoe UI, Arial'; x.fillText(String(o.pn || '').slice(0, 30), W / 2, 270);
      var src = $('[data-cv]', n), q = 720; x.imageSmoothingEnabled = false; x.drawImage(src, (W - q) / 2, 320, q, q);
      x.font = '40px system-ui, Segoe UI, Arial'; x.fillStyle = '#333'; x.fillText(String(o.pa).trim(), W / 2, 1110);
      if (num(o.am) > 0) { x.font = 'bold 70px system-ui, Segoe UI, Arial'; x.fillStyle = '#111'; x.fillText(money(num(o.am)), W / 2, 1210); }
      if (o.tn) { x.font = '36px system-ui, Segoe UI, Arial'; x.fillStyle = '#444'; x.fillText(String(o.tn).slice(0, 45), W / 2, 1280); }
      x.font = '28px system-ui, Segoe UI, Arial'; x.fillStyle = '#777'; x.fillText('Works with any UPI app', W / 2, 1360);
      return cv;
    }
    function pngOf(cv) { return new Promise(function (r) { cv.toBlob(r, 'image/png'); }); }
    function fname() { var o = vals(n); return 'UPI QR ' + String(o.pa).trim().replace(/[^A-Za-z0-9.@-]+/g, '-') + (num(o.am) > 0 ? ' ' + num(o.am) : '') + '.png'; }
    n.addEventListener('input', draw);
    n.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button'); if (!b || $('[data-out]', n).hidden) return;
      if (b.hasAttribute('data-png')) pngOf(poster()).then(function (bl) { dl(bl, fname()); });
      else if (b.hasAttribute('data-card')) printHtml('UPI QR', '<div class="c"><img alt="UPI QR card" src="' + poster().toDataURL('image/png') + '" style="width:120mm"></div>');
      else if (b.hasAttribute('data-copy')) { var t = $('[data-link]', n).textContent; if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { NS.toast('Link copied.'); }, function () {}); }
      else if (b.hasAttribute('data-share')) {
        var o = vals(n), text = 'Pay ' + (o.pn || '') + ' by UPI: ' + String(o.pa).trim() + (num(o.am) > 0 ? ', amount ' + money(num(o.am)) : '') + (o.tn ? ' (' + o.tn + ')' : '');
        pngOf(poster()).then(function (bl) {
          var file = new File([bl], fname(), { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: 'UPI QR', text: text }).catch(function () {});
          else { dl(bl, fname()); shareText('UPI QR', text); }
        });
      }
    });
    setTimeout(draw, 0);
    return n;
  }

  /* ---------------- 2. late payment interest and late fees ---------------- */
  function lateNode() {
    css();
    var n = el('div', 'fz-tool');
    var FYS = []; for (var y = 2017; y <= 2026; y++) FYS.push([String(y), y + '-' + String(y + 1).slice(2)]);
    var gst = '<div data-pane="gst">' +
      '<h4>Interest on GST paid late (section 50 of the CGST Act)</h4><div class="fz-card" data-box="gi"><div class="fz-row">' + f('tax', 'Tax paid late ₹') + f('due', 'Due date', 'date') + f('paid', 'Date paid', 'date') + f('rate', 'Rate % a year') + '</div>' +
      '<div class="fz-row">' + f('late', 'The tax was declared in a return filed late (GSTR-3B)', 'check') + '<label data-cashl hidden>Part paid from the cash ledger ₹ <input type="number" step="any" min="0" inputmode="decimal" data-k="cash"></label></div>' +
      '<div class="fz-res" data-out aria-live="polite"></div></div>' +
      note('Read ' + READ + ' on taxinformation.cbic.gov.in, indiacode.nic.in and gstcouncil.gov.in: section 50(1) allows up to 18% a year and Notification 13/2017-Central Tax fixes 18%. Interest runs from the day after the due date (section 50(2), rule 88B(2)). When a return is filed late, interest is only on the tax paid from the electronic cash ledger (proviso to section 50(1) and rule 88B(1), in force from 1 July 2017), unless the return is filed after proceedings under section 73, 74 or 74A have started. Worked out by days ÷ 365. Work out each tax (CGST, SGST, IGST) on its own amount the same way.') +
      '<h4>Interest on input tax credit wrongly availed and used (section 50(3))</h4><div class="fz-card" data-box="gc"><div class="fz-row">' + f('amt', 'Credit wrongly availed ₹') +
        f('low', 'Lowest balance of the credit ledger after it was availed ₹ (leave empty if not known)') + f('rate', 'Rate % a year') + '</div>' +
      '<div class="fz-row">' + sel('how', 'The ledger went below the wrong credit because of', [['return', 'Tax paid in a return (GSTR-3B)'], ['debit', 'Another debit of the credit ledger']], 'fz-wide') +
        f('rdue', 'Due date of that return', 'date') + f('rfiled', 'Date that return was filed', 'date') + f('ddate', 'Date of that debit', 'date') + f('rev', 'Date reversed or paid', 'date') + '</div>' +
      '<div class="fz-res" data-out aria-live="polite"></div><div data-work></div></div>' +
      note('Read ' + READ + ': section 50(3) of the CGST Act as put in by the Finance Act 2022 with effect from 1 July 2017 (interest only on credit wrongly availed AND used, at a notified rate up to 24%); the Finance Act 2022 (section 116 and Sixth Schedule) changed the rate in Notification 13/2017-Central Tax from 24% to 18% from 1 July 2017; rule 88B(3) of the CGST Rules (Notification 14/2022-Central Tax): interest on the amount used, from the date of use until the date it is reversed or paid. The credit counts as used only when the credit ledger balance falls below the wrong credit, and only by the amount it falls below. The date of use is the due date of the return or the date it was filed, whichever is earlier, when the balance fell because of tax paid in that return; otherwise the date of that debit. Days are counted from the date of use to the date of reversal (days between the two dates) ÷ 365. Credit wrongly availed but never used carries no interest under section 50(3), but must still be reversed. Work out IGST, CGST and SGST credit each on its own ledger.') +
      '<h4>Late fee for a GST return (section 47)</h4><div class="fz-card" data-box="gf"><div class="fz-row">' +
        sel('form', 'Return', [['3b', 'GSTR-3B'], ['1', 'GSTR-1'], ['4', 'GSTR-4 (composition, yearly)'], ['7', 'GSTR-7 (TDS deductor)'], ['9', 'GSTR-9 (annual return)'], ['10', 'GSTR-10 (final return)']]) +
        f('period', 'Tax period (month)', 'text', ' placeholder="2026-10" inputmode="numeric" maxlength="7"') +
        '<label data-fyl hidden>Financial year <select data-k="fy">' + FYS.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === '2025' ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></label>' +
        f('due', 'Due date', 'date') + f('filed', 'Date filed', 'date') + '</div>' +
      '<div class="fz-row">' + sel('band', 'Turnover last year', [['a', 'Up to ₹1.5 crore'], ['b', '₹1.5 crore to ₹5 crore'], ['c', 'Above ₹5 crore']]) +
        sel('band9', 'Aggregate turnover in that year', [['a', 'Up to ₹5 crore'], ['b', '₹5 crore to ₹20 crore'], ['c', 'Above ₹20 crore']]) +
        f('turn', 'Turnover in this State or UT that year ₹') +
        f('nil', '<span data-niltx>Nil return</span>', 'check') + '</div>' +
      '<div class="fz-res" data-out aria-live="polite"></div><div data-work></div></div>' +
      note('Read ' + READ + ' on gstcouncil.gov.in, indiacode.nic.in, mahagst.gov.in, comtax.wb.gov.in and taxation.punjab.gov.in. Section 47 of the CGST Act: ₹100 a day, at most ₹5,000 (GSTR-1, GSTR-3B, GSTR-4, GSTR-7, GSTR-10); for GSTR-9 at most 0.25% of the turnover in the State or UT. Lower amounts by notification (Central Tax): GSTR-3B 76/2018 and 19/2021, GSTR-1 4/2018 and 20/2021 (₹25 a day, ₹10 for a nil return; from tax period June 2021 at most ₹250 nil, ₹1,000 up to ₹1.5 crore turnover, ₹2,500 up to ₹5 crore); GSTR-4 73/2017 and 21/2021 (₹25 / ₹10 a day; from 2021-22 at most ₹250 nil, ₹1,000 others); GSTR-7 23/2024 (₹25 a day, at most ₹1,000, nothing when no tax was deducted); GSTR-9 7/2023 (from 2022-23: ₹25 a day up to ₹5 crore turnover, ₹50 a day up to ₹20 crore, at most 0.02% of the turnover in the State or UT). These are central tax amounts. Each State GST Act and its notifications charge the same amount again as State tax (read: Maharashtra 19, 20, 21/2021 and 07/2023-State Tax, West Bengal 634-F.T. of 2021, and the Punjab Taxation Department\'s GST Update of March 2023, "25 CGST + 25 SGST"). There is no late fee under the IGST Act (section 20 applies the CGST rules on returns "other than late fee"). One-time amnesties (2020 to 2023) are not counted. Annual return exemptions for small taxpayers are not checked here.') + '</div>';
    var tds = '<div data-pane="tds" hidden>' +
      '<h4>Interest on TDS deducted or paid late (section 398(3), old 201(1A))</h4><div class="fz-card" data-box="ti"><div class="fz-row">' + f('tax', 'TDS amount ₹') + f('due', 'Date the tax was to be deducted', 'date') + f('ded', 'Date actually deducted', 'date') + f('paid', 'Date paid to the Government', 'date') + '</div>' +
      '<div class="fz-row">' + sel('mode', 'How to count months', MODES, 'fz-wide') + '</div><div class="fz-res" data-out aria-live="polite"></div><div data-work></div></div>' +
      note('Read ' + READ + ' on incometaxindia.gov.in, Income-tax Act, 2025 section 398(3)(a): 1% for every month or part of a month from the date the tax was deductible to the date it was deducted, and 1.5% for every month or part of a month from the date deducted to the date paid. Pay it before filing the statement. The Act does not say how to count a part of a month; two ways are shown, pick the one your TDS demand uses.') +
      '<h4>Late fee for a TDS or TCS statement (section 427, old 234E)</h4><div class="fz-card" data-box="tf"><div class="fz-row">' + f('due', 'Due date of the statement', 'date') + f('filed', 'Date filed', 'date') + f('tax', 'Tax in the statement ₹ (the fee cannot be more)') + '</div><div class="fz-res" data-out aria-live="polite"></div></div>' +
      note('Read ' + READ + ': section 427 of the Income-tax Act, 2025, ₹200 for every day the failure continues, not more than the tax deductible or collectible, paid before filing.') + '</div>';
    var it = '<div data-pane="it" hidden>' +
      '<div class="fz-row">' + sel('mode', 'How to count months', MODES, 'fz-wide') + '</div>' +
      '<h4>Return filed late (section 423, old 234A)</h4><div class="fz-card" data-box="i3"><div class="fz-row">' + f('tax', 'Tax on your income less taxes already paid ₹') + f('due', 'Due date of the return', 'date') + f('filed', 'Date filed', 'date') + '</div><div class="fz-res" data-out aria-live="polite"></div></div>' +
      '<h4>Advance tax less than 90% (section 424, old 234B)</h4><div class="fz-card" data-box="i4"><div class="fz-row">' + f('assessed', 'Assessed tax (tax less TDS/TCS) ₹') + f('adv', 'Advance tax paid ₹') +
        '<label>Tax year <select data-k="year">' + [2025, 2026, 2027].map(function (y) { return '<option value="' + y + '"' + (y === 2026 ? ' selected' : '') + '>' + y + '-' + String(y + 1).slice(2) + '</option>'; }).join('') + '</select></label>' + f('upto', 'Work out up to (date tax paid)', 'date') + '</div><div class="fz-res" data-out aria-live="polite"></div></div>' +
      '<h4>Advance tax instalments short (section 425, old 234C)</h4><div class="fz-card" data-box="i5"><div class="fz-row">' + f('tax', 'Tax due on income in the return (less TDS/TCS) ₹') + f('presumptive', 'Presumptive income under section 58(2) (pay all by 15 March)', 'check') + '</div>' +
        '<div class="fz-row">' + f('p1', 'Paid by 15 June ₹') + f('p2', 'Total paid by 15 September ₹') + f('p3', 'Total paid by 15 December ₹') + f('p4', 'Total paid by 15 March ₹') + '</div><div data-out aria-live="polite"></div></div>' +
      note('Read ' + READ + ' on incometaxindia.gov.in, Income-tax Act, 2025: section 423, simple interest 1% × tax × number of months from the day after the due date; section 424, 1% for every month or part of a month from 1 April after the tax year when advance tax paid is less than 90% of the assessed tax; section 425, 3% on the shortfall at 15 June (15% due), 15 September (45%), 15 December (75%) and 1% at 15 March (100%), with no interest at 15 June if 12% was paid and at 15 September if 36% was paid. Section 425 does not charge interest on a shortfall from capital gains, dividends, winnings or first-year business income paid in later instalments: take those out of the tax yourself. An estimate, not an assessment.') + '</div>';
    var ms = '<div data-pane="msme" hidden>' +
      '<h4>Interest on late payment to a micro or small enterprise (MSMED Act 2006, sections 15 and 16)</h4><div class="fz-card" data-box="mi"><div class="fz-row">' + f('amount', 'Amount due ₹') + f('accepted', 'Goods or services accepted on', 'date') +
        sel('agreed', 'Payment terms agreed in writing', [['', 'None'], ['15', '15 days'], ['30', '30 days'], ['45', '45 days'], ['60', 'More than 45 days']]) + f('paid', 'Date paid (or today)', 'date') + f('bank', 'RBI bank rate %') + '</div>' +
        '<div class="fz-res" data-out aria-live="polite"></div><div data-work></div></div>' +
      note('Read ' + READ + ' on dcmsme.gov.in (MSMED Act note and FAQs on delayed payments): the buyer pays compound interest with monthly rests at three times the bank rate notified by RBI. Interest starts on the appointed day (the day after 15 days from acceptance) when nothing was agreed, on the agreed date when it is 45 days or less, and 45 days from acceptance when more was agreed. RBI Bank Rate on rbi.org.in for 23 Nov 2026: 5.75%; change it if the rate changed during the period. Days after the last full month are worked out simply on the balance.') + '</div>';
    n.innerHTML = '<h3>Late payment interest and late fees</h3><p class="soft">Work out interest and late fees for GST, TDS, income tax and money owed to a micro or small enterprise. The working is shown so you can check it.</p>' +
      subTabs([['gst', 'GST'], ['tds', 'TDS'], ['it', 'Income tax'], ['msme', 'MSME payments']], 'gst') + gst + tds + it + ms;
    wireTabs(n);
    var t0 = today(); $$('input[type=date]', n).forEach(function (i) { if (/^(paid|filed|upto)$/.test(i.getAttribute('data-k'))) i.value = t0; });
    $('[data-box="mi"] [data-k="bank"]', n).value = C.MSME.bankRate;
    $('[data-box="gi"] [data-k="rate"]', n).value = C.GST.rate;
    $('[data-box="gc"] [data-k="rate"]', n).value = C.GSTITC.rate;
    function box(k) { return $('[data-box="' + k + '"]', n); }
    function mode() { return $('[data-pane="it"] > .fz-row [data-k="mode"]', n).value; }
    function bad(r) { return '<p class="fm-bad">' + esc(r.err) + '</p>'; }
    function run() {
      var b, o, r;
      b = box('gi'); o = vals(b); $('[data-cashl]', b).hidden = !o.late; r = C.gstInterest(o);
      $('[data-out]', b).innerHTML = r.err ? bad(r) : r.note ? '<p>' + esc(r.note) + '</p>' : res([['Days late', fmt(r.days, 0)], ['Interest on', money(r.base)], ['Interest', money(r.interest)], ['Rounded', money(r.rounded)]]) + '<p class="fz-note">' + esc(r.formula) + '</p>';
      b = box('gc'); o = vals(b); r = C.gstItc(o);
      [['rdue', o.how !== 'debit'], ['rfiled', o.how !== 'debit'], ['ddate', o.how === 'debit']].forEach(function (x) { $('[data-k="' + x[0] + '"]', b).closest('label').hidden = !x[1]; });
      $('[data-out]', b).innerHTML = r.err ? bad(r) : r.none ? '<p class="fm-ok">' + esc(r.note) + '</p>' : r.note ? '<p>' + esc(r.note) + '</p>' :
        res([['Credit used', money(r.used)], ['Date of use', fd(r.util)], ['Days', fmt(r.days, 0)], ['Interest at ' + r.rate + '%', money(r.interest)], ['Rounded', money(r.rounded)]]);
      $('[data-work]', b).innerHTML = r.err || r.none || !r.formula ? '' : '<p class="fz-note">' + esc(r.formula) + (r.partial ? '. Only the part by which the ledger fell below the wrong credit is used (rule 88B).' : '') + '</p>';
      b = box('gf'); o = vals(b); r = C.gstLateFee(o);
      var fm = o.form, show = { period: /^(3b|1|7)$/.test(fm), band: /^(3b|1)$/.test(fm), band9: fm === '9', turn: fm === '9', nil: /^(3b|1|4|7)$/.test(fm) };
      Object.keys(show).forEach(function (k) { $('[data-k="' + k + '"]', b).closest('label').hidden = !show[k]; });
      $('[data-fyl]', b).hidden = !/^(4|9)$/.test(fm);
      $('[data-niltx]', b).textContent = fm === '1' ? 'No outward supplies in the period' : fm === '7' ? 'No tax deducted in the month' : 'Nil return (no central tax payable)';
      $('[data-out]', b).innerHTML = r.err ? bad(r) : r.note && !r.rule ? '<p>' + esc(r.note) + '</p>' : r.note ? '<p class="fm-ok">' + esc(r.note) + '</p>' :
        res([['Days late', fmt(r.days, 0)], ['₹' + r.per + ' a day', money(r.raw)], ['Cap', money(r.cap)], ['Central tax (CGST)', money(r.fee)], ['State or UT tax (SGST / UTGST)', money(r.sgst)], ['Total late fee', money(r.total)]]);
      $('[data-work]', b).innerHTML = r.err || !r.rule || r.note ? '' : '<p class="fz-note">' + esc('Each part: lower of ₹' + r.per + ' × ' + r.days + ' days = ' + fmt(r.raw) + ' and the cap ' + fmt(r.cap) + '. Rule used: ' + r.rule + '. The same amount is charged again under the State or UT GST law; no late fee under IGST.') + '</p>' +
        (r.old && fm !== '9' && fm !== '4' ? '<p class="fz-note">Tax period before June 2021: the 2021 caps do not apply. Earlier one-time waivers are not counted.</p>' : '');
      b = box('ti'); o = vals(b); r = C.tdsInterest(o);
      $('[data-out]', b).innerHTML = r.err ? bad(r) : res([['Late deduction: months × 1%', r.m1 + ' → ' + money(r.a)], ['Late payment: months × 1.5%', r.m2 + ' → ' + money(r.b)], ['Interest', money(r.total)], ['Rounded', money(r.rounded)]]);
      $('[data-work]', b).innerHTML = r.err ? '' : '<p class="fz-note">' + esc(fmt(num(o.tax)) + ' × 1% × ' + r.m1 + ' + ' + fmt(num(o.tax)) + ' × 1.5% × ' + r.m2) + '</p>';
      b = box('tf'); o = vals(b); r = C.tdsFee(o);
      $('[data-out]', b).innerHTML = r.err ? bad(r) : res([['Days late', fmt(r.days, 0)], ['₹200 a day', money(r.raw)], ['Late fee', money(r.fee) + (r.capped ? ' (capped at the tax)' : '')]]);
      b = box('i3'); o = vals(b); o.mode = mode(); r = C.it423(o);
      $('[data-out]', b).innerHTML = r.err ? bad(r) : res([['Months', String(r.months)], ['Interest 1% a month', money(r.interest)], ['Rounded', money(r.rounded)]]);
      b = box('i4'); o = vals(b); o.mode = mode(); r = C.it424(o);
      $('[data-out]', b).innerHTML = r.err ? bad(r) : r.none ? '<p class="fm-ok">' + esc(r.note) + '</p>' : res([['Shortfall', money(r.base)], ['Months from ' + fd(r.from), String(r.months)], ['Interest 1% a month', money(r.interest)], ['Rounded', money(r.rounded)]]);
      b = box('i5'); o = vals(b); r = C.it425(o);
      $('[data-out]', b).innerHTML = r.err ? bad(r) : '<div class="fm-wrap"><table class="fm-tbl"><thead><tr><th>By</th><th class="n">Due</th><th class="n">Paid</th><th class="n">Short</th><th class="n">Rate</th><th class="n">Interest</th></tr></thead><tbody>' +
        r.rows.map(function (x) { return '<tr><td>' + esc(x.when) + (x.safe ? '<br><small>paid enough: none</small>' : '') + '</td><td class="n">' + money(x.due) + '</td><td class="n">' + money(x.paid) + '</td><td class="n">' + money(x.short) + '</td><td class="n">' + x.rate + '%</td><td class="n">' + money(x.interest) + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><th colspan="5">Total</th><th class="n">' + money(r.total) + '</th></tr></tfoot></table></div>';
      b = box('mi'); o = vals(b); var start = C.msmeStart(o.accepted, o.agreed);
      if (!start) { $('[data-out]', b).innerHTML = '<p class="fz-note">Type the date the goods or services were accepted.</p>'; $('[data-work]', b).innerHTML = ''; }
      else {
        r = C.msmeInterest({ amount: o.amount, start: start, paid: o.paid, bankRate: o.bank });
        $('[data-out]', b).innerHTML = r.err ? bad(r) : res([['Interest starts', fd(start)], ['Rate (3 × bank rate)', fmt(r.rate) + '% a year'], ['Interest', money(r.interest || 0)], ['Amount with interest', money(r.total)]]) + (r.note ? '<p>' + esc(r.note) + '</p>' : '');
        $('[data-work]', b).innerHTML = r.err || !r.rows || !r.rows.length ? '' : '<details><summary>Month by month (' + r.rows.length + ' lines)</summary><div class="fm-wrap"><table class="fm-tbl"><thead><tr><th>From</th><th>To</th><th class="n">Opening</th><th class="n">Interest</th><th class="n">Closing</th></tr></thead><tbody>' +
          r.rows.map(function (x) { return '<tr><td>' + fd(x.from) + '</td><td>' + fd(x.to) + (x.days ? ' (' + x.days + ' days)' : '') + '</td><td class="n">' + money(x.open) + '</td><td class="n">' + money(x.interest) + '</td><td class="n">' + money(x.close) + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
      }
    }
    n.addEventListener('input', run); n.addEventListener('change', run);
    run();
    return n;
  }

  /* ---------------- 3. cash counter ---------------- */
  function cashNode() {
    css();
    var n = el('div', 'fz-tool');
    function cell(p, v, sub) { var lbl = v < 1 ? '50 paise' : '₹' + v; return '<label><span>' + lbl + (sub ? '<small>' + sub + '</small>' : '') + '</span><input type="number" min="0" step="1" inputmode="numeric" data-c="' + p + v + '" aria-label="' + lbl + (p === 'n' ? ' notes' : ' coins') + '"></label>'; }
    n.innerHTML = '<h3>Cash counter</h3><p class="soft">Count the notes and coins in the drawer. The total and the amount in words update as you type. Enter moves to the next box.</p>' +
      '<div class="fz-card"><h4>Notes</h4><div class="fm-cash">' + C.NOTES.map(function (v) { return cell('n', v, v === 2000 ? 'withdrawn, still legal tender' : v <= 5 ? 'old note, still valid' : ''); }).join('') + '</div>' +
      '<h4>Coins</h4><div class="fm-cash">' + C.COINS.map(function (v) { return cell('c', v); }).join('') + '</div></div>' +
      '<div class="fz-card"><div class="fz-row"><label>Cash in hand as per books ₹ <input type="number" step="any" inputmode="decimal" data-exp></label><button type="button" class="btn" data-books hidden>Take it from my cash book</button></div>' +
      '<div class="fz-res" data-out aria-live="polite"></div><p data-words></p>' +
      '<div class="pr-bar"><button type="button" class="btn primary" data-print>Print</button><button type="button" class="btn" data-share>Share</button><button type="button" class="btn" data-clear>Clear</button></div></div>' +
      note('Read ' + READ + ' on rbi.org.in: ₹2000 notes were withdrawn from circulation on 19 May 2023 but remain legal tender (RBI FAQ, updated 30 Sep 2023); notes of ₹10 to ₹500 are issued now, and ₹1, ₹2 and ₹5 notes issued earlier are still valid; coins of 50 paise, ₹1, ₹2, ₹5, ₹10 and ₹20 (RBI FAQ on Indian currency, updated 15 Apr 2025). Nothing is saved: the count stays only until you close NSBiz.');
    var B = A.B || window.NSBooks;
    function bookCash() { try { if (!B || !B.book || !A.mine || !(A.biz && A.biz())) return null; return B.book(A.mine(), A.bizName(), 'cash', null, today()).close; } catch (e) { return null; } }
    if (bookCash() != null) $('[data-books]', n).hidden = false;
    function counts() { var o = {}; $$('[data-c]', n).forEach(function (i) { o[i.getAttribute('data-c')] = i.value; }); return o; }
    function lines() {
      var o = counts(), L = [];
      C.NOTES.forEach(function (v) { var k = Math.floor(num(o['n' + v])); if (k > 0) L.push(['₹' + v + ' notes', k, k * v]); });
      C.COINS.forEach(function (v) { var k = Math.floor(num(o['c' + v])); if (k > 0) L.push([(v < 1 ? '50 paise' : '₹' + v) + ' coins', k, k * v]); });
      return L;
    }
    function run() {
      var t = C.cashTotal(counts()), ex = $('[data-exp]', n).value, items = [['Total cash', money(t.total)], ['Notes and coins', fmt(t.pieces, 0)]];
      if (ex !== '') { var d = r2(t.total - num(ex)); items.push([d === 0 ? 'Matches the books' : d > 0 ? 'More than the books by' : 'Short of the books by', money(Math.abs(d))]); }
      $('[data-out]', n).innerHTML = res(items);
      $('[data-words]', n).textContent = t.total ? NS.inWords(t.total) : '';
      return t;
    }
    n.addEventListener('input', run);
    n.addEventListener('keydown', function (e) {   /* Enter moves to the next box */
      if (e.key !== 'Enter' || !e.target.matches('[data-c]')) return; e.preventDefault();
      var all = $$('[data-c]', n), i = all.indexOf(e.target); (all[i + 1] || $('[data-exp]', n)).focus();
    });
    n.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-books')) { var c = bookCash(); if (c != null) { $('[data-exp]', n).value = c; run(); NS.toast('Cash in hand on ' + fd(today()) + ': ' + money(c)); } }
      else if (b.hasAttribute('data-clear')) { $$('[data-c]', n).forEach(function (i) { i.value = ''; }); $('[data-exp]', n).value = ''; run(); }
      else if (b.hasAttribute('data-print')) {
        var t = run(), L = lines(), ex = $('[data-exp]', n).value, biz = A.bizName ? A.bizName() : '';
        printHtml('Cash count', '<h1>Cash count</h1><p>' + esc(biz) + (biz ? ' · ' : '') + fd(today()) + ' ' + new Date().toTimeString().slice(0, 5) + '</p><table><thead><tr><th>Note / coin</th><th class="n">Count</th><th class="n">Amount</th></tr></thead><tbody>' +
          L.map(function (l) { return '<tr><td>' + l[0] + '</td><td class="n">' + l[1] + '</td><td class="n">' + money(l[2]) + '</td></tr>'; }).join('') + '</tbody><tfoot><tr><th>Total</th><th class="n">' + t.pieces + '</th><th class="n">' + money(t.total) + '</th></tr></tfoot></table><p>' + esc(NS.inWords(t.total)) + '</p>' +
          (ex !== '' ? '<p>Cash as per books: ' + money(num(ex)) + ' · Difference: ' + money(r2(t.total - num(ex))) + '</p>' : '') + '<p style="margin-top:40px">Counted by: ____________________ &nbsp; Checked by: ____________________</p>');
      } else if (b.hasAttribute('data-share')) {
        var t2 = run(), ex2 = $('[data-exp]', n).value;
        shareText('Cash count', 'Cash count ' + fd(today()) + '\n' + lines().map(function (l) { return l[0] + ' × ' + l[1] + ' = ' + money(l[2]); }).join('\n') + '\nTotal: ' + money(t2.total) + '\n' + NS.inWords(t2.total) + (ex2 !== '' ? '\nAs per books: ' + money(num(ex2)) + ', difference ' + money(r2(t2.total - num(ex2))) : ''));
      }
    });
    run();
    return n;
  }

  /* ---------------- 4. gratuity, professional tax, depreciation, capital gains ---------------- */
  function payNode() {
    css();
    var n = el('div', 'fz-tool');
    var states = (NS.STATES || []).filter(function (s) { return /^\d\d$/.test(s[0]) && +s[0] < 40; });
    var grat = '<div data-pane="grat"><div class="fz-card" data-box="gr"><div class="fz-row">' + f('wage', 'Monthly wages last drawn ₹') + f('from', 'Date of joining', 'date') + f('to', 'Last working day', 'date') +
      sel('why', 'Leaving because of', [['retire', 'Retirement'], ['resign', 'Resignation or termination'], ['death', 'Death'], ['disable', 'Disablement by accident or disease'], ['fixed', 'End of a fixed-term contract']]) + '</div>' +
      '<div class="fz-res" data-out aria-live="polite"></div></div>' +
      note('Read ' + READ + ': Code on Social Security, 2020, section 53 (in force from 21 November 2025): 15 days\' wages for every completed year of service, or part above six months, at the last wages; for monthly pay, wages ÷ 26 × 15. Five years of continuous service are needed, except on death, disablement or the end of a fixed term; a fixed-term employee is paid pro rata after one year (Ministry of Labour FAQs on the Labour Codes, as on 25.10.2026). The ceiling is ₹20 lakh as now notified (same FAQs). "Wages" = basic pay, dearness allowance and retaining allowance; if other allowances are more than half of the pay, the extra is added. Fixed-term pro rata is counted here by whole months.') + '</div>';
    var pt = '<div data-pane="pt" hidden><div class="fz-card" data-box="pt"><div class="fz-row"><label class="fm-blk">State <select data-k="st">' + states.map(function (s) { return '<option value="' + s[0] + '">' + esc(s[1]) + '</option>'; }).join('') + '</select></label>' +
      f('gross', 'Monthly gross pay ₹') + sel('sex', 'Employee', [['m', 'Man'], ['f', 'Woman']]) + sel('regime', 'Income-tax regime', [['new', 'New'], ['old', 'Old']]) + '</div>' +
      '<div class="fz-res" data-out aria-live="polite"></div><div data-work></div></div><p class="fz-note fm-src" data-ptsrc></p></div>';
    var dep = '<div data-pane="dep" hidden><div class="fz-card" data-box="dp"><div class="fz-row"><label class="fm-blk">Block of assets <select data-k="blk">' + C.BLOCKS.map(function (b) { return '<option value="' + b[0] + '">' + esc(b[1]) + ' (' + b[2] + '%)</option>'; }).join('') + '<option value="">Other: type the rate</option></select></label>' + f('rate', 'Rate %') + '</div>' +
      '<div class="fz-row">' + f('open', 'Written down value on 1 April ₹') + f('addFull', 'Bought this year, used 180 days or more ₹') + f('addHalf', 'Bought this year, used less than 180 days ₹') + f('sold', 'Money from assets of this block sold ₹') + '</div>' +
      '<div class="fz-row">' + f('extra', 'Additional depreciation on new plant or machinery (manufacturing or power business)', 'check') + '</div>' +
      '<div class="fz-res" data-out aria-live="polite"></div><p class="fz-note" data-work></p></div>' +
      note('Read ' + READ + ': Income-tax Act, 2025, section 33 (old section 32): depreciation on the written down value of each block at the prescribed rate; half the rate for an asset bought in the year and used for less than 180 days (section 33(4)); additional 20% of the cost of new plant and machinery in manufacturing or power, 10% if used less than 180 days with the other 10% next year (sections 33(8) and (9); not for office appliances, road vehicles or plant in an office or house). Rates: Income-tax Rules, 2026, Appendix I (rule 25). Assets used partly for personal purposes get only the business share. This is the tax depreciation, not the one in your company accounts.') + '</div>';
    var cg = '<div data-pane="cg" hidden><div class="fz-card" data-box="cg"><div class="fz-row"><label class="fm-blk">What was sold <select data-k="kind"><option value="land">Land or building</option><option value="eq">Equity shares or equity mutual fund units (STT paid)</option><option value="list">Other listed securities, UTI units, zero-coupon bonds</option><option value="other">Anything else (gold, unlisted shares, debt funds and so on)</option></select></label>' + f('resident', 'Seller is a resident individual or HUF', 'check', ' checked') + '</div>' +
      '<div class="fz-row">' + f('bought', 'Date bought', 'date') + f('cost', 'Cost ₹') + f('sold', 'Date sold', 'date') + f('sale', 'Sale price ₹') + f('exp', 'Selling expenses ₹ (brokerage, stamp, etc.)') + '</div>' +
      '<div class="fz-row">' + f('impr', 'Cost of improvement ₹') + f('imprDate', 'Improvement made on', 'date') + '</div>' +
      '<div data-out aria-live="polite"></div></div>' +
      note('Read ' + READ + ' on incometaxindia.gov.in, Income-tax Act, 2025: short-term means held not more than 24 months, or 12 months for listed securities, UTI units, equity fund units and zero-coupon bonds (section 2(101)); short-term gain on STT-paid equity 20% (section 196); long-term gain 12.5% (section 197); for a resident individual or HUF selling land or a building bought before 23 July 2024, the tax is not more than 20% of the gain with indexation (section 197(3)); long-term gain on STT-paid equity 12.5% above ₹1,25,000 a year (section 198). Cost Inflation Index: 2001-02 = 100 … 2025-26 = 376, 2026-27 = 384. Tax shown before surcharge and cess. Other short-term gains are added to your income and taxed at slab rates. An asset bought before 1 April 2001 uses the index of 2001-02 here; check the cost to use for it.') + '</div>';
    n.innerHTML = '<h3>Gratuity, professional tax, depreciation, capital gains</h3><p class="soft">Four quick calculators. Each shows its working and the law it follows.</p>' +
      subTabs([['grat', 'Gratuity'], ['pt', 'Professional tax'], ['dep', 'Depreciation'], ['cg', 'Capital gains']], 'grat') + grat + pt + dep + cg;
    wireTabs(n);
    function box(k) { return $('[data-box="' + k + '"]', n); }
    $('[data-box="gr"] [data-k="to"]', n).value = today(); $('[data-box="cg"] [data-k="sold"]', n).value = today();
    var bz = A.biz && A.biz(); if (bz && bz.state) { var ss = $('[data-box="pt"] [data-k="st"]', n); if ($('option[value="' + bz.state + '"]', ss)) ss.value = bz.state; }
    function blkRate() { var b = box('dp'), k = $('[data-k="blk"]', b).value, x = C.BLOCKS.filter(function (y) { return y[0] === k; })[0]; var ri = $('[data-k="rate"]', b); if (x) { ri.value = x[2]; ri.readOnly = true; } else { ri.readOnly = false; ri.focus(); } }
    function ptSrc() {
      var sr = window.NSStatRates; if (!sr) return 'The professional tax table did not load.';
      var known = Object.keys(sr.PT).map(function (c) { return NS.stateName(c); }).filter(Boolean), none = Object.keys(sr.NONE).map(function (c) { return NS.stateName(c); }).filter(Boolean);
      return 'From the NSBiz payroll table (each state\'s Act, read 4 and 19 Nov 2026). Covered: ' + esc(known.join(', ')) + '. No professional tax on salaries: ' + esc(none.join(', ')) + '. Other states: not in the table yet, check your state\'s schedule.';
    }
    $('[data-ptsrc]', n).innerHTML = ptSrc();
    function run(e) {
      var b, o, r, SR = window.NSStatRates;
      if (e && e.type === 'change' && e.target && e.target.matches('[data-k="blk"]')) blkRate();
      b = box('gr'); o = vals(b); r = C.gratuity(o);
      $('[data-out]', b).innerHTML = r.err ? '<p class="fz-note">' + esc(r.err) + '</p>' : r.none ? res([['Service', r.service]]) + '<p class="fm-bad">' + esc(r.note) + '</p>' :
        res([['Service', r.service], ['Years counted', fmt(r.counted, 2)], ['For each year (wages ÷ 26 × 15)', money(r.perYear)], ['Gratuity', money(r.amount)]]) + (r.capped ? '<p class="fz-note">Worked out ' + money(r.full) + ', above the ₹20 lakh ceiling.</p>' : '');
      b = box('pt'); o = vals(b);
      if (!SR) $('[data-out]', b).innerHTML = '<p class="fm-bad">The professional tax table is not loaded on this screen.</p>';
      else if (!(num(o.gross) > 0)) { $('[data-out]', b).innerHTML = '<p class="fz-note">Type the monthly gross pay.</p>'; $('[data-work]', b).innerHTML = ''; }
      else {
        var emp = { sex: o.sex, regime: o.regime }, months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3].map(function (m) { return [m, SR.pt(o.st, num(o.gross), m, emp)]; });
        if (months[0][1] == null) { $('[data-out]', b).innerHTML = '<p class="fm-bad">This state is not in the NSBiz table yet. Check your state\'s professional tax schedule.</p>'; $('[data-work]', b).innerHTML = ''; }
        else {
          var yr = months.reduce(function (s, m) { return s + m[1]; }, 0), MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          var odd = months.filter(function (m) { return m[1] !== months[0][1]; });
          $('[data-out]', b).innerHTML = res([['A month (April)', money(months[0][1])], ['In a year', money(yr)]]);
          $('[data-work]', b).innerHTML = '<p class="fz-note">' + esc(SR.ptSource(o.st)) + '</p>' + (odd.length ? '<p class="fz-note">Different months: ' + odd.map(function (m) { return MN[m[0]] + ' ' + money(m[1]); }).join(' · ') + '</p>' : '');
        }
      }
      b = box('dp'); o = vals(b); r = C.depreciation(o);
      $('[data-out]', b).innerHTML = r.err ? '<p class="fm-bad">' + esc(r.err) + '</p>' : r.note ? res([['Block after additions and sales', money(r.total)]]) + '<p class="fm-bad">' + esc(r.note) + '</p>' :
        res([['Depreciation at full rate', money(r.d1)], ['At half rate (used under 180 days)', money(r.d2)]].concat(o.extra ? [['Additional depreciation', money(r.extra)], ['Additional left for next year', money(r.extraNext)]] : []).concat([['Depreciation for the year', money(r.dep)], ['Written down value next 1 April', money(r.close)]]));
      $('[data-work]', b).textContent = r.err || r.note ? '' : fmt(r.full) + ' × ' + fmt(num(o.rate)) + '% + ' + fmt(r.half) + ' × ' + fmt(num(o.rate) / 2) + '%' + (o.extra ? ' + additional 20% × ' + fmt(num(o.addFull)) + ' + 10% × ' + fmt(num(o.addHalf)) : '');
      b = box('cg'); o = vals(b); r = C.capGains(o);
      var h;
      if (r.err) h = '<p class="fz-note">' + esc(r.err) + '</p>';
      else {
        var it = [['Held', r.long ? 'More than ' + r.months + ' months: long-term' : 'Not more than ' + r.months + ' months: short-term'], ['Sale less expenses', money(r.net)], ['Gain', money(r.gain)]];
        if (r.slab) it.push(['Tax', 'Added to your income, slab rates']);
        else if (r.exempt) { it.push(['Taxable above ₹1,25,000', money(r.taxable)]); it.push(['Tax at 12.5% (section ' + r.sec + ')', money(r.tax)]); }
        else if (r.idx) { it.push(['Tax at 12.5% without indexation', money(r.tax)]); it.push(['Tax at 20% with indexation', money(r.idx.tax)]); it.push(['Tax payable (the lower)', money(r.final)]); }
        else it.push(['Tax at ' + r.rate + '% (section ' + r.sec + ')', money(r.tax)]);
        h = '<div class="fz-res">' + res(it) + '</div>';
        if (r.idx) h += '<p class="fz-note">Indexed cost = ' + fmt(num(o.cost)) + ' × ' + r.idx.ciiSold + ' ÷ ' + r.idx.ciiBought + ' = ' + money(r.idx.cost) + (num(o.impr) ? '; indexed improvement = ' + money(r.idx.impr) : '') + '; indexed gain ' + money(r.idx.gain) + '. ' + (r.best === 'idx' ? 'With indexation is lower.' : 'Without indexation is lower.') + '</p>';
        if (r.noCii) h += '<p class="fz-note">The Cost Inflation Index for the year of sale is not in the table yet, so only the 12.5% working is shown.</p>';
        if (r.exempt) h += '<p class="fz-note">The ₹1,25,000 is for all such gains in the year together.</p>';
        if (r.gain < 0) h += '<p class="fz-note">This is a loss. Ask your accountant how to set it off and carry it forward.</p>';
      }
      $('[data-out]', b).innerHTML = h;
    }
    n.addEventListener('input', run); n.addEventListener('change', run);
    blkRate(); run();
    return n;
  }

  NSFreeTools.add('upiqr', 'UPI QR with amount', 'money', upiNode);
  NSFreeTools.add('lateint', 'Late interest and late fees', 'money', lateNode);
  NSFreeTools.add('cashcount', 'Cash counter', 'money', cashNode);
  NSFreeTools.add('paytax', 'Gratuity, PT, depreciation, capital gains', 'money', payNode);
})(typeof window !== 'undefined' ? window : globalThis);
