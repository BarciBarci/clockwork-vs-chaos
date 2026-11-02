/*
 * Clockwork vs Chaos — flat SVG rendering of plates and pieces.
 * Original vector art: no textures from the game, no bitmaps, no scans.
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

  /* Front is meadow grass, back is dusty red rock — the two faces of the plate. */
  var FACE = {
    front: {
      top: '#83a85d',
      bottom: '#6a8c47',
      edge: 'rgba(24, 46, 20, .55)',
      tuft: '#4e7033',
      tuftLight: '#a9c67c',
      soil: '#8f6b3f',
      stone: '#8c9591'
    },
    back: {
      top: '#d99b87',
      bottom: '#c67f6d',
      edge: 'rgba(255, 236, 224, .55)',
      tuft: '#a8624f',
      tuftLight: '#e8b6a2',
      soil: '#8d4a3c',
      stone: '#7c5a50'
    }
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

  /* ------------------------------------------------------------- ground -- */

  /* Deterministic pseudo random: a plate looks the same on every render. */
  function seeded(seed) {
    var s = (seed | 0) || 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function hash(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function blob(cx, cy, radius, rnd, fill, opacity) {
    var pts = [];
    var steps = 9;
    for (var i = 0; i < steps; i++) {
      var a = (i / steps) * Math.PI * 2;
      var rr = radius * (0.7 + rnd() * 0.45);
      pts.push((cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + fill +
      '" fill-opacity="' + opacity + '"/>';
  }

  function pebble(cx, cy, size, fill) {
    return '<path d="M' + (cx - size) + ' ' + (cy + size * 0.55) +
      'L' + (cx - size * 0.15) + ' ' + (cy - size) +
      'L' + (cx + size) + ' ' + (cy + size * 0.45) +
      'Z" fill="' + fill + '" fill-opacity="0.55"/>' +
      '<path d="M' + (cx - size * 0.15) + ' ' + (cy - size) +
      'L' + (cx + size) + ' ' + (cy + size * 0.45) +
      '" stroke="#ffffff" stroke-opacity="0.28" stroke-width="0.8"/>';
  }

  /* A worn path crossing the plate. Being directional, it also makes rotation
     of the artwork readable at a glance. */
  function dirtPath(rnd) {
    var y0 = 6 + rnd() * 108;
    var y1 = 6 + rnd() * 108;
    var c1 = 18 + rnd() * 26;
    var c2 = 76 + rnd() * 26;
    var d = 'M-6 ' + y0.toFixed(1) +
      'C' + c1.toFixed(1) + ' ' + (y0 + (rnd() - 0.5) * 46).toFixed(1) +
      ' ' + c2.toFixed(1) + ' ' + (y1 + (rnd() - 0.5) * 46).toFixed(1) +
      ' 126 ' + y1.toFixed(1);
    var w = 8 + rnd() * 6;

    return '<path d="' + d + '" fill="none" stroke="#8a6738" stroke-opacity="0.20"' +
        ' stroke-width="' + w.toFixed(1) + '" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="#b18e60" stroke-opacity="0.18"' +
        ' stroke-width="' + (w * 0.45).toFixed(1) + '" stroke-linecap="round"/>';
  }

  /* Terrain of one face, painted under the fields. */
  function groundTexture(face, seed) {
    var pal = FACE[face];
    var rnd = seeded(seed);
    var out = [];
    var i;

    if (face === 'front') {
      for (i = 0; i < 2; i++) out.push(dirtPath(rnd));

      for (i = 0; i < 3; i++) {
        out.push(blob(8 + rnd() * 104, 8 + rnd() * 104, 7 + rnd() * 9, rnd, pal.soil, 0.12));
      }

      for (i = 0; i < 30; i++) {
        var x = rnd() * 120;
        var y = 4 + rnd() * 112;
        var len = 2.4 + rnd() * 2.2;
        var lean = (rnd() - 0.5) * 1.4;
        out.push('<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) +
          'l' + lean.toFixed(1) + ' ' + (-len).toFixed(1) +
          'M' + x.toFixed(1) + ' ' + y.toFixed(1) +
          'l' + (lean + 1.6).toFixed(1) + ' ' + (-len * 0.65).toFixed(1) + '"' +
          ' fill="none" stroke="' + (i % 3 ? pal.tuft : pal.tuftLight) +
          '" stroke-width="0.85" stroke-linecap="round" stroke-opacity="0.5"/>');
      }

      for (i = 0; i < 3; i++) {
        out.push(pebble(10 + rnd() * 100, 10 + rnd() * 100, 1.6 + rnd() * 1.5, pal.stone));
      }
    } else {
      for (i = 0; i < 3; i++) {
        out.push(blob(8 + rnd() * 104, 8 + rnd() * 104, 9 + rnd() * 10, rnd, pal.soil, 0.12));
      }

      for (i = 0; i < 6; i++) {
        var cx = rnd() * 120;
        var cy = rnd() * 120;
        out.push('<path d="M' + cx.toFixed(1) + ' ' + cy.toFixed(1) +
          'l' + (4 + rnd() * 8).toFixed(1) + ' ' + (rnd() * 6 - 3).toFixed(1) +
          'l' + (4 + rnd() * 6).toFixed(1) + ' ' + (rnd() * 8 - 4).toFixed(1) + '"' +
          ' fill="none" stroke="' + pal.soil +
          '" stroke-width="0.9" stroke-opacity="0.28" stroke-linecap="round"/>');
      }

      for (i = 0; i < 3; i++) {
        out.push(pebble(10 + rnd() * 100, 10 + rnd() * 100, 1.4 + rnd() * 1.2, pal.stone));
      }
    }

    return out.join('');
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
  /* `rot` turns the piece in place. The art is laid out for the unrotated box
     and turned about the centre of the footprint it occupies after the turn,
     so a 3 × 6 panel becomes a 6 × 3 one that fills its box. */
  function renderPiece(type, cellX, cellY, w, h, rot, fw, fh) {
    w = w || 1;
    h = h || 1;
    rot = ((rot | 0) % 4 + 4) % 4;
    fw = fw || w;
    fh = fh || h;

    var cx = (cellX + fw / 2) * CELL;
    var cy = (cellY + fh / 2) * CELL;

    if (type === 'school' || type === 'lava') {
      var sx = cellX + fw / 2 - w / 2;
      var sy = cellY + fh / 2 - h / 2;
      return '<g class="piece">' +
        '<g transform="rotate(' + rot * 90 + ' ' + cx + ' ' + cy + ')">' +
          renderPanel(type, sx, sy) +
        '</g></g>';
    }

    var s = Math.min(w, h);

    return '<g class="piece" transform="translate(' + cx + ' ' + cy + ')' +
      (rot ? ' rotate(' + rot * 90 + ')' : '') +
      ' scale(' + s + ')">' + glyph(type) + '</g>';
  }

  /* --------------------------------------------------------------- cells -- */

  function cellRect(x, y, fill) {
    return '<rect x="' + (x * CELL + 1) + '" y="' + (y * CELL + 1) + '" width="' + (CELL - 2) +
      '" height="' + (CELL - 2) + '" rx="1.6" fill="' + fill + '"/>';
  }

  /* Carved rune: spear-headed, so the point always shows the direction. */
  var RUNE = 'M0 -7.4L4.8 -1.2L1.7 -1.2L1.7 5.6L-1.7 5.6L-1.7 -1.2L-4.8 -1.2Z';

  /* A carved rune plate: stone slab, chipped edge, colour wash and the rune
     itself pointing in its direction. */
  function drawRune(x, y, cx, cy, colour, dir) {
    var px = x * CELL;
    var py = y * CELL;

    return '<rect x="' + (px + 1) + '" y="' + (py + 1) + '" width="' + (CELL - 2) +
      '" height="' + (CELL - 2) + '" rx="2" fill="#a9a294"/>' +
      '<rect x="' + (px + 2.2) + '" y="' + (py + 2.2) + '" width="' + (CELL - 4.4) +
      '" height="' + (CELL - 4.4) + '" rx="1.6" fill="#ded8cb"/>' +
      '<rect x="' + (px + 2.2) + '" y="' + (py + 2.2) + '" width="' + (CELL - 4.4) +
      '" height="' + (CELL - 4.4) + '" rx="1.6" fill="' + colour + '" fill-opacity="0.30"/>' +
      '<path d="M' + (px + 3.2) + ' ' + (py + CELL - 4.2) + 'l2.4 1.2"' +
      ' stroke="#948c7c" stroke-width="0.8" stroke-linecap="round"/>' +
      '<path d="M' + (px + CELL - 5) + ' ' + (py + 3.2) + 'l1.5 2"' +
      ' stroke="#948c7c" stroke-width="0.8" stroke-linecap="round"/>' +
      '<g transform="translate(' + cx + ' ' + cy + ') rotate(' + dir * 90 + ')">' +
        '<path d="' + RUNE + '" transform="translate(0 0.9)" fill="#8b8272"' +
        ' fill-opacity="0.55"/>' +
        '<path d="' + RUNE + '" fill="' + colour + '"' +
        ' stroke="#26251f" stroke-width="0.95" stroke-linejoin="round"/>' +
        '<path d="M-0.9 -4V3.4" stroke="#ffffff" stroke-opacity="0.30" stroke-width="0.8"/>' +
      '</g>';
  }

  /* Stone basin with glowing water — the well. */
  function drawWell(x, y) {
    var cx = (x + 0.5) * CELL;
    var cy = (y + 0.5) * CELL;

    function rim(a) {
      return 'cx="' + cx + '" cy="' + cy + '" r="' + a + '"';
    }

    return '<circle ' + rim(9.8) + ' fill="#8ceaff" fill-opacity="0.12"/>' +
      '<circle ' + rim(9.1) + ' fill="#6f6759"/>' +
      '<circle ' + rim(8.2) + ' fill="#b3ab9c"/>' +
      '<circle ' + rim(7.3) + ' fill="none" stroke="#6f6759" stroke-width="0.7" stroke-opacity="0.55"/>' +
      '<path d="M' + (cx - 7.6) + ' ' + cy + 'h15.2 M' + cx + ' ' + (cy - 7.6) + 'v15.2"' +
      ' stroke="#6f6759" stroke-width="0.7" stroke-opacity="0.35"/>' +
      '<circle ' + rim(6.2) + ' fill="#0b5a76"/>' +
      '<circle ' + rim(5.3) + ' fill="#2fb6d8"/>' +
      '<ellipse cx="' + cx + '" cy="' + (cy - 0.7) + '" rx="3.5" ry="2.2"' +
      ' fill="#bfefff" fill-opacity="0.85"/>' +
      '<circle cx="' + (cx - 2.4) + '" cy="' + (cy + 1.6) + '" r="0.8" fill="#9ce9ff" fill-opacity="0.7"/>' +
      '<circle cx="' + (cx + 2.6) + '" cy="' + (cy + 1.1) + '" r="0.6" fill="#9ce9ff" fill-opacity="0.6"/>';
  }

  function drawCell(cell, x, y) {
    if (!cell) return '';
    var cx = (x + 0.5) * CELL;
    var cy = (y + 0.5) * CELL;

    if (cell === 'crystal') return drawWell(x, y);

    if (cell === 'lava') {
      var lx = x * CELL;
      var ly = y * CELL;
      return cellRect(x, y, '#e8480a') +
        '<rect x="' + (lx + 3) + '" y="' + (ly + 3) + '" width="' + (CELL - 6) + '"' +
        ' height="' + (CELL - 6) + '" rx="3.4" fill="#ff6a12"/>' +
        '<rect x="' + (cx - 4.2) + '" y="' + (cy - 4.2) + '" width="8.4" height="8.4"' +
        ' rx="2.2" fill="#ffc03a"/>' +
        '<rect x="' + (cx - 2.2) + '" y="' + (cy - 2.2) + '" width="4.4" height="4.4"' +
        ' rx="1.2" fill="#ffe89a"/>' +
        '<circle cx="' + (lx + 5.5) + '" cy="' + (ly + 5.5) + '" r="1.1" fill="#7c2405" fill-opacity="0.55"/>' +
        '<circle cx="' + (lx + CELL - 5) + '" cy="' + (ly + CELL - 6) + '" r="0.9" fill="#7c2405" fill-opacity="0.5"/>';
    }

    if (cell === 'rock') {
      var rx = x * CELL;
      var ry = y * CELL;
      var base = ry + CELL - 4;
      return cellRect(x, y, '#454f59') +
        '<path d="M' + (rx + 3.5) + ' ' + base +
          'L' + (rx + CELL * 0.42) + ' ' + (ry + 4.5) +
          'L' + (rx + CELL - 3) + ' ' + base + 'Z" fill="#5b6874"/>' +
        '<path d="M' + (rx + CELL * 0.42) + ' ' + (ry + 4.5) +
          'L' + (rx + CELL * 0.62) + ' ' + (ry + 9) +
          'L' + (rx + CELL * 0.30) + ' ' + (ry + 10) + 'Z" fill="#7e8c99"/>' +
        '<path d="M' + (rx + 4) + ' ' + (ry + CELL - 6.5) +
          'L' + (rx + CELL * 0.3) + ' ' + (ry + CELL * 0.55) + '"' +
          ' stroke="#2f373f" stroke-width="1.1" stroke-opacity="0.7" fill="none"/>';
    }

    if (cell === 'oil') return cellRect(x, y, '#000000');

    var info = SW.CELLS[cell.colour];
    if (!info || !info.colour) return '';

    return drawRune(x, y, cx, cy, info.colour, cell.dir || 0);
  }

  /* --------------------------------------------------------------- plate -- */

  function renderTile(tile, options) {
    options = options || {};
    var face = options.face === 'back' ? 'back' : 'front';
    var rot = ((options.rot | 0) % 4 + 4) % 4;
    var grid = tile[face];
    var id = 'sw' + ++uid;
    var pal = FACE[face];
    var body = [];

    body.push(groundTexture(face, hash(tile.id + face)));

    for (var y = 0; y < GRID; y++) {
      for (var x = 0; x < GRID; x++) {
        body.push(drawCell(grid[y][x], x, y));
      }
    }

    (options.pieces || []).forEach(function (p) {
      var def = SW.PIECES[p.type] || { w: 1, h: 1 };
      var r = ((p.rot | 0) % 4 + 4) % 4;
      var fw = (r % 2) ? def.h : def.w;
      var fh = (r % 2) ? def.w : def.h;
      body.push(renderPiece(p.type, p.x, p.y, def.w, def.h, r, fw, fh));
    });

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img"' +
      ' aria-label="Tile ' + tile.id + ' (' + face + ')">' +
      '<defs>' +
        '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0.35" y2="1">' +
          '<stop offset="0" stop-color="' + pal.top + '"/>' +
          '<stop offset="1" stop-color="' + pal.bottom + '"/>' +
        '</linearGradient>' +
        '<clipPath id="' + id + '">' +
          '<rect x="0.8" y="0.8" width="118.4" height="118.4" rx="5"/>' +
        '</clipPath>' +
      '</defs>' +
      '<rect x="0.8" y="0.8" width="118.4" height="118.4" rx="5" fill="url(#' + id + 'g)"/>' +
      '<g clip-path="url(#' + id + ')">' +
        '<g transform="rotate(' + rot * 90 + ' 60 60)">' + body.join('') + '</g>' +
      '</g>' +
      '<rect x="0.8" y="0.8" width="118.4" height="118.4" rx="5" fill="none"' +
        ' stroke="' + pal.edge + '" stroke-width="1.6"/>' +
      '</svg>';
  }

  SW.renderTile = renderTile;
  SW.renderPiece = renderPiece;
  SW.renderIcon = renderIcon;
  SW.renderCell = drawCell;
})(window);
