/*
 * Slickworks — pure SVG rendering. No bitmaps, no fonts, no external assets.
 * Everything is drawn from the tile data at runtime.
 */
(function (global) {
  'use strict';

  var GRID = global.Slickworks.GRID;
  var UNIT = 100 / GRID;
  var uid = 0;

  var COLOURS = {
    ink: '#101820',
    paper: '#ffffff',
    oilFlow: '#7d8f9e',
    ochre: '#e0a12a',
    verdigris: '#2f9e8f',
    madder: '#a34f7a',
    ember: '#d9482b',
    emberTint: '#f7dcd3',
    accent: '#ffb020'
  };

  function mid(cell) {
    return (cell + 0.5) * UNIT;
  }

  function isBorder(x, y) {
    return x === 0 || y === 0 || x === GRID - 1 || y === GRID - 1;
  }

  function round(n) {
    return Math.round(n * 100) / 100;
  }

  /* -------------------------------------------------------------- pieces -- */

  function renderPiece(type, cellX, cellY, rot) {
    var x = mid(cellX);
    var y = mid(cellY);
    var t = 'translate(' + round(x) + ' ' + round(y) + ') rotate(' + (rot || 0) * 90 + ')';

    if (type === 'rig') {
      return (
        '<g transform="' + t + '">' +
        '<rect x="-7.5" y="-7.5" width="15" height="15" rx="3.5" fill="' + COLOURS.ink + '"/>' +
        '<rect x="-5" y="-2.6" width="10" height="1.9" rx="0.95" fill="' + COLOURS.paper + '"/>' +
        '<rect x="-5" y="0.7" width="10" height="1.9" rx="0.95" fill="' + COLOURS.paper + '"/>' +
        '</g>'
      );
    }

    if (type === 'drone') {
      return (
        '<g transform="' + t + '">' +
        '<circle r="5.6" fill="' + COLOURS.verdigris + '" stroke="' + COLOURS.paper + '" stroke-width="1.3"/>' +
        '<circle r="1.7" fill="' + COLOURS.paper + '"/>' +
        '</g>'
      );
    }

    // core
    return (
      '<g transform="' + t + '">' +
      '<rect x="-5.2" y="-5.2" width="10.4" height="10.4" transform="rotate(45)"' +
      ' fill="' + COLOURS.madder + '" stroke="' + COLOURS.paper + '" stroke-width="1.2"/>' +
      '</g>'
    );
  }

  /* --------------------------------------------------------------- plate -- */

  function renderTile(tile, options) {
    options = options || {};
    var face = options.face === 'ember' ? 'ember' : 'foundry';
    var rot = ((options.rot | 0) % 4 + 4) % 4;
    var data = tile.faces[face];
    var id = 'sw' + ++uid;
    var body = [];

    /* grid hairlines */
    for (var g = 1; g < GRID; g++) {
      body.push(
        '<path d="M' + round(g * UNIT) + ' 1V99 M1 ' + round(g * UNIT) + 'H99"' +
        ' stroke="' + COLOURS.ink + '" stroke-opacity="0.07" stroke-width="0.8"/>'
      );
    }

    /* ember cells: hatched, never a photo texture */
    data.ember.forEach(function (cell) {
      body.push(
        '<rect x="' + round(cell.x * UNIT + 1.5) + '" y="' + round(cell.y * UNIT + 1.5) + '"' +
        ' width="' + round(UNIT - 3) + '" height="' + round(UNIT - 3) + '" rx="3"' +
        ' fill="url(#' + id + '-ember)"/>'
      );
    });

    /* colour fields */
    data.zones.forEach(function (cell) {
      var x = round(cell.x * UNIT + 3);
      var y = round(cell.y * UNIT + 3);
      var s = round(UNIT - 6);
      body.push(
        '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="4.5"' +
        ' fill="' + (COLOURS[cell.colour] || cell.colour) + '"/>' +
        '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="4.5"' +
        ' fill="none" stroke="' + COLOURS.paper + '" stroke-opacity="0.55" stroke-width="0.9"/>'
      );
    });

    /* vents */
    data.vents.forEach(function (cell) {
      var x = mid(cell.x);
      var y = mid(cell.y);
      body.push(
        '<path d="M' + round(x - 5) + ' ' + round(y - 5) +
        ' L' + round(x + 5.5) + ' ' + round(y) +
        ' L' + round(x - 5) + ' ' + round(y + 5) + ' Z" fill="' + COLOURS.ink + '"/>'
      );
    });

    /* oil line: dark pipe with a light dotted flow inside */
    if (data.oil.length > 1) {
      var points = data.oil.map(function (p, i) {
        var neighbour = i === 0 ? data.oil[1] : data.oil[i - 1];
        var outward = (i === 0 || i === data.oil.length - 1) && isBorder(p[0], p[1]);
        var x = mid(p[0]);
        var y = mid(p[1]);
        if (outward) {
          var dx = p[0] - neighbour[0];
          var dy = p[1] - neighbour[1];
          if (dx < 0) x = 0; else if (dx > 0) x = 100;
          if (dy < 0) y = 0; else if (dy > 0) y = 100;
        }
        return round(x) + ',' + round(y);
      }).join(' ');
      body.push(
        '<polyline points="' + points + '" fill="none" stroke="' + COLOURS.ink +
        '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'
      );
      body.push(
        '<polyline points="' + points + '" fill="none" stroke="' + COLOURS.oilFlow +
        '" stroke-width="1.3" stroke-dasharray="2.4 3.6" stroke-linecap="round"/>'
      );
    }

    /* markers */
    (options.pieces || []).forEach(function (p) {
      body.push(renderPiece(p.type, p.x, p.y, p.rot || 0));
    });

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img"' +
      ' aria-label="Platte ' + tile.id + ' (' + face + ')">' +
      '<defs>' +
      '<pattern id="' + id + '-ember" width="6" height="6" patternUnits="userSpaceOnUse"' +
      ' patternTransform="rotate(45)">' +
      '<rect width="6" height="6" fill="' + COLOURS.emberTint + '"/>' +
      '<path d="M0 0V6" stroke="' + COLOURS.ember + '" stroke-width="2.3"/>' +
      '</pattern>' +
      '<clipPath id="' + id + '-clip">' +
      '<rect x="0.6" y="0.6" width="98.8" height="98.8" rx="6"/>' +
      '</clipPath>' +
      '</defs>' +
      '<rect x="0.6" y="0.6" width="98.8" height="98.8" rx="6" fill="' + COLOURS.paper + '"/>' +
      '<g clip-path="url(#' + id + '-clip)">' +
      '<g transform="rotate(' + rot * 90 + ' 50 50)">' + body.join('') + '</g>' +
      '</g>' +
      '<rect x="0.6" y="0.6" width="98.8" height="98.8" rx="6" fill="none"' +
      ' stroke="' + COLOURS.ink + '" stroke-opacity="0.5" stroke-width="1.2"/>' +
      '</svg>';

    return svg;
  }

  global.Slickworks.renderTile = renderTile;
  global.Slickworks.renderPiece = renderPiece;
})(window);
