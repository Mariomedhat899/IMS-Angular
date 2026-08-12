(() => {
  const $ = (sel) => document.querySelector(sel);
  const on = (el, ev, fn) => el.addEventListener(ev, fn);
  const canManage = () => state.role === 'Admin' || state.role === 'Manager';

  const state = {
    email: localStorage.getItem(IMS_API.EMAIL_KEY) || '',
    token: localStorage.getItem(IMS_API.TOKEN_KEY) || '',
    role: localStorage.getItem(IMS_API.ROLE_KEY) || '',
    products: [],
    categories: [],
    transactions: [],
    editingCategoryId: null,
    editingProductId: null
  };

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
  });

  const api = async (path, opts = {}) => {
    const res = await fetch(IMS_API.BASE_URL + path, {
      ...opts,
      headers: {
        ...authHeaders(),
        ...(opts.headers || {})
      }
    });

    if (res.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    if (res.status === 204) return null;

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return res.json();
    return res.text();
  };

  const setAuth = (data) => {
    state.token = data.token;
    state.email = data.email;
    state.role = (data.roles || [])[0] || '';
    localStorage.setItem(IMS_API.TOKEN_KEY, data.token);
    localStorage.setItem(IMS_API.EMAIL_KEY, data.email);
    localStorage.setItem(IMS_API.ROLE_KEY, state.role);
  };

  const logout = () => {
    state.token = '';
    state.email = '';
    state.role = '';
    localStorage.removeItem(IMS_API.TOKEN_KEY);
    localStorage.removeItem(IMS_API.EMAIL_KEY);
    localStorage.removeItem(IMS_API.ROLE_KEY);
  };

  const show = (id) => {
    document.querySelectorAll('#app > section').forEach((el) => el.classList.add('hidden'));
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
  };

  const esc = (val) => {
    if (val == null) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const renderTable = (containerId, rows, columns, actions) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!rows.length) {
      container.innerHTML = '<div class="empty">No records yet.</div>';
      return;
    }

    let html = `
      <div class="card" style="padding:0; overflow:auto;">
        <table class="table">
          <thead>
            <tr>
              ${columns.map((col) => `<th>${esc(col.label)}</th>`).join('')}
              ${actions && canManage() ? '<th>Actions</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                ${columns.map((col) => `<td>${esc(col.value ? col.value(row) : row[col.key])}</td>`).join('')}
                ${actions && canManage() ? `<td>${actions(row)}</td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  };

  const confirm = (message) => window.confirm(message || 'Are you sure?');

  const setStatus = (el, message, type = 'error') => {
    if (!el) return;
    el.textContent = message || '';
    el.className = 'status ' + (type === 'success' ? 'success' : '');
  };

  const loginPage = () => `
    <section id="login" class="login card">
      <div class="title">IMS Login</div>
      <label>Email</label>
      <input id="loginEmail" type="email" value="${esc(state.email)}" />
      <label>Password</label>
      <input id="loginPassword" type="password" />
      <div id="loginError" class="status"></div>
      <div class="actions" style="margin-top:14px;">
        <button id="loginBtn" class="btn">Login</button>
      </div>
    </section>
  `;

  const dashboardPage = () => {
    const canManage = state.role === 'Admin' || state.role === 'Manager';
    return `
      <section id="dashboard" class="hidden">
        <div class="header">
          <div class="brand">IMS Dashboard</div>
          <div class="actions">
            <span class="user">${esc(state.email)} · ${esc(state.role)}</span>
            <button id="logoutBtn" class="btn secondary">Logout</button>
          </div>
        </div>
        <div class="container">
          <div class="grid">
            <div class="card">
              <div class="title">📦 Products</div>
              <div>Create, update, delete products.</div>
              <div class="actions" style="margin-top:12px;">
                <button data-page="products" class="btn open-page">Open</button>
                ${canManage ? `<button data-page="categories" class="btn open-page">Categories</button>` : ''}
              </div>
            </div>
            <div class="card">
              <div class="title">🧾 Transactions</div>
              <div>Record sales and purchases.</div>
              <div class="actions" style="margin-top:12px;">
                <button data-page="transactions" class="btn open-page">Open</button>
              </div>
            </div>
            <div class="card">
              <div class="title">📁 Data</div>
              <div>Import or export products CSV.</div>
              <div class="actions" style="margin-top:12px;">
                <button id="exportCsv" class="btn success ${canManage ? '' : 'hidden'}">Export CSV</button>
                <label class="btn ${canManage ? '' : 'hidden'}" style="cursor:pointer;">
                  Import CSV
                  <input id="importCsv" type="file" accept=".csv" class="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  };

  const productsPage = () => `
    <section id="products" class="hidden">
      <div class="header">
        <div class="brand">Products</div>
        <div class="actions">
          <button data-page="dashboard" class="btn secondary open-page">Back</button>
        </div>
      </div>
      <div class="container">
        <div class="card">
          <div class="title" id="productFormTitle">Add Product</div>
          <input type="hidden" id="pId" />
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
            <div>
              <label>Name</label>
              <input id="pName" />
            </div>
            <div>
              <label>Price</label>
              <input id="pPrice" type="number" min="0" step="0.01" />
            </div>
            <div>
              <label>Quantity</label>
              <input id="pQty" type="number" min="0" step="1" />
            </div>
            <div>
              <label>Supplier</label>
              <input id="pSupplier" />
            </div>
            <div>
              <label>Category</label>
              <select id="pCategory"></select>
            </div>
          </div>
          <label>Description</label>
          <textarea id="pDesc" rows="3"></textarea>
          <div class="actions" style="margin-top:12px;">
            <button id="saveProduct" class="btn success">Save Product</button>
            <button id="resetProduct" class="btn secondary">Reset</button>
            <button id="cancelProduct" class="btn secondary hidden">Cancel Edit</button>
          </div>
          <div id="productStatus" class="status"></div>
        </div>
        <div id="productsTable"></div>
      </div>
    </section>
  `;

  const categoriesPage = () => `
    <section id="categories" class="hidden">
      <div class="header">
        <div class="brand">Categories</div>
        <div class="actions">
          <button data-page="dashboard" class="btn secondary open-page">Back</button>
        </div>
      </div>
      <div class="container">
        <div class="card">
          <div class="title" id="categoryFormTitle">Add Category</div>
          <input type="hidden" id="cId" />
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
            <div>
              <label>Name</label>
              <input id="cName" />
            </div>
          </div>
          <label>Description</label>
          <textarea id="cDesc" rows="3"></textarea>
          <div class="actions" style="margin-top:12px;">
            <button id="saveCategory" class="btn success">Save Category</button>
            <button id="resetCategory" class="btn secondary">Reset</button>
            <button id="cancelCategory" class="btn secondary hidden">Cancel Edit</button>
          </div>
          <div id="categoryStatus" class="status"></div>
        </div>
        <div id="categoriesTable"></div>
      </div>
    </section>
  `;

  const transactionsPage = () => `
    <section id="transactions" class="hidden">
      <div class="header">
        <div class="brand">Transactions</div>
        <div class="actions">
          <button data-page="dashboard" class="btn secondary open-page">Back</button>
        </div>
      </div>
      <div class="container">
        <div class="card">
          <div class="title">Add Transaction</div>
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
            <div>
              <label>Product</label>
              <select id="tProduct"></select>
            </div>
            <div>
              <label>Quantity</label>
              <input id="tQty" type="number" min="1" value="1" />
            </div>
            <div>
              <label>Type</label>
              <select id="tType">
                <option value="Sale">Sale</option>
                <option value="Purchase">Purchase</option>
              </select>
            </div>
          </div>
          <div class="actions" style="margin-top:12px;">
            <button id="addTransaction" class="btn success">Add</button>
            <button id="refreshTransactions" class="btn ghost">Refresh</button>
          </div>
          <div id="transactionStatus" class="status"></div>
        </div>
        <div id="transactionsTable"></div>
      </div>
    </section>
  `;

  const init = () => {
    const app = $('#app');
    app.innerHTML = state.token
      ? dashboardPage() + categoriesPage() + productsPage() + transactionsPage()
      : loginPage();

    if (state.token) {
      initDashboard();
      initProducts();
      initCategories();
      initTransactions();
      show('dashboard');
    } else {
      initLogin();
      show('login');
    }
  };

  const initLogin = () => {
    on($('#loginBtn'), 'click', async () => {
      const email = $('#loginEmail').value.trim();
      const password = $('#loginPassword').value.trim();
      const errorEl = $('#loginError');
      errorEl.textContent = '';

      if (!email || !password) {
        errorEl.textContent = 'Enter email and password.';
        return;
      }

      $('#loginBtn').disabled = true;
      $('#loginBtn').textContent = 'Logging in...';

      try {
        const data = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        setAuth(data);
        init();
      } catch (err) {
        errorEl.textContent = err.message || 'Login failed.';
      } finally {
        $('#loginBtn').disabled = false;
        $('#loginBtn').textContent = 'Login';
      }
    });
  };

  const initDashboard = () => {
    on($('#logoutBtn'), 'click', () => {
      logout();
      init();
    });

    document.querySelectorAll('.open-page').forEach((btn) => {
      on(btn, 'click', async () => {
        const page = btn.dataset.page;
        show(page);
        if (page === 'products') await loadProducts();
        if (page === 'categories') await loadCategories();
        if (page === 'transactions') await loadTransactions();
      });
    });

    const doImport = async (file) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(IMS_API.BASE_URL + '/products/import', {
        method: 'POST',
        headers: {
          ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
        },
        body: form
      });
      if (!res.ok) throw new Error('Import failed');
      alert('Import completed.');
    };

    on($('#exportCsv'), 'click', async () => {
      const res = await fetch(IMS_API.BASE_URL + '/products/export', {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Export failed');
      const csv = await res.text();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_export.csv';
      a.click();
      URL.revokeObjectURL(url);
    });

    on($('#importCsv'), 'change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        $('#importCsv').disabled = true;
        await doImport(file);
        await loadProducts();
      } catch (err) {
        alert(err.message);
      } finally {
        $('#importCsv').disabled = false;
        $('#importCsv').value = '';
      }
    });
  };

  const initProducts = () => {
    const setProductForm = ({ id, name, price, quantityInStock, supplier, categoryId, description }) => {
      $('#pId').value = id || '';
      $('#pName').value = name || '';
      $('#pPrice').value = price ?? '';
      $('#pQty').value = quantityInStock ?? '';
      $('#pSupplier').value = supplier || '';
      $('#pDesc').value = description || '';
      $('#pCategory').value = categoryId || '';
      $('#productFormTitle').textContent = id ? 'Edit Product' : 'Add Product';
      $('#cancelProduct').classList.toggle('hidden', !id);
    };

    const resetProductForm = () => {
      state.editingProductId = null;
      $('#pId').value = '';
      $('#pName').value = '';
      $('#pPrice').value = '';
      $('#pQty').value = '';
      $('#pSupplier').value = '';
      $('#pDesc').value = '';
      $('#pCategory').value = '';
      $('#productStatus').textContent = '';
      $('#productFormTitle').textContent = 'Add Product';
      $('#cancelProduct').classList.add('hidden');
    };

    on($('#saveProduct'), 'click', async () => {
      const id = $('#pId').value.trim();
      const name = $('#pName').value.trim();
      const price = parseFloat($('#pPrice').value);
      const qty = parseInt($('#pQty').value, 10);
      const supplier = $('#pSupplier').value.trim();
      const categoryId = parseInt($('#pCategory').value, 10);
      const desc = $('#pDesc').value.trim();
      const status = $('#productStatus');
      status.textContent = '';

      if (!name || Number.isNaN(price) || Number.isNaN(qty) || Number.isNaN(categoryId)) {
        status.textContent = 'Fill required product fields.';
        return;
      }

      $('#saveProduct').disabled = true;
      try {
        if (id) {
          await api(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ id: parseInt(id, 10), name, price, quantityInStock: qty, supplier, categoryId, description: desc })
          });
          setStatus(status, 'Product updated.', 'success');
          state.editingProductId = null;
          $('#cancelProduct').classList.add('hidden');
          $('#productFormTitle').textContent = 'Add Product';
        } else {
          await api('/products', {
            method: 'POST',
            body: JSON.stringify({ name, price, quantityInStock: qty, supplier, categoryId, description: desc })
          });
          setStatus(status, 'Product created.', 'success');
          resetProductForm();
        }
        await loadProducts();
      } catch (err) {
        setStatus(status, err.message, 'error');
      } finally {
        $('#saveProduct').disabled = false;
      }
    });

    on($('#resetProduct'), 'click', () => resetProductForm());
    on($('#cancelProduct'), 'click', () => resetProductForm());

    on($('#productsTable'), 'click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const productId = btn.dataset.id;
      if (!productId) return;

      const product = state.products.find((p) => p.id == productId);
      if (!product) return;

      if (action === 'editProduct' && product) {
        state.editingProductId = product.id;
        setProductForm(product);
        $('#pName').focus();
        return;
      }

      if (action === 'deleteProduct' && product) {
        if (!confirm(`Delete product "${product.name}"?`)) return;
        try {
          await api(`/products/${product.id}`, { method: 'DELETE' });
          await loadProducts();
          if (state.editingProductId === product.id) resetProductForm();
        } catch (err) {
          $('#productStatus').style.color = '#dc2626';
          $('#productStatus').textContent = err.message;
        }
      }
    });
  };

  const initCategories = () => {
    const setCategoryForm = ({ id, name, description }) => {
      $('#cId').value = id || '';
      $('#cName').value = name || '';
      $('#cDesc').value = description || '';
      $('#categoryFormTitle').textContent = id ? 'Edit Category' : 'Add Category';
      $('#cancelCategory').classList.toggle('hidden', !id);
    };

    const resetCategoryForm = () => {
      state.editingCategoryId = null;
      $('#cId').value = '';
      $('#cName').value = '';
      $('#cDesc').value = '';
      $('#categoryStatus').textContent = '';
      $('#categoryFormTitle').textContent = 'Add Category';
      $('#cancelCategory').classList.add('hidden');
    };

    on($('#saveCategory'), 'click', async () => {
      const id = $('#cId').value.trim();
      const name = $('#cName').value.trim();
      const description = $('#cDesc').value.trim();
      const status = $('#categoryStatus');
      status.textContent = '';

      if (!name) {
        status.textContent = 'Category name is required.';
        return;
      }

      $('#saveCategory').disabled = true;
      try {
        if (id) {
          await api(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ id: parseInt(id, 10), name, description })
          });
          setStatus(status, 'Category updated.', 'success');
          state.editingCategoryId = null;
          $('#cancelCategory').classList.add('hidden');
          $('#categoryFormTitle').textContent = 'Add Category';
        } else {
          await api('/categories', {
            method: 'POST',
            body: JSON.stringify({ name, description })
          });
          setStatus(status, 'Category created.', 'success');
          resetCategoryForm();
        }
        await loadCategories();
      } catch (err) {
        setStatus(status, err.message, 'error');
      } finally {
        $('#saveCategory').disabled = false;
      }
    });

    on($('#resetCategory'), 'click', () => resetCategoryForm());
    on($('#cancelCategory'), 'click', () => resetCategoryForm());

    on($('#categoriesTable'), 'click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const categoryId = btn.dataset.id;
      if (!categoryId) return;

      const category = state.categories.find((c) => c.id == categoryId);
      if (!category) return;

      if (action === 'editCategory' && category) {
        state.editingCategoryId = category.id;
        setCategoryForm(category);
        $('#cName').focus();
        return;
      }

      if (action === 'deleteCategory' && category) {
        if (!confirm(`Delete category "${category.name}"? This may affect linked products.`)) return;
        try {
          await api(`/categories/${category.id}`, { method: 'DELETE' });
          await loadCategories();
          if (state.editingCategoryId === category.id) resetCategoryForm();
        } catch (err) {
          $('#categoryStatus').style.color = '#dc2626';
          $('#categoryStatus').textContent = err.message;
        }
      }
    });
  };

  const initTransactions = () => {
    on($('#addTransaction'), 'click', async () => {
      const productId = parseInt($('#tProduct').value, 10);
      const qty = parseInt($('#tQty').value, 10);
      const type = $('#tType').value;
      const status = $('#transactionStatus');
      status.textContent = '';

      if (Number.isNaN(productId) || Number.isNaN(qty) || qty < 1) {
        status.textContent = 'Select a product and quantity.';
        return;
      }

      const product = state.products.find((p) => p.id === productId);
      if (!product) {
        status.textContent = 'Selected product not found.';
        return;
      }

      $('#addTransaction').disabled = true;
      try {
        await api('/transactions', {
          method: 'POST',
          body: JSON.stringify({ productId, productName: product.name, quantity: qty, type, totalAmount: product.price * qty })
        });
        setStatus(status, 'Transaction added.', 'success');
        $('#tQty').value = 1;
        await loadTransactions();
      } catch (err) {
        setStatus(status, err.message, 'error');
      } finally {
        $('#addTransaction').disabled = false;
      }
    });

    on($('#refreshTransactions'), 'click', () => loadTransactions());
  };

  const loadCategories = async () => {
    try {
      const categories = await api('/categories');
      state.categories = categories;
      renderTable('categoriesTable', categories, [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description', value: (c) => c.description || '' }
      ], (category) => {
        if (!category) return '';
        return `
          <div class="actions">
            <button class="btn secondary" data-action="editCategory" data-id="${category.id}">Edit</button>
            <button class="btn danger" data-action="deleteCategory" data-id="${category.id}">Delete</button>
          </div>
        `;
      });
    } catch (err) {
      $('#categoriesTable').innerHTML = `<div class="card">${esc(err.message)}</div>`;
    }
  };

  const loadProducts = async () => {
    try {
      state.products = await api('/products');
      state.categories = await api('/categories');
      const catSelect = $('#pCategory');
      catSelect.innerHTML = state.categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
      renderTable('productsTable', state.products, [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'price', label: 'Price', value: (p) => p.price.toFixed(2) },
        { key: 'quantityInStock', label: 'Qty' },
        { key: 'supplier', label: 'Supplier', value: (p) => p.supplier || '' },
        { key: 'categoryId', label: 'Category', value: (p) => (state.categories.find((c) => c.id === p.categoryId) || {}).name || p.categoryId }
      ], (product) => {
        if (!product) return '';
        return `
          <div class="actions">
            <button class="btn secondary" data-action="editProduct" data-id="${product.id}">Edit</button>
            <button class="btn danger" data-action="deleteProduct" data-id="${product.id}">Delete</button>
          </div>
        `;
      });
    } catch (err) {
      $('#productsTable').innerHTML = `<div class="card">${esc(err.message)}</div>`;
    }
  };

  const loadTransactions = async () => {
    try {
      state.products = await api('/products');
      state.transactions = await api('/transactions');
      const productSelect = $('#tProduct');
      productSelect.innerHTML = state.products.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
      renderTable('transactionsTable', state.transactions, [
        { key: 'id', label: 'ID' },
        { key: 'productName', label: 'Product' },
        { key: 'type', label: 'Type' },
        { key: 'quantity', label: 'Qty' },
        { key: 'totalAmount', label: 'Amount', value: (t) => Number(t.totalAmount).toFixed(2) },
        { key: 'date', label: 'Date', value: (t) => new Date(t.date).toLocaleString() }
      ]);
    } catch (err) {
      $('#transactionsTable').innerHTML = `<div class="card">${esc(err.message)}</div>`;
    }
  };

  init();
})();
