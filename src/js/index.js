const products = [...document.querySelectorAll(".product-card")].map((c) => ({
  id: +c.dataset.id,
  name: c.dataset.name,
  category: c.dataset.category,
  price: +c.dataset.price,
  img: c.querySelector("img").src,
}));
let cart = JSON.parse(localStorage.getItem("fashionCart") || "[]"),
  favorites = JSON.parse(localStorage.getItem("fashionFavorites") || "[]"),
  orders = JSON.parse(localStorage.getItem("fashionOrders") || "[]");
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)],
  product = (id) => products.find((p) => p.id === id);
function save() {
  localStorage.setItem("fashionCart", JSON.stringify(cart));
  localStorage.setItem("fashionFavorites", JSON.stringify(favorites));
  localStorage.setItem("fashionOrders", JSON.stringify(orders));
  updateCounters();
}
function toast(t) {
  let e = $("#toast");
  e.textContent = t;
  e.classList.add("show");
  clearTimeout(window.tt);
  window.tt = setTimeout(() => e.classList.remove("show"), 1800);
}
function updateCounters() {
  $("#cartCount").textContent = cart.reduce((s, x) => s + x.qty, 0);
  $("#favCount").textContent = favorites.length;
  $$(".product-card").forEach((c) => {
    let a = favorites.includes(+c.dataset.id),
      b = c.querySelector(".favorite-btn");
    b.classList.toggle("active", a);
    b.textContent = a ? "♥" : "♡";
  });
}
function addToCart(id) {
  let x = cart.find((x) => x.id === id);
  x ? x.qty++ : cart.push({ id, qty: 1 });
  save();
  renderCart();
  toast("Товар добавлен в корзину 🛒");
}
function toggleFavorite(id) {
  favorites.includes(id)
    ? ((favorites = favorites.filter((x) => x !== id)),
      toast("Удалено из избранного"))
    : (favorites.push(id), toast("Добавлено в избранное ♡"));
  save();
  renderFavorites();
}
function renderCart() {
  let b = $("#cartItems");
  if (!cart.length) {
    b.innerHTML =
      '<div class="empty">Корзина пока пустая 🛒<br><br>Добавьте понравившиеся товары.</div>';
    $("#cartTotal").textContent = "$0";
    return;
  }
  b.innerHTML = cart
    .map((x) => {
      let p = product(x.id);
      return `<div class="cart-row"><img src="${p.img}"><div class="row-info"><h4>${p.name}</h4><small>$${p.price} · ${p.category}</small><div class="qty"><button data-minus="${p.id}">−</button><b>${x.qty}</b><button data-plus="${p.id}">+</button></div></div><button class="remove" data-remove="${p.id}">×</button></div>`;
    })
    .join("");
  $("#cartTotal").textContent =
    "$" + cart.reduce((s, x) => s + product(x.id).price * x.qty, 0);
}
function renderFavorites() {
  let b = $("#favoriteItems");
  if (!favorites.length) {
    b.innerHTML = '<div class="empty">В избранном пока ничего нет ♡</div>';
    return;
  }
  b.innerHTML = favorites
    .map((id) => {
      let p = product(id);
      return `<div class="fav-row"><img src="${p.img}"><div class="row-info"><h4>${p.name}</h4><small>$${p.price}</small></div><button class="add-cart" data-favcart="${p.id}">+</button></div>`;
    })
    .join("");
}
function renderOrders() {
  let b = $("#ordersList");
  b.innerHTML = orders.length
    ? orders
        .map(
          (o) =>
            `<div class="order"><strong>Заказ #${o.id}</strong><div>${o.total}$ · ${o.status}</div><span>${o.date} · ${o.name}</span></div>`,
        )
        .join("")
    : '<div class="empty">У вас пока нет заказов 📦</div>';
}
function open(id) {
  $("#" + id).classList.add("open");
}
function close(id) {
  $("#" + id).classList.remove("open");
}
$("#cartBtn").onclick = () => {
  renderCart();
  open("cartPanel");
};
$("#favoritesBtn").onclick = () => {
  renderFavorites();
  open("favoritesPanel");
};
$("#accountBtn").onclick = () => {
  renderOrders();
  open("accountPanel");
};
document.addEventListener("click", (e) => {
  let a = e.target.closest(".add-cart");
  if (a?.dataset.favcart) addToCart(+a.dataset.favcart);
  else if (a?.closest(".product-card"))
    addToCart(+a.closest(".product-card").dataset.id);
  let f = e.target.closest(".favorite-btn");
  if (f) toggleFavorite(+f.closest(".product-card").dataset.id);
  if (e.target.dataset.close) close(e.target.dataset.close);
  if (e.target.classList.contains("overlay")) e.target.classList.remove("open");
  if (e.target.dataset.plus) {
    let x = cart.find((x) => x.id == e.target.dataset.plus);
    x.qty++;
    save();
    renderCart();
  }
  if (e.target.dataset.minus) {
    let id = +e.target.dataset.minus,
      x = cart.find((x) => x.id === id);
    x.qty--;
    if (x.qty <= 0) cart = cart.filter((x) => x.id !== id);
    save();
    renderCart();
  }
  if (e.target.dataset.remove) {
    cart = cart.filter((x) => x.id !== +e.target.dataset.remove);
    save();
    renderCart();
  }
});
$("#checkoutBtn").onclick = () => {
  if (!cart.length) return toast("Сначала добавьте товар в корзину");
  close("cartPanel");
  $("#checkoutModal").classList.add("open");
};
$("#checkoutForm").onsubmit = (e) => {
  e.preventDefault();
  let d = Object.fromEntries(new FormData(e.target)),
    total = cart.reduce((s, x) => s + product(x.id).price * x.qty, 0);
  orders.unshift({
    id: "F" + Date.now().toString().slice(-6),
    date: new Date().toLocaleDateString("ru-RU"),
    total,
    status: "Принят",
    name: d.name,
  });
  cart = [];
  save();
  e.target.reset();
  close("checkoutModal");
  renderOrders();
  toast("Заказ успешно оформлен! 🎉");
};
$("#searchForm").onsubmit = (e) => e.preventDefault();
$("#searchInput").oninput = (e) => {
  let q = e.target.value.toLowerCase().trim(),
    n = 0;
  $$(".product-card").forEach((c) => {
    let ok = (c.dataset.name + " " + c.dataset.category)
      .toLowerCase()
      .includes(q);
    c.style.display = ok ? "" : "none";
    if (ok) n++;
  });
  $("#resultText").textContent = q
    ? `Найдено товаров: ${n}`
    : "Лучшие модели нашей коллекции";
};
$("#sortSelect").onchange = (e) => {
  let g = $("#productsGrid"),
    c = [...g.children];
  if (e.target.value === "cheap")
    c.sort((a, b) => +a.dataset.price - +b.dataset.price);
  if (e.target.value === "expensive")
    c.sort((a, b) => +b.dataset.price - +a.dataset.price);
  if (e.target.value === "new")
    c.sort(
      (a, b) =>
        (b.querySelector(".tag.new") ? 1 : 0) -
        (a.querySelector(".tag.new") ? 1 : 0),
    );
  c.forEach((x) => g.appendChild(x));
};
$$(".category").forEach(
  (b) =>
    (b.onclick = () => {
      $("#searchInput").value = b.dataset.category;
      $("#searchInput").dispatchEvent(new Event("input"));
      location.hash = "products";
    }),
);
$("#chatBtn").onclick = () => $("#chatWindow").classList.toggle("open");
$("#closeChat").onclick = () => $("#chatWindow").classList.remove("open");
$("#chatForm").onsubmit = (e) => {
  e.preventDefault();
  let i = $("#chatInput"),
    t = i.value.trim();
  if (!t) return;
  $("#chatMessages").insertAdjacentHTML(
    "beforeend",
    `<div class="message user">${t.replace(/[<>&]/g, (m) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[m])}</div>`,
  );
  i.value = "";
  setTimeout(
    () =>
      $("#chatMessages").insertAdjacentHTML(
        "beforeend",
        '<div class="message bot">Спасибо за сообщение! 😊 Наш менеджер скоро ответит.</div>',
      ),
    500,
  );
};
const info = {
  delivery:
    "<h2>Доставка</h2><p>Доставка по Украине осуществляется службой доставки. Срок и стоимость зависят от города.</p>",
  payment:
    "<h2>Оплата</h2><p>Можно выбрать оплату при получении или онлайн-оплату.</p>",
  returns:
    "<h2>Возврат</h2><p>Для возврата обратитесь в поддержку через чат магазина.</p>",
};
$$("[data-modal]").forEach(
  (a) =>
    (a.onclick = (e) => {
      e.preventDefault();
      $("#infoContent").innerHTML = info[a.dataset.modal];
      $("#infoModal").classList.add("open");
    }),
);
updateCounters();
renderCart();
renderFavorites();
renderOrders();
