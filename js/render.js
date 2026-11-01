/*
 * Slickworks — flat SVG rendering of plates and markers.
 * Pure geometry: no textures, no bitmaps, no scanned art.
 */
(function (global) {
  'use strict';

  var SW = global.Slickworks;
  var GRID = SW.GRID;
  var BOARD = 120;              // viewBox is 120 x 120
  var CELL = BOARD / GRID;      // 20
  var uid = 0;

  var FACE_BASE = {
    front: '#f4f1ea',
    back: '#6e3327'
  };

  var FACE_EDGE = {
    front: 'rgba(16,24,32,0.55)',
    back: 'rgba(255,236,224,0.55)'
  };

  /* -------------------------------------------------------------- pieces -- */

  function renderPiece(type, cellX, cellY, rot) {
    var x = (cellX + 0.5) * CELL;
    var y = (cellY + 0.5) * CELL;
    var t = 'translate(' + x + ' ' + y + ') rotate(' + (rot || 0) * 90 + ')';
    var ink = '#101820';
    var pale = '#ffffff';

    if (type === 'rig') {
      return '<g transform="' + t + '">' +
        '<rect x="-5.5" y="-5.5" width="11" height="11" rx="2.5" fill="' + pale + '"' +
        ' stroke="' + ink + '" stroke-width="1.4"/>' +
        '<path d="M-3 -1.6H3M-3 1.6H3" stroke="' + ink + '" stroke-width="1.3"' +
        ' stroke-linecap="round"/>' +
        '</g>';
    }

    if (type === 'minion-a') {
      return '<g transform="' + t + '">' +
        '<circle r="4.6" fill="' + pale + '" stroke="' + ink + '" stroke-width="1.4"/>' +
        '<circle r="1.5" fill="' + ink + '"/>' +
        '</g>';
    }

    if (type === 'minion-b') {
      return '<g transform="' + t + '">' +
        '<rect x="-4.2" y="-4.2" width="8.4" height="8.4" transform="rotate(45)"' +
        ' fill="' + pale + '" stroke="' + ink + '" stroke-width="1.4"/>' +
        '</g>';
    }

    if (type === 'minion-c') {
      return '<g transform="' + t + '">' +
        '<rect x="-4.5" y="-4.5" width="9" height="9" rx="1.6" fill="' + pale + '"' +
        ' stroke="' + ink + '" stroke-width="1.4"/>' +
        '<path d="M-3 1.2L0 -2.6L3 1.2" fill="none" stroke="' + ink + '"' +
        ' stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</g>';
    }

    if (type === 'bomb') {
      var spikes = '';
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4;
        var x1 = Math.cos(a) * 3.6;
        var y1 = Math.sin(a) * 3.6;
        var x2 = Math.cos(a) * 6;
        var y2 = Math.sin(a) * 6;
        spikes += '<path d="M' + x1.toFixed(2) + ' ' + y1.toFixed(2) + 'L' +
          x2.toFixed(2) + ' ' + y2.toFixed(2) + '" stroke="' + ink +
          '" stroke-width="1.6" stroke-linecap="round"/>';
      }
      return '<g transform="' + t + '">' + spikes +
        '<circle r="4" fill="' + ink + '"/>' +
        '<circle r="1.5" fill="' + pale + '"/>' +
        '</g>';
    }

    if (type === 'lava') {
      return '<g transform="' + t + '">' +
        '<rect x="-5.5" y="-5.5" width="11" height="11" rx="1.6" fill="#ff7a2e"' +
        ' stroke="' + ink + '" stroke-width="1.4"/>' +
        '<rect x="-2.6" y="-2.6" width="5.2" height="5.2" rx="1" fill="#ffd166"/>' +
        '</g>';
    }

    if (type === 'barricade') {
      return '<g transform="' + t + '">' +
        '<rect x="-3" y="-5.5" width="6" height="11" rx="1" fill="' + pale + '"' +
        ' stroke="' + ink + '" stroke-width="1.3"/>' +
        '<path d="M-2.2 -3.4L2.2 -5M-2.2 -0.4L2.2 -2M-2.2 2.6L2.2 1M-2.2 5.2L2.2 3.6"' +
        ' stroke="' + ink + '" stroke-width="1.3"/>' +
        '</g>';
    }

    if (type === 'shard') {
      return '<g transform="' + t + '">' +
        '<path d="M0 -5.6L4.6 -2.8L4.6 2.8L0 5.6L-4.6 2.8L-4.6 -2.8Z"' +
        ' fill="#7b3fa0" stroke="' + pale + '" stroke-width="1.2"/>' +
        '<path d="M0 -3L2.2 0L0 3L-2.2 0Z" fill="' + pale + '" fill-opacity="0.55"/>' +
        '</g>';
    }

    if (type === 'tape') {
      return '<g transform="' + t + '">' +
        '<rect x="-6.5" y="-2.6" width="13" height="5.2" fill="#f2c230"' +
        ' stroke="' + ink + '" stroke-width="1.2"/>' +
        '<path d="M-4.6 -2.4L-2.4 2.4M-1.6 -2.4L0.6 2.4M1.4 -2.4L3.6 2.4M4.4 -2.4L6.4 2.4"' +
        ' stroke="' + ink + '" stroke-width="1.2"/>' +
        '</g>';
    }

    return '<g transform="' + t + '">' +
      '<rect x="-4.2" y="-4.2" width="8.4" height="8.4" transform="rotate(45)"' +
      ' fill="' + pale + '" stroke="' + ink + '" stroke-width="1.4"/>' +
      '</g>';
  }

  /* --------------------------------------------------------------- cells -- */

  function cellRect(x, y, fill, extra) {
    var px = x * CELL + 1;
    var py = y * CELL + 1;
    var size = CELL - 2;
    return '<rect x="' + px + '" y="' + py + '" width="' + size + '" height="' + size +
      '" rx="1.6" fill="' + fill + '"' + (extra || '') + '/>';
  }

  function drawCell(code, x, y) {
    if (!code) return '';

    if (code === 'crystal') {
      var cx = (x + 0.5) * CELL;
      var cy = (y + 0.5) * CELL;
      return cellRect(x, y, '#46c8f0') +
        '<rect x="' + (cx - 4) + '" y="' + (cy - 4) + '" width="8" height="8"' +
        ' transform="rotate(45 ' + cx + ' ' + cy + ')" fill="#ffffff" fill-opacity="0.75"/>' +
        '<rect x="' + (cx - 2) + '" y="' + (cy - 2) + '" width="4" height="4"' +
        ' transform="rotate(45 ' + cx + ' ' + cy + ')" fill="#0f6c8a"/>';
    }

    if (code === 'lava') {
      var lx = (x + 0.5) * CELL;
      var ly = (y + 0.5) * CELL;
      return cellRect(x, y, '#ff7a2e') +
        '<rect x="' + (lx - 3.5) + '" y="' + (ly - 3.5) + '" width="7" height="7"' +
        ' rx="1.4" fill="#ffd166"/>';
    }

    var info = SW.CELLS[code];
    if (!info || !info.colour) return '';
    return cellRect(x, y, info.colour);
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
      '<rect x="0.8" y="0.8" width="118.4" height="118.4" rx="5"' +
        ' fill="' + FACE_BASE[face] + '"/>' +
      '<g clip-path="url(#' + id + ')">' +
        '<g transform="rotate(' + rot * 90 + ' 60 60)">' + body.join('') + '</g>' +
      '</g>' +
      '<rect x="0.8" y="0.8" width="118.4" height="118.4" rx="5" fill="none"' +
        ' stroke="' + FACE_EDGE[face] + '" stroke-width="1.6"/>' +
      '</svg>';
  }

  SW.renderTile = renderTile;
  SW.renderPiece = renderPiece;
})(window);
