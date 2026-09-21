const SUPABASE_URL = 'https://qzwuptmldyksjlcynrcy.supabase.co';
const SUPABASE_KEY = sb_publishable_41R3PSkaLqwvgrnRg38spw_0ytE-OPD;

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
      <h1>Корзина</h1
