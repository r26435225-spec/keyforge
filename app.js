const SUPABASE_URL = 'https://qzwuptmldyksjlcynrcy.supabase.co';
const SUPABASE_KEY = 'ВСТАВЬ_СЮДА_СВОЙ_PUBLISHABLE_KEY';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let products = [];
let cart = JSON.parse(localStorage.getItem('kf_cart') || '[]');
let filter = 'all';
let query = '';

const money = n => Number(n).toLocaleString('ru-RU') + ' ₽';

function save() {
  localStorage.setItem('kf_cart', JSON.stringify(cart));
  const counter = document.getElementById('cartCount');
  if (counter) counter.textContent = cart.length;
}

function toast(t) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = t;
  setTimeout(() => el.textContent = '', 2200);
}

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error(error);
    toast('Ошибка загрузки каталога');
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
        <button class="smallbtn"
          onclick="add(${p.id});event.preventDefault()">
          В корзину
        </button>
      </div>
    </div>
  </article>`;
}

function home() {
  return `
  <section class="wrap hero">
    <div>
      <div class="eyebrow">KeyForge</div>
      <h1>Игры дешевле.<br><span>Покупка проще.</span></h1>
      <p class="muted">
        Каталог цифровых игр, понятные цены и удобная покупка в одном месте.
      </p>
      <a class="btn" href="#/catalog">Открыть каталог</a>
      <a class="btn alt" href="#/deals">Скидки</a>
    </div>

    <div class="showcase">
      <div class="bigcover">🎮</div>
      <h2>Игра недели</h2>
      <p class="muted">Cyberpunk 2077 · Steam · Global</p>
      <div class="row">
        <span class="price">899 ₽</span>
        <a class="smallbtn" href="#/product/1">Подробнее</a>
      </div>
    </div>
  </section>

  <section class="wrap">
    <div class="section-title">
      <div>
        <span class="eyebrow">Популярное</span>
        <h2>Лучшие предложения</h2>
      </div>
      <a href="#/catalog">Все игры →</a>
    </div>

    <div class="cards">
      ${products.slice(0, 4).map(card).join('')}
    </div>
  </section>`;
}

function catalog() {
  const list = products.filter(p =>
    (filter === 'all' || p.platform === filter) &&
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return `
  <section class="wrap">
    <div class="section-title">
      <div>
        <span class="eyebrow">Каталог</span>
        <h2>Все игры</h2>
      </div>
    </div>

    <div class="toolbar">
      <input
        placeholder="🔍 Поиск игры..."
        value="${query}"
        oninput="query=this.value;render()"
      >

      <div class="chips">
        <button class="chip ${filter === 'all' ? 'active' : ''}"
          onclick="filter='all';render()">Все</button>

        <button class="chip ${filter === 'Steam' ? 'active' : ''}"
          onclick="filter='Steam';render()">Steam</button>

        <button class="chip ${filter === 'EA' ? 'active' : ''}"
          onclick="filter='EA';render()">EA</button>

        <button class="chip ${filter === 'Ubisoft' ? 'active' : ''}"
          onclick="filter='Ubisoft';render()">Ubisoft</button>
      </div>
    </div>

    <div class="cards">
      ${
        list.length
          ? list.map(card).join('')
          : '<div class="empty" style="grid-column:1/-1">Ничего не найдено</div>'
      }
    </div>
  </section>`;
}

function product(id) {
  const p = products.find(x => x.id == id);

  if (!p) {
    return `
    <section class="wrap">
      <div class="empty">
        <h2>Товар не найден</h2>
        <a class="btn" href="#/catalog">Каталог</a>
      </div>
    </section>`;
  }

  return `
  <section class="wrap product-page">
    <div class="cover">${p.icon}</div>

    <div class="panel">
      <span class="tag">${p.platform} · цифровой ключ</span>

      <h1>${p.name}</h1>
      <p class="muted">${p.desc}</p>

      <div class="specs">
        <div class="spec">
          <small>Платформа</small>${p.platform}
        </div>
        <div class="spec">
          <small>Регион</small>${p.region}
        </div>
        <div class="spec">
          <small>Жанр</small>${p.genre}
        </div>
        <div class="spec">
          <small>Выдача</small>После оплаты
        </div>
      </div>

      <div class="order">
        <div>
          <div class="muted">Цена</div>
          <div class="total">${money(p.price)}</div>
        </div>

        <button class="btn" onclick="add(${p.id})">
          Добавить в корзину
        </button>
      </div>
    </div>
  </section>`;
}

function cartPage() {
  if (!cart.length) {
    return `
    <section class="wrap">
      <div class="empty">
        <h2>Корзина пуста</h2>
        <p class="muted">Добавь игру из каталога.</p>
        <a class="btn" href="#/catalog">Перейти в каталог</a>
      </div>
    </section>`;
  }

  const total = cart.reduce((s, p) => s + p.price, 0);

  return `
  <section class="wrap">
    <div class="section-title">
      <div>
        <span class="eyebrow">Покупка</span>
        <h2>Корзина</h2>
      </div>
    </div>

    <div class="checkout-grid">
      <div class="panel">
        ${cart.map((p, i) => `
          <div class="cartline">
            <div class="carticon">${p.icon}</div>

            <div style="flex:1">
              <b>${p.name}</b>
              <div class="muted">${p.platform} · ${p.region}</div>
            </div>

            <strong>${money(p.price)}</strong>

            <button class="smallbtn"
              onclick="removeCart(${i})">×</button>
          </div>
        `).join('')}
      </div>

      <div class="panel">
        <h2>Итого</h2>

        <div class="row">
          <span class="muted">${cart.length} товар(а)</span>
          <span class="total">${money(total)}</span>
        </div>

        <a class="btn"
          style="width:100%;text-align:center"
          href="#/checkout">
          Перейти к оформлению
        </a>
      </div>
    </div>
  </section>`;
}

function checkout() {
  const total = cart.reduce((s, p) => s + p.price, 0);

  return `
  <section class="wrap">
    <div class="section-title">
      <div>
        <span class="eyebrow">Оформление</span>
        <h2>Данные заказа</h2>
      </div>
    </div>

    <div class="checkout-grid">
      <div class="panel">
        <div class="form">
          <label>
            Email
            <input id="email"
              type="email"
              placeholder="you@example.com">
          </label>

          <label>
            Имя
            <input id="name"
              placeholder="Ваше имя">
          </label>

          <div class="notice">
            💳 Реальная оплата будет подключена следующим этапом.
          </div>

          <button class="btn" onclick="demoOrder()">
            Создать тестовый заказ
          </button>
        </div>
      </div>

      <div class="panel">
        <h3>Ваш заказ</h3>

        ${cart.map(p => `
          <div class="row" style="margin:10px 0">
            <span>${p.name}</span>
            <b>${money(p.price)}</b>
          </div>
        `).join('')}

        <hr>

        <div class="row">
          <b>Итого</b>
          <span class="total">${money(total)}</span>
        </div>
      </div>
    </div>
  </section>`;
}

function account() {
  const orders = JSON.parse(
    localStorage.getItem('kf_orders') || '[]'
  );

  return `
  <section class="wrap account">
    <aside class="side">
      <a href="#/account">👤 Профиль</a>
      <a href="#/orders">📦 Заказы</a>
      <a href="#/catalog">🎮 Каталог</a>
    </aside>

    <div>
      <span class="eyebrow">Личный кабинет</span>
      <h2>Мой KeyForge</h2>

      <div class="panel">
        <h3>Добро пожаловать</h3>
        <p class="muted">
          Здесь будут профиль, история заказов и цифровые товары.
        </p>
        <p>Заказов: <b>${orders.length}</b></p>
      </div>
    </div>
  </section>`;
}

function orders() {
  const o = JSON.parse(
    localStorage.getItem('kf_orders') || '[]'
  );

  return `
  <section class="wrap">
    <span class="eyebrow">Личный кабинет</span>
    <h2>Мои заказы</h2>

    ${
      o.length
      ? o.map(x => `
        <div class="panel" style="margin:12px 0">
          <div class="row">
            <b>Заказ ${x.id}</b>
            <span>${x.date}</span>
          </div>
          <p>${x.items.join(', ')}</p>
          <span class="tag">Тестовый заказ</span>
        </div>
      `).join('')
      : '<div class="empty">Заказов пока нет.</div>'
    }
  </section>`;
}

function support() {
  return `
  <section class="wrap">
    <div class="panel">
      <span class="eyebrow">Помощь</span>
      <h1>Поддержка</h1>

      <div class="form">
        <input placeholder="Email">
        <input placeholder="Номер заказа">
        <input placeholder="Тема">

        <textarea
          style="min-height:140px"
          placeholder="Сообщение">
        </textarea>

        <button class="btn"
          onclick="toast('Сообщение отправлено')">
          Отправить
        </button>
      </div>
    </div>
  </section>`;
}

function deals() {
  return `
  <section class="wrap">
    <span class="eyebrow">Выгодно</span>
    <h2>Скидки</h2>

    <div class="cards">
      ${products.filter(p => p.old > p.price).map(card).join('')}
    </div>
  </section>`;
}

function add(id) {
  const p = products.find(x => x.id == id);

  if (!p) return;

  cart.push(p);
  save();
  toast('Добавлено в корзину');
}

function removeCart(i) {
  cart.splice(i, 1);
  save();
  render();
}

function demoOrder() {
  const email = document.getElementById('email');

  if (!email || !email.value) {
    return toast('Укажи email');
  }

  const orders = JSON.parse(
    localStorage.getItem('kf_orders') || '[]'
  );

  orders.push({
    id: '#KF' + Date.now().toString().slice(-6),
    date: new Date().toLocaleString('ru-RU'),
    items: cart.map(p => p.name)
  });

  localStorage.setItem(
    'kf_orders',
    JSON.stringify(orders)
  );

  cart = [];
  save();

  location.hash = '/orders';
}

function openSearch() {
  location.hash = '/catalog';
}

function render() {
  save();

  const path = location.hash.slice(1) || '/';

  let c;

  if (path === '/') c = home();
  else if (path === '/catalog') c = catalog();
  else if (path === '/cart') c = cartPage();
  else if (path === '/checkout') c = checkout();
  else if (path === '/account') c = account();
  else if (path === '/orders') c = orders();
  else if (path === '/support') c = support();
  else if (path === '/deals') c = deals();
  else if (path.startsWith('/product/')) {
    c = product(path.split('/')[2]);
  }
  else {
    c = `
    <section class="wrap">
      <div class="empty">
        <h2>Страница не найдена</h2>
        <a class="btn" href="#/">На главную</a>
      </div>
    </section>`;
  }

  document.getElementById('app').innerHTML = c;
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);

loadProducts();
