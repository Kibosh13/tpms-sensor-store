(function () {
  const PAGE_SIZE = 9;
  const products = window.TPMS_PRODUCTS || [];
  const state = {search:"", sort:"popular", page:1, vehicle:"", make:"", model:"", year:"", verified:false, vehicleMake:new Set(), type:new Set(), brand:new Set(), frequency:new Set(), availability:new Set()};
  const money = value => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
  const plural = count => count % 10 === 1 && count % 100 !== 11 ? "товар" : [2,3,4].includes(count % 10) && ![12,13,14].includes(count % 100) ? "товара" : "товаров";

  function renderVehicleMakeFilters() {
    const makes = window.TPMS_CAR_MAKES || [];
    document.querySelector("#vehicleMakeFilters").innerHTML = makes.map(value => `<label><input type="checkbox" name="vehicleMake" value="${value}"> ${value}</label>`).join("");
  }

  function initFromQuery() {
    const params = new URLSearchParams(location.search);
    state.search = params.get("q") || "";
    document.querySelector("#catalogSearch").value = state.search;
    const frequency = params.get("frequency");
    if (frequency) {
      state.frequency.add(frequency);
      const input = document.querySelector(`input[name="frequency"][value="${frequency}"]`);
      if (input) input.checked = true;
    }
    const vehicle = params.get("vehicle");
    state.vehicle = vehicle || "";
    state.make = params.get("make") || "";
    state.model = params.get("model") || "";
    state.year = params.get("year") || "";
    state.verified = params.get("verified") === "1";
    if (state.make) {
      state.vehicleMake.add(state.make);
      const input = document.querySelector(`input[name="vehicleMake"][value="${state.make}"]`);
      if (input) input.checked = true;
    }
    if (vehicle) document.querySelector("#catalogSelectionNote").textContent = `${state.verified ? "Совместимые варианты" : "Подбор"} для: ${vehicle}`;
  }

  function matches(product) {
    const haystack = `${product.title} ${product.brand} ${product.sku} ${product.description} ${(product.coverage || []).join(" ")}`.toLowerCase();
    if (state.search && !haystack.includes(state.search.toLowerCase())) return false;
    if (state.type.size && !state.type.has(product.type)) return false;
    if (state.brand.size && !state.brand.has(product.brand)) return false;
    if (state.frequency.size && ![...state.frequency].some(value => product.frequency.includes(Number(value)))) return false;
    if (state.vehicleMake.size && !product.coverage.includes("*") && ![...state.vehicleMake].some(value => product.coverage.includes(value))) return false;
    if (state.availability.has("stock") && !state.availability.has("order") && product.stock < 1) return false;
    if (state.availability.has("order") && !state.availability.has("stock") && product.stock > 0) return false;
    return true;
  }

  function sorted(list) {
    const result = [...list];
    if (state.sort === "price-asc") result.sort((a,b) => a.price - b.price);
    if (state.sort === "price-desc") result.sort((a,b) => b.price - a.price);
    if (state.sort === "title") result.sort((a,b) => a.title.localeCompare(b.title, "ru"));
    if (state.sort === "popular") result.sort((a,b) => Number(Boolean(b.badge)) - Number(Boolean(a.badge)) || b.stock - a.stock);
    return result;
  }

  function productCard(product) {
    const freq = product.frequency.length ? `${product.frequency.join(" / ")} МГц` : product.valve === "metal" ? "Металлический вентиль" : "Резиновый вентиль";
    const stock = product.stock > 0 ? `<span class="stock"><i></i>В наличии · ${product.stock} шт.</span>` : `<span class="stock amber"><i></i>Под заказ</span>`;
    const compatibility = state.verified && state.make ? `<div class="match-note match-note--verified">Вариант для ${state.vehicle}</div>` : "";
    return `<article class="product-card catalog-card${compatibility ? " product-card--verified" : ""}">
      <a class="product-card__visual${product.type === "oem" ? " product-card__visual--dark" : ""}" href="product.html?id=${encodeURIComponent(product.id)}">${product.badge ? `<span class="product-badge${product.brand === "Launch" ? " orange" : ""}">${product.badge}</span>` : ""}<img src="${product.image}" alt="${product.title}" loading="lazy"></a>
      <div class="product-card__body">${compatibility}<div class="product-brand${product.brand === "Launch" ? " red" : ""}">${product.brand} · ${product.sku}</div><h3><a href="product.html?id=${encodeURIComponent(product.id)}">${product.title}</a></h3><p>${freq} · ${product.valve === "metal" ? "алюминиевый" : "резиновый"}</p>${stock}<div class="product-card__footer"><div><strong>${money(product.price)}</strong><small>${product.type === "sensor" || product.type === "kit" ? "программирование включено" : "за 1 шт."}</small></div><button class="add-button" data-product-id="${product.id}" type="button" aria-label="Добавить ${product.title}">+</button></div></div>
    </article>`;
  }

  function renderChips() {
    const node = document.querySelector("#activeChips");
    const chips = [];
    if (state.search) chips.push({group:"search", value:"", label:`«${state.search}»`});
    ["vehicleMake","type","brand","frequency","availability"].forEach(group => state[group].forEach(value => chips.push({group,value,label: value === "stock" ? "В наличии" : value === "order" ? "Под заказ" : value === "sensor" ? "Датчики" : value === "kit" ? "Комплекты" : value === "oem" ? "Оригинальные" : value === "valve" ? "Вентили" : value === "accessory" ? "Комплектующие" : value === "433" || value === "315" ? `${value} МГц` : value})));
    node.innerHTML = chips.map(chip => `<button type="button" data-chip-group="${chip.group}" data-chip-value="${chip.value}">${chip.label}<span>×</span></button>`).join("");
  }

  function renderPagination(totalPages) {
    const node = document.querySelector("#catalogPagination");
    if (totalPages <= 1) { node.innerHTML = ""; return; }
    const buttons = [];
    buttons.push(`<button type="button" data-page="${Math.max(1,state.page-1)}" ${state.page === 1 ? "disabled" : ""} aria-label="Предыдущая страница">←</button>`);
    for (let i = 1; i <= totalPages; i += 1) buttons.push(`<button type="button" data-page="${i}" class="${i === state.page ? "active" : ""}" ${i === state.page ? 'aria-current="page"' : ""}>${i}</button>`);
    buttons.push(`<button type="button" data-page="${Math.min(totalPages,state.page+1)}" ${state.page === totalPages ? "disabled" : ""} aria-label="Следующая страница">→</button>`);
    node.innerHTML = buttons.join("");
  }

  function render() {
    const list = sorted(products.filter(matches));
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    const pageItems = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    document.querySelector("#catalogCount").textContent = `${list.length} ${plural(list.length)}`;
    document.querySelector("#catalogProductGrid").innerHTML = pageItems.map(productCard).join("");
    document.querySelector("#catalogNoResults").classList.toggle("hidden", list.length > 0);
    document.querySelector("#catalogProductGrid").classList.toggle("hidden", list.length === 0);
    renderPagination(totalPages);
    renderChips();
  }

  function reset() {
    state.search = ""; state.sort = "popular"; state.page = 1;
    state.vehicle = ""; state.make = ""; state.model = ""; state.year = ""; state.verified = false;
    ["vehicleMake","type","brand","frequency","availability"].forEach(group => state[group].clear());
    document.querySelector("#catalogSearch").value = "";
    document.querySelector("#catalogSort").value = "popular";
    document.querySelectorAll(".catalog-sidebar input").forEach(input => { input.checked = false; });
    document.querySelector("#catalogSelectionNote").textContent = "Показан весь каталог";
    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderVehicleMakeFilters();
    initFromQuery();
    render();
    let searchTimer;
    document.querySelector("#catalogSearch").addEventListener("input", event => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { state.search = event.target.value.trim(); state.page = 1; render(); }, 180); });
    document.querySelector("#catalogSort").addEventListener("change", event => { state.sort = event.target.value; state.page = 1; render(); });
    document.querySelector("#catalogSidebar").addEventListener("change", event => {
      const {name,value,checked} = event.target;
      if (!state[name]) return;
      checked ? state[name].add(value) : state[name].delete(value);
      state.page = 1; render();
    });
    document.querySelector("#catalogProductGrid").addEventListener("click", event => {
      const button = event.target.closest("[data-product-id]");
      if (!button) return;
      const product = products.find(item => item.id === button.dataset.productId);
      if (product) window.StoreCart.add(product);
    });
    document.querySelector("#catalogPagination").addEventListener("click", event => { const button = event.target.closest("[data-page]"); if (!button || button.disabled) return; state.page = Number(button.dataset.page); render(); document.querySelector(".catalog-results").scrollIntoView({behavior:"smooth"}); });
    document.querySelector("#activeChips").addEventListener("click", event => { const button = event.target.closest("[data-chip-group]"); if (!button) return; if (button.dataset.chipGroup === "search") { state.search = ""; document.querySelector("#catalogSearch").value = ""; } else { state[button.dataset.chipGroup].delete(button.dataset.chipValue); const input = document.querySelector(`input[name="${button.dataset.chipGroup}"][value="${button.dataset.chipValue}"]`); if (input) input.checked = false; if (button.dataset.chipGroup === "vehicleMake" && button.dataset.chipValue === state.make) { state.vehicle = ""; state.make = ""; state.model = ""; state.year = ""; state.verified = false; document.querySelector("#catalogSelectionNote").textContent = "Показан весь каталог"; } } state.page = 1; render(); });
    document.querySelector("#resetFilters").addEventListener("click", reset);
    document.querySelector("#emptyReset").addEventListener("click", reset);
    document.querySelector("#filterDrawerButton").addEventListener("click", () => document.querySelector("#catalogSidebar").classList.add("open"));
    document.querySelector("#closeFilters").addEventListener("click", () => document.querySelector("#catalogSidebar").classList.remove("open"));
  });
})();
