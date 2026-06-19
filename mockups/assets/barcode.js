/* ============================================================
   WMS MOCKUPS — SHARED BARCODE + LABEL RENDERER
   Dependency-free, no build step, file:// safe.
   - barcodeSVG(value, opts)  -> Code 128 (subset B) as inline SVG string
   - labelHTML({...})          -> a printable label card (barcode + human text)
   - printLabels(htmlArr, ttl) -> opens a print window with a label sheet
   Code 128B encodes any printable ASCII (covers LOC-/LPN-/ASN-/OUT- ids,
   structured codes and EAN/GS1 numeric values). Real scannable symbology so
   the PWA scanner screens have something genuine to read.
   ============================================================ */
(function () {
  // Canonical Code 128 element-width patterns (value 0..106; 106 = stop).
  const PATTERNS = [
    "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
    "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
    "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
    "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
    "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
    "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
    "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
    "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
    "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
    "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
    "114131","311141","411131","211412","211214","211232","2331112"
  ];
  const START_B = 104, STOP = 106;

  function encodeB(text){
    const codes = [START_B];
    for (let i = 0; i < text.length; i++){
      let c = text.charCodeAt(i);
      if (c < 32 || c > 126) c = 63;          // '?' for anything outside subset B
      codes.push(c - 32);
    }
    let sum = codes[0];
    for (let i = 1; i < codes.length; i++) sum += codes[i] * i;   // weighted checksum
    codes.push(sum % 103);
    codes.push(STOP);
    return codes;
  }

  const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // Build a Code 128 barcode as an inline SVG string.
  function barcodeSVG(value, opts){
    const o = Object.assign({ height:46, module:1.7, showText:true, font:11, quiet:10, color:'#111' }, opts||{});
    const codes = encodeB(String(value==null?'':value));
    // total modules across all symbols
    let totalMods = 0;
    codes.forEach(c => { for (const d of PATTERNS[c]) totalMods += +d; });
    const w = totalMods * o.module + o.quiet * 2;
    const textH = o.showText ? o.font + 6 : 0;
    const h = o.height + textH;

    let x = o.quiet, bars = '';
    codes.forEach(c => {
      const pat = PATTERNS[c];
      for (let i = 0; i < pat.length; i++){
        const wd = (+pat[i]) * o.module;
        if (i % 2 === 0) bars += `<rect x="${x.toFixed(2)}" y="0" width="${wd.toFixed(2)}" height="${o.height}"/>`;
        x += wd;
      }
    });
    const txt = o.showText
      ? `<text x="${(w/2).toFixed(2)}" y="${o.height + o.font}" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="${o.font}" fill="${o.color}" letter-spacing="1">${esc(value)}</text>`
      : '';
    return `<svg class="bc" viewBox="0 0 ${w.toFixed(2)} ${h}" width="${w.toFixed(2)}" height="${h}" `
      + `xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="barcode ${esc(value)}">`
      + `<rect x="0" y="0" width="${w.toFixed(2)}" height="${h}" fill="#fff"/>`
      + `<g fill="${o.color}">${bars}</g>${txt}</svg>`;
  }

  // A printable label card: title strip, barcode of `code`, and human-readable lines.
  // { title, code, lines:[ 'text' | {k,v} ], barcodeOpts }
  function labelHTML(spec){
    const s = spec || {};
    const lines = (s.lines || []).map(l =>
      typeof l === 'object'
        ? `<div class="ll"><span class="lk">${esc(l.k)}</span><span class="lv">${esc(l.v)}</span></div>`
        : `<div class="lt">${esc(l)}</div>`).join('');
    return `<div class="label">
      ${s.title ? `<div class="label-h">${esc(s.title)}</div>` : ''}
      <div class="label-bc">${barcodeSVG(s.code, Object.assign({height:42, module:1.6, font:11}, s.barcodeOpts||{}))}</div>
      <div class="label-b">${lines}</div>
    </div>`;
  }

  // Shared label-sheet CSS (used by the print window AND any in-page preview that opts in).
  const LABEL_CSS = `
    .label{ width:62mm; border:1px solid #bbb; border-radius:4px; padding:8px 10px; margin:6px;
      display:inline-block; vertical-align:top; box-sizing:border-box; font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#111; }
    .label-h{ font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#444; margin-bottom:6px; }
    .label-bc{ text-align:center; }
    .label-bc svg{ max-width:100%; height:auto; }
    .label-b{ margin-top:4px; }
    .label .lt{ font-family:ui-monospace,Menlo,Consolas,monospace; font-weight:700; font-size:13px; }
    .label .ll{ display:flex; justify-content:space-between; gap:8px; font-size:11px; }
    .label .lk{ color:#777; text-transform:uppercase; letter-spacing:.03em; }
    .label .lv{ font-weight:600; text-align:right; }
    @media print{ @page{ margin:8mm; } .label{ break-inside:avoid; } }`;

  // Open a print window containing one or more label cards and trigger Print.
  function printLabels(htmlArr, title){
    const arr = Array.isArray(htmlArr) ? htmlArr : [htmlArr];
    const w = window.open('', '_blank', 'width=760,height=820');
    if (!w){ alert('Pop-up blocked — allow pop-ups to print labels.'); return; }
    w.document.open();
    w.document.write(`<!doctype html><html><head><meta charset="utf-8">`
      + `<title>${esc(title||'Labels')}</title><style>body{margin:10px;background:#fff}${LABEL_CSS}</style></head>`
      + `<body>${arr.join('')}</body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => { try { w.print(); } catch(e){} }, 300);
  }

  window.barcodeSVG  = barcodeSVG;
  window.labelHTML   = labelHTML;
  window.printLabels = printLabels;
  window.BARCODE_LABEL_CSS = LABEL_CSS;
})();
