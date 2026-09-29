const SUPABASE_URL = 'https://qzwuptmldyksjlcynrcy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_41R3PSkaLqwvgrnRg38spw_0ytE-OPD';

let supabaseClient;
let products = [];
let cart = JSON.parse(localStorage.getItem('kf_cart') || '[]');

const money = n =>
  Number(n).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' ₽';

function saveCart() {
  localStorage.setItem('kf_cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (el) el.textContent = cart.length;
}

function toast(text) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = text;
  setTimeout(() => {
    el.textContent = '';
  }, 2500);
}

function initSupabase() {
  if (!window.supabase) {
    document.getElementById('app').innerHTML = `
      <section class="section">
        <h2>Ошибка загрузки</h2>
        <p>Не загрузилась библиотека Supabase.</p>
      </section>
    `;
    return false;
  }

  if (SUPABASE_KEY === 'ВСТАВЬ_СЮДА_СВОЙ_PUBLISHABLE_KEY') {
    document.getElementById('app').innerHTML = `
      <section class="section">
        <h2>Нужно указать ключ Supabase</h2>
        <p>Открой app.js и вставь свой Publishable key.</p>
      </section>
    `;
    return false;
  }

  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  return true;
}

async function loadProducts() {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Supabase error:', error);

    document.getElementById('app').innerHTML = `
      <section class="section">
        <h2>Не удалось загрузить каталог</h2>
        <p>Проверь подключение Supabase и Publishable key.</p>
      </section>
    `;
    return;
  }

  products = data.map(p => ({
    id: p.id,
    name: p.name,
    platform: p.platform,
    price: Number(p.price),
    old: p.old_price ? Number(p.old_price) : null,
    icon: p.icon || '🎮',
    genre: p.genre || '',
    region: p.region || '',
    desc: p.description || ''
  }));

  render();
}

function card(p) {
  return `
    <article class="card">
      <a href="#/product/${p.id}">
        <div class="cover">${p.icon}</div>
      </a>

      <div class="card-body">
        <span class="tag">${p.platform} · ${p.region}</span>

        <h3>${p.name}</h3>

        <p>${p.desc}</p>

        <div class="row">
          <strong>${money(p.price)}</strong>

          ${
            p.old
              ? `<del>${money(p.old)}</del>`
              : ''
          }

          <button
            class="smallbtn"
            onclick="addToCart(${p.id}); event.preventDefault();"
          >
            В корзину
          </button>
        </div>
      </div>
    </article>
  `;
}

function home() {
  const featured = products.slice(0, 8);

  return `
    <section class="hero">
      <div>
        <span class="tag">KEYFORGE</span>
        <h1>Игры дешевле.<br>Покупка проще.</h1>
        <p>
          Цифровые игры для Steam, EA и Ubisoft.
          Быстрая покупка и доставка ключа.
        </p>

        <a class="btn" href="#/catalog">
          Смотреть каталог
        </a>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Популярные игры</h2>
        <a href="#/catalog">Весь каталог →</a>
      </div>

      <div class="grid">
        ${
          featured.length
            ? featured.map(card).join('')
            : '<p>Загрузка каталога...</p>'
        }
      </div>
    </section>
  `;
}

function catalog() {
  return `
    <section class="section">
      <div class="section-head">
        <div>
          <span class="tag">МАГАЗИН</span>
          <h2>Каталог игр</h2>
        </div>
      </div>

      <div class="grid">
        ${
          products.length
            ? products.map(card).join('')
            : '<p>Игры не найдены.</p>'
        }
      </div>
    </section>
  `;
}

function productPage(id) {
  const p = products.find(x => x.id === Number(id));

  if (!p) {
    return `
      <section class="section">
        <h2>Товар не найден</h2>
        <a href="#/catalog">Вернуться в каталог</a>
      </section>
    `;
  }

  return `
    <section class="section">
      <a href="#/catalog">← Назад в каталог</a>

      <div class="product-page">
        <div class="cover big">${p.icon}</div>

        <div>
          <span class="tag">${p.platform} · ${p.region}</span>

          <h1>${p.name}</h1>

          <p>${p.desc}</p>

          <p><b>Жанр:</b> ${p.genre}</p>
          <p><b>Регион:</b> ${p.region}</p>
          <p><b>Платформа:</b> ${p.platform}</p>

          <h2>${money(p.price)}</h2>

          ${
            p.old
              ? `<p><del>${money(p.old)}</del></p>`
              : ''
          }

          <button class="btn" onclick="addToCart(${p.id})">
            Добавить в корзину
          </button>
        </div>
      </div>
    </section>
  `;
}

function addToCart(id) {
  const p = products.find(x => x.id === Number(id));

  if (!p) return;

  cart.push(p);
  saveCart();

  toast('Товар добавлен в корзину');
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  render();
}

function cartPage() {
  if (!cart.length) {
    return `
      <section class="section">
        <h1>Корзина</h1>
        <p>Корзина пуста.</p>
        <a class="btn" href="#/catalog">Перейти в каталог</a>
      </section>
    `;
  }

  const total = cart.reduce((sum, p) => sum + p.price, 0);

  return `
    <section class="section">
      <h1>Корзина</h1>

      <div class="cart-list">
        ${cart.map((p, i) => `
          <div class="cart-item">
            <div>
              <b>${p.icon} ${p.name}</b>
              <div>${p.platform} · ${p.region}</div>
            </div>

            <strong>${money(p.price)}</strong>

            <button
              class="smallbtn"
              onclick="removeFromCart(${i})"
            >
              Удалить
            </button>
          </div>
        `).join('')}
      </div>

      <div class="checkout-total">
        <h2>Итого: ${money(total)}</h2>
        <a class="btn" href="#/checkout">
          Перейти к оформлению
        </a>
      </div>
    </section>
  `;
}

function checkout() {
  if (!cart.length) {
    return `
      <section class="section">
        <h1>Оформление заказа</h1>
        <p>Корзина пуста.</p>
      </section>
    `;
  }

  const total = cart.reduce((sum, p) => sum + p.price, 0);

  return `
    <section class="section">
      <h1>Оформление заказа</h1>

      <div class="checkout">
        <label>
          Имя
          <input id="customerName" type="text" placeholder="Ваше имя">
        </label>

        <label>
          Email
          <input id="email" type="email" placeholder="you@example.com">
        </label>

        <h2>К оплате: ${money(total)}</h2>

        <button class="btn" onclick="createOrder()">
          Создать заказ
        </button>

        <p>
          Сейчас создаётся тестовый заказ.
          Онлайн-оплата будет подключена следующим этапом.
        </p>
      </div>
    </section>
  `;
}

async function createOrder() {
  const email = document.getElementById('email')?.value.trim();
  const name = document.getElementById('customerName')?.value.trim();

  if (!email || !email.includes('@')) {
    toast('Укажи корректный email');
    return;
  }

  if (!cart.length) {
    toast('Корзина пуста');
    return;
  }

  const items = cart.map(p => ({
    product_id: p.id
  }));

  try {
    toast('Создаём заказ...');

    const { data, error } =
      await supabaseClient.functions.invoke(
        'create-order',
        {
          body: {
            email,
            name,
            items
          }
        }
      );

    if (error) {
      console.error(error);
      toast('Ошибка создания заказа');
      return;
    }

    if (!data?.success) {
      toast(data?.error || 'Не удалось создать заказ');
      return;
    }

localStorage.setItem(
  'kf_last_order',
  JSON.stringify(data)
);

cart = [];
saveCart();

if (data.confirmation_url) {
  toast('Переходим к оплате...');

  window.location.href = data.confirmation_url;
} else {
  toast('Ссылка на оплату не получена');
}
}

  async function createOrder() {
  ...
}
async function createOrder() {
  const email = document.getElementById('email')?.value.trim();
  const name = document.getElementById('customerName')?.value.trim();

  if (!email || !email.includes('@')) {
    toast('Укажи корректный email');
    return;
  }

  if (!cart.length) {
    toast('Корзина пуста');
    return;
  }

  const items = cart.map(p => ({
    product_id: p.id
  }));

  try {
    toast('Создаём заказ...');

    const { data, error } =
      await supabaseClient.functions.invoke(
        'create-order',
        {
          body: {
            email,
            name,
            items
          }
        }
      );

    if (error) {
      console.error(error);
      toast('Ошибка создания заказа');
      return;
    }

    if (!data?.success) {
      toast(data?.error || 'Не удалось создать заказ');
      return;
    }

    localStorage.setItem(
      'kf_last_order',
      JSON.stringify(data)
    );

    cart = [];
    saveCart();

    if (data.confirmation_url) {
      toast('Переходим к оплате...');

      window.location.href = data.confirmation_url;
    } else {
      toast('Ссылка на оплату не получена');
    }

  } catch (err) {
    console.error(err);
    toast('Ошибка соединения');
  }
}
function ordersPage() {
  ...
}
  
  const order = JSON.parse(
    localStorage.getItem('kf_last_order') || 'null'
  );

  if (!order) {
    return `
      <section class="section">
        <h1>Мои заказы</h1>
        <p>Заказов пока нет.</p>
      </section>
    `;
  }

  return `
    <section class="section">
      <h1>Мои заказы</h1>

      <div class="order">
        <h3>Заказ #${order.order_id}</h3>
        <p>Статус: ${order.status}</p>
        <p>Сумма: ${money(order.total)}</p>
      </div>
    </section>
  `;
}

function supportPage() {
  return `
    <section class="section">
      <h1>Поддержка</h1>

      <p>
        Если возникли проблемы с заказом,
        напишите нам на email поддержки.
      </p>
    </section>
  `;
}

function dealsPage() {
  const deals = products.filter(
    p => p.old && p.old > p.price
  );

  return `
    <section class="section">
      <h1>Скидки</h1>

      <div class="grid">
        ${
          deals.length
            ? deals.map(card).join('')
            : '<p>Сейчас скидок нет.</p>'
        }
      </div>
    </section>
  `;
}

function render() {
  const app = document.getElementById('app');

  if (!app) return;

  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\/?/, '').split('/');

  const route = parts[0] || '';
  const id = parts[1];

  if (route === '') {
    app.innerHTML = home();
  } else if (route === 'catalog') {
    app.innerHTML = catalog();
  } else if (route === 'product') {
    app.innerHTML = productPage(id);
  } else if (route === 'cart') {
    app.innerHTML = cartPage();
  } else if (route === 'checkout') {
    app.innerHTML = checkout();
  } else if (route === 'orders') {
    app.innerHTML = ordersPage();
  } else if (route === 'support') {
    app.innerHTML = supportPage();
  } else if (route === 'deals') {
    app.innerHTML = dealsPage();
  } else {
    app.innerHTML = home();
  }

  updateCartCount();
}

window.addEventListener('hashchange', render);

if (initSupabase()) {
  render();
  loadProducts();
} else {
  render();
}
