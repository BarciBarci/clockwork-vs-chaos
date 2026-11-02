/*
 * Clockwork vs Chaos — plate data.
 *
 * Grid: 6 x 6 cells per plate (measured from the printed plate grid).
 * Each plate has two faces: grass (front) and lava (back).
 *
 * Cell codes: '' (empty) | 'oil' | 'lava' | 'crystal'
 *   or a field object { colour, dir } — dir is 0=N, 1=E, 2=S, 3=W.
 *
 * Field positions and rune directions were measured from the plate art:
 * positions via colour-mask classification per cell, directions via
 * rotational template matching against one reference rune per colour
 * (best match 0.34-1.00, every other rotation <= 0.20).
 */
(function (global) {
  'use strict';

  var GRID = 6;

  function blank() {
    var g = [];
    for (var y = 0; y < GRID; y++) {
      var row = [];
      for (var x = 0; x < GRID; x++) row.push(null);
      g.push(row);
    }
    return g;
  }

  function buildFace(fields, oil, lava, rock) {
    var g = blank();
    (rock || []).forEach(function (c) { g[c[1]][c[0]] = 'rock'; });
    fields.forEach(function (f) {
      g[f[1]][f[0]] = f[2] === 'crystal' ? 'crystal' : { colour: f[2], dir: f[3] || 0 };
    });
    (oil || []).forEach(function (c) { g[c[1]][c[0]] = 'oil'; });
    (lava || []).forEach(function (c) { g[c[1]][c[0]] = 'lava'; });
    return g;
  }

  var TILES = [
    {
      id: 'T1',
      front: buildFace(
        [[0, 0, 'orange', 3], [4, 0, 'red', 1], [5, 1, 'green', 0], [1, 2, 'crystal', 0],
         [2, 2, 'blue', 2], [0, 4, 'red', 2], [2, 4, 'green', 1], [3, 4, 'orange', 0]],
        [[3, 2], [4, 2], [5, 2], [2, 3], [3, 3]],
        []
      ),
      back: buildFace(
        [[0, 1, 'orange', 1], [1, 1, 'orange', 0], [4, 1, 'red', 0], [5, 1, 'red', 2],
         [1, 3, 'crystal', 0], [3, 4, 'blue', 2], [4, 4, 'green', 0], [3, 5, 'blue', 0],
         [4, 5, 'green', 3]],
        [],
        [[2, 4], [2, 5]],
        [[2, 0], [3, 0], [3, 1], [2, 2], [3, 2], [2, 3], [3, 3]]
      )
    },
    {
      id: 'T2',
      front: buildFace(
        [[3, 0, 'green', 3], [1, 1, 'red', 2], [4, 1, 'orange', 2], [1, 2, 'blue', 0],
         [3, 2, 'crystal', 0], [1, 4, 'green', 2], [3, 4, 'orange', 3], [4, 4, 'blue', 1],
         [0, 5, 'red', 0]],
        [[1, 5], [2, 5]],
        []
      ),
      back: buildFace(
        [[0, 0, 'green', 1], [5, 0, 'blue', 2], [2, 2, 'red', 0], [3, 2, 'blue', 3],
         [2, 3, 'green', 0], [3, 3, 'orange', 1], [5, 3, 'crystal', 0], [0, 5, 'red', 1],
         [5, 5, 'orange', 3]],
        [],
        [],
        [[2, 0], [3, 0], [3, 1], [2, 4], [3, 4], [2, 5]]
      )
    },
    {
      id: 'T3',
      front: buildFace(
        [[5, 0, 'green', 0], [1, 1, 'blue', 1], [2, 2, 'red', 1], [0, 3, 'orange', 3],
         [2, 3, 'red', 2], [1, 4, 'blue', 3], [5, 5, 'green', 1]],
        [],
        []
      ),
      back: buildFace(
        [[0, 0, 'green', 0], [1, 1, 'blue', 2], [5, 1, 'red', 3], [4, 2, 'green', 2],
         [1, 3, 'crystal', 0], [0, 4, 'orange', 3], [5, 4, 'blue', 0], [0, 5, 'red', 0],
         [5, 5, 'orange', 0]],
        [],
        [[2, 0], [3, 0]],
        [[2, 1], [3, 1], [3, 3]]
      )
    },
    {
      id: 'T4',
      front: buildFace(
        [[3, 0, 'orange', 0], [4, 0, 'green', 2], [0, 1, 'blue', 2], [4, 1, 'crystal', 0],
         [1, 3, 'red', 2], [2, 4, 'green', 0], [3, 5, 'orange', 1], [4, 5, 'red', 1]],
        [[2, 2], [3, 2], [2, 3], [3, 3]],
        []
      ),
      back: buildFace(
        [[2, 0, 'crystal', 0], [4, 0, 'green', 0], [2, 1, 'red', 3], [3, 1, 'orange', 3],
         [3, 2, 'green', 2], [3, 3, 'blue', 2], [2, 4, 'orange', 0], [3, 4, 'red', 2],
         [1, 5, 'blue', 3]],
        [],
        [[2, 2], [2, 3]],
        [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [5, 3], [5, 4]]
      )
    },
    {
      id: 'T5',
      front: buildFace(
        [[1, 1, 'blue', 3], [5, 1, 'crystal', 0], [2, 2, 'orange', 3], [3, 2, 'green', 1],
         [2, 3, 'green', 0], [3, 3, 'orange', 0], [4, 4, 'blue', 0], [0, 5, 'red', 1]],
        [[3, 0], [4, 0], [5, 0], [0, 2], [1, 2], [0, 3], [1, 3], [0, 4],
         [1, 4], [2, 4], [1, 5], [2, 5]],
        []
      ),
      back: buildFace(
        [[0, 0, 'green', 0], [5, 0, 'orange', 0], [1, 1, 'red', 3], [2, 1, 'crystal', 0],
         [4, 1, 'blue', 1], [1, 4, 'green', 3], [4, 4, 'orange', 2], [0, 5, 'red', 1],
         [5, 5, 'blue', 0]],
        [],
        [[2, 2], [3, 2], [2, 3], [3, 3]],
        [[1, 2], [4, 2], [4, 3], [1, 3]]
      )
    }
  ];

  var index = {};
  TILES.forEach(function (t) { index[t.id] = t; });

  var CELLS = {
    oil: { label: 'Oil', colour: '#000000' },
    lava: { label: 'Lava', colour: '#ff5a0a' },
    rock: { label: 'Rock', colour: '#4b5560' },
    orange: { label: 'Orange', colour: '#e8961e' },
    red: { label: 'Red', colour: '#cf2b2b' },
    green: { label: 'Green', colour: '#2fae4a' },
    blue: { label: 'Blue', colour: '#2f6fd0' },
    crystal: { label: 'Crystal', colour: '#46c8f0' }
  };

  var DIRS = ['N', 'O', 'S', 'W'];

  /*
   * Labels, footprints and occupancy masks match the original S.C.R.A.P.
   * asset set (slugs, names and cell matrices taken from the shipped tool).
   * The 3 x 6 wall mask is view 0 of the original matrix:
   *   [1,0,0, 1,1,0, 1,1,1, 1,1,1, 1,1,0, 1,0,0]
   */
  var WALL_MASK = [
    [1, 0, 0],
    [1, 1, 0],
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 0],
    [1, 0, 0]
  ];

  var PIECES = {
    school: { label: 'School', note: 'Wall panel, 3 × 6', w: 3, h: 6, mask: WALL_MASK, max: 1 },
    lava: { label: 'Lava Wall', note: 'Lava wall, 3 × 6', w: 3, h: 6, mask: WALL_MASK, max: 1 },
    gear: { label: 'Gear Ring', note: 'Gear ring', w: 1, h: 1, max: 4 },
    'minion-1': { label: 'Boss Mech', note: 'Boss, 2 × 2', w: 2, h: 2, max: 1 },
    'minion-2': { label: 'Minion', note: 'Enemy', w: 1, h: 1, max: 1 },
    'minion-3': { label: 'Player Mech', note: 'Player figure, 4 in the box', w: 1, h: 1, max: 4 },
    bomb: { label: 'The Bomb', note: 'Explosive', w: 1, h: 1, max: 1 },
    tape: { label: 'Goal Zone', note: 'Objective zone', w: 1, h: 1, max: 1 },
    shard: { label: 'Crystal Shard', note: 'Shard, 4 in the box', w: 1, h: 1, max: 4 }
  };

  global.PlateFoundry = {
    GRID: GRID,
    TILES: TILES,
    CELLS: CELLS,
    DIRS: DIRS,
    PIECES: PIECES,
    tileById: function (id) { return index[id] || null; }
  };
})(window);
