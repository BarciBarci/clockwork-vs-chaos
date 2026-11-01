/*
 * Slickworks — dossier renderer.
 * Reads the scenario handed over by the editor and builds printable pages.
 */
(function () {
  'use strict';

  var SW = window.Slickworks;
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
    raw = localStorage.getItem('slickworks:scenario');
  } catch (error) {
    empty('Dieser Browser erlaubt keinen Zugriff auf localStorage.');
    return;
  }

  if (!raw) {
    empty('Kein Szenario gefunden. Exportiere zuerst im Editor über „Dossier drucken“.');
    return;
  }

  var scenario;
  try {
    scenario = JSON.parse(raw);
  } catch (error) {
    empty('Der gespeicherte Datensatz ist beschädigt.');
    return;
  }

  if (scenario.format !== 'slickworks-scenario') {
    empty('Der gespeicherte Datensatz gehört nicht zu Slickworks.');
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
      '<span>' + (rec.face === 'back' ? 'Lava-Seite' : 'Gras-Seite') + '</span>' +
      '</div>' +
      '</li>';
  }).join('');

  var plateCount = scenario.board.filter(Boolean).length;
  var markerCount = scenario.board.reduce(function (sum, rec) {
    return sum + (rec ? rec.pieces.length : 0);
  }, 0);

  root.innerHTML =
    '<section class="page cover">' +
      '<div class="cover-mark"><img src="assets/logo.svg" alt="" width="72" height="72"></div>' +
      '<p class="kicker">Slickworks · Plate Foundry</p>' +
      '<h1>' + esc(scenario.title || 'Ohne Titel') + '</h1>' +
      '<p class="byline">' + (scenario.author ? 'von ' + esc(scenario.author) : 'ohne Autor') + '</p>' +
      '<dl class="facts">' +
        '<div><dt>Platten</dt><dd>' + plateCount + '</dd></div>' +
        '<div><dt>Marker</dt><dd>' + markerCount + '</dd></div>' +
        '<div><dt>Plattenraster</dt><dd>' + BOARD + ' × ' + BOARD + '</dd></div>' +
        '<div><dt>Zellen</dt><dd>' + SW.GRID + ' × ' + SW.GRID + '</dd></div>' +
      '</dl>' +
      '<p class="cover-foot">Plattensatz im 6 × 6-Raster · Szenario-Dossier</p>' +
    '</section>' +

    '<section class="page">' +
      '<h2>Karte</h2>' +
      '<div class="map">' + boardHtml + '</div>' +
      '<h3>Ziel</h3>' +
      '<div class="prose">' + (paragraphs(scenario.objective) || '<p class="muted">—</p>') + '</div>' +
    '</section>' +

    '<section class="page">' +
      '<h2>Regeln</h2>' +
      '<div class="prose">' + (paragraphs(scenario.rules) || '<p class="muted">—</p>') + '</div>' +
    '</section>' +

    (legend.length
      ? '<section class="page">' +
          '<h2>Verwendete Platten</h2>' +
          '<ul class="legend-list">' + legendHtml + '</ul>' +
        '</section>'
      : '');

  document.getElementById('btn-print').addEventListener('click', function () {
    window.print();
  });

  if (new URLSearchParams(location.search).get('noprint') !== '1') {
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 350);
    });
  }
})();
