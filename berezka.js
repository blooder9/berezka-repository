// ==UserScript==
// @name         Сортировка заказа Берёзка
// @namespace    https://github.com/blooder9/my
// @version      3.21
// @description  Сортировка товаров заказа и аккуратное тёмное оформление страниц wms.berezka.cy. Рассчитано на телефон.
// @match        https://wms.berezka.cy/*
// @run-at       document-start
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/blooder9/berezka-repository/main/berezka.js
// @downloadURL  https://raw.githubusercontent.com/blooder9/berezka-repository/main/berezka.js
// ==/UserScript==
(function bzMain() {
  'use strict';
  if (window.__bzSort) { return; }
  window.__bzSort = 1;

  var SKEY = 'bz-sort-v3', LKEY = 'bz-last-order';
  // Палитра: графит и тёплое золото.
  // Две темы: тёмная и светлая. Цвета лежат в CSS-переменных, переключение — одним атрибутом.
  var PALS = {
    dark: { bg: '#0b0d10', bar: '#0f1216', s1: '#12151a', s2: '#1a1e25', line: '#262b33', tx: '#eceae4', mu: '#8e939c', gold: '#d6b36a', gold2: '#e8cd92', fg: '#1a1406', err: '#e58a84',
            ln2: '#2d333c', ln3: '#343a44', ln4: '#3a414c', t2: '#aab1bb', dim: '#5b616b', dim2: '#4b515b', act: '#1f1a10', tr: '#1d1416', ta: '#1e1912', tg: '#111d17', tb: '#121a25', grad: 'linear-gradient(180deg,#e8cd92,#d6b36a 55%,#c29d54)' },
    light: { bg: '#f1efe9', bar: '#ffffff', s1: '#ffffff', s2: '#eeebe3', line: '#ddd8cb', tx: '#1d1f23', mu: '#666b74', gold: '#a9812f', gold2: '#8a6419', fg: '#1a1406', err: '#c2433c',
            ln2: '#cfc9bb', ln3: '#c3bcab', ln4: '#b9b2a1', t2: '#4e535b', dim: '#b5ae9f', dim2: '#aba493', act: '#f6ecd3', tr: '#fbeceb', ta: '#fbf1e1', tg: '#e8f5ed', tb: '#e8f0fa', grad: 'linear-gradient(180deg,#e8cd92,#d6b36a 55%,#c29d54)' },
    pop: { bg: '#adc2ce', bar: '#f7f9fb', s1: '#f6f8fa', s2: '#ffffff', line: '#dbe3e9', tx: '#3b4350', mu: '#8a929c', gold: '#b13a96', gold2: '#9b2f86', fg: '#ffffff', err: '#d9433b',
           ln2: '#cfd8df', ln3: '#c5cfd7', ln4: '#bac5ce', t2: '#5d6671', dim: '#c1c9d1', dim2: '#b3bcc5', act: '#fdeef7', tr: '#fde3e1', ta: '#fdecd2', tg: '#dff3e7', tb: '#dfeafa', grad: 'linear-gradient(180deg,#ffb92e,#ff9a0a 55%,#ef8100)' }
  };
  var P = {};
  Object.keys(PALS.dark).forEach(function (k) { P[k] = 'var(--bz-' + k + ')'; });
  var VER = '3.21';
  var st = { key: 'code', dir: -1, dark: true, col: false, tool: 'o', theme: 'dark', lang: '' };
  try {
    var sv = JSON.parse(localStorage.getItem(SKEY) || '{}');
    Object.keys(st).forEach(function (k) { if (sv[k] !== undefined) { st[k] = sv[k]; } });
  } catch (e) {}
  function save() { try { localStorage.setItem(SKEY, JSON.stringify(st)); } catch (e) {} }
  // Цвета отметок (все с прозрачностью 20 %).
  var PAL = {
    o: { n: 'оранжевый', c: '255,140,0' },
    b: { n: 'голубой', c: '64,160,255' },
    g: { n: 'салатовый', c: '150,225,60' },
    p: { n: 'фиолетовый', c: '168,98,255' },
    r: { n: 'красный', c: '255,64,64' },
    t: { n: 'бирюзовый', c: '32,214,196' },
    s: { n: 'синий', c: '40,84,235' },
    n: { n: 'коричневый', c: '165,105,55' },
    h: { n: 'белый', c: '255,255,255' }
  };
  var PORD = ['o', 'b', 'g', 'p', 'r', 't', 's', 'n', 'h'];
  var AL = '.3';
  function svgUri(inner, stroke, sw) {
    return 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="' + (sw || 1.7) + '" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>') + '")';
  }
  // значки пунктов меню терминала
  var MENUICO = {
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6h.01"/>',
    inb: '<path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 20h15"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>',
    link: '<path d="M10 14a4.2 4.2 0 0 0 6 0l3-3a4.2 4.2 0 0 0-6-6l-1 1M14 10a4.2 4.2 0 0 0-6 0l-3 3a4.2 4.2 0 0 0 6 6l1-1"/>',
    move: '<path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"/>',
    order: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 3h6v4H9zM9 14l2.2 2.2L15.5 12"/>',
    inv: '<path d="M8.5 6H21M8.5 12H21M8.5 18H21M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>'
  };
  // Отметки товаров: код товара -> цвет. Блок между маркерами подставляется при копировании скрипта.
  var SAVED = /*BZ*/{"ts":0,"m":{}}/*ZB*/;
  var MKEY = 'bz-marks-v1';
  var MK = { ts: 0, m: {} };
  // Отметки хранятся в трёх местах: в хранилище Tampermonkey (не стирается сайтом при выходе из учётной записи),
  // в памяти браузера для этого сайта и в самом скрипте (SAVED). Берётся самая свежая копия.
  var GMG = (typeof GM_getValue === 'function') ? GM_getValue : null, GMS = (typeof GM_setValue === 'function') ? GM_setValue : null;
  function readMarks(src) {
    try {
      var raw = src === 'gm' ? (GMG ? GMG(MKEY, '') : '') : localStorage.getItem(MKEY);
      var o = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
      return (o && o.m && typeof o.m === 'object') ? o : null;
    } catch (e) { return null; }
  }
  function writeMarks() {
    var txt = JSON.stringify(MK), ok = false;
    try { localStorage.setItem(MKEY, txt); ok = true; } catch (e) {}
    try { if (GMS) { GMS(MKEY, txt); ok = true; } } catch (e) {}
    return ok;
  }
  [readMarks('gm'), readMarks('ls'), SAVED].forEach(function (o) {
    if (o && o.m && (o.ts || 0) > (MK.ts || 0)) { MK = { ts: o.ts || 0, m: o.m }; }
  });
  if (MK.ts) { writeMarks(); }
  function saveMarks() { MK.ts = Date.now(); return writeMarks(); }
  function getLast() { try { return localStorage.getItem(LKEY) || ''; } catch (e) { return ''; } }
  function setLast(u) { try { localStorage.setItem(LKEY, u); } catch (e) {} }

  // ---------- Оформление страницы ----------
  var FF = '"Segoe UI",Roboto,"Helvetica Neue",Arial,system-ui,sans-serif';
  var MONO = 'ui-monospace,"Roboto Mono",SFMono-Regular,Consolas,monospace';
  var GRAD = 'var(--bz-grad)';
  var css = document.createElement('style');
  css.id = 'bz-css';
  css.textContent = [
    'html{overflow-x:hidden !important;max-width:100%;overscroll-behavior-x:none;-webkit-text-size-adjust:100%;text-size-adjust:100%;overscroll-behavior-y:contain;-webkit-tap-highlight-color:transparent;background:' + P.bg + ' !important}',
    'body{background:' + P.bg + ' !important;color:' + P.tx + ' !important;font-size:34px !important;line-height:1.35;overflow-x:clip;max-width:100%;box-sizing:border-box}',
    'body::after{content:"";display:block;height:130px}',
    '.bz-gone{display:none !important}',
    'div[style*="1200px"]{width:100% !important;max-width:100% !important;box-sizing:border-box}',
    'div[style*="border-top: 1px solid"]{border-top-color:' + P.line + ' !important}',
    'body,input:not(.bz),button:not(.bz),th,td{font-family:' + FF + ' !important;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}',
    'a{color:' + P.gold + ';text-underline-offset:.18em}',
    'hr{border:0 !important;border-top:1px solid ' + P.line + ' !important;margin:14px 0 !important}',
    'td{background:transparent !important;color:' + P.tx + '}',
    'button.bz{touch-action:manipulation !important;-webkit-user-select:none !important;user-select:none !important}',
    'button.bz:active{filter:brightness(1.3) !important;transform:scale(.96) !important}',

    // заголовок заказа
    '.bz-t{display:block;text-align:left !important;font-size:34px !important;font-weight:700 !important;line-height:1.3;margin:6px 0 22px !important;color:' + P.tx + ' !important}',
    '.bz-t,.bz-t *{font-style:normal !important}',
    '.bz-t a,.bz-t i,.bz-t em,.bz-t font,.bz-t b{color:' + P.gold + ' !important}',
    '.bz-t .bz-ts{font-size:48px !important;font-weight:800 !important;line-height:1.15;margin:0 0 8px;color:' + P.gold2 + ' !important;word-break:break-word}',
    '.bz-t .bz-trow{position:relative;margin:0 0 8px}',
    '.bz-t .bz-trow .bz-ts{margin:0;padding-right:260px}',
    '.bz-t .bz-tc{position:absolute;right:40px;top:0;text-align:right;font-size:23px !important;font-weight:600 !important;line-height:1.3;color:' + P.mu + ' !important}',
    '.bz-t .bz-tc b{font-family:' + MONO + ';font-weight:800 !important;color:' + P.gold2 + ' !important;font-size:1.15em}',
    '.bz-t .bz-tn{font-size:27px !important;font-weight:600 !important;margin:0 0 14px;color:' + P.mu + ' !important}',
    '.bz-t .bz-tn b{font-family:' + MONO + ';font-weight:700 !important;color:' + P.tx + ' !important}',
    '.bz-t .bz-tp{display:inline-flex;align-items:center;min-height:54px;padding:0 26px;border-radius:999px;font-size:24px !important;font-weight:800 !important;letter-spacing:.1em;text-transform:uppercase;background:rgba(var(--c),.2);border:1px solid rgba(var(--c),.6);color:rgb(var(--c)) !important}',

    // подсказки сайта (блоки с пунктирной рамкой) и «Отсканируйте место хранения»
    '.bz-note,.bz-prompt{display:block;box-sizing:border-box;margin:0 0 20px !important;padding:22px 26px !important;background:' + P.s1 + ' !important;background-image:none !important;border:1px solid ' + P.line + ' !important;border-left:8px solid ' + P.gold + ' !important;border-radius:18px !important;color:' + P.tx + ' !important;text-align:left !important;font-size:30px !important;font-weight:600 !important;line-height:1.35 !important}',
    '.bz-note *,.bz-prompt *{color:inherit !important}',

    // таблица товаров
    'table.bz-tbl{width:100% !important;border-collapse:separate !important;border-spacing:0 8px !important;border:0 !important}',
    'table.bz-tbl td,table.bz-tbl th{border:0 !important}',
    'tr.bz-r > td{background:' + P.s2 + ' !important;color:' + P.tx + ' !important;font-size:32px;font-weight:500;padding:18px 14px !important;line-height:1.25;vertical-align:middle}',
    '@keyframes bzflash{0%,60%{outline-color:rgba(214,179,106,1)}100%{outline-color:rgba(214,179,106,0)}}',
    'tr.bz-flash{outline:4px solid rgba(214,179,106,1);outline-offset:-2px;border-radius:22px;animation:bzflash 2.4s ease-out forwards}',
    'tr.bz-w > td{background-image:linear-gradient(rgba(255,140,0,.3),rgba(255,140,0,.3)) !important}',
    'tr.bz-v > td{background-image:linear-gradient(rgba(64,160,255,.3),rgba(64,160,255,.3)) !important}',
    'tr.bz-s-red > td{background:' + P.tr + ' !important}',
    'tr.bz-s-amb > td{background:' + P.ta + ' !important}',
    'tr.bz-s-grn > td{background:' + P.tg + ' !important}',
    'tr.bz-s-blu > td{background:' + P.tb + ' !important}',
    'tr.bz-r > td:first-child{border-radius:16px 0 0 16px;font-size:26px;font-weight:600;color:' + P.mu + ' !important;text-align:center;box-shadow:inset 7px 0 0 ' + P.dim + '}',
    'tr.bz-s-red > td:first-child{box-shadow:inset 7px 0 0 #d4655f}',
    'tr.bz-s-amb > td:first-child{box-shadow:inset 7px 0 0 #e0a458}',
    'tr.bz-s-grn > td:first-child{box-shadow:inset 7px 0 0 #58b08a}',
    'tr.bz-s-blu > td:first-child{box-shadow:inset 7px 0 0 #6c9bd8}',
    'tr.bz-r > td:last-child{border-radius:0 16px 16px 0}',
    'tr.bz-r > td:nth-child(2) a{color:' + P.gold2 + ' !important;font-family:' + MONO + ' !important;font-weight:700;display:inline-block;padding:12px 8px;margin:-12px -8px;text-decoration:underline;text-decoration-color:rgba(232,205,146,.4);text-decoration-thickness:3px;text-underline-offset:.2em}',
    'tr.bz-r > td:nth-child(4),tr.bz-r > td:nth-child(5){font-weight:700;font-size:38px;min-width:2.2em;text-align:center}',
    'tr.bz-r > td:nth-child(5){color:' + P.mu + ' !important}',
    'tr.bz-h td,tr.bz-h th{padding:12px 14px !important;font-size:24px !important;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:' + P.mu + ' !important;background:transparent !important;border-bottom:1px solid ' + P.line + ' !important}',
    'tr.bz-d > td{padding:0 !important;background:transparent !important}',
    'tr.bz-d table{border:0 !important;width:100% !important;margin:-2px 0 6px;border-spacing:4px 0 !important}',
    'tr.bz-d table td{font-size:25px !important;font-weight:500;line-height:1.3;padding:10px 12px !important;border-radius:10px;background:' + P.s1 + ' !important;color:' + P.t2 + ' !important;border:1px solid ' + P.line + ' !important}',
    'tr.bz-e{display:none !important}',
    '.bz-arrow{white-space:nowrap}',
    'tr.bz-h td{white-space:nowrap}',
    '.bz-note br,table.bz-scanbox + br{display:none}',

    // поля ввода и кнопки (размеры сайта не меняем)
    'input:not(.bz)[type=text],input:not(.bz):not([type]),input:not(.bz)[type=number],input:not(.bz)[type=search],input:not(.bz)[type=tel],input:not(.bz)[type=password],input:not(.bz)[type=email]{background:' + P.s1 + ' !important;color:' + P.tx + ' !important;border:2px solid ' + P.ln2 + ' !important;border-radius:14px !important;padding:.3em .6em !important;box-sizing:border-box;max-width:100%}',
    'input:not(.bz)[type=text]:focus,input:not(.bz):not([type]):focus,input:not(.bz)[type=number]:focus,input:not(.bz)[type=password]:focus,input:not(.bz)[type=email]:focus{border-color:' + P.gold + ' !important;outline:none;box-shadow:0 0 0 4px rgba(214,179,106,.22)}',
    'input:not(.bz)[type=submit],input:not(.bz)[type=button],button:not(.bz){background:' + GRAD + ' !important;color:' + P.fg + ' !important;border:0 !important;border-radius:16px !important;font-weight:700 !important;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.4)}',
    'input:not(.bz).bz-sec[type=button],input:not(.bz).bz-sec[type=submit],button:not(.bz).bz-sec{background:' + P.s2 + ' !important;color:' + P.tx + ' !important;border:2px solid ' + P.ln3 + ' !important;box-shadow:none !important}',

    // окно сканирования
    'table.bz-scanbox{display:block;box-sizing:border-box;width:100% !important;margin:0 0 22px !important;padding:18px;background:' + P.s1 + ';border:1px solid ' + P.line + ' !important;border-radius:22px;border-spacing:0 !important}',
    'table.bz-scanbox > tbody,table.bz-scanbox > thead,table.bz-scanbox > tr{display:block}',
    'table.bz-scanbox tr{display:block}',
    'table.bz-scanbox td{display:flex !important;gap:14px;align-items:stretch;padding:0 !important}',
    'table.bz-scanbox input[name=barcode]{flex:1 1 0;min-width:0;width:0 !important;height:96px;font-size:36px !important;font-weight:600 !important}',
    'table.bz-scanbox input[type=submit]{flex:none;min-width:190px;height:96px;font-size:34px !important}',

    // «Добавить товар»
    'a.bz-addbtn{display:flex;align-items:center;justify-content:center;gap:16px;min-height:96px;margin:4px 0 22px;padding:0 28px;border-radius:20px;background:' + P.s2 + ';border:2px solid ' + P.gold + ';color:' + P.gold2 + ' !important;font-size:32px;font-weight:700;text-decoration:none !important}',
    'a.bz-addbtn::before{content:"+";font-size:1.4em;line-height:1;font-weight:600}',
    '.bz-sub{margin:16px 0 8px;font-size:24px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:' + P.mu + '}',
    'table.bz-addbox br{display:none}',
    'table.bz-addbox{display:block;box-sizing:border-box;width:100% !important;margin:0 0 4px !important;padding:16px 20px;background:' + P.s1 + ';border:1px solid ' + P.line + ' !important;border-radius:22px;border-spacing:0 !important}',
    'table.bz-addbox > tbody,table.bz-addbox tr{display:block}',
    'table.bz-addbox td{display:block;padding:0 !important;font-size:30px}',
    'table.bz-addbox input[type=text]{width:100% !important;display:block;margin:4px 0 8px;font-size:34px !important}',
    'table.bz-addbox input[type=submit]{width:100%;height:84px;font-size:32px !important;margin-top:4px}',

    // прочие таблицы (карточка товара и т.п.): элементы переносятся по строкам и не выходят за экран
    'table.bz-flow{display:block;width:100% !important;max-width:100%;border-spacing:0 !important;border:0 !important}',
    'table.bz-flow > tbody,table.bz-flow > thead{display:block}',
    'table.bz-flow tr{display:flex;flex-wrap:wrap;gap:14px 18px;align-items:flex-start;margin:0 0 16px}',
    'table.bz-flow td,table.bz-flow th{display:block;min-width:0;max-width:100%;padding:0 !important;border:0 !important;word-break:break-word}',
    'table.bz-flow img{max-width:260px;height:auto;border-radius:16px}',
    'table.bz-flow .sel_botton{width:100% !important;height:104px !important;margin:0 !important;font-size:30px !important;padding:0 12px !important}',
    'table.bz-flow td.bz-wide{flex:1 1 220px;min-width:0}',
    'table.bz-flow input[type=submit]{min-height:84px;padding:0 38px !important;font-size:34px !important}',
    'table.bz-flow input[type=text],table.bz-flow input:not([type]){width:150px !important;height:84px;font-size:38px !important;text-align:center}',
    'span[style*=yellow],font[color=yellow],b[style*=yellow]{color:' + P.gold2 + ' !important}',
    // карточка товара: всё на всю ширину экрана
    'table.bz-item{display:flex !important;flex-wrap:wrap;gap:18px;width:100% !important;max-width:100%;box-sizing:border-box;border:0 !important;border-spacing:0 !important;margin:12px 0 0 !important;padding:0 !important;background:transparent !important}',
    'table.bz-item > tbody,table.bz-item > thead,table.bz-item > tfoot{display:contents !important}',
    'table.bz-item tr{display:contents !important}',
    'table.bz-item td,table.bz-item th{display:block;box-sizing:border-box;flex:1 1 100%;min-width:0;max-width:100%;padding:0 !important;border:0 !important;word-break:break-word;font-size:30px;text-align:left}',
    'table.bz-item td.bz-c-none{display:none !important}',
    'table.bz-item td.bz-c-img{order:0;text-align:center !important}',
    'table.bz-item td.bz-c-img img{display:inline-block;max-width:100% !important;width:auto !important;height:auto !important;max-height:480px;border-radius:22px;background:#fff;border:1px solid ' + P.line + '}',
    'table.bz-item td.bz-c-name{order:1;font-size:44px !important;font-weight:700;line-height:1.25;text-align:center !important}',
    'table.bz-item td.bz-c-meta{order:2;background:' + P.s1 + ' !important;border:1px solid ' + P.line + ' !important;border-radius:22px;padding:10px 12px !important;display:flex !important;flex-wrap:wrap;justify-content:center;align-items:flex-start;text-align:center !important}',
    'table.bz-item td.bz-c-name.bz-w{background:rgba(255,140,0,.3) !important;border-radius:22px;padding:18px 24px !important}',
    'table.bz-item td.bz-c-meta.bz-w{background-image:linear-gradient(rgba(255,140,0,.3),rgba(255,140,0,.3)) !important}',
    'table.bz-item td.bz-c-name.bz-v{background:rgba(64,160,255,.3) !important;border-radius:22px;padding:18px 24px !important}',
    'table.bz-item td.bz-c-meta.bz-v{background-image:linear-gradient(rgba(64,160,255,.3),rgba(64,160,255,.3)) !important}',
    '.bz-kt{flex:1 1 100%;font-size:44px;font-weight:700;line-height:1.25;padding:10px 6px 12px;text-align:center}',
    '.bz-kv{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:6px;flex:1 1 28%;min-width:0;padding:12px 8px;text-align:center}',
    '.bz-kv .k{font-size:22px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + P.mu + '}',
    '.bz-kv .v{font-size:38px;font-weight:700;min-width:0;word-break:break-word}',
    // карточка товара, собранная заново из одной ячейки
    'table.bz-item td.bz-c-card{order:2;flex:1 1 100%;padding:0 !important;background:transparent !important;border:0 !important;font-size:30px;font-weight:400;color:' + P.tx + ' !important}',
    '.bz-card{display:flex;flex-direction:column;gap:18px;width:100%;box-sizing:border-box}',
    '.bz-pic{text-align:center}',
    '.bz-pic img{display:inline-block;max-width:100% !important;width:auto !important;height:auto !important;max-height:480px;border-radius:22px;background:#fff;border:1px solid ' + P.line + '}',
    '.bz-head{background:' + P.s1 + ';border:1px solid ' + P.line + ';border-radius:22px;padding:14px 12px;text-align:center}',
    '.bz-nm{font-size:44px;font-weight:700;line-height:1.25;padding:8px 8px 10px;text-align:center;color:' + P.tx + '}',
    '.bz-kvs{display:flex;flex-wrap:wrap;justify-content:center}',
    '.bz-head.bz-w{background-image:linear-gradient(rgba(255,140,0,.3),rgba(255,140,0,.3)) !important}',
    '.bz-head.bz-v{background-image:linear-gradient(rgba(64,160,255,.3),rgba(64,160,255,.3)) !important}',
    '.bz-qty{display:flex;flex-wrap:wrap;gap:14px;align-items:center;background:' + P.s1 + ';border:1px solid ' + P.line + ';border-radius:22px;padding:22px;font-size:32px;font-weight:700;color:' + P.gold2 + '}',
    '.bz-qty input[type=text],.bz-qty input:not([type]),.bz-qty input[type=number],.bz-qty input[type=tel]{flex:0 0 170px;width:170px !important;height:100px;text-align:center;font-size:44px !important}',
    '.bz-qty input[type=submit],.bz-qty input[type=button],.bz-qty button{flex:1 1 240px;height:100px;font-size:38px !important;padding:0 24px !important}',
    '.bz-avail{display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:30px;color:' + P.mu + '}',
    '.bz-avail input,.bz-avail button{height:84px;padding:0 30px !important;font-size:28px !important;width:auto !important;margin:0 !important}',
    '.bz-acts{display:flex;gap:18px;margin:16px 0}',
    '.bz-acts input,.bz-acts button{flex:1 1 0;min-width:0;height:104px;font-size:30px !important;margin:0 !important;padding:0 10px !important;white-space:normal;width:auto !important}',
    'table.bz-item td.bz-c-qty{order:3;display:flex !important;flex-wrap:wrap;gap:14px;align-items:center;background:' + P.s1 + ' !important;border:1px solid ' + P.line + ' !important;border-radius:22px;padding:22px !important;font-size:32px;font-weight:700;color:' + P.gold2 + '}',
    'table.bz-item td.bz-c-qty input[type=text],table.bz-item td.bz-c-qty input:not([type]),table.bz-item td.bz-c-qty input[type=number],table.bz-item td.bz-c-qty input[type=tel]{flex:0 0 170px;width:170px !important;height:100px;text-align:center;font-size:44px !important}',
    'table.bz-item td.bz-c-qty input[type=submit],table.bz-item td.bz-c-qty input[type=button],table.bz-item td.bz-c-qty button{flex:1 1 240px;height:100px;font-size:38px !important;padding:0 24px !important}',
    'table.bz-item td.bz-c-avail{order:4;flex:1 1 0 !important;min-width:50%;align-self:center;font-size:30px;color:' + P.mu + '}',
    'table.bz-item td.bz-c-edit{order:5;flex:0 0 auto !important;align-self:center}',
    'table.bz-item td.bz-c-edit input,table.bz-item td.bz-c-edit button{height:84px;padding:0 30px !important;font-size:28px !important;width:auto !important;margin:0 !important}',
    'table.bz-item td.bz-c-btn{order:6}',
    'table.bz-item td.bz-c-btn input,table.bz-item td.bz-c-btn button{width:100% !important;height:104px;font-size:34px !important;margin:0 !important}',
    'table.bz-item td.bz-c-txt{order:2}',
    'table.bz-item td.bz-c-sec{order:9;flex:1 1 calc(50% - 9px)}',
    'table.bz-item td.bz-c-sec input,table.bz-item td.bz-c-sec button{width:100% !important;height:104px;font-size:30px !important;margin:0 !important;padding:0 10px !important;white-space:normal}',
    'table.bz-item tr.bz-r-data{display:flex !important;order:7;flex:1 1 100%;align-items:stretch;box-sizing:border-box;background:' + P.s1 + ';border-left:1px solid ' + P.line + ';border-right:1px solid ' + P.line + '}',
    'table.bz-item tr.bz-r-data > td,table.bz-item tr.bz-r-data > th{flex:1 1 0 !important;text-align:center !important;background:transparent !important}',
    'table.bz-item tr.bz-dh{margin-bottom:-18px;border-top:1px solid ' + P.line + ';border-radius:22px 22px 0 0;padding:18px 6px 0}',
    'table.bz-item tr.bz-dh > td,table.bz-item tr.bz-dh > th{font-size:22px !important;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + P.mu + ' !important}',
    'table.bz-item tr.bz-dv{border-bottom:1px solid ' + P.line + ';border-radius:0 0 22px 22px;padding:4px 6px 20px}',
    'table.bz-item tr.bz-dv > td{font-size:40px !important;font-weight:700}',
    // таблица-сетка (помещение, ряд, стеллаж, полка)
    'table.bz-data{display:table !important;width:100% !important;table-layout:fixed;border-collapse:separate !important;border-spacing:0 !important;background:' + P.s1 + ';border:1px solid ' + P.line + ' !important;border-radius:22px;margin:14px 0 !important}',
    'table.bz-data td,table.bz-data th{text-align:center;border:0 !important;background:transparent !important}',
    'table.bz-data tr:first-child td,table.bz-data tr:first-child th{font-size:22px !important;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + P.mu + ' !important;padding:18px 6px 4px !important}',
    'table.bz-data tr + tr td{font-size:40px;font-weight:700;padding:4px 6px 20px !important}',
    '.td_col{background:' + P.s2 + ' !important;color:' + P.tx + ' !important}',
    // главное меню, верхняя полоса разделов, заголовки
    'table.bz-topnav,.bz-topnav{display:block;box-sizing:border-box;width:0 !important;min-width:100% !important;max-width:100%;contain:inline-size;overflow-x:auto;overflow-y:hidden;border:0 !important;margin:12px 0 20px !important;padding:2px 0 8px;white-space:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none;scroll-snap-type:x proximity;overscroll-behavior-x:contain}',
    '.bz-topnav::-webkit-scrollbar{display:none}',
    'table.bz-topnav > tbody{display:block;width:max-content;min-width:100%}',
    'table.bz-topnav tr{display:flex;gap:12px;flex-wrap:nowrap}',
    'table.bz-topnav td,table.bz-topnav th{display:block;flex:none;box-sizing:border-box;padding:0 !important;border:0 !important;font-size:30px !important;font-weight:700 !important;line-height:1.2;white-space:nowrap;scroll-snap-align:center}',
    'table.bz-topnav td > a,table.bz-topnav td > font,table.bz-topnav td > b,table.bz-topnav td{display:block}',
    'table.bz-topnav td{padding:0 !important;min-height:84px;border-radius:999px !important;background:' + P.s1 + ' !important;border:1px solid ' + P.line + ' !important;color:' + P.mu + ' !important}',
    'table.bz-topnav td *{font-size:30px !important;font-weight:700 !important;color:inherit !important;text-decoration:none !important;background:transparent !important;border:0 !important}',
    'table.bz-topnav td a,table.bz-topnav td > *:only-child{display:flex;align-items:center;justify-content:center;min-height:84px;padding:0 34px !important}',
    'table.bz-topnav td.bz-on{display:flex;align-items:center;padding:0 34px !important;background:' + GRAD + ' !important;border-color:transparent !important;color:' + P.fg + ' !important;box-shadow:0 4px 14px rgba(0,0,0,.4)}',
    'table.bz-topnav td.bz-on *{padding:0 !important;color:' + P.fg + ' !important}',
    'div.bz-topnav,p.bz-topnav,center.bz-topnav,span.bz-topnav{font-size:0 !important}',
    'div.bz-topnav a,p.bz-topnav a,center.bz-topnav a,.bz-topnav > .bz-on{display:inline-flex;align-items:center;box-sizing:border-box;min-height:84px;margin:0 12px 0 0;padding:0 34px !important;border-radius:999px;font-size:30px !important;font-weight:700 !important;text-decoration:none !important;white-space:nowrap;background:' + P.s1 + ' !important;border:1px solid ' + P.line + ' !important;color:' + P.mu + ' !important}',
    'div.bz-topnav > .bz-on,p.bz-topnav > .bz-on{background:' + GRAD + ' !important;border-color:transparent !important;color:' + P.fg + ' !important}',
    '.bz-h1{color:' + P.gold2 + ' !important;font-weight:800 !important;letter-spacing:.02em;margin:10px 0 18px !important}',
    'input:not(.bz).bz-menu[type=button],input:not(.bz).bz-menu[type=submit],button:not(.bz).bz-menu{display:block;box-sizing:border-box;width:100% !important;height:118px !important;margin:0 0 16px !important;padding:0 96px 0 38px !important;text-align:left !important;font-size:36px !important;font-weight:600 !important;color:' + P.tx + ' !important;background-color:' + P.s1 + ' !important;background-image:url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22%3E%3Cpath d=%22M9 4l8 8-8 8%22 fill=%22none%22 stroke=%22%23d6b36a%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/svg%3E") !important;background-repeat:no-repeat !important;background-position:right 36px center !important;background-size:24px !important;border:1px solid ' + P.line + ' !important;border-left:8px solid var(--c,' + P.gold + ') !important;border-radius:20px !important;box-shadow:none !important}',
    'input:not(.bz).bz-menu[type=button]:active,input:not(.bz).bz-menu[type=submit]:active,button:not(.bz).bz-menu:active{background-color:' + P.s2 + ' !important;border-color:' + P.gold + ' !important}',
    'input.bz-ord,select.bz-ord{display:block;box-sizing:border-box;width:100% !important;max-width:100%;height:96px;margin:14px 0 !important;font-size:36px !important}',
    'select:not(.bz){-webkit-appearance:none;appearance:none;background-color:' + P.s2 + ' !important;background-image:url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22%3E%3Cpath d=%22M4 9l8 8 8-8%22 fill=%22none%22 stroke=%22%23d6b36a%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/svg%3E") !important;background-repeat:no-repeat !important;background-position:right 26px center !important;background-size:24px !important;color:' + P.tx + ' !important;border:2px solid ' + P.ln2 + ' !important;border-radius:14px !important;padding:0 72px 0 24px !important;min-height:96px;font-size:34px !important;max-width:100%}',
    'th{background:transparent !important;color:' + P.mu + ' !important}',

    // список документов (карточки)
    '.bz-docs{display:flex;flex-direction:column;gap:18px;margin:12px 0 28px}',
    '.bz-doc{display:flex;flex-direction:column;gap:14px;box-sizing:border-box;padding:24px 24px 20px 28px;background:' + P.s1 + ';border:1px solid ' + P.line + ';border-left:8px solid rgb(var(--c));border-radius:22px}',
    '.bz-dtop{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}',
    '.bz-dshop{font-size:40px;font-weight:700;line-height:1.2;color:' + P.tx + ';min-width:0;word-break:break-word}',
    '.bz-badge{flex:none;padding:6px 18px;border-radius:999px;font-size:22px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;background:rgba(var(--c),.2);border:1px solid rgba(var(--c),.55);color:rgb(var(--c))}',
    '.bz-dmeta{display:flex;flex-wrap:wrap;gap:6px 26px;font-size:27px;color:' + P.mu + '}',
    '.bz-dmeta b{font-weight:700;color:' + P.gold2 + ';font-family:' + MONO + '}',
    '.bz-dmeta a{color:' + P.gold2 + ' !important;font-family:' + MONO + ';font-weight:700}',
    '.bz-types{display:flex;flex-wrap:wrap;gap:12px;margin-top:4px}',
    '.bz-types a{flex:1 1 calc(50% - 6px);display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-height:80px;padding:0 26px;border-radius:16px;background:rgba(var(--c),.18);border:2px solid rgba(var(--c),.55);color:rgb(var(--c)) !important;font-size:27px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;text-decoration:none !important;text-align:center}',
    '.bz-types a:active{background:rgba(var(--c),.34)}',
    'table.bz-docsrc{display:none !important}',
    // кнопки «Начало» и «Назад»
    'html .bz-nav,input:not(.bz).bz-nav[type=button],input:not(.bz).bz-nav[type=submit],button:not(.bz).bz-nav{display:inline-flex !important;align-items:center;justify-content:center;box-sizing:border-box;min-height:96px;margin:6px 0 !important;padding:0 44px !important;border-radius:20px !important;background:' + P.s2 + ' !important;background-image:none !important;color:' + P.gold2 + ' !important;border:2px solid rgba(214,179,106,.5) !important;box-shadow:none !important;font-size:30px !important;font-weight:700 !important;letter-spacing:.14em;text-transform:uppercase;text-decoration:none !important;text-align:center;cursor:pointer;-webkit-appearance:none;appearance:none;width:auto;height:auto}',
    '.bz-navrow{display:flex !important;gap:18px;align-items:stretch}',
    '.bz-navrow > .bz-nav{flex:1 1 0;margin:6px 0 !important}',
    'table.bz-navtbl{display:block;width:100% !important;border:0 !important;border-spacing:0 !important}',
    'table.bz-navtbl > tbody{display:block}',
    'table.bz-navtbl tr{display:flex;gap:18px;width:100%}',
    'table.bz-navtbl td,table.bz-navtbl th{display:block;flex:1 1 0;min-width:0;padding:0 !important;border:0 !important}',
    'table.bz-navtbl .bz-nav{width:100% !important;margin:6px 0 !important}',
    'table.bz-item td.bz-c-nav{order:10;flex:1 1 calc(50% - 9px)}',
    'table.bz-item td.bz-c-nav .bz-nav{width:100% !important;margin:0 !important}',
    // шапка сайта: логотип, название склада и разделы
    'table.bz-hdr{display:block !important;box-sizing:border-box;width:100% !important;margin:6px 0 22px !important;padding:26px 20px 20px !important;background-color:' + P.s1 + ' !important;background-image:linear-gradient(' + P.gold + ',' + P.gold + ') !important;background-size:90px 4px !important;background-repeat:no-repeat !important;background-position:center bottom !important;border:1px solid ' + P.line + ' !important;border-radius:24px;border-spacing:0 !important}',
    'table.bz-hdr > tbody,table.bz-hdr > tbody > tr{display:block;width:100%}',
    'table.bz-hdr td{display:block;box-sizing:border-box;width:100% !important;padding:0 !important;border:0 !important;text-align:center !important;background:transparent !important}',
    'table.bz-hdr td > a,table.bz-hdr td > a > img{display:block;margin:0 auto}',
    'table.bz-hdr img{width:auto !important;max-width:70% !important;height:auto !important;max-height:140px;margin:0 auto 18px !important;border-radius:14px}',
    'table.bz-hdr hr{display:none}',
    '.bz-brand{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px 14px;font-size:30px;font-weight:700;line-height:1.25;color:' + P.tx + '}',
    '.bz-brand i{display:block;width:8px;height:8px;border-radius:50%;background:' + P.gold + ';flex:none}',
    'ul.bz-topnav{display:flex !important;flex-wrap:nowrap;gap:12px;box-sizing:border-box;width:100% !important;min-width:0 !important;max-width:100%;contain:none;margin:20px 0 0 !important;padding:2px 0 8px !important;list-style:none !important;overflow-x:auto;overflow-y:hidden;text-align:left}',
    'ul.bz-topnav > li{display:block !important;flex:none;float:none !important;position:static !important;width:auto !important;margin:0 !important;padding:0 !important;border:0 !important;background:none !important;list-style:none !important;scroll-snap-align:center}',
    'ul.bz-topnav ul{display:none !important}',
    'ul.bz-topnav > li > a{display:flex !important;align-items:center;box-sizing:border-box;min-height:84px;padding:0 34px !important;border-radius:999px !important;background:' + P.s2 + ' !important;border:1px solid ' + P.line + ' !important;color:' + P.mu + ' !important;font-size:30px !important;font-weight:700 !important;line-height:1.2;text-decoration:none !important;white-space:nowrap}',
    'ul.bz-topnav > li > a.bz-on{background:' + GRAD + ' !important;border-color:transparent !important;color:' + P.fg + ' !important;box-shadow:0 4px 14px rgba(0,0,0,.4)}',
    // форма «Введите номер заказа»
    'form.bz-ordform{display:block;box-sizing:border-box;width:100%;margin:8px 0 34px;padding:26px 26px 28px;background:' + P.s1 + ';border:1px solid ' + P.line + ';border-left:8px solid ' + P.gold + ';border-radius:24px;text-align:left}',
    'form.bz-ordform br{display:none}',
    'form.bz-ordform table,form.bz-ordform tbody,form.bz-ordform tr,form.bz-ordform td{display:block !important;box-sizing:border-box;width:100% !important;margin:0 !important;padding:0 !important;border:0 !important;border-spacing:0 !important;background:transparent !important}',
    'form.bz-ordform .bz-ordh{display:block;margin:0 0 22px !important;font-size:34px !important;font-weight:700 !important;line-height:1.25;text-align:left !important;color:' + P.tx + ' !important}',
    '.bz-lab{margin:0 0 10px;font-size:22px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + P.mu + '}',
    'form.bz-ordform input.bz-ordin{display:block;width:100% !important;height:108px;margin:0 0 24px !important;font-size:46px !important;font-weight:600 !important;letter-spacing:.04em;text-align:left}',
    '.bz-seg{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:0 0 30px}',
    'button.bz-chip{display:flex;align-items:center;justify-content:center;gap:10px;min-width:0;min-height:96px;padding:0 20px;border-radius:18px;font-family:inherit;font-size:27px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:rgb(var(--c));background:rgba(var(--c),.14);border:2px solid rgba(var(--c),.55);cursor:pointer;-webkit-appearance:none;appearance:none}',
    'button.bz-chip.on{background:rgb(var(--c));color:#10131a;border-color:rgb(var(--c));box-shadow:0 4px 14px rgba(0,0,0,.4)}',
    'button.bz-chip.on::before{content:"";width:12px;height:22px;margin:-6px 4px 0 0;border-right:4px solid #10131a;border-bottom:4px solid #10131a;transform:rotate(40deg) scale(.8)}',
    'form.bz-ordform input.bz-go{display:block;width:100% !important;height:108px !important;margin:0 !important;font-size:38px !important;letter-spacing:.06em}',
    'select.bz-hide{display:none !important}',
    'input.bz-search{display:block;width:100% !important;height:92px;margin:0 0 18px !important;font-size:34px !important;font-weight:500 !important}',
    '.bz-listh{margin:6px 0 14px !important;font-size:26px !important;font-weight:700 !important;letter-spacing:.12em;text-transform:uppercase;text-align:left !important;color:' + P.mu + ' !important}',
    '.bz-listh b{color:' + P.gold + '}',
    '.bz-listh.bz-act{margin:6px 0 4px !important}',
    '.bz-actd{font-weight:500;letter-spacing:.04em;text-transform:none;color:' + P.mu + '}',
    '.bz-empty{padding:28px 10px;text-align:center;font-size:28px;color:' + P.mu + '}',
    // страница входа
    'body.bz-loginpg{text-align:center}',
    'img.bz-lglogo{display:block;box-sizing:content-box;width:auto !important;max-width:62% !important;height:auto !important;max-height:150px;margin:36px auto 26px !important;padding:16px 28px;background:#fff;border-radius:22px}',
    '.bz-lgh{display:block;margin:0 0 28px !important;font-size:38px !important;font-weight:800 !important;line-height:1.25;color:' + P.gold2 + ' !important;text-align:center !important}',
    '.bz-login{display:block;box-sizing:border-box;width:100%;max-width:820px;margin:0 auto 34px;padding:30px 28px 34px;background:' + P.s1 + ';border:1px solid ' + P.line + ';border-left:8px solid ' + P.gold + ';border-radius:24px;text-align:left}',
    '.bz-login br{display:none}',
    '.bz-login table,.bz-login tbody,.bz-login tr,.bz-login td,.bz-login th{display:block !important;box-sizing:border-box;width:100% !important;margin:0 !important;padding:0 !important;border:0 !important;border-spacing:0 !important;background:transparent !important}',
    'table.bz-login{padding:30px 28px 34px !important;background:' + P.s1 + ' !important}',
    '.bz-login .bz-rx{display:none !important}',
    '.bz-login .bz-lab{margin:18px 0 10px !important;text-align:left !important;font-size:22px !important;font-weight:700 !important;letter-spacing:.1em;text-transform:uppercase;color:' + P.mu + ' !important}',
    '.bz-login input[type=text],.bz-login input[type=email],.bz-login input[type=password],.bz-login input:not([type]){display:block;width:100% !important;height:104px;margin:0 0 6px !important;font-size:40px !important}',
    '.bz-pw{position:relative}',
    '.bz-pw input{padding-right:120px !important}',
    'button.bz-pwb{position:absolute;right:6px;top:0;display:flex;align-items:center;justify-content:center;width:100px;height:104px;margin:0;padding:0;background:none;border:0;color:' + P.mu + ';font-size:34px;cursor:pointer}',
    '.bz-login .bz-lgo{display:block;width:100% !important;height:108px !important;margin:28px 0 0 !important;font-size:38px !important;letter-spacing:.06em}',
    // правка «Доступно на полке»
    '.bz-avl{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px;min-width:0}',
    '#editArea{margin-top:16px !important;padding:18px;background:' + P.s1 + ';border:1px solid ' + P.line + ';border-radius:22px}',
    '#editArea input[type=text]{display:block;width:100% !important;box-sizing:border-box;height:96px;margin:0 0 14px !important;font-size:38px !important}',
    '#editArea button{height:88px;margin:0 12px 0 0 !important;padding:0 32px !important;font-size:30px !important}',
    'body.bz-paint tr.bz-r > td,body.bz-paint tr.bz-d > td,body.bz-paint table.bz-item td{cursor:pointer}',
    // таблицы-списки: та же таблица, что и на сайте, но аккуратная: своя прокрутка, закреплённый первый столбец
    '.bz-tw{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 0 24px;background:' + P.s1 + ';border:1px solid ' + P.line + ';border-radius:20px}',
    'table.bz-rt{display:table;width:max-content;min-width:100%;margin:0;border-collapse:separate !important;border-spacing:0 !important;border:0 !important;background:none !important}',
    'table.bz-rt td{border:0 !important;border-bottom:1px solid ' + P.line + ' !important;text-align:left !important;vertical-align:middle}',
    'table.bz-rt tr:last-child > td{border-bottom:0 !important}',
    'table.bz-rt tr.bz-rh > td{padding:18px 20px !important;background:' + P.s2 + ' !important;font-size:20px !important;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:' + P.mu + ' !important;vertical-align:bottom;min-width:110px;border-bottom:1px solid #343a44 !important}',
    'table.bz-rt tr.bz-rr > td{padding:18px 20px !important;background-color:' + P.s1 + ' !important;background-image:linear-gradient(rgba(var(--c),.08),rgba(var(--c),.08)) !important;font-size:26px;font-weight:500;line-height:1.25;color:' + P.tx + ' !important;white-space:nowrap}',
    'table.bz-rt tr.bz-rr > td.bz-rx{color:' + P.dim2 + ' !important}',
    'table.bz-rt tr.bz-rr > td.bz-rw{font-weight:700}',
    'table.bz-rt tr.bz-rr > td.bz-rc{white-space:normal;min-width:220px;color:' + P.mu + ' !important}',
    'table.bz-rt tr.bz-rr > td.bz-ra{white-space:normal;min-width:200px}',
    'table.bz-rt td.bz-ra hr,table.bz-rt td.bz-ra br{display:none !important}',
    'table.bz-rt tr > td:first-child{position:sticky;left:0;z-index:2;box-shadow:inset 6px 0 0 rgb(var(--c,142,147,156)),8px 0 10px -8px rgba(0,0,0,.7)}',
    'table.bz-rt tr.bz-rh > td:first-child{box-shadow:8px 0 10px -8px rgba(0,0,0,.7)}',
    'table.bz-rt tr.bz-rr > td.bz-rk{font-family:' + MONO + ';font-size:26px;font-weight:700;color:' + P.gold2 + ' !important;padding-left:30px !important}',
    '.bz-pill{display:inline-block;padding:5px 16px;border-radius:999px;font-size:20px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;background:rgba(var(--c),.2);border:1px solid rgba(var(--c),.55);color:rgb(var(--c))}',
    'tr.bz-rr .bz-pill{--c:inherit}',
    'a.bz-ab{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-height:58px;margin:4px 6px 4px 0;padding:0 20px;border-radius:14px;background:rgba(var(--c),.14);border:2px solid rgba(var(--c),.55);color:rgb(var(--c)) !important;font-size:21px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;text-decoration:none !important;white-space:nowrap}',
    'a.bz-ab:active{background:rgba(var(--c),.3)}',
    'table.bz-rt tr.bz-rf > td{padding:12px 14px !important;background:' + P.bar + ' !important;min-width:130px;white-space:nowrap}',
    'table.bz-rt tr.bz-rf input:not([type=submit]):not([type=button]),table.bz-rt tr.bz-rf select{display:block;width:100% !important;min-width:120px;height:68px;margin:0 !important;font-size:24px !important}',
    'table.bz-rt tr.bz-rf input[type=submit]{height:68px;padding:0 26px !important;font-size:24px !important}',
    // ссылки-вкладки над списком
    '.bz-tabs{display:flex !important;flex-wrap:wrap;gap:12px;margin:8px 0 22px !important;text-align:left !important}',
    'a.bz-tab{display:inline-flex;align-items:center;justify-content:center;flex:1 1 auto;box-sizing:border-box;min-height:72px;padding:0 24px;border-radius:999px;background:rgba(var(--c),.1);border:2px solid rgba(var(--c),.45);color:rgb(var(--c)) !important;font-size:24px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;text-decoration:none !important;white-space:nowrap}',
    'a.bz-tab b,a.bz-tab strong{font-weight:800;color:inherit !important}',
    'a.bz-tab.on{background:rgba(var(--c),.28);border-color:rgb(var(--c))}',
    // формы загрузки и «две колонки»
    'form.bz-up{display:block;box-sizing:border-box;width:100%;margin:6px 0 24px;padding:26px 26px 28px;background:' + P.s1 + ';border:1px solid ' + P.line + ';border-left:8px solid ' + P.gold + ';border-radius:24px;text-align:left}',
    'form.bz-up br{display:none}',
    'form.bz-up table,form.bz-up tbody,form.bz-up tr,form.bz-up td{display:block !important;box-sizing:border-box;width:100% !important;margin:0 !important;padding:0 !important;border:0 !important;border-spacing:0 !important;background:transparent !important}',
    'form.bz-up td.bz-rx{display:none !important}',
    'form.bz-up .bz-uph,.bz-colc .bz-uph{display:block;margin:0 0 20px !important;font-size:30px !important;font-weight:700 !important;line-height:1.25;color:' + P.tx + ' !important;text-align:left !important}',
    'form.bz-up .bz-lab{margin:14px 0 10px !important;text-align:left !important;font-size:22px !important;font-weight:700 !important}',
    'form.bz-up select,form.bz-up input[type=text],form.bz-up input[type=date],form.bz-up input[type=file]{display:block;width:100% !important;box-sizing:border-box;height:92px;margin:0 0 6px !important;font-size:32px !important}',
    'form.bz-up input[type=submit]{display:block;width:100% !important;height:104px !important;margin:22px 0 0 !important;font-size:36px !important;letter-spacing:.06em}',
    'input[type=date]:not(.bz){background:' + P.s2 + ' !important;color:' + P.tx + ' !important;border:2px solid ' + P.ln2 + ' !important;border-radius:14px !important;padding:.3em .6em !important;color-scheme:dark;font-family:inherit}',
    'input[type=file]:not(.bz){height:auto !important;padding:22px !important;background:' + P.s2 + ' !important;color:' + P.mu + ' !important;border:2px dashed ' + P.ln4 + ' !important;border-radius:18px !important;font-size:26px !important}',
    'input[type=file]::file-selector-button{margin:0 22px 0 0;padding:18px 30px;border:0;border-radius:14px;background:' + GRAD + ';color:' + P.fg + ';font-family:inherit;font-size:26px;font-weight:800;cursor:pointer}',
    'table.bz-cols{display:block;width:100% !important;margin:0;border:0 !important;border-spacing:0 !important}',
    'table.bz-cols > tbody,table.bz-cols tr{display:block;width:100%}',
    'table.bz-cols td{display:block;box-sizing:border-box;width:100% !important;padding:0 !important;border:0 !important;background:transparent !important}',
    'table.bz-cols td.bz-rx{display:none !important}',
    'table.bz-cols td.bz-colc{margin:0 0 20px;padding:26px 26px 28px !important;background:' + P.s1 + ' !important;border:1px solid ' + P.line + ' !important;border-left:8px solid ' + P.gold + ' !important;border-radius:24px}',
    'table.bz-cols td.bz-colc br{display:none}',
    'table.bz-cols td.bz-colc form.bz-up{margin:0;padding:0;background:none;border:0;border-radius:0}',
    // блок «Внимание»
    '.bz-alert{display:block;box-sizing:border-box;margin:6px 0 24px !important;padding:24px 26px !important;background:rgba(229,138,132,.07);border:1px solid rgba(229,138,132,.35);border-left:8px solid ' + P.err + ';border-radius:22px;font-size:27px;line-height:1.4;color:' + P.mu + '}',
    '.bz-alert *{font-size:inherit !important}',
    '.bz-alert .bz-alh{display:block;margin:0 0 16px;font-size:28px !important;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:' + P.err + ' !important}',
    '.bz-alert .bz-ali{padding:14px 0;border-top:1px solid ' + P.line + '}',
    '.bz-alert .bz-ali b,.bz-alert .bz-ali i{font-style:normal;color:' + P.tx + '}',
    '.bz-alert b[style*="red" i]{color:' + P.err + ' !important}',
    // главная: панель
    'body.bz-dash ul.nav-tabs{display:flex !important;flex-wrap:wrap;gap:12px;margin:0 0 24px !important;padding:0 !important;border:0 !important;list-style:none}',
    'body.bz-dash ul.nav-tabs > li{display:block;margin:0 !important;float:none !important}',
    'body.bz-dash .nav-link{display:flex !important;align-items:center;box-sizing:border-box;min-height:84px;padding:0 34px !important;border-radius:999px !important;background:' + P.s2 + ' !important;border:1px solid ' + P.line + ' !important;color:' + P.mu + ' !important;font-family:inherit !important;font-size:28px !important;font-weight:700 !important}',
    'body.bz-dash .nav-link.active{background:' + GRAD + ' !important;border-color:transparent !important;color:' + P.fg + ' !important}',
    'body.bz-dash center{display:block;text-align:left}',
    'form.bz-dform{display:flex;flex-wrap:wrap;gap:14px;margin:0 0 26px}',
    'form.bz-dform select,form.bz-dform input[name=date]{flex:1 1 calc(50% - 14px);min-width:0;height:92px;margin:0 !important;font-size:30px !important;text-align:left !important}',
    'form.bz-dform input[type=submit]{flex:1 1 100%;height:100px;margin:0 !important;font-size:34px !important;letter-spacing:.06em}',
    'body.bz-dash table.bz-skip{border:0 !important;border-spacing:0 !important}',
    'body.bz-dash table.bz-grid{display:block;width:100% !important}',
    'body.bz-dash table.bz-grid > tbody,body.bz-dash table.bz-grid > tbody > tr{display:block;width:100%}',
    'body.bz-dash table.bz-grid > tbody > tr > td{display:block;box-sizing:border-box;width:100% !important;margin:0 0 20px;padding:24px !important;background:' + P.s1 + ' !important;border:1px solid ' + P.line + ' !important;border-radius:22px;overflow-x:auto;-webkit-overflow-scrolling:touch}',
    'body.bz-dash table.bz-grid td > h2,body.bz-dash table.bz-grid td > h3{margin:0 0 18px !important;font-size:26px !important;font-weight:700 !important;letter-spacing:.1em;text-transform:uppercase;color:' + P.mu + ' !important}',
    'body.bz-dash table.bz-skip:not(.bz-grid) td{padding:10px 12px !important;border:0 !important;border-bottom:1px solid ' + P.line + ' !important;font-size:26px !important;vertical-align:middle;color:' + P.tx + ' !important}',
    'body.bz-dash table.bz-skip:not(.bz-grid) tr:last-child td{border-bottom:0 !important}',
    'body.bz-dash table.bz-chart td{padding:6px 5px !important;font-size:20px !important;text-align:center;white-space:nowrap}',
    'body.bz-dash img.bz-bar{height:18px !important;border-radius:9px;max-width:100%}',
    'body.bz-dash table.bz-chart img.bz-bar{border-radius:6px 6px 0 0;height:auto;min-height:3px}',
    'table.bz-stat{display:table;width:max-content;min-width:100%;border-collapse:separate !important;border-spacing:0 !important}',
    'table.bz-stat tr:first-child td,table.bz-stat tr:first-child th{font-size:20px !important;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:' + P.mu + ' !important;white-space:normal !important;min-width:140px;vertical-align:bottom}',
    'table.bz-stat td{white-space:nowrap;text-align:right}',
    'table.bz-stat td:first-child{position:sticky;left:0;z-index:1;text-align:left;font-weight:700;background:' + P.s1 + ' !important;box-shadow:6px 0 10px -6px rgba(0,0,0,.6)}',
    'table.bz-stat td.bz-pos{color:#58b08a !important}',
    'table.bz-stat td.bz-neg{color:' + P.err + ' !important}',
    'body.bz-dash .monthly-metric-summary{display:flex;flex-wrap:wrap;gap:18px 28px;margin-top:18px;font-size:28px;line-height:1.5;color:' + P.mu + '}',
    'body.bz-dash .monthly-metric-summary > div{flex:1 1 300px}',
    '#bz-bar *::-webkit-scrollbar{display:none}'
  ].concat(PORD.map(function (k) {
    var c = PAL[k].c, g = 'linear-gradient(rgba(' + c + ',' + AL + '),rgba(' + c + ',' + AL + '))';
    return 'tr.bz-m-' + k + ' > td{background-image:' + g + ' !important}' +
      'table.bz-item td.bz-c-name.bz-m-' + k + '{background:rgba(' + c + ',' + AL + ') !important;border-radius:22px;padding:18px 24px !important}' +
      'table.bz-item td.bz-c-meta.bz-m-' + k + '{background-image:' + g + ' !important}' +
      '.bz-head.bz-m-' + k + '{background-image:' + g + ' !important}';
  })).concat(Object.keys(MENUICO).map(function (k) {
    return 'input:not(.bz).bz-menu.bz-i-' + k + '[type=button],input:not(.bz).bz-menu.bz-i-' + k + '[type=submit],button:not(.bz).bz-menu.bz-i-' + k + '{padding-left:132px !important;background-image:' + svgUri(MENUICO[k], PALS[st.theme].gold) + ',' + svgUri('<path d="M9 4l8 8-8 8"/>', PALS[st.theme].gold, 3) + ' !important;background-position:left 40px center,right 36px center !important;background-size:48px,24px !important;background-repeat:no-repeat !important}';
  })).join('');
  // ---------- Яркая тема «Инфографика»: светлые карточки, цветные глянцевые полосы, мягкие тени ----------
  var H = 'html[data-bz=pop] ';
  css.textContent += [
    H + '{background:linear-gradient(180deg,#c9d9e2 0%,#a9bfcc 60%,#9db5c3 100%) fixed !important}',
    H + 'body{background:transparent !important}',
    // карточки списка документов
    H + '.bz-doc{position:relative;padding:28px 28px 24px 74px;border:1px solid #fff;border-radius:38px;background:linear-gradient(135deg,#ffffff 0%,#eef1f4 100%);box-shadow:0 18px 34px -8px rgba(55,85,105,.32),0 2px 0 #fff inset}',
    H + '.bz-doc{border-left:1px solid #fff}',
    H + '.bz-doc::before{content:"";position:absolute;left:26px;top:26px;bottom:26px;width:20px;border-radius:99px;background:linear-gradient(180deg,rgba(var(--c),1),rgba(var(--c),.62));box-shadow:inset 0 5px 6px rgba(255,255,255,.55),0 4px 8px rgba(var(--c),.35)}',
    H + '.bz-dshop{font-size:42px;font-weight:600;color:#4a525d}',
    H + '.bz-dmeta{color:#8a929c}',
    H + '.bz-dmeta a,' + H + '.bz-dmeta b{color:rgb(var(--c)) !important}',
    H + '.bz-badge{background:#fff;border:1px solid rgba(var(--c),.6);color:rgb(var(--c)) !important;box-shadow:0 3px 8px rgba(55,85,105,.15)}',
    H + '.bz-types a{border:0;border-radius:22px;background:linear-gradient(180deg,rgba(var(--c),1),rgba(var(--c),.74));color:#fff !important;text-shadow:0 1px 2px rgba(0,0,0,.25);box-shadow:0 8px 14px -4px rgba(var(--c),.55),inset 0 3px 3px rgba(255,255,255,.35)}',
    H + '.bz-types a:active{filter:brightness(.92);background:linear-gradient(180deg,rgba(var(--c),.9),rgba(var(--c),.7))}',
    // верх страницы и списки
    H + '.bz-listh,' + H + '.bz-listh b{color:#4a525d !important}',
    H + '.bz-listh b{color:' + P.gold + ' !important}',
    H + '.bz-t .bz-ts{color:#4a525d !important;font-weight:700 !important}',
    H + '.bz-t .bz-tc b,' + H + '.bz-t .bz-tn b{color:' + P.gold + ' !important}',
    H + '.bz-t .bz-tn{color:#7e8791 !important}',
    // таблица товаров: белые «таблетки» со строкой-цветом
    H + 'tr.bz-r > td{background-image:linear-gradient(180deg,#ffffff,#eef1f4) !important;color:#3b4350 !important;box-shadow:0 10px 16px -10px rgba(55,85,105,.45)}',
    H + 'tr.bz-r > td:first-child{border-radius:26px 0 0 26px;font-size:34px;font-weight:300;color:#b3bbc3 !important;box-shadow:inset 12px 0 0 #c1c9d1,0 10px 16px -10px rgba(55,85,105,.45)}',
    H + 'tr.bz-r > td:last-child{border-radius:0 26px 26px 0}',
    H + 'tr.bz-r > td:nth-child(2) a{color:#b13a96 !important}',
    H + 'tr.bz-r > td:nth-child(5){color:#9aa2ab !important}',
    H + 'tr.bz-s-red > td:first-child{box-shadow:inset 12px 0 0 #ff4040}',
    H + 'tr.bz-s-amb > td:first-child{box-shadow:inset 12px 0 0 #ff9a0a}',
    H + 'tr.bz-s-grn > td:first-child{box-shadow:inset 12px 0 0 #2fbf8f}',
    H + 'tr.bz-s-blu > td:first-child{box-shadow:inset 12px 0 0 #4aa0f0}',
    H + 'tr.bz-s-red > td,' + H + 'tr.bz-s-amb > td,' + H + 'tr.bz-s-grn > td,' + H + 'tr.bz-s-blu > td{background-image:linear-gradient(180deg,#ffffff,#eef1f4) !important}',
    H + 'tr.bz-h td,' + H + 'tr.bz-h th{color:#566170 !important}',
    // блоки, формы, поля
    H + '.bz-note,' + H + '.bz-prompt,' + H + 'table.bz-scanbox,' + H + 'table.bz-addbox,' + H + 'form.bz-ordform,' + H + 'table.bz-hdr,' + H + '.bz-head,' + H + '.bz-qty,' + H + 'table.bz-data,' + H + 'table.bz-item td.bz-c-meta,' + H + 'table.bz-item td.bz-c-qty,' + H + 'table.bz-item tr.bz-r-data{border-color:#fff !important;border-radius:34px;box-shadow:0 16px 30px -10px rgba(55,85,105,.3);background-image:none}',
    H + 'form.bz-ordform{border-left:1px solid #fff !important}',
    H + 'a.bz-addbtn{background:#fff;border:2px solid #ff9a0a;color:#c26a00 !important;border-radius:30px;box-shadow:0 12px 22px -10px rgba(255,154,10,.55)}',
    H + 'input:not(.bz)[type=text],' + H + 'input:not(.bz):not([type]),' + H + 'input:not(.bz)[type=number],' + H + 'input:not(.bz)[type=search],' + H + 'input:not(.bz)[type=tel],' + H + 'input:not(.bz)[type=password],' + H + 'select:not(.bz){background-color:#fff !important;border-color:#cdd7de !important;color:#3b4350 !important;border-radius:22px !important;box-shadow:inset 0 3px 6px rgba(55,85,105,.12)}',
    H + 'input:not(.bz)[type=submit],' + H + 'input:not(.bz)[type=button],' + H + 'button:not(.bz){border-radius:26px !important;text-shadow:0 1px 2px rgba(0,0,0,.22);box-shadow:0 10px 16px -6px rgba(239,129,0,.6),inset 0 3px 3px rgba(255,255,255,.4) !important}',
    H + 'input:not(.bz).bz-sec[type=button],' + H + 'input:not(.bz).bz-sec[type=submit],' + H + 'button:not(.bz).bz-sec{background:#fff !important;color:#4a525d !important;border:2px solid #cdd7de !important;text-shadow:none;box-shadow:0 8px 14px -8px rgba(55,85,105,.4) !important}',
    H + 'button.bz-chip{background:#fff;border:0;color:#4a525d;border-radius:24px;box-shadow:0 10px 16px -8px rgba(55,85,105,.4)}',
    H + 'button.bz-chip.on{background:linear-gradient(180deg,rgba(var(--c),1),rgba(var(--c),.76));color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.25);box-shadow:0 10px 16px -6px rgba(var(--c),.6),inset 0 3px 3px rgba(255,255,255,.35)}',
    H + 'button.bz-chip.on::before{border-color:#fff}',
    H + 'input:not(.bz).bz-menu[type=button],' + H + 'input:not(.bz).bz-menu[type=submit],' + H + 'button:not(.bz).bz-menu{background-color:#fff !important;color:#4a525d !important;border:1px solid #fff !important;border-radius:34px !important;text-shadow:none;box-shadow:0 16px 28px -10px rgba(55,85,105,.38) !important}',
    // верхние вкладки
    H + 'table.bz-topnav td,' + H + 'ul.bz-topnav > li > a{background:#fff !important;border-color:#fff !important;color:#6b7480 !important;box-shadow:0 8px 14px -8px rgba(55,85,105,.4)}',
    H + 'table.bz-topnav td.bz-on,' + H + 'ul.bz-topnav > li > a.bz-on,' + H + 'div.bz-topnav > .bz-on{background:linear-gradient(180deg,#ffb92e,#ef8100) !important;color:#fff !important}',
    H + 'table.bz-topnav td.bz-on *{color:#fff !important}',
    // цветные акценты в теме: заголовки, типы заказа, плашки
    H + '.bz-h1{color:#4a525d !important}',
    H + '.bz-tp{box-shadow:0 6px 10px -4px rgba(55,85,105,.35)}',
    // таблицы-списки документов
    H + 'table.bz-rt td,' + H + 'table.bz-rt th{border-color:#e1e8ed !important}',
    H + '.bz-tw{background:#fff;border-radius:30px;border:1px solid #fff;box-shadow:0 16px 30px -10px rgba(55,85,105,.3)}'
  ].join('\n');
  function whenRoot(fn) {
    if (document.documentElement) { fn(); return; }
    var mo = new MutationObserver(function () { if (document.documentElement) { mo.disconnect(); fn(); } });
    mo.observe(document, { childList: true });
  }
  if (!PALS[st.theme]) { st.theme = 'dark'; }
  var cssv = document.createElement('style');
  cssv.id = 'bz-vars';
  cssv.textContent = ':root{' + Object.keys(PALS.dark).map(function (k) { return '--bz-' + k + ':' + PALS.dark[k] + ';'; }).join('') + '}' +
    'html[data-bz=light]{' + Object.keys(PALS.light).map(function (k) { return '--bz-' + k + ':' + PALS.light[k] + ';'; }).join('') + 'color-scheme:light}' +
    'html[data-bz=pop]{' + Object.keys(PALS.pop).map(function (k) { return '--bz-' + k + ':' + PALS.pop[k] + ';'; }).join('') + 'color-scheme:light}';
  whenRoot(function () {
    var hd = document.head || document.documentElement;
    hd.appendChild(cssv); hd.appendChild(css); css.disabled = !st.dark;
    document.documentElement.setAttribute('data-bz', st.theme);
  });
  function themeColor() {
    var m = document.querySelector('meta[name=theme-color]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; (document.head || document.documentElement).appendChild(m); }
    m.content = st.dark ? PALS[st.theme].bar : '#ffffff';
  }

  // ---------- Вспомогательное ----------
  // Товары на вес: 45 g, 45G, 45g, 1.5 kg, 250 гр, 2 кг и т.п.
  var WRE = /(?:^|[^\p{L}\d])\d+(?:[.,]\d+)?\s*(?:kg|gr|g|кг|гр|г)(?![\p{L}\d])/iu;
  // Напитки: 330 ml, 1.5 L, 0,5л, bot., can., бут. и т.п.
  var VRE = /(?:^|[^\p{L}\d])\d+(?:[.,]\d+)?\s*(?:ml|cl|dl|ltr|lt|l|мл|л)(?![\p{L}\d])/iu;
  // «kg» отдельным словом в конце названия: BANANAS KG, Kg, (кг)
  var WEND = /(?:^|[^\p{L}\d])(?:kg|кг)\)?\.?\s*$/iu;
  // Вино: слово WINE и объём (L, ml и т.п.) — фиолетовая подсветка.
  var WINE = /(?:^|[^\p{L}])(?:wine|вино)(?![\p{L}])/iu;
  var BRE = /(?:^|[^\p{L}])(?:bot|btl|bottle|can|бут|бутылка|банка)\.?(?![\p{L}])/iu;
  // Возвращает класс подсветки: bz-w (на вес), bz-v (напитки) или пустую строку. Если есть оба признака, берётся тот, что в названии раньше.
  function hlKind(t) {
    try {
      if (WINE.test(t) && (VRE.test(t) || BRE.test(t))) { return 'bz-p'; }
      var w = WRE.exec(t), w2 = WEND.exec(t), v = VRE.exec(t), b = BRE.exec(t);
      if (w2 && (!w || w2.index < w.index)) { w = w2; }
      var vi = v ? v.index : (b ? b.index : -1);
      if (b && v) { vi = Math.min(v.index, b.index); }
      var wi = w ? w.index : -1;
      if (wi < 0 && vi < 0) { return ''; }
      if (wi < 0) { return 'bz-v'; }
      if (vi < 0) { return 'bz-w'; }
      return wi <= vi ? 'bz-w' : 'bz-v';
    } catch (e) { return ''; }
  }
  function tx(x) { return x.textContent.trim().replace(/\s+/g, ' '); }
  function isProd(tr) {
    var td = tr.children;
    return td.length === 5 && /^\d+$/.test(tx(td[0])) && !tr.querySelector('table') && !tr.closest('table.bz-docsrc');
  }
  var coll = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });
  var D = { div: 'block', span: 'inline', button: 'inline-flex' };
  function mk(tag, css2, text) {
    var e = document.createElement(tag);
    e.style.cssText = 'all:initial;display:' + (D[tag] || 'block') + ';box-sizing:border-box;margin:0;font:inherit;color:inherit;' + (css2 || '');
    if (text !== undefined) { e.textContent = text; }
    return e;
  }
  function btn(label) {
    var b = mk('button', 'align-items:center;justify-content:center;font:inherit;font-weight:600;min-height:2.6em;padding:0 1em;border-radius:.8em;cursor:pointer;white-space:nowrap;flex:none;border:1px solid ' + P.line + ';background:' + P.s2 + ';color:' + P.tx + ';-webkit-tap-highlight-color:transparent;', label);
    b.type = 'button';
    b.className = 'bz';
    return b;
  }
  function clean(u) {
    var url = new URL(u, location.href);
    ['action', 'barcode', 'code_next', 'code', 'count'].forEach(function (p) { url.searchParams.delete(p); });
    return url;
  }
  function hueClass(rgb) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || '');
    if (!m) { return ''; }
    var r = +m[1] / 255, g = +m[2] / 255, b = +m[3] / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (d < 0.08) { return ''; }
    var h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    if (h < 20 || h >= 340) { return 'bz-s-red'; }
    if (h < 70) { return 'bz-s-amb'; }
    if (h < 170) { return 'bz-s-grn'; }
    if (h < 270) { return 'bz-s-blu'; }
    return '';
  }

  // ---------- Значки ----------
  var ICO = {
    up: '<path d="M6 14.5l6-6 6 6"/>',
    down: '<path d="M6 9.5l6 6 6-6"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4.5v4.6h-4.6"/>',
    moon: '<path d="M20.2 14.2A8.2 8.2 0 0 1 9.8 3.8a8.2 8.2 0 1 0 10.4 10.4z"/>',
    sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3 3.2 15 0 18M12 3c-3.2 3-3.2 15 0 18"/>',
    theme: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
    eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
    sort: '<path d="M7 4v16M7 20l-3.2-3.2M7 20l3.2-3.2M17 20V4M17 4l-3.2 3.2M17 4l3.2 3.2"/>',
    top: '<path d="M12 19.5v-14M6 11.5l6-6 6 6"/>'
  };
  function ico(name, size) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2.2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.style.cssText = 'display:block;width:' + (size || '1.35em') + ';height:' + (size || '1.35em') + ';flex:none;pointer-events:none;';
    s.innerHTML = ICO[name];
    return s;
  }
  function setIco(el, name, size) { el.textContent = ''; el.appendChild(ico(name, size)); }

  // ---------- Панель ----------
  var K = 1, bar, tools, chips, stats, statRow, last, bDark, bRef, bCol, bLang, bTheme, fab, sbtn = {};
  var skeys = [['color', 'Цвет'], ['n', '№'], ['code', 'Код'], ['name', 'Название'], ['need', 'Надо'], ['have', 'Есть']], bSort, sortOpen = false;
  var hasTable = false, hasItem = false, palRow, bPal, bExp, hint, swb = {}, ft = 0;

  function calcK() {
    var touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!touch) { return 1; }
    var vv = window.visualViewport, w = vv ? vv.width : window.innerWidth, sw = screen.width || w;
    return Math.min(4, Math.max(1, w / sw));
  }
  function fit() {
    if (!bar) { return; }
    K = calcK();
    bar.style.fontSize = (15 * K) + 'px';
    fab.style.fontSize = (15 * K) + 'px';
    var cs = getComputedStyle(document.body);
    var pt = parseFloat(cs.paddingTop) || 0, pr = parseFloat(cs.paddingRight) || 0, pl = parseFloat(cs.paddingLeft) || 0;
    var mt = parseFloat(cs.marginTop) || 0;
    bar.style.margin = '-' + (pt + mt) + 'px -' + pr + 'px ' + (pt ? Math.min(pt, 12 * K) : 0) + 'px -' + pl + 'px';
  }
  // Короткое сообщение в строке состояния, потом возвращается обычный текст.
  var toast;
  function flash(t) {
    if (!toast) {
      toast = mk('div', 'position:fixed;left:50%;bottom:1.1em;transform:translateX(-50%);z-index:2147483647;max-width:72%;padding:.6em 1.1em;border-radius:999px;background:' + P.s1 + ';border:1px solid ' + P.gold + ';color:' + P.gold2 + ';font:600 15px/1.3 "Segoe UI",Roboto,system-ui,Arial,sans-serif;text-align:center;box-shadow:0 .3em 1.2em rgba(0,0,0,.6);pointer-events:none;');
      document.body.appendChild(toast);
    }
    toast.style.fontSize = (15 * K) + 'px';
    toast.textContent = t; toast.style.display = 'block';
    clearTimeout(ft);
    ft = setTimeout(function () { toast.style.display = 'none'; }, 2000);
  }
  function say(t, err) { stats.textContent = t; stats.style.color = err ? P.err : P.mu; }
  function layout() {
    var lu = getLast();
    var showLast = !hasTable && !!lu && lu !== location.href;
    tools.style.display = (hasTable && sortOpen) ? 'block' : 'none';
    if (bSort) { bSort.style.display = hasTable ? 'inline-flex' : 'none'; bSort.style.borderColor = sortOpen ? P.gold : P.line; bSort.style.color = sortOpen ? P.gold2 : P.tx; }
    bCol.style.display = 'none';
    last.style.display = showLast ? 'inline-flex' : 'none';
    stats.style.display = hasTable ? 'block' : 'none';
    setIco(bCol, st.col ? 'down' : 'up');
    bCol.title = st.col ? 'Показать сортировку' : 'Свернуть';
    try {
      bar.style.marginLeft = ''; bar.style.width = '';
      var bl = document.body.getBoundingClientRect().left, de = document.documentElement, cw = st.dark ? de.clientWidth : Math.max(de.clientWidth, de.scrollWidth);
      bar.style.boxSizing = 'border-box'; var pl0 = parseFloat(getComputedStyle(document.body).paddingLeft) || 0; bar.style.marginLeft = (-(bl + pl0)) + 'px'; bar.style.width = cw + 'px';
    } catch (e) {}
    var can = (hasTable || hasItem) && st.dark;
    bPal.style.display = can ? 'inline-flex' : 'none';
    palRow.style.display = (can && paintOn) ? 'flex' : 'none';
    bPal.style.borderColor = paintOn ? P.gold : P.line;
    bar.style.borderBottomColor = paintOn ? P.gold : P.line;
  }
  function paintSw() {
    if (hint) { hint.textContent = st.tool === 'x' ? 'Ластик: убирает цвет' : 'Красим: ' + PAL[st.tool].n; }
    PORD.concat(['x']).forEach(function (k) {
      var on = st.tool === k, b = swb[k];
      b.style.borderColor = on ? P.gold2 : (k === 'x' ? P.ln3 : 'rgba(' + PAL[k].c + ',.75)');
      b.style.boxShadow = on ? '0 0 0 .16em rgba(214,179,106,.45)' : 'none';
      b.style.transform = on ? 'scale(1.07)' : 'none';
    });
  }
  function setPaint(on) {
    paintOn = on;
    document.body.classList.toggle('bz-paint', on);
    paintSw(); layout();
    if (!on && st.key === 'color') { apply(); }
    if (on) { flash('Выберите цвет и касайтесь товаров'); }
  }
  function setTool(k) {
    st.tool = k; save(); paintSw();
  }
  // Код товара под пальцем: строка списка, её строка с деталями или карточка товара.
  function codeAt(t) {
    if (!t || !t.closest) { return null; }
    var r = t.closest('tr.bz-r');
    if (r) { return tx(r.children[1]); }
    var d = t.closest('tr.bz-d');
    if (d && d.previousElementSibling && isProd(d.previousElementSibling)) { return tx(d.previousElementSibling.children[1]); }
    var it = t.closest('table.bz-item[data-bz-code]');
    if (it && t.closest('td.bz-c-name,td.bz-c-meta,td.bz-c-img,td.bz-c-txt,.bz-head,.bz-pic')) { return it.getAttribute('data-bz-code'); }
    return null;
  }
  function paintTap(code) {
    var t = st.tool, cur = MK.m[code], msg;
    if (t === 'x' || cur === t) {
      if (cur) { delete MK.m[code]; msg = code + ' — цвет убран'; } else { msg = code + ' — цвета нет'; }
    } else { MK.m[code] = t; msg = code + ' → ' + PAL[t].n; }
    var saved = saveMarks(); tintRows(); tintItems(); flash(saved ? msg : 'Не удалось сохранить отметку: браузер блокирует хранилище');
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
  }

  // ---------- Копирование скрипта с отметками ----------
  var HDR = ['// ==UserScript==', '// @name         Сортировка заказа Берёзка', '// @namespace    https://github.com/blooder9/my', '// @version      __V__', '// @description  Сортировка товаров заказа и аккуратное тёмное оформление страниц wms.berezka.cy. Рассчитано на телефон.', '// @match        https://wms.berezka.cy/*', '// @run-at       document-start', '// @grant        GM_setValue', '// @updateURL    https://raw.githubusercontent.com/blooder9/berezka-repository/main/berezka.js', '// @downloadURL  https://raw.githubusercontent.com/blooder9/berezka-repository/main/berezka.js', '// ==/UserScript=='].join('\n') + '\n';
  function buildSrc() {
    var ts = MK.ts || Date.now();
    var data = JSON.stringify({ ts: ts, m: MK.m }).replace(/\*\//g, '*\\/');
    var body = bzMain.toString().replace(/\/\*BZ\*\/[\s\S]*?\/\*ZB\*\//, function () { return '/*BZ*/' + data + '/*ZB*/'; });
    return HDR.replace('__V__', VER + '.' + Math.floor(ts / 1000)) + '(' + body + ')();\n';
  }
  function copyText(txt, ta) {
    function fallback() {
      ta.style.display = 'block'; ta.value = txt; ta.focus(); ta.select();
      try { ta.setSelectionRange(0, txt.length); } catch (e) {}
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(txt).then(function () { return true; }, function () { return fallback(); });
    }
    return Promise.resolve(fallback());
  }
  function closeModal() { var m = document.getElementById('bz-modal'); if (m) { m.remove(); } }
  function openExport() {
    closeModal();
    K = calcK();
    var ov = mk('div', 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483647;background:rgba(0,0,0,.74);display:flex;padding:1em;overflow:auto;color:' + P.tx + ';font:15px/1.4 "Segoe UI",Roboto,system-ui,Arial,sans-serif;-webkit-text-size-adjust:100%;');
    ov.id = 'bz-modal'; ov.style.fontSize = (15 * K) + 'px';
    var card = mk('div', 'width:100%;max-width:26em;margin:auto;background:' + P.s1 + ';border:1px solid ' + P.line + ';border-radius:1.1em;padding:1.1em;display:flex;flex-direction:column;gap:.8em;box-shadow:0 1em 3em rgba(0,0,0,.7);');
    var n = Object.keys(MK.m).length;
    var title = mk('div', 'font-size:1.15em;font-weight:700;color:' + P.gold2 + ';', 'Скрипт с вашими цветами');
    var info = mk('div', 'font-size:.9em;color:' + P.mu + ';', 'Отмечено товаров: ' + n + '. Скопируйте скрипт и вставьте его в Tampermonkey на другом устройстве вместо старого кода, затем сохраните.');
    var status = mk('div', 'font-size:.9em;min-height:1.4em;color:' + P.mu + ';');
    var ta = mk('textarea', 'display:none;width:100%;height:8em;padding:.6em;background:' + P.s2 + ';color:' + P.tx + ';border:1px solid ' + P.line + ';border-radius:.6em;font:.7em/1.3 ' + MONO + ';-webkit-user-select:text;user-select:text;resize:none;');
    ta.readOnly = true;
    var go = btn('Копировать скрипт');
    go.style.background = GRAD; go.style.color = P.fg; go.style.border = '0'; go.style.minHeight = '3em'; go.style.width = '100%';
    var row = mk('div', 'display:flex;gap:.5em;');
    var rst = btn('Сбросить отметки'); rst.style.flex = '1 1 0'; rst.style.padding = '0 .4em';
    var cls = btn('Закрыть'); cls.style.flex = '1 1 0'; cls.style.padding = '0 .4em';
    row.appendChild(rst); row.appendChild(cls);
    [title, info, go, status, ta, row].forEach(function (e) { card.appendChild(e); });
    ov.appendChild(card);
    go.addEventListener('click', function () {
      var txt = buildSrc();
      copyText(txt, ta).then(function (ok) {
        status.style.color = ok ? P.gold2 : P.err;
        status.textContent = ok ? 'Скопировано · ' + Math.round(txt.length / 1024) + ' КБ' : 'Не удалось скопировать сразу: текст выделен, нажмите «Копировать» во всплывающем меню.';
      });
    });
    var rt2 = 0;
    rst.addEventListener('click', function () {
      if (!rt2) {
        rst.textContent = 'Точно сбросить?'; rst.style.color = P.err; rst.style.borderColor = P.err;
        rt2 = setTimeout(function () { rt2 = 0; rst.textContent = 'Сбросить отметки'; rst.style.color = P.tx; rst.style.borderColor = P.line; }, 3000);
        return;
      }
      MK.m = {}; saveMarks(); tintRows(); tintItems(); closeModal(); flash('Отметки сброшены');
    });
    cls.addEventListener('click', closeModal);
    ov.addEventListener('click', function (e) { if (e.target === ov) { closeModal(); } });
    document.body.appendChild(ov);
  }
  function paint() {
    skeys.forEach(function (k) {
      var on = k[0] === st.key, b = sbtn[k[0]];
      b.__ar.textContent = '';
      if (on) { b.__ar.appendChild(ico(st.dir > 0 ? 'up' : 'down', '1em')); }
      b.style.borderColor = on ? P.gold : P.line;
      b.style.color = on ? P.gold2 : P.tx;
      b.style.background = on ? P.act : P.s2;
    });
    css.disabled = !st.dark;
    themeColor();
    setIco(bDark, st.dark ? 'moon' : 'sun');
    bDark.title = st.dark ? 'Вернуть оформление сайта' : 'Включить тёмное оформление';
    bDark.style.color = st.dark ? P.gold2 : P.tx;
    bDark.style.borderColor = st.dark ? P.gold : P.line;
    layout();
  }
  function setKey(k) {
    if (st.key === k) { st.dir = -st.dir; } else { st.key = k; st.dir = (k === 'need' || k === 'have') ? -1 : 1; }
    save(); paint(); apply();
  }
  // Цвет товара для сортировки: своя отметка, иначе автоподсветка (вес — оранжевый, напитки — голубой), иначе без цвета.
  function crank(u) {
    var m = MK.m[u.code];
    if (PAL[m]) { return PORD.indexOf(m); }
    if (u.kd === 'bz-p') { return PORD.indexOf('p'); }
    return u.kd === 'bz-w' ? 0 : u.kd === 'bz-v' ? 1 : 99;
  }
  // Основной цвет строки: своя отметка, иначе фиолетовый для вина. Красный (недобор) задаётся отдельно и действует только в этом заказе.
  function effCol(code, kd) {
    var m = MK.m[code]; if (PAL[m]) { return m; }
    return kd === 'bz-p' ? 'p' : '';
  }
  function num(v) { var x = parseFloat(String(v).replace(',', '.')); return x === x ? x : NaN; }
  function isShort(need, have, proc) { var n = num(need), h = num(have); if (h !== h) { h = 0; } return n === n && n > 0 && h < n && (h > 0 || !!proc); }
  function cmp(a, b) {
    var r, key = st.key;
    if (a.short !== b.short) { return a.short ? 1 : -1; }
    if (key === 'color') {
      r = crank(a) - crank(b);
      return r * st.dir || coll.compare(String(b.code), String(a.code)) || a.n - b.n;
    }
    if (key === 'name') { r = coll.compare(a.name, b.name); }
    else {
      var x = parseFloat(String(a[key]).replace(',', '.')), y = parseFloat(String(b[key]).replace(',', '.'));
      r = (x === x && y === y) ? x - y : coll.compare(String(a[key]), String(b[key]));
    }
    return r * st.dir || a.n - b.n;
  }

  var curUs = [], wcnt = 0, vcnt = 0, sumTxt = '', paintOn = false;
  function tl(w) { if (!st.lang) { return w; } var t = lmap(st.lang).m[lnorm(w)]; return t ? lcase(w, t) : w; }
  function statText() {
    var mc = curUs.filter(function (u) { return MK.m[u.code]; }).length;
    return sumTxt + (wcnt ? ' · ' + tl('Вес') + ' ' + wcnt : '') + (vcnt ? ' · ' + tl('Напитки') + ' ' + vcnt : '') + (mc ? ' · ' + tl('Цвет') + ' ' + mc : '');
  }
  // Цвет строки: ручная отметка важнее автоматической подсветки (вес / напитки).
  function tintRows() {
    curUs.forEach(function (u) {
      var m = effCol(u.code, u.kd);
      if (u.short) { m = 'r'; }   // недобор в этом заказе: вся строка красная, своя отметка в других заказах не меняется
      PORD.forEach(function (k) { u.row.classList.toggle('bz-m-' + k, k === m); });
      u.row.classList.toggle('bz-w', !m && u.kd === 'bz-w');
      u.row.classList.toggle('bz-v', !m && u.kd === 'bz-v');
    });
  }
  // Карточка товара: окрашиваем название и блок с данными.
  function tintItems() {
    [].forEach.call(document.querySelectorAll('table.bz-item[data-bz-code]'), function (t) {
      var m0 = MK.m[t.getAttribute('data-bz-code')]; if (!PAL[m0]) { m0 = ''; }
      [].forEach.call(t.querySelectorAll('td.bz-c-name,td.bz-c-meta,.bz-head'), function (td) {
        var m = m0 || (td.__bzk === 'bz-p' ? 'p' : '');
        PORD.forEach(function (k) { td.classList.toggle('bz-m-' + k, k === m); });
        td.classList.toggle('bz-w', !m && td.__bzk === 'bz-w');
        td.classList.toggle('bz-v', !m && td.__bzk === 'bz-v');
      });
    });
  }
  // ---------- Сборка: возврат к позиции и красные позиции с недобором ----------
  var RKEY = 'bz-ret-v1', PKEY = 'bz-proc-v1';
  function jget(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function qp(n) { try { return new URL(location.href).searchParams.get(n) || ''; } catch (e) { return ''; } }
  function onItemPage() { return qp('page') === 'order' && !!qp('barcode'); }
  function onListPage() { return qp('page') === 'order' && !qp('barcode') && !!qp('doc_id'); }
  function listUrl() {
    var u = new URL(location.href);
    ['barcode', 'code_next', 'action', 'offer_code', 'scan_time', 'picked_count'].forEach(function (k) { u.searchParams.delete(k); });
    return u.pathname + u.search;
  }
  // Позиции, которые уже обработаны в этом заказе (Собрать / Нет в наличии): красными они считаются, даже если собрано 0.
  function procGet(id) { var d = jget(PKEY) || {}; return (d[id] && d[id].c) || {}; }
  function procAdd(id, code) {
    var d = jget(PKEY) || {}, now = Date.now();
    Object.keys(d).forEach(function (k) { if (now - (d[k].ts || 0) > 14 * 864e5) { delete d[k]; } });
    var e = d[id] || { c: {} }; e.c[code] = 1; e.ts = now; d[id] = e; jset(PKEY, d);
  }
  // Запоминаем строку, с которой открыли товар, и то, что товар «обработан» (Собрать / Пропустить / Нет в наличии).
  function trackReturn() {
    if (!st.dark) { return; }
    var now = Date.now(), r = jget(RKEY);
    if (onListPage()) {
      document.addEventListener('click', function (e) {
        var a = e.target && e.target.closest && e.target.closest('a[href*="barcode="]'); if (!a) { return; }
        var row = a.closest('tr'); if (!row || !isProd(row)) { return; }
        var ids = [], x = row;
        while ((x = x.nextElementSibling) && ids.length < 4) { if (isProd(x)) { ids.push(x.id); } }
        var m = /[?&]barcode=([^&#]*)/.exec(a.getAttribute('href') || '');
        jset(RKEY, { c: m ? decodeURIComponent(m[1]) : row.id, nx: ids, list: location.pathname + location.search, go: 0, ts: Date.now() });
      }, true);
      if (r && r.go && now - r.go < 10 * 60e3) { returnToRow(r); }
      return;
    }
    if (!onItemPage()) { return; }
    // сразу после «Собрать» сайт мог открыть следующий товар — вместо него возвращаем к списку
    if (r && r.go && now - r.go < 60e3 && r.c !== qp('barcode')) { location.replace(listUrl()); return; }
    var mark = function (kind) {
      if (kind === 'pick' || kind === 'none') { procAdd(qp('doc_id'), qp('barcode')); }
      var q = jget(RKEY);
      if (!q || q.c !== qp('barcode')) { q = { c: qp('barcode'), nx: [], list: listUrl(), ts: Date.now() }; }
      q.go = Date.now(); jset(RKEY, q);
    };
    document.addEventListener('submit', function () { mark('pick'); }, true);
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest && e.target.closest('input,button'); if (!b) { return; }
      var t = (b.value || b.textContent || '').toLowerCase();
      if (/редактир/.test(t)) { return; }
      if (/нет в ?наличии|нет вналичии|out of stock/.test(t)) { mark('none'); }
      else if (/пропустить|skip/.test(t)) { mark('skip'); }
      else if (/собрать|pick/.test(t)) { mark('pick'); }
    }, true);
  }
  function returnToRow(r) {
    var tryScroll = function (final) {
      var tr = null, ids = [r.c].concat(r.nx || []);
      for (var i = 0; i < ids.length && !tr; i++) {
        var el = document.getElementById(ids[i]);
        if (!el || el.tagName !== 'TR' || !isProd(el)) { continue; }
        var u = curUs.filter(function (z) { return z.row === el; })[0];
        if (u && u.short) { continue; }   // позиция с недобором ушла вниз — идём к следующей на её месте
        tr = el;
      }
      if (!tr) { return; }
      var y = tr.getBoundingClientRect().top + (window.pageYOffset || 0) - (bar ? bar.offsetHeight : 0) - 90;
      window.scrollTo(0, Math.max(0, y));
      if (final) { tr.classList.add('bz-flash'); setTimeout(function () { tr.classList.remove('bz-flash'); }, 2400); }
    };
    r.go = 0; jset(RKEY, r);
    tryScroll(false);
    setTimeout(function () { tryScroll(false); }, 250);
    window.addEventListener('load', function () { setTimeout(function () { tryScroll(true); }, 120); });
    if (document.readyState === 'complete') { setTimeout(function () { tryScroll(true); }, 400); }
  }
  var PROC = {};
  function apply() {
    PROC = onListPage() ? procGet(qp('doc_id')) : {};
    var rows = [].slice.call(document.querySelectorAll('tr'));
    var us = [];
    rows.forEach(function (r) {
      if (!isProd(r)) { return; }
      var nx = r.nextElementSibling;
      var det = (nx && !isProd(nx) && nx.querySelector('table')) ? nx : null;
      var td = r.children;
      us.push({ row: r, det: det, n: +tx(td[0]), code: tx(td[1]), name: tx(td[2]), need: tx(td[3]), have: tx(td[4]), kd: hlKind(tx(td[2])), short: isShort(tx(td[3]), tx(td[4]), PROC[r.id]) });
    });
    hasTable = us.length > 0;
    layout();
    if (!hasTable) { say('', false); return; }
    var parent = us[0].row.parentNode;
    if (us.some(function (u) { return u.row.parentNode !== parent; })) { say('Страница устроена иначе, сортировка здесь недоступна.', true); return; }
    var lastU = us[us.length - 1];
    var anchor = (lastU.det || lastU.row).nextSibling;
    us.slice().sort(cmp).forEach(function (u) {
      parent.insertBefore(u.row, anchor);
      if (u.det) { parent.insertBefore(u.det, anchor); }
    });
    var sum = 0;
    wcnt = 0; vcnt = 0;
    curUs = us;
    us.forEach(function (u) {
      u.kd = hlKind(u.name); if (u.kd === 'bz-w') { wcnt++; } else if (u.kd === 'bz-v' || u.kd === 'bz-p') { vcnt++; }
      if (!u.row.__bzs) { u.row.__bzs = 1; var hc = hueClass(getComputedStyle(u.row.children[0]).backgroundColor); if (hc) { u.row.classList.add(hc); } }
      u.row.classList.add('bz-r');
      if (u.det) { u.det.classList.add('bz-d'); u.det.classList.toggle('bz-e', !tx(u.det)); }
      var v = parseFloat(u.need.replace(',', '.')); if (v === v) { sum += v; }
    });
    var tbl = parent.closest('table');
    if (tbl) { tbl.classList.add('bz-tbl'); }
    sumTxt = tl('Позиций') + ' ' + us.length + ' · ' + tl('Надо') + ' ' + Math.round(sum * 1000) / 1000;
    tintRows();
    var map = ['n', 'code', 'name', 'need', 'have'];
    for (var i = 0; i < rows.length; i++) {
      var c = rows[i].children;
      if (c.length === 5 && tx(c[1]) === 'Код' && tx(c[3]) === 'Надо') {
        rows[i].classList.add('bz-h');
        [].forEach.call(c, function (cell, idx) {
          cell.style.cursor = 'pointer';
          var oa = cell.querySelector('.bz-arrow'); if (oa) { oa.remove(); }
          if (map[idx] === st.key) {
            var s = document.createElement('span');
            s.className = 'bz-arrow'; s.appendChild(ico(st.dir > 0 ? 'up' : 'down', '.9em')); s.firstChild.style.display = 'inline-block'; s.firstChild.style.verticalAlign = 'middle';
            cell.appendChild(s);
          }
          if (!cell.__bz) { cell.__bz = 1; cell.addEventListener('click', function () { setKey(map[idx]); }); }
        });
        break;
      }
    }
  }

  // ---------- Главное меню и список накладных ----------
  var TYPEC = { 'сушяк': '229,92,86', 'охлажденка': '64,160,255', 'заморозка': '32,214,196', 'без типа': '255,140,0' };
  function unbracket(el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { n.nodeValue = n.nodeValue.replace(/[\[\]]/g, ''); }
  }
  function mkDiv(cls, text) { var d = document.createElement('div'); d.className = cls; if (text) { d.textContent = text; } return d; }
  // Порядок магазинов в сборке.
  var SHOPS = [
    function (n) { return /makarios/.test(n); },
    function (n) { return /germasogeia/.test(n); },
    function (n) { return /4\s*seasons/.test(n); },
    function (n) { return /paphos/.test(n) && !/evagora/.test(n); },
    function (n) { return /omonia/.test(n); },
    function (n) { return /vironis/.test(n); },
    function (n) { return /evagora/.test(n); },
    function (n) { return /meduz|medus/.test(n); },
    function (n) { return /academ/.test(n); },
    function (n) { return /marina/.test(n); },
    function (n) { return /panteli/.test(n); },
    function (n) { return /kennedy/.test(n); }
  ];
  function shopRank(name) {
    var n = String(name || '').toLowerCase();
    for (var i = 0; i < SHOPS.length; i++) { if (SHOPS[i](n)) { return i; } }
    return SHOPS.length;
  }
  // Строки «номер, дата, статус, магазин, ожидается» + ссылки типов превращаются в карточки.
  function buildDocs() {
    var DATE = /^\d{1,2}\.\d{1,2}\.\d{2,4}(\s+\d{1,2}:\d{2}(:\d{2})?)?$/;
    [].forEach.call(document.querySelectorAll('table'), function (T) {
      if (inBar(T) || T.querySelector('table') || T.closest('.bz-docs,tr.bz-d') || /\bbz-(rt|stat|skip|cols)\b/.test(T.className) || [].some.call(T.rows || [], function (r) { return r.cells.length > 7; })) { return; }
      var units = [], cur = null;
      [].forEach.call(T.rows || [], function (r) {
        var cells = [].slice.call(r.cells), di = -1;
        cells.forEach(function (c, i) { if (di < 0 && DATE.test(tx(c))) { di = i; } });
        if (di >= 0) { cur = { cells: cells, di: di, rows: [r] }; units.push(cur); } else if (cur) { cur.rows.push(r); }
      });
      if (!units.length || !units.every(function (u) { return u.rows.some(function (r) { return r.querySelector('a'); }); })) { return; }
      var wrap = mkDiv('bz-docs');
      var dayOf = function (str) { var m = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/.exec(str); if (!m) { return NaN; } var y = +m[3]; if (y < 100) { y += 2000; } return y * 10000 + (+m[2]) * 100 + (+m[1]); };
      var maxDay = 0;
      units.forEach(function (u) { var dd = dayOf(tx(u.cells[u.di])); if (dd > maxDay) { maxDay = dd; } });
      // сначала актуальная дата, затем более старые; внутри дня магазины идут в заданном порядке
      units.forEach(function (u, i) { u.ix = i; u.day = dayOf(tx(u.cells[u.di])); u.rank = shopRank(tx(u.cells[u.di + 2] || u.cells[0])); });
      units.sort(function (a, b) {
        var da = a.day === a.day ? a.day : 0, db = b.day === b.day ? b.day : 0;
        return (db - da) || (a.rank - b.rank) || (a.ix - b.ix);
      });
      var actShops = {}, actDate = '';
      units.forEach(function (u) { if (u.day === maxDay) { actShops[tx(u.cells[u.di + 2] || u.cells[0]).toLowerCase()] = 1; actDate = tx(u.cells[u.di]); } });
      wrap.__act = Object.keys(actShops).length; wrap.__actDate = actDate.replace(/\s+\d{1,2}:\d{2}(:\d{2})?$/, '');
      units.forEach(function (u) {
        var c = u.cells, d = u.di;
        var txt = function (i) { return (i >= 0 && c[i]) ? tx(c[i]) : ''; };
        var num = txt(d - 1), status = txt(d + 1), shop = txt(d + 2), exp = txt(d + 3), date = txt(d);
        var numA = d > 0 && c[d - 1] ? c[d - 1].querySelector('a') : null;
        var links = [];
        u.rows.forEach(function (r) { [].forEach.call(r.querySelectorAll('a'), function (a) { if (a !== numA) { links.push(a); } }); });
        var st = status.toUpperCase();
        var dd = dayOf(date), oldNew = st === 'NEW' && dd === dd && dd < maxDay;
        var sc = oldNew ? '142,147,156' : st === 'NEW' ? '88,176,138' : /ACCEPT|PROGRESS|WORK|PICK/.test(st) ? '224,164,88' : '142,147,156';
        var card = mkDiv('bz-doc'); card.style.setProperty('--c', sc);
        var top = mkDiv('bz-dtop');
        top.appendChild(mkDiv('bz-dshop', shop || num));
        if (status && !oldNew) { top.appendChild(mkDiv('bz-badge', status)); }
        card.appendChild(top);
        var meta = mkDiv('bz-dmeta');
        if (num && shop) {
          if (numA) { unbracket(numA); meta.appendChild(numA); } else { var b = document.createElement('b'); b.textContent = '№ ' + num; meta.appendChild(b); }
        }
        if (date) { var sd = document.createElement('span'); sd.textContent = date; meta.appendChild(sd); }
        if (exp) { var se = document.createElement('span'); se.textContent = 'Ожидается ' + exp; meta.appendChild(se); }
        card.appendChild(meta);
        if (links.length) {
          var types = mkDiv('bz-types');
          links.forEach(function (a) {
            unbracket(a);
            var key = tx(a).toLowerCase();
            a.style.setProperty('--c', TYPEC[key] || '214,179,106');
            types.appendChild(a);
          });
          card.appendChild(types);
        }
        wrap.appendChild(card);
      });
      T.classList.add('bz-docsrc');
      T.parentNode.insertBefore(wrap, T);
    });
  }
  // ---------- Таблицы-списки, формы загрузки, ссылки-вкладки, главная ----------
  var EMPTYV = /^[\s \-–—]*$/;
  function lighten(rgb) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || '');
    if (!m) { return ''; }
    return [1, 2, 3].map(function (i) { return Math.round(+m[i] + (255 - m[i]) * 0.45); }).join(',');
  }
  var STC = { 'bz-s-red': '212,101,95', 'bz-s-amb': '224,164,88', 'bz-s-grn': '88,176,138', 'bz-s-blu': '108,155,216' };
  function isDash() { return !!document.querySelector('#myTab,.monthly-metric-summary'); }
  function confirmLink(a) {
    if (/удал|откат/i.test(tx(a)) && !a.getAttribute('onclick') && !a.__bzc) {
      a.__bzc = 1;
      a.addEventListener('click', function (e) { if (!window.confirm('Вы уверены?')) { e.preventDefault(); e.stopPropagation(); } });
    }
  }
  // Раздел «Хенди» (терминал, сборка и т.д.) оформляется отдельно и новыми правилами не затрагивается.
  function isHandy() {
    if (isHandy.c !== undefined) { return isHandy.c; }
    var r = false;
    [].forEach.call(document.querySelectorAll('ul.main-menu > li > a'), function (a) {
      if (/background/i.test(a.getAttribute('style') || '') && /хенди|handy/i.test(tx(a))) { r = true; }
    });
    if (!r) { var m = /[?&]page=([^&#]*)/.exec(location.search); r = !!(m && /^(terminal|order|order_select)$/.test(m[1])); }
    isHandy.c = r; return r;
  }
  // Голубые фоны блоков и строк убираются (графики-картинки остаются).
  function killBlue() {
    var probe = document.createElement('i');
    [].forEach.call(document.body.querySelectorAll('*'), function (el) {
      if (inBar(el) || /^(IMG|SCRIPT|STYLE|INPUT|SELECT|BUTTON|A)$/.test(el.tagName) || /(^|\s)bz-/.test(el.className || '')) { return; }
      var v = el.style.backgroundColor || el.getAttribute('bgcolor');
      if (!v) { return; }
      probe.style.color = ''; probe.style.color = v; if (!probe.style.color) { return; }
      document.body.appendChild(probe);
      var cc = getComputedStyle(probe).color; probe.remove();
      if (hueClass(cc) === 'bz-s-blu') { el.style.setProperty('background', 'none', 'important'); el.removeAttribute('bgcolor'); }
    });
  }
  // Страница входа: логотип, заголовок и карточка с полями логина и пароля (данные никуда не передаются и не сохраняются).
  function buildLogin() {
    var pw = document.querySelector('input[type=password]');
    if (!pw || inBar(pw) || pw.__bzl) { return; }
    pw.__bzl = 1;
    document.body.classList.add('bz-loginpg');
    var host = pw.form || pw.closest('form') || pw.closest('table');
    if (!host) { return; }
    host.classList.add('bz-login');
    [].forEach.call(host.querySelectorAll('table'), function (t) { t.classList.add('bz-lgt'); });
    var ui = host.querySelector('input[type=text],input[type=email],input:not([type])');
    if (ui) {
      if (!ui.getAttribute('autocomplete')) { ui.setAttribute('autocomplete', 'username'); }
      ui.setAttribute('autocapitalize', 'none'); ui.setAttribute('autocorrect', 'off'); ui.spellcheck = false;
      if (!ui.placeholder) { ui.placeholder = 'Логин'; }
    }
    if (!pw.getAttribute('autocomplete')) { pw.setAttribute('autocomplete', 'current-password'); }
    if (!pw.placeholder) { pw.placeholder = 'Пароль'; }
    [].forEach.call(host.querySelectorAll('td,th'), function (c) {
      if (c.querySelector('input,select,textarea,button,table')) { return; }
      var t = tx(c);
      if (!t || EMPTYV.test(c.textContent)) { c.classList.add('bz-rx'); } else if (t.length < 40) { c.classList.add('bz-lab'); c.textContent = t.replace(/\s*:\s*$/, ''); }
    });
    [].forEach.call(host.querySelectorAll('tr'), function (r) { if (!r.querySelector('input:not([type=hidden]),select,textarea,button,td.bz-lab')) { r.classList.add('bz-rx'); } });
    [].forEach.call(host.querySelectorAll('input[type=submit],button[type=submit],button:not([type]),input[type=button],input[type=image]'), function (b) { b.classList.add('bz-lgo'); });
    // показать/скрыть пароль
    var box = mkDiv('bz-pw'); pw.parentNode.insertBefore(box, pw); box.appendChild(pw);
    var eye = document.createElement('button'); eye.type = 'button'; eye.className = 'bz bz-pwb'; eye.setAttribute('aria-label', 'Показать пароль');
    setIco(eye, 'eye', '1.2em');
    eye.addEventListener('click', function () {
      var show = pw.type === 'password';
      pw.type = show ? 'text' : 'password';
      setIco(eye, show ? 'eyeoff' : 'eye', '1.2em'); eye.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
    });
    box.appendChild(eye);
    // логотип и заголовок
    var all = document.body.querySelectorAll('img,h1,h2,h3,h4,b,strong,p,div,font,span,center');
    var head = null, logo = document.body.querySelector('img');
    [].forEach.call(all, function (e) {
      if (!head && !inBar(e) && e.tagName !== 'IMG' && !host.contains(e) && !e.querySelector('input,form,table,img,div,p') && /^Вход\s+в\s+аккаунт/i.test(tx(e)) && tx(e).length < 80) { head = e; }
    });
    if (head) { head.classList.add('bz-lgh'); head.textContent = tx(head).replace(/\s*:\s*$/, ''); }
    if (logo && !inBar(logo) && !host.contains(logo)) { logo.classList.add('bz-lglogo'); }
  }
  // Ряд ссылок в квадратных скобках через « | » превращается в ряд кнопок-вкладок.
  function buildTabs() {
    [].forEach.call(document.querySelectorAll('div,p,center'), function (el) {
      if (inBar(el) || el.classList.contains('bz-tabs') || el.closest('.bz-topnav,.bz-docs,table.bz-rt') || el.querySelector('table,form,input,select,div,p,h1,h2,h3,h4')) { return; }
      var as = [].filter.call(el.children, function (c) { return c.tagName === 'A' && /^\[.+\]$/.test(tx(c)); });
      if (as.length < 2 || as.length !== el.querySelectorAll('a').length) { return; }
      if ([].some.call(el.childNodes, function (n) { return n.nodeType === 3 && /[\p{L}\d]/u.test(n.nodeValue); })) { return; }
      el.classList.add('bz-tabs');
      as.forEach(function (a) {
        var on = !!a.querySelector('b,strong');
        a.style.setProperty('--c', (a.style.color && lighten(getComputedStyle(a).color)) || '214,179,106');
        unbracket(a); a.classList.add('bz-tab'); if (on) { a.classList.add('on'); }
      });
      [].forEach.call(el.childNodes, function (n) { if (n.nodeType === 3) { n.nodeValue = ''; } });
    });
  }
  // Подпись над таблицей («Список накладных:») получает счётчик.
  function prevHead(el) {
    var p = el.previousSibling;
    while (p && ((p.nodeType === 3 && !p.nodeValue.trim()) || (p.nodeType === 1 && /^(BR|FORM)$/.test(p.tagName) && !tx(p)))) { p = p.previousSibling; }
    return (p && p.nodeType === 1 && /^(H[1-6]|B|STRONG)$/.test(p.tagName) && tx(p).length < 60) ? p : null;
  }
  function buildRecords() {
    var dash = isDash();
    [].forEach.call(document.querySelectorAll('table'), function (T) {
      if (inBar(T) || T.querySelector('table') || /\bbz-(rt|stat|docsrc|hdr)\b/.test(T.className) || T.closest('.bz-docs')) { return; }
      var rows = [].slice.call(T.rows || []);
      if (rows.length < 2) { return; }
      var hc = [].slice.call(rows[0].cells);
      if (hc.length < 5) { return; }
      var labs = hc.map(function (c) { return tx(c); });
      var named = labs.filter(Boolean).length;
      if (named < 4 || named < hc.length - 1 || hc.some(function (c) { return c.querySelector('img,input,select'); })) { return; }
      var data = rows.slice(1).filter(function (r) { return r.cells.length === hc.length && !r.querySelector('input:not([type=hidden]),select'); });
      var hasF = rows.slice(1).some(function (r) { return r.cells.length === hc.length && r.querySelector('input:not([type=hidden]),select'); });
      if (!data.length && !(hasF && !dash)) { return; }
      if (dash) {
        // статистика на главной: таблица со своей прокруткой и закреплённым первым столбцом
        T.classList.add('bz-stat');
        [].forEach.call(T.querySelectorAll('td,th'), function (c) {
          var t = tx(c);
          if (/^\+\s?\d/.test(t)) { c.classList.add('bz-pos'); } else if (/^[-−–]\s?\d/.test(t) && t.length > 1) { c.classList.add('bz-neg'); }
        });
        return;
      }
      T.classList.add('bz-rt');
      rows[0].classList.add('bz-rh');
      var filt = null;
      rows.slice(1).forEach(function (r) {
        if (r.cells.length === hc.length && r.querySelector('input:not([type=hidden]),select')) {
          filt = r; r.classList.add('bz-rf');
          [].forEach.call(r.cells, function (c, i) {
            if (c.querySelector('input:not([type=hidden]),select')) {
              c.classList.add(/submit|button/i.test((c.querySelector('input') || {}).type || '') ? 'bz-rfs' : 'bz-rfc');
              c.setAttribute('data-l', labs[i]);
            } else { c.classList.add('bz-rx'); }
          });
        } else if (r.cells.length === hc.length) {
          r.classList.add('bz-rr');
          var bg = r.cells[0].style.backgroundColor || '';
          var hue = hueClass(bg);
          r.style.setProperty('--c', (hue !== 'bz-s-blu' && STC[hue]) || '142,147,156');
          [].forEach.call(r.cells, function (c, i) {
            var t = tx(c), lab = labs[i], links = c.querySelectorAll('a');
            c.setAttribute('data-l', lab);
            if (!links.length && !c.querySelector('input,select,button') && EMPTYV.test(c.textContent)) { c.classList.add('bz-rx'); return; }
            if (i === 0) { c.classList.add('bz-rk'); return; }
            if (/статус|status/i.test(lab)) {
              c.classList.add('bz-rs');
              var pill = document.createElement('span'); pill.className = 'bz-pill'; pill.textContent = t; c.textContent = ''; c.appendChild(pill); return;
            }
            if (links.length && !EMPTYV.test(t)) {
              var rest = t; [].forEach.call(links, function (a) { rest = rest.replace(tx(a), ''); });
              if (!/[\p{L}\d]/u.test(rest.replace(/[\[\]|]/g, ''))) {
                c.classList.add('bz-ra');
                var lk = tx(links[0]).toLowerCase();
                if (lk.indexOf(lab.toLowerCase().slice(0, 5)) >= 0) { c.setAttribute('data-l', ''); }
                [].forEach.call(links, function (a) {
                  a.style.setProperty('--c', (a.style.color && lighten(getComputedStyle(a).color)) || '214,179,106');
                  unbracket(a); a.classList.add('bz-ab'); confirmLink(a);
                });
                return;
              }
            }
            if (/склад|магазин|shop|warehouse/i.test(lab)) { c.classList.add('bz-rw'); return; }
            if (/коммент|comment/i.test(lab)) { c.classList.add('bz-rc'); }
          });
        }
      });
      // подпись со счётчиком, поиск и сворачиваемый фильтр
      var h = prevHead(T), n = data.length, host = T.parentNode;

      var cb = null;
      if (h) {
        h.classList.add('bz-listh');
        h.textContent = h.textContent.replace(/\s*:\s*$/, '');
        h.appendChild(document.createTextNode(' · ')); cb = document.createElement('b'); cb.textContent = n; h.appendChild(cb);
      }
      if (n > 5) {
        var si = document.createElement('input');
        si.type = 'text'; si.className = 'bz-search'; si.placeholder = 'Поиск по списку'; si.setAttribute('autocomplete', 'off');
        var emp = mkDiv('bz-empty', 'Ничего не найдено'); emp.style.display = 'none';
        si.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); si.blur(); } });
        si.addEventListener('input', function () {
          var q = si.value.trim().toLowerCase(), k = 0;
          data.forEach(function (r) { var ok = !q || r.textContent.toLowerCase().replace(/\s+/g, ' ').indexOf(q) >= 0; r.style.display = ok ? '' : 'none'; if (ok) { k++; } });
          if (cb) { cb.textContent = q ? k + ' из ' + n : n; }
          emp.style.display = k ? 'none' : 'block';
        });
        host.insertBefore(si, T); T.__emp = emp;
      }
      var tw = mkDiv('bz-tw'); host.insertBefore(tw, T); tw.appendChild(T);
      if (T.__emp) { host.insertBefore(T.__emp, tw.nextSibling); }
      if (!n) { host.insertBefore(mkDiv('bz-empty', 'Список пуст'), tw.nextSibling); }
    });
  }
  // Формы с загрузкой файла и блоки «две колонки» превращаются в карточки.
  function buildForms() {
    [].forEach.call(document.querySelectorAll('table'), function (T) {
      if (inBar(T) || T.querySelector('table') || /\bbz-/.test(T.className)) { return; }
      var tds = [].slice.call(T.querySelectorAll('td')).filter(function (c) { return c.querySelector('form'); });
      if (tds.length >= 2 && tds.every(function (c) { return c.closest('table') === T; })) {
        T.classList.add('bz-cols');
        tds.forEach(function (c) { c.classList.add('bz-colc'); });
        [].forEach.call(T.querySelectorAll('td'), function (c) { if (!c.querySelector('form') && EMPTYV.test(c.textContent) && !c.querySelector('input,select,img')) { c.classList.add('bz-rx'); } });
      }
    });
    [].forEach.call(document.querySelectorAll('form'), function (f) {
      if (inBar(f) || f.classList.contains('bz-up') || f.classList.contains('bz-ordform') || !f.querySelector('input[type=file],input[type=date]')) { return; }
      f.classList.add('bz-up');
      [].forEach.call(f.querySelectorAll('table'), function (t) { t.classList.add('bz-upt'); });
      var p = f.previousSibling;
      while (p && ((p.nodeType === 3 && !p.nodeValue.trim()) || (p.nodeType === 1 && p.tagName === 'BR'))) { if (p.nodeType === 1) { p.style.display = 'none'; } p = p.previousSibling; }
      if (p && p.nodeType === 1 && /^(B|STRONG|H[1-6])$/.test(p.tagName) && tx(p).length < 120) {
        p.classList.add('bz-uph'); p.textContent = tx(p).replace(/\s*:\s*$/, ''); f.insertBefore(p, f.firstChild);
      }
      // подписи полей: ячейки таблицы и голый текст
      [].forEach.call(f.querySelectorAll('td'), function (c) {
        if (c.querySelector('input,select,textarea,button,form')) { return; }
        var t = tx(c);
        if (EMPTYV.test(c.textContent)) { c.classList.add('bz-rx'); } else if (t.length < 40) { c.classList.add('bz-lab'); c.textContent = t.replace(/\s*:\s*$/, ''); }
      });
      [].slice.call(f.childNodes).forEach(function (n) {
        if (n.nodeType === 3 && /[\p{L}]/u.test(n.nodeValue)) {
          var d = mkDiv('bz-lab', n.nodeValue.trim().replace(/\s*:\s*$/, '')); f.replaceChild(d, n);
        }
      });
    });
    // блок «Внимание»: карточка со списком накладных
    [].forEach.call(document.querySelectorAll('b,strong'), function (b) {
      var par = b.parentNode;
      if (inBar(b) || !/^ВНИМАНИЕ/i.test(tx(b)) || !par || par.tagName === 'BODY' || par.classList.contains('bz-alert') || par.querySelector('table,form,input,select')) { return; }
      par.classList.add('bz-alert'); b.classList.add('bz-alh');
      var kids = [].slice.call(par.childNodes), groups = [], cur = null, started = false;
      kids.forEach(function (n) {
        if (n === b) { started = true; return; }
        if (!started) { return; }
        if (n.nodeType === 3 && /Номер документа/i.test(n.nodeValue)) { cur = mkDiv('bz-ali'); groups.push(cur); }
        if (!cur) { if (n.nodeType === 1 && n.tagName === 'BR') { n.style.display = 'none'; } return; }
        cur.appendChild(n);
      });
      groups.forEach(function (g) {
        while (g.firstChild && g.firstChild.nodeType === 1 && g.firstChild.tagName === 'BR') { g.removeChild(g.firstChild); }
        while (g.lastChild && ((g.lastChild.nodeType === 1 && g.lastChild.tagName === 'BR') || (g.lastChild.nodeType === 3 && !g.lastChild.nodeValue.trim()))) { g.removeChild(g.lastChild); }
        par.appendChild(g);
      });
      [].forEach.call(par.querySelectorAll(':scope > br'), function (x) { x.style.display = 'none'; });
    });
  }
  // Главная: вкладки, карточки блоков, полоски рейтингов.
  function buildDash() {
    if (!isDash()) { return; }
    document.body.classList.add('bz-dash');
    [].forEach.call(document.querySelectorAll('table'), function (T) {
      if (inBar(T) || /\bbz-(hdr|rt)\b/.test(T.className) || T.querySelector('ul.main-menu')) { return; }
      T.classList.add('bz-skip');
      if (T.querySelector('table')) { T.classList.add('bz-grid'); }
      var cells = T.rows && T.rows[0] ? T.rows[0].cells.length : 0;
      if (cells > 12) { T.classList.add('bz-chart'); }
    });
    [].forEach.call(document.querySelectorAll('table.bz-skip:not(.bz-grid) img'), function (im) {
      var c = lighten(im.style.backgroundColor ? getComputedStyle(im).backgroundColor : '');
      if (c) { im.style.backgroundColor = 'rgb(' + c + ')'; }
      im.classList.add('bz-bar');
    });
    var sel = document.querySelector('select[name=shop_id]');
    if (sel && sel.form) { sel.form.classList.add('bz-dform'); }
  }
  // Полоса разделов сверху (Главная, Склад, Кухня … Выход) превращается в ряд крупных кнопок.
  function buildMainMenu(ul) {
    ul.classList.add('bz-topnav');
    [].forEach.call(ul.children, function (li) {
      var a = li.querySelector(':scope > a');
      if (a && /background/i.test(a.getAttribute('style') || '')) { a.classList.add('bz-on'); }
    });
    var hdr = ul.closest('table');
    if (hdr) {
      hdr.classList.add('bz-hdr');
      // название склада: «Склад Кипр | Warehouse | Кипр»
      var cell = ul.parentNode;
      [].slice.call(cell.childNodes).forEach(function (n) {
        if (n.nodeType === 3 && /warehouse/i.test(n.nodeValue)) {
          var parts = n.nodeValue.split('|').map(function (x) { return x.trim(); }).filter(Boolean);
          var br = document.createElement('div'); br.className = 'bz-brand';
          parts.forEach(function (x, i) {
            if (i) { br.appendChild(document.createElement('i')); }
            var sp = document.createElement('span'); sp.textContent = x; br.appendChild(sp);
          });
          cell.replaceChild(br, n);
        }
      });
    }
    setTimeout(function () { var on = ul.querySelector('.bz-on'); if (on) { ul.scrollLeft = Math.max(0, on.parentNode.offsetLeft - ul.clientWidth / 2 + on.offsetWidth / 2); } }, 80);
  }
  function buildTopNav() {
    var mm = document.querySelector('ul.main-menu');
    if (mm && !inBar(mm)) { buildMainMenu(mm); return; }
    var leaf = function (re) {
      var all = document.body.querySelectorAll('a,td,th,span,font,b,strong,div,p,li,u');
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!inBar(e) && !e.querySelector('td,div,p,li,table') && re.test(tx(e))) { return e; }
      }
      return null;
    };
    var home = leaf(/^главная$/i), exit = leaf(/^выход$/i);
    if (!home || !exit) { return; }
    var c = home.parentNode;
    while (c && c !== document.body && !c.contains(exit)) { c = c.parentNode; }
    if (!c || c === document.body) { return; }
    var tb = c.closest('table');
    var target = (tb && (c.tagName === 'TR' || c.tagName === 'TBODY' || c.tagName === 'TABLE' || tb.rows.length === 1)) ? tb : c;
    if (target.querySelector('input,img,select,h1,h2,h3,table table') || tx(target).length > 160) { return; }
    target.classList.add('bz-topnav');
    var isOn = function (td) {
      return !td.querySelector('a') && !td.getAttribute('onclick') && !(td.querySelector('[onclick]'));
    };
    if (target.tagName === 'TABLE') {
      [].forEach.call(target.querySelectorAll('td,th'), function (td) {
        if (!tx(td)) { td.style.display = 'none'; return; }
        if (isOn(td) || td.getAttribute('bgcolor') || /background/i.test(td.getAttribute('style') || '')) { td.classList.add('bz-on'); }
      });
    } else {
      [].forEach.call(target.children, function (e) { if (e.tagName !== 'A' && e.tagName !== 'BR' && tx(e) && !e.querySelector('a') && !e.getAttribute('onclick')) { e.classList.add('bz-on'); } });
    }
    setTimeout(function () { var on = target.querySelector('.bz-on'); if (on) { target.scrollLeft = Math.max(0, on.offsetLeft - target.clientWidth / 2 + on.offsetWidth / 2); } }, 80);
  }
  // Красные заголовки превращаем в золотые, длинное главное меню — в тёмные карточки, форму выбора заказа растягиваем.
  function restylePages() {
    [].forEach.call(document.querySelectorAll('h1,h2,h3,h4,font,b,strong,span,center,div,p,td'), function (el) {
      if (inBar(el) || el.closest('a,.bz-topnav,.bz-docs,tr.bz-r,tr.bz-d,table.bz-item,.bz-card,.bz-t,.bz-note,.bz-prompt,#bz-modal')) { return; }
      if (el.children.length && !/^H\d$/.test(el.tagName)) { return; }
      var t = tx(el); if (!t || t.length > 40) { return; }
      var cs = getComputedStyle(el), m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(cs.color);
      if (m && +m[1] > 110 && +m[2] < 80 && +m[3] < 80 && parseFloat(cs.fontSize) >= 28) { el.classList.add('bz-h1'); }
    });
    if (!document.querySelector('input[type=text],input:not([type]),input[type=number],input[type=tel],select,textarea')) {
      var btns = [].filter.call(document.querySelectorAll('input[type=button],input[type=submit],button:not(.bz)'), function (b) {
        return !inBar(b) && !b.closest('#bz-modal') && !b.classList.contains('bz-nav') && !b.classList.contains('bz-sec');
      });
      if (btns.length >= 3) {
        var MI = [[/информац/i, 'info'], [/приемк|приёмк/i, 'inb'], [/shipment|kitchen/i, 'box'], [/привяз/i, 'link'], [/перемещ/i, 'move'], [/сборк/i, 'order'], [/инвентар/i, 'inv']];
        btns.forEach(function (b) {
          var bg = b.style.backgroundColor, lb = (b.value || b.textContent || '');
          if (bg) { b.style.setProperty('--c', bg); }
          b.classList.add('bz-menu');
          for (var i = 0; i < MI.length; i++) { if (MI[i][0].test(lb)) { b.classList.add('bz-i-' + MI[i][1]); break; } }
        });
      }
    }
    // «Список документов»: подпись со счётчиком и строка поиска
    var lh = [].filter.call(document.querySelectorAll('h1,h2,h3,h4,b,strong,p,div,font,span,center'), function (e) {
      return !inBar(e) && !e.querySelector('input,select,form,table,div,p') && /^Список документов/i.test(tx(e)) && tx(e).length < 40;
    })[0];
    var dw = document.querySelector('.bz-docs');
    if (lh && dw) {
      lh.classList.add('bz-listh');
      var ah = mkDiv('bz-listh bz-act');
      ah.appendChild(document.createTextNode('Собрать магазинов: '));
      var ab = document.createElement('b'); ab.textContent = dw.__act || 0; ah.appendChild(ab);
      if (dw.__actDate) { var ad = document.createElement('span'); ad.className = 'bz-actd'; ad.textContent = ' · ' + dw.__actDate; ah.appendChild(ad); }
      lh.parentNode.insertBefore(ah, lh);
      lh.textContent = 'Всего магазинов в сборке: ';
      var cb = document.createElement('b'); cb.textContent = dw.children.length; lh.appendChild(cb);
      if (dw.children.length > 4) {
        var si = document.createElement('input');
        si.type = 'text'; si.className = 'bz-search'; si.placeholder = 'Поиск: магазин или номер'; si.setAttribute('autocomplete', 'off');
        var emp = mkDiv('bz-empty', 'Ничего не найдено'); emp.style.display = 'none';
        si.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); si.blur(); } });
        si.addEventListener('input', function () {
          var q = si.value.trim().toLowerCase(), n = 0;
          [].forEach.call(dw.children, function (c) { var ok = !q || c.textContent.toLowerCase().indexOf(q) >= 0; c.style.display = ok ? '' : 'none'; if (ok) { n++; } });
          cb.textContent = q ? n + ' из ' + dw.children.length : dw.children.length;
          emp.style.display = n ? 'none' : 'block';
        });
        dw.parentNode.insertBefore(si, dw);
        dw.parentNode.insertBefore(emp, dw.nextSibling);
      }
    }
  }

  // Форма «Введите номер заказа для сборки»: карточка с полем, выбором типа кнопками и крупной кнопкой.
  function orderForm() {
    var sel = document.querySelector('select');
    if (!sel || inBar(sel) || document.querySelector('table.bz-item,tr.bz-r,table.bz-rt,.bz-dash') || !/номер заказа/i.test(document.body.textContent || '')) { return; }
    var form = sel.form || sel.closest('form');
    var ti = [].filter.call(document.querySelectorAll('input[type=text],input:not([type]),input[type=number],input[type=tel]'), function (i) { return !inBar(i); })[0];
    var sb = form && form.querySelector('input[type=submit],button[type=submit],button:not([type])');
    if (form && ti && sb && form.contains(ti) && form.querySelectorAll('table').length <= 1 && tx(form).length < 220) {
      // Блок «Введите номер заказа для сборки» скрыт по просьбе пользователя (в обычном режиме сайт не меняется).
      form.classList.add('bz-gone');
      var hh = [].filter.call(document.querySelectorAll('h1,h2,h3,h4,b,strong,p,div,font,span,center'), function (e) {
        return !inBar(e) && !form.contains(e) && !e.querySelector('input,select,form,table,div,p') && /^Введите номер заказа/i.test(tx(e)) && tx(e).length < 80;
      })[0];
      if (hh) { hh.classList.add('bz-gone'); }
      [form, hh].forEach(function (el) {
        if (!el) { return; }
        ['previousSibling', 'nextSibling'].forEach(function (d) {
          var q = el[d];
          while (q && ((q.nodeType === 3 && !q.nodeValue.trim()) || (q.nodeType === 1 && /^(BR|HR)$/.test(q.tagName)))) { if (q.nodeType === 1) { q.style.display = 'none'; } q = q[d]; }
        });
      });
    } else {
      sel.classList.add('bz-ord');
      if (ti) { ti.classList.add('bz-ord'); }
      [sel, ti].forEach(function (el) {
        if (!el) { return; }
        ['previousSibling', 'nextSibling'].forEach(function (d) {
          var q = el[d];
          while (q && ((q.nodeType === 3 && !q.nodeValue.trim()) || (q.nodeType === 1 && q.tagName === 'BR'))) { if (q.nodeType === 1) { q.style.display = 'none'; } q = q[d]; }
        });
      });
    }
  }

  // ---------- Оформление блоков страницы ----------
  function inBar(el) { return !!(el.closest && el.closest('#bz-bar')); }
  var SCAN = /Отсканируйте\s+место\s+хранения\s*:?/i;
  function typeColor(t) {
    t = (t || '').toLowerCase();
    return /суш/.test(t) ? '229,92,86' : /охл/.test(t) ? '64,160,255' : /моро|замор/.test(t) ? '32,214,196' : /без/.test(t) ? '255,140,0' : '214,179,106';
  }
  // Заголовок заказа: магазин, ниже номер, ниже вид (сушняк, охлажденка, заморозка)
  function rebuildTitle(el) {
    if (el.__bzt) { return; }
    var m = /^Сборка заказа\s*№?\s*(\S+)\s*(?:\(([^)]*)\))?\s*\/?\s*(.*)$/.exec(tx(el));
    if (!m || !m[3]) { return; }
    el.__bzt = 1;
    el.textContent = '';
    var trow = mkDiv('bz-trow');
    trow.appendChild(mkDiv('bz-ts', m[3]));
    if (curUs.length) {
      var got = curUs.filter(function (u) { var h = num(u.have); return (h === h && h > 0) || PROC[u.row.id]; }).length;
      var tc = mkDiv('bz-tc');
      [[tl('Позиций'), curUs.length], [tl('Собрано'), got]].forEach(function (p2) {
        var ln = document.createElement('div'); ln.appendChild(document.createTextNode(p2[0] + ' ')); var bb = document.createElement('b'); bb.textContent = p2[1]; ln.appendChild(bb); tc.appendChild(ln);
      });
      trow.appendChild(tc);
    }
    el.appendChild(trow);
    var nm = mkDiv('bz-tn'); nm.appendChild(document.createTextNode('Сборка заказа № '));
    var nb = document.createElement('b'); nb.textContent = m[1]; nm.appendChild(nb); el.appendChild(nm);
    if (m[2] && m[2].trim()) {
      var tp = document.createElement('span'); tp.className = 'bz-tp'; tp.textContent = m[2].trim();
      tp.style.setProperty('--c', typeColor(m[2])); el.appendChild(tp);
    }
  }
  function decorate() {
    var body = document.body;
    buildDocs();
    if (!isHandy()) { buildTabs(); killBlue(); }
    buildTopNav();
    // заголовок заказа
    [].forEach.call(body.querySelectorAll('div,h1,h2,h3,p,center,b'), function (el) {
      if (!inBar(el) && /^Сборка заказа/.test(tx(el)) && tx(el).length < 220 && !el.querySelector('input,table,form')) { el.classList.add('bz-t'); rebuildTitle(el); }
    });
    // блоки-подсказки с пунктирной рамкой
    [].forEach.call(body.querySelectorAll('div,p,center,td,span,font'), function (el) {
      if (inBar(el) || el.classList.contains('bz-t') || el.closest('tr.bz-r, tr.bz-d')) { return; }
      var bs = getComputedStyle(el).borderTopStyle;
      if (bs === 'dotted' && tx(el) && !el.querySelector('input,table,form,img,button')) {
        el.classList.add('bz-note');
        if (SCAN.test(tx(el)) && tx(el).length < 60) { el.classList.add('bz-gone'); }
      }
    });
    // «Отсканируйте место хранения:» не нужна, убираем
    var wS = document.createTreeWalker(body, NodeFilter.SHOW_TEXT), nS, hitS = null;
    while ((nS = wS.nextNode())) { if (SCAN.test(nS.nodeValue) && !inBar(nS.parentNode)) { hitS = nS; break; } }
    if (hitS) {
      var pS = hitS.parentNode;
      if (pS !== body && tx(pS).length < 60 && !pS.querySelector('input,table,form,img,button') && !pS.closest('.bz-t')) {
        pS.classList.add('bz-gone');
        var qS = pS.nextSibling;
        while (qS && ((qS.nodeType === 3 && !qS.nodeValue.trim()) || (qS.nodeType === 1 && qS.tagName === 'BR'))) { if (qS.nodeType === 1) { qS.style.display = 'none'; } qS = qS.nextSibling; }
      }
      else {
        var mS = SCAN.exec(hitS.nodeValue), restS = mS.index > 0 ? hitS.splitText(mS.index) : hitS;
        if (restS.nodeValue.length > mS[0].length) { restS.splitText(mS[0].length); }
        var spS = document.createElement('span'); spS.className = 'bz-gone';
        restS.parentNode.insertBefore(spS, restS); spS.appendChild(restS);
      }
    }
    // «Отсканируйте место хранения», если оно не внутри такого блока
    if (!body.querySelector('.bz-prompt')) {
      var w = document.createTreeWalker(body, NodeFilter.SHOW_TEXT), n, hit = null;
      while ((n = w.nextNode())) {
        if (/Отсканируйте/i.test(n.nodeValue) && !SCAN.test(n.nodeValue) && !inBar(n.parentNode) && !(n.parentNode.closest && n.parentNode.closest('.bz-note,.bz-t'))) { hit = n; break; }
      }
      if (hit) {
        var i = hit.nodeValue.search(/Отсканируйте/i);
        var rest = i > 0 ? hit.splitText(i) : hit;
        var box = document.createElement('div');
        box.className = 'bz-prompt';
        rest.parentNode.insertBefore(box, rest);
        box.appendChild(rest);
      }
    }
    // окно сканирования
    var bc = document.querySelector('input[name=barcode]');
    var scanTable = null;
    if (bc) {
      scanTable = bc.closest('table');
      if (scanTable && !scanTable.querySelector('table') && !scanTable.querySelector('tr.bz-r')) { scanTable.classList.add('bz-scanbox'); } else { scanTable = null; }
      if (!bc.placeholder) { bc.placeholder = 'Сканируйте или введите код'; }
    }
    // «Добавить товар в заказ»
    var cnt = document.querySelector('input[name=count]');
    var addTable = cnt && cnt.closest('table');
    if (addTable && addTable !== scanTable && addTable.querySelector('input[name=code]') && !addTable.querySelector('table') && !addTable.querySelector('tr.bz-r')) {
      addTable.classList.add('bz-addbox');
      var w2 = document.createTreeWalker(body, NodeFilter.SHOW_TEXT), n2;
      while ((n2 = w2.nextNode())) {
        if (/Добавить товар в заказ/i.test(n2.nodeValue) && !inBar(n2.parentNode)) {
          var j = n2.nodeValue.search(/Добавить товар в заказ/i);
          var part = j > 0 ? n2.splitText(j) : n2;
          var hd = document.createElement('div'); hd.className = 'bz-sub';
          part.parentNode.insertBefore(hd, part); hd.appendChild(part);
          break;
        }
      }
    } else { addTable = null; }
    // ссылка «добавить товар» превращается в кнопку
    [].forEach.call(document.querySelectorAll('a'), function (a) {
      if (inBar(a) || a.closest('tr')) { return; }
      var t = tx(a);
      if (/^\[?\s*добавить товар\s*\]?$/i.test(t)) { a.classList.add('bz-addbtn'); if (t !== 'Добавить товар') { a.textContent = 'Добавить товар'; } }
    });
    // кнопки «Начало» и «Назад» (кнопки, ссылки и элементы с onclick)
    var NAVRE = /^\[?\s*(начало|назад|в начало|на главную)\s*\]?$/i;
    [].forEach.call(document.querySelectorAll('input[type=button],input[type=submit],button:not(.bz),a,[onclick]'), function (b) {
      if (inBar(b) || b.closest('tr.bz-r,tr.bz-d,.bz-docs,.bz-topnav,.bz-tabs,table.bz-rt,.bz-alert') || (b.children.length && b.tagName !== 'BUTTON' && b.tagName !== 'A' && b.tagName !== 'INPUT')) { return; }
      var v = (b.value || b.textContent || '').trim();
      if (NAVRE.test(v) || (b.tagName === 'A' && !b.closest('tr') && /^\[[^\]]{2,30}\]$/.test(v))) {
        b.classList.add('bz-nav');
        // квадратные скобки вокруг названия кнопки убираем
        if (/[\[\]]/.test(v)) {
          if (b.tagName === 'INPUT') { b.value = v.replace(/[\[\]]/g, '').trim(); } else if (!b.children.length) { b.textContent = v.replace(/[\[\]]/g, '').trim(); }
        }
        var pv = b.previousSibling, nx = b.nextSibling;
        if (pv && pv.nodeType === 3) { pv.nodeValue = pv.nodeValue.replace(/\[\s*$/, ''); }
        if (nx && nx.nodeType === 3) { nx.nodeValue = nx.nodeValue.replace(/^\s*\]/, ''); }
      }
    });
    // подряд идущие кнопки собираем в одну строку на всю ширину
    var navSkip = function (n) { return (n.nodeType === 3 && !/[\p{L}\d]/u.test(n.nodeValue)) || (n.nodeType === 1 && n.tagName === 'BR'); };
    [].forEach.call(document.querySelectorAll('.bz-nav'), function (b) {
      var par = b.parentNode;
      if (!par || par.classList.contains('bz-navrow') || /^(TR|TBODY|THEAD|TABLE)$/.test(par.tagName)) { return; }
      var run = [b], n = b.nextSibling;
      while (n) {
        if (n.nodeType === 1 && n.classList.contains('bz-nav')) { run.push(n); } else if (!navSkip(n)) { break; }
        n = n.nextSibling;
      }
      var row = document.createElement('div');
      row.className = 'bz-navrow';
      par.insertBefore(row, b);
      var cur = row.nextSibling, end = run[run.length - 1];
      while (cur) {
        var nx2 = cur.nextSibling;
        if (cur.nodeType === 1 && cur.classList.contains('bz-nav')) { row.appendChild(cur); } else if (cur.nodeType === 3) { cur.nodeValue = ''; } else if (cur.tagName === 'BR') { cur.style.display = 'none'; }
        if (cur === end) { break; }
        cur = nx2;
      }
    });
    // лишние переносы строк рядом с кнопками и под блоком «Добавить товар в заказ»
    var trimBr = function (el) {
      [['previousSibling'], ['nextSibling']].forEach(function (d) {
        var q = el[d[0]];
        while (q && ((q.nodeType === 3 && !q.nodeValue.trim()) || (q.nodeType === 1 && q.tagName === 'BR'))) { if (q.nodeType === 1) { q.style.display = 'none'; } q = q[d[0]]; }
      });
    };
    [].forEach.call(document.querySelectorAll('.bz-nav'), function (b) { trimBr(b.parentNode && /^(TD|TH|TR|TBODY)$/.test(b.parentNode.tagName) ? b.closest('table') || b : (b.parentNode.classList.contains('bz-navrow') ? b.parentNode : b)); });
    if (addTable) { trimBr(addTable); }
    // второстепенные кнопки
    [].forEach.call(document.querySelectorAll('input[type=button],input[type=submit],button:not(.bz)'), function (b) {
      if (b.classList.contains('bz-nav')) { return; }
      var v = (b.value || b.textContent || '').trim();
      if (/нет\s*в\s*наличии|нет\s*вналичии|пропустить|редактировать|отмена|назад/i.test(v)) { b.classList.add('bz-sec'); }
    });
    // остальные таблицы без вложенных таблиц
    var isCtl = function (e) { return e.matches && e.matches('input[type=text],input:not([type]),input[type=number],input[type=tel],input[type=button],input[type=submit],button'); };
    [].forEach.call(document.querySelectorAll('table'), function (t) {
      if (inBar(t) || /\bbz-(tbl|scanbox|addbox|navtbl|docsrc|topnav|hdr|ordtbl|rt|stat|skip|cols|grid|chart|upt|lgt|login)\b/.test(t.className)) { return; }
      if (t.querySelector('table') || t.querySelector('tr.bz-r') || t.closest('tr.bz-d')) { return; }
      var rowsT = [].slice.call(t.rows || []);
      var cellsT = t.querySelectorAll('td,th');
      if (cellsT.length && t.querySelector('.bz-nav') && [].every.call(cellsT, function (c) { return c.querySelector('.bz-nav'); })) { t.classList.add('bz-navtbl'); return; }
      var hasImg = !!t.querySelector('img'), hasCtl = !!t.querySelector('input[type=text],input:not([type]),input[type=number],input[type=tel],input[type=button],input[type=submit],button');
      if (hasImg || hasCtl) { itemTable(t, rowsT); return; }
      // таблица-сетка: одинаковое число ячеек в каждой строке, короткий текст
      var n0 = rowsT.length && rowsT[0].cells.length;
      if (rowsT.length >= 2 && n0 >= 2 && rowsT.every(function (r) { return r.cells.length === n0; }) && tx(t).length < 200) { t.classList.add('bz-data'); return; }
      t.classList.add('bz-flow');
    });
  }

  // Пустые элементы и переносы между блоком «Добавить товар в заказ» и кнопками «В начало» / «Назад» убираются, остаток зазора сжимается.
  function tightenGap() {
    var box = document.querySelector('table.bz-addbox');
    if (!box) { return; }
    var navs = [].filter.call(document.querySelectorAll('.bz-nav'), function (n) { return !inBar(n) && !box.contains(n) && (box.compareDocumentPosition(n) & 4); });
    if (!navs.length) { return; }
    var nb = navs[0].closest('.bz-navrow,table.bz-navtbl') || navs[0];
    nb.style.marginTop = '';
    var all = document.body.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el === box || el === nb || box.contains(el) || nb.contains(el) || el.contains(box) || el.contains(nb) || inBar(el)) { continue; }
      if (!(box.compareDocumentPosition(el) & 4) || !(nb.compareDocumentPosition(el) & 2)) { continue; }
      if (/^(HR|SCRIPT|STYLE|INPUT|IMG|BUTTON|SELECT|TEXTAREA|LINK|META)$/.test(el.tagName)) { continue; }
      if (!tx(el) && !el.querySelector('input:not([type=hidden]),img,button,select,textarea,svg,canvas,iframe,video,hr')) { el.style.setProperty('display', 'none', 'important'); }
    }
    var gap = nb.getBoundingClientRect().top - box.getBoundingClientRect().bottom;
    if (gap > 100) { nb.style.marginTop = (-(gap - 52)) + 'px'; }
  }

  // Карточка товара: ячейки раскладываются на всю ширину в удобном порядке.
  function itemTable(t, rowsT) {
    t.classList.add('bz-item');
    var dataIdx = 0;
    rowsT.forEach(function (r) {
      var cells = [].slice.call(r.cells);
      var plain = cells.length >= 2 && cells.every(function (c) {
        return !c.querySelector('img,input,button') && tx(c).length > 0 && tx(c).length < 24 && !/Артикул|Доступно|Ед\.?\s*изм|Уже собрано/i.test(tx(c));
      });
      if (plain) { r.classList.add('bz-r-data', dataIdx === 0 ? 'bz-dh' : 'bz-dv'); dataIdx++; return; }
      cells.forEach(function (td) {
        var text = tx(td);
        var ctl = [].slice.call(td.querySelectorAll('input,button'));
        var inputs = ctl.filter(function (e) { return /^(text|number|tel|)$/.test((e.getAttribute('type') || '').toLowerCase()) && e.tagName === 'INPUT'; });
        var btns = ctl.filter(function (e) { return e.tagName === 'BUTTON' || /^(button|submit)$/i.test(e.getAttribute('type') || ''); });
        var btnLabel = btns.map(function (b) { return (b.value || b.textContent || '').trim(); }).join(' ');
        if (/Артикул/i.test(text) && inputs.length && btns.length && rebuildCard(td, t)) { td.classList.add('bz-c-card'); return; }
        if (td.querySelector('img')) { td.classList.add('bz-c-img'); return; }
        if (td.querySelector('.bz-nav') && !inputs.length && text.length < 20) { td.classList.add('bz-c-nav'); return; }
        if (!text && !ctl.length) { td.classList.add('bz-c-none'); return; }
        if (inputs.length && btns.length) { td.classList.add('bz-c-qty'); return; }
        if (btns.length && !inputs.length && text.replace(btnLabel, '').trim().length < 3) {
          td.classList.add(/редактировать/i.test(btnLabel) ? 'bz-c-edit' : (btns.some(function (b) { return b.classList.contains('bz-sec'); }) ? 'bz-c-sec' : 'bz-c-btn'));
          return;
        }
        if (/Доступно/i.test(text)) { td.classList.add('bz-c-avail'); return; }
        if (/Артикул|Ед\.?\s*изм|Уже собрано/i.test(text)) {
          td.classList.add('bz-c-meta');
          var firstLine = (td.innerText || td.textContent || '').split(/\n|Артикул/)[0];
          var k1 = hlKind(firstLine); if (k1) { td.classList.add(k1); td.__bzk = k1; }
          var mc = /Артикул\s*:?\s*([^\s<]+?)(?=Ед\.|Уже|Доступно|\s|$)/i.exec((td.textContent || '').replace(/\u00a0/g, ' '));
          if (mc) { t.setAttribute('data-bz-code', mc[1]); }
          metaRows(td); return;
        }
        td.classList.add(td === cells[0] || !t.querySelector('.bz-c-name') ? 'bz-c-name' : 'bz-c-txt');
        if (td.classList.contains('bz-c-name')) { var k2 = hlKind(text); if (k2) { td.classList.add(k2); td.__bzk = k2; } }
      });
    });
  }
  // Если название, данные, количество и кнопки лежат в одной ячейке, раскладываем их по отдельным блокам.
  function rebuildCard(td, t) {
    if (td.__bzc) { return true; }
    var pieces = [], nd;
    var w = document.createTreeWalker(td, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { return (n.parentNode.closest && n.parentNode.closest('input,button,select,textarea,script,style,#commentText')) ? 2 : 1; } });
    while ((nd = w.nextNode())) { var tv = nd.nodeValue.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim(); if (tv) { pieces.push(tv); } }
    var KV = /^(Артикул|Ед\.?\s*изм\.?|Уже собрано)\s*:?\s*(.*)$/i, LB = /^(Кол-?во|Доступно)/i;
    var name = [], kv = [], avail = '', label = 'Кол-во:', seen = false;
    for (var i = 0; i < pieces.length; i++) {
      var v = pieces[i], m = KV.exec(v);
      if (m) {
        seen = true; var val = m[2];
        if (!val && i + 1 < pieces.length && !KV.test(pieces[i + 1]) && !LB.test(pieces[i + 1])) { val = pieces[++i]; }
        kv.push([m[1].replace(/\s+/g, ' '), val || '—']); continue;
      }
      if (/^Кол-?во/i.test(v)) { label = v; continue; }
      if (/^Доступно/i.test(v)) {
        avail = v;
        if (/:$/.test(avail) && i + 1 < pieces.length && pieces[i + 1].length < 20 && !KV.test(pieces[i + 1]) && !LB.test(pieces[i + 1])) { avail += ' ' + pieces[++i]; }
        continue;
      }
      if (!seen) { name.push(v); }
    }
    if (!name.length || !kv.length) { return false; }
    var secRE = /нет\s*в\s*наличии|нет\s*вналичии|пропустить/i;
    var all0 = [].slice.call(td.querySelectorAll('input,button,select,textarea'));
    // скрытые на странице элементы (например, форма редактирования) остаются скрытыми и на своём месте
    var hiddenTop = function (e) {
      var top = null;
      for (var x = e; x && x !== td; x = x.parentNode) { if (x.nodeType === 1 && getComputedStyle(x).display === 'none') { top = x; } }
      return top;
    };
    var keep = [];
    all0.forEach(function (e) { var h = hiddenTop(e); if (h && keep.indexOf(h) < 0) { keep.push(h); } });
    var all = all0.filter(function (e) { return !hiddenTop(e); });
    var lab = function (e) { return (e.value || e.textContent || '').trim(); };
    var isBtn = function (e) { return e.tagName === 'BUTTON' || (e.tagName === 'INPUT' && /^(button|submit)$/i.test(e.type)); };
    var hid = all.filter(function (e) { return e.tagName === 'INPUT' && e.type === 'hidden'; });
    var qtyIn = all.filter(function (e) { return e.tagName === 'INPUT' && /^(text|number|tel)$/i.test(e.type); })[0];
    var editB = all.filter(function (e) { return isBtn(e) && /редактировать/i.test(lab(e)); })[0];
    var secB = all.filter(function (e) { return isBtn(e) && secRE.test(lab(e)); });
    var mainB = all.filter(function (e) { return isBtn(e) && e !== editB && secB.indexOf(e) < 0; });
    var others = all.filter(function (e) { return hid.indexOf(e) < 0 && e !== qtyIn && e !== editB && mainB.indexOf(e) < 0 && secB.indexOf(e) < 0; });
    var div = function (cls) { var d = document.createElement('div'); d.className = cls; return d; };
    var span = function (cls, text) { var d = document.createElement('span'); d.className = cls; d.textContent = text; return d; };
    var ct = td.querySelector('#commentText');
    var box = div('bz-card');
    var img = td.querySelector('img');
    if (img) { var pic = div('bz-pic'); pic.appendChild(img); box.appendChild(pic); }
    var head = div('bz-head'), nm = div('bz-nm'), kvs = div('bz-kvs');
    nm.textContent = name.join(' ');
    kv.forEach(function (p) { var d = div('bz-kv'); d.appendChild(span('k', p[0])); d.appendChild(span('v', p[1])); kvs.appendChild(d); });
    head.appendChild(nm); head.appendChild(kvs); box.appendChild(head);
    var kd = hlKind(nm.textContent); if (kd) { head.classList.add(kd); head.__bzk = kd; }
    if (qtyIn || mainB.length) {
      var q = div('bz-qty');
      if (qtyIn) { q.appendChild(span('', label)); q.appendChild(qtyIn); }
      mainB.concat(others).forEach(function (e) { q.appendChild(e); });
      box.appendChild(q);
    }
    if (avail || editB) {
      var av = div('bz-avail'), al = div('bz-avl'); al.appendChild(span('', avail)); if (ct) { al.appendChild(ct); } av.appendChild(al);
      if (editB) { av.appendChild(editB); }
      box.appendChild(av);
    }
    // кнопки «Нет в наличии» и «Пропустить» собираем в один ряд под карточкой
    var acts = div('bz-acts'), pars = [];
    var hideHr = function (el) { ['previousSibling', 'nextSibling'].forEach(function (d) { var q2 = el[d]; while (q2 && ((q2.nodeType === 3 && !q2.nodeValue.trim()) || (q2.nodeType === 1 && /^(HR|BR)$/.test(q2.tagName)))) { if (q2.nodeType === 1) { q2.style.display = 'none'; } q2 = q2[d]; } }); };
    secB.concat([].filter.call(document.querySelectorAll('input.bz-sec,button.bz-sec'), function (b) {
      return secB.indexOf(b) < 0 && !td.contains(b) && !inBar(b) && !b.closest('tr.bz-r,tr.bz-d,#bz-modal') && isBtn(b) && secRE.test(lab(b));
    })).forEach(function (b) { hideHr(b); pars.push(b.parentNode); acts.appendChild(b); });
    var code = (kv.filter(function (p) { return /Артикул/i.test(p[0]); })[0] || [])[1];
    keep.forEach(function (h) { if (h.parentNode) { h.parentNode.removeChild(h); } });
    while (td.firstChild) { td.removeChild(td.firstChild); }
    td.appendChild(box);
    keep.forEach(function (h) { td.appendChild(h); });
    hid.forEach(function (h) { td.appendChild(h); });
    if (acts.children.length) { t.parentNode.insertBefore(acts, t.nextSibling); }
    pars.forEach(function (par) {
      if (par && par !== document.body && !tx(par) && !par.querySelector('input,button,img,select,textarea,table')) { par.style.display = 'none'; hideHr(par); }
    });
    if (code) { t.setAttribute('data-bz-code', code); }
    td.__bzc = 1;
    return true;
  }
  function metaRows(td) {
    if (td.__bzm) { return; }
    td.__bzm = 1;
    var ok = [].every.call(td.childNodes, function (n) { return n.nodeType === 3 || (n.nodeType === 1 && /^(BR|B|SPAN|STRONG|I|EM|FONT)$/.test(n.tagName)); });
    if (!ok) { return; }
    var lines = [], cur = '';
    [].forEach.call(td.childNodes, function (n) { if (n.nodeType === 1 && n.tagName === 'BR') { lines.push(cur); cur = ''; } else { cur += n.textContent; } });
    lines.push(cur);
    lines = lines.map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
    if (!lines.length) { return; }
    td.textContent = '';
    lines.forEach(function (l) {
      var m = /^([^:]{1,40}):\s*(.*)$/.exec(l);
      var d = document.createElement('div');
      if (m) {
        d.className = 'bz-kv';
        var k = document.createElement('span'); k.className = 'k'; k.textContent = m[1];
        var v = document.createElement('span'); v.className = 'v'; v.textContent = m[2] || '—';
        d.appendChild(k); d.appendChild(v);
      } else { d.className = 'bz-kt'; d.textContent = l; }
      td.appendChild(d);
    });
  }

  // ---------- Сборка панели ----------
  function build() {
    if (document.getElementById('bz-bar') || !document.body) { return; }
    bar = mk('div', 'position:sticky;top:0;z-index:2147483647;background:' + P.bar + ';border-bottom:1px solid ' + P.line + ';box-shadow:0 .25em 1em rgba(0,0,0,.5);padding:.5em max(.7em,env(safe-area-inset-right)) .55em max(.7em,env(safe-area-inset-left));display:flex;flex-direction:column;gap:.45em;transition:transform .2s ease;will-change:transform;font:15px/1.35 "Segoe UI",Roboto,system-ui,-apple-system,Arial,sans-serif;color:' + P.tx + ';-webkit-text-size-adjust:100%;');
    bar.id = 'bz-bar';

    tools = mk('div', 'display:none;');
    chips = mk('div', 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45em;');
    skeys.forEach(function (k) {
      var b = btn(k[1]); b.style.borderRadius = '.8em'; b.style.justifyContent = 'flex-start'; b.style.padding = '0 .8em'; b.style.minHeight = '2.7em';
      if (k[0] === 'color') {
        b.title = 'Сортировка по цвету'; b.setAttribute('aria-label', b.title);
        b.textContent = '';
        b.appendChild(mk('span', 'display:block;width:1.05em;height:1.05em;border-radius:50%;margin-right:.5em;background:conic-gradient(rgb(255,140,0),rgb(64,160,255),rgb(150,225,60),rgb(168,98,255),rgb(255,64,64),rgb(32,214,196),rgb(255,140,0));'));
        b.appendChild(document.createTextNode(k[1]));
        b.style.gridColumn = '1 / -1';
      }
      b.__ar = mk('span', 'display:inline-flex;margin-left:auto;'); b.appendChild(b.__ar);
      b.addEventListener('click', function () { setKey(k[0]); sortOpen = false; layout(); });
      sbtn[k[0]] = b; chips.appendChild(b);
    });
    bSort = btn(''); bSort.style.minWidth = '2.6em'; bSort.style.minHeight = '2.4em'; bSort.style.padding = '0'; bSort.title = 'Сортировка'; bSort.setAttribute('aria-label', 'Сортировка'); setIco(bSort, 'sort');
    bSort.style.display = 'none';
    bSort.addEventListener('click', function () { sortOpen = !sortOpen; layout(); });
    tools.appendChild(chips);

    var ib = function (label, title) { var b = btn(label); b.style.minWidth = '2.6em'; b.style.minHeight = '2.4em'; b.style.padding = '0'; b.title = title; b.setAttribute('aria-label', title); return b; };
    bCol = ib('', 'Свернуть');
    bDark = ib('', 'Оформление');
    bLang = ib('', 'Язык страницы'); bTheme = ib('', 'Тема: тёмная / светлая / яркая');
    setIco(bTheme, 'theme');
    if (st.lang) { bLang.textContent = st.lang.toUpperCase(); bLang.style.fontWeight = '800'; bLang.style.fontSize = '.8em'; bLang.style.color = P.gold2; bLang.style.borderColor = P.gold; } else { setIco(bLang, 'globe'); }
    bLang.title = st.lang === 'ru' ? 'Язык: русский (нажмите — English)' : st.lang === 'en' ? 'Language: English (tap — исходный)' : 'Перевод страницы: сейчас исходный (нажмите — русский)';
    bRef = ib('', 'Обновить страницу'); setIco(bRef, 'refresh');
    bPal = ib('', 'Цвета товаров');
    bPal.appendChild(mk('span', 'display:block;width:1.15em;height:1.15em;border-radius:50%;background:conic-gradient(rgb(255,140,0),rgb(64,160,255),rgb(150,225,60),rgb(168,98,255),rgb(255,64,64),rgb(255,140,0));'));
    last = btn('← К списку'); last.style.display = 'none'; last.style.flex = '0 1 auto'; last.style.minWidth = '0'; last.style.overflow = 'hidden';
    stats = mk('div', 'font-size:.88em;color:' + P.mu + ';flex:1 1 0;min-width:0;');
    var icons = mk('div', 'display:flex;gap:.4em;margin-left:auto;flex:none;');
    icons.appendChild(bSort); icons.appendChild(bPal); icons.appendChild(bRef); icons.appendChild(bLang); icons.appendChild(bTheme); icons.appendChild(bDark);
    statRow = mk('div', 'display:flex;gap:.45em;align-items:center;');
    statRow.appendChild(last); statRow.appendChild(stats); statRow.appendChild(icons);

    // палитра: 5 цветов с прозрачностью 20 %, ластик и копирование скрипта
    palRow = mk('div', 'display:none;flex-direction:column;gap:.45em;');
    var sw = mk('div', 'display:flex;gap:.3em;');
    PORD.concat(['x']).forEach(function (k) {
      var b = mk('button', 'align-items:center;justify-content:center;flex:1 1 0;min-width:0;height:2.5em;border-radius:.7em;cursor:pointer;border:2px ' + (k === 'x' ? 'dashed' : 'solid') + ' ' + P.line + ';background-color:' + P.s2 + ';-webkit-tap-highlight-color:transparent;transition:transform .12s ease;' + (k === 'x' ? 'color:' + P.mu + ';font-size:1.1em;font-weight:700;' : 'background-image:linear-gradient(rgba(' + PAL[k].c + ',' + AL + '),rgba(' + PAL[k].c + ',' + AL + '));'));
      b.type = 'button'; b.className = 'bz';
      b.title = k === 'x' ? 'Убрать цвет' : PAL[k].n; b.setAttribute('aria-label', b.title);
      if (k === 'x') { b.textContent = '✕'; } else { b.appendChild(mk('span', 'display:block;width:.7em;height:.7em;border-radius:50%;background:rgb(' + PAL[k].c + ');')); }
      b.addEventListener('click', function () { setTool(k); });
      swb[k] = b; sw.appendChild(b);
    });
    var l2 = mk('div', 'display:flex;align-items:center;gap:.5em;');
    hint = mk('div', 'flex:1 1 auto;min-width:0;font-size:.88em;color:' + P.gold2 + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;');
    bExp = btn('⧉ Скрипт'); bExp.style.minHeight = '2.4em'; bExp.title = 'Скопировать скрипт с вашими цветами';
    bExp.addEventListener('click', openExport);
    l2.appendChild(hint); l2.appendChild(bExp);
    palRow.appendChild(sw); palRow.appendChild(l2);

    bar.appendChild(tools); bar.appendChild(statRow); bar.appendChild(palRow);
    document.body.insertBefore(bar, document.body.firstChild);

    fab = mk('button', 'position:fixed;right:1em;bottom:1em;z-index:2147483646;width:3.2em;height:3.2em;border-radius:50%;align-items:center;justify-content:center;font:inherit;font-size:1.3em;font-weight:700;border:1px solid ' + P.gold + ';background:' + P.bar + ';color:' + P.gold2 + ';box-shadow:0 .2em .8em rgba(0,0,0,.6);cursor:pointer;opacity:.95;');
    setIco(fab, 'top', '1.4em');
    fab.type = 'button'; fab.className = 'bz'; fab.style.display = 'none'; fab.setAttribute('aria-label', 'Наверх');
    document.body.appendChild(fab);

    last.addEventListener('click', function () { var u = getLast(); if (u) { location.href = u; } });
    bRef.addEventListener('click', function () { try { say('Обновляю…', false); location.href = clean(location.href).href; } catch (e) { location.reload(); } });
    bLang.addEventListener('click', function () { st.lang = st.lang === '' ? 'ru' : st.lang === 'ru' ? 'en' : ''; save(); say('Обновляю…', false); location.reload(); });
    bTheme.addEventListener('click', function () { st.theme = st.theme === 'dark' ? 'light' : st.theme === 'light' ? 'pop' : 'dark'; save(); say('Обновляю…', false); location.reload(); });
    bDark.addEventListener('click', function () { st.dark = !st.dark; save(); say('Обновляю…', false); location.reload(); });
    bPal.addEventListener('click', function () { setPaint(!paintOn); });
    // В режиме окраски касание товара красит его и не открывает ссылку.
    document.addEventListener('click', function (e) {
      if (!paintOn || (e.target.closest && e.target.closest('#bz-bar,#bz-modal'))) { return; }
      var code = codeAt(e.target);
      if (code === null || code === '') { return; }
      e.preventDefault(); e.stopPropagation();
      paintTap(code);
    }, true);
    bCol.addEventListener('click', function () { st.col = !st.col; save(); layout(); });
    fab.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    var buzz = function (e) { var b = e.target.closest && e.target.closest('button'); if (b && navigator.vibrate) { try { navigator.vibrate(8); } catch (x) {} } };
    bar.addEventListener('click', buzz); fab.addEventListener('click', buzz);

    // При прокрутке вниз панель прячется, при прокрутке вверх возвращается.
    var tick = 0, lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > lastY + 10 * K && y > 150 * K) { bar.style.transform = 'translateY(-110%)'; lastY = y; }
      else if (y < lastY - 10 * K || y < 40) { bar.style.transform = 'none'; lastY = y; }
      if (tick) { return; }
      tick = setTimeout(function () { tick = 0; fab.style.display = (window.scrollY > 400 * K) ? 'inline-flex' : 'none'; }, 120);
    }, { passive: true });
    var rt = 0;
    var refit = function () { clearTimeout(rt); rt = setTimeout(fit, 150); };
    window.addEventListener('resize', refit);
    window.addEventListener('orientationchange', refit);
    window.addEventListener('load', fit);

    if (st.dark) { buildLogin(); if (!isHandy()) { buildDash(); buildRecords(); buildForms(); } buildDocs(); orderForm(); }
    fit(); paint(); apply();
    try { trackReturn(); } catch (e) {}
    if (st.dark) { decorate(); restylePages(); tightenGap(); window.addEventListener('load', function () { tightenGap(); }); }
    if (st.dark) { try { noZoom(); } catch (e) {} }
    try { startLang(); } catch (e) {}
    hasItem = !!document.querySelector('table.bz-item[data-bz-code]');
    tintItems(); paintSw(); layout();
    if (hasTable) { try { setLast(clean(location.href).href); } catch (e) {} }
    // После «Добавить» из адреса убираем параметры действия, чтобы обновление страницы не добавило товар ещё раз.
    try {
      var u0 = new URL(location.href);
      if (u0.searchParams.get('action') === 'add_new_offer') {
        ['action', 'code', 'count'].forEach(function (k) { u0.searchParams.delete(k); });
        history.replaceState(null, '', u0.pathname + u0.search + u0.hash);
      }
    } catch (e) {}
  }

  var LANGD = [["Главная", "Main"], ["Склад", "Warehouse"], ["Кухня", "Kitchen"], ["Инвентаризация", "Inventory"], ["Инветаризация", "Inventory"], ["Инструменты", "Tools"], ["Хенди", "Handy"], ["Выход", "Logout"], ["Склад Кипр", "Cyprus warehouse"], ["Кипр", "Cyprus"], ["Информация о товаре", "Product information"], ["Приемка товара", "Goods receiving"], ["Отгрузка товаров с кухни", "Shipment of kitchen goods"], ["Привязка товара", "Product linking"], ["Перемещение товара", "Moving goods"], ["Сборка заказа", "Order picking"], ["Отгрузки (в магазины)", "Shipments (to stores)"], ["Заказ на склад", "Warehouse order"], ["Приемки (на склад)", "Receipts (to warehouse)"], ["Отгрузки (кухня)", "Shipments (kitchen)"], ["Закрытие дня", "Day closing"], ["Стат.инвент.", "Inventory stats"], ["Заказ на кухню", "Kitchen order"], ["Движение товара", "Goods movement"], ["Вход в аккаунт Берёзка онлайн", "Sign in to your Berezka Online account"], ["Логин", "Login"], ["Пароль", "Password"], ["Показать пароль", "Show password"], ["Скрыть пароль", "Hide password"], ["Кол-во", "Qty"], ["Код", "Code"], ["Название", "Name"], ["Надо", "Need"], ["Есть", "Have"], ["Добавить товар в заказ", "Add product to order"], ["добавить товар", "add product"], ["Доступно на полке", "Available on shelf"], ["Помещение", "Room"], ["Ряд", "Row"], ["Стелаж", "Rack"], ["Полка", "Shelf"], ["Ед.изм", "Unit"], ["Остаток", "Stock"], ["Артикул", "Article"], ["Уже собрано", "Already picked"], ["Подтвердите количество подобранного с полки товара", "Confirm the quantity picked from the shelf"], ["Отсканируйте место хранения", "Scan the storage location"], ["Скан", "Scan"], ["Добавить", "Add"], ["НЕТ ВНАЛИЧИИ", "OUT OF STOCK"], ["ПРОПУСТИТЬ", "SKIP"], ["Собрать", "Pick"], ["Редактировать", "Edit"], ["Сохранить", "Save"], ["Отмена", "Cancel"], ["НАЧАЛО", "START"], ["НАЗАД", "BACK"], ["В НАЧАЛО", "TO START"], ["Начать", "Start"], ["Войти", "Log in"], ["← К списку", "← To list"], ["Сушняк", "Dry"], ["Сушяк", "Dry"], ["Охлажденка", "Chilled"], ["Заморозка", "Frozen"], ["Без типа", "No type"], ["Ожидается", "Expected"], ["Собрать магазинов", "Stores to pick"], ["Всего магазинов в сборке", "Total stores in picking"], ["Поиск: магазин или номер", "Search: store or number"], ["Поиск по списку", "Search the list"], ["Ничего не найдено", "Nothing found"], ["Список пуст", "The list is empty"], ["Заказ для магазина", "Order for store"], ["Инвентаризации магазинов и складов", "Store and warehouse inventories"], ["Список инвентризций", "Inventory list"], ["Список накладных", "Invoice list"], ["Отгрузки в магазины", "Shipments to stores"], ["Номер инвент.", "Inventory no."], ["Номер накладной", "Invoice number"], ["Номер документа", "Document number"], ["Дата", "Date"], ["Тип", "Type"], ["Статус", "Status"], ["Получено", "Received"], ["Скачать итоги", "Download totals"], ["От", "From"], ["До", "To"], ["Проверить", "Check"], ["Удалить", "Delete"], ["скачать", "download"], ["удалить", "delete"], ["печать", "print"], ["частичная", "partial"], ["полная", "full"], ["Склад отгрузки", "Shipping warehouse"], ["Склад приемки", "Receiving warehouse"], ["Собрано", "Collected"], ["С типом 0", "With type 0"], ["Документ", "Document"], ["Расхождения", "Discrepancies"], ["Коммент", "Comment"], ["Действия", "Actions"], ["Откатить", "Roll back"], ["ПРИНЯТЬ", "ACCEPT"], ["РЕД.", "EDIT"], ["РАЗДЕЛИТЬ", "SPLIT"], ["СПИСОК НАКЛАДНЫХ", "INVOICE LIST"], ["АРХИВ", "ARCHIVE"], ["ТЕРМИНАЛ", "TERMINAL"], ["ТОВАР ПРОПУЩЕН", "PRODUCT SKIPPED"], ["ТОВАР НЕ НАЙДЕН", "PRODUCT NOT FOUND"], ["Фильтр", "Filter"], ["Все", "All"], ["Формат", "Format"], ["Магазин", "Shop"], ["Загрузить", "Load"], ["Выберите файл полученный из МИ (перемещение товара)", "Select the file received from MI (goods transfer)"], ["Комментарии", "Comments"], ["Печать", "Print"], ["Отгрузки в магазины с кухни", "Shipments to stores from the kitchen"], ["Выберите файл, полученный из ABM", "Select the file received from ABM"], ["Создать новый документ", "Create new document"], ["Создать", "Create"], ["Дата документа", "Document date"], ["ВНИМАНИЕ! Имеются ошибки с накладным", "ATTENTION! There are errors with invoices"], ["Накладной вообще нет в МИ!", "The invoice is not in MI at all!"], ["Магазин в МИ", "Shop in MI"], ["Магазин в Базе", "Shop in the database"], ["vs Прошлый месяц", "vs Last month"], ["vs Прошлый год", "vs Last year"], ["Все магазины", "All shops"], ["Оборот за", "Turnover for"], ["Топ магазинов по продажам", "Top shops by sales"], ["Топ магазинов по валовому доходу", "Top shops by gross profit"], ["Средний чек", "Average receipt"], ["Сводная статистика по магазинам", "Summary statistics by shop"], ["оборот с начала месяца", "turnover since start of month"], ["% к прошлому месяцу", "% vs last month"], ["количество клиентов с начала месяца", "customers since start of month"], ["среднедневной оборот", "average daily turnover"], ["среднедневное количество клиентов", "average daily customers"], ["брак с начала месяца", "defects since start of month"], ["Прогноз по браку", "Defects forecast"], ["ИЗМЕНИТЬ", "CHANGE"], ["Итого за месяц", "Total for the month"], ["Сегодня", "Today"], ["В среднем в день", "Average per day"], ["Сегодняшний день ещё не завершён.", "Today is not over yet."], ["Позиций", "Items"], ["Вес", "Weight"], ["Сканируйте или введите код", "Scan or enter the code"], ["Цвет", "Colour"], ["Напитки", "Drinks"], ["Обновляю…", "Refreshing…"]];
  var LMAP = {};
  function lnorm(t) { return String(t).replace(/[\[\]]/g, '').replace(/\s+/g, ' ').replace(/[\s:]+$/, '').trim().toLowerCase(); }
  function lmap(mode) {
    if (LMAP[mode]) { return LMAP[mode]; }
    var m = {}, keys = [];
    LANGD.forEach(function (p) {
      var from = mode === 'en' ? p[0] : p[1], to = mode === 'en' ? p[1] : p[0], k = lnorm(from);
      if (!(k in m)) { m[k] = to; if (k.length >= 5) { keys.push(k); } }
    });
    keys.sort(function (a, b) { return b.length - a.length; });
    LMAP[mode] = { m: m, keys: keys };
    return LMAP[mode];
  }
  function lcase(src, out) {
    var letters = src.replace(/[^\p{L}]/gu, '');
    if (letters.length > 2 && letters === letters.toUpperCase()) { return out.toUpperCase(); }
    if (/^\p{Ll}/u.test(src.trim())) { return out.charAt(0).toLowerCase() + out.slice(1); }
    return out;
  }
  // Возвращает перевод строки или null, если ничего знакомого нет. Названия товаров и магазинов не трогаются.
  function ltr(text, L) {
    var core = text.trim();
    if (!core || core.length > 160) { return null; }
    var at = text.indexOf(core), lead = text.slice(0, at), trail = text.slice(at + core.length), m = L.m;
    var bare = core.replace(/[\[\]]/g, '').replace(/[\s:]+$/, ''), k = lnorm(core);
    var paren = function (s) { return s.replace(/\(([^()]+)\)/g, function (x, i) { var t = m[lnorm(i)]; return t ? '(' + lcase(i, t) + ')' : x; }); };
    if (m[k] !== undefined) {
      var o = lcase(bare, m[k]);
      if (/:\s*$/.test(core)) { o += ':'; }
      if (/^\[.*\]$/.test(core)) { o = '[' + o + ']'; }
      return lead + o + trail;
    }
    var mm = /^([^:]{2,60}):\s*(.+)$/.exec(core);
    if (mm && m[lnorm(mm[1])] !== undefined) { return lead + lcase(mm[1], m[lnorm(mm[1])]) + ': ' + paren(mm[2]) + trail; }
    var low = core.toLowerCase();
    for (var i = 0; i < L.keys.length; i++) {
      var key = L.keys[i];
      if (low.indexOf(key) === 0 && !/[\p{L}\d]/u.test(low.charAt(key.length) || ' ')) {
        return lead + lcase(core.slice(0, key.length), m[key]) + paren(core.slice(key.length)) + trail;
      }
    }
    return null;
  }
  function langWalk(root, L) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) {
      var p = n.parentNode;
      if (!p || /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(p.nodeName) || !n.nodeValue.trim() || (p.closest && p.closest('.bz-brand'))) { continue; }
      list.push(n);
    }
    list.forEach(function (t) { var o = ltr(t.nodeValue, L); if (o !== null && o !== t.nodeValue) { t.nodeValue = o; } });
    // подписи кнопок-не-отправителей, подсказки и placeholder (value у submit не трогаем: сервер может его читать)
    [].forEach.call(root.querySelectorAll('input[type=button],input[type=submit]:not([name])'), function (el) { var o = ltr(el.value || '', L); if (o !== null) { el.value = o; } });
    [].forEach.call(root.querySelectorAll('[placeholder],[title],[aria-label]'), function (el) {
      ['placeholder', 'title', 'aria-label'].forEach(function (a) {
        var v = el.getAttribute(a);
        if (v) { var o = ltr(v, L); if (o !== null && o !== v) { el.setAttribute(a, o); } }
      });
    });
  }
  function startLang() {
    if (!st.lang || window.__bzLang) { return; }
    window.__bzLang = 1;
    var L = lmap(st.lang), tm = 0, mo = null;
    var run = function () {
      if (mo) { mo.disconnect(); }
      try { langWalk(document.body, L); } catch (e) {}
      var brd = document.querySelector('.bz-brand');
      if (brd && !brd.__bzl) { brd.__bzl = 1; brd.textContent = st.lang === 'ru' ? 'Склад Кипр' : 'Cyprus warehouse'; }
      if (mo) { mo.observe(document.body, { childList: true, subtree: true, characterData: true }); }
    };
    mo = new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(run, 400); });
    run();
    window.addEventListener('load', run);
  }
  // Без увеличения при вводе текста: пока открыто поле, масштаб страницы закреплён на текущем значении (мета-тег живёт только это время).
  var NOZOOM = true;
  function noZoom() {
    var vv = window.visualViewport;
    if (!NOZOOM || !vv || window.__bzNZ) { return; }
    window.__bzNZ = 1;
    var vm = null, ex = null, old = '', tm = 0;
    var isField = function (e) { return !!(e && e.tagName && /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName) && !/^(button|submit|checkbox|radio|hidden)$/i.test(e.type || '')); };
    var lock = function () {
      clearTimeout(tm);
      var sc = vv.scale;
      if (!sc || sc <= 0) { return; }
      var v = sc.toFixed(4), add = 'minimum-scale=' + v + ',maximum-scale=' + v;
      if (vm) { vm.content = (ex ? old + ',' : '') + add; return; }
      ex = document.querySelector('meta[name=viewport]');
      if (ex) { old = ex.getAttribute('content') || ''; vm = ex; } else { vm = document.createElement('meta'); vm.name = 'viewport'; (document.head || document.documentElement).appendChild(vm); }
      vm.content = (ex ? old + ',' : '') + add;
    };
    var unlock = function () {
      clearTimeout(tm);
      tm = setTimeout(function () {
        if (isField(document.activeElement)) { return; }
        if (vm) { if (ex) { ex.setAttribute('content', old); } else { vm.remove(); } vm = null; ex = null; }
      }, 700);
    };
    document.addEventListener('focusin', function (e) { if (isField(e.target) && !inBar(e.target)) { lock(); } }, true);
    document.addEventListener('focusout', function (e) { if (isField(e.target)) { unlock(); } }, true);
    document.addEventListener('pointerdown', function (e) {
      var t = e.target; if (!t || !t.closest || inBar(t)) { return; }
      var c = t.closest('input,textarea,select,button,#editBtn');
      if (!c) { return; }
      if (isField(c)) { lock(); } else if (/редактир|изменит/i.test(c.value || c.textContent || '')) { lock(); unlock(); }
    }, true);
  }

  function start() { build(); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }
})();
