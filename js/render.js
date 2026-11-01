/*
 * Slickworks — flat SVG rendering of plates and pieces.
 * Pure geometry: no textures, no bitmaps, no scanned art.
 *
 * Piece labels and footprints follow the original S.C.R.A.P. asset set.
 */
(function (global) {
  'use strict';

  var SW = global.Slickworks;
  var GRID = SW.GRID;
  var CELL = 120 / GRID;        // 20 units per cell
  var uid = 0;

  var INK = '#101820';
  var PALE = '#eef2f6';
  var STEEL = '#b9c6d2';
  var DARK = '#1c2733';

  var FACE_BASE = { front: '#f4f1ea', back: '#6e3327' };
  var FACE_EDGE = {
    front: 'rgba(16,24,32,0.55)',
    back: 'rgba(255,236,224,0.55)'
  };

  /* ------------------------------------------------------- piece glyphs -- */

  /* Player Mech — seen from above */
  function glyphPlayer() {
    return '<rect x="-7.6" y="-3.9" width="3" height="5" rx="1.3" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="1.1"/>' +
      '<rect x="4.6" y="-3.9" width="3" height="5" rx="1.3" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="1.1"/>' +
      '<rect x="-3.9" y="2" width="3.3" height="4.6" rx="1.2" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="1.1"/>' +
      '<rect x="0.6" y="2" width="3.3" height="4.6" rx="1.2" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="1.1"/>' +
      '<rect x="-4.7" y="-4.8" width="9.4" height="7.6" rx="2.3" fill="' + PALE + '" stroke="' + INK + '" stroke-width="1.25"/>' +
      '<rect x="-2.3" y="-3" width="4.6" height="2.4" rx="1.2" fill="' + INK + '"/>' +
      '<circle cx="0" cy="1.5" r="1.25" fill="#ffb020" stroke="' + INK + '" stroke-width="0.6"/>';
  }

  /* Boss Mech — heavier frame, red visor, horns */
  function glyphBoss() {
    return '<path d="M-5.8 -5.2L-8 -8.4L-3.2 -6.6Z" fill="#cf2b2b" stroke="' + INK + '" stroke-width="1"/>' +
      '<path d="M5.8 -5.2L8 -8.4L3.2 -6.6Z" fill="#cf2b2b" stroke="' + INK + '" stroke-width="1"/>' +
      '<rect x="-4.6" y="2.4" width="3.8" height="4.8" rx="1.3" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="1.1"/>' +
      '<rect x="0.8" y="2.4" width="3.8" height="4.8" rx="1.3" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="1.1"/>' +
      '<rect x="-6.4" y="-3.4" width="3.2" height="5.4" rx="1.4" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="1.1"/>' +
      '<rect x="3.2" y="-3.4" width="3.2" height="5.4" rx="1.4" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="1.1"/>' +
      '<rect x="-5.6" y="-5.6" width="11.2" height="8.4" rx="2.4" fill="#cfd9e2" stroke="' + INK + '" stroke-width="1.35"/>' +
      '<rect x="-3.2" y="-3.6" width="6.4" height="2.7" rx="1.3" fill="#cf2b2b" stroke="' + INK + '" stroke-width="0.7"/>' +
      '<circle cx="0" cy="1.6" r="1.5" fill="#ffb020" stroke="' + INK + '" stroke-width="0.6"/>';
  }

  /* Minion — small horned unit */
  function glyphMinion() {
    return '<path d="M-4 -3.8L-6.6 -6.6L-2.2 -5.2Z" fill="' + INK + '"/>' +
      '<path d="M4 -3.8L6.6 -6.6L2.2 -5.2Z" fill="' + INK + '"/>' +
      '<path d="M0 -5.2C3.4 -5.2 5.1 -2.6 5.1 0.6C5.1 3.5 3 5.5 0 5.5C-3 5.5 -5.1 3.5 -5.1 0.6C-5.1 -2.6 -3.4 -5.2 0 -5.2Z"' +
      ' fill="' + PALE + '" stroke="' + INK + '" stroke-width="1.3"/>' +
      '<circle cx="-1.9" cy="-0.5" r="1.15" fill="#cf2b2b" stroke="' + INK + '" stroke-width="0.45"/>' +
      '<circle cx="1.9" cy="-0.5" r="1.15" fill="#cf2b2b" stroke="' + INK + '" stroke-width="0.45"/>' +
      '<path d="M-1.8 2.6H1.8" stroke="' + INK + '" stroke-width="1.2" stroke-linecap="round"/>';
  }

  /* Gear Ring */
  function glyphGear() {
    var teeth = '';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4 + Math.PI / 8;
      teeth += '<path d="M' + (Math.cos(a) * 4.1).toFixed(2) + ' ' + (Math.sin(a) * 4.1).toFixed(2) +
        'L' + (Math.cos(a) * 6.1).toFixed(2) + ' ' + (Math.sin(a) * 6.1).toFixed(2) +
        '" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="butt"/>';
    }
    return teeth +
      '<circle r="4.4" fill="none" stroke="' + INK + '" stroke-width="4.6"/>' +
      '<circle r="4.4" fill="none" stroke="#cdd7e0" stroke-width="2.6"/>' +
      '<circle r="4.4" fill="none" stroke="' + INK + '" stroke-width="0.7" stroke-opacity="0.5"/>';
  }

  /* The Bomb */
  function glyphBomb() {
    var spikes = '';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4;
      spikes += '<path d="M' + (Math.cos(a) * 3.9).toFixed(2) + ' ' + (Math.sin(a) * 3.9).toFixed(2) +
        'L' + (Math.cos(a) * 6).toFixed(2) + ' ' + (Math.sin(a) * 6).toFixed(2) +
        '" stroke="' + INK + '" stroke-width="1.7" stroke-linecap="round"/>';
    }
    return spikes +
      '<circle r="4.1" fill="' + DARK + '" stroke="' + INK + '" stroke-width="1.1"/>' +
      '<circle cx="-1.3" cy="-1.3" r="1.1" fill="#7c8f9e"/>' +
      '<circle cx="1.2" cy="1.2" r="0.9" fill="#ffb020"/>';
  }

  /* Crystal Shard */
  function glyphShard() {
    return '<path d="M0 -6.4L4.5 -2.8L3.3 5.1L-3.3 5.1L-4.5 -2.8Z" fill="#8a4fc0"' +
      ' stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<path d="M0 -6.4L0 5.1L-3.3 5.1L-4.5 -2.8Z" fill="#6b34a0"/>' +
      '<path d="M0 -6.4L3.3 -1.2L0 2.2Z" fill="#c9a6ee" fill-opacity="0.9"/>' +
      '<path d="M-1.9 1.2L0 5.1" stroke="#b98ae4" stroke-width="0.9" fill="none"/>';
  }

  /* Goal Zone — hazard tape */
  function glyphTape() {
    return '<rect x="-6.6" y="-2.4" width="13.2" height="4.8" rx="0.9" fill="#f2c230"' +
      ' stroke="' + INK + '" stroke-width="1.2"/>' +
      '<path d="M-4.8 -2.2L-2.6 2.2M-1.8 -2.2L0.4 2.2M1 -2.2L3.2 2.2M3.8 -2.2L6 2.2"' +
      ' stroke="' + INK + '" stroke-width="1.2"/>';
  }

  /* Wall panels span their whole footprint */
  function panelSchool(x, y, w, h) {
    var px = x * CELL + 2;
    var py = y * CELL + 2;
    var pw = w * CELL - 4;
    var ph = h * CELL - 4;
    var bands = '';
    var step = 15;
    for (var by = py + 7; by < py + ph - 6; by += step) {
      bands += '<rect x="' + (px + 2) + '" y="' + by + '" width="' + (pw - 4) + '" height="7.5"' +
        ' fill="#f2c230" stroke="' + INK + '" stroke-width="0.7"/>';
      for (var bx = px + 4; bx < px + pw - 4; bx += 9) {
        bands += '<path d="M' + bx + ' ' + (by + 7) + 'L' + (bx + 5) + ' ' + by +
          '" stroke="' + INK + '" stroke-width="1"/>';
      }
    }
    return '<rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" rx="3"' +
      ' fill="#cdd6de" stroke="' + INK + '" stroke-width="1.7"/>' + bands +
      '<circle cx="' + (px + 7) + '" cy="' + (py + 7) + '" r="1.7" fill="' + INK + '"/>' +
      '<circle cx="' + (px + pw - 7) + '" cy="' + (py + ph - 7) + '" r="1.7" fill="' + INK + '"/>';
  }

  function panelLava(x, y, w, h) {
    var px = x * CELL + 2;
    var py = y * CELL + 2;
    var pw = w * CELL - 4;
    var ph = h * CELL - 4;
    return '<rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" rx="3"' +
      ' fill="#3a1a12" stroke="' + INK + '" stroke-width="1.7"/>' +
      '<path d="M' + (px + pw * 0.28) + ' ' + (py + 6) + 'L' + (px + pw * 0.55) + ' ' + (py + ph * 0.22) +
      'L' + (px + pw * 0.34) + ' ' + (py + ph * 0.45) + 'L' + (px + pw * 0.62) + ' ' + (py + ph * 0.62) +
      'L' + (px + pw * 0.4) + ' ' + (py + ph * 0.86) + 'L' + (px + pw * 0.5) + ' ' + (py + ph - 6) +
      '" fill="none" stroke="#ff7a2e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M' + (px + pw * 0.72) + ' ' + (py + 10) + 'L' + (px + pw * 0.6) + ' ' + (py + ph * 0.36) +
      '" fill="none" stroke="#ffd166" stroke-width="1.6" stroke-linecap="round"/>';
  }

  function glyph(type) {
    if (type === 'minion-3') return glyphPlayer();
    if (type === 'minion-1') return glyphBoss();
    if (type === 'minion-2') return glyphMinion();
    if (type === 'gear') return glyphGear();
    if (type === 'bomb') return glyphBomb();
    if (type === 'shard') return glyphShard();
    if (type === 'tape') return glyphTape();
    return '<rect x="-4.4" y="-4.4" width="8.8" height="8.8" transform="rotate(45)"' +
      ' fill="' + PALE + '" stroke="' + INK + '" stroke-width="1.4"/>';
  }

  /* 20 x 20 palette icon, independent of the board footprint */
  function renderIcon(type) {
    if (type === 'school' || type === 'lava') {
      var inner = type === 'school'
        ? '<rect x="4.5" y="1.5" width="11" height="17" rx="2" fill="#cdd6de" stroke="' + INK + '" stroke-width="1.3"/>' +
          '<rect x="6" y="5" width="8" height="3.4" fill="#f2c230" stroke="' + INK + '" stroke-width="0.6"/>' +
          '<rect x="6" y="11" width="8" height="3.4" fill="#f2c230" stroke="' + INK + '" stroke-width="0.6"/>'
        : '<rect x="4.5" y="1.5" width="11" height="17" rx="2" fill="#3a1a12" stroke="' + INK + '" stroke-width="1.3"/>' +
          '<path d="M7 4L11 8L8 12L12 16" fill="none" stroke="#ff7a2e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      return inner;
    }
    return '<g transform="translate(10 10) scale(0.95)">' + glyph(type) + '</g>';
  }

  /* Board piece, centred in its footprint */
  function renderPiece(type, cellX, cellY, w, h) {
    w = w || 1;
    h = h || 1;

    if (type === 'school') return panelSchool(cellX, cellY, w, h);
    if (type === 'lava') return panelLava(cellX, cellY, w, h);

    var cx = (cellX + w / 2) * CELL;
    var cy = (cellY + h / 2) * CELL;
    var s = Math.min(w, h);

    return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + s + ')">' + glyph(type) + '</g>';
  }

  /* --------------------------------------------------------------- cells -- */

  function cellRect(x, y, fill) {
    return '<rect x="' + (x * CELL + 1) + '" y="' + (y * CELL + 1) + '" width="' + (CELL - 2) +
      '" height="' + (CELL - 2) + '" rx="1.6" fill="' + fill + '"/>';
  }

  function drawCell(cell, x, y) {
    if (!cell) return '';
    var cx = (x + 0.5) * CELL;
    var cy = (y + 0.5) * CELL;

    if (cell === 'crystal') {
      return cellRect(x, y, '#46c8f0') +
        '<rect x="' + (cx - 4) + '" y="' + (cy - 4) + '" width="8" height="8"' +
        ' transform="rotate(45 ' + cx + ' ' + cy + ')" fill="#ffffff" fill-opacity="0.75"/>' +
        '<rect x="' + (cx - 2) + '" y="' + (cy - 2) + '" width="4" height="4"' +
        ' transform="rotate(45 ' + cx + ' ' + cy + ')" fill="#0f6c8a"/>';
    }

    if (cell === 'lava') {
      return cellRect(x, y, '#ff7a2e') +
        '<rect x="' + (cx - 3.5) + '" y="' + (cy - 3.5) + '" width="7" height="7"' +
        ' rx="1.4" fill="#ffd166"/>';
    }

    if (cell === 'oil') return cellRect(x, y, '#000000');

    var info = SW.CELLS[cell.colour];
    if (!info || !info.colour) return '';

    return cellRect(x, y, info.colour) +
      '<g transform="translate(' + cx + ' ' + cy + ') rotate(' + (cell.dir || 0) * 90 + ')">' +
        '<path d="M0 -4.2L3.2 1.2L0 -0.1L-3.2 1.2Z" fill="#ffffff"' +
        ' stroke="rgba(16,24,32,0.5)" stroke-width="0.7" stroke-linejoin="round"/>' +
      '</g>';
  }

  /* --------------------------------------------------------------- plate -- */

  function renderTile(tile, options) {
    options = options || {};
    var face = options.face === 'back' ? 'back' : 'front';
    var rot = ((options.rot | 0) % 4 + 4) % 4;
    var grid = tile[face];
    var id = 'sw' + ++uid;
    var body = [];

    for (var y = 0; y < GRID; y++) {
      for (var x = 0; x < GRID; x++) {
        body.push(drawCell(grid[y][x], x, y));
      }
    }

    (options.pieces || []).forEach(function (p) {
      var def = SW.PIECES[p.type] || { w: 1, h: 1 };
      body.push(renderPiece(p.type, p.x, p.y, def.w, def.h));
    });

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img"' +
      ' aria-label="Tile ' + tile.id + ' (' + face + ')">' +
      '<clipPath id="' + id + '">' +
        '<rect x="0.8" y="0.8" width="118.4" height="118.4" rx="5"/>' +
      '</clipPath>' +
      '<rect x="0.8" y="0.8" width="118.4" height="118.4" rx="5" fill="' + FACE_BASE[face] + '"/>' +
      '<g clip-path="url(#' + id + ')">' +
        '<g transform="rotate(' + rot * 90 + ' 60 60)">' + body.join('') + '</g>' +
      '</g>' +
      '<rect x="0.8" y="0.8" width="118.4" height="118.4" rx="5" fill="none"' +
        ' stroke="' + FACE_EDGE[face] + '" stroke-width="1.6"/>' +
      '</svg>';
  }

  SW.renderTile = renderTile;
  SW.renderPiece = renderPiece;
  SW.renderIcon = renderIcon;
  SW.renderCell = drawCell;
})(window);
