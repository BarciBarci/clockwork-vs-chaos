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
    if (!ghostEl || !cell || state.mode === 'erase') {
      hideGhost();
      return;
    }

    var rect = cell.getBoundingClientRect();
    var boardRect = boardEl.getBoundingClientRect();
    var gx, gy, gw, gh;

    if (state.mode === 'tile') {
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
      var f = foot(state.pieceType);
      var spot = subCell(cell, event, rec.rot);
      var sx = Math.min(spot[0], SW.GRID - f.w);
      var sy = Math.min(spot[1], SW.GRID - f.h);
      var a = toVisual(sx, sy, rec.rot);
      var b = toVisual(sx + f.w - 1, sy + f.h - 1, rec.rot);
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
        SW.PIECES[type].label;
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
        toast('Place a tile first.');
        return;
      }
      pushPiece(rec, state.pieceType, el, event);
      renderBoard();
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

  function foot(type) {
    return SW.PIECES[type] || { w: 1, h: 1 };
  }

  function coversCell(piece, x, y) {
    var f = foot(piece.type);
    return x >= piece.x && x < piece.x + f.w && y >= piece.y && y < piece.y + f.h;
  }

  function pushPiece(rec, type, el, event) {
    var f = foot(type);
    var spot = subCell(el, event, rec.rot);
    rec.pieces.push({
      type: type,
      x: Math.min(spot[0], SW.GRID - f.w),
      y: Math.min(spot[1], SW.GRID - f.h),
      rot: 0
    });
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

  /* ---------------------------------------------------------- drag & drop -- */

  function clearDrop() {
    Array.prototype.forEach.call(boardEl.children, function (c) {
      c.classList.remove('is-drop');
    });
  }

  boardEl.addEventListener('dragstart', function (event) {
    var cell = event.target.closest('.cell');
    if (!cell || event.target.closest('[data-act]')) {
      event.preventDefault();
      return;
    }
    var index = Number(cell.dataset.index);
    if (!state.board[index]) {
      event.preventDefault();
      return;
    }
    dragState = { kind: 'move', index: index };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', 'move');
  });

  boardEl.addEventListener('dragover', function (event) {
    if (!dragState) return;
    var cell = event.target.closest('.cell');
    if (!cell) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = dragState.kind === 'move' ? 'move' : 'copy';
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
  });

  boardEl.addEventListener('mousemove', function (event) {
    if (dragState) return;
    updateGhost(event.target.closest('.cell'), event);
  });

  boardEl.addEventListener('mouseleave', hideGhost);

  function dropOn(index, el, event) {
    if (dragState.kind === 'tile') {
      var previous = state.board[index];
      state.board[index] = {
        tileId: dragState.tileId,
        rot: dragState.rot,
        face: dragState.face,
        pieces: previous ? previous.pieces : []
      };
      renderBoard();
      return;
    }

    if (dragState.kind === 'move') {
      if (dragState.index === index) return;
      var moved = state.board[dragState.index];
      if (!moved) return;
      state.board[dragState.index] = null;
      state.board[index] = moved;
      renderBoard();
      return;
    }

    var target = state.board[index];
    if (!target) {
      toast('Place a tile first.');
      return;
    }
    pushPiece(target, dragState.type, el, event);
    renderBoard();
  }

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

    state.board = data.board.map(function (rec) {
      if (!rec) return null;
      if (!SW.tileById(rec.tileId)) throw new Error('Unknown tile: ' + rec.tileId);
      return {
        tileId: rec.tileId,
        rot: ((rec.rot | 0) % 4 + 4) % 4,
        face: rec.face === 'back' ? 'back' : 'front',
        pieces: (rec.pieces || []).filter(function (p) {
          return SW.PIECES[p.type];
        }).map(function (p) {
          var f = SW.PIECES[p.type];
          return {
            type: p.type,
            x: Math.min(SW.GRID - f.w, Math.max(0, p.x | 0)),
            y: Math.min(SW.GRID - f.h, Math.max(0, p.y | 0)),
            rot: 0
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
  buildBoard();
  createGhost();
  syncSegments();
  syncPalette();
  syncMetaUI();
  renderCompass();
  renderBoard();
})();
