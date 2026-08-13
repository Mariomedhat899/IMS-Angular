/* ============================================================
   IMS Frontend — Inventory Control
   - API base from config.js -> window.IMS_API.BASE_URL
   - login via /api/auth/login
   - live tables + modals + toasts
   ============================================================ */
const state = {
  apiBase: (typeof window !== 'undefined' && window.IMS_API && window.IMS_API.BASE_URL) ? window.IMS_API.BASE_URL : './api',
  token: null,
  user: null,
  products: [],
  categories: [],
  transactions: [],
  payments: [],
  alerts: []
};

/* ============================================================
   TOASTS
   ============================================================ */
function toast(msg, type){
  const host = document.getElementById('toastHost');
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' '+type : '');
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(()=>{ el.remove(); }, 4200);
}

/* ============================================================
   AUTH
   ============================================================ */
function showAuthError(msg){
  const el = document.getElementById('authError');
  el.textContent = msg; el.classList.add('show');
}
function hideAuthError(){ document.getElementById('authError').classList.remove('show'); }

function decodeJwt(token){
  try{
    const payload = token.split('.')[1];
    const json = decodeURIComponent(atob(payload.replace(/-/g,'+').replace(/_/g,'/')).split('').map(c=>
      '%' + ('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  }catch(e){ return {}; }
}
function extractRole(claims){
  const roleKeys = ['role','http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  for(const k of roleKeys){
    if(claims[k]) return Array.isArray(claims[k]) ? claims[k][0] : claims[k];
  }
  return 'Staff';
}
function extractEmail(claims){
  return claims['email'] || claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || claims['sub'] || '';
}

/* ============================================================
   API HELPER
   ============================================================ */
async function api(path, options={}){
  const opts = Object.assign({}, options);
  opts.headers = Object.assign({}, options.headers);
  if(!(opts.body instanceof FormData) && opts.body && !opts.headers['Content-Type']){
    opts.headers['Content-Type'] = 'application/json';
  }
  if(state.token){ opts.headers['Authorization'] = 'Bearer ' + state.token; }

  const base = (state.apiBase || '').replace(/\/+$/,'');
  const url = base + '/' + path.replace(/^\/+/,'');

  let res;
  try{
    res = await fetch(url, opts);
  }catch(err){
    throw new Error('Could not reach the API at ' + state.apiBase + '. Check the URL and that CORS is enabled on the server.');
  }

  if(res.status === 401){
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  if(!res.ok){
    let msg = 'Request failed (' + res.status + ')';
    try{
      const data = await res.json();
      msg = data.message || data.title || data.error || JSON.stringify(data);
    }catch(e){}
    try{ console.error('[IMS] API error', res.status, res.url, msg); }catch(e){}
    throw new Error(msg);
  }

  const contentType = res.headers.get('content-type') || '';
  if(contentType.includes('application/json')) return res.json();
  return res;
}

/* ============================================================
   AUTH ACTIONS
   ============================================================ */
async function handleLogin(e){
  e.preventDefault();
  hideAuthError();
  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Logging in…';
  try{
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const data = await api('/api/auth/login', { method:'POST', body: JSON.stringify({ email, password }) });
    const token = data.token || data.accessToken || data.jwt;
    if(!token) throw new Error('Login succeeded but no token was returned by the API.');
    setSession(token);
    toast('Welcome back.', 'success');
    enterApp();
  }catch(err){
    showAuthError(err.message);
  }finally{
    btn.disabled = false; btn.textContent = 'Log in';
  }
  return false;
}

function setSession(token){
  state.token = token;
  try{ localStorage.setItem(window.IMS_API.TOKEN_KEY, token); }catch(e){}
  const claims = decodeJwt(token);
  state.user = { email: extractEmail(claims), role: extractRole(claims) };
}

function logout(){
  state.token = null;
  state.user = null;
  try{ localStorage.removeItem(window.IMS_API.TOKEN_KEY); localStorage.removeItem(window.IMS_API.EMAIL_KEY); localStorage.removeItem(window.IMS_API.ROLE_KEY); }catch(e){}
  document.getElementById('app').classList.remove('active');
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('loginForm').reset();
}

function tryRestoreSession(){
  try{
    const token = localStorage.getItem(window.IMS_API.TOKEN_KEY);
    if(!token) return false;
    const claims = decodeJwt(token);
    const email = extractEmail(claims);
    const role = extractRole(claims);
    if(!email || !role) return false;
    if(claims.exp && Date.now() >= claims.exp * 1000){
      localStorage.removeItem(window.IMS_API.TOKEN_KEY);
      return false;
    }
    state.token = token;
    state.user = { email, role };
    return true;
  }catch(e){ return false; }
}

function enterApp(){
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('app').classList.add('active');
  document.getElementById('userRoleTag').textContent = state.user.role;
  document.getElementById('userEmailTag').textContent = state.user.email;
  document.getElementById('apiPillText').textContent = state.apiBase.replace(/^https?:\/\//,'');
  applyRoleVisibility();
  navigate('dashboard');
  loadAll();
}

function applyRoleVisibility(){
  const role = state.user.role;
  document.querySelectorAll('[data-roles]').forEach(el=>{
    const allowed = el.dataset.roles.split(',');
    el.style.display = allowed.includes(role) ? '' : 'none';
  });
  const isAdmin = role === 'Admin';
  const isManagerPlus = role === 'Admin' || role === 'Manager';
  const setDisp = (id, cond)=>{ const el = document.getElementById(id); if(el) el.style.display = cond ? '' : 'none'; };
  setDisp('addProductBtn', isManagerPlus);
  setDisp('importBtn', isManagerPlus);
  setDisp('exportBtn', isManagerPlus);
  setDisp('addCategoryBtn', isManagerPlus);
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function navigate(page){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  const navBtn = document.querySelector('.nav-item[data-page="'+page+'"]');
  if(navBtn) navBtn.classList.add('active');
  if(page==='reports') loadReports();
  if(page==='dashboard') renderDashboard();
}

/* ============================================================
   LOAD ALL DATA
   ============================================================ */
async function loadAll(){
  await Promise.all([
    loadProducts(), loadCategories(), loadTransactions(),
    loadPayments(true), loadAlerts(true)
  ]);
  renderDashboard();
}

/* ---------- PRODUCTS ---------- */
async function loadProducts(){
  try{
    state.products = await api('/api/products');
    try{ console.log('[IMS] /api/products response sample:', JSON.stringify(state.products.slice(0,2)).slice(0,2000)); }catch(e){}
  }catch(err){
    document.getElementById('productsTableWrap').innerHTML = errorBlock(err.message);
    return;
  }
  renderProducts();
}
function stockLevelInfo(p){
  const raw = p.quantity ?? p.QuantityInStock ?? p.quantityInStock ?? p.stockQuantity ?? p.qty ?? p.StockQuantity ?? 0;
  const qty = Number(raw) || 0;
  const rawThreshold = p.lowStockThreshold ?? p.threshold ?? p.LowStockThreshold ?? p.lowstockthreshold ?? 10;
  const threshold = Number(rawThreshold) || 10;
  const ratio = Math.min(1, qty / Math.max(threshold * 2, 1));
  let color = 'var(--teal)', tag = '<span class="tag ok">In stock</span>';
  if (qty <= 0) { color = 'var(--brick)'; tag = '<span class="tag danger">Out of stock</span>'; }
  else if (qty < threshold) { color = 'var(--amber)'; tag = '<span class="tag warn">Low stock</span>'; }
  return { qty, threshold, ratio, color, tag };
}
function renderProducts(){
  const wrap = document.getElementById('productsTableWrap');
  const search = (document.getElementById('productSearch').value || '').toLowerCase();
  const list = state.products.filter(p => (p.name||'').toLowerCase().includes(search));
  if(!list.length){ wrap.innerHTML = emptyBlock('No products match.'); return; }
  const canEdit = state.user.role === 'Admin' || state.user.role === 'Manager';
  const canDelete = state.user.role === 'Admin';
  let rows = list.map(p=>{
    const info = stockLevelInfo(p);
    const catName = p.categoryName || (state.categories.find(c=>c.id===p.categoryId)||{}).name || '—';
    return `<tr>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td>${escapeHtml(catName)}</td>
      <td class="num">$${Number(p.price ?? p.unitPrice ?? 0).toFixed(2)}</td>
      <td>
        <div class="gauge-wrap">
          <div class="gauge"><div style="width:${Math.round(info.ratio*100)}%;background:${info.color}"></div></div>
          <span class="gauge-num">${info.qty}</span>
        </div>
      </td>
      <td>${info.tag}</td>
      <td class="row-actions">
        ${canEdit ? `<button class="btn btn-outline btn-sm" onclick="openProductModal(${p.id})">Edit</button>` : ''}
        ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Delete</button>` : ''}
      </td>
    </tr>`;
  }).join('');
  wrap.innerHTML = `<table><thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}
function openProductModal(id){
  const editing = id != null;
  const p = editing ? state.products.find(x=>x.id===id) : {};
  const catOptions = state.categories.map(c=>`<option value="${c.id}" ${p && p.categoryId===c.id ? 'selected':''}>${escapeHtml(c.name)}</option>`).join('');
  openModal(editing ? 'Edit product' : 'Add product', `
    <div class="field"><label>Name</label><input id="f_name" value="${p.name ? escapeHtml(p.name):''}"></div>
    <div class="field-row">
      <div class="field"><label>Price</label><input id="f_price" type="number" step="0.01" value="${p.price ?? p.unitPrice ?? ''}"></div>
      <div class="field"><label>Quantity</label><input id="f_qty" type="number" value="${p.quantity ?? p.QuantityInStock ?? p.quantityInStock ?? ''}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Category</label><select id="f_cat"><option value="">—</option>${catOptions}</select></div>
      <div class="field"><label>Low stock threshold</label><input id="f_threshold" type="number" value="${p.lowStockThreshold ?? p.threshold ?? 10}"></div>
    </div>
  `, async ()=>{
    const body = {
      name: document.getElementById('f_name').value.trim(),
      price: parseFloat(document.getElementById('f_price').value || 0),
      QuantityInStock: parseInt(document.getElementById('f_qty').value || 0),
      categoryId: document.getElementById('f_cat').value ? parseInt(document.getElementById('f_cat').value) : null,
      lowStockThreshold: parseInt(document.getElementById('f_threshold').value || 10),
    };
    if(editing){ const r = await api('/api/products/'+id, { method:'PUT', body: JSON.stringify(body) }); console.log('[IMS] PUT /api/products/'+id+' response:', r); toast('Product updated', 'success'); }
    else{ const r = await api('/api/products', { method:'POST', body: JSON.stringify(body) }); console.log('[IMS] POST /api/products response:', r); toast('Product added', 'success'); }
    await loadProducts();
    renderDashboard();
    closeModal();
  });
}
async function deleteProduct(id){
  if(!confirm('Delete this product? This cannot be undone.')) return;
  try{ await api('/api/products/'+id, { method:'DELETE' }); toast('Product deleted', 'success'); await loadProducts(); }
  catch(err){ toast(err.message, 'error'); }
}
async function exportCsv(){
  try{
    const res = await api('/api/products/export');
    const blob = res instanceof Response ? await res.blob() : new Blob([JSON.stringify(res)]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'products.csv'; a.click();
    URL.revokeObjectURL(url);
    toast('Export downloaded', 'success');
  }catch(err){ toast(err.message, 'error'); }
}
async function importCsv(input){
  const file = input.files[0];
  if(!file) return;
  const fd = new FormData(); fd.append('file', file);
  try{
    await api('/api/products/import', { method:'POST', body: fd });
    toast('CSV imported', 'success');
    await loadProducts();
  }catch(err){ toast(err.message, 'error'); }
  input.value = '';
}

/* ---------- CATEGORIES ---------- */
async function loadCategories(){
  try{ state.categories = await api('/api/categories'); }
  catch(err){ document.getElementById('categoriesTableWrap').innerHTML = errorBlock(err.message); return; }
  renderCategories();
}
function renderCategories(){
  const wrap = document.getElementById('categoriesTableWrap');
  if(!state.categories.length){ wrap.innerHTML = emptyBlock('No categories yet.'); return; }
  const role = state.user.role;
  const canEdit = role === 'Admin';
  const canCreate = role === 'Admin' || role === 'Manager';
  const rows = state.categories.map(c=>`<tr>
    <td><strong>${escapeHtml(c.name)}</strong></td>
    <td>${escapeHtml(c.description || '—')}</td>
    <td class="num">${state.products.filter(p=>p.categoryId===c.id).length}</td>
    <td class="row-actions">
      ${(canCreate) ? `<button class="btn btn-outline btn-sm" onclick="openCategoryModal(${c.id})">Edit</button>` : ''}
      ${canEdit ? `<button class="btn btn-danger btn-sm" onclick="deleteCategory(${c.id})">Delete</button>` : ''}
    </td>
  </tr>`).join('');
  wrap.innerHTML = `<table><thead><tr><th>Name</th><th>Description</th><th>Products</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}
function openCategoryModal(id){
  const editing = id != null;
  const c = editing ? state.categories.find(x=>x.id===id) : {};
  openModal(editing ? 'Edit category' : 'Add category', `
    <div class="field"><label>Name</label><input id="f_cname" value="${c.name ? escapeHtml(c.name):''}"></div>
    <div class="field"><label>Description</label><textarea id="f_cdesc" rows="3">${c.description ? escapeHtml(c.description):''}</textarea></div>
  `, async ()=>{
    const body = { name: document.getElementById('f_cname').value.trim(), description: document.getElementById('f_cdesc').value.trim() };
    if(editing){ await api('/api/categories/'+id, { method:'PUT', body: JSON.stringify(body) }); toast('Category updated', 'success'); }
    else{ await api('/api/categories', { method:'POST', body: JSON.stringify(body) }); toast('Category added', 'success'); }
    await loadCategories();
    closeModal();
  });
}
async function deleteCategory(id){
  if(!confirm('Delete this category?')) return;
  try{ await api('/api/categories/'+id, { method:'DELETE' }); toast('Category deleted', 'success'); await loadCategories(); }
  catch(err){ toast(err.message, 'error'); }
}

/* ---------- TRANSACTIONS ---------- */
async function loadTransactions(){
  try{ state.transactions = await api('/api/transactions'); }
  catch(err){ document.getElementById('transactionsTableWrap').innerHTML = errorBlock(err.message); return; }
  renderTransactions();
}
function renderTransactions(){
  const wrap = document.getElementById('transactionsTableWrap');
  if(!state.transactions.length){ wrap.innerHTML = emptyBlock('No transactions recorded yet.'); return; }
  const rows = state.transactions.map(t=>{
    const prod = state.products.find(p=>p.id===t.productId);
    const isSale = (t.type||t.transactionType||'').toLowerCase()==='sale';
    return `<tr>
      <td>${escapeHtml((prod && prod.name) || t.productName || ('#'+t.productId))}</td>
      <td>${isSale ? '<span class="tag danger">Sale</span>' : '<span class="tag ok">Purchase</span>'}</td>
      <td class="num">${t.quantity}</td>
      <td class="mono" style="color:var(--muted);font-size:12px;">${formatDate(t.date || t.createdAt)}</td>
    </tr>`;
  }).join('');
  wrap.innerHTML = `<table><thead><tr><th>Product</th><th>Type</th><th>Quantity</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function openTransactionModal(){
  const prodOptions = state.products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
  openModal('Record transaction', `
    <div class="field"><label>Product</label><select id="f_tprod">${prodOptions}</select></div>
    <div class="field-row">
      <div class="field"><label>Type</label><select id="f_ttype"><option value="Sale">Sale</option><option value="Purchase">Purchase</option></select></div>
      <div class="field"><label>Quantity</label><input id="f_tqty" type="number" min="1" value="1"></div>
    </div>
  `, async ()=>{
    const body = {
      productId: parseInt(document.getElementById('f_tprod').value),
      type: document.getElementById('f_ttype').value,
      transactionType: document.getElementById('f_ttype').value,
      quantity: parseInt(document.getElementById('f_tqty').value || 1),
    };
    await api('/api/transactions', { method:'POST', body: JSON.stringify(body) });
    toast('Transaction recorded', 'success');
    await Promise.all([loadTransactions(), loadProducts()]);
    closeModal();
  });
}

/* ---------- PAYMENTS ---------- */
async function loadPayments(silent){
  try{ state.payments = await api('/api/payments'); }
  catch(err){ if(!silent) document.getElementById('paymentsTableWrap').innerHTML = errorBlock(err.message); return; }
  renderPayments();
}
function renderPayments(){
  const wrap = document.getElementById('paymentsTableWrap');
  if(!wrap) return;
  if(!state.payments.length){ wrap.innerHTML = emptyBlock('No payments recorded yet.'); return; }
  const isAdmin = state.user.role === 'Admin';
  const rows = state.payments.map(p=>{
    const statusTag = p.status === 'Completed' ? '<span class="tag ok">Completed</span>'
      : p.status === 'Failed' ? '<span class="tag danger">Failed</span>'
      : '<span class="tag warn">Pending</span>';
    return `<tr>
      <td class="mono">${escapeHtml(p.transactionReference || p.reference || ('#'+p.id))}</td>
      <td class="num">$${Number(p.amount||0).toFixed(2)}</td>
      <td>${escapeHtml(p.method || p.paymentMethod || '—')}</td>
      <td>${statusTag}</td>
      <td class="row-actions">
        <button class="btn btn-outline btn-sm" onclick="openPaymentModal(${p.id})">Edit</button>
        ${isAdmin ? `<button class="btn btn-danger btn-sm" onclick="deletePayment(${p.id})">Delete</button>` : ''}
      </td>
    </tr>`;
  }).join('');
  wrap.innerHTML = `<table><thead><tr><th>Reference</th><th>Amount</th><th>Method</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}
function openPaymentModal(id){
  const editing = id != null;
  const p = editing ? state.payments.find(x=>x.id===id) : {};
  openModal(editing ? 'Edit payment' : 'Add payment', `
    <div class="field-row">
      <div class="field"><label>Amount</label><input id="f_pamount" type="number" step="0.01" value="${p.amount ?? ''}"></div>
      <div class="field"><label>Method</label><input id="f_pmethod" value="${p.method || p.paymentMethod || ''}" placeholder="Card, cash, transfer…"></div>
    </div>
    <div class="field"><label>Reference</label><input id="f_pref" value="${p.transactionReference || p.reference || ''}"></div>
    <div class="field"><label>Status</label>
      <select id="f_pstatus">
        <option value="Pending" ${p.status==='Pending'?'selected':''}>Pending</option>
        <option value="Completed" ${p.status==='Completed'?'selected':''}>Completed</option>
        <option value="Failed" ${p.status==='Failed'?'selected':''}>Failed</option>
      </select>
    </div>
  `, async ()=>{
    const body = {
      amount: parseFloat(document.getElementById('f_pamount').value || 0),
      method: document.getElementById('f_pmethod').value.trim(),
      transactionReference: document.getElementById('f_pref').value.trim(),
      status: document.getElementById('f_pstatus').value,
    };
    if(editing){ await api('/api/payments/'+id, { method:'PUT', body: JSON.stringify(body) }); toast('Payment updated', 'success'); }
    else{ await api('/api/payments', { method:'POST', body: JSON.stringify(body) }); toast('Payment added', 'success'); }
    await loadPayments();
    closeModal();
  });
}
async function deletePayment(id){
  if(!confirm('Delete this payment?')) return;
  try{ await api('/api/payments/'+id, { method:'DELETE' }); toast('Payment deleted', 'success'); await loadPayments(); }
  catch(err){ toast(err.message, 'error'); }
}

/* ---------- LOW STOCK ALERTS ---------- */
async function loadAlerts(silent){
  try{ state.alerts = await api('/api/lowStockAlerts'); }
  catch(err){ if(!silent) document.getElementById('alertsTableWrap').innerHTML = errorBlock(err.message); return; }
  renderAlerts();
}
function renderAlerts(){
  const wrap = document.getElementById('alertsTableWrap');
  if(wrap){
    if(!state.alerts.length){ wrap.innerHTML = emptyBlock('No active low stock alerts. Everything is above threshold.'); }
    else{
      const rows = state.alerts.map(a=>{
        const prod = state.products.find(p=>p.id===a.productId);
        return `<tr>
          <td><strong>${escapeHtml((prod && prod.name) || a.productName || ('#'+a.productId))}</strong></td>
          <td class="num">${a.currentQuantity ?? a.quantity ?? '—'}</td>
          <td class="num">${a.threshold ?? '—'}</td>
          <td class="mono" style="color:var(--muted);font-size:12px;">${formatDate(a.createdAt || a.date)}</td>
        </tr>`;
      }).join('');
      wrap.innerHTML = `<table><thead><tr><th>Product</th><th>Current qty</th><th>Threshold</th><th>Created</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
  }
  const dash = document.getElementById('dashAlerts');
  if(dash){
    if(!state.alerts.length){ dash.innerHTML = emptyBlock('No active alerts.'); }
    else{
      dash.innerHTML = state.alerts.slice(0,5).map(a=>{
        const prod = state.products.find(p=>p.id===a.productId);
        return `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px;">
          <span>${escapeHtml((prod && prod.name) || a.productName || ('#'+a.productId))}</span>
          <span class="tag warn">${a.currentQuantity ?? a.quantity ?? '—'} left</span>
        </div>`;
      }).join('');
    }
  }
}
function openAlertModal(){
  const prodOptions = state.products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
  openModal('Create low stock alert', `
    <div class="field"><label>Product</label><select id="f_aprod">${prodOptions}</select></div>
    <div class="field"><label>Threshold</label><input id="f_athreshold" type="number" value="10"></div>
  `, async ()=>{
    const body = {
      productId: parseInt(document.getElementById('f_aprod').value),
      threshold: parseInt(document.getElementById('f_athreshold').value || 10),
    };
    await api('/api/lowStockAlerts', { method:'POST', body: JSON.stringify(body) });
    toast('Alert created', 'success');
    await loadAlerts();
    closeModal();
  });
}

/* ---------- REPORTS ---------- */
async function loadReports(){
  const statsEl = document.getElementById('reportStats');
  const topEl = document.getElementById('topSellersWrap');
  try{
    const r = await api('/api/reports');
    const totalValue = r.totalStockValue ?? r.totalValue ?? 0;
    const productCount = r.productCount ?? r.totalProducts ?? state.products.length;
    const salesTotal = r.salesTotal ?? (r.sales && r.sales.total) ?? '—';
    const purchasesTotal = r.purchasesTotal ?? (r.purchases && r.purchases.total) ?? '—';
    statsEl.innerHTML = `
      <div class="stat-card accent-teal"><div class="label">Total stock value</div><div class="value teal">$${Number(totalValue).toLocaleString(undefined,{maximumFractionDigits:2})}</div></div>
      <div class="stat-card accent-teal"><div class="label">Products tracked</div><div class="value">${productCount}</div></div>
      <div class="stat-card accent-teal"><div class="label">Sales total</div><div class="value">${salesTotal==='—'?'—':'$'+Number(salesTotal).toLocaleString()}</div></div>
      <div class="stat-card accent-amber"><div class="label">Purchases total</div><div class="value">${purchasesTotal==='—'?'—':'$'+Number(purchasesTotal).toLocaleString()}</div></div>
    `;
    const top = r.topSellingProducts || r.topSellers || [];
    if(!top.length){ topEl.innerHTML = emptyBlock('No sales data yet.'); }
    else{
      const rows = top.map((t,i)=>`<tr>
        <td class="num">${i+1}</td>
        <td><strong>${escapeHtml(t.productName || t.name)}</strong></td>
        <td class="num">${t.unitsSold ?? t.quantitySold ?? '—'}</td>
      </tr>`).join('');
      topEl.innerHTML = `<table><thead><tr><th>#</th><th>Product</th><th>Units sold</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
  }catch(err){
    statsEl.innerHTML = errorBlock(err.message);
    topEl.innerHTML = '';
  }
}

/* ---------- DASHBOARD ---------- */
function renderDashboard(){
  const totalProducts = state.products.length;
  const lowStock = state.products.filter(p=>{
    const info = stockLevelInfo(p);
    return info.qty < info.threshold;
  }).length;
  const totalValue = state.products.reduce((sum,p)=> sum + (Number(p.price ?? p.unitPrice ?? 0) * Number(p.quantity ?? p.stockQuantity ?? 0)), 0);
  document.getElementById('dashStats').innerHTML = `
    <div class="stat-card accent-teal"><div class="label">Products</div><div class="value">${totalProducts}</div><div class="sub">${state.categories.length} categories</div></div>
    <div class="stat-card accent-teal"><div class="label">Categories</div><div class="value">${state.categories.length}</div><div class="sub">Grouping ${totalProducts} products</div></div>
    <div class="stat-card ${lowStock>0?'accent-amber':'accent-teal'}"><div class="label">Low stock items</div><div class="value ${lowStock>0?'amber':'teal'}">${lowStock}</div><div class="sub">${lowStock>0 ? 'Below reorder threshold' : 'All items healthy'}</div></div>
    <div class="stat-card accent-teal"><div class="label">Est. stock value</div><div class="value teal">$${totalValue.toLocaleString(undefined,{maximumFractionDigits:0})}</div><div class="sub">Price × quantity on hand</div></div>
  `;
  renderAlerts();
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(title, bodyHtml, onSave){
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalOverlay').classList.add('active');
  const saveBtn = document.getElementById('modalSaveBtn');
  saveBtn.textContent = 'Save';
  saveBtn.disabled = false;
  saveBtn.onclick = async ()=>{
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
    try{ await onSave(); }
    catch(err){ toast(err.message, 'error'); saveBtn.disabled = false; saveBtn.textContent = 'Save'; }
  };
}
function closeModal(){ document.getElementById('modalOverlay').classList.remove('active'); }

/* ============================================================
   UTIL
   ============================================================ */
function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function formatDate(d){
  if(!d) return '—';
  const dt = new Date(d);
  if(isNaN(dt)) return '—';
  return dt.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
}
function emptyBlock(msg){ return `<div class="empty-state"><div class="ic">▢</div>${escapeHtml(msg)}</div>`; }
function errorBlock(msg){ return `<div class="empty-state" style="color:var(--brick);"><div class="ic">!</div>${escapeHtml(msg)}</div>`; }

/* decorative barcode + ticket number */
(function initTicketDecor(){
  const bc = document.getElementById('barcodeDecor');
  if(bc){
    let bars = '';
    for(let i=0;i<38;i++){
      const w = [2,2,4,2,6,3][Math.floor(Math.random()*6)];
      const h = 10 + Math.floor(Math.random()*16);
      bars += `<span style="width:${w}px;height:${h}px;"></span>`;
    }
    bc.innerHTML = bars;
  }
  const ticketNo = document.getElementById('ticketNo');
  if(ticketNo){
    ticketNo.textContent = '№ ' + String(Math.floor(1000 + Math.random()*8999));
  }
})();

/* restore session on refresh */
(function restoreOnLoad(){
  if(tryRestoreSession()){
    enterApp();
  }
})();
