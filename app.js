(() => {
  'use strict';
  const KEY = { orders: 'dede_demo_orders_v1', sales: 'dede_demo_sales_v1', stock: 'dede_demo_stock_v1' };
  const seedOrders = [
    { id: 'OS-2026-0011', customer: 'Camila Demo', vehicle: 'Toyota Corolla · 2016', plate: 'ABC1D23', service: 'Revisão 80.000 km', status: 'Em serviço', createdAt: '2026-10-06T10:20:00' },
    { id: 'OS-2026-0012', customer: 'Roberto Demo', vehicle: 'Fiat Argo · 2021', plate: 'DEF4G56', service: 'Freios e suspensão', status: 'Aguardando aprovação', createdAt: '2026-10-06T13:15:00' },
    { id: 'OS-2026-0013', customer: 'Rafael Demo', vehicle: 'Honda Fit · 2014', plate: 'GHI7J89', service: 'Troca de óleo e filtros', status: 'Pronto para retirada', createdAt: '2026-10-07T08:30:00' }
  ];
  const seedStock = [
    { id: 'oil', name: 'Óleo sintético 5W30', category: 'Lubrificantes', qty: 8, min: 3, unit: 'un.' },
    { id: 'filter', name: 'Filtro de óleo universal', category: 'Filtros', qty: 5, min: 2, unit: 'un.' },
    { id: 'brake', name: 'Pastilhas de freio (par)', category: 'Freios', qty: 2, min: 3, unit: 'par' },
    { id: 'coolant', name: 'Aditivo para radiador', category: 'Fluidos', qty: 7, min: 2, unit: 'un.' },
    { id: 'lamp', name: 'Lâmpada automotiva H7', category: 'Elétrica', qty: 4, min: 2, unit: 'un.' }
  ];
  const products = [
    { id: 'service-oil', name: 'Serviço: troca de óleo', description: 'Mão de obra · valor fictício', price: 85, stockId: null },
    { id: 'oil', name: 'Óleo sintético 5W30', description: 'Lubrificante · unidade', price: 48, stockId: 'oil' },
    { id: 'filter', name: 'Filtro de óleo universal', description: 'Filtro · unidade', price: 32, stockId: 'filter' },
    { id: 'brake', name: 'Pastilhas de freio (par)', description: 'Peça · valor demonstrativo', price: 210, stockId: 'brake' },
    { id: 'coolant', name: 'Aditivo para radiador', description: 'Fluido · unidade', price: 27, stockId: 'coolant' },
    { id: 'checkup', name: 'Diagnóstico preventivo', description: 'Serviço · valor demonstrativo', price: 65, stockId: null }
  ];
  const statusOptions = ['Recebido', 'Aguardando aprovação', 'Em serviço', 'Pronto para retirada'];
  const statusClass = { 'Recebido': 'blue', 'Aguardando aprovação': 'orange', 'Em serviço': '', 'Pronto para retirada': 'green' };
  let cart = [];
  let toastTimer;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = value => JSON.parse(JSON.stringify(value));
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  const read = (key, fallback) => {
    try { const value = localStorage.getItem(key); return value === null ? clone(fallback) : JSON.parse(value); }
    catch { return clone(fallback); }
  };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { showToast('Não foi possível salvar neste navegador.'); } };
  function ensureSeeds() {
    if (localStorage.getItem(KEY.orders) === null) save(KEY.orders, seedOrders);
    if (localStorage.getItem(KEY.sales) === null) save(KEY.sales, []);
    if (localStorage.getItem(KEY.stock) === null) save(KEY.stock, seedStock);
  }
  const getOrders = () => read(KEY.orders, seedOrders);
  const getSales = () => read(KEY.sales, []);
  const getStock = () => read(KEY.stock, seedStock);
  const setOrders = value => save(KEY.orders, value);
  const getStatusLabel = status => status || 'Recebido';
  const fmtDate = date => { const d = new Date(date); return Number.isNaN(d.getTime()) ? 'Data demonstrativa' : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(d); };
  const nextOrderId = () => {
    const nums = getOrders().map(o => Number((o.id.match(/(\d+)$/) || [])[1]) || 0);
    return `OS-2026-${String(Math.max(13, ...nums) + 1).padStart(4, '0')}`;
  };
  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3100);
  }
  function statusPill(status) { return `<span class="status-pill ${statusClass[status] || ''}">${escapeHtml(status)}</span>`; }

  function initPublic() {
    const menuToggle = $('.menu-toggle');
    const mainNav = $('#mainNav');
    menuToggle?.addEventListener('click', () => {
      const open = mainNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });
    $$('#mainNav a').forEach(link => link.addEventListener('click', () => {
      mainNav?.classList.remove('is-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }));

    const dialog = $('#requestDialog');
    $$('[data-open-request]').forEach(button => button.addEventListener('click', () => {
      if (!dialog) return;
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
      const serviceField = $('select[name="service"]', dialog);
      if (serviceField && button.dataset.service) {
        const option = [...serviceField.options].find(item => item.text.trim() === button.dataset.service);
        if (option) serviceField.value = option.value;
      }
    }));
    $('[data-close-dialog]')?.addEventListener('click', () => dialog?.close());
    dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    $('[data-scroll-track]')?.addEventListener('click', () => $('#acompanhar')?.scrollIntoView({ behavior: 'smooth' }));

    $('#serviceRequestForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const order = {
        id: nextOrderId(),
        customer: String(data.get('customer') || '').trim(),
        phone: String(data.get('phone') || '').trim(),
        vehicle: String(data.get('vehicle') || '').trim(),
        plate: String(data.get('plate') || 'N/D').trim().toUpperCase(),
        service: String(data.get('service') || 'Solicitação de atendimento'),
        details: String(data.get('details') || '').trim(),
        status: 'Recebido',
        createdAt: new Date().toISOString(),
        demo: true
      };
      const orders = getOrders();
      orders.unshift(order);
      setOrders(orders);
      const feedback = $('#requestFeedback');
      feedback.textContent = `Solicitação fictícia criada. Código para acompanhar: ${order.id}`;
      form.reset();
      showToast(`Solicitação demo criada · ${order.id}`);
      setTimeout(() => { if (dialog?.open) dialog.close(); }, 1600);
    });

    $('#trackingForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const code = String(new FormData(event.currentTarget).get('code') || '').trim().toUpperCase();
      const order = getOrders().find(item => item.id.toUpperCase() === code);
      const result = $('#trackingResult');
      if (!result) return;
      if (!order) {
        result.innerHTML = '<div class="track-result-card"><strong>Não encontramos essa ordem demonstrativa.</strong><span>Confira o código. Exemplos: OS-2026-0011, OS-2026-0012 ou OS-2026-0013.</span></div>';
        return;
      }
      result.innerHTML = `<div class="track-result-card"><strong>${escapeHtml(order.id)} · ${escapeHtml(order.status)}</strong><span>${escapeHtml(order.vehicle)} · ${escapeHtml(order.service)}</span><p>Registro fictício de demonstração; não representa atendimento real.</p></div>`;
    });
  }

  function initPanel() {
    const panelSections = $$('[data-panel-section]');
    if (!panelSections.length) return;
    const titles = { overview: 'Visão geral', orders: 'Ordens de serviço', pos: 'Caixa / PDV', stock: 'Estoque demonstrativo', settings: 'Dados da demonstração' };
    function setPanelView(name) {
      panelSections.forEach(section => section.classList.toggle('is-active', section.dataset.panelSection === name));
      $$('.panel-nav [data-panel-target]').forEach(button => button.classList.toggle('active', button.dataset.panelTarget === name));
      const title = $('#panelPageTitle');
      if (title) title.textContent = titles[name] || titles.overview;
      try { history.replaceState(null, '', `#${name}`); } catch { /* local preview */ }
    }
    $$('[data-panel-target]').forEach(button => button.addEventListener('click', () => setPanelView(button.dataset.panelTarget)));
    const initialView = location.hash.replace('#', '');
    setPanelView(titles[initialView] ? initialView : 'overview');

    $$('[data-toggle-order-form]').forEach(button => button.addEventListener('click', () => {
      const form = $('#quickOrderForm');
      if (!form) return;
      form.hidden = !form.hidden;
      if (!form.hidden) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }));
    $('#quickOrderForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const orders = getOrders();
      orders.unshift({ id: nextOrderId(), customer: String(data.get('customer')).trim(), vehicle: String(data.get('vehicle')).trim(), plate: String(data.get('plate') || 'N/D').trim().toUpperCase(), service: String(data.get('service')).trim(), status: 'Recebido', createdAt: new Date().toISOString(), demo: true });
      setOrders(orders);
      form.reset();
      form.hidden = true;
      renderAll();
      showToast('Ordem fictícia adicionada.');
    });
    $('#orderSearch')?.addEventListener('input', renderOrdersTable);
    $('#orderStatusFilter')?.addEventListener('change', renderOrdersTable);

    $('#ordersTableBody')?.addEventListener('change', event => {
      const select = event.target.closest('[data-order-status]');
      if (!select) return;
      const orders = getOrders();
      const order = orders.find(item => item.id === select.dataset.id);
      if (order) { order.status = select.value; setOrders(orders); renderAll(); showToast(`${order.id} atualizada para “${order.status}”.`); }
    });
    $('#ordersTableBody')?.addEventListener('click', event => {
      const btn = event.target.closest('[data-order-delete]');
      if (!btn) return;
      if (!window.confirm('Remover esta ordem fictícia deste navegador?')) return;
      setOrders(getOrders().filter(order => order.id !== btn.dataset.orderDelete));
      renderAll(); showToast('Ordem demonstrativa removida.');
    });

    $('#productGrid')?.addEventListener('click', event => {
      const button = event.target.closest('[data-product-add]');
      if (!button) return;
      const product = products.find(item => item.id === button.dataset.productAdd);
      if (!product) return;
      const stockItem = product.stockId ? getStock().find(item => item.id === product.stockId) : null;
      const inCart = cart.find(item => item.id === product.id)?.qty || 0;
      if (stockItem && inCart >= stockItem.qty) { showToast('Estoque demonstrativo insuficiente para adicionar mais.'); return; }
      const line = cart.find(item => item.id === product.id);
      if (line) line.qty += 1; else cart.push({ ...product, qty: 1 });
      renderCart();
    });
    $('#cartItems')?.addEventListener('click', event => {
      const button = event.target.closest('[data-cart-remove]');
      if (!button) return;
      cart = cart.filter(item => item.id !== button.dataset.cartRemove);
      renderCart();
    });
    $('#clearCart')?.addEventListener('click', () => { cart = []; renderCart(); });
    $('#checkoutButton')?.addEventListener('click', () => {
      if (!cart.length) { showToast('Adicione um item demonstrativo primeiro.'); return; }
      const stock = getStock();
      for (const line of cart) {
        if (line.stockId) {
          const item = stock.find(entry => entry.id === line.stockId);
          if (!item || item.qty < line.qty) { showToast(`Saldo demonstrativo insuficiente: ${line.name}.`); return; }
        }
      }
      const total = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
      const sales = getSales();
      const sale = { id: `VEN-DEMO-${String(sales.length + 1).padStart(3, '0')}`, total, payment: $('#paymentMethod')?.value || 'Demo', items: clone(cart), createdAt: new Date().toISOString() };
      sales.unshift(sale);
      save(KEY.sales, sales);
      cart.forEach(line => { if (line.stockId) { const item = stock.find(entry => entry.id === line.stockId); if (item) item.qty = Math.max(0, item.qty - line.qty); } });
      save(KEY.stock, stock);
      cart = [];
      renderAll();
      const feedback = $('#checkoutFeedback');
      if (feedback) feedback.textContent = `Venda fictícia ${sale.id} registrada: ${money(total)}.`;
      showToast(`Venda demo registrada · ${money(total)}.`);
    });

    $('#stockTableBody')?.addEventListener('click', event => {
      const button = event.target.closest('[data-stock-adjust]');
      if (!button) return;
      const stock = getStock();
      const item = stock.find(entry => entry.id === button.dataset.stockId);
      if (!item) return;
      item.qty = Math.max(0, item.qty + Number(button.dataset.stockAdjust));
      save(KEY.stock, stock);
      renderStock();
      showToast(`Estoque demonstrativo de “${item.name}” atualizado.`);
    });
    $('#resetDemo')?.addEventListener('click', () => {
      if (!window.confirm('Restaurar ordens e estoque aos exemplos iniciais e apagar vendas criadas neste navegador?')) return;
      save(KEY.orders, seedOrders);
      save(KEY.sales, []);
      save(KEY.stock, seedStock);
      cart = [];
      renderAll();
      showToast('Dados fictícios restaurados.');
    });
  }

  function renderOrdersTable() {
    const body = $('#ordersTableBody');
    if (!body) return;
    const search = String($('#orderSearch')?.value || '').trim().toLowerCase();
    const status = $('#orderStatusFilter')?.value || '';
    const orders = getOrders().filter(order => {
      const haystack = `${order.id} ${order.customer} ${order.vehicle} ${order.service} ${order.plate || ''}`.toLowerCase();
      return (!search || haystack.includes(search)) && (!status || order.status === status);
    });
    if (!orders.length) { body.innerHTML = '<tr><td colspan="5"><div class="empty-state">Nenhuma ordem demonstrativa encontrada.</div></td></tr>'; return; }
    body.innerHTML = orders.map(order => `<tr><td><b>${escapeHtml(order.id)}</b><small>${escapeHtml(order.customer)} · ${fmtDate(order.createdAt)}</small></td><td><b>${escapeHtml(order.vehicle)}</b><small>Placa demo: ${escapeHtml(order.plate || 'N/D')}</small></td><td>${escapeHtml(order.service)}</td><td><select class="select-status" data-order-status data-id="${escapeHtml(order.id)}" aria-label="Alterar status de ${escapeHtml(order.id)}">${statusOptions.map(option => `<option ${option === order.status ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select></td><td><div class="table-actions"><button type="button" data-order-delete="${escapeHtml(order.id)}">Remover</button></div></td></tr>`).join('');
  }

  function renderRecentOrders() {
    const root = $('#recentOrders');
    if (!root) return;
    const orders = getOrders().slice(0, 4);
    root.innerHTML = orders.length ? orders.map(order => `<div class="status-row"><div><b>${escapeHtml(order.id)} · ${escapeHtml(order.vehicle)}</b><small>${escapeHtml(order.customer)} · ${escapeHtml(order.service)}</small></div>${statusPill(order.status)}</div>`).join('') : '<div class="empty-state">Ainda não há ordens demonstrativas.</div>';
  }

  function renderMetrics() {
    const orders = getOrders();
    const sales = getSales();
    const open = orders.filter(order => order.status !== 'Pronto para retirada').length;
    const approvals = orders.filter(order => order.status === 'Aguardando aprovação').length;
    const revenue = sales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
    if ($('#metricOpenOrders')) $('#metricOpenOrders').textContent = String(open);
    if ($('#metricApprovals')) $('#metricApprovals').textContent = String(approvals);
    if ($('#metricSales')) $('#metricSales').textContent = String(sales.length);
    if ($('#metricRevenue')) $('#metricRevenue').textContent = money(revenue);
  }

  function renderProducts() {
    const root = $('#productGrid');
    if (!root) return;
    const stock = getStock();
    root.innerHTML = products.map(product => {
      const item = product.stockId ? stock.find(entry => entry.id === product.stockId) : null;
      const quantity = item ? ` · ${item.qty} em estoque demo` : ' · serviço';
      const disabled = item && item.qty <= 0 ? ' disabled' : '';
      return `<article class="pos-product"><div class="pos-product-top"><h3>${escapeHtml(product.name)}</h3><span class="demo-chip">DEMO</span></div><small>${escapeHtml(product.description)}${escapeHtml(quantity)}</small><strong>${money(product.price)}</strong><button type="button" data-product-add="${escapeHtml(product.id)}"${disabled}>Adicionar à venda</button></article>`;
    }).join('');
  }

  function renderCart() {
    const root = $('#cartItems');
    if (!root) return;
    if (!cart.length) root.innerHTML = '<div class="empty-state">Carrinho demonstrativo vazio.<br>Adicione uma peça ou serviço.</div>';
    else root.innerHTML = cart.map(item => `<div class="cart-line"><div><b>${escapeHtml(item.name)}</b><small>${item.qty} × ${money(item.price)}</small></div><div><b>${money(item.qty * item.price)}</b><br><button type="button" data-cart-remove="${escapeHtml(item.id)}">Remover</button></div></div>`).join('');
    const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
    if ($('#cartTotal')) $('#cartTotal').textContent = money(total);
  }

  function renderSales() {
    const root = $('#salesHistory');
    if (!root) return;
    const sales = getSales().slice(0, 5);
    if (!sales.length) { root.innerHTML = '<div class="empty-state">Nenhuma venda demonstrativa registrada neste navegador.</div>'; return; }
    root.innerHTML = `<div class="panel-table-wrap"><table class="panel-table"><thead><tr><th>CÓDIGO</th><th>DATA</th><th>PAGAMENTO DEMO</th><th>TOTAL FICTÍCIO</th></tr></thead><tbody>${sales.map(sale => `<tr><td><b>${escapeHtml(sale.id)}</b></td><td>${fmtDate(sale.createdAt)}</td><td>${escapeHtml(sale.payment)}</td><td><b>${money(sale.total)}</b></td></tr>`).join('')}</tbody></table></div>`;
  }

  function renderStock() {
    const body = $('#stockTableBody');
    if (!body) return;
    const stock = getStock();
    body.innerHTML = stock.map(item => `<tr><td><b>${escapeHtml(item.name)}</b></td><td>${escapeHtml(item.category)}</td><td><b>${item.qty} ${escapeHtml(item.unit)}</b></td><td>${item.min} ${escapeHtml(item.unit)}</td><td><span class="${item.qty <= item.min ? 'stock-low' : 'stock-ok'}">${item.qty <= item.min ? 'Repor (demo)' : 'Em estoque (demo)'}</span></td><td><div class="stock-adjust"><button type="button" data-stock-adjust="-1" data-stock-id="${escapeHtml(item.id)}" aria-label="Diminuir ${escapeHtml(item.name)}">−</button><span>${item.qty}</span><button type="button" data-stock-adjust="1" data-stock-id="${escapeHtml(item.id)}" aria-label="Aumentar ${escapeHtml(item.name)}">+</button></div></td></tr>`).join('');
  }

  function renderAll() {
    renderMetrics();
    renderRecentOrders();
    renderOrdersTable();
    renderProducts();
    renderCart();
    renderSales();
    renderStock();
  }

  ensureSeeds();
  initPublic();
  initPanel();
  renderAll();
})();
