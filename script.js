const INGREDIENTS = {
  corn: { name: 'Frozen Corn', price: 2, color: '#f4c95d' },
  peas: { name: 'Frozen Peas', price: 3, color: '#7ebf5b' },
  carrots: { name: 'Frozen Carrots', price: 2.5, color: '#e98e47' },
};

const ORDER_LIBRARY = [
  { ratios: { corn: 2, peas: 1, carrots: 1 }, payout: 12 },
  { ratios: { corn: 1, peas: 2, carrots: 1 }, payout: 13 },
  { ratios: { corn: 1, peas: 1, carrots: 2 }, payout: 14 },
  { ratios: { corn: 3, peas: 1, carrots: 2 }, payout: 16 },
  { ratios: { corn: 4, peas: 2, carrots: 1 }, payout: 18 },
  { ratios: { corn: 1, peas: 3, carrots: 2 }, payout: 17 },
  { ratios: { corn: 2, peas: 2, carrots: 1 }, payout: 15 },
  { ratios: { corn: 1, peas: 1, carrots: 1 }, payout: 11 },
];

const CUSTOMER_NAMES = [
  'Maya', 'Theo', 'Lina', 'Raf', 'Nora', 'Seth', 'Ari', 'Poppy', 'Jules', 'Milo'
];

const state = {
  money: 25,
  reputation: 0,
  day: 1,
  inventory: { corn: 0, peas: 0, carrots: 0 },
  soup: { corn: 0, peas: 0, carrots: 0 },
  customer: null,
  servedToday: 0,
};

const elements = {
  money: document.getElementById('money'),
  reputation: document.getElementById('reputation'),
  day: document.getElementById('day'),
  store: document.getElementById('store'),
  pot: document.getElementById('pot'),
  totalSoup: document.getElementById('total-soup'),
  ratioReadout: document.getElementById('ratio-readout'),
  customerName: document.getElementById('customer-name'),
  customerOrder: document.getElementById('customer-order'),
  orderBars: document.getElementById('order-bars'),
  message: document.getElementById('message'),
  clearPot: document.getElementById('clear-pot'),
  serveBtn: document.getElementById('serve-btn'),
  nextCustomerBtn: document.getElementById('next-customer-btn'),
};

function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

function getSoupTotal() {
  return Object.values(state.soup).reduce((total, value) => total + value, 0);
}

function ratioToText(ratios) {
  return `${ratios.corn}:${ratios.peas}:${ratios.carrots}`;
}

function orderTextFor(ratios) {
  const entries = Object.entries(ratios);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const percentages = entries.map(([key, value]) => {
    const percent = Math.round((value / total) * 100);
    return `${capitalize(key)} ${percent}%`;
  });
  return percentages.join(' / ');
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function setMessage(text, type = 'info') {
  elements.message.textContent = text;
  elements.message.className = `message ${type}`;
}

function randomCustomer() {
  const order = ORDER_LIBRARY[Math.floor(Math.random() * ORDER_LIBRARY.length)];
  return {
    name: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
    ratios: { ...order.ratios },
    payout: order.payout,
    tolerance: 0.18,
  };
}

function renderStore() {
  elements.store.innerHTML = '';

  Object.entries(INGREDIENTS).forEach(([key, item]) => {
    const card = document.createElement('div');
    card.className = 'store-item';

    const stock = state.inventory[key];
    const sellButton = document.createElement('button');
    sellButton.className = 'action-btn';
    sellButton.textContent = `Buy 1 bag`;
    sellButton.addEventListener('click', () => buyIngredient(key, 1));

    const bulkButton = document.createElement('button');
    bulkButton.className = 'action-btn';
    bulkButton.textContent = 'Buy 5';
    bulkButton.addEventListener('click', () => buyIngredient(key, 5));

    card.innerHTML = `
      <div class="store-item-head">
        <h3>${item.name}</h3>
        <span class="chip ${key}">${stock} in stock</span>
      </div>
      <div class="meta">
        <span>Price</span>
        <strong>${formatMoney(item.price)}</strong>
      </div>
    `;

    const actions = document.createElement('div');
    actions.className = 'store-actions';
    actions.appendChild(sellButton);
    actions.appendChild(bulkButton);
    card.appendChild(actions);
    elements.store.appendChild(card);
  });
}

function renderPot() {
  elements.pot.innerHTML = '';

  Object.entries(INGREDIENTS).forEach(([key, item]) => {
    const row = document.createElement('div');
    row.className = 'pot-row';

    const name = document.createElement('div');
    name.className = 'name';
    name.innerHTML = `<span class="pot-dot" style="background:${item.color}"></span><span>${item.name}</span>`;

    const controls = document.createElement('div');
    controls.className = 'pot-icons';

    const minus = document.createElement('button');
    minus.textContent = '−';
    minus.addEventListener('click', () => removeFromPot(key, 1));

    const plus = document.createElement('button');
    plus.textContent = '+';
    plus.addEventListener('click', () => addToPot(key, 1));

    controls.appendChild(minus);
    controls.appendChild(plus);

    const qty = document.createElement('div');
    qty.className = 'pot-total';
    qty.textContent = state.soup[key];

    row.appendChild(name);
    row.appendChild(controls);
    row.appendChild(qty);
    elements.pot.appendChild(row);
  });

  const total = getSoupTotal();
  const totalRatio = `${state.soup.corn}:${state.soup.peas}:${state.soup.carrots}`;
  elements.totalSoup.textContent = total;
  elements.ratioReadout.textContent = total > 0 ? totalRatio : '0:0:0';
}

function renderCustomer() {
  if (!state.customer) {
    state.customer = randomCustomer();
  }

  const { name, ratios, payout } = state.customer;
  elements.customerName.textContent = name;
  elements.customerOrder.textContent = `${name} wants a soup with ratio ${ratioToText(ratios)} (${orderTextFor(ratios)}) — pays $${payout}.`;

  const total = Object.values(ratios).reduce((sum, value) => sum + value, 0);
  elements.orderBars.innerHTML = '';

  Object.entries(ratios).forEach(([key, value]) => {
    const row = document.createElement('div');
    row.className = 'bar-row';

    const label = document.createElement('span');
    label.textContent = key;

    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.style.width = `${(value / total) * 100}%`;
    fill.style.background = INGREDIENTS[key].color;
    track.appendChild(fill);

    const percent = document.createElement('strong');
    percent.textContent = `${Math.round((value / total) * 100)}%`;

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(percent);
    elements.orderBars.appendChild(row);
  });
}

function renderHUD() {
  elements.money.textContent = formatMoney(state.money);
  elements.reputation.textContent = state.reputation;
  elements.day.textContent = state.day;
}

function buyIngredient(key, amount) {
  const item = INGREDIENTS[key];
  const subtotal = item.price * amount;

  if (state.money < subtotal) {
    setMessage(`You need ${formatMoney(subtotal - state.money)} more to buy ${amount} ${item.name.toLowerCase()} bag(s).`, 'failed');
    return;
  }

  state.money -= subtotal;
  state.inventory[key] += amount;
  setMessage(`Bought ${amount} bag(s) of ${item.name}.`, 'success');
  renderStore();
  renderHUD();
}

function addToPot(key, amount) {
  if (state.inventory[key] <= 0) {
    setMessage(`No ${INGREDIENTS[key].name.toLowerCase()} left in stock.`, 'failed');
    return;
  }

  state.inventory[key] -= amount;
  state.soup[key] += amount;
  setMessage(`Added ${amount} ${INGREDIENTS[key].name.toLowerCase()} to the pot.`, 'info');
  renderStore();
  renderPot();
}

function removeFromPot(key, amount) {
  if (state.soup[key] <= 0) {
    return;
  }

  const amountToRemove = Math.min(amount, state.soup[key]);
  state.soup[key] -= amountToRemove;
  state.inventory[key] += amountToRemove;
  setMessage(`Removed ${amountToRemove} ${INGREDIENTS[key].name.toLowerCase()} from the pot.`, 'info');
  renderStore();
  renderPot();
}

function clearPot() {
  Object.keys(INGREDIENTS).forEach((key) => {
    state.inventory[key] += state.soup[key];
    state.soup[key] = 0;
  });

  setMessage('The pot is empty and ingredients are back in stock.', 'info');
  renderStore();
  renderPot();
}

function computeDifference(actual, target) {
  const combined = Object.keys(INGREDIENTS).reduce((sum, key) => sum + actual[key] + target[key], 0);
  if (combined === 0) {
    return 1;
  }

  let totalError = 0;
  Object.keys(INGREDIENTS).forEach((key) => {
    const actualRatio = actual[key] / Math.max(1, getSoupTotal());
    const targetRatio = target[key] / Object.values(target).reduce((sum, value) => sum + value, 0);
    totalError += Math.abs(actualRatio - targetRatio);
  });

  return totalError / 2;
}

function serveSoup() {
  if (getSoupTotal() === 0) {
    setMessage('The pot is empty. Buy ingredients and add them before serving.', 'failed');
    return;
  }

  const target = state.customer.ratios;
  const actual = state.soup;
  const actualTotal = getSoupTotal();
  const targetTotal = Object.values(target).reduce((sum, value) => sum + value, 0);

  let diff = 0;
  Object.keys(INGREDIENTS).forEach((key) => {
    const actualRatio = actual[key] / actualTotal;
    const targetRatio = target[key] / targetTotal;
    diff += Math.abs(actualRatio - targetRatio);
  });

  const matchScore = 1 - diff / 2;
  const isWin = diff <= state.customer.tolerance;

  if (isWin) {
    state.money += state.customer.payout;
    state.reputation += 1;
    state.servedToday += 1;
    setMessage(`Perfect! ${state.customer.name} loved the soup. You earned ${formatMoney(state.customer.payout)}.`, 'success');
  } else {
    state.reputation = Math.max(0, state.reputation - 1);
    state.money = Math.max(0, state.money - 2);
    setMessage(`Close, but not close enough. ${state.customer.name} wanted ${ratioToText(target)} and your soup was ${ratioToText(actual)}.`, 'failed');
  }

  const resultText = isWin ? `Match quality: ${Math.max(0, Math.round(matchScore * 100))}%` : `Order missed by ${diff.toFixed(2)}`;
  setMessage(`${isWin ? 'Great job!' : 'Not this time.'} ${resultText}.`, isWin ? 'success' : 'failed');

  Object.keys(INGREDIENTS).forEach((key) => {
    state.soup[key] = 0;
  });

  renderHUD();
  renderStore();
  renderPot();

  state.customer = null;
  renderCustomer();
}

function nextCustomer() {
  state.customer = randomCustomer();
  renderCustomer();
  setMessage('A new customer walks in to try your soup.', 'info');
}

function initialize() {
  renderHUD();
  renderStore();
  renderPot();
  renderCustomer();

  elements.clearPot.addEventListener('click', clearPot);
  elements.serveBtn.addEventListener('click', serveSoup);
  elements.nextCustomerBtn.addEventListener('click', nextCustomer);
}

initialize();
