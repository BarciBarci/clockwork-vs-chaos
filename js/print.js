/*
 * Clockwork vs Chaos — dossier renderer.
 * Reads the scenario handed over by the editor and builds printable pages.
 */
(function () {
  'use strict';

  var SW = window.PlateFoundry;
  var BOARD = 5;
  var root = document.getElementById('pages');

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
    return '<li>' +
      '<div class="legend-art">' +
      SW.renderTile(tile, { face: rec.face, rot: 0 }) +
      '</div>' +
      '<div class="legend-meta">' +
      '<strong>' + esc(rec.tileId) + '</strong>' +
      '<span>' + (rec.face === 'back' ? 'Back' : 'Front') + '</span>' +
      '</div>' +
      '</li>';
  }).join('');

  var plateCount = scenario.board.filter(Boolean).length;
  var markerCount = scenario.board.reduce(function (sum, rec) {
    return sum + (rec ? rec.pieces.length : 0);
  }, 0);

  var specialPage = '';
  if (scenario.special && scenario.special.on) {
    var topics = (scenario.special.topics || []).map(function (t) {
      return '<li>' + esc(t) + '</li>';
    }).join('');
    var specialText = paragraphs(scenario.special.text);
    if (topics || specialText) {
      specialPage = '<section class="page">' +
        '<h2>Special Rules</h2>' +
        (topics ? '<ul class="topic-list">' + topics + '</ul>' : '') +
        '<div class="prose">' + specialText + '</div>' +
        '</section>';
    }
  }

  var otherPage = '';
  if (scenario.other && scenario.other.on && (scenario.other.text || '').trim()) {
    otherPage = '<section class="page">' +
      '<h2>Other Rules / Escalations</h2>' +
      '<div class="prose">' + paragraphs(scenario.other.text) + '</div>' +
      '</section>';
  }

  var picturePage = '';
  if (typeof scenario.image === 'string' && scenario.image.indexOf('data:image/') === 0) {
    picturePage = '<section class="page">' +
      '<h2>Board Setup</h2>' +
      '<img class="setup" src="' + scenario.image + '" alt="Board setup">' +
      '</section>';
  }

  root.innerHTML =
    '<section class="page cover">' +
      '<div class="cover-mark"><img src="assets/logo.svg" alt="" width="72" height="72"></div>' +
      '<p class="kicker">Clockwork vs Chaos · Plate Foundry</p>' +
      '<h1>' + esc(scenario.title || 'Untitled') + '</h1>' +
      '<p class="byline">' + (scenario.author ? 'by ' + esc(scenario.author) : 'no author') + '</p>' +
      '<dl class="facts">' +
        '<div><dt>Tiles</dt><dd>' + plateCount + '</dd></div>' +
        '<div><dt>Pieces</dt><dd>' + markerCount + '</dd></div>' +
        '<div><dt>Board</dt><dd>' + BOARD + ' × ' + BOARD + '</dd></div>' +
        '<div><dt>Cells</dt><dd>' + SW.GRID + ' × ' + SW.GRID + '</dd></div>' +
        '<div><dt>Compass</dt><dd>' + (((scenario.compass | 0) % 4) * 90) + '°</dd></div>' +
      '</dl>' +
      '<p class="cover-foot">6 × 6 plate set · scenario dossier</p>' +
    '</section>' +

    '<section class="page">' +
      '<h2>Map</h2>' +
      '<div class="map">' + boardHtml + '</div>' +
      '<h3>Objective</h3>' +
      '<div class="prose">' + (paragraphs(scenario.objective) || '<p class="muted">—</p>') + '</div>' +
    '</section>' +

    '<section class="page">' +
      '<h2>Rules</h2>' +
      '<div class="prose">' + (paragraphs(scenario.rules) || '<p class="muted">—</p>') + '</div>' +
    '</section>' +

    specialPage +
    otherPage +

    (legend.length
      ? '<section class="page">' +
          '<h2>Tiles used</h2>' +
          '<ul class="legend-list">' + legendHtml + '</ul>' +
        '</section>'
      : '') +

    picturePage;

  document.getElementById('btn-print').addEventListener('click', function () {
    window.print();
  });

  if (new URLSearchParams(location.search).get('noprint') !== '1') {
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 350);
    });
  }
})();
