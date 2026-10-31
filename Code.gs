/**
 * EURONOVA CTF - Google Apps Script backend (no server, no Node.js).
 * Records are saved in a Google Sheet that this script creates by itself in your Drive.
 *
 * STEP 1: change the password below.
 * STEP 2: put each room's real flag in the "flag" field (between the quotes).
 * Only you (the script owner) can see this file. Flags are never sent to students' browsers.
 */
var JUDGE_PASSWORD = 'change-me-before-the-fest';
var EVENT_NAME = 'Euronova CTF';

var CATS = {
  "juniors": {
    "label": "Juniors",
    "description": "CyLab challenges",
    "flagHint": "EURONOVA{...}",
    "challenges": [
      {
        "id": 1,
        "title": "IT is super SSH",
        "points": 100,
        "flag": "",
        "url": "https://learn.cylabacademy.org/library/424?page=1&search=sup&workspace=true"
      },
      {
        "id": 2,
        "title": "Bypass Me",
        "points": 100,
        "flag": "",
        "url": "https://learn.cylabacademy.org/library/761?page=1&search=Bypass+me&workspace=true"
      },
      {
        "id": 3,
        "title": "Hashgate",
        "points": 100,
        "flag": "",
        "url": "https://learn.cylabacademy.org/library/750?page=1&search=hashga&workspace=true"
      },
      {
        "id": 4,
        "title": "Quantum Scrambler",
        "points": 100,
        "flag": "",
        "url": "https://learn.cylabacademy.org/library/479?page=1&workspace=true&search=quantum"
      },
      {
        "id": 5,
        "title": "Power Analysis",
        "points": 100,
        "flag": "",
        "url": "https://learn.cylabacademy.org/library/366?page=1&workspace=true&search=power"
      },
      {
        "id": 6,
        "title": "Invisible Words",
        "points": 100,
        "flag": "",
        "url": "https://learn.cylabacademy.org/library/354?page=1&workspace=true&search=invisible"
      }
    ]
  },
  "seniors": {
    "label": "Seniors",
    "description": "CyLab challenges",
    "flagHint": "EURONOVA{...}",
    "challenges": [
      {
        "id": 1,
        "title": "Undo",
        "points": 100,
        "flag": "",
        "url": "https://learn.cylabacademy.org/library/766?page=1&difficulty=1&category=5&workspace=true&search=undo"
      },
      {
        "id": 2,
        "title": "Sudo Make Me a Sandwich",
        "points": 100,
        "flag": "",
        "url": "https://learn.cylabacademy.org/library/766?page=1&difficulty=1&workspace=true&bookmarked=true"
      },
      {
        "id": 3,
        "title": "Fantasy CTF",
        "points": 100,
        "flag": "",
        "url": "https://learn.cylabacademy.org/library/471?page=1&difficulty=1&workspace=true&category=5&search=fantasy+ctf"
      },
      {
        "id": 4,
        "title": "Rust Fix Me",
        "points": 100,
        "flag": "",
        "url": "https://learn.cylabacademy.org/library/461?page=1&difficulty=1&workspace=true&bookmarked=true&search=rust+fix"
      },
      {
        "id": 5,
        "title": "Binary Search",
        "points": 100,
        "flag": "",
        "url": "https://learn.cylabacademy.org/library/442?page=1&difficulty=1&workspace=true&bookmarked=true&search=binary+search"
      }
    ]
  }
};

// ===================== nothing below needs editing =====================

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) === 'judge' ? 'judge' : 'index';
  return HtmlService.createHtmlOutputFromFile(page)
    .setTitle(page === 'judge' ? "Judges - " + EVENT_NAME : EVENT_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ---------- helpers ----------
function now_() { return new Date().getTime(); }
function R_(status, body) { return { status: status, body: body }; }
function clean_(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f​-‏‪-‮⁠﻿]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }
function norm_(s) { return clean_(s, 200).toLowerCase(); }
function eq_(a, b) { a = String(a); b = String(b); var d = a.length ^ b.length; for (var i = 0; i < Math.min(a.length, b.length); i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
function hex_(bytes) { return bytes.map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join(''); }
function rand_() { return Utilities.getUuid().replace(/-/g, ''); }
function list_(cat) { return CATS[cat].challenges; }
function flagOf_(c) { return String(c.flag || ''); }

// ---------- storage (Google Sheet) ----------
function ss_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID'), ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) { ss = SpreadsheetApp.create(EVENT_NAME + ' records'); props.setProperty('SHEET_ID', ss.getId()); }
  return ss;
}
function data_() {
  var ss = ss_(), sh = ss.getSheetByName('Data');
  if (!sh) {
    sh = ss.getSheets()[0]; sh.setName('Data');
    sh.getRange('A:D').setNumberFormat('@');
    sh.getRange(1, 1, 1, 4).setValues([['id', 'key', 'token', 'data']]);
    if (!ss.getSheetByName('Records')) ss.insertSheet('Records');
    sh.hideSheet();
  }
  return sh;
}
function findRow_(sh, col, val) {
  var n = sh.getLastRow() - 1; if (n < 1) return 0;
  var vals = sh.getRange(2, col, n, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]) === String(val)) return i + 2;
  return 0;
}
function getP_(sh, id) {
  if (!/^p[0-9a-f]{11}$/.test(String(id))) return null;
  var row = findRow_(sh, 1, id); if (!row) return null;
  var p = JSON.parse(sh.getRange(row, 4).getValue()); p._row = row; return p;
}
function putP_(sh, p) {
  var row = p._row; delete p._row;
  sh.getRange(row, 4).setValue(JSON.stringify(p)); p._row = row;
}
function findByToken_(sh, token) {
  token = String(token || ''); var i = token.indexOf('-'); if (i < 1) return null;
  var p = getP_(sh, token.slice(0, i));
  return p && eq_(p.token, token) ? p : null;
}
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(25000); } catch (e) { throw new Error('BUSY'); }
  try { return fn(); } finally { lock.releaseLock(); }
}
function allP_(sh) {
  var n = sh.getLastRow() - 1; if (n < 1) return [];
  return sh.getRange(2, 4, n, 1).getValues().map(function (r) { return JSON.parse(r[0]); }).filter(function (p) { return CATS[p.category]; });
}

// ---------- participant logic ----------
function blank_() { return { status: 'pending', openedAt: null, opens: 0, timeMs: 0, attempts: 0, solvedAt: null }; }
function rec_(p, c) { return p.challenges[c.id] || (p.challenges[c.id] = blank_()); }
function newParticipant_(name, team, category) {
  var id = 'p' + rand_().slice(0, 11);
  var p = { id: id, token: id + '-' + rand_() + rand_(), name: name, team: team, category: category, joinedAt: now_(), lastSubmitAt: 0, challenges: {} };
  list_(category).forEach(function (c) { p.challenges[c.id] = blank_(); });
  return p;
}
function roomTime_(r) { return r.status === 'solved' ? r.timeMs : (r.openedAt ? now_() - r.openedAt : 0); }
function points_(p) { return list_(p.category).reduce(function (a, c) { return a + (rec_(p, c).status === 'solved' ? c.points : 0); }, 0); }
function solvedN_(p) { return list_(p.category).filter(function (c) { return rec_(p, c).status === 'solved'; }).length; }
function studentView_(p) {
  var l = list_(p.category);
  return {
    name: p.name, team: p.team, category: p.category, categoryLabel: CATS[p.category].label,
    flagHint: CATS[p.category].flagHint || '', points: points_(p), total: l.length, solved: solvedN_(p),
    rooms: l.map(function (c, i) {
      var r = rec_(p, c);
      return { id: c.id, index: i + 1, title: c.title, level: c.level || null, points: c.points, url: c.url, status: r.status, opened: r.opens > 0, attempts: r.attempts, elapsedMs: roomTime_(r) };
    })
  };
}
function judgeRow_(p) {
  var l = list_(p.category), solved = 0, opened = 0, solveMs = 0, wrong = 0;
  var detail = l.map(function (c) {
    var r = rec_(p, c);
    if (r.status === 'solved') { solved++; solveMs += r.timeMs; }
    if (r.opens > 0) opened++;
    wrong += r.attempts;
    return { id: c.id, title: c.title, level: c.level || null, points: c.points, status: r.status, timeMs: roomTime_(r), wrongAttempts: r.attempts, opens: r.opens, solvedAt: r.solvedAt };
  });
  return { id: p.id, name: p.name, team: p.team, category: p.category, categoryLabel: CATS[p.category].label, joinedAt: p.joinedAt, points: points_(p), solved: solved, opened: opened, total: l.length, solveMs: solveMs, wrong: wrong, finished: solved === l.length, detail: detail };
}

// ---------- judge auth (signed token, valid 12 hours) ----------
function secret_() {
  var props = PropertiesService.getScriptProperties(), s = props.getProperty('SECRET');
  if (!s) { s = rand_() + rand_(); props.setProperty('SECRET', s); }
  return s;
}
function sign_(m) { return hex_(Utilities.computeHmacSha256Signature(m, secret_() + JUDGE_PASSWORD)); }
function judgeOk_(token) {
  token = String(token || ''); var i = token.indexOf('.'); if (i < 1 || !JUDGE_PASSWORD) return false;
  var m = token.slice(0, i);
  return eq_(token.slice(i + 1), sign_(m)) && Number(m) > now_();
}

// ---------- readable copy of the records in the "Records" tab ----------
function sheetSafe_(v) { v = String(v); return /^[=+\-@]/.test(v) ? "'" + v : v; }
function syncRecords_(rows) {
  var cache = CacheService.getScriptCache();
  if (cache.get('recsync')) return;
  cache.put('recsync', '1', 8);
  var sh = ss_().getSheetByName('Records') || ss_().insertSheet('Records');
  var maxN = 0; rows.forEach(function (r) { maxN = Math.max(maxN, r.total); });
  var head = ['Group', 'Student', 'Team', 'Points', 'Solved', 'Rooms opened', 'Solve time (s)', 'Wrong tries', 'Status', 'Joined'];
  for (var i = 1; i <= maxN; i++) head.push('Room ' + i + ' status', 'Room ' + i + ' time (s)', 'Room ' + i + ' wrong');
  var sorted = rows.slice().sort(function (a, b) { return a.category < b.category ? -1 : a.category > b.category ? 1 : (b.points - a.points) || (a.solveMs - b.solveMs); });
  var out = [head];
  sorted.forEach(function (r) {
    var line = [r.categoryLabel, sheetSafe_(r.name), sheetSafe_(r.team), r.points, r.solved, r.opened, Math.round(r.solveMs / 1000), r.wrong, r.finished ? 'Finished' : 'Playing', new Date(r.joinedAt).toISOString()];
    for (var k = 0; k < maxN; k++) { var d = r.detail[k]; line.push(d ? (d.status === 'solved' ? 'solved' : d.opens ? 'opened' : 'not started') : '', d ? Math.round(d.timeMs / 1000) : '', d ? d.wrongAttempts : ''); }
    out.push(line);
  });
  sh.clear();
  sh.getRange(1, 1, out.length, head.length).setValues(out);
  sh.setFrozenRows(1);
}

// ---------- API: the web pages call this ----------
function handle(route, body, token) {
  var out;
  try { out = route_(String(route), body || {}, String(token || '')); }
  catch (e) {
    if (e && e.message === 'BUSY') out = R_(503, { error: 'The server is busy. Please try again.' });
    else { console.error(e); out = R_(500, { error: 'Something went wrong. Please try again.' }); }
  }
  return JSON.stringify(out);
}
function roomOf_(p, id) { return list_(p.category).filter(function (x) { return String(x.id) === String(id); })[0]; }

function route_(route, b, token) {
  var NEED = { error: 'Session not found. Please join again.' };

  if (route === 'GET /api/config') {
    return R_(200, { eventName: EVENT_NAME, categories: Object.keys(CATS).map(function (k) { return { key: k, label: CATS[k].label, description: CATS[k].description || '', count: CATS[k].challenges.length }; }) });
  }

  if (route === 'POST /api/join') {
    var name = clean_(b.name, 40), team = clean_(b.team, 40), category = String(b.category || '');
    if (!CATS[category]) return R_(400, { error: 'Please choose Juniors or Seniors.' });
    if (!name) return R_(400, { error: 'Please enter your name.' });
    if (!team) return R_(400, { error: 'Please enter your team name.' });
    return withLock_(function () {
      var sh = data_(), key = 'k:' + category + '|' + norm_(team) + '|' + norm_(name);
      var row = findRow_(sh, 2, key);
      if (row) return R_(200, { token: String(sh.getRange(row, 3).getValue()), resumed: true });
      var p = newParticipant_(name, team, category);
      sh.appendRow([p.id, key, p.token, JSON.stringify(p)]);
      return R_(200, { token: p.token, resumed: false });
    });
  }

  if (route === 'GET /api/me') {
    var p = findByToken_(data_(), token);
    return p ? R_(200, studentView_(p)) : R_(401, NEED);
  }

  if (route === 'POST /api/open') {
    return withLock_(function () {
      var sh = data_(), p = findByToken_(sh, token);
      if (!p) return R_(401, NEED);
      var c = roomOf_(p, b.id); if (!c) return R_(400, { error: 'Unknown room.' });
      var r = rec_(p, c); r.opens++;
      if (!r.openedAt && r.status !== 'solved') r.openedAt = now_();
      putP_(sh, p);
      return R_(200, { ok: true });
    });
  }

  if (route === 'POST /api/submit') {
    return withLock_(function () {
      var sh = data_(), p = findByToken_(sh, token);
      if (!p) return R_(401, NEED);
      if (now_() - p.lastSubmitAt < 1500) return R_(429, { error: 'Slow down a little and try again.' });
      p.lastSubmitAt = now_();
      var c = roomOf_(p, b.id);
      if (!c) { putP_(sh, p); return R_(400, { error: 'Unknown room.' }); }
      var r = rec_(p, c);
      if (r.status === 'solved') { putP_(sh, p); return R_(200, { ok: false, message: 'You already solved this room.' }); }
      var flag = flagOf_(c);
      if (!flag) { putP_(sh, p); return R_(200, { ok: false, message: "This room isn't ready yet. Ask an organiser." }); }
      var guess = norm_(b.flag);
      if (guess && eq_(guess, norm_(flag))) {
        r.status = 'solved'; r.solvedAt = now_(); r.timeMs = r.openedAt ? r.solvedAt - r.openedAt : 0; r.openedAt = null;
        putP_(sh, p);
        return R_(200, { ok: true, solvedId: c.id, gained: c.points, title: c.title });
      }
      r.attempts++; putP_(sh, p);
      return R_(200, { ok: false, message: 'Wrong flag, try again.' });
    });
  }

  // ----- judges -----
  if (route === 'POST /api/judge/login') {
    var cache = CacheService.getScriptCache(), fails = Number(cache.get('loginfails') || 0);
    if (fails >= 8) return R_(429, { error: 'Too many attempts. Wait a minute.' });
    if (!JUDGE_PASSWORD || !eq_(String(b.password || ''), JUDGE_PASSWORD)) { cache.put('loginfails', String(fails + 1), 60); return R_(401, { error: 'Wrong password.' }); }
    var m = String(now_() + 12 * 3600 * 1000);
    return R_(200, { ok: true, token: m + '.' + sign_(m) });
  }
  if (route === 'POST /api/judge/logout') return R_(200, { ok: true });

  if (route.indexOf(' /api/judge/') > -1) {
    if (!judgeOk_(token)) return R_(401, { error: 'Judges only.' });
    if (route === 'GET /api/judge/records') {
      var rows = allP_(data_()).map(judgeRow_);
      syncRecords_(rows);
      return R_(200, { now: now_(), eventName: EVENT_NAME, sheetUrl: ss_().getUrl(), rows: rows });
    }
    if (route === 'POST /api/judge/delete') {
      return withLock_(function () {
        var sh = data_(), row = findRow_(sh, 1, b.id);
        if (row) sh.deleteRow(row);
        CacheService.getScriptCache().remove('recsync');
        return R_(200, { ok: true });
      });
    }
  }
  return R_(404, { error: 'Not found' });
}
