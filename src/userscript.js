// ==UserScript==
// @name         洛谷 · 暗星
// @namespace    https://github.com/liumingyangrd/luogu_dark_star
// @homepageURL  https://github.com/liumingyangrd/luogu_dark_star
// @updateURL    https://raw.githubusercontent.com/liumingyangrd/luogu_dark_star/main/dist/flins.user.js
// @downloadURL  https://raw.githubusercontent.com/liumingyangrd/luogu_dark_star/main/dist/flins.user.js
// @version      1.6.0
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
    petForm: 'maid',        
    petFed: 70,              
    petLove: 0,              
    petX: -1,                
    petY: -1,                
    petAt: 0,                     
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
    return el('div', { class: 'flins-seg' }, options.map((o) => el('button', {
      type: 'button',
      'aria-pressed': String(current === o.value),
      text: o.label,
      onclick: () => onPick(o.value),
    })));
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
      el('p', { class: 'flins-note', text: '右键宠物可以「喂大白饭」（米饭会从天上掉下来）、摸摸头、聊两句、换形象。饱食度每小时 -3，饿了她会自己说话。' }),
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
    'cursor:grab;touch-action:none;user-select:none;filter:drop-shadow(0 14px 26px rgba(0,0,0,.5));',
    'transition:transform .18s ease,opacity .2s ease}',
    '.flins-pet[data-drag="1"]{cursor:grabbing;transition:none}',
    '.flins-pet svg{display:block;width:100%;height:100%;overflow:visible}',
    '.flins-pet-img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;',
    'filter:drop-shadow(0 6px 14px rgba(0,0,0,.45))}',
    '.flins-pet:hover{transform:translateY(-3px)}',
    '.flins-pet[data-hidden="1"]{opacity:0;pointer-events:none}',
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
    '.flins-pet-bubble::after{content:"";position:absolute;left:18px;bottom:-6px;width:10px;height:10px;',
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

    '.flins-pet-rice{position:fixed;z-index:2147482999;width:34px;height:30px;pointer-events:none;opacity:0}',
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
  ].join('');

  const PET_IMAGES = {
    maid: "data:image/webp;base64,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",
  };

  const PET_FORMS = [
    { id: 'maid', name: '鲸鱼娘', type: 'img', src: 'maid' },
    { id: 'whale', name: '蓝鲸', hair: '#3E6FC4', hair2: '#9CC6EC', skirt: '#20294C', apron: '#F2F6FF', eye: '#2C4E8A', accent: '#7FD4F0', kind: 'whale' },
    { id: 'cat', name: '白猫', hair: '#E6EBF6', hair2: '#B9C6DE', skirt: '#2A3350', apron: '#FFFFFF', eye: '#4A5A7E', accent: '#F0A8C0', kind: 'cat' },
    { id: 'oni', name: '小妖', hair: '#33284A', hair2: '#6A5390', skirt: '#1A1424', apron: '#EDE6F6', eye: '#7B4FA8', accent: '#C77FE0', kind: 'oni' },
  ];

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

    return '<svg viewBox="0 0 100 124" xmlns="http://www.w3.org/2000/svg">'
      + tail
      + '<path d="M24 52 q-6 30 6 44 q8 8 20 8 t20 -8 q12 -14 6 -44 q-6 -22 -26 -24 q-20 2 -26 24 Z" fill="' + f.hair2 + '"/>'
      + '<g class="flins-pet-body">'
      + '<path d="M38 84 q12 -6 24 0 l6 26 q-18 6 -36 0 Z" fill="' + f.skirt + '"/>'
      + '<path d="M42 86 q8 -4 16 0 l3 22 q-11 4 -22 0 Z" fill="' + f.apron + '"/>'
      + '<path d="M47 98 q4 -3 7 0 q-2 4 -7 3 q-3 -1 0 -3 Z" fill="' + f.accent + '" opacity=".85"/>'
      + '<rect x="43" y="110" width="6" height="7" rx="3" fill="#2A3350"/>'
      + '<rect x="51" y="110" width="6" height="7" rx="3" fill="#2A3350"/>'
      + '<path d="M45 86 l5 3 l5 -3 v5 l-5 -3 l-5 3 Z" fill="' + f.accent + '"/>'
      + '<ellipse cx="50" cy="56" rx="26" ry="25" fill="#FBE9DF"/>'
      + ear
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

  const PET_LINES = {
    idle: ['在呢，怎么啦？', '刷题累了吧，歇一会。', '今天的题做完了吗？', '要不要摸摸头？', '别盯屏幕太久，眨眨眼。'],
    feed: ['好吃！', '谢谢你～', '再来一碗？', '米饭万岁！', '唔……好饱。'],
    pat: ['嘿嘿…', '唔，好舒服。', '再摸摸嘛。', '哼哼～', '别、别摸太久。'],
    hungry: ['肚子有点饿……', '可以喂我一碗饭吗？', '右键我，有「喂大白饭」。'],
  };

  let petEl = null;
  let petBubble = null;
  let petMenuEl = null;
  let petSayTimer = null;

  function petPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function petSay(text, ms) {
    if (!petBubble || !petEl) return;
    petBubble.textContent = text;
    const r = petEl.getBoundingClientRect();
    petBubble.style.left = Math.max(8, r.left - 40) + 'px';
    petBubble.style.top = Math.max(8, r.top - 44) + 'px';
    petBubble.setAttribute('data-show', '1');
    clearTimeout(petSayTimer);
    petSayTimer = setTimeout(() => {
      if (petBubble) petBubble.removeAttribute('data-show');
    }, ms || 2600);
  }

  function petFx(cls, ms) {
    if (!petEl) return;
    petEl.setAttribute(cls, '1');
    setTimeout(() => { if (petEl) petEl.removeAttribute(cls); }, ms);
  }

  function petPop(text) {
    if (!petEl) return;
    const r = petEl.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'flins-pet-pop';
    p.textContent = text;
    p.style.left = (r.left + r.width / 2 - 14) + 'px';
    p.style.top = (r.top + 6) + 'px';
    document.body.appendChild(p);
    requestAnimationFrame(() => p.setAttribute('data-go', '1'));
    setTimeout(() => p.remove(), 1100);
  }

  /** 喂饭：一碗米饭从天上掉下来，落到嘴边 → 被吃掉 → 加饱食度 */
  function petFeed() {
    if (!petEl) return;
    const r = petEl.getBoundingClientRect();
    const bowl = document.createElement('div');
    bowl.className = 'flins-pet-rice';
    bowl.innerHTML = riceSVG();
    bowl.style.left = (r.left + r.width / 2 - 17) + 'px';
    bowl.style.top = (r.top + r.height * 0.52) + 'px';
    document.body.appendChild(bowl);
    requestAnimationFrame(() => bowl.setAttribute('data-fall', '1'));

    setTimeout(() => {
      bowl.setAttribute('data-eat', '1');
      petFx('data-chew', 1800);
      petSay(petPick(PET_LINES.feed), 2200);
      // 米粒四溅
      for (let i = 0; i < 7; i += 1) {
        const g = document.createElement('div');
        g.className = 'flins-pet-grain';
        g.style.left = (r.left + r.width / 2) + 'px';
        g.style.top = (r.top + r.height * 0.55) + 'px';
        g.style.setProperty('--gx', (Math.random() * 70 - 35).toFixed(0) + 'px');
        g.style.setProperty('--gy', (-20 - Math.random() * 34).toFixed(0) + 'px');
        document.body.appendChild(g);
        requestAnimationFrame(() => g.setAttribute('data-go', '1'));
        setTimeout(() => g.remove(), 700);
      }
      cfg.petFed = Math.min(100, (cfg.petFed || 0) + 22);
      cfg.petLove = (cfg.petLove || 0) + 2;
      store.write(cfg);
      petPop('+22 饱食');
    }, 640);

    setTimeout(() => bowl.remove(), 1200);
  }

  function petCloseMenu() {
    if (petMenuEl) petMenuEl.removeAttribute('data-open');
  }

  function petOpenMenu(x, y) {
    if (!petMenuEl) return;
    petMenuEl.setAttribute('data-open', '1');
    const mw = petMenuEl.offsetWidth || 160;
    const mh = petMenuEl.offsetHeight || 200;
    petMenuEl.style.left = Math.min(x, window.innerWidth - mw - 8) + 'px';
    petMenuEl.style.top = Math.min(y, window.innerHeight - mh - 8) + 'px';
    const hint = petMenuEl.querySelector('.hint');
    if (hint) hint.textContent = '饱食 ' + (cfg.petFed || 0) + ' · 好感 ' + (cfg.petLove || 0);
  }

  function petPet() {
    petFx('data-jump', 520);
    petSay(petPick(PET_LINES.pat), 2200);
    cfg.petLove = (cfg.petLove || 0) + 1;
    store.write(cfg);
    petPop('+1 好感');
  }

  function petNextForm() {
    const i = PET_FORMS.findIndex((f) => f.id === cfg.petForm);
    cfg.petForm = PET_FORMS[(i + 1) % PET_FORMS.length].id;
    store.write(cfg);
    petMount(true);
    petSay('换成' + petForm(cfg.petForm).name + '啦', 2000);
    if (panelEl) rebuildPanel();
  }

  function petSavePos() {
    if (!petEl) return;
    const r = petEl.getBoundingClientRect();
    cfg.petX = Math.round(r.left);
    cfg.petY = Math.round(r.top);
    store.write(cfg);
  }

  function petMount(force) {
    if (!document.body) return;
    if (petEl && !force) return;
    if (force && petEl) petEl.remove();
    addStyle(PET_CSS, PET_STYLE_ID);

    if (!petMenuEl) {
      petMenuEl = el('div', { class: 'flins-pet-menu', 'data-open': '0' }, [
        el('div', { class: 'hint', text: '饱食 · 好感' }),
        el('button', { type: 'button', text: '🍚 喂大白饭', onclick: () => { petCloseMenu(); petFeed(); } }),
        el('button', { type: 'button', text: '✋ 摸摸头', onclick: () => { petCloseMenu(); petPet(); } }),
        el('button', { type: 'button', text: '💬 聊两句', onclick: () => { petCloseMenu(); petSay(petPick(PET_LINES.idle), 2600); } }),
        el('div', { class: 'sep' }),
        el('button', { type: 'button', text: '🔄 换个形象', onclick: () => { petCloseMenu(); petNextForm(); } }),
        el('button', { type: 'button', text: '🙈 收起来', onclick: () => { petCloseMenu(); cfg.pet = false; commit(); } }),
      ]);
      document.body.appendChild(petMenuEl);
    }
    if (!petBubble) {
      petBubble = el('div', { class: 'flins-pet-bubble' });
      document.body.appendChild(petBubble);
    }

    petEl = el('div', { class: 'flins-pet', 'data-form': cfg.petForm });
    const pf0 = petForm(cfg.petForm);
    if (pf0.type === 'img' && PET_IMAGES[pf0.src]) {
      petEl.innerHTML = '<img class="flins-pet-img" src="' + PET_IMAGES[pf0.src] + '" alt="">';
    } else {
      petEl.innerHTML = petSVG(pf0);
    }
    if (typeof cfg.petX === 'number' && cfg.petX >= 0) {
      petEl.style.left = cfg.petX + 'px';
      petEl.style.top = cfg.petY + 'px';
      petEl.style.right = 'auto';
      petEl.style.bottom = 'auto';
    }
    document.body.appendChild(petEl);

    // 拖拽
    let dragging = false;
    let moved = false;
    let offX = 0;
    let offY = 0;
    petEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      petEl.setAttribute('data-drag', '1');
      const r = petEl.getBoundingClientRect();
      offX = e.clientX - r.left;
      offY = e.clientY - r.top;
      petEl.setPointerCapture(e.pointerId);
    });
    petEl.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      moved = true;
      const x = Math.min(window.innerWidth - 40, Math.max(0, e.clientX - offX));
      const y = Math.min(window.innerHeight - 60, Math.max(0, e.clientY - offY));
      petEl.style.left = x + 'px';
      petEl.style.top = y + 'px';
      petEl.style.right = 'auto';
      petEl.style.bottom = 'auto';
    });
    petEl.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      petEl.removeAttribute('data-drag');
      if (moved) petSavePos();
      else petPet();
    });
    petEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      petOpenMenu(e.clientX, e.clientY);
    });
    petEl.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('click', petCloseMenu, true);

    // 饿了主动说话
    setTimeout(() => {
      if (!petEl) return;
      if ((cfg.petFed || 0) < 30) petSay(petPick(PET_LINES.hungry), 3200);
    }, 4000);
  }

  function petUnmount() {
    if (petEl) petEl.remove();
    if (petBubble) petBubble.remove();
    if (petMenuEl) petMenuEl.remove();
    petEl = null;
    petBubble = null;
    petMenuEl = null;
    document.removeEventListener('click', petCloseMenu, true);
  }

  function petSync() {
    if (cfg.pet) petMount();
    else petUnmount();
  }

  /** 饱食度随时间下降：每小时 -3，最低 0 */
  function petDecay() {
    const now = Date.now();
    const last = cfg.petAt || 0;
    if (!last) { cfg.petAt = now; store.write(cfg); return; }
    const hours = (now - last) / 3600000;
    if (hours < 1) return;
    const drop = Math.floor(hours) * 3;
    cfg.petFed = Math.max(0, (cfg.petFed || 0) - drop);
    cfg.petAt = now;
    store.write(cfg);
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
