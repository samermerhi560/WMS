/* ============================================================
   WMS MOCKUPS — PWA SCAN ENGINE  (assets/pwa-scan.js)
   Shared scan control for every PWA flow. No build, file://-aware.
   Three input modes on every field:
     ⌨  Manual  — always-visible input (also catches keyboard-wedge
                  hardware scanners, which "type" the code + Enter).
     📷 Camera  — native BarcodeDetector over a getUserMedia stream.
                  Secure-context only (http://localhost or https);
                  on file:// it falls back to manual/list automatically.
     📋 List    — pick from a supplied candidate list.
   On capture it runs resolveScan(code) (data.js) and calls the
   field's onScan(code, resolved). Camera/permission errors surface
   inline; all DOMAIN messaging (found / wrong-type / not-found) is
   left to the screen via onScan, so the engine stays generic.

   API:  PWAScan.cameraSupported()                              -> bool
         PWAScan.field({id, prompt, hint, placeholder,
                        list:[{value,label,sub}], onScan, autofocus}) -> HTML string
         PWAScan.openCamera({onDetect, onCancel, onError, title})
   ============================================================ */
(function(){
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const _fields = {};            // id -> opts (registered by field())
  let _seq = 0;

  // A decoder is always available: the native BarcodeDetector where present (Android/ChromeOS/macOS
  // Chrome), else the vendored ZXing reader (lazy-loaded on first use — covers desktop Chrome/Edge on
  // Windows, which ship no BarcodeDetector). So the only hard blockers are a non-secure context
  // (file://) or a browser with no camera API at all.
  function cameraSupported(){
    return !!window.isSecureContext
        && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  // The SPECIFIC reason the camera is unavailable (so the fallback message is accurate, not a guess).
  function cameraUnsupportedReason(){
    if (!window.isSecureContext)
      return 'Open the app at http://localhost:8765 (not a file:// path) — the camera needs a secure context.';
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia))
      return 'This browser exposes no camera API. Type the code or use List.';
    return '';
  }

  // Build an inline scan control. Registers opts under id for the delegated handlers.
  function field(opts){
    opts = opts || {};
    const id = opts.id || ('sf-' + (++_seq));
    _fields[id] = opts;
    const hasList = !!(opts.list && opts.list.length);
    const listBtn = hasList ? `<button type="button" class="sb-list-btn">📋 List</button>` : '';
    const listHtml = hasList
      ? `<div class="sb-list" hidden>${opts.list.map(o =>
          `<button type="button" class="sb-pick" data-v="${esc(o.value)}"><b>${esc(o.label)}</b>${
            o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}</div>`
      : '';
    return `<div class="scan-field" data-sf="${esc(id)}">
      <div class="scan-box">
        <div class="ico">▯▭▯</div>
        <div class="sb-prompt">${esc(opts.prompt || 'Scan a code')}</div>
        <div class="sb-input-row">
          <input class="sb-input" type="text" inputmode="text" autocomplete="off" autocapitalize="characters"
                 autocorrect="off" spellcheck="false" placeholder="${esc(opts.placeholder || '')}" ${opts.autofocus ? 'autofocus' : ''}>
          <button type="button" class="sb-go">OK</button>
        </div>
        <div class="sb-actions">
          <button type="button" class="sb-cam">📷 Camera</button>
          ${listBtn}
        </div>
        ${listHtml}
        <div class="sb-msg" hidden></div>
      </div>
      ${opts.hint ? `<div class="scan-hint">${esc(opts.hint)}</div>` : ''}
    </div>`;
  }

  function capture(fieldEl, code){
    const opts = _fields[fieldEl.getAttribute('data-sf')];
    const c = String(code==null?'':code).trim();
    if (!c || !opts) return;
    const resolved = (typeof resolveScan === 'function') ? resolveScan(c) : null;
    if (typeof opts.onScan === 'function') opts.onScan(c, resolved);
  }
  function msg(fieldEl, text){
    const m = fieldEl.querySelector('.sb-msg'); if (!m) return;
    m.textContent = text || ''; m.hidden = !text;
  }

  /* ---- delegated wiring (one set of listeners; survives the shell body-rebuild
          and any screen re-render that re-injects a field) ---- */
  document.addEventListener('click', e => {
    const f = e.target.closest('.scan-field'); if (!f) return;
    if (e.target.closest('.sb-go')){
      capture(f, f.querySelector('.sb-input').value);
    } else if (e.target.closest('.sb-cam')){
      if (!cameraSupported()){
        msg(f, cameraUnsupportedReason());
        const inp = f.querySelector('.sb-input'); if (inp) inp.focus();
        return;
      }
      msg(f, '');
      const opts = _fields[f.getAttribute('data-sf')] || {};
      openCamera({ title: opts.prompt || 'Scan',
        onDetect: v => { const inp = f.querySelector('.sb-input'); if (inp) inp.value = v; capture(f, v); },
        onError: txt => msg(f, txt) });
    } else if (e.target.closest('.sb-list-btn')){
      const list = f.querySelector('.sb-list'); if (list) list.hidden = !list.hidden;
    } else if (e.target.closest('.sb-pick')){
      capture(f, e.target.closest('.sb-pick').getAttribute('data-v'));
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const inp = e.target.closest && e.target.closest('.sb-input'); if (!inp) return;
    e.preventDefault();
    const f = inp.closest('.scan-field'); if (f) capture(f, inp.value);
  });

  /* ---- live camera overlay ---- */
  const FORMATS = ['code_128','ean_13','ean_8','upc_a','upc_e','code_39','codabar','itf','qr_code','data_matrix'];
  const ZXING_SRC = 'assets/vendor/zxing-library-0.18.6.min.js';
  let _zxingLoad = null;
  // Lazy-load the vendored ZXing UMD — only when a non-native browser actually opens the camera
  // (so the ~290 KB isn't paid on browsers that have the native API, or when scanning manually).
  function ensureZXing(){
    if (window.ZXing && window.ZXing.BrowserMultiFormatReader) return Promise.resolve(true);
    if (_zxingLoad) return _zxingLoad;
    _zxingLoad = new Promise(resolve => {
      const s = document.createElement('script'); s.src = ZXING_SRC;
      s.onload  = () => resolve(!!(window.ZXing && window.ZXing.BrowserMultiFormatReader));
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
    return _zxingLoad;
  }
  const camErrText = err =>
      (err && err.name === 'NotAllowedError') ? 'Camera permission denied. Type the code instead.'
    : (err && err.name === 'NotFoundError')   ? 'No camera found. Type the code instead.'
    :                                            'Camera unavailable. Type the code instead.';

  // Open the scanner. Native BarcodeDetector where present; else the vendored ZXing reader.
  // Same overlay + behaviour either way; on capture it calls o.onDetect(rawValue).
  function openCamera(o){
    o = o || {};
    const native = ('BarcodeDetector' in window);
    (native ? Promise.resolve(true) : ensureZXing()).then(decoderOk => {
      if (!decoderOk){ o.onError && o.onError('Could not load the camera scanner (assets/vendor ZXing missing).'); return; }
      launchCamera(o, native);
    });
  }

  function launchCamera(o, native){
    const ov = document.createElement('div'); ov.className = 'scan-cam';
    ov.innerHTML = `<div class="sc-card">
        <video class="sc-video" playsinline muted autoplay></video>
        <div class="sc-reticle"></div>
        <div class="sc-bar"><span class="sc-title">${esc(o.title || 'Scan')}</span>
          <button type="button" class="sc-x">Cancel</button></div>
        <div class="sc-msg"></div>
      </div>`;
    document.body.appendChild(ov);
    const video = ov.querySelector('.sc-video');
    const scMsg = ov.querySelector('.sc-msg');
    let stream = null, timer = null, stopped = false, detector = null, zx = null;

    function stop(){
      stopped = true;
      if (timer) clearTimeout(timer);
      if (zx){ try { zx.reset(); } catch(_){} }                       // ZXing stops its own stream
      if (stream) stream.getTracks().forEach(t => { try { t.stop(); } catch(_){} });
      if (ov.parentNode) ov.remove();
    }
    function fail(err){ scMsg.textContent = camErrText(err); setTimeout(() => { stop(); o.onError && o.onError(camErrText(err)); }, 1800); }
    ov.querySelector('.sc-x').addEventListener('click', () => { stop(); o.onCancel && o.onCancel(); });
    ov.addEventListener('click', e => { if (e.target === ov){ stop(); o.onCancel && o.onCancel(); } });

    if (native){
      (async () => {
        try {
          try { detector = new BarcodeDetector({ formats: FORMATS }); }
          catch(_){ detector = new BarcodeDetector(); }               // some builds reject the formats list
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
          video.srcObject = stream; await video.play().catch(() => {});
          const tick = async () => {
            if (stopped) return;
            try {
              const found = await detector.detect(video);
              if (found && found.length && found[0].rawValue){ const v = found[0].rawValue; stop(); o.onDetect && o.onDetect(v); return; }
            } catch(_){ /* transient decode hiccup — keep scanning */ }
            timer = setTimeout(tick, 130);
          };
          timer = setTimeout(tick, 300);                              // let the stream warm up first
        } catch(err){ fail(err); }
      })();
    } else {
      // ZXing manages getUserMedia + continuous decode internally; null device = default camera.
      // Restrict to the symbologies the WMS actually prints (Code 128 + EAN) + QR, and scan more
      // often than ZXing's 500 ms default — both cut the webcam decode lag markedly.
      try {
        const Z = window.ZXing, hints = new Map();
        try { hints.set(Z.DecodeHintType.POSSIBLE_FORMATS,
          [Z.BarcodeFormat.CODE_128, Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.QR_CODE]); } catch(_){}
        zx = new Z.BrowserMultiFormatReader(hints, 150);
        const p = zx.decodeFromVideoDevice(null, video, (result) => {
          if (stopped || !result) return;
          const v = result.getText(); stop(); o.onDetect && o.onDetect(v);
        });
        if (p && p.catch) p.catch(fail);
      } catch(err){ fail(err); }
    }
  }

  window.PWAScan = { cameraSupported, field, openCamera };
})();
