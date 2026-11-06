// ==UserScript==
// @name         Сортировка заказа Берёзка
// @namespace    bz-order-sort
// @version      3.11
// @description  Сортировка товаров заказа и аккуратное тёмное оформление страниц wms.berezka.cy. Рассчитано на телефон.
// @match        https://wms.berezka.cy/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==
(function bzMain() {
  'use strict';
  if (window.__bzSort) { return; }
  window.__bzSort = 1;

  var SKEY = 'bz-sort-v3', LKEY = 'bz-last-order';
  // Палитра: графит и тёплое золото.
  var P = { bg: '#0b0d10', bar: '#0f1216', s1: '#12151a', s2: '#1a1e25', line: '#262b33', tx: '#eceae4', mu: '#8e939c', gold: '#d6b36a', gold2: '#e8cd92', fg: '#1a1406', err: '#e58a84' };
  var VER = '3.11';
  var st = { key: 'code', dir: -1, dark: true, col: false, tool: 'o' };
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
  var GRAD = 'linear-gradient(180deg,#e8cd92,#d6b36a 55%,#c29d54)';
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
    'tr.bz-w > td{background-image:linear-gradient(rgba(255,140,0,.3),rgba(255,140,0,.3)) !important}',
    'tr.bz-v > td{background-image:linear-gradient(rgba(64,160,255,.3),rgba(64,160,255,.3)) !important}',
    'tr.bz-s-red > td{background:#1d1416 !important}',
    'tr.bz-s-amb > td{background:#1e1912 !important}',
    'tr.bz-s-grn > td{background:#111d17 !important}',
    'tr.bz-s-blu > td{background:#121a25 !important}',
    'tr.bz-r > td:first-child{border-radius:16px 0 0 16px;font-size:26px;font-weight:600;color:' + P.mu + ' !important;text-align:center;box-shadow:inset 7px 0 0 #5b616b}',
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
    'tr.bz-d table td{font-size:25px !important;font-weight:500;line-height:1.3;padding:10px 12px !important;border-radius:10px;background:' + P.s1 + ' !important;color:#aab1bb !important;border:1px solid ' + P.line + ' !important}',
    'tr.bz-e{display:none !important}',
    '.bz-arrow{white-space:nowrap}',
    'tr.bz-h td{white-space:nowrap}',
    '.bz-note br,table.bz-scanbox + br{display:none}',

    // поля ввода и кнопки (размеры сайта не меняем)
    'input:not(.bz)[type=text],input:not(.bz):not([type]),input:not(.bz)[type=number],input:not(.bz)[type=search],input:not(.bz)[type=tel]{background:' + P.s1 + ' !important;color:' + P.tx + ' !important;border:2px solid #2d333c !important;border-radius:14px !important;padding:.3em .6em !important;box-sizing:border-box;max-width:100%}',
    'input:not(.bz)[type=text]:focus,input:not(.bz):not([type]):focus,input:not(.bz)[type=number]:focus{border-color:' + P.gold + ' !important;outline:none;box-shadow:0 0 0 4px rgba(214,179,106,.22)}',
    'input:not(.bz)[type=submit],input:not(.bz)[type=button],button:not(.bz){background:' + GRAD + ' !important;color:' + P.fg + ' !important;border:0 !important;border-radius:16px !important;font-weight:700 !important;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.4)}',
    'input:not(.bz).bz-sec[type=button],input:not(.bz).bz-sec[type=submit],button:not(.bz).bz-sec{background:' + P.s2 + ' !important;color:' + P.tx + ' !important;border:2px solid #343a44 !important;box-shadow:none !important}',

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
    'table.bz-item td.bz-c-edit input,tab
