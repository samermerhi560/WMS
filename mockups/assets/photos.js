/* ============================================================
   WMS MOCKUPS — SHARED PHOTO-UPLOAD / JUSTIFICATION WIDGET
   Dependency-free, no build step, file:// safe. Mirrors barcode.js:
   a small engine attached to window + document-level event delegation
   (so it survives the shell rebuilding document.body).

     photoField({ ref, level, title, compact, readonly })  -> HTML string
        ref      : owning id (document id for header, line/LPN ref for line)
        level    : 'header' (default) | 'line'
        title    : header label (default "Photos")
        compact  : small inline variant (auto-true for level:'line')
        readonly : render attachments only, no add/remove (print/view screens)

   Photos are OPTIONAL evidence. Data lives in DB.attachments (see data.js):
   render reads attachmentsFor(ref); add/remove go through addAttachment/
   removeAttachment so every change writes a logTxn() audit row.
   Real files chosen in the picker are previewed via FileReader (works on
   file://); the mock also seeds SVG-placeholder photos.
   ============================================================ */
(function () {
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // Render the thumbnail gallery (inner HTML of .pf-gallery) for one ref.
  function galleryInner(ref, readonly){
    const list = (typeof attachmentsFor==='function') ? attachmentsFor(ref) : [];
    const thumbs = list.map(a =>
      `<div class="pf-thumb" data-att="${esc(a.id)}" title="${esc(a.name)}${a.caption?' — '+esc(a.caption):''}">`
      + `<img src="${esc(a.dataUrl)}" alt="${esc(a.name)}">`
      + (readonly ? '' : `<button type="button" class="pf-rm" data-att="${esc(a.id)}" title="Remove">×</button>`)
      + `</div>`).join('');
    return thumbs || (readonly
      ? `<span class="pf-empty">No photos</span>`
      : `<span class="pf-empty">No photos yet</span>`);
  }

  // Build a complete photo field control as an HTML string.
  function photoField(opts){
    const o = opts || {};
    const ref = String(o.ref==null?'':o.ref);
    const level = o.level || 'header';
    const compact = o.compact!=null ? !!o.compact : level==='line';
    const readonly = !!o.readonly;
    const title = o.title || (level==='line' ? 'Photos' : 'Photos (optional)');
    const cls = `photo-field${compact?' compact':''}${readonly?' readonly':''}`;
    const head = compact
      ? ''
      : `<div class="pf-head"><svg class="pf-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H7l1.2-1.8A1 1 0 0 1 9 4.7h6a1 1 0 0 1 .8.5L17 7h2.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.2"/></svg><span>${esc(title)}</span></div>`;
    const cnt = (typeof attachmentCount==='function') ? attachmentCount(ref) : 0;
    const addBtn = readonly ? '' :
      (compact
        ? `<button type="button" class="pf-add compact" title="Add photo"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H7l1.2-1.8A1 1 0 0 1 9 4.7h6a1 1 0 0 1 .8.5L17 7h2.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3"/></svg><span class="pf-n">${cnt?('('+cnt+')'):''}</span></button>`
        : `<button type="button" class="pf-add">+ Add photo</button>`);
    const input = readonly ? '' : `<input type="file" class="pf-input" accept="image/*" multiple hidden>`;
    return `<div class="${cls}" data-photo-ref="${esc(ref)}" data-photo-level="${esc(level)}">`
      + head
      + `<div class="pf-row"><div class="pf-gallery">${galleryInner(ref, readonly)}</div>${addBtn}</div>`
      + input + `</div>`;
  }

  // Re-render one field's gallery (after add/remove) + refresh the compact count badge.
  function refresh(fieldEl){
    if(!fieldEl) return;
    const ref = fieldEl.getAttribute('data-photo-ref');
    const readonly = fieldEl.classList.contains('readonly');
    const gal = fieldEl.querySelector('.pf-gallery');
    if (gal) gal.innerHTML = galleryInner(ref, readonly);
    const n = fieldEl.querySelector('.pf-n');
    if (n){ const c = (typeof attachmentCount==='function') ? attachmentCount(ref) : 0; n.textContent = c?('('+c+')'):''; }
  }
  // Refresh every field on the page (e.g. after a screen rebuilds rows).
  function refreshAll(root){
    (root||document).querySelectorAll('.photo-field').forEach(refresh);
  }

  // ---- Lightbox (view a photo full-size) ----
  function lightbox(att){
    let lb = document.getElementById('pf-lightbox');
    if(!lb){ lb = document.createElement('div'); lb.id='pf-lightbox'; lb.className='pf-lightbox';
      lb.innerHTML = `<div class="pf-lb-card"><img><div class="pf-lb-cap"></div><button type="button" class="pf-lb-x">×</button></div>`;
      document.body.appendChild(lb);
      lb.addEventListener('click', e=>{ if(e.target===lb || e.target.classList.contains('pf-lb-x')) lb.classList.remove('open'); });
    }
    lb.querySelector('img').src = att.dataUrl;
    lb.querySelector('.pf-lb-cap').textContent = att.name + (att.caption? ' — '+att.caption : '') + '  ·  ' + (att.by||'') + ' ' + (att.at||'');
    lb.classList.add('open');
  }

  // ---- Document-level delegation (persists across shell body rebuild) ----
  document.addEventListener('click', function(e){
    const add = e.target.closest && e.target.closest('.pf-add');
    if (add){ const f = add.closest('.photo-field'); const inp = f && f.querySelector('.pf-input'); if (inp) inp.click(); return; }
    const rm = e.target.closest && e.target.closest('.pf-rm');
    if (rm){ const id = rm.getAttribute('data-att'); const f = rm.closest('.photo-field');
      if (typeof removeAttachment==='function') removeAttachment(id);
      refresh(f); e.stopPropagation(); return; }
    const th = e.target.closest && e.target.closest('.pf-thumb');
    if (th){ const id = th.getAttribute('data-att');
      const a = (typeof DB!=='undefined' && DB.attachments) ? DB.attachments.find(x=>x.id===id) : null;
      if (a) lightbox(a); return; }
  });

  document.addEventListener('change', function(e){
    const inp = e.target;
    if (!inp.classList || !inp.classList.contains('pf-input')) return;
    const f = inp.closest('.photo-field'); if(!f) return;
    const ref = f.getAttribute('data-photo-ref');
    const level = f.getAttribute('data-photo-level') || 'header';
    const files = Array.from(inp.files||[]);
    if (!files.length) return;
    let pending = files.length;
    files.forEach(file => {
      const fr = new FileReader();
      fr.onload = () => {
        if (typeof addAttachment==='function')
          addAttachment({ ref, level, name:file.name, dataUrl:fr.result });
        if (--pending===0){ refresh(f); }
      };
      fr.onerror = () => { if(--pending===0) refresh(f); };
      try { fr.readAsDataURL(file); }
      catch(err){ if (typeof addAttachment==='function') addAttachment({ ref, level, name:file.name }); if(--pending===0) refresh(f); }
    });
    inp.value = '';   // allow re-selecting the same file
  });

  // Init compact count badges for any fields already in the DOM, and watch for new ones.
  function initBadges(){ document.querySelectorAll('.photo-field .pf-n').forEach(n=>{
    const f = n.closest('.photo-field'); if(f) refresh(f); }); }
  if (document.readyState!=='loading') initBadges();
  else document.addEventListener('DOMContentLoaded', initBadges);

  window.photoField   = photoField;
  window.refreshPhotoFields = refreshAll;
  window.refreshPhotoField  = refresh;
})();
