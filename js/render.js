/*
 * Clockwork vs Chaos — flat SVG rendering of plates and pieces.
 * Pure geometry: no textures, no bitmaps, no scanned art.
 *
 * Piece labels and footprints follow the original S.C.R.A.P. asset set.
 */
(function (global) {
  'use strict';

  var SW = global.PlateFoundry;
  var GRID = SW.GRID;
  var CELL = 120 / GRID;        // 20 units per cell
  var uid = 0;

  var INK = '#101820';
  var PALE = '#eef2f6';
  var STEEL = '#b9c6d2';
  var DARK = '#1c2733';

  var FACE_BASE = { front: '#f4f1ea', back: '#d18d7a' };
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

  /* Wall panels follow the occupancy mask of the original asset matrix:
     only the cells set to 1 are solid, the rest is a notch. */
  function renderPanel(type, cellX, cellY) {
    var def = SW.PIECES[type];
    var mask = def && def.mask;
    if (!mask) return '';

    var rows = mask.length;
    var cols = mask[0].length;
    var ox = cellX * CELL;
    var oy = cellY * CELL;
    var fills = [];
    var edges = [];
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (!mask[r][c]) continue;
        var X = ox + c * CELL;
        var Y = oy + r * CELL;
        fills.push('<rect x="' + X + '" y="' + Y + '" width="' + CELL + '" height="' + CELL + '"/>');
        if (X < minX) minX = X;
        if (Y < minY) minY = Y;
        if (X + CELL > maxX) maxX = X + CELL;
        if (Y + CELL > maxY) maxY = Y + CELL;

        if (r === 0 || !mask[r - 1][c]) edges.push('M' + X + ' ' + Y + 'h' + CELL);
        if (r === rows - 1 || !mask[r + 1][c]) edges.push('M' + X + ' ' + (Y + CELL) + 'h' + CELL);
        if (c === 0 || !mask[r][c - 1]) edges.push('M' + X + ' ' + Y + 'v' + CELL);
        if (c === cols - 1 || !mask[r][c + 1]) edges.push('M' + (X + CELL) + ' ' + Y + 'v' + CELL);
      }
    }

    var bw = maxX - minX;
    var bh = maxY - minY;
    var deco = '';

    if (type === 'school') {
      deco += '<rect x="' + minX + '" y="' + minY + '" width="' + bw + '" height="' + bh +
        '" fill="#cdd6de"/>';
      for (var by = minY + 7; by < maxY - 6; by += 15) {
        deco += '<rect x="' + (minX - 1) + '" y="' + by + '" width="' + (bw + 2) +
          '" height="7.5" fill="#f2c230"/>';
        for (var bx = minX + 2; bx < maxX - 2; bx += 9) {
          deco += '<path d="M' + bx + ' ' + (by + 7.5) + 'L' + (bx + 5) + ' ' + by +
            '" stroke="' + INK + '" stroke-width="1"/>';
        }
      }
    } else {
      deco += '<rect x="' + minX + '" y="' + minY + '" width="' + bw + '" height="' + bh +
        '" fill="#3a1a12"/>';
      deco += '<path d="M' + (minX + bw * 0.3) + ' ' + (minY + 6) +
        'L' + (minX + bw * 0.62) + ' ' + (minY + bh * 0.24) +
        'L' + (minX + bw * 0.4) + ' ' + (minY + bh * 0.48) +
        'L' + (minX + bw * 0.68) + ' ' + (minY + bh * 0.66) +
        'L' + (minX + bw * 0.46) + ' ' + (minY + bh * 0.88) +
        'L' + (minX + bw * 0.56) + ' ' + (minY + bh - 6) + '"' +
        ' fill="none" stroke="#ff7a2e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
      deco += '<path d="M' + (minX + bw * 0.8) + ' ' + (minY + 9) +
        'L' + (minX + bw * 0.62) + ' ' + (minY + bh * 0.4) + '"' +
        ' fill="none" stroke="#ffd166" stroke-width="1.6" stroke-linecap="round"/>';
    }

    var id = 'pn' + (++uid);
    return '<clipPath id="' + id + '">' + fills.join('') + '</clipPath>' +
      '<g clip-path="url(#' + id + ')">' + deco + '</g>' +
      '<path d="' + edges.join('') + '" fill="none" stroke="' + INK + '"' +
      ' stroke-width="1.7" stroke-linejoin="round"/>';
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

    if (type === 'school' || type === 'lava') return renderPanel(type, cellX, cellY);

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
      return cellRect(x, y, '#ff5a0a') +
        '<rect x="' + (cx - 4.5) + '" y="' + (cy - 4.5) + '" width="9" height="9"' +
        ' rx="2.2" fill="#ffd44d"/>';
    }

    if (cell === 'rock') {
      return cellRect(x, y, '#4b5560') +
        '<path d="M' + (x * CELL + 3) + ' ' + (y * CELL + CELL - 4) +
        'L' + (x * CELL + CELL / 2) + ' ' + (y * CELL + 4) +
        'L' + (x * CELL + CELL - 3) + ' ' + (y * CELL + CELL - 4) + 'Z"' +
        ' fill="#5c6875"/>';
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
