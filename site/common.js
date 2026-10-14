(function () {
  const money = value => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
  const CART_KEY = "prodatchiki-cart-v2";

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute("active") || "";
      const link = (key, href, label) => `<a${active === key ? ' class="active" aria-current="page"' : ""} href="${href}">${label}</a>`;
      this.innerHTML = `
        <div class="topline"><div class="shell topline__inner"><span><span class="status-dot"></span>Датчики и программирование — в наличии</span><div class="topline__links"><a href="delivery.html">Доставка и оплата</a><a href="contacts.html">Самовывоз</a></div></div></div>
        <header class="header"><div class="shell header__inner">
          <a class="brand" href="index.html" aria-label="ProДатчики — на главную"><img src="./assets/logo-clean.png" alt="ProДатчики"></a>
          <nav class="nav" aria-label="Основная навигация">${link("selection","selection.html","Подбор")}${link("catalog","catalog.html","Каталог")}${link("services","services.html","Услуги")}${link("contacts","contacts.html","Контакты")}</nav>
          <div class="header__actions"><a class="phone" href="tel:+79773961719"><span>Ежедневно 11:00–18:00</span>+7 (977) 396-17-19</a><button class="cart-button" data-cart-open type="button" aria-label="Открыть корзину"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20.4 8H6.2M10 20h.01M17 20h.01"/></svg><span>Корзина</span><b class="js-cart-count">0</b></button><button class="menu-button" type="button" aria-label="Открыть меню"><span></span><span></span></button></div>
        </div><div class="mobile-nav">${link("selection","selection.html","Подбор")}${link("catalog","catalog.html","Каталог")}${link("services","services.html","Услуги")}${link("delivery","delivery.html","Доставка и оплата")}${link("contacts","contacts.html","Контакты")}</div></header>`;
    }
  }

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `<footer class="footer"><div class="shell footer__inner"><a class="brand brand--footer" href="index.html"><img src="./assets/logo-clean.png" alt="ProДатчики"></a><p>Датчики давления в шинах · продажа · диагностика · программирование</p><div><a href="catalog.html">Каталог</a><a href="delivery.html">Оплата и доставка</a><a href="contacts.html">Контакты</a></div></div><div class="shell footer__bottom"><span>© 2026 ProДатчики</span><span>Информация на сайте не является публичной офертой</span></div></footer>`;
    }
  }

  customElements.define("site-header", SiteHeader);
  customElements.define("site-footer", SiteFooter);

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (_) { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
  }

  function ensureChrome() {
    if (!document.querySelector("#globalCartDrawer")) {
      document.body.insertAdjacentHTML("beforeend", `
        <div class="overlay" id="globalOverlay"></div>
        <aside class="cart-drawer" id="globalCartDrawer" aria-hidden="true" aria-label="Корзина"><div class="drawer__head"><div><small>Ваш заказ</small><h2>Корзина</h2></div><button class="close-button" data-cart-close type="button" aria-label="Закрыть корзину">×</button></div><div class="cart-items" id="globalCartItems"></div><div class="drawer__footer"><div class="cart-total"><span>Итого</span><strong id="globalCartTotal">0 ₽</strong></div><a class="primary-button" id="globalCheckout" href="contacts.html">Оформить заявку</a><small>Перед оплатой проверим совместимость по VIN</small></div></aside>
        <div class="toast" id="globalToast" role="status" aria-live="polite"></div>`);
    }
  }

  function renderCart() {
    ensureChrome();
    const cart = getCart();
    document.querySelectorAll(".js-cart-count").forEach(node => { node.textContent = cart.reduce((sum, item) => sum + (item.quantity || 1), 0); });
    const items = document.querySelector("#globalCartItems");
    document.querySelector("#globalCartTotal").textContent = money(cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0));
    if (!cart.length) {
      items.innerHTML = `<div class="empty-cart"><span>◌</span><h3>Корзина пока пуста</h3><p>Добавьте товары из каталога. Совместимость подтвердим до оплаты.</p></div>`;
      document.querySelector("#globalCheckout").classList.add("is-disabled");
      return;
    }
    document.querySelector("#globalCheckout").classList.remove("is-disabled");
    items.innerHTML = cart.map((item, index) => `<div class="cart-item"><div><h3>${escapeHtml(item.title)}</h3><p>${item.quantity || 1} шт. · ${escapeHtml(item.sku || "")}</p></div><div class="cart-item__right"><strong>${money(item.price * (item.quantity || 1))}</strong><button class="remove-item" data-remove-index="${index}" type="button">Удалить</button></div></div>`).join("");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[char]);
  }

  let toastTimer;
  function toast(message) {
    const node = document.querySelector("#globalToast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("show"), 2200);
  }

  function openCart() {
    document.querySelector("#globalCartDrawer").classList.add("open");
    document.querySelector("#globalCartDrawer").setAttribute("aria-hidden", "false");
    document.querySelector("#globalOverlay").classList.add("open");
    document.body.classList.add("locked");
  }

  function closeCart() {
    document.querySelector("#globalCartDrawer").classList.remove("open");
    document.querySelector("#globalCartDrawer").setAttribute("aria-hidden", "true");
    document.querySelector("#globalOverlay").classList.remove("open");
    document.body.classList.remove("locked");
  }

  window.StoreCart = {
    add(product) {
      const cart = getCart();
      const existing = cart.find(item => item.id === product.id);
      if (existing) existing.quantity = (existing.quantity || 1) + 1;
      else cart.push({id:product.id, title:product.title, sku:product.sku, price:product.price, quantity:1});
      saveCart(cart);
      toast("Товар добавлен в корзину");
    },
    get: getCart,
    open: openCart,
    toast
  };

  document.addEventListener("DOMContentLoaded", () => {
    ensureChrome();
    renderCart();
    document.addEventListener("click", event => {
      const open = event.target.closest("[data-cart-open]");
      const close = event.target.closest("[data-cart-close], #globalOverlay");
      const remove = event.target.closest("[data-remove-index]");
      if (open) openCart();
      if (close) closeCart();
      if (remove) {
        const cart = getCart();
        cart.splice(Number(remove.dataset.removeIndex), 1);
        saveCart(cart);
      }
      const menu = event.target.closest(".menu-button");
      if (menu) menu.closest(".header").querySelector(".mobile-nav").classList.toggle("open");
    });
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeCart(); });
  });
})();
