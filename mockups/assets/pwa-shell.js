/* ============================================================
   PWA SHELL INJECTOR  (assets/pwa-shell.js)
   Wraps each scanner screen in a phone frame + header, and owns the
   data-driven CLIENT / SITE context every PWA flow reads.
     - window.PWA  : { ctx, client(), site(), clientName(), siteName(),
                       user, setCtx({clientId,siteId}) }
     - context persists across page loads via sessionStorage, so a flow
       carries the same client+site as you navigate home → task → done.
     - the header context is tappable → a bottom-sheet client/site switcher.
   Screen contract (unchanged): set data-pwa-* on <body>, put markup in
   #page-content. The shell rebuilds <body> from #page-content's innerHTML,
   so anything outside #page-content (incl. <style>) is discarded — see
   CLAUDE.md. Load order on every page: data.js → pwa-scan.js → pwa-shell.js
   → the screen's own <script>.
   ============================================================ */
(function () {
  /* ---- restore any PWA session mutations BEFORE anything reads DB ---- */
  if (typeof pwaHydrate === 'function') pwaHydrate();

  /* ---- resolve + persist the client/site context ---- */
  const KEY = 'wms.pwa.ctx';
  const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch(_){ return {}; } };
  const write = c => { try { sessionStorage.setItem(KEY, JSON.stringify(c)); } catch(_){} };

  let ctx = read();
  if (!ctx.clientId || !DB.clients.some(c => c.id === ctx.clientId)) ctx.clientId = DB.clients[0].id;
  const sitesOf = id => { const c = DB.clients.find(x => x.id === id); return (c && c.sites) || []; };
  if (!ctx.siteId || !sitesOf(ctx.clientId).includes(ctx.siteId)) ctx.siteId = sitesOf(ctx.clientId)[0] || DB.sites[0].id;
  write(ctx);

  /* ---- "My tasks" filter flag (persisted) — the assignee filter every task list reads.
     Default OFF (= show all / "Any"). Only the head toggle on data-pwa-assignable screens flips it. ---- */
  const MINE_KEY = 'wms.pwa.mine';
  let mine = (() => { try { return sessionStorage.getItem(MINE_KEY) === '1'; } catch(_){ return false; } })();

  window.PWA = {
    ctx,
    client(){ return DB.clients.find(c => c.id === ctx.clientId) || null; },
    site(){ return DB.sites.find(s => s.id === ctx.siteId) || null; },
    clientName(){ const c = this.client(); return c ? c.name : ''; },
    siteName(){ const s = this.site(); return s ? s.name : ''; },
    user: 'Samer Merhi',   // logged-in operator (audit stamp on mutating flows)
    userId: 'U-003',        // …as a User.id — drives "My tasks" (see DB.currentUserId repoint below)
    mineOnly(){ return mine; },
    setMine(v){ mine = !!v; try { sessionStorage.setItem(MINE_KEY, mine ? '1' : '0'); } catch(_){} location.reload(); },
    save(){ return typeof pwaSaveDB === 'function' ? pwaSaveDB() : false; },
    resetDemo(){ if (typeof pwaResetDB === 'function') pwaResetDB(); location.reload(); },
    setCtx(next){
      ctx = Object.assign({}, ctx, next || {});
      if (!DB.clients.some(c => c.id === ctx.clientId)) ctx.clientId = DB.clients[0].id;
      if (!sitesOf(ctx.clientId).includes(ctx.siteId)) ctx.siteId = sitesOf(ctx.clientId)[0] || DB.sites[0].id;
      write(ctx);
      location.reload();
    },
  };

  /* Re-point the shared "current user" at this scanner's floor operator, so isMine() and the
     assignee filters resolve to the PWA user here (the ERP keeps its own DB.currentUserId default). */
  try { DB.currentUserId = PWA.userId; } catch(_){}

  /* ---- phone frame ---- */
  const b = document.body;
  const title = b.dataset.pwaTitle || '';
  const back  = b.dataset.pwaBack  || 'pwa-home.html';
  const foot  = b.dataset.pwaFoot  || '';
  const ctxLabel = `${PWA.clientName()} · ${PWA.siteName()}`;

  const page = document.getElementById('page-content');
  const pageHtml = page ? page.innerHTML : '';
  if (page) page.remove();

  const backLink = (back === 'none')
    ? '<span class="back" style="visibility:hidden">‹</span>'
    : `<a class="back" href="${back}">‹</a>`;

  // "All / My tasks" assignee toggle — rendered ONLY on task-list screens (data-pwa-assignable on <body>).
  // Flipping it persists `mine` + reloads; the screen's own render reads PWA.mineOnly() to filter.
  const mineBar = b.dataset.pwaAssignable ? `
        <div class="pwa-mine-bar" title="Filter to work dispatched to you">
          <button type="button" class="mb ${mine ? '' : 'on'}" data-mine="0">All</button>
          <button type="button" class="mb ${mine ? 'on' : ''}" data-mine="1">My tasks</button>
        </div>` : '';

  document.body.innerHTML = `
    <div class="pwa-stage">
      <div class="pwa-phone">
        <div class="pwa-head">
          ${backLink}
          <span class="t">${title}</span>
          <button type="button" class="ctx ctx-btn" title="Switch client / site">${ctxLabel} ▾</button>
        </div>
        <div class="pwa-screen">${mineBar}${pageHtml}</div>
        ${foot ? `<div class="pwa-foot">${foot}</div>` : ''}
      </div>
    </div>`;

  /* ---- client/site switcher (bottom sheet) ---- */
  document.addEventListener('click', e => { if (e.target.closest('.ctx-btn')) openSwitcher(); });
  /* ---- "My tasks" toggle ---- */
  document.addEventListener('click', e => { const mb = e.target.closest('.mb'); if (mb) PWA.setMine(mb.dataset.mine === '1'); });

  function openSwitcher(){
    const clientOpts = DB.clients.map(c =>
      `<option value="${c.id}" ${c.id === ctx.clientId ? 'selected' : ''}>${c.name}</option>`).join('');
    const sheet = document.createElement('div'); sheet.className = 'pwa-sheet';
    sheet.innerHTML = `<div class="ps-card">
        <div class="ps-h">Context</div>
        <label class="field"><span>Client (stock owner)</span><select class="ps-client">${clientOpts}</select></label>
        <label class="field"><span>Site</span><select class="ps-site"></select></label>
        <div class="btn-row">
          <button type="button" class="btn btn-primary ps-apply">Apply</button>
          <button type="button" class="btn ps-cancel">Cancel</button>
        </div>
        <div style="margin-top:12px;text-align:center">
          <button type="button" class="ps-reset" title="Discard PWA session changes and reload from seed data">↺ Reset demo data</button>
        </div>
      </div>`;
    document.body.appendChild(sheet);

    const selC = sheet.querySelector('.ps-client');
    const selS = sheet.querySelector('.ps-site');
    const fillSites = () => {
      selS.innerHTML = sitesOf(selC.value).map(id => {
        const s = DB.sites.find(x => x.id === id);
        return s ? `<option value="${s.id}" ${s.id === ctx.siteId ? 'selected' : ''}>${s.name}</option>` : '';
      }).join('');
    };
    fillSites();
    selC.addEventListener('change', fillSites);
    sheet.querySelector('.ps-cancel').addEventListener('click', () => sheet.remove());
    sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
    sheet.querySelector('.ps-apply').addEventListener('click', () => PWA.setCtx({ clientId: selC.value, siteId: selS.value }));
    sheet.querySelector('.ps-reset').addEventListener('click', () => {
      if (window.confirm('Reset demo data? This discards PWA session changes (received / moved / picked stock) and reloads from seed.')) PWA.resetDemo();
    });
  }
})();
