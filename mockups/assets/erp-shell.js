/* ============================================================
   ERP SHELL INJECTOR (themed to resemble the client's ERP)
   Blue topbar + iconed, expandable sidebar. Nav lives here only.
   ============================================================ */
(function () {
  const b = document.body;
  const active = b.dataset.erpActive || '';
  const title  = b.dataset.erpTitle  || '';
  const crumb  = b.dataset.erpCrumb   || '';

  // minimal inline-SVG icon set (dependency-free, file:// safe)
  const I = {
    grid:'<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
    db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    inbound:'<path d="M3 7v13h18V7M3 7l4-4h10l4 4M12 10v6M12 16l-3-3M12 16l3-3"/>',
    box:'<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',
    outbound:'<path d="M3 7v13h18V7M3 7l4-4h10l4 4M12 16v-6M12 10l-3 3M12 10l3 3"/>',
    sync:'<path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M18 4v5h-5M6 20v-5h5"/>',
    chart:'<path d="M3 3v18h18M7 15v3M12 9v9M17 5v13"/>',
  };
  const icon = (n) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${I[n]||''}</svg>`;
  const ui = (paths) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

  // sidebar model: sections with icon + children [id,label,href]
  const SECTIONS = [
    { id:'dashboard', label:'Dashboard', icon:'grid', href:'erp-dashboard.html', children:[] },
    { label:'Master Data', icon:'db', children:[
      ['md-clients','Clients','erp-md-clients.html'],
      ['md-consignees','Consignees (ship-to)','erp-md-consignees.html'],
      ['md-sites','Sites','erp-md-sites.html'],
      ['md-locations','Locations','erp-md-locations.html'],
      ['md-products','Products','erp-md-products.html'],
      ['md-partners','Suppliers & Carriers','erp-md-partners.html'],
      ['md-categories','Categories','erp-md-categories.html'],
      ['md-reasons','Reason Codes','erp-md-reasons.html'],
      ['md-uom','UoM / Packaging','erp-md-uom.html'],
      ['md-users','Users & Roles','erp-md-users.html'],
      ['md-clientmap','Client–User Mapping','erp-md-clientmap.html'],
      ['md-import','CSV Import','erp-md-import.html'],
    ]},
    { label:'Goods Reception', icon:'inbound', children:[
      ['gr-asn','Inbound / ASN','erp-gr-asn.html'],
      ['gr-receipt','Receive','erp-gr-receipt.html'],
      ['gr-inspect','Inspection','erp-gr-inspect.html'],
      ['gr-grn','GRN','erp-gr-grn.html'],
      ['gr-labels','Labels / Reprint','erp-gr-labels.html'],
    ]},
    { label:'Putaway', icon:'box', children:[
      ['pa-tasks','Putaway Tasks','erp-pa-tasks.html'],
    ]},
    { label:'Stock-Out', icon:'outbound', children:[
      ['so-orders','Outbound Orders','erp-so-orders.html'],
      ['so-alloc','Allocation','erp-so-alloc.html'],
      ['so-dispatch','Pick / Dispatch','erp-so-dispatch.html'],
      ['so-fulfil','Express Fulfil','erp-so-fulfil.html'],
      ['so-rtv','Return to vendor','erp-so-rtv.html'],
      ['so-note','Delivery Note','erp-so-note.html'],
    ]},
    { label:'Inventory Ops', icon:'sync', children:[
      ['inv-transfer','Transfers','erp-inv-transfer.html'],
      ['inv-adjust','Adjustments','erp-inv-adjust.html'],
      ['inv-count','Count Approval','erp-inv-count.html'],
      ['inv-status','Stock Status','erp-inv-status.html'],
      ['inv-physical','Physical Inventory','erp-inv-physical.html'],
      ['inv-repack','Repack / Re-kit','erp-inv-repack.html'],
      ['inv-returns','Returns / Put-back','erp-inv-returns.html'],
      ['inv-dispose','Disposal / Scrap','erp-inv-dispose.html'],
    ]},
    { label:'Reports', icon:'chart', children:[
      ['rpt-soh','Stock on Hand','erp-rpt-soh.html'],
      ['rpt-txns','Transaction History','erp-rpt-txns.html'],
      ['rpt-expiry','Expiry & Aging','erp-rpt-expiry.html'],
      ['rpt-inbound','Inbound / Receipts','erp-rpt-inbound.html'],
      ['rpt-outbound','Outbound / Shipments','erp-rpt-outbound.html'],
      ['rpt-variance','Adjustments & Variances','erp-rpt-variance.html'],
      ['rpt-utilization','Bin / Location Utilization','erp-rpt-utilization.html'],
      ['rpt-trace','Lot / Serial Traceability','erp-rpt-trace.html'],
      ['rpt-stockcard','Stock Card / Ledger','erp-rpt-stockcard.html'],
      ['rpt-statement','Client Stock Statement','erp-rpt-statement.html'],
    ]},
  ];

  const navHtml = SECTIONS.map(sec => {
    if (!sec.children.length) {
      const open = sec.id === active;
      return `<a class="nav-head ${open?'open':''}" href="${sec.href}">${icon(sec.icon)}<span>${sec.label}</span></a>`;
    }
    const open = sec.children.some(c => c[0] === active);
    const first = sec.children[0][2];
    const subs = sec.children.map(([id,label,href]) =>
      `<a href="${href}" class="${id===active?'active':''}">${label}</a>`).join('');
    return `<div class="nav-sec">
      <a class="nav-head ${open?'open':''}" href="${first}">${icon(sec.icon)}<span>${sec.label}</span><span class="chev">▶</span></a>
      <div class="nav-sub ${open?'show':''}">${subs}</div>
    </div>`;
  }).join('');

  const clientOpts = DB.clients.map(c => `<option>${c.name}</option>`).join('');
  const siteOpts   = DB.sites.map(s => `<option>${s.name}</option>`).join('');

  const page = document.getElementById('page-content');
  const pageHtml = page ? page.innerHTML : '';
  if (page) page.remove();

  document.body.innerHTML = `
    <div class="erp-topbar">
      <span class="ico-btn">${ui('<path d="M3 6h18M3 12h18M3 18h18"/>')}</span>
      <span class="ico-btn">${ui('<path d="M3 11l9-8 9 8M5 9v11h14V9"/>')}</span>
      <span class="divider"></span>
      <span class="brand">WMS</span>
      <span class="region">${ui('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>')} 3PL</span>
      <div class="ctx">
        <label>Client</label><select>${clientOpts}</select>
        <label>Site</label><select>${siteOpts}</select>
        <span class="search">${ui('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>')}<input placeholder="Search"></span>
        <span class="ico-btn bell">${ui('<path d="M6 9a6 6 0 0 1 12 0c0 7 2 8 2 8H4s2-1 2-8M10 21h4"/>')}<span class="dot">5</span></span>
        <span class="avatar">AB</span>
        <a href="index.html" style="color:rgba(255,255,255,.85);text-decoration:none;font-size:12px">Sitemap</a>
      </div>
    </div>
    <div class="erp-body">
      <nav class="erp-nav">
        <div class="nav-title">Warehouse</div>
        ${navHtml}
      </nav>
      <main class="erp-main">
        ${crumb ? `<div class="crumb">${crumb}</div>` : ''}
        <div id="erp-content">${pageHtml}</div>
      </main>
    </div>`;

  /* ============================================================
     Global searchable-select enhancer — type-to-filter on every
     in-page <select>. Progressive enhancement: the native <select>
     stays in the DOM (so screen code's .value reads/writes and
     'change' listeners keep working); it is hidden and driven by a
     filter input + dropdown. Auto-applies to current and future
     screens, including selects injected dynamically after load.
     Skips <select multiple> and anything marked [data-no-ss].
     ============================================================ */
  const ssEsc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function initSS(sel){
    if (sel.getAttribute('data-ss') || sel.multiple || sel.hasAttribute('data-no-ss')) return;
    sel.setAttribute('data-ss','1');
    const wrap=document.createElement('div'); wrap.className='ss-wrap';
    sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel);
    const input=document.createElement('input'); input.className='ss-input'; input.type='text';
    input.autocomplete='off'; input.placeholder='Search…';
    const menu=document.createElement('div'); menu.className='ss-menu';
    wrap.appendChild(input); wrap.appendChild(menu);
    const opts=()=>Array.from(sel.options);
    const sync=()=>{ const o=sel.options[sel.selectedIndex]; input.value=o?o.text:''; };
    sel._ssSync=sync;
    let active=-1;
    function render(f){ f=(f||'').toLowerCase(); active=-1;
      const list=opts().filter(o=>o.text.toLowerCase().includes(f));
      menu.innerHTML = list.length
        ? list.map(o=>`<div class="ss-opt" data-v="${ssEsc(o.value)}">${ssEsc(o.text)}</div>`).join('')
        : `<div class="ss-none">No matches</div>`;
    }
    function paint(items){ items.forEach((el,i)=>el.classList.toggle('active',i===active)); if(items[active]) items[active].scrollIntoView({block:'nearest'}); }
    function choose(v){ sel.value=v; sel.dispatchEvent(new Event('change',{bubbles:true})); sync(); menu.classList.remove('open'); }
    input.addEventListener('focus',()=>{ render(''); menu.classList.add('open'); input.select(); });
    input.addEventListener('click',()=>{ render(''); menu.classList.add('open'); });
    input.addEventListener('input',()=>{ menu.classList.add('open'); render(input.value); });
    input.addEventListener('keydown',e=>{ const items=Array.from(menu.querySelectorAll('.ss-opt'));
      if(e.key==='ArrowDown'){ e.preventDefault(); active=Math.min(active+1,items.length-1); paint(items); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); active=Math.max(active-1,0); paint(items); }
      else if(e.key==='Enter'){ e.preventDefault(); const t=items[active<0?0:active]; if(t) choose(t.dataset.v); }
      else if(e.key==='Escape'){ menu.classList.remove('open'); sync(); input.blur(); }
    });
    menu.addEventListener('mousedown',e=>{ const o=e.target.closest('.ss-opt'); if(o){ e.preventDefault(); choose(o.dataset.v); } });
    input.addEventListener('blur',()=>setTimeout(()=>{ if(document.activeElement!==input){ menu.classList.remove('open'); sync(); } },120));
    new MutationObserver(sync).observe(sel,{childList:true});   // re-sync display when options are rebuilt
    sync();
  }
  function enhanceSelects(root){ if(!root) return;
    if (root.nodeType===1 && root.tagName==='SELECT'){ initSS(root); return; }
    (root.querySelectorAll ? root : document).querySelectorAll('select:not([data-ss])').forEach(initSS);
  }
  window.enhanceSelects = enhanceSelects;   // screens may call it; usually unnecessary (auto-observed)
  const ssMain = document.querySelector('.erp-main');   // enhance IN-PAGE selects only (leave topbar chrome native)
  if (ssMain){
    enhanceSelects(ssMain);
    new MutationObserver(muts=>{ muts.forEach(m=> m.addedNodes && m.addedNodes.forEach(n=>{
      if (n.nodeType!==1) return;
      if (n.tagName==='SELECT') initSS(n);
      else if (n.querySelectorAll) n.querySelectorAll('select:not([data-ss])').forEach(initSS);
    })); }).observe(ssMain,{childList:true,subtree:true});
  }
})();
