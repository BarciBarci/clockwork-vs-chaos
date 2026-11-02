/*
 * Clockwork vs Chaos — scenario editor.
 * Plain DOM, no framework, no dependencies.
 */
(function () {
  'use strict';

  var SW = window.PlateFoundry;
  var BOARD = 5;
  var STORAGE_KEY = 'clockwork:scenario';

  var SPECIAL_TOPICS = [
    'Bomb',
    'Boss',
    'Flame Wall/School',
    'Shards/Tokens',
    'Hazards (Spike Walls, Lava Tiles, Rune Gates)'
  ];

  var state = {
    board: new Array(BOARD * BOARD).fill(null),
    mode: 'tile',          // 'tile' | 'piece' | 'erase'
    tileId: SW.TILES[0].id,
    pieceType: 'minion-3',
    face: 'front',
    rot: 0,
    compass: 0,
    meta: {
      title: '',
      author: '',
      objective: '',
      rules: '',
      special: { on: false, text: '', topics: [] },
      other: { on: false, text: '' },
      image: ''
    }
  };

  var boardEl = document.getElementById('board');
  var paletteEl = document.getElementById('palette-tiles');
  var piecesEl = document.getElementById('palette-pieces');
  var hintEl = document.getElementById('board-hint');
  var toastEl = document.getElementById('toast');
  var fileInput = document.getElementById('file-input');
  var compassEl = document.getElementById('compass');
  var ghostEl = null;

  var toastTimer = null;
  var dragState = null;
  var lastDown = null;
  var cellEls = [];

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
    return visualToPlate(vx, vy, rot);
  }

  /* Same conversion, but null when the point sits outside the plate. */
  function pointToPlate(rect, clientX, clientY, rot) {
    var vx = Math.floor((clientX - rect.left) / rect.width * SW.GRID);
    var vy = Math.floor((clientY - rect.top) / rect.height * SW.GRID);
    if (vx < 0 || vy < 0 || vx >= SW.GRID || vy >= SW.GRID) return null;
    return visualToPlate(vx, vy, rot);
  }

  function visualToPlate(x, y, rot) {
    for (var i = 0; i < rot; i++) {
      var nx = y;
      var ny = SW.GRID - 1 - x;
      x = nx;
      y = ny;
    }
    return [x, y];
  }

  /* Plate-local cell -> visual cell (the plate rotated clockwise by rot). */
  function toVisual(x, y, rot) {
    for (var i = 0; i < rot; i++) {
      var nx = SW.GRID - 1 - y;
      var ny = x;
      x = nx;
      y = ny;
    }
    return [x, y];
  }

  /* ------------------------------------------------------------- preview -- */

  function createGhost() {
    ghostEl = document.createElement('div');
    ghostEl.className = 'ghost';
    ghostEl.hidden = true;
    boardEl.appendChild(ghostEl);
  }

  function hideGhost() {
    if (ghostEl) ghostEl.hidden = true;
  }

  function updateGhost(cell, event) {
    if (!ghostEl || !cell) {
      hideGhost();
      return;
    }

    var mode = state.mode;
    if (dragState) {
      if (dragState.kind === 'move' || dragState.kind === 'tile') mode = 'tile';
      else if (dragState.kind === 'movepiece' || dragState.kind === 'piece') mode = 'piece';
    }

    if (mode === 'erase') {
      hideGhost();
      return;
    }

    /* Pieces are placed inside the tile zoom, not on the board itself. */
    if (mode === 'piece' && (!dragState || dragState.kind === 'piece')) {
      hideGhost();
      return;
    }

    var rect = cell.getBoundingClientRect();
    var boardRect = boardEl.getBoundingClientRect();
    var gx, gy, gw, gh;

    if (mode === 'tile') {
      if (!dragState || dragState.kind === 'tile') {
        var wanted = dragState ? dragState.tileId : state.tileId;
        if (tileIndexOnBoard(wanted) >= 0) {
          hideGhost();
          return;
        }
      }
      gx = rect.left - boardRect.left;
      gy = rect.top - boardRect.top;
      gw = rect.width;
      gh = rect.height;
      ghostEl.className = 'ghost is-tile';
    } else {
      var rec = state.board[Number(cell.dataset.index)];
      if (!rec) {
        hideGhost();
        return;
      }

      var f;
      if (dragState && dragState.kind === 'movepiece') {
        var src = state.board[dragState.index];
        var moving = src && src.pieces[dragState.piece];
        if (!moving) {
          hideGhost();
          return;
        }
        f = foot(moving.type);
      } else {
        f = foot(state.pieceType);
      }

      var spot = subCell(cell, event, rec.rot);
      var at = anchorTo(spot, f);
      var a = toVisual(at[0], at[1], rec.rot);
      var b = toVisual(at[0] + f.w - 1, at[1] + f.h - 1, rec.rot);
      var ux = rect.width / SW.GRID;
      var uy = rect.height / SW.GRID;
      gx = rect.left - boardRect.left + Math.min(a[0], b[0]) * ux;
      gy = rect.top - boardRect.top + Math.min(a[1], b[1]) * uy;
      gw = (Math.abs(b[0] - a[0]) + 1) * ux;
      gh = (Math.abs(b[1] - a[1]) + 1) * uy;
      ghostEl.className = 'ghost is-piece';
    }

    ghostEl.hidden = false;
    ghostEl.style.left = gx + 'px';
    ghostEl.style.top = gy + 'px';
    ghostEl.style.width = gw + 'px';
    ghostEl.style.height = gh + 'px';
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
      btn.draggable = true;
      btn.addEventListener('dragstart', function (event) {
        if (tileIndexOnBoard(tile.id) >= 0) {
          event.preventDefault();
          return;
        }
        dragState = { kind: 'tile', tileId: tile.id, face: state.face, rot: state.rot };
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('text/plain', tile.id);
      });
      btn.addEventListener('dragend', function () {
        clearDrop();
        dragState = null;
      });
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
        '<svg viewBox="0 0 20 20" aria-hidden="true">' + SW.renderIcon(type) + '</svg>' +
        SW.PIECES[type].label +
        '<span class="piece-count" hidden></span>';
      btn.title = SW.PIECES[type].note;
      btn.draggable = true;
      btn.addEventListener('dragstart', function (event) {
        dragState = { kind: 'piece', type: type };
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('text/plain', type);
      });
      btn.addEventListener('dragend', function () {
        clearDrop();
        dragState = null;
      });
      btn.addEventListener('click', function () {
        if (pieceLeft(type) <= 0) {
          toast(spentLabel(type));
          return;
        }
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
    erase.innerHTML = '<span aria-hidden="true">✕</span> Delete piece';
    erase.addEventListener('click', function () {
      state.mode = 'erase';
      syncPalette();
    });
    piecesEl.appendChild(erase);
  }

  function syncPalette() {
    Array.prototype.forEach.call(paletteEl.children, function (btn) {
      var id = btn.dataset.tile;
      var active = state.mode === 'tile' && id === state.tileId;
      var used = tileIndexOnBoard(id) >= 0;
      btn.classList.toggle('is-active', active && !used);
      btn.classList.toggle('is-used', used);
      btn.draggable = !used;
      btn.title = used ? id + ' — already on the board' : id;
      btn.innerHTML = SW.renderTile(SW.tileById(id), {
        face: state.face,
        rot: active ? state.rot : 0
      });
    });

    Array.prototype.forEach.call(piecesEl.children, function (btn) {
      var active = (state.mode === 'piece' && btn.dataset.piece === state.pieceType) ||
                   (state.mode === 'erase' && btn.dataset.erase === '1');
      btn.classList.toggle('is-active', active);
      if (btn.dataset.piece) syncPieceButton(btn, btn.dataset.piece);
    });
  }

  /* --------------------------------------------------------------- board -- */

  function buildBoard() {
    boardEl.innerHTML = '';
    cellEls = [];
    for (var i = 0; i < BOARD * BOARD; i++) {
      var cell = document.createElement('div');
      cell.className = 'cell is-empty';
      cell.dataset.index = String(i);
      boardEl.appendChild(cell);
      cellEls.push(cell);
    }
  }

  function renderBoard() {
    cellEls.forEach(function (el, i) {
      var rec = state.board[i];

      if (!rec) {
        el.className = 'cell is-empty';
        el.draggable = false;
        el.innerHTML = '';
        return;
      }

      el.className = 'cell';
      el.draggable = true;
      el.innerHTML =
        SW.renderTile(SW.tileById(rec.tileId), {
          face: rec.face,
          rot: rec.rot,
          pieces: rec.pieces
        }) +
        '<div class="ctrls">' +
        '<button type="button" data-act="rot" title="Rotate">⟳</button>' +
        '<button type="button" data-act="flip" title="Flip side">⇅</button>' +
        '<button type="button" data-act="del" title="Remove tile">✕</button>' +
        '</div>';
    });

    hintEl.textContent = summary();
    syncPalette();
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

    return plates + ' Tiles · ' + markers + ' Pieces · ' + lava + ' on Back';
  }

  /* ------------------------------------------------------- interactions -- */

  function place(index, el, event) {
    if (state.mode === 'tile') {
      if (tileIndexOnBoard(state.tileId) >= 0) {
        toast(state.tileId + ' is already on the board.');
        return;
      }
      if (state.board[index]) {
        toast('That field already holds a tile.');
        return;
      }
      state.board[index] = {
        tileId: state.tileId,
        rot: state.rot,
        face: state.face,
        pieces: []
      };
      renderBoard();
      return;
    }

    var rec = state.board[index];

    if (state.mode === 'piece') {
      if (!rec) {
        toast('Place a tile first.');
        return;
      }
      toast('Double-click the tile to place pieces.');
      return;
    }

    if (state.mode === 'erase') {
      if (!rec || !rec.pieces.length) return;
      var hit = subCell(el, event, rec.rot);
      for (var i = rec.pieces.length - 1; i >= 0; i--) {
        if (coversCell(rec.pieces[i], hit[0], hit[1])) {
          rec.pieces.splice(i, 1);
          renderBoard();
          return;
        }
      }
      toast('No piece there.');
    }
  }

  /* Footprint of a piece. A quarter turn swaps width and height, which is what
     turns a 3 × 6 panel into a 6 × 3 one. */
  function foot(type, rot) {
    var def = SW.PIECES[type] || { w: 1, h: 1 };
    return ((rot | 0) % 2)
      ? { w: def.h, h: def.w }
      : { w: def.w, h: def.h };
  }

  /* Each of the five tiles is a single physical piece. */
  function tileIndexOnBoard(id) {
    for (var i = 0; i < state.board.length; i++) {
      if (state.board[i] && state.board[i].tileId === id) return i;
    }
    return -1;
  }

  /* Piece stock: the box holds one of most components, four gear rings. */
  function pieceLimit(type) {
    var def = SW.PIECES[type];
    return def && def.max > 0 ? def.max : 1;
  }

  function pieceUsed(type) {
    var n = 0;
    state.board.forEach(function (rec) {
      if (!rec) return;
      rec.pieces.forEach(function (p) {
        if (p.type === type) n += 1;
      });
    });
    return n;
  }

  function pieceLeft(type) {
    return Math.max(0, pieceLimit(type) - pieceUsed(type));
  }

  function spentLabel(type) {
    var limit = pieceLimit(type);
    var name = SW.PIECES[type].label;
    return limit > 1
      ? 'All ' + limit + ' ' + name + ' pieces are on the board.'
      : name + ' is already on the board.';
  }

  /* Mirror the stock on one palette button: dimmed and check-marked once the
     last copy is placed, with a counter while copies remain. */
  function syncPieceButton(btn, type) {
    var limit = pieceLimit(type);
    var left = pieceLeft(type);

    btn.classList.toggle('is-used', left === 0);

    var badge = btn.querySelector('.piece-count');
    if (!badge) return;

    badge.hidden = limit <= 1 || left === 0;
    badge.textContent = String(left);
  }

  /* Centre a footprint on the cell under the cursor, clamped to the plate. */
  function anchorTo(spot, f) {
    var x = spot[0] - Math.floor((f.w - 1) / 2);
    var y = spot[1] - Math.floor((f.h - 1) / 2);
    return [
      Math.max(0, Math.min(SW.GRID - f.w, x)),
      Math.max(0, Math.min(SW.GRID - f.h, y))
    ];
  }

  function coversCell(piece, x, y) {
    var f = foot(piece.type, piece.rot);
    return x >= piece.x && x < piece.x + f.w && y >= piece.y && y < piece.y + f.h;
  }

  function pieceAt(rec, x, y) {
    for (var i = rec.pieces.length - 1; i >= 0; i--) {
      if (coversCell(rec.pieces[i], x, y)) return i;
    }
    return -1;
  }

  function pushPiece(rec, type, el, event, rot) {
    var r = ((rot | 0) % 4 + 4) % 4;
    var f = foot(type, r);
    var spot = subCell(el, event, rec.rot);
    var at = anchorTo(spot, f);
    rec.pieces.push({ type: type, x: at[0], y: at[1], rot: r });
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

  /* Double-click opens the magnified editor for that plate. */
  boardEl.addEventListener('dblclick', function (event) {
    if (event.target.closest('[data-act]')) return;
    var cell = event.target.closest('.cell');
    if (!cell) return;

    var index = Number(cell.dataset.index);
    if (!state.board[index]) {
      toast('Place a tile first.');
      return;
    }
    openZoom(index);
  });

  /* ---------------------------------------------------------- drag & drop -- */

  function clearDrop() {
    cellEls.forEach(function (c) {
      c.classList.remove('is-drop');
    });
  }

  boardEl.addEventListener('mousedown', function (event) {
    lastDown = null;
    if (event.button !== 0) return;
    var cell = event.target.closest('.cell');
    if (!cell || event.target.closest('[data-act]')) return;
    var index = Number(cell.dataset.index);
    var rec = state.board[index];
    if (!rec || !rec.pieces.length) return;
    var hit = subCell(cell, event, rec.rot);
    var at = pieceAt(rec, hit[0], hit[1]);
    if (at >= 0) lastDown = { index: index, piece: at };
  });

  boardEl.addEventListener('dragstart', function (event) {
    var cell = event.target.closest('.cell');
    if (!cell || event.target.closest('[data-act]')) {
      event.preventDefault();
      return;
    }
    var index = Number(cell.dataset.index);
    var rec = state.board[index];
    if (!rec) {
      event.preventDefault();
      return;
    }
    if (lastDown && lastDown.index === index && rec.pieces[lastDown.piece]) {
      dragState = { kind: 'movepiece', index: index, piece: lastDown.piece };
    } else {
      dragState = { kind: 'move', index: index };
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', 'move');
  });

  boardEl.addEventListener('dragover', function (event) {
    if (!dragState) return;
    var cell = event.target.closest('.cell');
    if (!cell) return;
    event.preventDefault();
    event.dataTransfer.dropEffect =
      (dragState.kind === 'tile' || dragState.kind === 'piece') ? 'copy' : 'move';
    if (!cell.classList.contains('is-drop')) {
      clearDrop();
      cell.classList.add('is-drop');
    }
    updateGhost(cell, event);
  });

  boardEl.addEventListener('dragleave', function (event) {
    var cell = event.target.closest('.cell');
    if (cell) cell.classList.remove('is-drop');
  });

  boardEl.addEventListener('drop', function (event) {
    if (!dragState) return;
    var cell = event.target.closest('.cell');
    if (!cell) return;
    event.preventDefault();
    dropOn(Number(cell.dataset.index), cell, event);
    clearDrop();
    hideGhost();
    dragState = null;
    lastDown = null;
  });

  boardEl.addEventListener('mousemove', function (event) {
    if (dragState) return;
    updateGhost(event.target.closest('.cell'), event);
  });

  boardEl.addEventListener('mouseleave', hideGhost);

  function dropOn(index, el, event) {
    if (dragState.kind === 'tile') {
      if (tileIndexOnBoard(dragState.tileId) >= 0) {
        toast(dragState.tileId + ' is already on the board.');
        return;
      }
      if (state.board[index]) {
        toast('That field already holds a tile.');
        return;
      }
      state.board[index] = {
        tileId: dragState.tileId,
        rot: dragState.rot,
        face: dragState.face,
        pieces: []
      };
      renderBoard();
      return;
    }

    if (dragState.kind === 'move') {
      if (dragState.index === index) return;
      var from = dragState.index;
      var moved = state.board[from];
      if (!moved) return;
      /* Swap rather than overwrite, so neither tile loses its pieces. */
      state.board[from] = state.board[index];
      state.board[index] = moved;
      renderBoard();
      return;
    }

    if (dragState.kind === 'movepiece') {
      var from = state.board[dragState.index];
      var piece = from && from.pieces[dragState.piece];
      if (!piece) return;
      var dest = state.board[index];
      if (!dest) {
        toast('Drop a piece on a tile.');
        return;
      }
      from.pieces.splice(dragState.piece, 1);
      pushPiece(dest, piece.type, el, event, piece.rot);
      renderBoard();
      return;
    }

    var target = state.board[index];
    if (!target) {
      toast('Place a tile first.');
      return;
    }
    toast('Double-click the tile to place pieces.');
  }

  /* ------------------------------------------------------------ tile zoom -- */

  /* A placed tile opens in a magnified editor. Pieces are picked, placed and
     positioned there, where the 6 × 6 sub-grid is large enough to aim at. */

  var zoomEl = document.getElementById('zoom');
  var zoomPlate = document.getElementById('zoom-plate');
  var zoomPieces = document.getElementById('zoom-pieces');
  var zoomTitle = document.getElementById('zoom-title');
  var zoomStatus = document.getElementById('zoom-status');

  var zoomLayer = null;
  var zoomGhost = null;
  var zoomSel = null;
  var zoomRaf = 0;
  var zoomReturnFocus = null;

  var zoom = {
    index: -1,
    tool: null,
    erase: false,
    grab: null,
    sel: -1
  };

  function buildZoom() {
    zoomLayer = document.createElement('div');
    zoomLayer.className = 'zoom-layer';

    var grid = document.createElement('div');
    grid.className = 'zoom-grid';

    zoomGhost = document.createElement('div');
    zoomGhost.className = 'zoom-ghost';
    zoomGhost.hidden = true;

    zoomSel = document.createElement('div');
    zoomSel.className = 'zoom-sel';
    zoomSel.hidden = true;

    zoomPlate.appendChild(zoomLayer);
    zoomPlate.appendChild(grid);
    zoomPlate.appendChild(zoomGhost);
    zoomPlate.appendChild(zoomSel);

    zoomPieces.innerHTML = '';

    var move = document.createElement('button');
    move.type = 'button';
    move.className = 'piece-btn';
    move.dataset.zoomMove = '1';
    move.innerHTML = '<span aria-hidden="true">✥</span> Move';
    move.title = 'Drag a placed piece to reposition it';
    zoomPieces.appendChild(move);

    Object.keys(SW.PIECES).forEach(function (type) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'piece-btn';
      btn.dataset.zoomPiece = type;
      btn.innerHTML =
        '<svg viewBox="0 0 20 20" aria-hidden="true">' + SW.renderIcon(type) + '</svg>' +
        SW.PIECES[type].label +
        '<span class="piece-count" hidden></span>';
      btn.title = SW.PIECES[type].note;
      zoomPieces.appendChild(btn);
    });

    var erase = document.createElement('button');
    erase.type = 'button';
    erase.className = 'piece-btn';
    erase.dataset.zoomErase = '1';
    erase.innerHTML = '<span aria-hidden="true">✕</span> Remove piece';
    zoomPieces.appendChild(erase);
  }

  function openZoom(index) {
    var rec = state.board[index];
    if (!rec) return;

    zoom.index = index;
    zoom.grab = null;
    zoom.sel = -1;

    if (state.mode === 'piece' && pieceLeft(state.pieceType) > 0) {
      zoom.tool = state.pieceType;
      zoom.erase = false;
    } else if (state.mode === 'erase') {
      zoom.erase = true;
      zoom.tool = null;
    }

    zoomReturnFocus = document.activeElement;
    zoomEl.hidden = false;
    toastEl.classList.remove('is-visible');

    syncZoomPieces();
    renderZoom();

    var done = zoomEl.querySelector('.zoom-actions [data-zoom-close]');
    if (done) done.focus();
  }

  function closeZoom() {
    if (zoom.index < 0) return;
    zoom.index = -1;
    zoom.grab = null;
    zoom.sel = -1;
    hideZoomGhost();
    zoomEl.hidden = true;

    if (zoomReturnFocus && typeof zoomReturnFocus.focus === 'function') {
      zoomReturnFocus.focus();
    }
    zoomReturnFocus = null;
  }

  function renderZoom() {
    if (zoom.index < 0) return;

    var rec = state.board[zoom.index];
    if (!rec) {
      closeZoom();
      renderBoard();
      return;
    }

    var tile = SW.tileById(rec.tileId);

    zoomLayer.innerHTML = SW.renderTile(tile, {
      face: rec.face,
      rot: rec.rot,
      pieces: rec.pieces
    });

    zoomTitle.textContent = tile.id + ' · ' +
      (rec.face === 'back' ? 'Back' : 'Front') + ' · ' + (rec.rot * 90) + '°';

    zoomStatus.textContent = rec.pieces.length === 1
      ? '1 piece on this tile'
      : rec.pieces.length + ' pieces on this tile';

    syncZoomPieces();
    showZoomSelection(rec);
  }

  /* Outline around the piece the rotate button acts on. */
  function showZoomSelection(rec) {
    if (!zoomSel) return;

    var piece = rec.pieces[zoom.sel];
    if (!piece) {
      zoomSel.hidden = true;
      return;
    }

    var f = foot(piece.type, piece.rot);
    var a = toVisual(piece.x, piece.y, rec.rot);
    var b = toVisual(piece.x + f.w - 1, piece.y + f.h - 1, rec.rot);
    var u = 100 / SW.GRID;

    zoomSel.style.left = Math.min(a[0], b[0]) * u + '%';
    zoomSel.style.top = Math.min(a[1], b[1]) * u + '%';
    zoomSel.style.width = (Math.abs(b[0] - a[0]) + 1) * u + '%';
    zoomSel.style.height = (Math.abs(b[1] - a[1]) + 1) * u + '%';
    zoomSel.hidden = false;
  }

  /* Turn the selected piece in place; the plate stays where it is. */
  function rotateSelected() {
    var rec = state.board[zoom.index];
    if (!rec) return;

    var piece = rec.pieces[zoom.sel];
    if (!piece) {
      toast('Click a piece first, then rotate it.');
      return;
    }

    piece.rot = ((piece.rot | 0) + 1) % 4;

    var f = foot(piece.type, piece.rot);
    piece.x = Math.max(0, Math.min(SW.GRID - f.w, piece.x));
    piece.y = Math.max(0, Math.min(SW.GRID - f.h, piece.y));

    commitZoom();
  }

  /* Board and zoom share the same record, so both stay in step. Rendering is
     synchronous here; only pointer drags are throttled to a frame. */
  function commitZoom() {
    renderZoom();
    renderBoard();
  }

  function scheduleZoom() {
    if (zoomRaf) return;
    zoomRaf = requestAnimationFrame(function () {
      zoomRaf = 0;
      renderZoom();
    });
  }

  function syncZoomPieces() {
    Array.prototype.forEach.call(zoomPieces.children, function (btn) {
      var on = zoom.erase
        ? btn.dataset.zoomErase === '1'
        : zoom.tool
          ? btn.dataset.zoomPiece === zoom.tool
          : btn.dataset.zoomMove === '1';
      btn.classList.toggle('is-active', on);
      if (btn.dataset.zoomPiece) syncPieceButton(btn, btn.dataset.zoomPiece);
    });
  }

  function showZoomGhost(at, f, rot) {
    var a = toVisual(at[0], at[1], rot);
    var b = toVisual(at[0] + f.w - 1, at[1] + f.h - 1, rot);
    var u = 100 / SW.GRID;

    zoomGhost.style.left = Math.min(a[0], b[0]) * u + '%';
    zoomGhost.style.top = Math.min(a[1], b[1]) * u + '%';
    zoomGhost.style.width = (Math.abs(b[0] - a[0]) + 1) * u + '%';
    zoomGhost.style.height = (Math.abs(b[1] - a[1]) + 1) * u + '%';
    zoomGhost.hidden = false;
  }

  function hideZoomGhost() {
    if (zoomGhost) zoomGhost.hidden = true;
  }

  function zoomCellAt(event) {
    var rec = state.board[zoom.index];
    if (!rec) return null;
    return pointToPlate(zoomPlate.getBoundingClientRect(), event.clientX, event.clientY, rec.rot);
  }

  zoomEl.addEventListener('click', function (event) {
    if (event.target.closest('[data-zoom-close]')) {
      closeZoom();
      return;
    }

    var act = event.target.closest('[data-zoom-act]');
    if (!act) return;

    if (act.dataset.zoomAct === 'rot') {
      rotateSelected();
      return;
    }

    var rec = state.board[zoom.index];
    if (!rec) return;

    if (act.dataset.zoomAct === 'flip') {
      rec.face = rec.face === 'front' ? 'back' : 'front';
      renderZoom();
      renderBoard();
    }
  });

  zoomPieces.addEventListener('click', function (event) {
    var btn = event.target.closest('button');
    if (!btn) return;

    if (btn.dataset.zoomErase === '1') {
      zoom.erase = true;
      zoom.tool = null;
    } else if (btn.dataset.zoomMove === '1') {
      zoom.erase = false;
      zoom.tool = null;
    } else if (btn.dataset.zoomPiece) {
      var type = btn.dataset.zoomPiece;
      if (pieceLeft(type) <= 0) {
        toast(spentLabel(type));
        return;
      }
      zoom.erase = false;
      zoom.tool = type;
    } else {
      return;
    }

    syncZoomPieces();
    hideZoomGhost();
  });

  zoomPlate.addEventListener('mousedown', function (event) {
    if (event.button !== 0) return;

    var rec = state.board[zoom.index];
    if (!rec) return;

    var hit = zoomCellAt(event);
    if (!hit) return;
    event.preventDefault();

    var at = pieceAt(rec, hit[0], hit[1]);

    if (zoom.erase) {
      if (at < 0) {
        toast('No piece there.');
        return;
      }
      rec.pieces.splice(at, 1);
      if (zoom.sel === at) zoom.sel = -1;
      else if (zoom.sel > at) zoom.sel -= 1;
      commitZoom();
      return;
    }

    /* A stamp places even on top of another piece — panels are often the
       surface a mech stands on, so overlap has to stay possible. */
    if (zoom.tool) {
      if (pieceLeft(zoom.tool) <= 0) {
        toast(spentLabel(zoom.tool));
        zoom.tool = null;
        syncZoomPieces();
        return;
      }

      var f = foot(zoom.tool);
      var spot = anchorTo(hit, f);
      var fresh = { type: zoom.tool, x: spot[0], y: spot[1], rot: 0 };
      rec.pieces.push(fresh);
      zoom.sel = rec.pieces.length - 1;
      /* Keep hold of it, so one gesture can place and position. */
      zoom.grab = { piece: fresh, dx: hit[0] - fresh.x, dy: hit[1] - fresh.y };
      zoom.erase = false;

      /* The last copy is spent, so the stamp has nothing left to place: hand
         the tool back to Move. Pieces with copies left stay armed. */
      if (pieceLeft(zoom.tool) <= 0) zoom.tool = null;
      hideZoomGhost();

      commitZoom();
      return;
    }

    /* Move tool: grabbing a piece keeps the offset, so it never jumps. */
    if (at >= 0) {
      var held = rec.pieces[at];
      zoom.sel = at;
      zoom.grab = { piece: held, dx: hit[0] - held.x, dy: hit[1] - held.y };
      hideZoomGhost();
      showZoomSelection(rec);
    }
  });

  zoomPlate.addEventListener('mousemove', function (event) {
    if (zoom.grab) return;

    if (zoom.erase || !zoom.tool) {
      hideZoomGhost();
      return;
    }

    var rec = state.board[zoom.index];
    if (!rec) return;

    var hit = zoomCellAt(event);
    if (!hit) {
      hideZoomGhost();
      return;
    }

    var f = foot(zoom.tool);
    showZoomGhost(anchorTo(hit, f), f, rec.rot);
  });

  zoomPlate.addEventListener('mouseleave', hideZoomGhost);

  window.addEventListener('mousemove', function (event) {
    if (!zoom.grab) return;

    var rec = state.board[zoom.index];
    if (!rec) return;

    var hit = zoomCellAt(event);
    if (!hit) return;

    var piece = zoom.grab.piece;
    var f = foot(piece.type, piece.rot);

    piece.x = Math.max(0, Math.min(SW.GRID - f.w, hit[0] - zoom.grab.dx));
    piece.y = Math.max(0, Math.min(SW.GRID - f.h, hit[1] - zoom.grab.dy));

    scheduleZoom();
  });

  window.addEventListener('mouseup', function () {
    if (!zoom.grab) return;
    zoom.grab = null;
    renderZoom();
    renderBoard();
  });

  /* -------------------------------------------------------------- compass -- */

  /* Square stone rose with four coloured needles, as in the original tool:
     north red, east green, south orange, west blue. */
  function compassSVG(step) {
    var deg = (step % 4) * 90;
    return '<svg viewBox="0 0 80 80" aria-hidden="true">' +
      '<rect x="3" y="3" width="74" height="74" rx="7" fill="#828990"' +
      ' stroke="#242830" stroke-width="2.4"/>' +
      '<rect x="9" y="9" width="62" height="62" rx="4" fill="#9ba2aa"' +
      ' stroke="#4d535b" stroke-width="1.3"/>' +
      '<g transform="rotate(' + deg + ' 40 40)" stroke="#242830" stroke-width="0.9"' +
      ' stroke-linejoin="round">' +
        '<polygon points="40,13 48,40 40,34 32,40" fill="#cf2b2b"/>' +
        '<polygon points="67,40 40,48 46,40 40,32" fill="#2fae4a"/>' +
        '<polygon points="40,67 48,40 40,46 32,40" fill="#e8961e"/>' +
        '<polygon points="13,40 40,48 34,40 40,32" fill="#2f6fd0"/>' +
      '</g>' +
      '<rect x="35.5" y="35.5" width="9" height="9" rx="1.8" fill="#2b2f36"' +
      ' stroke="#dfe4ea" stroke-width="1"/>' +
      '</svg>';
  }

  function renderCompass() {
    compassEl.innerHTML = compassSVG(state.compass);
    compassEl.title = 'Compass ' + state.compass * 90 + '° — click to rotate';
  }

  compassEl.addEventListener('click', function () {
    state.compass = (state.compass + 1) % 4;
    renderCompass();
  });

  document.addEventListener('keydown', function (event) {
    if (event.target && event.target.matches && event.target.matches('input, textarea')) return;

    /* Inside the tile zoom R and F act on the open plate, not the palette. */
    if (zoom.index >= 0) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeZoom();
        return;
      }

      var open = state.board[zoom.index];
      if (!open) return;

      if (event.key === 'r' || event.key === 'R') {
        rotateSelected();
        return;
      }

      if (event.key === 'f' || event.key === 'F') {
        open.face = open.face === 'front' ? 'back' : 'front';
        renderZoom();
        renderBoard();
        return;
      }

      return;
    }

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

  /* -------------------------------------------------- special / other -- */

  var specialOn = document.getElementById('f-special-on');
  var specialBox = document.getElementById('special-box');
  var specialText = document.getElementById('f-special');
  var otherOn = document.getElementById('f-other-on');
  var otherBox = document.getElementById('other-box');
  var otherText = document.getElementById('f-other');
  var topicsEl = document.getElementById('special-topics');

  SPECIAL_TOPICS.forEach(function (topic) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.topic = topic;
    chip.textContent = topic.split(' (')[0];
    chip.title = topic;
    chip.addEventListener('click', function () {
      var list = state.meta.special.topics;
      var at = list.indexOf(topic);
      if (at >= 0) list.splice(at, 1);
      else list.push(topic);
      syncTopics();
    });
    topicsEl.appendChild(chip);
  });

  function syncTopics() {
    Array.prototype.forEach.call(topicsEl.children, function (chip) {
      chip.classList.toggle('is-on', state.meta.special.topics.indexOf(chip.dataset.topic) >= 0);
    });
  }

  specialOn.addEventListener('change', function () {
    state.meta.special.on = specialOn.checked;
    specialBox.hidden = !specialOn.checked;
  });

  specialText.addEventListener('input', function () {
    state.meta.special.text = specialText.value;
  });

  otherOn.addEventListener('change', function () {
    state.meta.other.on = otherOn.checked;
    otherBox.hidden = !otherOn.checked;
  });

  otherText.addEventListener('input', function () {
    state.meta.other.text = otherText.value;
  });

  /* ------------------------------------------------------------ picture -- */

  var imageInput = document.getElementById('f-image');
  var imageBtn = document.getElementById('btn-image');
  var imageClear = document.getElementById('btn-image-clear');
  var imagePreview = document.getElementById('image-preview');

  imageBtn.addEventListener('click', function () { imageInput.click(); });

  imageInput.addEventListener('change', function () {
    var file = imageInput.files && imageInput.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, 1600 / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        state.meta.image = canvas.toDataURL('image/jpeg', 0.82);
        syncImage();
        toast('Picture added.');
      };
      img.onerror = function () { toast('That file is not an image.'); };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    imageInput.value = '';
  });

  imageClear.addEventListener('click', function () {
    state.meta.image = '';
    syncImage();
  });

  function syncImage() {
    if (state.meta.image) {
      imagePreview.src = state.meta.image;
      imagePreview.hidden = false;
      imageClear.hidden = false;
      imageBtn.textContent = 'Change image';
    } else {
      imagePreview.removeAttribute('src');
      imagePreview.hidden = true;
      imageClear.hidden = true;
      imageBtn.textContent = 'Choose image';
    }
  }

  function syncMetaUI() {
    Object.keys(fields).forEach(function (name) {
      fields[name].value = state.meta[name];
    });
    specialOn.checked = state.meta.special.on;
    specialBox.hidden = !state.meta.special.on;
    specialText.value = state.meta.special.text;
    otherOn.checked = state.meta.other.on;
    otherBox.hidden = !state.meta.other.on;
    otherText.value = state.meta.other.text;
    syncTopics();
    syncImage();
  }

  function exportScenario() {
    return {
      format: 'clockwork-scenario',
      version: 3,
      generator: 'clockwork/plate-foundry',
      title: state.meta.title.trim(),
      author: state.meta.author.trim(),
      objective: state.meta.objective.trim(),
      rules: state.meta.rules.trim(),
      special: {
        on: state.meta.special.on,
        text: state.meta.special.text.trim(),
        topics: state.meta.special.topics.slice()
      },
      other: {
        on: state.meta.other.on,
        text: state.meta.other.text.trim()
      },
      image: state.meta.image || '',
      compass: state.compass,
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
    if (!data || (data.format !== 'clockwork-scenario' && data.format !== 'slickworks-scenario') || !Array.isArray(data.board)) {
      throw new Error('Unknown format.');
    }
    if (data.board.length !== BOARD * BOARD) {
      throw new Error('Grid mismatch (expected ' + BOARD * BOARD + ' fields).');
    }

    var seenTiles = {};
    state.board = data.board.map(function (rec) {
      if (!rec) return null;
      if (!SW.tileById(rec.tileId)) throw new Error('Unknown tile: ' + rec.tileId);
      if (seenTiles[rec.tileId]) return null;
      seenTiles[rec.tileId] = true;
      return {
        tileId: rec.tileId,
        rot: ((rec.rot | 0) % 4 + 4) % 4,
        face: rec.face === 'back' ? 'back' : 'front',
        pieces: (rec.pieces || []).filter(function (p) {
          return SW.PIECES[p.type];
        }).map(function (p) {
          var f = SW.PIECES[p.type];
          var r = ((p.rot | 0) % 4 + 4) % 4;
          var fw = (r % 2) ? f.h : f.w;
          var fh = (r % 2) ? f.w : f.h;
          return {
            type: p.type,
            x: Math.min(SW.GRID - fw, Math.max(0, p.x | 0)),
            y: Math.min(SW.GRID - fh, Math.max(0, p.y | 0)),
            rot: r
          };
        })
      };
    });

    state.meta.title = data.title || '';
    state.meta.author = data.author || '';
    state.meta.objective = data.objective || '';
    state.meta.rules = data.rules || '';

    var special = data.special || {};
    state.meta.special = {
      on: !!special.on,
      text: special.text || '',
      topics: Array.isArray(special.topics) ? special.topics.filter(function (t) {
        return SPECIAL_TOPICS.indexOf(t) >= 0;
      }) : []
    };

    var other = data.other || {};
    state.meta.other = { on: !!other.on, text: other.text || '' };

    state.meta.image = (typeof data.image === 'string' && data.image.indexOf('data:image/') === 0)
      ? data.image : '';

    state.compass = ((data.compass | 0) % 4 + 4) % 4;
    renderCompass();
    syncMetaUI();

    renderBoard();
  }

  /* --------------------------------------------------------------- buttons -- */

  document.getElementById('btn-new').addEventListener('click', function () {
    if (!confirm('Discard the current scenario?')) return;
    state.board = new Array(BOARD * BOARD).fill(null);
    state.meta = {
      title: '',
      author: '',
      objective: '',
      rules: '',
      special: { on: false, text: '', topics: [] },
      other: { on: false, text: '' },
      image: ''
    };
    syncMetaUI();
    renderBoard();
  });

  document.getElementById('btn-save').addEventListener('click', function () {
    var json = JSON.stringify(exportScenario(), null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (state.meta.title || 'clockwork-scenario')
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
        toast('Scenario loaded.');
      } catch (error) {
        toast('Load failed: ' + error.message);
      }
      fileInput.value = '';
    };
    reader.readAsText(file);
  });

  document.getElementById('btn-print').addEventListener('click', function () {
    var scenario = exportScenario();

    if (!scenario.title) { toast('Please enter a title.'); return; }
    if (!scenario.board.some(Boolean)) { toast('Place at least one tile.'); return; }
    if (!scenario.objective) { toast('Please describe the objective.'); return; }
    if (!scenario.rules) { toast('Please add the rules.'); return; }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
    var win = window.open('dossier.html', '_blank');
    if (!win) toast('Pop-up blocked — please allow it for this page.');
  });

  /* ----------------------------------------------------------------- init -- */

  buildPalette();
  buildZoom();
  buildBoard();
  createGhost();
  syncSegments();
  syncPalette();
  syncMetaUI();
  renderCompass();
  renderBoard();
})();
