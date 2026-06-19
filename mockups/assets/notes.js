/* ============================================================
   WMS MOCKUPS — SHARED NOTES / REMARKS WIDGET
   The textual sibling of photos.js: dependency-free, no build step,
   file:// safe. A small engine on window + document-level event
   delegation (so it survives the shell rebuilding document.body).

     noteField({ ref, level, title, compact, readonly, placeholder }) -> HTML string
        ref         : owning id (document/entity id for header, line/LPN ref for line)
        level       : 'header' (default) | 'line'
        title       : header label (default "Notes (optional)")
        compact     : single-line variant (auto-true for level:'line')
        readonly    : render the remark only, no editing (print/view screens)
        placeholder : input placeholder text

   ONE free-text remark per ref. Data lives in DB.notes (see data.js):
   render reads noteFor(ref); edits write through setNote(ref, text) on input.
   Notes are OPTIONAL and lightweight — no per-keystroke audit (unlike photos).
   ============================================================ */
(function () {
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const read = ref => (typeof noteFor==='function') ? noteFor(ref) : '';

  // Build a complete note field control as an HTML string.
  function noteField(opts){
    const o = opts || {};
    const ref = String(o.ref==null?'':o.ref);
    const level = o.level || 'header';
    const compact = o.compact!=null ? !!o.compact : level==='line';
    const readonly = !!o.readonly;
    const title = o.title || (level==='line' ? 'Note' : 'Notes (optional)');
    const ph = o.placeholder || (compact ? 'Add note…' : 'Add a remark…');
    const val = read(ref);
    const cls = `note-field${compact?' compact':''}${readonly?' readonly':''}`;
    const attrs = `data-note-ref="${esc(ref)}" data-note-level="${esc(level)}"`;
    const head = `<div class="nf-head"><svg class="nf-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12H7l-3 3z"/><path d="M8 9h8M8 12h5"/></svg><span>${esc(title)}</span></div>`;

    if (readonly){
      const body = val ? `<span class="nf-text">${esc(val)}</span>` : `<span class="nf-empty">No notes</span>`;
      return `<div class="${cls}" ${attrs}>${compact?'':head}${body}</div>`;
    }
    if (compact){
      return `<div class="${cls}" ${attrs}>`
        + `<input type="text" class="nf-input" value="${esc(val)}" placeholder="${esc(ph)}" title="${esc(title)}">`
        + `</div>`;
    }
    return `<div class="${cls}" ${attrs}>${head}`
      + `<textarea class="nf-input" rows="2" placeholder="${esc(ph)}">${esc(val)}</textarea>`
      + `</div>`;
  }

  // Persist edits live to DB.notes (no per-keystroke audit — notes are lightweight remarks).
  document.addEventListener('input', function(e){
    const inp = e.target;
    if (!inp.classList || !inp.classList.contains('nf-input')) return;
    const f = inp.closest('.note-field'); if(!f) return;
    const ref = f.getAttribute('data-note-ref');
    const level = f.getAttribute('data-note-level') || 'header';
    if (typeof setNote==='function') setNote(ref, inp.value, { level });
  });

  // Re-sync a field after a screen rebuilds its rows (keeps inputs / readonly text current).
  function refresh(fieldEl){
    if(!fieldEl) return;
    const ref = fieldEl.getAttribute('data-note-ref');
    const val = read(ref);
    const inp = fieldEl.querySelector('.nf-input');
    if (inp){ if (inp.value !== val) inp.value = val; return; }
    const txt = fieldEl.querySelector('.nf-text');
    if (val && txt) txt.textContent = val;
  }
  function refreshAll(root){ (root||document).querySelectorAll('.note-field').forEach(refresh); }

  window.noteField        = noteField;
  window.refreshNoteFields = refreshAll;
  window.refreshNoteField  = refresh;
})();
