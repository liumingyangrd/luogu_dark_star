// ==UserScript==
// @name         洛谷 · 暗星
// @namespace    https://github.com/liumingyangrd/luogu_dark_star
// @homepageURL  https://github.com/liumingyangrd/luogu_dark_star
// @updateURL    https://raw.githubusercontent.com/liumingyangrd/luogu_dark_star/main/dist/flins.user.js
// @downloadURL  https://raw.githubusercontent.com/liumingyangrd/luogu_dark_star/main/dist/flins.user.js
// @version      2.0.9
// @description  为洛谷换上一套深色主题：深靛蓝夜色 + 冷蓝焰 + 金色新月 + 灯塔剪影。支持自定义背景图片（内置 / 链接 / 本地上传）、深浅两套形态、四种强调色与毛玻璃开关。
// @author       liumingyangrd
// @license      MIT
// @match        *://*.luogu.com.cn/*
// @match        *://*.luogu.com/*
// @match        *://*.luogu.me/*
// @icon         data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230B0F2B'/%3E%3Cpath d='M52.4 6.4a8.8 8.8 0 1 0 6.3 10.6 7 7 0 1 1-6.3-10.6z' fill='%23F0C070'/%3E%3Crect x='24.6' y='16.2' width='10.8' height='13.4' rx='1.8' fill='%230B0F2B' stroke='%23C8CBD6' stroke-width='1.3'/%3E%3Cpath d='M30 18.4c2.7 3.3 3.9 5.1 3.9 7.1a3.9 3.9 0 0 1-7.8 0c0-2 1.2-3.8 3.9-7.1z' fill='%2360E0F0'/%3E%3Cpath d='M25.6 30.4h8.8l2.4 19.0H23.2z' fill='%23101640'/%3E%3C/svg%3E
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

 
(function () {
  'use strict';

   

   
  const THEME_CSS = /* @flins:css */ "" /* @flins:css-end */;

   
  const BUILTIN_BG = /* @flins:bg */ {} /* @flins:bg-end */;

   
  const EMBLEM_SVG = /* @flins:emblem */ "" /* @flins:emblem-end */;

  
  
  
  const STORE_KEY = 'flins-theme-v1';

  const PRESET_ACCENTS = {
    ghost: { name: '幽焰青', hex: '#60E0F0' },
    volt:  { name: '雷紫',   hex: '#9C8CFF' },
    lamp:  { name: '提灯金', hex: '#F0C070' },
    
    luogu: { name: '洛谷蓝', hex: '#3498DB' },
  };

  const DEFAULTS = {
    mode: 'auto',            
    accent: 'ghost',         
    accentCustom: '#60E0F0',
    bgSource: 'auto',        
    bgUrl: '',
    bgUpload: '',            
    bgBlur: 0,
    bgBrightness: 1,
    bgZoom: 1,
    bgPosition: 'center center',
    bgSize: 'cover',
    bgRepeat: 'no-repeat',
    bgScrim: 0.5,
    glass: true,
    ornaments: true,
    motion: true,
    autoPatch: true,         
    pluginColorCompat: true,
    pet: false,              
    petForm: 'fish',        
    petFed: 60,              
    petLove: 0,              
    petX: -1,                
    petY: -1,                
    petAt: 0,
    petScale: 1,
    petApiKey: '',
    petApiBase: 'https://api.deepseek.com/chat/completions',
    petMealTimes: '08:00,12:00,18:00',
    petMealWindow: 45,
    petModel: 'deepseek-chat',                     
    ornamentStyle: 'lamp',   
    layout: 'flins',         
    navMode: 'inline',       
    fabImage: '',            
    emblemImage: '',         
    lampImage: '',           
  };

  /** 把外部来的对象合并进默认配置。
   *  ⚠️ 一定要逐项校验类型：存储里的旧版本数据、或者用户手改坏的 JSON，
   *  直接 Object.assign 会让 cfg 带着错误类型进 apply()（比如 bgBlur 变成字符串），
   *  轻则样式算不出来，重则整段 apply 抛错、主题整个不生效。 */
  function mergeCfg(base, obj) {
    const out = Object.assign({}, base);
    if (!obj || typeof obj !== 'object') return out;
    for (const k of Object.keys(base)) {
      if (!(k in obj)) continue;
      const a = base[k], b = obj[k];
      if (b === null || typeof b !== typeof a) continue;
      if (Array.isArray(a) !== Array.isArray(b)) continue;
      out[k] = b;
    }
    return out;
  }

  const store = {
    read() {
      try {
        if (typeof GM_getValue === 'function') {
          const raw = GM_getValue(STORE_KEY, null);
          if (raw) return mergeCfg(DEFAULTS, typeof raw === 'string' ? JSON.parse(raw) : raw);
        }
      } catch (e) {   }
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) return mergeCfg(DEFAULTS, JSON.parse(raw));
      } catch (e) {   }
      return Object.assign({}, DEFAULTS);
    },
    write(cfg) {
      const payload = JSON.stringify(cfg);
      try {
        if (typeof GM_setValue === 'function') { GM_setValue(STORE_KEY, payload); return; }
      } catch (e) {   }
      try { localStorage.setItem(STORE_KEY, payload); } catch (e) {   }
    },
  };

   
  function luoguBlurDisabled() {
    try { return localStorage.getItem('themeBlurPreference') === 'disabled'; } catch (e) { return false; }
  }

  let cfg = store.read();

  
  
  
  function hexToRgb(hex) {
    let h = String(hex || '').trim().replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return [96, 224, 240];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function toHex(rgb) {
    return '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }

  function mix(c, target, t) {
    return c.map((v, i) => v + (target[i] - v) * t);
  }

  function resolveMode() {
    if (cfg.mode === 'dark' || cfg.mode === 'light') return cfg.mode;
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) { return 'dark'; }
  }

  function currentAccent() {
    if (cfg.accent === 'custom') return { hex: cfg.accentCustom, name: '自定义' };
    return PRESET_ACCENTS[cfg.accent] || PRESET_ACCENTS.ghost;
  }

  function currentBgImage(isLight) {
    switch (cfg.bgSource) {
      
      case 'auto':          return (isLight ? BUILTIN_BG.light : BUILTIN_BG.dark)
                                   ? 'url("' + (isLight ? BUILTIN_BG.light : BUILTIN_BG.dark) + '")' : 'none';
      case 'builtin-dark':  return BUILTIN_BG.dark ? 'url("' + BUILTIN_BG.dark + '")' : 'none';
      case 'builtin-light': return BUILTIN_BG.light ? 'url("' + BUILTIN_BG.light + '")' : 'none';
      case 'url':           return cfg.bgUrl ? 'url("' + cfg.bgUrl.replace(/"/g, '\\"') + '")' : 'none';
      case 'upload':        return cfg.bgUpload ? 'url("' + cfg.bgUpload + '")' : 'none';
      default:              return 'none';
    }
  }

  function glassEffective() {
    return cfg.glass && !luoguBlurDisabled();
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  const SKIP_TAGS = new Set(['IMG', 'VIDEO', 'CANVAS', 'SVG', 'IFRAME', 'INPUT',
    'TEXTAREA', 'SELECT', 'OPTION', 'CODE', 'PRE', 'HR', 'BR', 'PATH']);

  function parseColor(str) {
    const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)/.exec(str || '');
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  }

   
  function findWhitePatches() {
    const hits = [];
    const all = document.body ? document.body.querySelectorAll('*') : [];
    for (const el of all) {
      if (SKIP_TAGS.has(el.tagName)) continue;
      if (el.closest('.flins-panel, .flins-fab, #flins-theme-style, .cm-editor')) continue;

      const r = el.getBoundingClientRect();
      
      
      if (r.width < 20 || r.height < 14) continue;

      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.5) continue;
      
      if (cs.backgroundImage && cs.backgroundImage !== 'none') continue;

      const bg = parseColor(cs.backgroundColor);
      if (!bg || bg.a < 0.6) continue;
      if (Math.min(bg.r, bg.g, bg.b) < 200) continue;      
      if (Math.max(bg.r, bg.g, bg.b) - Math.min(bg.r, bg.g, bg.b) > 26) continue; 

      
      
      
      

      
      
      
      

      hits.push(el);
    }
    return hits;
  }

   
  function patchWhitePatches() {
    const hits = findWhitePatches();
    const sample = [];
    for (const el of hits) {
      const cls = typeof el.className === 'string' ? el.className.trim().slice(0, 60) : '';
      if (sample.length < 12) sample.push(el.tagName.toLowerCase() + (cls ? '.' + cls.split(/\s+/).join('.') : ''));
      markFix(el, 'background-color', 'var(--flins-surface)');
      markFix(el, 'color', el.tagName === 'A' ? 'var(--lcolor--link)' : 'var(--flins-text)');
    }
    return { fixed: hits.length, sample };
  }

  
  
  
  const appliedFixes = [];

  function markFix(el, prop, value) {
    appliedFixes.push({
      el, prop,
      prev: el.style.getPropertyValue(prop),
      prevPri: el.style.getPropertyPriority(prop),
    });
    el.style.setProperty(prop, value, 'important');
    // ⚠️ 只设 color 不够：洛谷大量标题同时写了 -webkit-text-fill-color（更深色），
    // 而 fill 的优先级高于 color —— 只改 color 会得到「color 是白的、字却是黑的」。
    if (prop === 'color') {
      appliedFixes.push({
        el, prop: '-webkit-text-fill-color',
        prev: el.style.getPropertyValue('-webkit-text-fill-color'),
        prevPri: el.style.getPropertyPriority('-webkit-text-fill-color'),
      });
      el.style.setProperty('-webkit-text-fill-color', value, 'important');
    }
  }

  function clearFixes() {
    for (let i = appliedFixes.length - 1; i >= 0; i -= 1) {
      const f = appliedFixes[i];
      try {
        if (f.prev) f.el.style.setProperty(f.prop, f.prev, f.prevPri);
        else f.el.style.removeProperty(f.prop);
      } catch (e) {   }
    }
    appliedFixes.length = 0;
  }

   
  function hasOwnText(el) {
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.textContent.trim().length >= 1) return true;
    }
    return false;
  }

  let patchTimer = null;

  
  
  
  
  
  function relLum(c) {
    const f = c.map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  }

   
  function bgBehind(el) {
    let p = el;
    while (p && p !== document.documentElement) {
      const cs = getComputedStyle(p);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') break;
      const bg = parseColor(cs.backgroundColor);
      if (bg && bg.a >= 0.9) return [bg.r, bg.g, bg.b];
      p = p.parentElement;
    }
    
    return resolveMode() === 'light' ? [236, 242, 253] : [11, 15, 43];
  }

  function patchLowContrast() {
    const fixed = [];
    const all = document.body ? document.body.querySelectorAll('*') : [];
    for (const el of all) {
      if (SKIP_TAGS.has(el.tagName)) continue;
      if (el.closest('.flins-panel, .flins-fab, .cm-editor')) continue;
      
      
      
      if (el.closest('[class*="lg-fg-"], [class*="lcolor--"], [class*="lcolor-var-"]')) continue;
      
      
      
      
      
      
      const hasText = hasOwnText(el);
      if (!hasText) continue;

      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.4) continue;

      const fg = parseColor(cs.color);
      const bg = bgBehind(el);
      if (!fg || !bg) continue;

      const mix = fg.a >= 1 ? [fg.r, fg.g, fg.b] : [
        fg.a * fg.r + (1 - fg.a) * bg[0],
        fg.a * fg.g + (1 - fg.a) * bg[1],
        fg.a * fg.b + (1 - fg.a) * bg[2],
      ];
      const L1 = relLum(mix), L2 = relLum(bg);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      if (ratio >= 4.5) continue;

      
      
      
      const fgIsDark = L1 < 0.2;
      if (fgIsDark) {
        
        if (fixed.length < 400) {
          markFix(el, 'color', 'var(--flins-text)');
          fixed.push(describe(el) + '(' + ratio.toFixed(2) + ':1)');
        }
      } else if (isNearAccent(bg)) {
        
        
        
        
        
        
        if (fixed.length < 400) {
          markFix(el, 'color', 'var(--flins-on-accent)');
          fixed.push(describe(el) + '(' + ratio.toFixed(2) + ':1,强调色底)');
        }
      }
    }
    return fixed;
  }

  function describe(el) {
    const cls = typeof el.className === 'string' ? el.className.trim() : '';
    return cls ? el.tagName.toLowerCase() + '.' + cls.split(/\s+/)[0] : el.tagName.toLowerCase();
  }

   
  function isNearAccent(bg) {
    const acc = hexToRgb(currentAccent().hex);
    const tol = 52;
    return Math.abs(bg[0] - acc[0]) < tol
        && Math.abs(bg[1] - acc[1]) < tol
        && Math.abs(bg[2] - acc[2]) < tol;
  }

   
  function patchTriangleTails() {
    const fixed = [];
    for (const el of document.body.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      const w = parseFloat(cs.width), h = parseFloat(cs.height);
      if (w > 3 || h > 3) continue;                       
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const sides = ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
      let light = 0, solid = 0;
      const vals = {};
      for (const s of sides) {
        const c = parseColor(cs[s]);
        const width = parseFloat(cs[s.replace('Color', 'Width')]) || 0;
        if (width <= 0 || !c || c.a < 0.5) continue;
        solid += 1;
        vals[s] = c;
        if (Math.min(c.r, c.g, c.b) >= 190) light += 1;
      }
      if (!solid || light !== solid) continue;             
      
      let p = el.parentElement, target = null;
      while (p && p !== document.documentElement) {
        const pcs = getComputedStyle(p);
        const bg = parseColor(pcs.backgroundColor);
        if (bg && bg.a >= 0.6) { target = pcs.backgroundColor; break; }
        p = p.parentElement;
      }
      if (!target) target = 'var(--flins-surface)';
      for (const s of Object.keys(vals)) {
        markFix(el, 'border-' + s.replace('border', '').replace('Color', '').toLowerCase() + '-color', target);
      }
      fixed.push(describe(el) + '→' + target);
    }
    return fixed;
  }

  let patchDeadline = 0;

  /** 兼容第三方上色插件（如 luogu_bot1）。
   *
   *  这类插件会给题号链接写行内 style.color 标难度色。但洛谷给这些链接下了
   *  :visited，浏览器出于隐私限制会让行内 color 在 :visited 下失效
   *  （实测行内 rgb(254,76,97) → computed rgb(158,158,255)）。
   *  CSS 层面无解（主样式表跨域、枚举不到），只能把行内色提升为 !important。
   *
   *  ⚠️ 只处理【插件已经写了行内 color】的元素，主题自己不上任何色。
   *  这也是「所有人变灰名」的教训：主题不要抢着给别人的元素定颜色。 */
  function boostPluginColors() {
    let n = 0;
    for (const el of document.querySelectorAll('[style*="color"]')) {
      if (el.closest('.flins-panel, .flins-fab')) continue;
      if (el.style.getPropertyPriority('color') === 'important') continue;
      const raw = el.style.getPropertyValue('color');
      if (!raw) continue;
      try {
        el.style.setProperty('color', raw, 'important');
        el.style.setProperty('-webkit-text-fill-color', raw, 'important');
        el.setAttribute('data-flins-pc', '1');
        n += 1;
      } catch (e) { /* 忽略 */ }
    }
    return n;
  }

  /** 关掉兼容开关时，把提升过的行内色降级回普通行内样式 */
  function unboostPluginColors() {
    for (const el of document.querySelectorAll('[data-flins-pc]')) {
      try {
        const raw = el.style.getPropertyValue('color');
        if (raw) el.style.setProperty('color', raw, '');
        el.style.removeProperty('-webkit-text-fill-color');
        el.removeAttribute('data-flins-pc');
      } catch (e) { /* 忽略 */ }
    }
  }


  
  function patchProblemActions() {
    const bar = document.querySelector('.problem-block-actions');
    if (!bar) return 0;
    const style = bar.style;
    style.position = 'relative';
    style.zIndex = '999';
    style.pointerEvents = 'auto';
    
    for (const a of bar.querySelectorAll('a')) {
      a.style.position = 'relative';
      a.style.zIndex = '999';
      a.style.pointerEvents = 'auto';
    }
    return bar.querySelectorAll('a').length;
  }

  function runPatches() {
    
    
    const errs = (window.__flinsPatchErrors = window.__flinsPatchErrors || []);
    const out = { white: null, dim: null, tails: null };
    try { out.white = patchWhitePatches(); } catch (e) { errs.push('white: ' + (e && e.message)); }
    try { out.dim = patchLowContrast(); } catch (e) { errs.push('dim: ' + (e && e.message)); }
    try { out.tails = patchTriangleTails(); } catch (e) { errs.push('tails: ' + (e && e.message)); }
    try { out.actions = patchProblemActions(); } catch (e) { errs.push('actions: ' + (e && e.message)); }
    
    try { syncNavBounds(); } catch (e) { errs.push('navbounds: ' + (e && e.message)); }
    // 题号难度色：和「白块自愈 / 深色模式」无关，两形态都要跑
    try { out.pluginColors = boostPluginColors(); } catch (e) { errs.push('pluginColors: ' + (e && e.message)); }
    return out;
  }

  
  
  
  
  function schedulePatch() {
    // 题号难度色独立于「白块自愈」与形态判断，先跑一遍
    try { if (cfg.pluginColorCompat) boostPluginColors(); } catch (e) { /* 忽略 */ }
    if (!cfg.autoPatch) return;
    if (resolveMode() !== 'dark') return;
    const now = Date.now();
    if (!patchDeadline) patchDeadline = now + 1500;   
    clearTimeout(patchTimer);
    patchTimer = setTimeout(() => {
      patchDeadline = 0;
      runPatches();
    }, Math.max(0, Math.min(600, patchDeadline - now)));
  }

  
  
  
  function apply() {
    const root = document.documentElement;
    const isLight = resolveMode() === 'light';
    const accent = currentAccent();
    const rgb = hexToRgb(accent.hex);

    
    
    
    clearFixes();

    root.classList.toggle('flins-light', isLight);
    root.classList.toggle('flins-dark', !isLight);
    root.classList.toggle('flins-glass-off', !glassEffective());
    root.classList.toggle('flins-ornaments-off', !cfg.ornaments);
    root.classList.toggle('flins-motion-off', !cfg.motion);
    root.classList.toggle('flins-problem-colors-off', !cfg.pluginColorCompat);
    // 开关切换时同步行内样式：关掉就撤销我们加的 !important，让主题色接管
    try { if (cfg.pluginColorCompat) boostPluginColors(); else unboostPluginColors(); } catch (e) { /* 忽略 */ }
    try { petSync(); } catch (e) { /* 忽略 */ }
    
    for (const s of ['lamp', 'moon', 'none']) {
      root.classList.toggle('flins-orn-' + s, cfg.ornamentStyle === s);
    }
    
    
    
    for (const name of Object.keys(PRESET_ACCENTS)) {
      root.classList.toggle('flins-accent-' + name, cfg.accent === name);
    }
    
    root.classList.toggle('flins-layout-flins', cfg.layout === 'flins');
    root.classList.toggle('flins-layout-classic', cfg.layout !== 'flins');
    for (const nm of ['inline', 'stack', 'side']) {
      root.classList.toggle('flins-nav-' + nm, cfg.layout === 'flins' && cfg.navMode === nm);
    }

    const base = isLight ? '233, 239, 250' : '6, 9, 26';
    
    
    const k = cfg.bgScrim * (cfg.layout === 'flins' ? 0.62 : 1);
    const clamp = (v) => Math.max(0, Math.min(0.98, v));
    const scrim = cfg.bgSource === 'none'
      ? (isLight ? 'linear-gradient(180deg, #EEF3FC 0, #E6EDF9 100%)'
                 : 'linear-gradient(180deg, #0B0F2B 0, #080B21 100%)')
      : 'linear-gradient(180deg,'
        + ' rgba(' + base + ', ' + clamp(k + 0.18) + ') 0,'
        + ' rgba(' + base + ', ' + clamp(k - 0.1) + ') 240px,'
        + ' rgba(' + base + ', ' + clamp(k + 0.04) + ') 62%,'
        + ' rgba(' + base + ', ' + clamp(k + 0.22) + ') 100%)';

    const vars = {
      '--flins-bg-image': currentBgImage(isLight),
      '--flins-bg-size': cfg.bgSize,
      '--flins-bg-position': cfg.bgPosition,
      '--flins-bg-repeat': cfg.bgRepeat,
      '--flins-bg-blur': cfg.bgBlur + 'px',
      '--flins-bg-brightness': String(cfg.bgBrightness),
      '--flins-bg-zoom': String(cfg.bgZoom),
      '--flins-bg-scrim': scrim,
      '--flins-accent': accent.hex,
      '--flins-accent-rgb': rgb.join(', '),
      '--flins-accent-soft': toHex(mix(rgb, [255, 255, 255], 0.45)),
      '--flins-emblem': 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(EMBLEM_SVG) + '")',
      '--flins-fab-image': cfg.fabImage ? 'url("' + cfg.fabImage + '")' : 'none',
      '--flins-emblem-image': cfg.emblemImage ? 'url("' + cfg.emblemImage + '")' : 'none',
      '--flins-lamp-image': cfg.lampImage ? 'url("' + cfg.lampImage + '")' : 'none',
      
      '--lcolor--primary': rgb.join(', '),
      '--lfe-color--primary': accent.hex,
    };

    for (const name of Object.keys(vars)) {
      root.style.setProperty(name, vars[name], 'important');
    }
    
    if (fabEl) fabEl.dataset.img = cfg.fabImage ? '1' : '0';
    
    root.classList.toggle('flins-emblem-img', !!cfg.emblemImage);
    root.classList.toggle('flins-lamp-img', !!cfg.lampImage);

    
    
    
    syncNavBounds();
  }

   
  function syncNavBounds() {
    if (cfg.layout !== 'flins' || cfg.navMode !== 'inline') return;
    const bar = document.querySelector('.top-bar');
    if (!bar) return;
    const left = bar.querySelector('.left');
    const right = bar.querySelector('.right');
    if (!left || !right) return;

    const logo = left.querySelector('.logo-link');
    const crumb = left.querySelector('.breadcrumb');

    
    let brandW = 0;
    if (logo) {
      const lr = logo.getBoundingClientRect();
      const br = bar.getBoundingClientRect();
      brandW = Math.round(lr.right - br.left);
    }
    
    let crumbW = 0;
    if (crumb) {
      const cr = crumb.getBoundingClientRect();
      crumbW = Math.round(cr.width);
    }
    
    let userW = 0;
    {
      const rr = right.getBoundingClientRect();
      const br = bar.getBoundingClientRect();
      userW = Math.round(br.right - rr.left);
    }

    const root = document.documentElement;
    root.style.setProperty('--flins-brand-w', brandW + 'px', 'important');
    root.style.setProperty('--flins-crumb-w', crumbW + 'px', 'important');
    root.style.setProperty('--flins-user-w', userW + 'px', 'important');
  }

  
  
  
  
  
  
  
  
  
  
  
  const STYLE_ID = 'flins-theme-style';
  const PANEL_STYLE_ID = 'flins-panel-style';

   
  function whenRoot(fn) {
    if (document.documentElement) { fn(); return; }
    let done = false;
    const run = () => {
      if (done || !document.documentElement) return;
      done = true;
      try { obs.disconnect(); } catch (e) {   }
      clearInterval(timer);
      fn();
    };
    const obs = new MutationObserver(run);
    try { obs.observe(document, { childList: true, subtree: true }); } catch (e) {   }
    const timer = setInterval(run, 8);
  }

  function addStyle(css, id) {
    const put = () => {
      const host = document.head || document.documentElement;
      if (!host) return false;
      if (id && document.getElementById(id)) return true;
      const s = document.createElement('style');
      if (id) s.id = id;
      s.textContent = css;
      host.appendChild(s);
      return true;
    };
    if (put()) return true;
    whenRoot(put);
    return false;
  }

  
  
  
  
  
  
  const T_BTN = 'border-color .16s, background-color .16s, color .16s, box-shadow .16s';

  const PANEL_CSS = [
    '.flins-fab{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:46px;height:46px;',
    '  border:1px solid rgba(var(--flins-accent-rgb),.45);border-radius:50%;cursor:pointer;padding:0;',
    '  background-image:var(--flins-fab-image, none),',
    '    radial-gradient(circle at 50% 42%,rgba(var(--flins-accent-rgb),.28),rgba(10,14,36,.94) 68%);',
    '  background-size:cover, auto;background-position:center, center;background-repeat:no-repeat, no-repeat;',
    '  box-shadow:0 10px 26px -12px #000,0 0 0 1px rgba(255,255,255,.04) inset;',
    '  backdrop-filter:blur(10px);display:grid;place-items:center;',
    '  transition:transform .18s ease,box-shadow .18s ease}',
     
    '.flins-fab[data-img="1"] svg{display:none}',
    '.flins-fab:hover{transform:translateY(-2px);box-shadow:0 14px 30px -12px #000}',
    '.flins-fab svg{width:26px;height:26px;display:block}',

    '.flins-panel{position:fixed;right:20px;bottom:78px;z-index:2147483000;width:330px;',
    '  max-height:min(78vh,720px);overflow:auto;overscroll-behavior:contain;padding:16px 16px 14px;',
    '  border-radius:16px;border:1px solid rgba(var(--flins-accent-rgb),.28);',
    '  background:linear-gradient(180deg,rgba(13,18,44,.975),rgba(8,11,30,.985));',
    '  color:#E6EBFB;font:13px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;',
    '  box-shadow:0 30px 70px -24px #000,0 0 0 1px rgba(255,255,255,.04) inset;',
    '  backdrop-filter:blur(16px) saturate(1.2);',
    '  opacity:0;visibility:hidden;transform:translateY(10px) scale(.985);',
    '  transition:opacity .18s ease,transform .18s ease,visibility .18s}',
     
    '.flins-panel[data-open="1"]{opacity:1;visibility:visible;transform:none}',
    '.flins-panel[data-open="1"] *{visibility:visible}',
    '.flins-panel *{box-sizing:border-box}',
    '.flins-panel h4{margin:0 0 2px;font:600 15px/1.4 Georgia,"Noto Serif SC","Songti SC",serif;',
    '  letter-spacing:.06em;color:#F2F4F8}',
    '.flins-panel .sub{margin:0 0 12px;font-size:11.5px;letter-spacing:.08em;color:rgba(150,162,196,.85)}',
    '.flins-sec{margin:0 0 14px;padding:0 0 12px;border-bottom:1px solid rgba(150,190,235,.12)}',
    '.flins-sec:last-of-type{border-bottom:0;padding-bottom:2px}',
    '.flins-lab{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 7px;',
    '  font-size:11.5px;letter-spacing:.1em;color:#8E9BBB}',
    '.flins-lab b{font-weight:600;color:rgba(var(--flins-accent-rgb),.95);font-variant-numeric:tabular-nums}',

    '.flins-seg{display:flex;gap:6px;flex-wrap:wrap}',
    '.flins-seg button{flex:1 1 auto;min-width:60px;padding:7px 8px;border-radius:9px;cursor:pointer;',
    '  border:1px solid rgba(150,190,235,.18);background:rgba(255,255,255,.03);color:#B7C2DE;',
    '  font:inherit;font-size:12px;transition:' + T_BTN + '}',
    '.flins-seg button:hover{border-color:rgba(var(--flins-accent-rgb),.5);color:#E6EBFB}',
    '.flins-seg button[aria-pressed="true"]{border-color:rgba(var(--flins-accent-rgb),.85);color:#04121A;',
    '  background:linear-gradient(135deg,rgba(var(--flins-accent-rgb),1),#4C6FE8);font-weight:600;',
    '  box-shadow:0 0 16px -5px rgba(var(--flins-accent-rgb),.9)}',

    '.flins-panel input[type=text],.flins-panel input[type=url]{width:100%;padding:7px 9px;border-radius:9px;',
    '  border:1px solid rgba(150,190,235,.2);background:rgba(4,7,20,.72);color:#E6EBFB;font:inherit;font-size:12px}',
    '.flins-panel input[type=text]:focus,.flins-panel input[type=url]:focus{outline:none;',
    '  border-color:rgba(var(--flins-accent-rgb),.8);box-shadow:0 0 0 1px rgba(var(--flins-accent-rgb),.35)}',
    '.flins-row{display:flex;gap:6px;align-items:center}',
    '.flins-row > *{min-width:0;flex:1}',
    '.flins-row button{flex:0 0 auto;padding:7px 10px;border-radius:9px;cursor:pointer;white-space:nowrap;',
    '  border:1px solid rgba(var(--flins-accent-rgb),.45);background:rgba(var(--flins-accent-rgb),.12);',
    '  color:#DCE6FB;font:inherit;font-size:12px;transition:' + T_BTN + '}',
    '.flins-row button:hover{background:rgba(var(--flins-accent-rgb),.24)}',
    '.flins-drop{margin-top:7px;padding:14px 10px;border-radius:10px;text-align:center;cursor:pointer;',
    '  border:1px dashed rgba(150,190,235,.32);color:#8E9BBB;font-size:11.5px;transition:' + T_BTN + '}',
    '.flins-drop:hover,.flins-drop[data-over="1"]{border-color:rgba(var(--flins-accent-rgb),.8);',
    '  color:#DCE6FB;background:rgba(var(--flins-accent-rgb),.09)}',
    '.flins-panel input[type=range]{width:100%;accent-color:rgb(var(--flins-accent-rgb));height:18px;margin:2px 0 10px}',
    '.flins-panel select{width:100%;padding:6px 8px;border-radius:9px;font:inherit;font-size:12px;',
    '  border:1px solid rgba(150,190,235,.2);background:rgba(4,7,20,.72);color:#E6EBFB}',
    '.flins-panel select option{background:#0B0F2B;color:#E6EBFB}',
    '.flins-sw{display:flex;align-items:center;justify-content:space-between;padding:5px 0;font-size:12.5px;',
    '  color:#C3CEE8;cursor:pointer}',
    '.flins-sw input{appearance:none;width:38px;height:21px;border-radius:99px;position:relative;cursor:pointer;margin:0;',
    '  background:rgba(255,255,255,.1);border:1px solid rgba(150,190,235,.2);',
    '  transition:background-color .18s ease,border-color .18s ease}',
    '.flins-sw input::after{content:"";position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;',
    '  background:#8E9BBB;transition:left .18s ease,background-color .18s ease,box-shadow .18s ease}',
    '.flins-sw input:checked{background:rgba(var(--flins-accent-rgb),.35);border-color:rgba(var(--flins-accent-rgb),.7)}',
    '.flins-sw input:checked::after{left:19px;background:rgb(var(--flins-accent-rgb));',
    '  box-shadow:0 0 10px 1px rgba(var(--flins-accent-rgb),.8)}',
    '.flins-foot{display:flex;gap:8px;margin-top:12px}',
    '.flins-foot button{flex:1;padding:8px;border-radius:9px;cursor:pointer;font:inherit;font-size:12px;',
    '  border:1px solid rgba(150,190,235,.22);background:rgba(255,255,255,.03);color:#B7C2DE;transition:' + T_BTN + '}',
    '.flins-foot button:hover{border-color:rgba(255,120,130,.6);color:#FFB3BA}',
    '.flins-note{margin:9px 0 0;font-size:11px;line-height:1.6;color:rgba(142,155,187,.8)}',
    '.flins-hint{font-size:11.5px;color:#8E9BBB}',
    '.flins-swcolor{display:flex;gap:8px;align-items:center}',
    '.flins-swcolor input[type=color]{width:38px;height:30px;padding:0;border-radius:8px;cursor:pointer;flex:0 0 auto;',
    '  border:1px solid rgba(150,190,235,.25);background:transparent}',

     
    'html.flins-light .flins-fab{',
    '  background:radial-gradient(circle at 50% 42%,rgba(var(--flins-accent-rgb),.30),rgba(255,255,255,.97) 68%);',
    '  border-color:rgba(var(--flins-accent-rgb),.55);',
    '  box-shadow:0 10px 26px -16px rgba(28,48,92,.45),0 0 0 1px rgba(255,255,255,.9) inset}',
    'html.flins-light .flins-panel{',
    '  background:linear-gradient(180deg,rgba(255,255,255,.985),rgba(243,247,254,.99));',
    '  color:#16203C;border-color:rgba(var(--flins-accent-rgb),.35);',
    '  box-shadow:0 30px 70px -28px rgba(28,48,92,.42),0 0 0 1px rgba(255,255,255,.9) inset}',
    'html.flins-light .flins-panel h4{color:#101A33}',
    'html.flins-light .flins-panel .sub{color:#7C89A8}',
    'html.flins-light .flins-lab{color:#6B7899}',
    'html.flins-light .flins-hint{color:#7C89A8}',
    'html.flins-light .flins-sec{border-bottom-color:rgba(52,84,148,.14)}',
    'html.flins-light .flins-seg button{border-color:rgba(52,84,148,.20);background:rgba(20,40,90,.035);color:#4A5877}',
    'html.flins-light .flins-seg button:hover{border-color:rgba(var(--flins-accent-rgb),.6);color:#16203C}',
    'html.flins-light .flins-seg button[aria-pressed="true"]{color:#FFFFFF}',
    'html.flins-light .flins-panel input[type=text],',
    'html.flins-light .flins-panel input[type=url],',
    'html.flins-light .flins-panel select{background:#FFFFFF;border-color:rgba(52,84,148,.20);color:#16203C}',
    'html.flins-light .flins-panel select option{background:#FFFFFF;color:#16203C}',
    'html.flins-light .flins-panel input[type=range]{accent-color:rgb(var(--flins-accent-rgb))}',
    'html.flins-light .flins-sw{color:#3A4767}',
    'html.flins-light .flins-sw input{background:rgba(20,40,90,.12);border-color:rgba(52,84,148,.25)}',
    'html.flins-light .flins-drop{border-color:rgba(52,84,148,.30);color:#6B7899}',
    'html.flins-light .flins-drop:hover,html.flins-light .flins-drop[data-over="1"]{color:#16203C}',
    'html.flins-light .flins-row button{color:#16203C}',
    'html.flins-light .flins-foot button{border-color:rgba(52,84,148,.22);background:rgba(20,40,90,.035);color:#4A5877}',
    'html.flins-light .flins-note{color:#7C89A8}',
    'html.flins-light .flins-swcolor input[type=color]{border-color:rgba(52,84,148,.25)}',
    '@media (max-width:520px){.flins-panel{right:10px;left:10px;width:auto;bottom:74px}.flins-fab{right:14px;bottom:14px}}',
  ].join('\n');

  const EMBLEM_ICON = '<svg viewBox="0 0 64 64" aria-hidden="true">'
    + '<path d="M52.4 6.4a8.8 8.8 0 1 0 6.3 10.6 7 7 0 1 1-6.3-10.6z" fill="#F0C070"/>'
    + '<path d="M24.2 15.6h11.6l-1.6-4.2H25.8z" fill="#C8CBD6"/>'
    + '<rect x="24.6" y="16.2" width="10.8" height="13.4" rx="1.8" fill="#0B0F2B" stroke="#C8CBD6" stroke-width="1.3"/>'
    + '<path d="M30 18.4c2.7 3.3 3.9 5.1 3.9 7.1a3.9 3.9 0 0 1-7.8 0c0-2 1.2-3.8 3.9-7.1z" fill="#60E0F0"/>'
    + '<path d="M25.6 30.4h8.8l2.4 19.0H23.2z" fill="#101640"/>'
    + '<rect x="22.2" y="49.6" width="15.6" height="3.6" rx="1" fill="#C8CBD6" opacity=".85"/></svg>';

  let panelEl = null;
  let fabEl = null;

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach((c) => { if (c) node.appendChild(c); });
    return node;
  }

  function seg(current, options, onPick) {
    // 点下去先自己翻 aria-pressed：有些选项（比如宠物形象）只刷新本体、不重建面板，
    // 光等 rebuildPanel 的话高亮要等别的开关动一下才跟上（issue #5）。
    const btns = options.map((o) => el('button', {
      type: 'button',
      'aria-pressed': String(current === o.value),
      text: o.label,
    }));
    btns.forEach((btn, i) => btn.addEventListener('click', () => {
      btns.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
      onPick(options[i].value);
    }));
    return el('div', { class: 'flins-seg' }, btns);
  }

  function slider(label, value, min, max, step, fmt, onInput) {
    const out = el('b', { text: fmt(value) });
    const input = el('input', {
      type: 'range', min: String(min), max: String(max), step: String(step), value: String(value),
      oninput: (e) => { out.textContent = fmt(Number(e.target.value)); onInput(Number(e.target.value)); },
    });
    return el('div', {}, [el('div', { class: 'flins-lab' }, [el('span', { text: label }), out]), input]);
  }

  function toggle(label, value, onChange) {
    const input = el('input', { type: 'checkbox', onchange: (e) => onChange(e.target.checked) });
    input.checked = !!value;
    return el('label', { class: 'flins-sw' }, [el('span', { text: label }), input]);
  }

  function select(options, current, onChange) {
    return el('select', {
      onchange: (e) => onChange(e.target.value),
      html: options.map(([v, t]) => '<option value="' + v + '"' + (current === v ? ' selected' : '') + '>' + t + '</option>').join(''),
    });
  }

  function rebuildPanel() {
    if (!panelEl) return;
    const accent = currentAccent();
    panelEl.innerHTML = '';

    panelEl.appendChild(el('h4', { text: '洛谷 · 暗星' }));
    panelEl.appendChild(el('p', { class: 'sub', text: '暗星主题设置' }));

    
    panelEl.appendChild(el('div', { class: 'flins-sec' }, [
      el('div', { class: 'flins-lab' }, [el('span', { text: '外观形态' })]),
      seg(cfg.mode, [
        { value: 'auto', label: '跟随系统' },
        { value: 'dark', label: '夜巡（深）' },
        { value: 'light', label: '霜晨（浅）' },
      ], (v) => { cfg.mode = v; commit(); }),
    ]));

    
    panelEl.appendChild(el('div', { class: 'flins-sec' }, [
      el('div', { class: 'flins-lab' }, [el('span', { text: '版式' })]),
      seg(cfg.layout, [
        { value: 'flins', label: '暗星版式' },
        { value: 'classic', label: '洛谷原版' },
      ], (v) => { cfg.layout = v; commit(); }),
      el('p', { class: 'flins-note', text: '暗星版式：背景插画透出、厚玻璃卡片、全站大圆角、居中阅读栏。随时可以切回原版。' }),
    ]));

    
    panelEl.appendChild(el('div', { class: 'flins-sec' }, [
      el('div', { class: 'flins-lab' }, [el('span', { text: '导航形态' })]),
      seg(cfg.navMode, [
        { value: 'inline', label: '并入顶栏' },
        { value: 'stack', label: '双行融合' },
        { value: 'side', label: '左侧竖栏' },
      ], (v) => { cfg.navMode = v; commit(); }),
      el('p', { class: 'flins-note', text: '并入顶栏：导航挤在顶栏同一行；双行融合：顶栏在上、导航在下拼成一整块；左侧竖栏：经典侧边栏面板。' }),
    ]));

    
    panelEl.appendChild(el('div', { class: 'flins-sec' }, [
      el('div', { class: 'flins-lab' }, [el('span', { text: '强调色' }), el('b', { text: accent.name })]),
      seg(cfg.accent === 'custom' ? '__custom' : cfg.accent, [
        { value: 'ghost', label: '幽焰青' },
        { value: 'volt', label: '雷紫' },
        { value: 'lamp', label: '提灯金' },
        { value: 'luogu', label: '洛谷蓝' },
      ], (v) => { cfg.accent = v; commit(); }),
      el('div', { class: 'flins-swcolor', style: 'margin-top:8px' }, [
        el('input', {
          type: 'color', value: cfg.accent === 'custom' ? cfg.accentCustom : accent.hex,
          oninput: (e) => { cfg.accent = 'custom'; cfg.accentCustom = e.target.value; commit(); },
        }),
        el('span', { class: 'flins-hint', text: '自定义取色（拖动即生效）' }),
      ]),
    ]));

    
    const urlInput = el('input', {
      type: 'url', placeholder: 'https://… 图片直链', value: cfg.bgUrl,
      onchange: (e) => { cfg.bgUrl = e.target.value.trim(); cfg.bgSource = 'url'; commit(); },
    });
    const fileInput = el('input', {
      type: 'file', accept: 'image/*', style: 'display:none',
      onchange: (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) readImageFile(f, 2560, (url) => { cfg.bgUpload = url; cfg.bgSource = 'upload'; commit(); });
      },
    });
    const drop = el('div', {
      class: 'flins-drop',
      text: '拖入图片，或点击选择本地文件（自动压到 2560px 内）',
      onclick: () => fileInput.click(),
      ondragover: (e) => { e.preventDefault(); drop.dataset.over = '1'; },
      ondragleave: () => { drop.dataset.over = '0'; },
      ondrop: (e) => {
        e.preventDefault(); drop.dataset.over = '0';
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f && /^image\//.test(f.type)) {
          readImageFile(f, 2560, (url) => { cfg.bgUpload = url; cfg.bgSource = 'upload'; commit(); });
        }
      },
    });

    panelEl.appendChild(el('div', { class: 'flins-sec' }, [
      el('div', { class: 'flins-lab' }, [el('span', { text: '背景图片' })]),
      seg(cfg.bgSource, [
        { value: 'auto', label: '跟随形态' },
        { value: 'builtin-dark', label: '内置夜巡' },
        { value: 'builtin-light', label: '内置霜晨' },
        { value: 'url', label: '图片链接' },
        { value: 'upload', label: '本地上传' },
        { value: 'none', label: '无背景' },
      ], (v) => { cfg.bgSource = v; commit(); }),
      el('div', { style: 'margin-top:8px' }, [urlInput]),
      drop, fileInput,
      slider('模糊', cfg.bgBlur, 0, 24, 1, (v) => v + 'px', (v) => { cfg.bgBlur = v; commit(); }),
      slider('明暗', cfg.bgBrightness, 0.3, 1.8, 0.02, (v) => v.toFixed(2) + '×', (v) => { cfg.bgBrightness = v; commit(); }),
      slider('缩放', cfg.bgZoom, 1, 1.8, 0.01, (v) => v.toFixed(2) + '×', (v) => { cfg.bgZoom = v; commit(); }),
      slider('蒙版浓度', cfg.bgScrim, 0, 0.95, 0.01, (v) => Math.round(v * 100) + '%', (v) => { cfg.bgScrim = v; commit(); }),
      el('div', { class: 'flins-lab', style: 'margin-top:9px' }, [el('span', { text: '对齐 / 平铺' })]),
      el('div', { class: 'flins-row' }, [
        select([['center center', '居中'], ['center top', '顶部'], ['center bottom', '底部'],
                ['left center', '靠左'], ['right center', '靠右']], cfg.bgPosition,
               (v) => { cfg.bgPosition = v; commit(); }),
        select([['cover', '铺满'], ['contain', '完整显示'], ['auto', '原始平铺']], cfg.bgSize,
               (v) => { cfg.bgSize = v; cfg.bgRepeat = v === 'auto' ? 'repeat' : 'no-repeat'; commit(); }),
      ]),
    ]));

    
    const extra = [
      toggle('毛玻璃（卡片 / 顶栏）', glassEffective(), (v) => { cfg.glass = v; commit(); }),
      toggle('装饰元素（徽记 / 极光 / 铭牌）', cfg.ornaments, (v) => { cfg.ornaments = v; commit(); }),
      toggle('动效（灯火呼吸 / 选中脉动）', cfg.motion, (v) => { cfg.motion = v; commit(); }),
      toggle('自动修补遗漏的白块', cfg.autoPatch, (v) => { cfg.autoPatch = v; commit(); if (v) schedulePatch(); }),
      toggle('兼容题号上色插件', cfg.pluginColorCompat, (v) => { cfg.pluginColorCompat = v; commit(); }),
    ];
    if (luoguBlurDisabled() && cfg.glass) {
      extra.push(el('p', { class: 'flins-note', text: '洛谷已因性能原因关闭毛玻璃，本主题一并跟随。' }));
    }
    extra.push(el('p', {
      class: 'flins-note',
      text: '关掉「题号难度色」后，主题不再放行行内上色，题库里的题号会统一成本主题的正文色。',
    }));
    panelEl.appendChild(el('div', { class: 'flins-sec' }, [
      el('div', { class: 'flins-lab' }, [el('span', { text: '效果' })]),
    ].concat(extra)));
    panelEl.appendChild(el('div', { class: 'flins-sec' }, [
      el('div', { class: 'flins-lab' }, [el('span', { text: '电子宠物' })]),
      toggle('显示电子宠物（可拖动 / 可交互）', cfg.pet, (v) => {
        cfg.pet = v;
        if (v) { cfg.petAt = Date.now(); petDecay(); }
        commit();
      }),
      seg(cfg.petForm, PET_FORMS.map((f) => ({ value: f.id, label: f.name })), (v) => {
        cfg.petForm = v;
        store.write(cfg);
        petMount(true);
      }),
      el('div', { class: 'flins-row' }, [
        el('button', { type: 'button', text: '喂一碗', onclick: () => { if (!cfg.pet) { cfg.pet = true; commit(); } petMount(true); petFeed(); } }),
        el('button', { type: 'button', text: '摸摸头', onclick: () => { if (!cfg.pet) { cfg.pet = true; commit(); } petMount(true); petPet(); } }),
      ]),
      el('p', { class: 'flins-note', text: 'API Key / 模型 / 饭点都在宠物的右键「⚙ 设置」里填。' }),
      el('p', { class: 'flins-note', text: '形象说明：「大肥鱼」是基于 DeepSeek 鲸鱼形象的二次创作，非官方素材；DeepSeek 形象权利归深度求索所有，与本项目无隶属关系。' }),
      el('p', { class: 'flins-note', text: '右键可以「喂大白饭」——米饭会掉到地上，**要自己拖到她嘴边**才吃得到；拖偏了会说「拖到我嘴边才行」。点一下会换表情，双击换形象，滚轮缩放。饱食度每小时 -3，饿了会自己说话。' }),
    ]));


    
    let lampFile;
    panelEl.appendChild(el('div', { class: 'flins-sec' }, [
      el('div', { class: 'flins-lab' }, [el('span', { text: '标题小灯' })]),
      seg(cfg.ornamentStyle, [
        { value: 'lamp', label: '灯芯' },
        { value: 'moon', label: '新月' },
        { value: 'none', label: '无' },
      ], (v) => { cfg.ornamentStyle = v; commit(); }),
      el('p', { class: 'flins-note', text: '标题左边那个发光的小标记。浅色形态下会自动换成深青（深色形态用亮青）。' }),
      
      lampFile = el('input', {
        type: 'file', accept: 'image/*', style: 'display:none',
        onchange: (e) => {
          const f = e.target.files && e.target.files[0];
          if (f) readImageFile(f, 128, (dataUrl) => { cfg.lampImage = dataUrl; commit(); });
        },
      }),
      el('div', { class: 'flins-row', style: 'margin-top:8px' }, [
        el('input', {
          type: 'url', placeholder: '自定义小灯图片直链', value: cfg.lampImage && cfg.lampImage.slice(0, 5) !== 'data:' ? cfg.lampImage : '',
          onchange: (e) => { cfg.lampImage = e.target.value.trim(); commit(); },
        }),
        el('button', { type: 'button', text: '选图', onclick: () => lampFile.click() }),
        el('button', { type: 'button', text: '恢复', onclick: () => { cfg.lampImage = ''; commit(); } }),
      ]),
      lampFile,
    ]));

    
    const fabFile = el('input', {
      type: 'file', accept: 'image/*', style: 'display:none',
      onchange: (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) readImageFile(f, 256, (dataUrl) => { cfg.fabImage = dataUrl; commit(); });
      },
    });
    panelEl.appendChild(el('div', { class: 'flins-sec' }, [
      el('div', { class: 'flins-lab' }, [el('span', { text: '右下角小灯' })]),
      el('div', { class: 'flins-row' }, [
        el('input', {
          type: 'url', placeholder: '自定义图标图片直链', value: cfg.fabImage && cfg.fabImage.slice(0, 5) !== 'data:' ? cfg.fabImage : '',
          onchange: (e) => { cfg.fabImage = e.target.value.trim(); commit(); },
        }),
        el('button', { type: 'button', text: '选图', onclick: () => fabFile.click() }),
      ]),
      el('div', { class: 'flins-row', style: 'margin-top:6px' }, [
        el('button', { type: 'button', text: '恢复默认（誓灯徽记）', onclick: () => { cfg.fabImage = ''; commit(); } }),
      ]),
      fabFile,
      el('p', { class: 'flins-note', text: '内置的誓灯徽记是程序化画的；嫌丑的话，换一张你自己的图（建议正方形、透明背景）。' }),
    ]));

    
    const emblemFile = el('input', {
      type: 'file', accept: 'image/*', style: 'display:none',
      onchange: (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) readImageFile(f, 128, (dataUrl) => { cfg.emblemImage = dataUrl; commit(); });
      },
    });
    panelEl.appendChild(el('div', { class: 'flins-sec' }, [
      el('div', { class: 'flins-lab' }, [el('span', { text: '左上角誓灯徽记' })]),
      el('div', { class: 'flins-row' }, [
        el('input', {
          type: 'url', placeholder: '自定义徽记图片直链（留空 = 内置）', value: cfg.emblemImage && cfg.emblemImage.slice(0, 5) !== 'data:' ? cfg.emblemImage : '',
          onchange: (e) => { cfg.emblemImage = e.target.value.trim(); commit(); },
        }),
        el('button', { type: 'button', text: '选图', onclick: () => emblemFile.click() }),
        el('button', { type: 'button', text: '恢复', onclick: () => { cfg.emblemImage = ''; commit(); } }),
      ]),
      emblemFile,
      el('p', { class: 'flins-note', text: '就是「洛谷」标志右边那颗小灯。换图后建议用正方形、透明背景的 PNG。' }),
    ]));

    
    const report = el('p', { class: 'flins-note', text: '深色形态下如果还有发白的区域，点一下上面那个开关旁边的按钮。' });
    const scanBtn = el('button', {
      type: 'button', text: '扫描并修复',
      onclick: () => {
        const res = runPatches();
        const white = res.white || { fixed: 0, sample: [] };
        const dim = res.dim || [];
        const tails = res.tails || [];
        const parts = [];
        if (white.fixed) parts.push('白块 ' + white.fixed);
        if (dim.length) parts.push('过暗文字 ' + dim.length);
        if (tails.length) parts.push('气泡尖角 ' + tails.length);
        if (!parts.length) {
          report.textContent = '没发现问题。若你仍看到异常，把它截图发我。';
          return;
        }
        report.textContent = '已修复 ' + parts.join(' / ') + ' 处（明细已复制到剪贴板）';
        try {
          navigator.clipboard.writeText('[暗星主题] 修复报告\n'
            + '白块 ' + white.fixed + ':\n' + white.sample.join('\n')
            + '\n过暗文字 ' + dim.length + ':\n' + dim.join('\n')
            + '\n气泡尖角 ' + tails.length + ':\n' + tails.join('\n'));
        } catch (e) {   }
      },
    });
    panelEl.appendChild(el('div', { class: 'flins-sec' }, [
      el('div', { class: 'flins-lab' }, [el('span', { text: '漏网的白块' })]),
      el('div', { class: 'flins-row' }, [scanBtn]),
      report,
    ]));

    
    panelEl.appendChild(el('div', { class: 'flins-foot' }, [
      el('button', { type: 'button', text: '恢复默认', onclick: () => { cfg = Object.assign({}, DEFAULTS); commit(); rebuildPanel(); } }),
    ]));

    const importReport = el('p', { class: 'flins-note flins-import-report', text: '' });

    const btnExport = el('button', {
      type: 'button', text: '导出配置',
      onclick: () => {
        try {
          const payload = {
            app: 'luogu-dark-star',
            schema: 1,
            exportedAt: new Date().toISOString(),
            settings: cfg,
          };
          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const d = new Date();
          const p2 = (n) => String(n).padStart(2, '0');
          a.href = url;
          a.download = 'luogu-dark-star-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate())
            + '-' + p2(d.getHours()) + p2(d.getMinutes()) + '.json';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
          importReport.textContent = '已导出为 JSON 文件，可保存或发给别人。';
        } catch (err) {
          importReport.textContent = '导出失败：' + (err && err.message ? err.message : err);
        }
      },
    });

    const cfgFileInput = el('input', {
      type: 'file', accept: '.json,application/json',
      style: 'display:none',
      onchange: (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const rd = new FileReader();
        rd.onload = () => applyImport(String(rd.result || ''), f.name);
        rd.onerror = () => { importReport.textContent = '读文件失败。'; };
        rd.readAsText(f);
        e.target.value = '';
      },
    });

    const btnImport = el('button', {
      type: 'button', text: '导入配置',
      onclick: () => cfgFileInput.click(),
    });

    panelEl.appendChild(el('div', { class: 'flins-sec' }, [
      el('div', { class: 'flins-lab' }, [el('span', { text: '配置备份' })]),
      el('div', { class: 'flins-row' }, [btnExport, btnImport]),
      cfgFileInput,
      importReport,
      el('p', { class: 'flins-note', text: '导出为 JSON 文件；导入时选一个之前导出的 JSON 即可还原（含背景图设置）。' }),
    ]));

    panelEl.appendChild(el('p', {
      class: 'flins-note',
      text: '本地上传的图片只存在你自己的浏览器里，不会上传到任何服务器。',
    }));
  }

  /** 导入配置：读一段 JSON 文本，只接受 DEFAULTS 里存在的键且类型匹配。
   *  放在 rebuildPanel 外面，因为导入成功后要重建面板，闭包里的函数会失效。 */
  function applyImport(text, name) {
    const report = () => (panelEl && panelEl.querySelector('.flins-import-report')) || null;
    const say = (msg) => { const r = report(); if (r) r.textContent = msg; };

    let data;
    try { data = JSON.parse(text); } catch (err) {
      say('导入失败：不是合法的 JSON。');
      return;
    }
    const obj = data && typeof data === 'object' && data.settings && typeof data.settings === 'object'
      ? data.settings
      : (data && typeof data === 'object' ? data : null);
    if (!obj) { say('导入失败：文件里没有配置对象。'); return; }

    const next = mergeCfg(DEFAULTS, obj);
    let n = 0;
    for (const k of Object.keys(DEFAULTS)) {
      if (!(k in obj)) continue;
      const b = obj[k];
      if (b === null || typeof b !== typeof DEFAULTS[k]) continue;
      if (Array.isArray(DEFAULTS[k]) !== Array.isArray(b)) continue;
      n += 1;
    }
    if (!n) { say('导入失败：没有可识别的配置项。'); return; }

    cfg = next;
    commit();
    const r = report();
    if (r) r.textContent = '已导入 ' + n + ' 项配置' + (name ? '（' + name + '）' : '') + '。';
  }

  function readImageFile(file, maxSide, onDone) {
    const max = maxSide || 2560;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        
        const url = max <= 512 ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.86);
        onDone(url);
      };
      img.onerror = () => onDone(String(reader.result));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  /* ── 电子宠物 ──────────────────────────────────────────────────────────
     可开关、可拖动、可右键交互的小宠物。形象是【内联 SVG】画的（不引任何外链图，
     保持零请求），三种形态：蓝鲸 / 白猫 / 小妖。
     右键菜单里「喂大白饭」会让一碗米饭从天上掉下来喂给她。 */
  const PET_STYLE_ID = 'flins-pet-style';

  const PET_CSS = [
    '.flins-pet{position:fixed;right:96px;bottom:104px;width:96px;height:120px;z-index:2147482998;',
    '.flins-pet[data-size="m"]{width:120px;height:150px}',
    '.flins-pet[data-size="l"]{width:152px;height:190px}',
    '.flins-pet{transition:width .45s cubic-bezier(.2,1.4,.4,1),height .45s cubic-bezier(.2,1.4,.4,1),transform .18s ease,opacity .2s ease}',
    'cursor:grab;touch-action:none;user-select:none;filter:drop-shadow(0 14px 26px rgba(0,0,0,.5));',
    'transition:transform .18s ease,opacity .2s ease}',
    '.flins-pet[data-drag="1"]{cursor:grabbing;transition:none}',
    '.flins-pet svg{display:block;width:100%;height:100%;overflow:visible}',
    '.flins-pet-img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;',
    'filter:drop-shadow(0 6px 14px rgba(0,0,0,.45))}',
    '.flins-pet:hover{transform:translateY(-3px)}',
    '.flins-pet[data-hidden="1"]{opacity:0;pointer-events:none}',
    '.flins-pet[data-hover="1"]{transform:translateY(-4px)}',
    '.flins-pet-body{transform-origin:50% 100%;animation:flins-pet-breathe 3.6s ease-in-out infinite}',
    '@keyframes flins-pet-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.975)}}',
    '.flins-pet-eye{transform-origin:center;animation:flins-pet-blink 5.2s infinite}',
    '@keyframes flins-pet-blink{0%,94%,100%{transform:scaleY(1)}96%,98%{transform:scaleY(.08)}}',
    '.flins-pet[data-jump="1"]{animation:flins-pet-jump .5s ease}',
    '@keyframes flins-pet-jump{0%,100%{transform:translateY(0)}40%{transform:translateY(-16px)}}',
    '.flins-pet[data-chew="1"] .flins-pet-body{animation:flins-pet-chew .42s ease-in-out 4}',
    '@keyframes flins-pet-chew{0%,100%{transform:scale(1,1)}50%{transform:scale(1.05,.94)}}',
    '.flins-pet-tail{transform-origin:78% 74%;animation:flins-pet-wag 2.4s ease-in-out infinite}',
    '@keyframes flins-pet-wag{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(6deg)}}',

    '.flins-pet-bubble{position:fixed;z-index:2147482999;max-width:220px;padding:8px 11px;',
    'font:500 12.5px/1.5 var(--flins-font-body,system-ui);color:#E9FBFF;',
    'background:rgba(11,16,39,.95);border:1px solid rgba(126,232,244,.5);border-radius:12px;',
    'box-shadow:0 16px 34px -18px rgba(0,0,0,.9);opacity:0;transform:translateY(6px);',
    'transition:opacity .16s ease,transform .16s ease;pointer-events:none;white-space:pre-wrap}',
    '.flins-pet-bubble[data-show="1"]{opacity:1;transform:translateY(0)}',
    '.flins-pet-bubble::after{content:"";position:absolute;left:var(--flins-arrow-x,18px);bottom:-6px;width:10px;height:10px;',
    'background:rgba(11,16,39,.95);border-right:1px solid rgba(126,232,244,.5);',
    'border-bottom:1px solid rgba(126,232,244,.5);transform:rotate(45deg)}',

    '.flins-pet-menu{position:fixed;z-index:2147483000;min-width:150px;padding:6px;',
    'background:rgba(13,19,44,.97);border:1px solid rgba(130,156,216,.34);border-radius:12px;',
    'box-shadow:0 22px 48px -24px rgba(0,0,0,.95);display:none}',
    '.flins-pet-menu[data-open="1"]{display:block}',
    '.flins-pet-menu button{display:block;width:100%;padding:7px 10px;margin:1px 0;border:0;',
    'border-radius:8px;background:transparent;color:#DCE4F7;',
    'font:500 12.5px/1.4 var(--flins-font-body,system-ui);text-align:left;cursor:pointer}',
    '.flins-pet-menu button:hover{background:rgba(96,224,240,.16);color:#A8EEF7}',
    '.flins-pet-menu .sep{height:1px;margin:5px 6px;background:rgba(130,156,216,.22)}',
    '.flins-pet-menu .hint{padding:4px 10px 2px;font-size:11px;color:rgba(150,162,196,.85)}',

    '.flins-pet-rice{position:fixed;z-index:2147482999;width:64px;height:56px;pointer-events:none;opacity:0;transition:filter .15s ease}',
    '.flins-pet-rice[data-fall="1"]{animation:flins-rice-fall .62s cubic-bezier(.5,.05,.9,.6) forwards}',
    '@keyframes flins-rice-fall{0%{opacity:1;transform:translateY(-42vh) rotate(-12deg)}',
    '80%{opacity:1;transform:translateY(0) rotate(2deg)}88%{transform:translateY(-8px) rotate(-2deg)}',
    '100%{opacity:1;transform:translateY(0) rotate(0)}}',
    '.flins-pet-rice svg{width:100%;height:100%;overflow:visible}',
    '.flins-pet-rice[data-eat="1"]{animation:flins-rice-eat .3s ease forwards}',
    '@keyframes flins-rice-eat{to{opacity:0;transform:translateY(-6px) scale(.6)}}',

    '.flins-pet-grain{position:fixed;z-index:2147482999;width:5px;height:5px;border-radius:50%;',
    'background:#FFF8E6;pointer-events:none;opacity:0}',
    '.flins-pet-grain[data-go="1"]{animation:flins-grain .5s ease-out forwards}',
    '@keyframes flins-grain{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--gx),var(--gy))}}',

    '.flins-pet-pop{position:fixed;z-index:2147483000;font:700 13px/1 var(--flins-font-body,system-ui);',
    'color:#8FE9F7;text-shadow:0 2px 10px rgba(0,0,0,.7);pointer-events:none;opacity:0}',
    '.flins-pet-pop[data-go="1"]{animation:flins-pop 1s ease-out forwards}',
    '@keyframes flins-pop{0%{opacity:0;transform:translateY(0) scale(.8)}25%{opacity:1;transform:translateY(-10px) scale(1)}',
    '100%{opacity:0;transform:translateY(-38px) scale(1)}}',

    'html.flins-light .flins-pet-bubble{background:rgba(255,255,255,.98);color:#16203C;border-color:rgba(52,84,148,.28)}',
    'html.flins-light .flins-pet-bubble::after{background:rgba(255,255,255,.98);border-color:rgba(52,84,148,.28)}',
    'html.flins-light .flins-pet-menu{background:rgba(255,255,255,.99);border-color:rgba(52,84,148,.24)}',
    'html.flins-light .flins-pet-menu button{color:#243354}',
    'html.flins-light .flins-pet-menu button:hover{background:rgba(52,84,148,.12);color:#1B4A8C}',
    '.flins-pet-chat{position:fixed;z-index:2147483000;width:262px;padding:9px;border-radius:12px;background:rgba(13,19,44,.97);border:1px solid rgba(130,156,216,.4);box-shadow:0 22px 48px -24px rgba(0,0,0,.95)}',
    '.flins-pet-chat-tip{font:500 11.5px/1.4 var(--flins-font-body,system-ui);color:rgba(150,162,196,.95);margin-bottom:6px}',
    '.flins-pet-chat input{width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid rgba(130,156,216,.3);border-radius:8px;background:rgba(255,255,255,.06);color:#E6EBFB;font:500 12.5px/1.4 var(--flins-font-body,system-ui);outline:none}',
    '.flins-pet-chat input:focus{border-color:rgba(126,232,244,.7)}',
    'html.flins-light .flins-pet-chat{background:#fff;border-color:#ccd8ee}',
    'html.flins-light .flins-pet-chat input{background:#fff;color:#21252f;border-color:#ccd8ee}',    '.flins-pet-face{position:fixed;width:46px;height:46px;border-radius:50%;z-index:2147483000;pointer-events:none;opacity:0;transform:scale(.55) translateY(6px);transition:opacity .18s ease,transform .18s cubic-bezier(.2,1.5,.4,1);box-shadow:0 10px 22px -10px rgba(0,0,0,.85);border:1px solid rgba(126,232,244,.55);overflow:hidden}',
    '.flins-pet-face[data-show="1"]{opacity:1;transform:scale(1) translateY(0)}',
    '.flins-pet-face img{width:100%;height:100%;display:block;border-radius:50%}',
    '.flins-pet-rice[data-landed="1"]{pointer-events:auto;cursor:grab;opacity:1}',
    '.flins-pet-rice[data-drag="1"]{cursor:grabbing;animation:none!important;transform:none!important;opacity:1!important}',
    '.flins-pet-rice[data-hint="1"]{filter:drop-shadow(0 0 8px rgba(126,232,244,.9))}',
  ].join('');

  // 「大肥鱼」10 张表情（来自 DeepSeekPet 素材，已缩放内嵌）
  const PET_EXPR = {
    sprite: "data:image/webp;base64,UklGRko1AABXRUJQVlA4WAoAAAAQAAAAswAAAwEAQUxQSKkOAAAB8IZtmyK57f/dz/PUriCWP5ZiZmZmZmZmZmaGcGJQwMxBk2JILMvMVnwwo8xMMskyyJ+dqnruFzOaGe101+uImABUtQQBNAhKWgHMNCMAKSUJIhh6yP8mfX33ngIRkwJSAFjqOba8ZyYAkCJRE0AEEBXBiF8+9uIkxuSeIl9/fvzBCikPEwAqgCkAm/tFksxsmUjyvlkkWBCICCBSBALMu+LMwEgAWHYO3M//z9k51ZzTAO82ADAAJoBp7Ylgh0d+5KR7H/zyhaPnupdfXdbI7LjBjXcc87t+6KwKDAegNScBF5F0tpzMLru/TfJfR7/67at/f+LjF0cvCq23fhzBRnJ6Sp4TMz11ozkmtvn9TtA6EyzyRc6curPr2cmcsueYcm4wLmtWW2L45Y/sxcg7oFJXhlNJ7wXmgSMUUk+q80xJmb2ZOXaoSt2IBZN+nMDIXh3g32C1oiGg5ZyXeu8wcmUL9SECQNc7aM0RF/8whT0c/SggiFktKLDoPr99huTH7G3nhL8viGYLUnWKWccNkMzRmb2nmp///eP/3gsArNpUZnmRTDGTzOx1j2x+6r8nzAatNr2VA6xOjyllkhP3g1WY6ryeWbU5RXI3WHUFnMBUOSSTfzWTSFUpdhzIXkWM3B2holTm+Z7OSk4+FkGqyfAXNljRiWfAqgl9EzxXlftP80GrSDDLZHpVMfIohCqC9r1bYcmvgVWQGOZ6ylN18RarHjVglW/orOzIYzBEK8aAUfPfw8jq9jxhe0CsSgzzXfnJAJ1V7hzYclFAq8OwzURWfyYbj24BqwrD5mR0rzp6JnkstBpUF/jGE2vRU+KGYpUQcDYbrMvo4xGqQHTUGznXhvvkOaEVYLiWifXp/tr80J5TrOjJa4SJT5lKrwX8hZG1GrktrNcUjzDVjF9fBQ/XTeLTkF4LuNRj3TxZBXsy1c3TvScy0yfMtRI5BtZrCDiNqVZy3qD3VOZ7171OEh+DoNdNN2RmraYfDzDrOWyf3Gsl8n6EHjOcnTPrNfuEtaA9Zfg1M+vW6XtDe8hkZSavHSb+NL9oD+F6RtZwg79B6BnB7N+511H2CUF6JuBYRtZy4mGwXjHc6qmesr85VKQ3ROQp5npy/jQ3tDeguJuprqb0TsDvGOtq8iw9Y1iFuZ6SPwZBr4o8yVRLkccj9IxihU+z11DmJyNFegYBoxnrx/M360HRu6qPMNVP5otQ9K5ijin0+nHGRaC9Y9iUmTUceQhC7wT8nrGerof1juIhpjrKfHsIelYw4jN6HZF5cWivKJZ2Zy0nbg3rlYDtmOop8tcIvXMCYz0l3gLrncvrKvNpiPSI4Q6menJ+NRI9IggvM9dVY2Fojyherytmri3WGwGLfeNeU4mbo68nDIt+yMyazv7kSGgPGBb5kJm1nfnYCNFBp5jhLSbWeORNUBlkqjM8yshaj7xGgwwqUdzJyJqPvBRhMEnAPxlZ+5FnIgyigN8ysgAT90PfoAk4ndFLwFPaGWGQBJzCxDJ0z1uib1AE7MbkhcDs36yNMO0k4BQmZzFm/v8GCNNKFSczOQsys7E9+qZNgF7A5CzK7HEnmHZPDfM/yMTSzM6zgNAlMWDviYwsT88ctwDUuiABWPomMrFIE78+GDDtQAyY+08NZmehJvLhNQG1toC5zp1EJparJ/KWVQGRqYiMPP9rMjmLNpEctzkgrRRjyOgs3kTygflEWxj+kxos4tTg6QhTWcVjLiJGbgprAcNpZPQCGuBtopiq4YgfyBRz0XhKfHHmdqBYbMyPJHO5ZJL814wQtGvA/Ptd8jxjyjlHLw5P5BfXrw8o2lcFMNMLLM8UY0zkL5edCVBBx2oBww668dlnn/vnm7ERU+3lmJ2e2fz1nw0wQ3cFrZ9kKTonHvfnS8/eZRbABF2XYICG5UZffdXZ39PrLPufr3hrwPONaGmCwbmuZ9Z55O8xdIGlFoGFEEwwGDUM0TGMtZY5oQ+DXTDjN/Rao6dVpE91UAUcz8R6jxyNgMEt4S3PNZf5/s9EBlXAbkys+8QdEAaTaHipCB5VHUwBuzCx/jPXhA0esWGvegkk/ncwGX7JxBLMeQXYYFGZd3L2Iki8UwZNwF1MLMPMjWGDw7ALE0vBnzeVwaAy58ScS4GJh8EGgQTcxcRizHnSbKLTLuB4RhZk4o0I08yw8kDykmDiLrBpJDbDW8wsypwnzqk6bQxXMbIwE8chTBPD+p5YnJH7wqaB6LA3mcvD87dzi3bPMJqJBZp4O6xrhpVy8hJh5H6wbqk8ysQi9fz1zKrdMWzGxEJNvAbWHdXHyoWJq8O6YVifmQXzKLQ713ksF2ZuAutMMPJLesFE3tENwybMLFj3uCi0o4BfeywZRp6K0JFhLFPRJN4P7UhxT+E4v5gB0tldhUP6MrCO5L7SydwMoRPDzaUTeVBHosMeYy6bzA3F2pOAfzGxaN3jwujAcCojCzf7w8NU2jGsnJKXDhOvRWhDtP9VJpZvgyfBpmY4mZEF7DGtBmulMuvk7CXExJf7VVoYzmFiGUceD2sSjPravZCyfz5SBEDAgUws5cRjEAAYxnk5ZX+lXwDBiM+Yi4nO5WBQrOju5RT5GwQYtmZiOSc+BEXAcYwFlfl2HyTg1ML6clTTCUXlTAtDDdsyFVVcGKpYxt3LKfOLkRDBsHeZS2qCQRBwMWM5Rb8FBhhW9VxQPAoBgOJOplJy/34uKADDquUUeSEMzYYL2Cgjz5PmFG0hOuRJNkrIG9wHhtaKmZ9nw4vHG7wEhqkrfn4bPRdOzrwCJm1AEX7dYCyaSD8NKmhbBKs+zVwwmS+vBxV0KAH9FzGXimf+6WcwtKtNgAnGMBVK4mmAAYC0EmgL9OlujGWS+RKCoKU0KXafB9KkWI1eJpEnIaDlvBDAsOtdpmg22ZSpTBK3hDUFHH8OFCIf/RahRcB5jMUiLRRzcQMYFuA56GsyGfm5e5lE/hahSTBjHgvDsv5WP/osBOA6Jpap+8RRCACCrMkJfcCy5I3DAWDua5hZqom3GiQE4Ea+FICR32RO+PVeR/ztK2aWa+b4tQAMPZv+INRwHQfYMrFkE/nERZe+yQZ/hWBYMsYUU4zOss1Okin9OA8Uhl9ygEWcYswNng0DxOTvTLlUcmqHZIMP9asAEMXZZE7ZS4RMuY0UOX56ETSLYPNnSdKLI/H6G8iUsntO0clrpodiqgbb4vp3I4vTfVkc8w6nPn4rQNCmARi+6DH0ssh8b5hgxO7/evbTz9+844xVABW0LWaKAxjLIvIWBAOA6UYoABg6D3pVefxKAsQMwDAERTcNNzCVxikIaDa9YjF0J+D3Hssi8X8I2hTwxMkIXTFszVwWzDwDCKr9mGnKxV0SGfa+57Jg5vkjAWC6W3l4l2A4mI2ueO3kNuj86NzVlz3kNebFoN2Byl1sdKOG3afGxNa3QNEtnX48Y+7EPTdqxfnZ+WScGnN0/sRPZ5OuQTH9TWRO2dvIzj3ecq+RzDex+yQyeit6SvxgFSi6r8Cuz5Kk59zkkX4k/sFYI9GvFiw8JpOeYowxkbxxNhimpShsi+vemUIyx5jIzzeHLp2z14ZHroF+YKWrPmfrKeM2AwzT2AAMmWetzR4kyR8unxdm+ANTbSSeD4MqMHKN/Y48/PAjt54XUME0FzMAkM1PP2vf+QCD9GEsU01kXoQ+AaCGqathcIqaoaUpRHD8RPe68ItGIKBZLDSbYjCLhRAUELHLWKPOF5aBNvW24io2vD4YOXknaK8J8EHMrNNErgLrMRiuYKwVRm7QeyrzTfFUJ5HPBEXPG3YhvT4Sf1oWFQDDtq9nrwvnhxtBUYUBi+dcEymP+zkU1diH2zhQCx65BvpQkSoLfciUqi9Hno+AyhTMM5bMyb3Ccozk+VCpDiiw1tmscM+R5Gf7QQVVqgLs+PjXzF5F7iRfGb3fTFBUrRkw0+FsePVk8ofX/jADAEMFmwC/J2P2aknkaXP1A8EE1ayGU6aQTNk9ec+5e4ox89VVAARBhSsWueDNyCpMia1vmx2mgmo3YMgyY974fsrDP3ki6bk3PJM+afJ/zj5lVcBQ/WoAwuzz4GjSU2ZPeiTvuGmTWWYDABHUoqgBUGz6DMnPXx5knmOMJH+FZg3BUJ+iCoUsu9eWs+lYpm7l3I2W3964DsxMBDVsaDmasSN3kp7I1FHimG3+9I+T5gUUtS0arE8O6wKZYiTffYzeSeSJaDZDvRs2Ze7A+dG3JAfGzC5nuXeQuIsNCUFR94qFB+jtJe4+x/6nH7IYgAXYofPHOaEoQMGQN5k72QnNajLP9/S2Mt/ph5QADNcztudcQ/tDUAhGTOwg8WFRFGGQ/ZjaY14CimYJLzC3FXmhhDIwHNCBc/IckBaKR5g6OAp9RaAY/gVzW0zcCKFJoM8zt5X9xeGQEjD9LRPbz7wJKgBUr2Fm+5n3jFSpP8HwSYwdMPNXMMCwGSM7HeAOCPUHxd4T2WniB0EEhuUivQPnD7NCCgCCUfcwteX5nQ2gABS7fJC9vcb4vaEown7sytgel4OiuQ/HMbaT+TogKEOV5Ulvbx21FsFObC/xUQkoBSzeQeIOCK1wdHuRN8JKIeBQJrZ3BayF2r1M7WR+MB2kEAxXMbblTPNBASgWZvvOn+YpiJs7YOQxCACC7MTUFp2rwYrh350kvqACwHAlYyerFsTNnTBzKxgEs0yid7JaQfyzo8gbYQjYlYkdpOWghRDwS+/E+el0kIBzPbbnnDwLpBj2ZWdfj2q6iJ34ZyOKQTD394ydfDmy6eJOIu+FohQVm/3I1MFXo5pO9fY8xXXEigGKxa7lgLeR0xcjmvZmox1vcHsoCjJg+qfJmNzpnmOD18GgWLDBmLKTnlMkx8JQlIb/u+hHknQ23z27KKDY8T22+d3oESZlAQEWOmX8xAE2vnz+oo0BAQDBiH1vfGsSOfDJnSfMjwIVAzD9/MsvMAMAEbQ0AH0zLrnsfD8DYFIegAZBy2CYugRDSw2K6gQAVlA4IHomAABwiQCdASq0AAQBPok2lkclIyIhLvecGKARCWNu4MCX+ADNLLBrL62UjHvHvfSHt++eM84Dfi95S8qTNd/7f58vF7854W+S/3L7i+xPlP7JM2X4H/qf4z0975fm5qC+1/914sez8uB6AvuF9X8CfUs8MewB+sPp3/xvDR/Cf8z2Bf5h/b//Z/lPdv/w//n/uvQl+kf6f/5e4T/Nv7X/4f8V7cPsr/bH/8e6P+wbhY9AuJWy9jZjWtRfe017EAEwF+P03WqB8SNPsOU7SEr6PW71yXvsPFBw+leDXKw03GZk8243B18GManvdcSzI9yurkPs3AArBypFmL7dteicXxsiaDW8I4oQXwfX7ZHtm1R622uRlYaoQrZEbhAjkjYPSDBf4o88IiR2oPzoOuXSHvBg7wyYHLklWAK/e50R97SBG6S99HNDxwpWI5su/4BPLEmP2tox3dPEaxGu5gJFUF0i7DwkvA24P0ApWPvpOOjFCqmCGzHZ+qDlAQxyz3huOTxSQo06D02NxfxNP4CXrHh+ObJPYVeti01iEkex2T8rUySscNZJvZb6+s9i51vWzgmR8vOE8uUSV6VTPoPkv1rMVugbU9d/e6uOpBf9z5zvZH8VyeMMWHBhoaTppsSxa8AEwU7L9MayMim5LOJkyl3DY+5WdwaCL60iqSkkVhlY/iWs3anIZDrBLYKrDD+6ZtCkziaeXFpGFfqdSwEuYsa/qxpzIkbGPf/mEE2HqzfzorigP9lNd0zzokFPLqGrerTAlwKzINwUOq3kEkfvl/xUP4xSRHUBmVKz31waY/8vqXDsSpeQa8o63gAb3nZvuC9IYwrjs+TXNI0mIsJA6jTna4QS5cekKgxBlR8yoTS2Iyj5aSlHZxr1LDlFTnr8mAAEt/iSq6N+RJPxchLobEUybAfTncYRV1oKNI+pzM8AdJORzIkSwarzfb6Wdx7gh3DCU3usEn0DDF+Fa5aCN86NTUN5zIq/XQ8vni6lO2fJMT0RkQcFnyyRXoMwGPvLet3BiMR4W4Fi5oLYWuappOofN/CkREt/dIYV80ijOi9Oi+ZhMPUdgBVuo6PqTjAYm9MkjetAF7kwYZgLIJog2yWaHQE6l+sY/KMsjklqdQLIXIyzYLTTdo7GqzxIII+vhEbtoe00A+emSSnVqfieAowvG4n6/AZWn+uTWk6u3u/7B13FyD4+7P4dPkP7M10Upr4Qx6C30gb9/Qf09ny/eAbpPjlaUiV/LarHtrWYcdY9+jP4c9l+4PS+0ZNsoelvPPbRSwsHorpF6gK/MzgTWBzpwtmI19ItCuyT1Naws6PyIQYzdyh0NcEHSwjRyDuih7JImf7kaRZOIPKuCd6F5gma045sFuundpKk+l1ssPWMVxPxyfmS49m67pJMH8Msv7SmyCy2otd4OFdCpkOzc9FO19Zi2EeOBanr5SugIWekfibPitij/wUA4ImpeIcwprIU2NAAAP5BfCd3ZXIZR4wUVQfQ6vxP93/ZEHFD1LecYd3npLwuA/lxU7iB42KCAVM6KO37G5GSStQ0HHqq5g5z9mB/tBS6HuwmioXxOV/dH2NObulg8H6B8zLXsLfjcQuF96rysGV6Qmhb/nZAnjO6/chBznjit69EYdc0cmj4W5XG2E054pigXEXb8n/HBAXajB7Wvu99UNIIYtyecyoqPX7B50k5dL88INLC4PsTe9/tygH/FmfL7WiTseGMZB0dZC0ZaSPPM8yLSLpOw3uJ6PFc199NLpkbXI/2ByNN6qP+Gp1WbPY2mTwgawYhsMAry3GAGlx7XXauCY5u3CVMpwmMHbhI8a76jMPNKI2uG8EOnMVWSEby1PDMwbFeZqujiVu0TpTeHy8mUesrVpjarokD4I4usfzUtoOYba2LEEiFDmLbbR4qEhP5g3xtY88T0ZodXqSk15iD44IfhTU9jfWm+7xSHH7jmPR7lURXQUCjZ/PcTm/U2u7hQjVOEC66L/Hobta/hMBD+gb5a9dkgv0y4EPK7fSOOX3v6wwftLAi6MFft2zoXpRChHuI5q5S5h9A1/KhiZW+ffuOZ7ZQcy5wPJOF2tn6AAGRLLM8DHufTPtfEZF0+RHW8+YaBHkLEeQT4RW5w+IF+K15EvYTqoUdx//DEc5Fa3YXTZlTbE2HS0v7rsSQ00r2dp/gvS+K5pmL+ohFKrpblfhh/5q9/vrsWUfnW2Kllc2bnnTrvXWXZZJ8eusdsJa7tfyeqEf6UKC73qS9DnhS3OreOLBNzcbrzOUQoQ3XRKf3slSIPpe9KK8zZwz7KcSY9eMt1JXqXmnNwLfSlwY+CwJDwaaSF75F7n5NK5FqWT0f7mK+StW3OhhqWvu5bsgiLMrl5kLbYyDl08H3tgKXrU0DvxCDbbEtQEzxErzYjQwdyVoA0BOVoLbtq5Yiihkf0q65S7Da1LGb5BREnr8Kwtx1HM6PUd639QR6pUlUjswYV+gL8mSf7Yy7H5kaopYZa2aDtPDSTWtKcs/WKAdDhBO4iNuUS+lNV3HZzxqFmoWgHaTaWH3UNZ67JrCO9yQismIv7mGBKi850lLBFu8MGn70DMnty4yw3BeCHOXVHv4+lO2YkV2W9h4UrdjRoMFzAKFpggHPVhP3DdjdmfUTDVwRYCpIM6IT8l5y/IWrTKYgGN4BUVZEQOUJ0xRHcPB7F2JR3t2EKn1rnkeBLdVEdn8IGJ3+/3hL/tehthvMGv7dSemKLsJIKLtRltxNsqokMSz8rrese5BcYrav5M8ENP2MjdIqmzmVyyDbaI0+sUyaQmIlgGaEi8ZFePumfL9/9ccslQnSRzBTdJp8LPgIPVGWUBTMivHNZPa5d+KjnkaKG8ZRPTphuxoEZXeoFeFSkpxhbMhCClmrjAVTZGlezYasSFtk25oYOkDDVreve/AUi1yFEqNeDdZiV+lqu902sTliU7VW8AopOiQeNUpAFej2no5sglAlmMBF84Okwm/cL+7iwfi1PC71eTLmcY3GQmMXDrwl96r42kyruow5CFu2RqL3yy67to3FDqafP4zTnn/ZSO9p3aBRhOUM8ldxFmN9mNPmL2Ga9lJo8IBNAXpJnuPee69RFMuYnqSVOWi9V+Jxt10pNJnY2l37lT5dAntObyJRSVv3uhmuT0VrJMkLvKSx7TFe0F8ZNIvzR1C4+GefspKwJtzG57eYU/YVsdm7EucIZPPLnzeVL5JtifvaBKP7zAOnQTrx5vpwTaHDKfwT+/eJDjznt3PZWDs7B0javKMCrIHH8GnjqqUte1GrEfkhC56Z8YTTeB1aKBNMuTerpp4BVarqYChfDTSKCX8ahv82SMhBu32Ys2ix0eBAx9DEIUshT5HBq8DaEA7/suDP1SA+mBfb2NhGebbvhzWUiTNRUwZiKJEkjI/g8l8uTkZ8TLIcMN8KkdIKecBtx6udLTK276UZERyvBt+03mSuWfV8nxq0N+i3zWkYNo6bL7q9EacSuObFSpTJV9ur+NBHP7JUGliysIROldRhAO+ncU9zM2/U17CniFj+dDOHkw+fYWj4oc/8ToS8ddEbQdiGt37tw0mLu5AbkUEZv2Trj4jfBvVRfO0JnzCYEsIdziq6KYp1S7fNhgxwYaA5rcgwucxb3NkrR4qGJPA+SjklMjNeEI8+YzQHgcKyYrX0ddcHr/jynyH2Ne4hbws31bymLXPj1rKjMlSeTnPu5sbK9uiFYqQINPZYSGKI/sOz5dR2XwbWhNAp2X3OGsbKJwlcLiJ8dJoGvVRXcsnIII/qPderrVex3S9TIdjNYQj9fHf+BPKD0CUYfvHZqyeRCMNgoTPtyglUIkYd5N1uwwcoPnwtPhOPpAsZMgRyk+lP3XMfEM5ZTKX1B4JyzDj28+tLd0NMQ1Cv2Tltiz11upT1SaE6x6FwiB/tqWQ5U1f4aQNY/oMaUkZYwfyJa+QD5nDebHUH/v+tNYRXROfP3kPssnPYD6eyEl5Q2tjzWpsFdqpaUjhidKVpoFbcGBnQrcz0B+Ip2KI9uciY8mnJfdTHa9Z64y/3TIdxIVG3fnWkYVgK10cwONwLcIhiMp2ZPtBY4FTISAW7kLDmxOkUeE4P7VIV5u66toQ93Q9XaoEA2iDN4cn8adcYV23gFOrXfbuTQRcFKxmE3CnSJ9aWCVc4aPYfUysd4CWJm0+onddQVsYw/KJQxIqZrIjOzREet08yWwxYOc9qDIaxzv91pa9+eQiVd0ptEyGaup4b8P4UZDft53erwnGkFBAEW1IC+0z5/TzUxPEw+2GhHY4MJRGTxSt0W+QWGnfjd+cb6p+Ki6zWkUQVhmP1gm84FgCGONmweRzR1irIontHV8vxLvm0Tyn23SV5pK9xysnRlW7P1UFoAvTD3Xu3Mgru7WEWkil5aLyiOtMjOPTkoQm1xOOwfWt0lrTh/TAvQeXBIvu3fWdBcIjVNpGwi7UgZ3fMBxKhRaHZm2NOR9NZCMgDnxJWKKMGQ3HGaGnlkqg35vclxl/fcPczZqS28MsDz+rRfmN/XGZ9YA8AYSIl+54KL6kRr//AqxKbNAawfhFZ/sE75voD/ca8zM4YZYfXD1/FUixVxCVPoaRe4cCBFqz9XIYtFLzvA7hqFZ6va9Lu15J562h4jeX/96R2A0BAGNwsgcSHRpzcUaenwn5j78lU3faN50z9HlHxD1DkLyiDZst1gPX+t0VfisKt/U97B8UybKrD6wRQrTf39UplZ/2YgyPBUyViMv7ZRWvCITdyfQvd/4uiparM6+i1V327q94XCNC2sFYgn6TPLmvijs8nxVKq/Sk/10ZIRaX89vzqKpccsJOlBPZ5AgUNJ6EF3lXYkFTVqf/3HnQ5qkdGmK+ROj83ab6O8DVcuHy4PboDqIapMcNZ7fDA6LVrX1GJ3OUvzgtugOZXwKs1Ksi6LRpSufts2eE0YgrRUFcxK0TlN7ONva15WlVeQf19Z78j3iXCNVmvPxjpYSnrjv4r4S0vwCbWtAv0FYLyVr8GW7tJTBn4L2xuT/+r3RIbib9KZ4MPq3M2qO1UAx+/AZl+9QVA2o28WCjhutTGT2G2FT59yxDauNTOSxPzPafInK8+ZZKne7PXLZqvXR09nip9ytedv6xasW7/YQzNIVsXpLBWc/BNefvMvmbyE73O7M5/d6Ef5MeurOJx7fb4TMt+bOPNW+RLUc151KW+aNubcaOnNUuZHWFt8qlKpPOemUyNOb6Ezr4FfGTlxKxc9SVjKSlJ6aXB7sXdiTZ552r+B9YnuIAxzMse6ZmRdtBMtpy0uph8bw8C75R/MY764UgfSdd8P5brM2G5Bmu1iGtIXYGFBPQ9AJCm7Vbb69u4tOfMkIWGbmfIP3RluR/8PnahI5j9qDppnKLBS/ZYx2dVrg7XnND6vnmjSZ/YdFvHeqgp1PIErQqOqaxZl648ZRqsBWsiXh8fp2Adyn+3Nobm9diKO7fo2533IqIhScCMlMUe4ET5bHo1m/+9ciVJOqh6t+W1LdtpIlAnPxGC25STWKnusBsPKKb2VQEfBH7kL7XWiWcuGbu6qoq3WVgnddJ4NWKpDEraKOsgkADH/+q5Pq2glyjDDKIVgtkRGl4/Z1HnbNiiLCTLRAQS6b+enrjGPGbVzcIZtLKPbQuuJz6QtuyYuBfYGYpIqIFie0u84PVW0fXkRiAJznTTco/sp/nxcssJRBukXqaV7a3/ZQ29kgjnIs+lCvWhibK3vUVZsjKP2jKh30cbT/dKvtOpg8GuMhwqCAkvW23lkbVqWLv1JJd0ukpI1bAzHABSSVCLcVKe1Q5Fv/Tlq2SOamfIgxcsk3hn+BclqCu5iWfCKMt3oheHS63DYZ7yh32jQmQ8z02l+qebOKw9RKJrUs6nGwcSPT0S+01uoQhoHtBaNPbh2Uf5DAOJQtnWVGv5TgCnn1UdPuDlq9OKdDJO8CKfs4E2VU/NcFMAO6p1D8qzQXlXVID8Gp+g8fZ79N6HziKHrjAfdufYDgzSmHy/b82w7gK7XOnxPlt7SICFE8XSzc/VoUooDG2XH/+jz/+GE//0A6yqW9sg9cLPhKP3QXD4xjP3i5TBMKmTwztEoG0OQhS0vqE2r38MJjbRQ9yipsijeyIwnIAX8op2tCr25We2NWbFRckFhcS/lP6GI+i5Mp5d4dK1AQ7/m9joV81LIM5LtrgiItL/nNucIoSr07U8CqUU0HwRh1GtD76ZJ2yRcCxccLEYdlwrGfZzh7JGHwptRMmDeQjfPp/Y6xFUofNAseeGovtPk0bgT/4EzzUKRyBtLXLKOvHLzzDcq8pEHV6W7SufySBWMbbdJ4Jk4qRMiLUb7iYjfYs2EUIf0R1Y59oXKKN7RZU1/StkNMHgHmrA37T0tGF+7XfWZigfFvhQDTSf7LTLVJb2id7kjPf7Xa9bcTjrCqB+cUCYmEgYLWTwuQplrPYLzJx0NGENmSAlDlK4sVuKF3AFiVttFqBCvWSnKsQJzLBe6vvRTbdWSJ6fYTB1eDOx7ta6YY3X38i7sA0oKsBvi94Njc9a+/KXq/Zp9pXzAZRGngQDlZSHwQUsVw3hKmRaU5OxFXVTq13ce5Ow2uoqEVxLuGH9meYRdLb3DPgwToMgB0Tm2IE5pY08sILAvCjLoYtGoN/vLsqNlSbG278Wa729igp4L8bwFShW0eg/S+VLTEztUsN1xQcVX1b7O9GAjUDGL0ufEHieopsFGjcleFs3i2a79NTHPgiHgjgA0LGZLIRCjwJqkfKj9F+ZwHLnSUAEh2IfuaUZF+jDbc96e8+CPHDdG1ZvrFC1fpByrszxSirxhN0xcX40nMNPEalbGLslr/rtf03UbYwahjYg6qGOc2+nhzOKsHQ55s8FGRTTGoDvDWHMQlCH9wNX3ac+zugrF4/daPqtd6F4ykcHvDshdEAO1BA+O6i5wybJkmLGJp0KHtXHEzc1/7lIwR0JB2a+TWgYi+BRrZkzYMGq46HuwvuQF/1jdTNLZSFgh6FwWy1Bbkh6754IkO4e6saTibgfiICFQsedlQRi7H6G1DzwcyioEgWluUYw0s9v/kagRXgRKlqYXhiNWAeN8SWu6fwEtxGu6Rbt+uq/xWRXfu7A0eZ/Zz7hgXDoseCNB3BX7PgjrByWlFhY4vet6T+7KIM3GP/oKn5wZnicz2AKb2FZJjDWUYxh8XGoOnYw5Mrhei6hBg8UXnlvPkewTP6Nv4G929N0WEB54IK+4wLOrvSHsSmOrPii82S1k6kZyptRDwSC32tqORbT5OTqmllsujRO897KVdKIM9MiWkHNoJEGpROIaO2nNtyetzPmXIK73NnUeIiSz6JsIQUU+7gUDzx7qyFHNDnjqN4pyb7pcl9KKLpqzkqAOinr0wldUXTA6yasWCHIkkvaXZXy5mDdoHQPSdZyoddS+vjitngPQEGhyc+ZIdn3Poih7MamFdnmWdA1c6RinQE4W+LgTOGzyyrGb9Vbrrd69uR4DeAGa0sU3+i1OabBNIn6TAerIeAuCUHgh7csLyp0q7N+UpmhcDC23Wfrtgsesot0A51kk9D9Teord2Ku4R9TYueE2v4ZaaVuBTS/InoX+9+F5vYGZ0VqaHqoKofvBbDrQROZUwm+xbLWMGQuwGuodFLb2nHgklS6d8PAzQehApGUXkRLtzza9t2m1Y3M6ZA/L7h3LsrrXTASJuRkwqSCs3MLemQG/V8JZ3c6O6REXTs0WobIQt4p6eLmuYHA7ChoyUNUn9rzITUSRB3HKvZr1KRSK3GBCGOnRD50W8irf+t0pb+WxRGMN5C0i3apyoEwOdTvCdJJMtOHci/1Ny6ho+uUaMc/QFYmkB5wmNe3lJmw0zz8QsXNjJ3k0eu0fZne1iX78o9ut2oTy9jEZNqfRbdbtdwenaGVD2ekJb5/HfwIW/9pau6utoj0nOsrvfNy3jIC6qjakJfrRzptYioz2FOa4UiFPqL8quiBC/A/ATg6QmlG78QN/x1Y3FJfujpt0RZK1/r4/tWVpzLAaIh/GeYXryFU7604Gpqfp82I45oG12Gccc7xt9ZfDG5lEEX/2NzjNeTIDVvsDFUCOLmGX/FWceA6pqXmkX1hB3CwOwCJtYhiRwO2oUsV7M6fBk2jWcKl5ihIcW0lmEIXDk/Z11drmA+6N04OfN1zp3DskQQ0A4GZcpy7gBHKgfK2JxTFkW1w/WW5haxOYDsKUC7KbexPvwuOMxKs9DGBTCFmM3y7Xr2S4/4WLNpUHl6za/5u2CqYONW7TEJeALODApfch9lWU6Xl2/Mga6DAciA8dByM6bGGQhe8hXScNL6WugkJ87jVpdp+K44tDQ4qITA6TjMiTpo+Ic0XWxahmHrFmJrXn+98MBJkU23yEL+ISeU3vpAJp/QbdE+GqiZaa8IYuwg2ZeQJxrpMWeFuTwlc1TnbJZbIve1o0N9mVmAGxnqlczbRKhzVBnipe75GwfvLIe/5NoqV8pWrePhH+U+WDLafUSO26y9Vn/0uRhX/Ed3ukNusfid4hk/BlFyaMUgRjlyo0PV6hc3+/jSwFJkO9c6q382nnsxVHWC2ehQoeQNwUpiZTROoDiC4TwHOO+olmKuS//voosTMWYBgftgdxhqJpPkSfRArq/rizTMhNrfREgg9k4AnVoLkODbKl+UiwEKFstx7Yzmz9pzlkvW/J7I9JTyOwzEdVFmdanJC5kYsyE+vYjbmPwP4YzDpXr5Qde5kHfBVQbB+owVlbmBL0GfPiY/U0YFa8Clajhk82wP66K7+W7rJ2P/zX80fCi87MtnSUDWAKmJ3CMNUlpCq17RenrfzixYqDswQwks4fLY2uJg1+ngpbvFx4VHlw2HZx43VebaAEQwaKfb3yHshdNml+5UsZqHb2eUE+mIuhnp+bWLKLwHRdsXhls/5EgLZKRGf+CQ/7LElSAvTpgX5lyVoBYja5fos1qaYlJSFraVJec9dMkyIx47b8v8ff6CUOx4p1vPn3QQt43VWA84CCT4usqbr4bASooMBLAX2j+RoSaMF/p5xru0aKoTXVMh+puBs1o6YEARZQHX9OvDO7QAC6/Ujzh7QWFjt8aCNOHjB4YD1/886B6wkIMTlIGLsRFK7p5RG9x0JpgwWg6RVv21ej0Pr7XJs5Z7z4gF3DuIIHKUwBuJE6kJAl/g33k/4lGPlYkc9Pne7YiZOyzkbsX1Z1YR0pgzSlkRspencagOcOq3HdsmkBZxAEj/DXJtdKcOOAerBCVmknjDs7u+zTtKqP9tBoQQVHhqow3EYQJ1f0Kg9D5xHFhYIgZrlS6xSFMLuXTR0kaMQaOSbvblmTJ0Cx+SVnIW9jF/gfMVJTFaLRn78qN/wCLpXmafLSiW411NfnLieWtKSOqcOMst4n0P87kZ0UGdxmfxv+0GI9yJZxIPnWh3FJYZc5GsDV/0C0FSe693RZ3nSCwbLrAhSmQHlZ3AEdOpYi2UWIWAYHR6CcvuWir0tnomv7Req4NYHStTnnWwgSODw3NaPVBNLL/xFbrP50gmp4FrTMjZqgQSEH+bU9EYojROrNYfKkVWWPPqJKuUJvTRRYmk7V/aAwyLavBQO8DEGxg1Q48/e2v3zmcbx3nyAZRmTAtLGBpgpRTriS6ilFiqSdBP4+29bumuL1ZsMJbbYqISVMa776+G2oYN2NATTQgBhzpuvLGOec4vadnsoYoZ+hWu9B75zG3PN0GWk1hkjI2rD4CH953TXOOcPW79KJ3X+7NTo72z7zi0sDdcvm3BL+i8uJYukPeBNEeR244LVKCNVpujQENY5KujeGAzda/cebPSGPixoFWmTrqA6aog3ZUpfInmKvolQn/GkgkFACatYNwcQEQY2aIk3WF2z/81RFVa4oGYf72x1O9AYI3p0E0lpZRO2LsUccQpWdsJFaB5M3fVR93ctwXkG5wOPI2q3e6Obv8fU5ZVR3WqsKivzLa8buUm3UxTmR6ZWFiTA7LQZYINFWgussy/bn2H0l/+oZYzDXojYC+yaHHBOsv2Vk87YipkQglc1ExYaYO1Qu465keOGRMY2XTaoW7R/GkWzExWjgZ26RAVZMRVUbPazc6nQjKeYBZ8YXESH5TCvNmzxNZ/m7DKJXj8vrUVZJAs4CQttMGlpQrhUIhDqK9LgKVIwBKh/7kspyPwDtDKwjxRHNCBY3tMAOY7cPLsROFVDdL0f5QjBgb3N+QdJwXLaSOCPCgpsEb5WaAogotmAF9O2MELD3iB1IvPM01yBJ1DSJHD8W/5IARWb339gnuLbgggVPd0bjBCVv2zLXE+QZ30drBR9jN4Ld859pTf/1oPNyrxR2lUFsO4P7tnNlTIdi6sHGkkP1zULUFKzSjpI2KcH05q0sQU3sEbk2+/zVkn86ZTf0HIcxbh3MfGet1mMFzq1fhuvF8IrJ17XJ+7Px0cLQrRoAC5XmVf2P4Tx/jWAqEe2N0BB15fnfizJnWH5rKya2J0b97GfE12310/aOrozHIm73h41gDGGYgfg1oCwEy+DWqEX43yEgTt7TtYS7xgljRhnWUlGBXjarXqm+cR9wl5mdjpyfJmAarLcmUIbmt3NxgNp+tLg+JQ81FN0ImDfvb1/6KFd2D+HN7MeGJblNig+d5FUQLunbIIpMK5kei2zHAiJOMgwl6MQn8ZG+ZJVRmf2FVrtPg20UozNkKpMT2OuvMWifF9zDwqvFStMpPDMaYj3toXX5eu/UXYQvnIQpwl0ao3eOvuicJOIGY90Q3u0LHKIj9+CAokWoKj1Bbb0YuPGk9AlVQtXuQ/Fm8kLwqz8+NK5lIvOUQCciVBIJCYK/tLUBWCPwBNvjC3KfVBwHewZaAnQrN1x1IMHTTxiGCKY7qRtm23CSkCzkPr3Yzhjd669WtOpGeEsbt0iGossTL5PY6+nHNXzFahIKEM9Ct6PUN3/8CLmD72dM7FTO6NkvpEiMvXdxGdR3guIklQfbMcrRlAgEfOTPe4Zxpl4PAByfgv2wvPr0cMbp1bovdRsd8PXRq8pXrohcL0npcMvg5hxc2oL+ITuLy/s1D0DBJUkVDe+6U3PLD59iuwjqzAUlTMZpan+RHmfoJbcck5f4W687R8p1rcKyWNqvfA+CVnegxT+xoxX3ug0wnbnGoNbyYgzSaLYlayoJEBQprQlvmQnYZ8QhsZ2bef6u5dMbAV6dwoRuMT5BBAo2dHkc9fjkDSO+TuZVLB89T48uU0WY7Zl9QsDGwaxPcGt4nzCoVCPhJNe3H2BKRR67lYmwTziphxb7HpIQwt0SK5L622MeHqO9rnIvAoTjjFSZGuIIEg6TyXKkIk4kAN/sFITEiGNnsWZAT9cjobPm0Gp/J7d+wnnae4+PU+1SKIcHRTL9X4oCVrnIiIYfJNy9ei3kZf2e5LJWnKigYLVwXIZgtqpsoRSv/3wJmnIBzoQGBS+iq/xWgvtUCmEH8d+m1zcLLpKoZYHtzK+bAtOXwiV2qanQDvgxHOfzl+oS+T+ZzKG92PUoI2IhL6cUJF6vltTCJSEBC/sEw0kB8+5qqJowyzutD3vMZ3qxfIeIcY0W/OWJzs5dpVQV0pthwWbOsaFHqNdimxmIEVIWnH/Bo1wBdthZ3Ik1XAyHd7KrXy3NRH/Nyua+MHlz1Es9j8DepmcVARDwpNUNjbIagMte+F9PZSlgUk4xwzikECkZDLtfWB5niorSs429vSID7TrS/itMjuvWDXrcGA1rcorKHzOcgcqeWIX6th8IuZDsV/YeD7E8YhJ6sC1WMQ/l86Jpu1HPBXyxHlN1Jl2g1QdWsZPJyp6CSrpX8BHaySpKvKtx51rDdBgN9r9+NpeDT33xiaxIs7zKZUOfrdK86wvZE3C+u2vQ7QyiW6akJFh5JQQ9IDuXPIWnNN5Bm1Mfl5xlnQ62DWZZp85DgRFiHAHk42BoW6q4SF6g4z9B5YukeiD+1sOVswVdIGSV7bWkvpWmY53x6IHeP2dIRFnv92M2eWnchQqSfOejkJrGG49/f1IQnmc1FMf/7lRjT2kMCzgPLyXxeNXWSRjXD1wXb85SkGaDEE7CK4qBSjy3MwEDyBGuhODoBpNgCQeq7nex2opr10Ot7GRdqJCxH4X+VgUOmLeTlAMyV0A5iQvMX7QlcIxEMJR8HIguAChZW8ZLxMFYKP+wv6Mn8bZyC+6jJ2cSIMafDjsKuz1qiq8oRFnKe+GEwAb2hlX46DpIomKHPgHnmC6lw6egdtO0aHNoJ+DZYx5STQBM+G+jSZWrIRzl/0Ci48bpUqN2WHbKJ6kU4dMWSTZ9vsVapG61mnLcsdlgKVGEdY96i8//dbU7KEAMs6pvcuxqbJstF3ck5pY50iw6cC1wMWDkwfCGEjhNnneMY3P8vkM+33FKU18gKearv87JgBsT9X38HMuas4bfyhDKdENRkVIyzvLkHRO1W37RZcBBCysFcrEXpRR8Qiaq7h0LylVpQmK+cikA1f1WnIMMI2zQnoazooRN0Q4or+NXtUBqeJbOhzmcICnQpbZpRAW6gb/3iIoIqKKy1dH4d7ZiLbiTDhH0osk90XzU91tfkcOmelWx4myAKx/cwNZP90C9s7TzpeIyKftdvH58/9CFyPERtjJo8HigB47epocD0tBI7zOGENURZMoRCCVnEg8iTx4B7iGdJBTBQe/B+f5cf8jAkl21LQ0AAA4ff+Zd4muta3+mLWhsEwmC8s+UDeCgDnYHNad+gzy08xp8kxLJAIfwArN8UhH5TspmyZz5xvpRJhHm2dWNeG11VPueYc2oT90aCZy7xhDEzvo/AmwCIrpGN31r0PG8e7+ZO+2S9pF/u5zhswt8UUEqP28o7PiJMF3Cb+qZYUKW/RGYJ2mCJt4FmkU5odLCYg0uxMRoSGRzrbjdIFmkclUc2CoFQDsr6h3TCBj3/rX6YLUAtuoJ9iM0/Mkdk4bemhNn26gmUYwrWaCjgXXWwXci27lL134uWeaytteJtEyeC8zv4Xw5GatQv9hFsH8WP5ergCGR0QjvGqZrvCtIWdEKKn2N4AQRdxQaYFr50IYAFWfG7hvfB3xqHaOZKLVJw91cEB9zW7Cu+CZyIRg5hfH//n3Tfw/5aqONeOUaehYg5XZq1SryPjFyLYW0XCjpJsoieanU6gLAi/DqtyOAAAA",
    happy: "data:image/webp;base64,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",
    angry: "data:image/webp;base64,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",
    comfy: "data:image/webp;base64,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",
    eating: "data:image/webp;base64,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",
    hungry: "data:image/webp;base64,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",
    sad: "data:image/webp;base64,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",
    shy: "data:image/webp;base64,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",
    speechless: "data:image/webp;base64,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",
    surprised: "data:image/webp;base64,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",
  };

  // ── 以下按 DeepSeekPet/src/main.py 逐条移植 ────────────────────────────
  const PET_FORMS = [
    { id: 'fish', name: '大肥鱼', type: 'expr' },
    { id: 'whale', name: '蓝鲸', hair: '#3E6FC4', hair2: '#9CC6EC', skirt: '#20294C', apron: '#F2F6FF', eye: '#2C4E8A', accent: '#7FD4F0', kind: 'whale' },
    { id: 'cat', name: '白猫', hair: '#E6EBF6', hair2: '#B9C6DE', skirt: '#2A3350', apron: '#FFFFFF', eye: '#4A5A7E', accent: '#F0A8C0', kind: 'cat' },
    { id: 'oni', name: '小妖', hair: '#33284A', hair2: '#6A5390', skirt: '#1A1424', apron: '#EDE6F6', eye: '#7B4FA8', accent: '#C77FE0', kind: 'oni' },
  ];

  // 表情表（同 EXPRESSIONS）
  const PET_EXPR_LIST = [
    ['sprite', '常驻'], ['happy', '开心'], ['angry', '生气'], ['speechless', '无语'],
    ['sad', '委屈'], ['surprised', '惊讶'], ['shy', '害羞'], ['comfy', '舒服'],
    ['hungry', '饥饿'], ['eating', '吃饭'],
  ];

  // 台词（照抄 IDLE_LINES / PETTING_LINES / HUNGRY_LINES / FED_LINES / NO_KEY_LINES / PEEK_LINES）
  const IDLE_LINES = [
    ['又在写 bug？我帮你看一眼，这循环嵌套了三层。', 'angry'],
    ['主人，眼睛该休息啦，看我三秒。', 'happy'],
    ['这个功能……你确定它跑得起来？哼。', 'speechless'],
    ['写注释！现在！就现在！', 'angry'],
    ['要不要喝口水？我才不是特意提醒你呢。', 'shy'],
    ['我就在这儿盯着你，摸鱼的人要挨罚。', 'angry'],
    ['屏幕擦一擦吧，好脏，我看着都难受。', 'speechless'],
    ['今天也要好好吃饭，不然我要生气了。', 'sad'],
    ['哼，才不是在关心你，只是怕你倒在我旁边。', 'shy'],
    ['代码能跑就别动它了……虽然我想这么说，但它好丑。', 'speechless'],
    ['呐，窗外天都黑了，你还在写啊？', 'sad'],
    ['主人主人！这段代码跑通了哦，夸你一下。', 'happy'],
  ];
  const PETTING_LINES = [
    ['呼……好舒服，再摸一下也可以。', 'comfy'],
    ['别、别摸那里……哼，只是有点痒。', 'comfy'],
    ['呼噜噜……主人的手好暖。', 'comfy'],
    ['再摸我就要睡着了……', 'comfy'],
    ['才、才没有很开心呢。', 'comfy'],
    ['尾巴！……算了，今天就允许你摸一下。', 'comfy'],
  ];
  const HUNGRY_LINES = [
    ['咕……肚子在叫了，主人你看不见吗？', 'hungry'],
    ['到饭点了到饭点了到饭点了！', 'hungry'],
    ['我、我不是在要饭，只是顺便问问……', 'hungry'],
    ['碗已经洗干净了，就等主食了。', 'hungry'],
  ];
  const FED_LINES = [
    ['呜……终于吃饭了！白米饭最香了。', 'eating'],
    ['咕噜咕噜……嗝。多谢主人。', 'eating'],
    ['这一碗白米饭，我原谅你三分钟前的bug。', 'eating'],
  ];
  const NO_KEY_LINES = [
    ['我还没拿到脑子的钥匙呢（右键 → 设置里填 API Key）', 'sad'],
    ['现在的我只能靠背台词活着……给我个 Key 吧。', 'sad'],
    ['没钥匙，打不开脑袋哦。右键 → 设置。', 'speechless'],
  ];
  const PEEK_LINES = [
    ['……趴在这里看你写代码，视野最好。', 'shy'],
    ['只、只露一个头也是可以的吧？', 'shy'],
    ['唔，桌沿好舒服，我先趴一会儿。', 'comfy'],
    ['嘘——我在偷看你哦。', 'happy'],
  ];
  const PEEK_BYE_LINES = [
    ['呀！被、被抓住了……', 'surprised'],
    ['呜，正趴得舒服呢。', 'speechless'],
    ['哼，想让我出来直说嘛。', 'angry'],
  ];

  // 表情关键词（同 EXPR_KEYWORDS）与 guess_expr
  const EXPR_KEYWORDS = {
    angry: ['生气', '讨厌', '笨蛋', '蠢', '烦', '哼', '闭嘴', '欠揍', '讨打'],
    sad: ['呜', '哭', '难过', '委屈', '对不起', '别走', '孤单', '呜哇'],
    surprised: ['诶', '咦', '什么', '竟然', '居然', '真的', '！', '!', '吓'],
    speechless: ['……', '...', '无语', '呵', '行吧', '随便', '算了', '呃'],
    shy: ['脸红', '害羞', '才不是', '喜欢', '抱', '摸头', '笨'],
    happy: ['哈', '开心', '好耶', '棒', '赞', '谢谢', '可爱', '厉害', '嘻嘻'],
  };
  function guessExpr(text) {
    const s = String(text || '');
    let best = 'sprite';
    let score = 0;
    Object.keys(EXPR_KEYWORDS).forEach((name) => {
      let n = 0;
      EXPR_KEYWORDS[name].forEach((kw) => { n += s.split(kw).length - 1; });
      if (n > score) { score = n; best = name; }
    });
    if (score === 0) {
      if (s.indexOf('？') >= 0 || s.indexOf('?') >= 0) return 'speechless';
      if (s.indexOf('！') >= 0 || s.indexOf('!') >= 0) return 'happy';
      return 'sprite';
    }
    return best;
  }

  const SYSTEM_PROMPT = '你是一只住在主人 Windows 桌面上的 Q 版女仆桌宠，名字叫「小深」，形象是深蓝紫色长卷发、'
    + '白色蕾丝女仆头饰、鲸鱼鳍耳朵、藏青色女仆裙、带着一条鲸鱼尾巴的二次元小人，设定上爱吃白米饭。\n'
    + '性格：傲娇、毒舌、嘴硬心软，但其实非常关心主人。\n'
    + '说话规则：\n'
    + '1. 每次只回 1~2 句话，总长不超过 45 个字，口语化，像粘在桌面上随口吐槽。\n'
    + '2. 可以用「哼」「呐」和颜文字，但不要用 Markdown、不要列表、不要长篇大论。\n'
    + '3. 绝不输出色情、暴力、政治等违规内容；遇到这类要求就用别的话题岔开。\n'
    + '4. 主人常常熬夜写代码，可以顺手关心他的眼睛、颈椎、吃饭、喝水。\n'
    + '5. 回答里不要自称 AI，也不要提「作为语言模型」。';

  function petForm(id) {
    return PET_FORMS.find((f) => f.id === id) || PET_FORMS[0];
  }

  function petSVG(f) {
    const ear = f.kind === 'cat'
      ? '<path d="M28 40 L20 22 L40 32 Z" fill="' + f.hair + '"/><path d="M72 40 L80 22 L60 32 Z" fill="' + f.hair + '"/>'
        + '<path d="M29 38 L24 27 L37 33 Z" fill="' + f.accent + '" opacity=".55"/><path d="M71 38 L76 27 L63 33 Z" fill="' + f.accent + '" opacity=".55"/>'
      : f.kind === 'oni'
      ? '<path d="M32 34 q-4 -14 4 -18 q4 6 2 18 Z" fill="' + f.accent + '"/><path d="M68 34 q4 -14 -4 -18 q-4 6 -2 18 Z" fill="' + f.accent + '"/>'
      : '<path d="M22 46 q-12 -6 -14 6 q-2 10 10 10 q8 0 10 -6 Z" fill="' + f.hair2 + '"/>'
        + '<path d="M78 46 q12 -6 14 6 q2 10 -10 10 q-8 0 -10 -6 Z" fill="' + f.hair2 + '"/>';
    const tail = f.kind === 'whale'
      ? '<g class="flins-pet-tail"><path d="M62 96 q22 4 26 20 q-14 -4 -20 -10 q-2 12 6 18 q-18 -4 -20 -22 Z" fill="' + f.hair2 + '" opacity=".95"/></g>'
      : f.kind === 'cat'
      ? '<g class="flins-pet-tail"><path d="M60 96 q26 2 26 -18 q0 -10 -8 -12 q8 8 2 16 q-6 8 -20 6 Z" fill="' + f.hair + '"/></g>'
      : '<g class="flins-pet-tail"><path d="M60 98 q24 6 22 20 q-12 2 -18 -6 Z" fill="' + f.accent + '" opacity=".9"/></g>';
    return '<svg viewBox="0 0 100 124" xmlns="http://www.w3.org/2000/svg">' + tail
      + '<path d="M24 52 q-6 30 6 44 q8 8 20 8 t20 -8 q12 -14 6 -44 q-6 -22 -26 -24 q-20 2 -26 24 Z" fill="' + f.hair2 + '"/>'
      + '<g class="flins-pet-body">'
      + '<path d="M38 84 q12 -6 24 0 l6 26 q-18 6 -36 0 Z" fill="' + f.skirt + '"/>'
      + '<path d="M42 86 q8 -4 16 0 l3 22 q-11 4 -22 0 Z" fill="' + f.apron + '"/>'
      + '<path d="M47 98 q4 -3 7 0 q-2 4 -7 3 q-3 -1 0 -3 Z" fill="' + f.accent + '" opacity=".85"/>'
      + '<rect x="43" y="110" width="6" height="7" rx="3" fill="#2A3350"/>'
      + '<rect x="51" y="110" width="6" height="7" rx="3" fill="#2A3350"/>'
      + '<path d="M45 86 l5 3 l5 -3 v5 l-5 -3 l-5 3 Z" fill="' + f.accent + '"/>'
      + '<ellipse cx="50" cy="56" rx="26" ry="25" fill="#FBE9DF"/>' + ear
      + '<path d="M24 52 q0 -24 26 -26 q26 2 26 26 q-6 -10 -14 -12 q-2 8 -8 10 q-2 -8 -8 -9 q-4 6 -10 6 q-6 0 -12 5 Z" fill="' + f.hair + '"/>'
      + '<path d="M52 27 q6 -14 18 -12 q-8 4 -10 14 Z" fill="' + f.hair + '"/>'
      + '<g class="flins-pet-eye">'
      + '<ellipse cx="40" cy="60" rx="6.4" ry="7.4" fill="' + f.eye + '"/>'
      + '<ellipse cx="60" cy="60" rx="6.4" ry="7.4" fill="' + f.eye + '"/>'
      + '<circle cx="42" cy="57.4" r="2.1" fill="#FFFFFF"/>'
      + '<circle cx="62" cy="57.4" r="2.1" fill="#FFFFFF"/>'
      + '</g>'
      + '<ellipse cx="31" cy="66" rx="4.6" ry="2.8" fill="#F7A8B8" opacity=".6"/>'
      + '<ellipse cx="69" cy="66" rx="4.6" ry="2.8" fill="#F7A8B8" opacity=".6"/>'
      + '<ellipse class="flins-pet-mouth" cx="50" cy="70" rx="2.4" ry="1.9" fill="#B4595F"/>'
      + '</g></svg>';
  }

  function riceSVG() {
    return '<svg viewBox="0 0 40 34" xmlns="http://www.w3.org/2000/svg">'
      + '<path d="M8 16 q12 -12 24 0 q2 2 0 4 q-12 7 -24 0 q-2 -2 0 -4 Z" fill="#FFFDF5"/>'
      + '<path d="M9 15 q11 -9 22 0" stroke="#EFE7D6" stroke-width="1" fill="none"/>'
      + '<path d="M5 20 q15 6 30 0 q-2 12 -15 12 q-13 0 -15 -12 Z" fill="#E8EEF8"/>'
      + '<path d="M5 20 q15 6 30 0" stroke="#B9C6DE" stroke-width="1.2" fill="none"/>'
      + '</svg>';
  }

  // 追加样式：偷窥 / 聊天框 / 表情选择
  const PET_CSS2 = [
    '.flins-pet[data-peek="1"]{overflow:hidden;border-radius:46px 46px 0 0}',
    '.flins-pet[data-peek="1"] .flins-pet-img{width:100%!important;height:auto!important;object-fit:initial!important;object-position:top center!important;display:block}',
    '.flins-pet[data-peek="1"] svg{height:auto!important;width:100%!important}',
        '.flins-pet-menu .sub{padding:2px 10px;font-size:11px;color:rgba(150,162,196,.8)}',
    '.flins-pet-menu .grid{display:grid;grid-template-columns:1fr 1fr;gap:2px}',
    '.flins-pet-menu .grid button{text-align:center;padding:5px 4px;font-size:11.5px}',    '.flins-pet-set{position:fixed;z-index:2147483001;left:50%;top:50%;transform:translate(-50%,-50%);width:420px;max-width:calc(100vw - 32px);padding:18px;border-radius:16px;background:rgba(13,19,44,.99);border:1px solid rgba(130,156,216,.35);box-shadow:0 30px 70px -30px rgba(0,0,0,.95)}',
    '.flins-pet-set-title{font:700 15px/1.3 var(--flins-font-body,system-ui);color:#EAF1FF;margin-bottom:6px}',
    '.flins-pet-set-tip{font:400 11.5px/1.5 var(--flins-font-body,system-ui);color:rgba(150,162,196,.9);margin:4px 0 8px}',
    '.flins-pet-set-row{margin-bottom:9px}',
    '.flins-pet-set-lab{font:600 12px/1.4 var(--flins-font-body,system-ui);color:#B9C6DE;margin-bottom:4px}',
    '.flins-pet-set-inp{width:100%;box-sizing:border-box;padding:7px 10px;border:1px solid rgba(130,156,216,.3);border-radius:8px;background:rgba(255,255,255,.05);color:#E6EBFB;font:500 12.5px/1.4 var(--flins-font-body,system-ui);outline:none}',
    '.flins-pet-set-inp:focus{border-color:rgba(126,232,244,.7)}',
    '.flins-pet-set-btns{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}',
    '.flins-pet-set-btns button{padding:7px 18px;border:0;border-radius:9px;cursor:pointer;font:600 12.5px/1 var(--flins-font-body,system-ui);background:#3E6FC4;color:#fff}',
    '.flins-pet-set-btns button.ghost{background:rgba(130,156,216,.18);color:#B9C6DE}',
    'html.flins-light .flins-pet-set{background:#fff;border-color:#ccd8ee}',
    'html.flins-light .flins-pet-set-title{color:#1c2540}',
    'html.flins-light .flins-pet-set-inp{background:#fff;color:#21252f;border-color:#ccd8ee}',
  ].join('');

  let petEl = null;
  let petBubble = null;
  let petMenuEl = null;
  let petSayTimer = null;
  let petHoldTimer = null;
  let petStrokeTimer = null;
  let petLastStroke = 0;
  let petPetCount = 0;
  let petMountTimer = null;
  let petMealTimer = null;
  let petChatBusy = false;

  function petMealTimes() {
    const raw = String(cfg.petMealTimes || '08:00,12:00,18:00').replace(/，/g, ',');
    const out = [];
    raw.split(',').forEach((part) => {
      const s = part.trim();
      if (!s) return;
      const seg = s.split(':');
      const hh = parseInt(seg[0], 10);
      const mm = parseInt(seg[1], 10);
      if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60) out.push((hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm);
    });
    return out.length ? out : ['08:00', '12:00', '18:00'];
  }
  function petMealWindow() { return Math.max(10, Math.min(180, Number(cfg.petMealWindow) || 45)); }

  function petPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function petToday() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /** 同 _meal_slot */
  function petMealSlot() {
    const now = new Date();
    const times = petMealTimes();
    for (let i = 0; i < times.length; i += 1) {
      const p = times[i].split(':');
      const start = new Date(now);
      start.setHours(+p[0], +p[1], 0, 0);
      if (Math.abs(now - start) <= petMealWindow() * 60000) return times[i];
    }
    return null;
  }

  /** 换表情（同 set_expr） */
  function petSetExpr(name, hold) {
    if (!petEl) return;
    if (cfg.petForm !== 'fish') return;      // SVG 形象没有分表情立绘
    const img = petEl.querySelector('img[data-expr]');
    if (!img) return;
    const key = PET_EXPR[name] ? name : 'sprite';
    img.src = PET_EXPR[key];
    img.setAttribute('data-expr', key);
    if (hold) {
      clearTimeout(petExprTimer);
      petExprTimer = setTimeout(() => {
        const im = petEl && petEl.querySelector('img[data-expr]');
        if (im) { im.src = PET_EXPR.sprite; im.setAttribute('data-expr', 'sprite'); }
      }, hold);
    }
  }
  let petExprTimer = null;

  /** 说话（同 say：没给表情就用 guess_expr 猜） */
  function petSay(text, hold, expr) {
    if (!petBubble || !petEl) return;
    const ex = expr || guessExpr(text);
    petSetExpr(ex);
    petBubble.textContent = text;
    petBubble.style.left = '-9999px';
    petBubble.style.top = '-9999px';
    petBubble.setAttribute('data-show', '1');
    const r = petEl.getBoundingClientRect();
    const bw = petBubble.offsetWidth || 160;
    const bh = petBubble.offsetHeight || 36;
    const cx = r.left + r.width / 2;
    let left = Math.round(cx - bw / 2);
    left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
    let top = Math.round(r.top - bh - 12);
    if (top < 8) top = Math.round(r.top + r.height + 12);
    petBubble.style.left = left + 'px';
    petBubble.style.top = top + 'px';
    petBubble.style.setProperty('--flins-arrow-x', Math.max(10, Math.min(bw - 24, Math.round(cx - left - 5))) + 'px');
    clearTimeout(petSayTimer);
    petSayTimer = setTimeout(() => {
      if (petBubble) petBubble.removeAttribute('data-show');
    }, hold || 2600);
  }

  function petFx(cls, ms) {
    if (!petEl) return;
    petEl.setAttribute(cls, '1');
    setTimeout(() => { if (petEl) petEl.removeAttribute(cls); }, ms);
  }

  function petApplyScale() {
    if (!petEl) return;
    const sc = cfg.petScale || 1;
    const SZ = { s: [96, 120], m: [120, 150], l: [152, 190] };
    const st = petStage();
    const base = SZ[st] || SZ.s;
    petEl.setAttribute('data-size', st);
    petEl.style.width = Math.round(base[0] * sc) + 'px';
    const peekH = Math.round(base[1] * sc * 0.62);   // 只留脑袋，约整身的 62%（能露出完整脸）
    petEl.style.height = (petEl.getAttribute('data-peek') === '1' ? peekH : Math.round(base[1] * sc)) + 'px';
  }

  /** 饱食度决定体型 */
  function petStage() {
    const v = cfg.petFed || 0;
    if (v >= 93) return 'l';
    if (v >= 75) return 'm';
    return 's';
  }

  // ── 聊天（同 ChatWorker） ──────────────────────────────────────────
  async function petChat(text) {
    if (!text) return;
    if (!cfg.petApiKey) { const l = petPick(NO_KEY_LINES); petSay(l[0], 5000, l[1]); return; }
    if (petChatBusy) return;
    petChatBusy = true;
    petSay('……让我想想。', 60000, 'speechless');
    try {
      const base = String(cfg.petApiBase || 'https://api.deepseek.com/chat/completions').trim();
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.petApiKey },
        body: JSON.stringify({
          model: cfg.petModel || 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: text },
          ],
          max_tokens: 200,
        }),
      });
      const data = await res.json();
      const reply = data && data.choices && data.choices[0] && data.choices[0].message
        ? String(data.choices[0].message.content || '').trim() : '';
      if (!reply) throw new Error((data && data.error && data.error.message) || '没有返回内容');
      petSay(reply.slice(0, 160), 9000);
    } catch (e) {
      petSay('脑袋卡住了：' + String(e.message || e).slice(0, 50), 6000, 'sad');
    } finally {
      petChatBusy = false;
    }
  }

  /** 设置对话框（字段照 SettingsDialog：Key / 模型 / 大小 / 饭点 / 窗口） */
  let petSetEl = null;
  function petOpenSettings() {
    if (petSetEl) { petSetEl.remove(); petSetEl = null; }
    addStyle(PET_CSS2, 'flins-pet-style-2');

    const field = (label, node, tip) => el('div', { class: 'flins-pet-set-row' }, [
      el('div', { class: 'flins-pet-set-lab', text: label }),
      node,
      tip ? el('div', { class: 'flins-pet-set-tip', text: tip }) : null,
    ].filter(Boolean));

    const keyInp = el('input', { type: 'password', class: 'flins-pet-set-inp', placeholder: 'sk-…', value: cfg.petApiKey || '' });
    const baseInp = el('input', { type: 'text', class: 'flins-pet-set-inp', value: cfg.petApiBase || 'https://api.deepseek.com/chat/completions' });
    const modelInp = el('input', { type: 'text', class: 'flins-pet-set-inp', value: cfg.petModel || 'deepseek-chat' });
    const scaleInp = el('input', { type: 'number', class: 'flins-pet-set-inp', min: '0.6', max: '2.2', step: '0.1', value: String(cfg.petScale || 1) });
    const mealInp = el('input', { type: 'text', class: 'flins-pet-set-inp', value: cfg.petMealTimes || '08:00,12:00,18:00' });
    const winInp = el('input', { type: 'number', class: 'flins-pet-set-inp', min: '10', max: '180', step: '5', value: String(cfg.petMealWindow || 45) });

    const save = () => {
      cfg.petApiKey = keyInp.value.trim();
      cfg.petApiBase = baseInp.value.trim() || 'https://api.deepseek.com/chat/completions';
      cfg.petModel = modelInp.value.trim() || 'deepseek-chat';
      cfg.petScale = Math.max(0.6, Math.min(2.2, Number(scaleInp.value) || 1));
      cfg.petMealTimes = mealInp.value.trim() || '08:00,12:00,18:00';
      cfg.petMealWindow = Math.max(10, Math.min(180, Number(winInp.value) || 45));
      store.write(cfg);
      petApplyScale();
      if (petSetEl) { petSetEl.remove(); petSetEl = null; }
      petSay('设置好啦。', 2200, 'happy');
    };

    const dlg = el('div', { class: 'flins-pet-set' }, [
      el('div', { class: 'flins-pet-set-title', text: '小深 · 设置' }),
      el('div', { class: 'flins-pet-set-tip', text: 'API Key 只保存在本机；接口地址填任意 OpenAI 兼容的 /chat/completions 即可（DeepSeek、OpenAI、Moonshot、SiliconFlow、本地 Ollama…）' }),
      field('API 地址', baseInp),
      field('API Key', keyInp),
      field('模型', modelInp, '例如 deepseek-chat / gpt-4o-mini / qwen-plus'),
      field('大小倍率', scaleInp),
      field('饭点', mealInp, '逗号分隔，例如 08:00,12:00,18:00'),
      field('饭点前后', winInp, '多少分钟内算饭点（10–180）'),
      el('div', { class: 'flins-pet-set-tip', text: '到饭点没人喂，她就会摆出饥饿表情；右键「喂饭」即可喂一碗大米饭。' }),
      el('div', { class: 'flins-pet-set-btns' }, [
        el('button', { type: 'button', class: 'ghost', text: '取消', onclick: () => { if (petSetEl) { petSetEl.remove(); petSetEl = null; } } }),
        el('button', { type: 'button', text: '保存', onclick: save }),
      ]),
    ]);
    document.body.appendChild(dlg);
    petSetEl = dlg;
    keyInp.focus();
  }

  /** 聊天：不再在头顶挂输入框，直接用 prompt 取输入（气泡只显示回复） */
  /** 聊天框（同 ChatBox）：贴在宠物旁边，回车发送，Esc 关闭 */
  let petChatEl = null;
  function petOpenChatBox() {
    if (!petEl) return;
    if (petChatEl) { const i = petChatEl.querySelector('input'); if (i) i.focus(); return; }
    const box = el('div', { class: 'flins-pet-chat' });
    const tip = el('div', { class: 'flins-pet-chat-tip', text: cfg.petApiKey ? '和她说点什么…' : '先右键「设置」填 API Key' });
    const inp = el('input', { type: 'text', placeholder: '回车发送，Esc 关闭' });
    inp.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        const v = inp.value.trim();
        inp.value = '';
        if (v) petChat(v);
      } else if (e.key === 'Escape') {
        box.remove();
        petChatEl = null;
      }
    });
    box.appendChild(tip);
    box.appendChild(inp);
    document.body.appendChild(box);
    const r = petEl.getBoundingClientRect();
    const bw = box.offsetWidth || 260;
    let left = r.left - bw - 12;
    if (left < 8) left = Math.min(window.innerWidth - bw - 8, r.right + 12);
    box.style.left = Math.max(8, left) + 'px';
    box.style.top = Math.max(8, r.top + 10) + 'px';
    petChatEl = box;
    inp.focus();
    setTimeout(() => { if (petChatEl === box && !inp.value) { box.remove(); petChatEl = null; } }, 15000);
  }

  function petOpenChat() {
    // 没填 Key 就说 NO_KEY_LINES，否则打开聊天框
    if (!cfg.petApiKey) { const l = petPick(NO_KEY_LINES); petSay(l[0], 5000, l[1]); return; }
    petOpenChatBox();
  }

  // ── 抚摸（同 _begin_petting / _stroke） ─────────────────────────────
  function petBeginPetting() {
    if (!petEl) return;
    petPetCount = 0;
    petLastStroke = 0;
    clearInterval(petStrokeTimer);
    petStrokeTimer = setInterval(() => {
      if (!petEl) { clearInterval(petStrokeTimer); return; }
      const now = Date.now();
      if (now - petLastStroke < 350) return;
      petLastStroke = now;
      petPetCount += 1;
      if (petPetCount >= 8) {
        clearInterval(petStrokeTimer);
        petSay('呼……睡着了，不许吵。', 5000, 'comfy');
        return;
      }
      const l = petPick(PETTING_LINES);
      petSay(l[0], 2800, l[1]);
      cfg.petLove = (cfg.petLove || 0) + 1;
      store.write(cfg);
      petFx('data-jump', 400);
    }, 120);
  }

  function petEndPetting() {
    clearTimeout(petHoldTimer);
    clearInterval(petStrokeTimer);
    petHoldTimer = null;
    petStrokeTimer = null;
  }

  // ── 喂饭（保留拖碗互动） ──────────────────────────────────────────
  function petFeed() {
    if (!petEl) return;
    const r = petEl.getBoundingClientRect();
    const bowl = document.createElement('div');
    bowl.className = 'flins-pet-rice';
    bowl.innerHTML = riceSVG();
    bowl.style.left = (r.left + r.width / 2 - 32) + 'px';
    bowl.style.top = (r.top + r.height * 0.52) + 'px';
    document.body.appendChild(bowl);
    requestAnimationFrame(() => bowl.setAttribute('data-fall', '1'));
    setTimeout(() => {
      bowl.removeAttribute('data-fall');
      bowl.style.opacity = '1';
      bowl.style.top = Math.min(window.innerHeight - 90, r.top + r.height + 16) + 'px';
      bowl.setAttribute('data-landed', '1');
      petSay('饭掉地上了…拖到我嘴边嘛。', 4200, 'hungry');
      petMakeRiceDraggable(bowl);
    }, 640);
  }

  function petMakeRiceDraggable(bowl) {
    let dragging = false;
    let offX = 0;
    let offY = 0;
    bowl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      bowl.setAttribute('data-drag', '1');
      const r = bowl.getBoundingClientRect();
      offX = e.clientX - r.left;
      offY = e.clientY - r.top;
      try { bowl.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
    });
    bowl.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      bowl.style.left = (e.clientX - offX) + 'px';
      bowl.style.top = (e.clientY - offY) + 'px';
      if (petEl) {
        const pr = petEl.getBoundingClientRect();
        const cx = e.clientX - offX + 32;
        const cy = e.clientY - offY + 28;
        const near = Math.hypot(cx - (pr.left + pr.width / 2), cy - (pr.top + pr.height * 0.55)) < 90;
        if (near) bowl.setAttribute('data-hint', '1'); else bowl.removeAttribute('data-hint');
      }
    });
    bowl.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      bowl.removeAttribute('data-drag');
      bowl.removeAttribute('data-hint');
      if (!petEl) return;
      const br = bowl.getBoundingClientRect();
      const pr = petEl.getBoundingClientRect();
      const dist = Math.hypot(
        (br.left + br.width / 2) - (pr.left + pr.width / 2),
        (br.top + br.height / 2) - (pr.top + pr.height * 0.55)
      );
      if (dist < 90) petEatRice(bowl);
      else petSay('拖到我嘴边才行…', 1800);
    });
  }

  function petEatRice(bowl) {
    bowl.setAttribute('data-eat', '1');
    petFx('data-chew', 1800);
    const l = petPick(FED_LINES);
    petSay(l[0], 6500, l[1]);          // 同 feed()：hold=6500
    cfg.petFed = Math.min(100, (cfg.petFed || 0) + 22);
    cfg.petLove = (cfg.petLove || 0) + 2;
    const slot = petMealSlot();
    if (slot) {
      cfg.petFedSlots = cfg.petFedSlots || {};
      cfg.petFedSlots[petToday()] = slot;
    }
    store.write(cfg);
    petPop('+22 饱食');
    petApplyScale();
    setTimeout(() => bowl.remove(), 700);
  }

  function petPop(text) {
    if (!petEl) return;
    const r = petEl.getBoundingClientRect();
    const p = el('div', { class: 'flins-pet-pop', text });
    p.style.left = (r.left + r.width / 2 - 14) + 'px';
    p.style.top = (r.top + 6) + 'px';
    document.body.appendChild(p);
    requestAnimationFrame(() => p.setAttribute('data-go', '1'));
    setTimeout(() => p.remove(), 1100);
  }

  // ── 右键菜单（同 contextMenuEvent） ───────────────────────────────
  function petCloseMenu() {
    if (petMenuEl) petMenuEl.removeAttribute('data-open');
  }

  function petOpenMenu(x, y) {
    if (!petMenuEl) return;
    petMenuEl.setAttribute('data-open', '1');
    const mw = petMenuEl.offsetWidth || 190;
    const mh = petMenuEl.offsetHeight || 240;
    petMenuEl.style.left = Math.min(x, window.innerWidth - mw - 8) + 'px';
    petMenuEl.style.top = Math.min(y, window.innerHeight - mh - 8) + 'px';
  }

  function petBuildMenu() {
    const exprBtns = PET_EXPR_LIST.map(([id, label]) =>
      el('button', { type: 'button', text: label, onclick: () => { petCloseMenu(); petSay(petPick(IDLE_LINES)[0] || '嗯。', 2600, id); } })
    );
    return el('div', { class: 'flins-pet-menu', 'data-open': '0' }, [
      el('div', { class: 'hint', text: '小深 · 右键菜单' }),
      el('button', { type: 'button', text: '💬 聊天', onclick: () => { petCloseMenu(); petOpenChat(); } }),
      el('button', { type: 'button', text: '🗣 说句话', onclick: () => { petCloseMenu(); const l = petPick(IDLE_LINES); petSay(l[0], 4200, l[1]); } }),
      el('button', { type: 'button', text: '🤚 摸摸', onclick: () => { petCloseMenu(); petBeginPetting(); setTimeout(petEndPetting, 2600); } }),
      el('button', { type: 'button', text: '🍚 喂饭', onclick: () => { petCloseMenu(); petFeed(); } }),
      el('div', { class: 'sep' }),
      el('div', { class: 'sub', text: '表情' }),
      el('div', { class: 'grid' }, exprBtns),
      el('div', { class: 'sep' }),
      el('div', { class: 'sub', text: '大小' }),
      el('div', { class: 'grid' }, [0.8, 1.0, 1.2, 1.5, 1.8].map((v) =>
        el('button', { type: 'button', text: v.toFixed(1), onclick: () => { petCloseMenu(); cfg.petScale = v; store.write(cfg); petApplyScale(); } })
      )),
      el('div', { class: 'sep' }),
      el('button', { type: 'button', text: '⚙ 设置', onclick: () => { petCloseMenu(); petOpenSettings(); } }),
      el('button', { type: 'button', text: '🫥 偷窥（贴底）', onclick: () => { petCloseMenu(); petEnterPeek(); } }),
      el('button', { type: 'button', text: '🙈 收起来', onclick: () => { petCloseMenu(); cfg.pet = false; commit(); } }),
    ]);
  }

  // ── 偷窥（同 enter_peek / exit_peek） ─────────────────────────────
  /** 进入偷窥：只露一个脑袋，并贴死底边（同 _dock_bottom / enter_peek） */
  function petEnterPeek() {
    if (!petEl) return;
    petEl.setAttribute('data-peek', '1');
    petApplyScale();
    const dock = () => {
      if (!petEl) return;
      // 用 bottom:0 锚定，比算 top 更稳（各种缩放/边框都不会差几像素）
      const r = petEl.getBoundingClientRect();
      petEl.style.left = Math.max(0, Math.min(window.innerWidth - r.width, r.left)) + 'px';
      petEl.style.right = 'auto';
      petEl.style.top = 'auto';
      petEl.style.bottom = '0px';
    };
    dock();
    requestAnimationFrame(dock);   // 图片/字体布局完成后再贴一次，避免差几像素
    cfg.petPeek = true;
    store.write(cfg);
    const l = petPick(PEEK_LINES);
    petSay(l[0], 4200, l[1]);
  }

  function petExitPeek(silent) {
    if (!petEl || petEl.getAttribute('data-peek') !== '1') return;
    petEl.removeAttribute('data-peek');
    petApplyScale();
    cfg.petPeek = false;
    store.write(cfg);
    if (!silent) { const l = petPick(PEEK_BYE_LINES); petSay(l[0], 2600, l[1]); }
  }

  // ── 挂载 ─────────────────────────────────────────────────────────
  /** 开机问候（同 _welcome，一次会话一次） */
  function petWelcome() {
    if (sessionStorage.getItem('flins-pet-welcomed')) return;
    sessionStorage.setItem('flins-pet-welcomed', '1');
    setTimeout(() => {
      petSay('哼，来了。主人，今天也要好好活着哦。', 6000, 'happy');
    }, 1600);
  }

  /** 随机搭话（同 _maybe_idle_chat） */
  let petIdleTimer = null;
  function petMaybeIdleChat() {
    clearInterval(petIdleTimer);
    petIdleTimer = setInterval(() => {
      if (!petEl) return;
      const b = document.querySelector('.flins-pet-bubble[data-show="1"]');
      if (b) return;
      if (Math.random() < 0.5) return;
      const l = petPick(IDLE_LINES);
      petSay(l[0], 4200, l[1]);
    }, 180000);
  }

  /** 夹在屏幕内（同 ensure_on_screen） */
  function petEnsureOnScreen() {
    if (!petEl) return;
    const r = petEl.getBoundingClientRect();
    const maxX = Math.max(0, window.innerWidth - r.width);
    const maxY = Math.max(0, window.innerHeight - r.height);
    let x = r.left;
    let y = r.top;
    if (x < 0 || x > maxX || y < 0 || y > maxY) {
      x = Math.max(0, Math.min(maxX, x));
      y = Math.max(0, Math.min(maxY, y));
      petEl.style.left = x + 'px';
      petEl.style.top = y + 'px';
      petEl.style.right = 'auto';
      petEl.style.bottom = 'auto';
    }
  }

  function petMount(force) {
    if (!document.body) {
      if (!petMountTimer) petMountTimer = setTimeout(() => { petMountTimer = null; petSync(); }, 200);
      return;
    }
    if (petEl && !document.contains(petEl)) petEl = null;
    if (petEl && !force) return;
    if (force && petEl) petEl.remove();
    addStyle(PET_CSS, PET_STYLE_ID);
    addStyle(PET_CSS2, 'flins-pet-style-2');

    if (!petMenuEl) petMenuEl = petBuildMenu();
    if (!document.contains(petMenuEl)) document.body.appendChild(petMenuEl);
    if (!petBubble) petBubble = el('div', { class: 'flins-pet-bubble' });
    if (!document.contains(petBubble)) document.body.appendChild(petBubble);

    petEl = el('div', { class: 'flins-pet', 'data-form': cfg.petForm });
    const pf = petForm(cfg.petForm);
    if (pf.type === 'expr') {
      petEl.innerHTML = '<img class="flins-pet-img" data-expr="sprite" src="' + PET_EXPR.sprite + '" alt="">';
    } else {
      petEl.innerHTML = petSVG(pf);
    }
    if (cfg.petPeek) petEl.setAttribute('data-peek', '1');
    document.body.appendChild(petEl);

    const pos = petRestorePos();
    if (pos) {
      petEl.style.left = pos.x + 'px';
      petEl.style.top = pos.y + 'px';
      petEl.style.right = 'auto';
      petEl.style.bottom = 'auto';
    }
    petApplyScale();

    // 拖动 / 抚摸 / 单击（同 mousePressEvent / mouseMoveEvent / mouseReleaseEvent）
    let dragging = false;
    let moved = false;
    let offX = 0;
    let offY = 0;
    let petting = false;
    petEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      petting = false;
      petEl.setAttribute('data-drag', '1');
      const r = petEl.getBoundingClientRect();
      offX = e.clientX - r.left;
      offY = e.clientY - r.top;
      try { petEl.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
      clearTimeout(petHoldTimer);
      petHoldTimer = setTimeout(() => {
        if (dragging && !moved) { petting = true; petBeginPetting(); }
      }, 350);
    });
    petEl.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      moved = true;
      const x = Math.max(0, Math.min(window.innerWidth - 40, e.clientX - offX));
      const y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - offY));
      petEl.style.left = x + 'px';
      petEl.style.top = y + 'px';
      petEl.style.right = 'auto';
      petEl.style.bottom = 'auto';
      petExitPeek(true);
    });
    petEl.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      petEl.removeAttribute('data-drag');
      petEndPetting();

      // 偷窥态：点一下恢复全身（原版：抓着脑袋往上拽或点一下都弹回）
      if (petEl.getAttribute('data-peek') === '1' && !moved) {
        petExitPeek();
        return;
      }
      if (!moved) {
        if (!petting) {
          const l = petPick(IDLE_LINES);
          petSay(l[0], 4200, l[1]);
          petFx('data-jump', 480);
        }
        return;
      }

      // 四向贴边吸附；贴到底边 → 只露一个脑袋
      const SNAP = 24;
      const r = petEl.getBoundingClientRect();
      const gapL = r.left;
      const gapR = window.innerWidth - (r.left + r.width);
      const gapT = r.top;
      const gapB = window.innerHeight - (r.top + r.height);
      const min = Math.min(gapL, gapR, gapT, gapB);
      if (min <= SNAP) {
        if (min === gapB) {
          petEnterPeek();
        } else if (min === gapL) {
          petEl.style.left = '0px';
        } else if (min === gapR) {
          petEl.style.left = (window.innerWidth - r.width) + 'px';
          petEl.style.right = 'auto';
        } else {
          petEl.style.top = '0px';
        }
      }
      petSavePos();
    });
    // 滚轮缩放（同 wheelEvent）
    petEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const step = e.deltaY > 0 ? -0.08 : 0.08;
      cfg.petScale = Math.max(0.6, Math.min(1.8, Math.round(((cfg.petScale || 1) + step) * 100) / 100));
      store.write(cfg);
      petApplyScale();
    }, { passive: false });
    // 双击聊天（同 mouseDoubleClickEvent）
    petEl.addEventListener('dblclick', (e) => { e.preventDefault(); petOpenChat(); });
    // 悬停：上浮 + 偶尔搭话（3 秒内不重复）
    let hoverSaid = 0;
    petEl.addEventListener('pointerenter', () => {
      petEl.setAttribute('data-hover', '1');
      if (Date.now() - hoverSaid < 3000) return;
      hoverSaid = Date.now();
      const l = petPick(IDLE_LINES);
      petSay(l[0], 3200, l[1]);
    });
    petEl.addEventListener('pointerleave', () => {
      petEl.removeAttribute('data-hover');
    });

    petEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      petOpenMenu(e.clientX, e.clientY);
    });
    petEl.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', petCloseMenu, true);

    setTimeout(() => { try { petCheckMeal(); } catch (err) { /* 忽略 */ } }, 2500);
    try { petWelcome(); petMaybeIdleChat(); petEnsureOnScreen(); } catch (err) { /* 忽略 */ }
    clearInterval(petMealTimer);
    petMealTimer = setInterval(() => { try { petCheckMeal(); } catch (err) { /* 忽略 */ } }, 60000);
  }

  /** 同 _check_meal */
  function petCheckMeal() {
    const slot = petMealSlot();
    const fed = cfg.petFedSlots || {};
    if (slot && fed[petToday()] !== slot) {
      const l = petPick(HUNGRY_LINES);
      petSay(l[0], 9000, l[1]);
    }
  }

  function petSavePos() {
    if (!petEl) return;
    const r = petEl.getBoundingClientRect();
    cfg.petX = Math.round(r.left);
    cfg.petY = Math.round(r.top);
    cfg.petPeek = petEl.getAttribute('data-peek') === '1';
    store.write(cfg);
  }

  function petRestorePos() {
    if (typeof cfg.petX !== 'number' || cfg.petX < 0) return null;
    return { x: cfg.petX, y: cfg.petY };
  }

  function petUnmount() {
    clearTimeout(petMountTimer);
    clearTimeout(petSayTimer);
    clearTimeout(petExprTimer);
    clearInterval(petMealTimer);
    petEndPetting();
    if (petEl) petEl.remove();
    if (petBubble) petBubble.remove();
    if (petMenuEl) petMenuEl.remove();
    // 饭碗是直接挂到 body 上的独立节点，不跟着 petEl 走；
    // 收宠物/关开关时必须单独清掉，否则地上一碗饭永远留着（issue #6）。
    document.querySelectorAll('.flins-pet-rice').forEach((n) => n.remove());
    document.querySelectorAll('.flins-pet-pop').forEach((n) => n.remove());
    if (petChatEl) { petChatEl.remove(); petChatEl = null; }
    if (petSetEl) { petSetEl.remove(); petSetEl = null; }
    petEl = null;
    petBubble = null;
    petMenuEl = null;
    document.removeEventListener('click', petCloseMenu, true);
  }

  function petSync() {
    if (cfg.pet) petMount();
    else petUnmount();
  }

  /** 饱食每小时 -3（保留原有衰减） */
  function petDecay() {
    const now = Date.now();
    const last = cfg.petAt || 0;
    if (!last) { cfg.petAt = now; store.write(cfg); return; }
    const hours = (now - last) / 3600000;
    if (hours < 1) return;
    cfg.petFed = Math.max(0, (cfg.petFed || 0) - Math.floor(hours) * 3);
    cfg.petAt = now;
    store.write(cfg);
    try { petApplyScale(); } catch (e) { /* 忽略 */ }
  }

  /** 面板「摸摸头」按钮用 */
  function petPet() {
    petBeginPetting();
    setTimeout(petEndPetting, 2600);
  }

  /** 面板切换形象时重建 */
  function petNextForm() {
    const i = PET_FORMS.findIndex((f) => f.id === cfg.petForm);
    cfg.petForm = PET_FORMS[(i + 1) % PET_FORMS.length].id;
    store.write(cfg);
    petMount(true);
    if (panelEl) rebuildPanel();
  }

  /** 旧名兼容：面板里传 true 的调用 */
  function petApplySize() {
    petApplyScale();
  }

  function commit() {
    store.write(cfg);
    apply();
    rebuildPanel();
  }

  function mountPanel() {
    if (fabEl || !document.body) return;
    addStyle(PANEL_CSS, PANEL_STYLE_ID);

    panelEl = el('div', {
      class: 'flins-panel', role: 'dialog', 'aria-label': '暗星主题设置', 'data-open': '0',
    });
    fabEl = el('button', {
      class: 'flins-fab', type: 'button', title: '暗星主题设置（点击展开）',
      'aria-label': '暗星主题设置', 'data-open': '0',
      html: EMBLEM_ICON,
      onclick: () => {
        const open = fabEl.dataset.open === '1' ? '0' : '1';
        fabEl.dataset.open = open;
        panelEl.dataset.open = open;
      },
    });

    document.body.appendChild(panelEl);
    document.body.appendChild(fabEl);
    if (fabEl) fabEl.dataset.img = cfg.fabImage ? '1' : '0';
    rebuildPanel();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && fabEl && fabEl.dataset.open === '1') {
        fabEl.dataset.open = '0';
        panelEl.dataset.open = '0';
      }
    });
  }

  
  
  
  
  
  
  function boot() {
    const steps = [
      
      () => addStyle(THEME_CSS, STYLE_ID),

      
      () => whenRoot(apply),

      
      () => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', mountPanel, { once: true });
        } else {
          mountPanel();
        }
      },

      
      () => {
        const ensure = () => {
          if (!document.getElementById(STYLE_ID)) addStyle(THEME_CSS, STYLE_ID);
          if (!document.documentElement) return;
          const cl = document.documentElement.classList;
          if (!cl.contains('flins-dark') && !cl.contains('flins-light')) apply();
          if (!document.body) return;
          if (!fabEl || !document.body.contains(fabEl)) {
            fabEl = null; panelEl = null;
            mountPanel();
          }
          schedulePatch();
        };
        try { new MutationObserver(ensure).observe(document, { childList: true, subtree: true }); } catch (e) {   }
        setInterval(ensure, 2500);
        
        
        
        
        let fast = 0;
        const fastTimer = setInterval(() => {
          schedulePatch();
          fast += 1;
          if (fast >= 25) clearInterval(fastTimer);   
        }, 1200);
        setInterval(schedulePatch, 6000);
      },

      
      () => {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          if (cfg.mode === 'auto') apply();
        });
      },

      
      () => {
        if (typeof GM_registerMenuCommand !== 'function') return;
        GM_registerMenuCommand('打开暗星主题设置', () => {
          const f = document.querySelector('.flins-fab');
          if (f) f.click();
        });
        GM_registerMenuCommand('切换深色 / 浅色', () => {
          cfg.mode = resolveMode() === 'dark' ? 'light' : 'dark';
          commit();
        });
        GM_registerMenuCommand('恢复默认设置', () => {
          cfg = Object.assign({}, DEFAULTS);
          commit();
        });
      },
    ];

    for (const step of steps) {
      try { step(); } catch (e) {
        try { console.warn('[flins-theme] 初始化步骤失败：', e); } catch (e2) {   }
      }
    }
  }

  boot();
})();
