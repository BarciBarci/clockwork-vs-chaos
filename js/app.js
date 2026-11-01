/*
 * Slickworks — scenario editor.
 * Plain DOM, no framework, no dependencies.
 */
(function () {
  'use strict';

  var SW = window.Slickworks;
  var BOARD = 5;
  var STORAGE_KEY = 'slickworks:scenario';

  var state = {
    board: new Array(BOARD * BOARD).fill(null),
    mode: 'tile',          // 'tile' | 'piece' | 'erase'
    tileId: SW.TILES[0].id,
    pieceType: 'rig',
    face: 'front',
    rot: 0,
    meta: { title: '', author: '', objective: '', rules: '' }
  };

  var boardEl = document.getElementById('board');
  var paletteEl = document.getElementById('palette-tiles');
  var piecesEl = document.getElementById('palette-pieces');
  var hintEl = document.getElementById('board-hint');
  var toastEl = document.getElementById('toast');
  var fileInput = document.getElementById('file-input');

  var toastTimer = null;

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2200);
  }

  /* Which cell of a plate was clicked? Convert back into plate space so
     markers stay glued to the artwork when the plate is rotated. */
  function subCell(el, event, rot) {
    var r = el.getBoundingClientRect();
    var vx = Math.min(SW.GRID - 1, Math.max(0, Math.floor((event.clientX - r.left) / r.width * SW.GRID)));
    var vy = Math.min(SW.GRID - 1, Math.max(0, Math.floor((event.clientY - r.top) / r.height * SW.GRID)));
    var x = vx;
    var y = vy;
    for (var i = 0; i < rot; i++) {
      var nx = y;
      var ny = SW.GRID - 1 - x;
      x = nx;
      y = ny;
    }
    return [x, y];
  }

  /* ------------------------------------------------------------- palette -- */

  function buildPalette() {
    paletteEl.innerHTML = '';

    SW.TILES.forEach(function (tile) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tile-btn';
      btn.dataset.tile = tile.id;
      btn.title = tile.id;
      btn.addEventListener('click', function () {
        state.mode = 'tile';
        state.tileId = tile.id;
        syncPalette();
      });
      paletteEl.appendChild(btn);
    });

    Object.keys(SW.PIECES).forEach(function (type) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'piece-btn';
      btn.dataset.piece = type;
      btn.innerHTML =
        '<svg viewBox="0 0 20 20" aria-hidden="true">' + SW.renderPiece(type, 0, 0, 0) + '</svg>' +
        SW.PIECES[type].label;
      btn.title = SW.PIECES[type].note;
      btn.addEventListener('click', function () {
        state.mode = 'piece';
        state.pieceType = type;
        syncPalette();
      });
      piecesEl.appendChild(btn);
    });

    var erase = document.createElement('button');
    erase.type = 'button';
    erase.className = 'piece-btn';
    erase.dataset.erase = '1';
    erase.innerHTML = '<span aria-hidden="true">✕</span> Marker löschen';
    erase.addEventListener('click', function () {
      state.mode = 'erase';
      syncPalette();
    });
    piecesEl.appendChild(erase);
  }

  function syncPalette() {
    Array.prototype.forEach.call(paletteEl.children, function (btn) {
      var active = state.mode === 'tile' && btn.dataset.tile === state.tileId;
      btn.classList.toggle('is-active', active);
      btn.innerHTML = SW.renderTile(SW.tileById(btn.dataset.tile), {
        face: state.face,
        rot: active ? state.rot : 0
      });
    });

    Array.prototype.forEach.call(piecesEl.children, function (btn) {
      var active = (state.mode === 'piece' && btn.dataset.piece === state.pieceType) ||
                   (state.mode === 'erase' && btn.dataset.erase === '1');
      btn.classList.toggle('is-active', active);
    });
  }

  /* --------------------------------------------------------------- board -- */

  function buildBoard() {
    boardEl.innerHTML = '';
    for (var i = 0; i < BOARD * BOARD; i++) {
      var cell = document.createElement('div');
      cell.className = 'cell is-empty';
      cell.dataset.index = String(i);
      boardEl.appendChild(cell);
    }
  }

  function renderBoard() {
    Array.prototype.forEach.call(boardEl.children, function (el, i) {
      var rec = state.board[i];

      if (!rec) {
        el.className = 'cell is-empty';
        el.innerHTML = '';
        return;
      }

      el.className = 'cell';
      el.innerHTML =
        SW.renderTile(SW.tileById(rec.tileId), {
          face: rec.face,
          rot: rec.rot,
          pieces: rec.pieces
        }) +
        '<div class="ctrls">' +
        '<button type="button" data-act="rot" title="Drehen">⟳</button>' +
        '<button type="button" data-act="flip" title="Seite wechseln">⇅</button>' +
        '<button type="button" data-act="del" title="Platte entfernen">✕</button>' +
        '</div>';
    });

    hintEl.textContent = summary();
  }

  function summary() {
    var plates = 0;
    var markers = 0;
    var lava = 0;

    state.board.forEach(function (rec) {
      if (!rec) return;
      plates += 1;
      markers += rec.pieces.length;
      if (rec.face === 'back') lava += 1;
    });

    return plates + ' Platten · ' + markers + ' Marker · ' + lava + ' auf der Lava-Seite';
  }

  /* ------------------------------------------------------- interactions -- */

  function place(index, el, event) {
    if (state.mode === 'tile') {
      var previous = state.board[index];
      state.board[index] = {
        tileId: state.tileId,
        rot: state.rot,
        face: state.face,
        pieces: previous ? previous.pieces : []
      };
      renderBoard();
      return;
    }

    var rec = state.board[index];

    if (state.mode === 'piece') {
      if (!rec) {
        toast('Erst eine Platte legen.');
        return;
      }
      var spot = subCell(el, event, rec.rot);
      rec.pieces.push({ type: state.pieceType, x: spot[0], y: spot[1], rot: 0 });
      renderBoard();
      return;
    }

    if (state.mode === 'erase') {
      if (!rec || !rec.pieces.length) return;
      var hit = subCell(el, event, rec.rot);
      for (var i = rec.pieces.length - 1; i >= 0; i--) {
        var p = rec.pieces[i];
        if (p.x === hit[0] && p.y === hit[1]) {
          rec.pieces.splice(i, 1);
          renderBoard();
          return;
        }
      }
      toast('Dort liegt kein Marker.');
    }
  }

  function handleCtrl(index, action) {
    var rec = state.board[index];
    if (!rec) return;

    if (action === 'rot') {
      rec.rot = (rec.rot + 1) % 4;
      renderBoard();
    } else if (action === 'flip') {
      rec.face = rec.face === 'front' ? 'back' : 'front';
      renderBoard();
    } else if (action === 'del') {
      state.board[index] = null;
      renderBoard();
    }
  }

  boardEl.addEventListener('click', function (event) {
    var ctrl = event.target.closest('[data-act]');
    if (ctrl) {
      event.stopPropagation();
      handleCtrl(Number(ctrl.closest('.cell').dataset.index), ctrl.dataset.act);
      return;
    }

    var cell = event.target.closest('.cell');
    if (!cell) return;
    place(Number(cell.dataset.index), cell, event);
  });

  document.addEventListener('keydown', function (event) {
    if (event.target.matches('input, textarea')) return;

    if (event.key === 'r' || event.key === 'R') {
      state.rot = (state.rot + 1) % 4;
      syncSegments();
      syncPalette();
    } else if (event.key === 'f' || event.key === 'F') {
      state.face = state.face === 'front' ? 'back' : 'front';
      syncSegments();
      syncPalette();
    }
  });

  function syncSegments() {
    document.querySelectorAll('#face-toggle button').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.face === state.face);
    });
    document.querySelectorAll('#rot-toggle button').forEach(function (b) {
      b.classList.toggle('is-active', Number(b.dataset.rot) === state.rot);
    });
  }

  document.getElementById('face-toggle').addEventListener('click', function (event) {
    var btn = event.target.closest('button');
    if (!btn) return;
    state.face = btn.dataset.face;
    syncSegments();
    syncPalette();
  });

  document.getElementById('rot-toggle').addEventListener('click', function (event) {
    var btn = event.target.closest('button');
    if (!btn) return;
    state.rot = Number(btn.dataset.rot);
    syncSegments();
    syncPalette();
  });

  /* ------------------------------------------------------------- scenario -- */

  var fields = {
    title: document.getElementById('f-title'),
    author: document.getElementById('f-author'),
    objective: document.getElementById('f-objective'),
    rules: document.getElementById('f-rules')
  };

  Object.keys(fields).forEach(function (name) {
    fields[name].addEventListener('input', function () {
      state.meta[name] = fields[name].value;
    });
  });

  function exportScenario() {
    return {
      format: 'slickworks-scenario',
      version: 2,
      generator: 'slickworks/plate-foundry',
      title: state.meta.title.trim(),
      author: state.meta.author.trim(),
      objective: state.meta.objective.trim(),
      rules: state.meta.rules.trim(),
      board: state.board.map(function (rec) {
        if (!rec) return null;
        return {
          tileId: rec.tileId,
          rot: rec.rot,
          face: rec.face,
          pieces: rec.pieces.map(function (p) {
            return { type: p.type, x: p.x, y: p.y, rot: p.rot };
          })
        };
      })
    };
  }

  function importScenario(data) {
    if (!data || data.format !== 'slickworks-scenario' || !Array.isArray(data.board)) {
      throw new Error('Unbekanntes Format.');
    }
    if (data.board.length !== BOARD * BOARD) {
      throw new Error('Das Raster passt nicht (erwartet ' + BOARD * BOARD + ' Felder).');
    }

    state.board = data.board.map(function (rec) {
      if (!rec) return null;
      if (!SW.tileById(rec.tileId)) throw new Error('Unbekannte Platte: ' + rec.tileId);
      return {
        tileId: rec.tileId,
        rot: ((rec.rot | 0) % 4 + 4) % 4,
        face: rec.face === 'back' ? 'back' : 'front',
        pieces: (rec.pieces || []).filter(function (p) {
          return SW.PIECES[p.type];
        }).map(function (p) {
          return {
            type: p.type,
            x: Math.min(SW.GRID - 1, Math.max(0, p.x | 0)),
            y: Math.min(SW.GRID - 1, Math.max(0, p.y | 0)),
            rot: ((p.rot | 0) % 4 + 4) % 4
          };
        })
      };
    });

    state.meta.title = data.title || '';
    state.meta.author = data.author || '';
    state.meta.objective = data.objective || '';
    state.meta.rules = data.rules || '';

    Object.keys(fields).forEach(function (name) {
      fields[name].value = state.meta[name];
    });

    renderBoard();
  }

  /* --------------------------------------------------------------- buttons -- */

  document.getElementById('btn-new').addEventListener('click', function () {
    if (!confirm('Aktuelles Szenario verwerfen?')) return;
    state.board = new Array(BOARD * BOARD).fill(null);
    state.meta = { title: '', author: '', objective: '', rules: '' };
    Object.keys(fields).forEach(function (name) {
      fields[name].value = '';
    });
    renderBoard();
  });

  document.getElementById('btn-save').addEventListener('click', function () {
    var json = JSON.stringify(exportScenario(), null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (state.meta.title || 'slickworks-szenario')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  });

  document.getElementById('btn-load').addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function () {
      try {
        importScenario(JSON.parse(String(reader.result)));
        toast('Szenario geladen.');
      } catch (error) {
        toast('Laden fehlgeschlagen: ' + error.message);
      }
      fileInput.value = '';
    };
    reader.readAsText(file);
  });

  document.getElementById('btn-print').addEventListener('click', function () {
    var scenario = exportScenario();

    if (!scenario.title) { toast('Bitte einen Titel eintragen.'); return; }
    if (!scenario.board.some(Boolean)) { toast('Bitte mindestens eine Platte legen.'); return; }
    if (!scenario.objective) { toast('Bitte das Ziel beschreiben.'); return; }
    if (!scenario.rules) { toast('Bitte die Regeln ergänzen.'); return; }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
    var win = window.open('dossier.html', '_blank');
    if (!win) toast('Pop-up blockiert — bitte für diese Seite erlauben.');
  });

  /* ----------------------------------------------------------------- init -- */

  buildPalette();
  buildBoard();
  syncSegments();
  syncPalette();
  renderBoard();
})();
