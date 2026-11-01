/*
 * Slickworks — plate data.
 *
 * Grid: 6 x 6 cells per plate (measured from the printed plate grid).
 * Each plate has two faces: grass (front) and lava (back).
 *
 * Cell codes: '' (empty) | 'oil' | 'lava' | 'orange' | 'red' | 'green'
 *             | 'blue' | 'crystal'
 *
 * The layouts below reproduce the arrangements of the physical plate set,
 * because a scenario editor is useless if it does not match the table.
 * The artwork around them is original flat geometry — see README.
 */
(function (global) {
  'use strict';

  var GRID = 6;

  function blank() {
    var g = [];
    for (var y = 0; y < GRID; y++) {
      var row = [];
      for (var x = 0; x < GRID; x++) row.push('');
      g.push(row);
    }
    return g;
  }

  function buildFace(fields, oil, lava) {
    var g = blank();
    fields.forEach(function (f) { g[f[1]][f[0]] = f[2]; });
    (oil || []).forEach(function (c) { g[c[1]][c[0]] = 'oil'; });
    (lava || []).forEach(function (c) { g[c[1]][c[0]] = 'lava'; });
    return g;
  }

  var TILES = [
    {
      id: 'T1',
      front: buildFace(
        [[0, 0, 'orange'], [4, 0, 'red'], [5, 1, 'green'], [1, 2, 'crystal'],
         [2, 2, 'blue'], [0, 4, 'red'], [2, 4, 'green'], [3, 4, 'orange']],
        [[3, 2], [4, 2], [5, 2], [2, 3], [3, 3]],
        []
      ),
      back: buildFace(
        [[0, 1, 'orange'], [1, 1, 'orange'], [4, 1, 'red'], [5, 1, 'red'],
         [1, 3, 'crystal'], [3, 4, 'blue'], [4, 4, 'green'], [3, 5, 'blue'],
         [4, 5, 'green']],
        [],
        [[2, 4], [2, 5]]
      )
    },
    {
      id: 'T2',
      front: buildFace(
        [[3, 0, 'green'], [1, 1, 'red'], [4, 1, 'orange'], [1, 2, 'blue'],
         [3, 2, 'crystal'], [1, 4, 'green'], [3, 4, 'orange'], [4, 4, 'blue'],
         [0, 5, 'red']],
        [[1, 5], [2, 5]],
        []
      ),
      back: buildFace(
        [[0, 0, 'green'], [5, 0, 'blue'], [2, 2, 'red'], [3, 2, 'blue'],
         [2, 3, 'green'], [3, 3, 'orange'], [5, 3, 'crystal'], [0, 5, 'red'],
         [5, 5, 'orange']],
        [],
        []
      )
    },
    {
      id: 'T3',
      front: buildFace(
        [[5, 0, 'green'], [1, 1, 'blue'], [2, 2, 'red'], [0, 3, 'orange'],
         [2, 3, 'red'], [1, 4, 'blue'], [5, 5, 'green']],
        [],
        []
      ),
      back: buildFace(
        [[0, 0, 'green'], [1, 1, 'blue'], [4, 1, 'red'], [5, 1, 'red'],
         [4, 2, 'green'], [1, 3, 'crystal'], [0, 4, 'orange'], [5, 4, 'blue'],
         [0, 5, 'red'], [5, 5, 'orange']],
        [],
        [[2, 0], [3, 0]]
      )
    },
    {
      id: 'T4',
      front: buildFace(
        [[3, 0, 'orange'], [4, 0, 'green'], [0, 1, 'blue'], [4, 1, 'crystal'],
         [1, 3, 'red'], [2, 4, 'green'], [3, 5, 'orange'], [4, 5, 'red']],
        [[2, 2], [3, 2], [2, 3], [3, 3]],
        []
      ),
      back: buildFace(
        [[2, 0, 'crystal'], [4, 0, 'green'], [2, 1, 'red'], [3, 1, 'orange'],
         [3, 2, 'green'], [3, 3, 'blue'], [2, 4, 'orange'], [3, 4, 'red'],
         [1, 5, 'blue']],
        [],
        [[2, 2], [2, 3]]
      )
    },
    {
      id: 'T5',
      front: buildFace(
        [[1, 1, 'blue'], [5, 1, 'crystal'], [2, 2, 'orange'], [3, 2, 'green'],
         [2, 3, 'green'], [3, 3, 'orange'], [4, 4, 'blue'], [0, 5, 'red']],
        [[3, 0], [4, 0], [5, 0], [0, 2], [1, 2], [0, 3], [1, 3], [0, 4],
         [1, 4], [2, 4], [1, 5], [2, 5]],
        []
      ),
      back: buildFace(
        [[0, 0, 'green'], [5, 0, 'orange'], [1, 1, 'red'], [2, 1, 'crystal'],
         [4, 1, 'blue'], [1, 4, 'green'], [4, 4, 'orange'], [0, 5, 'red'],
         [5, 5, 'blue']],
        [],
        [[2, 2], [3, 2], [2, 3], [3, 3]]
      )
    }
  ];

  var index = {};
  TILES.forEach(function (t) { index[t.id] = t; });

  var CELLS = {
    empty: { label: 'Leer', colour: null },
    oil: { label: 'Ölfeld', colour: '#000000' },
    lava: { label: 'Lava', colour: '#e2571e' },
    orange: { label: 'Ocker', colour: '#e8961e' },
    red: { label: 'Rot', colour: '#cf2b2b' },
    green: { label: 'Grün', colour: '#2fae4a' },
    blue: { label: 'Blau', colour: '#2f6fd0' },
    crystal: { label: 'Kristall', colour: '#46c8f0' }
  };

  var PIECES = {
    rig: { label: 'Rig', note: 'Spielerfigur' },
    drone: { label: 'Drohne', note: 'läuft die Öllinie ab' },
    core: { label: 'Kern', note: 'Zielobjekt' }
  };

  global.Slickworks = {
    GRID: GRID,
    TILES: TILES,
    CELLS: CELLS,
    PIECES: PIECES,
    tileById: function (id) { return index[id] || null; }
  };
})(window);
