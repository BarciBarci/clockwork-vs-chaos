/*
 * Clockwork vs Chaos — dossier renderer.
 *
 * Builds the pages from the scenario handed over by the editor, then packs the
 * blocks into as many sheets as they need. Every sheet gets its own running
 * head and footer, so page numbers stay correct without relying on CSS page
 * counters, which Chrome does not implement outside @page margin boxes.
 */
(function () {
  'use strict';

  var SW = window.PlateFoundry;
  var BOARD = 5;
  var root = document.getElementById('pages');

  var COLUMNS = ['A', 'B', 'C', 'D', 'E'];
  var ROWS = ['1', '2', '3', '4', '5'];

  function esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function splitParagraphs(text) {
    return String(text || '')
      .split(/\n{2,}/)
      .map(function (block) { return block.trim(); })
      .filter(Boolean);
  }

  function paraHtml(block) {
    return '<p class="para">' + esc(block).replace(/\n/g, '<br>') + '</p>';
  }

  function paragraphs(text) {
    return splitParagraphs(text).map(paraHtml).join('');
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function empty(message) {
    root.innerHTML = '<div class="notice">' + esc(message) + '</div>';
  }

  var raw = null;
  try {
    raw = localStorage.getItem('clockwork:scenario') ||
      localStorage.getItem('slickworks:scenario');
  } catch (error) {
    empty('This browser does not allow access to localStorage.');
    return;
  }

  if (!raw) {
    empty('No scenario found. Export one from the editor via "Print dossier" first.');
    return;
  }

  var scenario;
  try {
    scenario = JSON.parse(raw);
  } catch (error) {
    empty('The stored record is corrupted.');
    return;
  }

  if (scenario.format !== 'clockwork-scenario' && scenario.format !== 'slickworks-scenario') {
    empty('The stored record does not belong to Clockwork vs Chaos.');
    return;
  }

  /* ----------------------------------------------------------- board map -- */

  var boardHtml = scenario.board.map(function (rec) {
    if (!rec) return '<div class="slot empty"></div>';
    var tile = SW.tileById(rec.tileId);
    if (!tile) return '<div class="slot empty"></div>';
    return '<div class="slot">' +
      SW.renderTile(tile, { face: rec.face, rot: rec.rot, pieces: rec.pieces }) +
      '</div>';
  }).join('');

  var colHead = '<div class="fig-cols">' + COLUMNS.map(function (c) {
    return '<span>' + c + '</span>';
  }).join('') + '</div>';

  var rowHead = '<div class="fig-rows">' + ROWS.map(function (r) {
    return '<span>' + r + '</span>';
  }).join('') + '</div>';

  /* ------------------------------------------------------------- legend -- */

  var seen = {};
  var legend = [];
  scenario.board.forEach(function (rec) {
    if (!rec) return;
    var key = rec.tileId + ':' + rec.face;
    if (seen[key]) return;
    seen[key] = true;
    legend.push(rec);
  });

  var legendHtml = legend.map(function (rec) {
    var tile = SW.tileById(rec.tileId);
    var counts = {};
    var order = [];

    rec.pieces.forEach(function (piece) {
      if (!counts[piece.type]) {
        counts[piece.type] = 0;
        order.push(piece.type);
      }
      counts[piece.type] += 1;
    });

    var list = order.map(function (type) {
      var def = SW.PIECES[type];
      var label = def ? def.label : type;
      return counts[type] > 1 ? label + ' × ' + counts[type] : label;
    }).join(' · ');

    return '<li class="tile-card">' +
      '<div class="art">' +
      SW.renderTile(tile, { face: rec.face, rot: 0 }) +
      '</div>' +
      '<div class="tile-meta">' +
      '<strong>' + esc(tile.id) + '</strong>' +
      '<span>' + (rec.face === 'back' ? 'Back' : 'Front') + '</span>' +
      '<span class="tile-pieces">' + (list || 'no pieces') + '</span>' +
      '</div>' +
      '</li>';
  }).join('');

  var plateCount = scenario.board.filter(Boolean).length;
  var markerCount = scenario.board.reduce(function (sum, rec) {
    return sum + (rec ? rec.pieces.length : 0);
  }, 0);
  var compassStep = ((scenario.compass | 0) % 4 + 4) % 4;
  var compassDeg = compassStep * 90;

  var title = (scenario.title || 'Untitled').trim();

  /* -------------------------------------------------------------- blocks -- */

  var blocks = [];

  function pushHeading(text, tag) {
    tag = tag || 'h2';
    blocks.push({
      html: '<' + tag + '>' + esc(text) + '</' + tag + '>',
      kind: 'heading'
    });
  }

  function pushBlock(html, kind) {
    blocks.push({ html: html, kind: kind || 'body' });
  }

  /* One block per paragraph, so a long text can break between sheets. */
  function pushParagraphs(text) {
    var parts = splitParagraphs(text);
    if (!parts.length) {
      pushBlock('<p class="para muted">—</p>');
      return;
    }
    parts.forEach(function (part) { pushBlock(paraHtml(part)); });
  }

  pushHeading('Map');
  pushBlock(
    '<figure class="figure">' +
      '<div class="board-figure">' +
        colHead +
        rowHead +
        '<div class="map">' + boardHtml + '</div>' +
      '</div>' +
      '<figcaption class="fig-cap">' +
        '<span>Fig. 1 — plate layout, ' + BOARD + ' × ' + BOARD + '</span>' +
      '</figcaption>' +
    '</figure>',
    'figure'
  );

  pushBlock(
    '<div class="compass-row">' +
      '<div class="compass-art">' + SW.renderCompass(compassStep) + '</div>' +
      '<div class="compass-meta">' +
        '<strong>Compass ' + compassDeg + '°</strong>' +
        '<span>north as marked on the plate set</span>' +
      '</div>' +
    '</div>',
    'figure'
  );

  pushHeading('Objective', 'h3');
  pushParagraphs(scenario.objective);

  pushHeading('Rules');
  pushParagraphs(scenario.rules);

  var specialTopics = '';
  var specialText = '';
  if (scenario.special && scenario.special.on) {
    specialTopics = (scenario.special.topics || []).map(function (t) {
      return '<li>' + esc(t) + '</li>';
    }).join('');
    specialText = paragraphs(scenario.special.text);
  }

  if (specialTopics || specialText) {
    pushHeading('Special Rules', 'h3');
    pushBlock('<div class="callout">' +
      (specialTopics ? '<ul class="topic-list">' + specialTopics + '</ul>' : '') +
      specialText +
      '</div>');
  }

  var otherText = (scenario.other && scenario.other.on)
    ? paragraphs(scenario.other.text)
    : '';

  if (otherText) {
    pushHeading('Other Rules / Escalations', 'h3');
    pushParagraphs(scenario.other.text);
  }

  if (legend.length) {
    pushHeading('Tiles used');
    pushBlock('<ul class="tile-grid">' + legendHtml + '</ul>', 'grid');
  }

  var hasImage = typeof scenario.image === 'string' && scenario.image.indexOf('data:image/') === 0;

  if (hasImage) {
    pushHeading('Board Setup');
    pushBlock('<div class="figure-wrap">' +
      '<div class="setup-frame"><img src="' + scenario.image + '" alt="Board setup"></div>' +
      '<p class="fig-cap"><span>Fig. 2 — table layout</span><span>Reference photo</span></p>' +
      '</div>', 'figure');
  }

  /* --------------------------------------------------------------- cover -- */

  var coverHtml =
    '<section class="page page--cover">' +
      '<div class="page-body">' +
        '<div class="cover-logo"><img src="assets/logo.svg" alt="" width="98" height="98"></div>' +
        '<p class="kicker">Clockwork vs Chaos · Level generator for Mechs vs. Minions</p>' +
        '<h1 class="cover-title">' + esc(title) + '</h1>' +
        '<p class="byline">' +
          (scenario.author ? 'by ' + esc(scenario.author) : 'no author given') +
        '</p>' +
        '<dl class="facts">' +
          '<div><dt>Tiles</dt><dd>' + plateCount + '</dd></div>' +
          '<div><dt>Pieces</dt><dd>' + markerCount + '</dd></div>' +
          '<div><dt>Board</dt><dd>' + BOARD + ' × ' + BOARD + '</dd></div>' +
          '<div><dt>Cells</dt><dd>' + SW.GRID + ' × ' + SW.GRID + '</dd></div>' +
          '<div><dt>Compass</dt><dd>' + compassDeg + '°</dd></div>' +
        '</dl>' +
        '<p class="cover-foot">6 × 6 plate set · scenario dossier</p>' +
      '</div>' +
      '<footer class="page-foot">' +
        '<span>Scenario dossier · <span class="foot-version">v' + esc(SW.VERSION) + '</span></span>' +
        '<span class="foot-num">01 / __</span>' +
      '</footer>' +
    '</section>';

  /* ----------------------------------------------------------- paginator -- */

  function headHtml() {
    return '<header class="page-head">' +
      '<img src="assets/logo.svg" alt="">' +
      '<span class="head-brand">Clockwork vs Chaos</span>' +
      '<span class="head-section">' + esc(title) + '</span>' +
    '</header>';
  }

  function footHtml(page, total) {
    return '<footer class="page-foot">' +
      '<span>Scenario dossier · <span class="foot-version">v' + esc(SW.VERSION) + '</span></span>' +
      '<span class="foot-num">' + pad(page) + ' / ' + pad(total) + '</span>' +
    '</footer>';
  }

  /* Lay the blocks out once at the exact content width and remember how much
     room every block takes, including the gap to the next one. */
  function measureBlocks() {
    var probe = document.createElement('section');
    probe.className = 'page page--content';
    probe.style.cssText = 'position:absolute;left:-6000px;top:0;visibility:hidden;';
    probe.innerHTML = headHtml() +
      '<div class="page-body"><div class="measure"></div></div>' +
      footHtml(1, 1);
    root.appendChild(probe);

    var body = probe.querySelector('.page-body');
    var box = probe.querySelector('.measure');
    var cs = getComputedStyle(body);
    var usable = body.clientHeight -
      parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);

    blocks.forEach(function (block) {
      var tmp = document.createElement('div');
      tmp.innerHTML = block.html;
      block.el = tmp.firstElementChild;
      box.appendChild(block.el);
    });

    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'height:0;margin:0;padding:0;';
    box.appendChild(sentinel);

    var tops = blocks.map(function (block) {
      return block.el.getBoundingClientRect().top;
    });
    var end = sentinel.getBoundingClientRect().top;

    blocks.forEach(function (block, i) {
      block.height = (i + 1 < blocks.length ? tops[i + 1] : end) - tops[i];
    });

    probe.remove();
    return usable;
  }

  function paginate(usable) {
    var limit = usable - 2;      // sub-pixel slack
    var pages = [];
    var page = [];
    var used = 0;

    blocks.forEach(function (block) {
      if (page.length && used + block.height > limit) {
        pages.push(page);
        page = [];
        used = 0;
      }
      page.push(block);
      used += block.height;
    });

    if (page.length) pages.push(page);

    /* Never leave a heading alone at the foot of a sheet. */
    for (var i = 0; i < pages.length - 1; i++) {
      while (pages[i].length > 1 && pages[i][pages[i].length - 1].kind === 'heading') {
        pages[i + 1].unshift(pages[i].pop());
      }
    }

    return pages;
  }

  function render() {
    var usable = measureBlocks();
    var pages = paginate(usable);
    var total = pages.length + 1;

    var contentHtml = pages.map(function (pageBlocks, i) {
      return '<section class="page page--content">' +
        headHtml() +
        '<div class="page-body">' +
          pageBlocks.map(function (block) { return block.html; }).join('') +
        '</div>' +
        footHtml(i + 2, total) +
      '</section>';
    }).join('');

    root.innerHTML = coverHtml.replace('01 / __', '01 / ' + pad(total)) + contentHtml;
  }

  /* ------------------------------------------------------------- start -- */

  function preload(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = img.onerror = function () { resolve(); };
      img.src = src;
    });
  }

  var fonts = (document.fonts && document.fonts.ready)
    ? document.fonts.ready
    : Promise.resolve();

  Promise.all([fonts, hasImage ? preload(scenario.image) : Promise.resolve()])
    .then(function () {
      render();

      document.getElementById('btn-print').addEventListener('click', function () {
        window.print();
      });

      if (new URLSearchParams(location.search).get('noprint') !== '1') {
        setTimeout(function () { window.print(); }, 250);
      }
    });
})();
