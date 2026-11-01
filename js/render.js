/*
 * Slickworks — flat SVG rendering of plates and markers.
 * Pure geometry: no textures, no bitmaps, no scanned art.
 */
(function (global) {
  'use strict';

  var SW = global.Slickworks;
  var GRID = SW.GRID;
  var BOARD = 120;
  var CELL = BOARD / GRID;      // 20
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

  /* -------------------------------------------------------------- pieces -- */

  function renderPiece(type, cellX, cellY, rot) {
    var x = (cellX + 0.5) * CELL;
    var y = (cellY + 0.5) * CELL;
    var open = '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) * 90 + ')">';
    var body;

    if (type === 'rig') {
      body =
        '<rect x="-7.6" y="-3.9" width="3" height="5" rx="1.3" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="1.1"/>' +
        '<rect x="4.6" y="-3.9" width="3" height="5" rx="1.3" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="1.1"/>' +
        '<rect x="-3.9" y="2.0" width="3.3" height="4.6" rx="1.2" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="1.1"/>' +
        '<rect x="0.6" y="2.0" width="3.3" height="4.6" rx="1.2" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="1.1"/>' +
        '<rect x="-4.7" y="-4.8" width="9.4" height="7.6" rx="2.3" fill="' + PALE + '" stroke="' + INK + '" stroke-width="1.25"/>' +
        '<rect x="-2.3" y="-3" width="4.6" height="2.4" rx="1.2" fill="' + INK + '"/>' +
        '<circle cx="0" cy="1.5" r="1.25" fill="#ffb020" stroke="' + INK + '" stroke-width="0.6"/>';
    } else if (type === 'minion-a') {
      body =
        '<path d="M-2.5 -3.3L-4 -6" stroke="' + INK + '" stroke-width="1.2" stroke-linecap="round"/>' +
        '<path d="M2.5 -3.3L4 -6" stroke="' + INK + '" stroke-width="1.2" stroke-linecap="round"/>' +
        '<circle cx="-4" cy="-6.3" r="1" fill="#ffb020" stroke="' + INK + '" stroke-width="0.6"/>' +
        '<circle cx="4" cy="-6.3" r="1" fill="#ffb020" stroke="' + INK + '" stroke-width="0.6"/>' +
        '<circle r="4.5" fill="' + PALE + '" stroke="' + INK + '" stroke-width="1.3"/>' +
        '<circle cx="0" cy="-0.4" r="1.9" fill="' + INK + '"/>' +
        '<circle cx="-0.6" cy="-1" r="0.6" fill="' + PALE + '"/>' +
        '<path d="M-2.3 3.8V5.6M2.3 3.8V5.6" stroke="' + INK + '" stroke-width="1.3" stroke-linecap="round"/>';
    } else if (type === 'minion-b') {
      body =
        '<rect x="-4.4" y="-4.4" width="8.8" height="8.8" transform="rotate(45)"' +
        ' fill="' + PALE + '" stroke="' + INK + '" stroke-width="1.3"/>' +
        '<rect x="-1.7" y="-1.7" width="3.4" height="3.4" transform="rotate(45)" fill="#cf2b2b" stroke="' + INK + '" stroke-width="0.7"/>' +
        '<path d="M-5.6 0H5.6" stroke="' + INK + '" stroke-width="1" stroke-linecap="round"/>';
    } else if (type === 'minion-c') {
      body =
        '<polygon points="0,-5.6 4.9,-2.8 4.9,2.8 0,5.6 -4.9,2.8 -4.9,-2.8"' +
        ' fill="' + PALE + '" stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<rect x="-3" y="-1.1" width="6" height="2.2" rx="1.1" fill="' + INK + '"/>' +
        '<path d="M0 -5.6V-3.4" stroke="' + INK + '" stroke-width="1.1" stroke-linecap="round"/>';
    } else if (type === 'bomb') {
      var spikes = '';
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4;
        spikes += '<path d="M' + (Math.cos(a) * 3.9).toFixed(2) + ' ' + (Math.sin(a) * 3.9).toFixed(2) +
          'L' + (Math.cos(a) * 6).toFixed(2) + ' ' + (Math.sin(a) * 6).toFixed(2) +
          '" stroke="' + INK + '" stroke-width="1.7" stroke-linecap="round"/>';
      }
      body = spikes +
        '<circle r="4.1" fill="' + DARK + '" stroke="' + INK + '" stroke-width="1.1"/>' +
        '<circle cx="-1.3" cy="-1.3" r="1.1" fill="#7c8f9e"/>' +
        '<circle cx="1.2" cy="1.2" r="0.9" fill="#ffb020"/>';
    } else if (type === 'lava') {
      body =
        '<rect x="-6.2" y="-6.2" width="12.4" height="12.4" rx="2.3" fill="#4a2318"' +
        ' stroke="' + INK + '" stroke-width="1.3"/>' +
        '<path d="M-4.3 -2.6L-1.5 0.1L-2.8 2.7L1.3 4.6" fill="none" stroke="#ff7a2e"' +
        ' stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M2.4 -4.6L3.6 -2.4" fill="none" stroke="#ff7a2e" stroke-width="1.7" stroke-linecap="round"/>' +
        '<circle cx="-1.5" cy="0.1" r="1.3" fill="#ffd166"/>';
    } else if (type === 'barricade') {
      body =
        '<rect x="-7.8" y="-4.6" width="2" height="9.2" rx="0.7" fill="#8a97a3" stroke="' + INK + '" stroke-width="1.1"/>' +
        '<rect x="5.8" y="-4.6" width="2" height="9.2" rx="0.7" fill="#8a97a3" stroke="' + INK + '" stroke-width="1.1"/>' +
        '<rect x="-7" y="-2.5" width="14" height="5" rx="1" fill="#f2c230" stroke="' + INK + '" stroke-width="1.2"/>' +
        '<path d="M-5 -2.3L-2.6 2.3M-2 -2.3L0.4 2.3M1 -2.3L3.4 2.3M4 -2.3L6.4 2.3"' +
        ' stroke="' + INK + '" stroke-width="1.2"/>';
    } else if (type === 'shard') {
      body =
        '<path d="M0 -6.4L4.5 -2.8L3.3 5.1L-3.3 5.1L-4.5 -2.8Z" fill="#8a4fc0"' +
        ' stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M0 -6.4L0 5.1L-3.3 5.1L-4.5 -2.8Z" fill="#6b34a0"/>' +
        '<path d="M0 -6.4L3.3 -1.2L0 2.2Z" fill="#c9a6ee" fill-opacity="0.9"/>' +
        '<path d="M-1.9 1.2L0 5.1" stroke="#b98ae4" stroke-width="0.9" fill="none"/>';
    } else if (type === 'tape') {
      body =
        '<rect x="-7.2" y="-2.3" width="14.4" height="4.6" rx="0.9" fill="#f2c230"' +
        ' stroke="' + INK + '" stroke-width="1.2"/>' +
        '<path d="M-5.2 -2.1L-2.8 2.1M-2.2 -2.1L0.2 2.1M0.8 -2.1L3.2 2.1M3.8 -2.1L6.2 2.1"' +
        ' stroke="' + INK + '" stroke-width="1.2"/>';
    } else {
      body =
        '<rect x="-4.4" y="-4.4" width="8.8" height="8.8" transform="rotate(45)"' +
        ' fill="' + PALE + '" stroke="' + INK + '" stroke-width="1.4"/>';
    }

    return open + body + '</g>';
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

    if (cell === 'oil') {
      return cellRect(x, y, '#000000');
    }

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
      body.push(renderPiece(p.type, p.x, p.y, p.rot || 0));
    });

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img"' +
      ' aria-label="Platte ' + tile.id + ' (' + face + ')">' +
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
  SW.renderCell = drawCell;
})(window);
