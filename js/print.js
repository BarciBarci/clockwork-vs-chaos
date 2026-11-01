/*
 * Clockwork vs Chaos — dossier renderer.
 * Reads the scenario handed over by the editor and builds printable pages.
 */
(function () {
  'use strict';

  var SW = window.PlateFoundry;
  var BOARD = 5;
  var root = document.getElementById('pages');

  var COLUMNS = ['A', 'B', 'C', 'D', 'E'];
  var ROWS = ['1', '2', '3', '4', '5'];

  function esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function paragraphs(text) {
    return String(text || '')
      .split(/\n{2,}/)
      .map(function (block) { return block.trim(); })
      .filter(Boolean)
      .map(function (block) {
        return '<p>' + esc(block).replace(/\n/g, '<br>') + '</p>';
      })
      .join('');
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function empty(message) {
    root.innerHTML = '<div class="notice">' + esc(message) + '</div>';
  }

  var raw = null;
  try {
    raw = localStorage.getItem('clockwork:scenario') ||
      localStorage.getItem('slickworks:scenario');
  } catch (error) {
    empty('This browser does not allow access to localStorage.');
    return;
  }

  if (!raw) {
    empty('No scenario found. Export one from the editor via "Print dossier" first.');
    return;
  }

  var scenario;
  try {
    scenario = JSON.parse(raw);
  } catch (error) {
    empty('The stored record is corrupted.');
    return;
  }

  if (scenario.format !== 'clockwork-scenario' && scenario.format !== 'slickworks-scenario') {
    empty('The stored record does not belong to Clockwork vs Chaos.');
    return;
  }

  /* ----------------------------------------------------------- board map -- */

  var boardHtml = scenario.board.map(function (rec) {
    if (!rec) return '<div class="slot empty"></div>';
    var tile = SW.tileById(rec.tileId);
    if (!tile) return '<div class="slot empty"></div>';
    return '<div class="slot">' +
      SW.renderTile(tile, { face: rec.face, rot: rec.rot, pieces: rec.pieces }) +
      '</div>';
  }).join('');

  var colHead = '<div class="fig-cols">' + COLUMNS.map(function (c) {
    return '<span>' + c + '</span>';
  }).join('') + '</div>';

  var rowHead = '<div class="fig-rows">' + ROWS.map(function (r) {
    return '<span>' + r + '</span>';
  }).join('') + '</div>';

  /* ------------------------------------------------------------- legend -- */

  var seen = {};
  var legend = [];
  scenario.board.forEach(function (rec) {
    if (!rec) return;
    var key = rec.tileId + ':' + rec.face;
    if (seen[key]) return;
    seen[key] = true;
    legend.push(rec);
  });

  var legendHtml = legend.map(function (rec) {
    var tile = SW.tileById(rec.tileId);
    return '<li class="tile-card">' +
      '<div class="art">' +
      SW.renderTile(tile, { face: rec.face, rot: 0 }) +
      '</div>' +
      '<div class="tile-meta">' +
      '<strong>' + esc(tile.id) + '</strong>' +
      '<span>' + (rec.face === 'back' ? 'Back' : 'Front') + '</span>' +
      '</div>' +
      '</li>';
  }).join('');

  var plateCount = scenario.board.filter(Boolean).length;
  var markerCount = scenario.board.reduce(function (sum, rec) {
    return sum + (rec ? rec.pieces.length : 0);
  }, 0);
  var compassDeg = (((scenario.compass | 0) % 4 + 4) % 4) * 90;

  /* --------------------------------------------------------------- pages -- */

  var title = (scenario.title || 'Untitled').trim();
  var sections = [];

  sections.push({
    kind: 'cover',
    body:
      '<div class="cover-logo"><img src="assets/logo.svg" alt="" width="98" height="98"></div>' +
      '<p class="kicker">Clockwork vs Chaos · Plate Foundry</p>' +
      '<h1 class="cover-title">' + esc(title) + '</h1>' +
      '<p class="byline">' +
        (scenario.author ? 'by ' + esc(scenario.author) : 'no author given') +
      '</p>' +
      '<dl class="facts">' +
        '<div><dt>Tiles</dt><dd>' + plateCount + '</dd></div>' +
        '<div><dt>Pieces</dt><dd>' + markerCount + '</dd></div>' +
        '<div><dt>Board</dt><dd>' + BOARD + ' × ' + BOARD + '</dd></div>' +
        '<div><dt>Cells</dt><dd>' + SW.GRID + ' × ' + SW.GRID + '</dd></div>' +
        '<div><dt>Compass</dt><dd>' + compassDeg + '°</dd></div>' +
      '</dl>' +
      '<p class="cover-foot">6 × 6 plate set · scenario dossier</p>'
  });

  sections.push({
    kind: 'map',
    body:
      '<h2>Map</h2>' +
      '<figure class="figure">' +
        '<div class="board-figure">' +
          colHead +
          rowHead +
          '<div class="map">' + boardHtml + '</div>' +
        '</div>' +
        '<figcaption class="fig-cap">' +
          '<span>Fig. 1 — plate layout, ' + BOARD + ' × ' + BOARD + '</span>' +
          '<span>Compass ' + compassDeg + '°</span>' +
        '</figcaption>' +
      '</figure>' +
      '<h3>Objective</h3>' +
      '<div class="prose">' +
        (paragraphs(scenario.objective) || '<p class="muted">—</p>') +
      '</div>'
  });

  var specialTopics = '';
  var specialText = '';
  if (scenario.special && scenario.special.on) {
    specialTopics = (scenario.special.topics || []).map(function (t) {
      return '<li>' + esc(t) + '</li>';
    }).join('');
    specialText = paragraphs(scenario.special.text);
  }

  var otherText = (scenario.other && scenario.other.on)
    ? paragraphs(scenario.other.text)
    : '';

  /* The three text blocks share one sheet, so a short scenario does not end up
     as three nearly blank pages. Long text simply flows onto the next sheet. */
  var rulesBody =
    '<h2>Rules</h2>' +
    '<div class="prose">' +
      (paragraphs(scenario.rules) || '<p class="muted">—</p>') +
    '</div>';

  if (specialTopics || specialText) {
    rulesBody +=
      '<h3>Special Rules</h3>' +
      '<div class="callout">' +
        (specialTopics ? '<ul class="topic-list">' + specialTopics + '</ul>' : '') +
        (specialText ? '<div class="prose">' + specialText + '</div>' : '') +
      '</div>';
  }

  if (otherText) {
    rulesBody +=
      '<h3>Other Rules / Escalations</h3>' +
      '<div class="prose">' + otherText + '</div>';
  }

  sections.push({ kind: 'rules', body: rulesBody });

  if (legend.length) {
    sections.push({
      kind: 'tiles',
      body:
        '<h2>Tiles used</h2>' +
        '<ul class="tile-grid">' + legendHtml + '</ul>'
    });
  }

  if (typeof scenario.image === 'string' && scenario.image.indexOf('data:image/') === 0) {
    sections.push({
      kind: 'setup',
      body:
        '<h2>Board Setup</h2>' +
        '<div class="figure-wrap">' +
          '<div class="setup-frame">' +
            '<img src="' + scenario.image + '" alt="Board setup">' +
          '</div>' +
          '<p class="fig-cap"><span>Fig. 2 — table layout</span><span>Reference photo</span></p>' +
        '</div>'
    });
  }

  var total = sections.length;

  root.innerHTML = sections.map(function (section, i) {
    return '<section class="page page--' + section.kind + '">' +
      (section.decor || '') +
      '<div class="page-body">' + section.body + '</div>' +
      '<footer class="page-foot">' +
        '<span>' + esc(title) + '</span>' +
        '<span class="foot-num">' + pad(i + 1) + ' / ' + pad(total) + '</span>' +
      '</footer>' +
      '</section>';
  }).join('');

  document.getElementById('btn-print').addEventListener('click', function () {
    window.print();
  });

  if (new URLSearchParams(location.search).get('noprint') !== '1') {
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 350);
    });
  }
})();
