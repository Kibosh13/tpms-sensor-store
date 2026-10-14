(function () {
  const money = value => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
  const escapeHtml = value => String(value || "").replace(/[&<>"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[char]);
  document.addEventListener("DOMContentLoaded", () => {
    const id = new URLSearchParams(location.search).get("id");
    const product = (window.TPMS_PRODUCTS || []).find(item => item.id === id);
    const root = document.querySelector("#productPage");
    if (!product) {
      root.innerHTML = `<div class="product-not-found"><p class="eyebrow">ОШИБКА 404</p><h1>Товар не найден</h1><p>Возможно, ссылка устарела или позиция больше не доступна.</p><a class="primary-button" href="catalog.html">Вернуться в каталог</a></div>`;
      return;
    }
    document.title = `${product.title} — ProДатчики`;
    const available = window.CatalogInventory.isAvailable(product);
    const frequencies = product.frequency.length ? product.frequency.map(value => `${value} МГц`).join(" / ") : "Не применяется";
    root.innerHTML = `<nav class="breadcrumbs" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span>/</span><a href="catalog.html">Каталог</a><span>/</span><span>${escapeHtml(product.title)}</span></nav>
      <div class="product-detail"><div class="product-detail__media"><img src="${product.image}" alt="${escapeHtml(product.title)}">${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ""}</div><div class="product-detail__info"><div class="product-brand">${escapeHtml(product.brand)} · ${escapeHtml(product.sku)}</div><h1>${escapeHtml(product.title)}</h1><p class="product-detail__lead">${escapeHtml(product.description)}</p><div class="product-detail__stock ${product.stock ? "" : "is-order"}"><span></span>${product.stock ? `В наличии · ${product.stock} шт.` : "Под заказ, 1–3 дня"}</div><div class="product-detail__price"><strong>${money(product.price)}</strong><span>${["sensor","kit"].includes(product.type) ? "Программирование наших датчиков — 0 ₽" : "Цена за одну единицу"}</span></div><button class="primary-button" id="productAdd" type="button">Добавить в корзину</button><a class="product-vin-link" href="selection.html#vin">Сначала проверить совместимость по VIN →</a></div></div>
      <div class="product-information"><section><p class="eyebrow">ХАРАКТЕРИСТИКИ</p><h2>Основные параметры</h2><dl><div><dt>Производитель</dt><dd>${escapeHtml(product.brand)}</dd></div><div><dt>Артикул</dt><dd>${escapeHtml(product.sku)}</dd></div><div><dt>Частота</dt><dd>${frequencies}</dd></div><div><dt>Вентиль</dt><dd>${product.valve === "metal" ? "Алюминиевый" : "Резиновый"}</dd></div><div><dt>Гарантия</dt><dd>${product.warranty ? `${product.warranty} месяца` : "По гарантии производителя"}</dd></div></dl></section><aside><strong>Совместимость важнее частоты</strong><p>Одинаковая частота не гарантирует поддержку протокола автомобиля. До оплаты проверим VIN, поколение и OE-номер штатного датчика.</p><a href="selection.html">Перейти к подбору</a></aside></div>`;
    const addButton = document.querySelector("#productAdd");
    if (!available) {
      addButton.disabled = true;
      addButton.textContent = "Временно нет в наличии";
      document.querySelector(".product-detail__stock").textContent = "Временно нет в наличии";
    }
    addButton.addEventListener("click", () => { if (available) window.StoreCart.add(product); });
  });
})();
