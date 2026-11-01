/*
 * Slickworks — plate model and generator
 * Original work. Code: MIT. Generated layouts/artwork: CC0.
 *
 * A plate is a 4x4 cell grid with two faces:
 *   foundry — the "safe" side
 *   ember   — the used side, with ember (lava) cells
 *
 * Every layout is produced by a seeded generator, so the deck is reproducible
 * and shares no geometry with any published board game.
 */
(function (global) {
  'use strict';

  var GRID = 4;

  /* ---------------------------------------------------------------- rng -- */

  function hashSeed(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------ geometry -- */

  function key(x, y) {
    return x + ':' + y;
  }

  function inGrid(x, y) {
    return x >= 0 && y >= 0 && x < GRID && y < GRID;
  }

  function neighbours(x, y) {
    var out = [];
    if (inGrid(x + 1, y)) out.push([x + 1, y]);
    if (inGrid(x - 1, y)) out.push([x - 1, y]);
    if (inGrid(x, y + 1)) out.push([x, y + 1]);
    if (inGrid(x, y - 1)) out.push([x, y - 1]);
    return out;
  }

  function isBorder(x, y) {
    return x === 0 || y === 0 || x === GRID - 1 || y === GRID - 1;
  }

  function randCell(rng) {
    return [Math.floor(rng() * GRID), Math.floor(rng() * GRID)];
  }

  function pick(rng, list) {
    return list[Math.floor(rng() * list.length)];
  }

  /* --------------------------------------------------------- generators --- */

  /*
   * An oil line enters the plate from the edge, wanders orthogonally and
   * leaves again at another edge cell. Cell coordinates, no diagonals.
   */
  function genOilPath(rng, minLen, maxLen) {
    minLen = minLen || 4;
    maxLen = maxLen || 7;

    var border = [];
    for (var y = 0; y < GRID; y++) {
      for (var x = 0; x < GRID; x++) {
        if (isBorder(x, y)) border.push([x, y]);
      }
    }

    var start = pick(rng, border);
    var path = [start];
    var seen = {};
    seen[key(start[0], start[1])] = true;

    while (path.length < maxLen) {
      var head = path[path.length - 1];
      var options = neighbours(head[0], head[1]).filter(function (n) {
        return !seen[key(n[0], n[1])];
      });
      if (!options.length) break;

      var next = pick(rng, options);
      path.push(next);
      seen[key(next[0], next[1])] = true;

      if (isBorder(next[0], next[1]) && path.length >= minLen) break;
    }

    return path;
  }

  var ZONE_COLOURS = ['ochre', 'verdigris', 'madder'];

  /* ------------------------------------------------------------ face gen -- */

  function generateFace(kind, rng) {
    var oil = genOilPath(rng);
    var used = {};
    oil.forEach(function (p) {
      used[key(p[0], p[1])] = true;
    });

    function takeFree(tries) {
      for (var i = 0; i < tries; i++) {
        var c = randCell(rng);
        if (!used[key(c[0], c[1])]) {
          used[key(c[0], c[1])] = true;
          return c;
        }
      }
      return null;
    }

    var zones = [];
    var wantZones = 2 + Math.floor(rng() * 3); // 2..4
    var offset = kind === 'ember' ? 1 : 0;
    for (var z = 0; z < wantZones; z++) {
      var cell = takeFree(40);
      if (!cell) break;
      zones.push({
        x: cell[0],
        y: cell[1],
        colour: ZONE_COLOURS[(z + offset) % ZONE_COLOURS.length]
      });
    }

    var vents = [];
    if (rng() < 0.6) {
      var vent = takeFree(40);
      if (vent) vents.push({ x: vent[0], y: vent[1] });
    }

    var ember = [];
    if (kind === 'ember') {
      var wantEmber = 3 + Math.floor(rng() * 3); // 3..5
      for (var e = 0; e < wantEmber; e++) {
        var hot = takeFree(60);
        if (!hot) break;
        ember.push({ x: hot[0], y: hot[1] });
      }
    }

    return { oil: oil, zones: zones, vents: vents, ember: ember };
  }

  /* ---------------------------------------------------------------- deck -- */

  function makeTile(id, seed) {
    return {
      id: id,
      faces: {
        foundry: generateFace('foundry', mulberry32(hashSeed(seed + ':foundry'))),
        ember: generateFace('ember', mulberry32(hashSeed(seed + ':ember')))
      }
    };
  }

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  var DECK = [];
  for (var i = 0; i < 12; i++) {
    DECK.push(makeTile('P' + pad(i + 1), 'slickworks/plate/' + i));
  }

  var index = {};
  DECK.forEach(function (tile) {
    index[tile.id] = tile;
  });

  function tileById(id) {
    return index[id] || null;
  }

  /* -------------------------------------------------------------- pieces -- */

  var PIECES = {
    rig: { label: 'Rig', note: 'Spielerfigur' },
    drone: { label: 'Drone', note: 'läuft Öllinien ab' },
    core: { label: 'Core', note: 'Zielobjekt' }
  };

  global.Slickworks = {
    GRID: GRID,
    DECK: DECK,
    PIECES: PIECES,
    tileById: tileById,
    makeTile: makeTile,
    hashSeed: hashSeed,
    mulberry32: mulberry32
  };
})(window);
