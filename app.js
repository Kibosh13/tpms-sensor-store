const vehicleCatalog = {
  Toyota: {
    Camry: [direct(2010, 2022, "433 МГц", "OBD / автоматически", "Pacific")],
    RAV4: [direct(2010, 2021, "433 МГц", "OBD", "Pacific")],
    "Land Cruiser": [direct(2010, 2022, "433 МГц", "OBD", "Pacific")],
    Corolla: [direct(2010, 2022, "433 МГц", "OBD / автоматически", "Pacific")]
  },
  BMW: {
    "3 серия": [direct(2010, 2022, "433 МГц", "автоматически", "Huf / Continental"), indirect(2010, 2011)],
    "5 серия": [direct(2010, 2022, "433 МГц", "OBD / автоматически", "Huf / Continental / Schrader")],
    X3: [direct(2010, 2022, "433 МГц", "автоматически", "Huf / Schrader")],
    X5: [direct(2010, 2022, "433 МГц", "OBD / автоматически", "Huf / Continental / Schrader"), indirect(2010, 2010)]
  },
  "Mercedes-Benz": {
    "C-Класс": [direct(2010, 2022, "433 МГц", "OBD / автоматически", "Schrader")],
    "E-Класс": [direct(2010, 2022, "433 МГц", "OBD / автоматически", "Schrader / Continental"), indirect(2014, 2015)],
    GLC: [direct(2015, 2022, "433 МГц", "OBD / автоматически", "Schrader")],
    GLE: [direct(2015, 2022, "433 МГц", "OBD / автоматически", "Schrader / Huf")]
  },
  Volkswagen: {
    Polo: [direct(2017, 2020, "433 МГц", "автоматически", "Huf / Beru"), indirect(2010, 2021)],
    Tiguan: [direct(2010, 2020, "433 МГц", "OBD / автоматически", "Huf / Continental"), indirect(2010, 2021)],
    Touareg: [direct(2010, 2022, "433 МГц", "OBD / автоматически", "Huf / Beru"), indirect(2015, 2019)],
    Passat: [direct(2010, 2021, "433 МГц", "OBD / автоматически", "Huf / Continental"), indirect(2010, 2019)]
  },
  Kia: {
    Rio: [direct(2011, 2021, "433 МГц", "OBD / копирование ID", "TRW / Continental"), indirect(2016, 2020)],
    Sportage: [direct(2010, 2022, "433 МГц", "OBD / автоматически", "TRW / Continental / Schrader")],
    K5: [direct(2020, 2020, "433 МГц", "OBD / автоматически", "Continental")],
    Sorento: [direct(2010, 2023, "433 МГц", "OBD", "Continental")]
  },
  Hyundai: {
    Solaris: [direct(2011, 2019, "433 МГц", "OBD", "Continental")],
    Creta: [direct(2016, 2021, "433 МГц", "OBD / автоматически", "Schrader / Continental")],
    Tucson: [direct(2010, 2022, "433 МГц", "OBD / автоматически", "TRW / Schrader")],
    "Santa Fe": [direct(2010, 2022, "433 МГц", "OBD / автоматически", "Lear / Continental / Schrader")]
  },
  Haval: {
    Jolion: [direct(2021, 2021, "433 МГц", "OBD", "Schrader / Dias")],
    F7: [direct(2018, 2021, "433 МГц", "OBD", "Schrader / Dias")],
    Dargo: [direct(2020, 2021, "433 МГц", "OBD / автоматически", "Schrader / SAT")],
    H9: [direct(2014, 2021, "433 МГц", "OBD / автоматически", "Schrader")]
  },
  Geely: {
    Coolray: [direct(2019, 2021, "433 МГц", "OBD", "Baolong")],
    Monjaro: [],
    Atlas: [direct(2015, 2022, "433 МГц", "OBD", "Dias / Schrader / Baolong")],
    Tugella: []
  }
};

function direct(from, to, frequency, relearn, oem) {
  return {from, to, system: "direct", frequency, relearn, oem};
}

function indirect(from, to) {
  return {from, to, system: "indirect", frequency: "датчики не используются", relearn: "сброс через меню автомобиля", oem: "ABS"};
}

const money = value => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
const CART_KEY = "prodatchiki-cart-v2";
const cart = (() => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (_) { return []; } })();
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const make = $("#carMake");
const model = $("#carModel");
const year = $("#carYear");
const region = $("#carTrim");
let activeMatch = null;
let activeBrandFilter = "all";

function resetResults() {
  activeMatch = null;
  $("#compatibility").classList.add("hidden");
  $("#catalogContext").classList.add("hidden");
  $$('.product-card').forEach(card => {
    card.hidden = false;
    card.dataset.match = "unselected";
    card.classList.remove("product-card--verified", "product-card--check", "product-card--blocked");
    const note = card.querySelector(".match-note");
    note.className = "match-note hidden";
    note.textContent = "";
    card.querySelector(".add-button").disabled = false;
  });
  $("#catalogEmpty").classList.add("hidden");
  applyBrandFilter();
}

make.addEventListener("change", () => {
  const models = Object.keys(vehicleCatalog[make.value] || {});
  model.innerHTML = `<option value="">Выберите модель</option>${models.map(item => `<option>${item}</option>`).join("")}`;
  model.disabled = !models.length;
  year.innerHTML = '<option value="">Выберите год</option>';
  year.disabled = true;
  region.disabled = true;
  resetResults();
});

model.addEventListener("change", () => {
  const years = Array.from({length: 17}, (_, index) => 2026 - index);
  year.innerHTML = `<option value="">Выберите год</option>${years.map(item => `<option>${item}</option>`).join("")}`;
  year.disabled = !model.value;
  region.disabled = true;
  resetResults();
});

year.addEventListener("change", () => {
  region.disabled = !year.value;
  resetResults();
});

region.addEventListener("change", resetResults);

function lookupVehicle(makeValue, modelValue, yearValue, regionValue) {
  const rules = vehicleCatalog[makeValue]?.[modelValue];
  if (!rules || !Number.isInteger(yearValue) || yearValue < 2010 || yearValue > 2026) {
    throw new Error("Автомобиль не найден в справочнике");
  }
  if (regionValue !== "eu") {
    return {status: "manual", reason: "Для этого региона частота и протокол могут отличаться. Нужна проверка по VIN или номеру старого датчика."};
  }
  const matches = rules.filter(rule => yearValue >= rule.from && yearValue <= rule.to);
  const directMatch = matches.find(rule => rule.system === "direct");
  const indirectMatch = matches.find(rule => rule.system === "indirect");
  if (directMatch && indirectMatch) {
    return {status: "ambiguous", direct: directMatch, indirect: indirectMatch, reason: "В этом году встречаются и прямая, и косвенная системы TPMS — зависит от рынка и комплектации. Нужен VIN."};
  }
  if (directMatch) return {status: "confirmed", ...directMatch};
  if (indirectMatch) return {status: "indirect", ...indirectMatch};
  return {status: "manual", reason: "В официальном каталоге Autel нет однозначно подтверждённой записи для выбранного года. Не будем угадывать — проверим по VIN."};
}

function updateCompatibility(match) {
  const box = $("#compatibility");
  const icon = $("#compatibilityIcon");
  const label = $("#compatibilityLabel");
  const details = $("#compatibilityDetails");
  const action = $("#compatibilityAction");
  box.className = `compatibility compatibility--${match.status}`;
  box.classList.remove("hidden");

  if (match.status === "confirmed") {
    icon.textContent = "✓";
    label.textContent = "Совместимость подтверждена каталогом";
    details.innerHTML = `<strong>${match.frequency}</strong><span>Привязка: ${match.relearn}</span><span>Штатный производитель: ${match.oem}</span>`;
    action.textContent = "Показать подходящие";
    action.href = `catalog.html?${new URLSearchParams({frequency:String(match.frequency),vehicle:$("#selectedCar").textContent})}`;
  } else if (match.status === "indirect") {
    icon.textContent = "i";
    label.textContent = "Косвенная система TPMS";
    details.innerHTML = `<strong>Датчики в колёсах не нужны</strong><span>Давление контролируется по скорости вращения колёс через ABS.</span>`;
    action.textContent = "Диагностика системы";
    action.href = "services.html";
  } else {
    icon.textContent = "?";
    label.textContent = match.status === "ambiguous" ? "Нужна проверка комплектации" : "Нужна проверка по VIN";
    details.innerHTML = `<strong>Не показываем случайные датчики</strong><span>${match.reason}</span>`;
    action.textContent = "Проверить по VIN";
    action.href = "selection.html#vin";
  }
}

function updateCatalog(match, vehicleName) {
  const context = $("#catalogContext");
  context.classList.remove("hidden");
  $("#catalogVehicle").textContent = vehicleName;
  $("#catalogEmpty").classList.add("hidden");

  $$('.product-card').forEach(card => {
    const note = card.querySelector(".match-note");
    const button = card.querySelector(".add-button");
    card.classList.remove("product-card--verified", "product-card--check", "product-card--blocked");
    button.disabled = false;

    if (match.status === "confirmed" && card.dataset.brand === "autel") {
      card.dataset.match = "verified";
      card.classList.add("product-card--verified");
      note.className = "match-note match-note--verified";
      note.textContent = `Подходит · ${match.frequency}`;
    } else if (match.status === "confirmed") {
      card.dataset.match = "check";
      card.classList.add("product-card--check");
      note.className = "match-note match-note--check";
      note.textContent = card.dataset.brand === "launch" ? "Частота подходит · протокол проверим по VIN" : "Точный OEM-номер — по VIN";
    } else {
      card.dataset.match = "blocked";
      card.classList.add("product-card--blocked");
      note.className = "match-note match-note--blocked";
      note.textContent = match.status === "indirect" ? "Для этой системы датчик не требуется" : "До проверки VIN не предлагаем";
      button.disabled = true;
    }
  });

  if (match.status === "indirect") {
    $("#catalogEmpty").classList.remove("hidden");
    $("#catalogEmptyTitle").textContent = "Для выбранного автомобиля датчики не нужны";
    $("#catalogEmptyText").textContent = "Каталог указывает косвенную систему TPMS: она использует датчики ABS, а не радиодатчики в колёсах.";
  } else if (match.status !== "confirmed") {
    $("#catalogEmpty").classList.remove("hidden");
    $("#catalogEmptyTitle").textContent = "Сначала проверим VIN";
    $("#catalogEmptyText").textContent = "Это защищает от заказа датчика с неподходящим протоколом, даже если частота совпадает.";
  }
  applyBrandFilter();
}

function runSelection({scroll = true} = {}) {
  if (!make.value || !model.value || !year.value || !region.value) return null;
  const vehicleName = `${make.value} ${model.value}, ${year.value}`;
  const match = lookupVehicle(make.value, model.value, Number(year.value), region.value);
  activeMatch = match;
  $("#selectedCar").textContent = vehicleName;
  updateCompatibility(match);
  updateCatalog(match, vehicleName);
  if (scroll) $("#compatibility").scrollIntoView({behavior: "smooth", block: "center"});
  showToast(match.status === "confirmed" ? "Совместимость найдена в каталоге" : match.status === "indirect" ? "Обнаружена косвенная система TPMS" : "Для точного подбора нужен VIN");
  return match;
}

$("#selectorForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!make.value || !model.value || !year.value || !region.value) return;
  const params = new URLSearchParams({make:make.value, model:model.value, year:year.value, region:region.value});
  location.href = `selection.html?${params}`;
});

function applyBrandFilter() {
  $$('.product-card').forEach(card => {
    const brandVisible = activeBrandFilter === "all" || card.dataset.brand === activeBrandFilter;
    const compatibilityVisible = !activeMatch || activeMatch.status === "confirmed";
    card.hidden = !brandVisible || !compatibilityVisible;
  });
}

$$('.filter').forEach(button => button.addEventListener("click", () => {
  $$('.filter').forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  activeBrandFilter = button.dataset.filter;
  applyBrandFilter();
}));

function renderCart() {
  $("#cartCount").textContent = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  $("#cartTotal").textContent = money(cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0));
  $("#checkoutButton").disabled = cart.length === 0;
  if (!cart.length) {
    $("#cartItems").innerHTML = `<div class="empty-cart"><span>◌</span><h3>Корзина пока пуста</h3><p>Сначала подберите автомобиль — мы покажем статус совместимости.</p></div>`;
    return;
  }
  $("#cartItems").innerHTML = cart.map((item, index) => `<div class="cart-item"><div><h3>${item.title || item.name}</h3><p>${item.quantity || 1} шт. · ${item.vehicle || item.sku || "совместимость проверим по VIN"}</p></div><div class="cart-item__right"><strong>${money(item.price * (item.quantity || 1))}</strong><button class="remove-item" data-index="${index}" type="button">Удалить</button></div></div>`).join("");
  $$('.remove-item').forEach(button => button.addEventListener("click", () => { cart.splice(Number(button.dataset.index), 1); localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderCart(); }));
}

$$('.add-button').forEach(button => button.addEventListener("click", () => {
  const card = button.closest(".product-card");
  if (card.dataset.match === "check") {
    openModal($("#bookingModal"));
    showToast("Для этого варианта сначала проверим VIN");
    return;
  }
  if (card.dataset.match === "blocked") return;
  const vehicleName = activeMatch?.status === "confirmed" ? `${make.value} ${model.value}, ${year.value}` : "без выбранного автомобиля";
  const itemId = button.dataset.name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-");
  const existing = cart.find(item => item.id === itemId);
  if (existing) existing.quantity = (existing.quantity || 1) + 1;
  else cart.push({id:itemId, title:button.dataset.name, sku:"", price:Number(button.dataset.price), quantity:1, vehicle:vehicleName});
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  button.classList.add("added");
  button.textContent = "✓";
  setTimeout(() => { button.classList.remove("added"); button.textContent = "+"; }, 900);
  renderCart();
  showToast("Товар добавлен в корзину");
}));

function setOverlay(open) {
  $("#overlay").classList.toggle("open", open);
  document.body.classList.toggle("locked", open);
}

function openCart() {
  $("#cartDrawer").classList.add("open");
  $("#cartDrawer").setAttribute("aria-hidden", "false");
  setOverlay(true);
}

function closeCart() {
  $("#cartDrawer").classList.remove("open");
  $("#cartDrawer").setAttribute("aria-hidden", "true");
  if (!$(".modal.open")) setOverlay(false);
}

function openModal(modal) {
  closeCart();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  setOverlay(true);
  setTimeout(() => modal.querySelector("input")?.focus(), 120);
}

function closeModals() {
  $$('.modal.open').forEach(modal => { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); });
  setOverlay(false);
}

$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", () => { closeCart(); closeModals(); });
$("#checkoutButton").addEventListener("click", () => openModal($("#checkoutModal")));
$$('[data-close-modal]').forEach(button => button.addEventListener("click", closeModals));
$$('[data-booking]').forEach(button => button.addEventListener("click", () => openModal($("#bookingModal"))));

$("#checkoutForm").addEventListener("submit", event => {
  event.preventDefault();
  $("#checkoutFormView").classList.add("hidden");
  $("#successView").classList.remove("hidden");
  cart.length = 0;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
});

$("#bookingForm").addEventListener("submit", event => {
  event.preventDefault();
  closeModals();
  showToast("Заявка отправлена — скоро перезвоним");
  event.target.reset();
});

$("#menuButton").addEventListener("click", () => $("#mobileNav").classList.toggle("open"));
$$('#mobileNav a').forEach(link => link.addEventListener("click", () => $("#mobileNav").classList.remove("open")));
document.addEventListener("keydown", event => { if (event.key === "Escape") { closeCart(); closeModals(); } });

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2200);
}

function registerWebMcp() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const signal = new AbortController().signal;
  const tools = [
    {
      name: "select_vehicle",
      title: "Проверить совместимость TPMS",
      description: "Проверяет марку, модель, год и регион поставки по встроенному каталогу совместимости и показывает только подтверждённые датчики.",
      inputSchema: {type:"object", properties:{make:{type:"string"}, model:{type:"string"}, year:{type:"integer", minimum:2010, maximum:2026}, region:{type:"string", enum:["eu","us","unknown"]}}, required:["make","model","year","region"], additionalProperties:false},
      annotations: {readOnlyHint:false, untrustedContentHint:false},
      execute(input) {
        const result = lookupVehicle(input.make, input.model, input.year, input.region);
        make.value = input.make; make.dispatchEvent(new Event("change"));
        model.value = input.model; model.dispatchEvent(new Event("change"));
        year.value = String(input.year); year.dispatchEvent(new Event("change"));
        region.value = input.region;
        runSelection({scroll:false});
        return {vehicle:`${input.make} ${input.model}, ${input.year}`, status:result.status, frequency:result.frequency || null, relearn:result.relearn || null, confirmedProducts:result.status === "confirmed" ? 2 : 0};
      }
    },
    {
      name: "add_product_to_cart",
      title: "Добавить подтверждённый датчик в корзину",
      description: "Добавляет товар только если совместимость с выбранным автомобилем подтверждена каталогом.",
      inputSchema: {type:"object", properties:{name:{type:"string"}}, required:["name"], additionalProperties:false},
      annotations: {readOnlyHint:false, untrustedContentHint:false},
      execute(input) {
        const button = $$('.add-button').find(item => item.dataset.name === input.name);
        if (!button) throw new Error("Товар не найден");
        const card = button.closest(".product-card");
        if (!activeMatch || activeMatch.status !== "confirmed" || card.dataset.match !== "verified") throw new Error("Совместимость товара не подтверждена для выбранного автомобиля");
        const itemId = button.dataset.name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-");
        const existing = cart.find(item => item.id === itemId);
        if (existing) existing.quantity = (existing.quantity || 1) + 1;
        else cart.push({id:itemId, title:button.dataset.name, sku:"", price:Number(button.dataset.price), quantity:1, vehicle:`${make.value} ${model.value}, ${year.value}`});
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        renderCart();
        return {name:button.dataset.name, vehicle:`${make.value} ${model.value}, ${year.value}`, cartItems:cart.reduce((sum,item)=>sum+(item.quantity || 1),0), total:cart.reduce((sum,item)=>sum+item.price*(item.quantity || 1),0)};
      }
    }
  ];
  tools.forEach(tool => { try { Promise.resolve(context.registerTool(tool, {signal})).catch(() => {}); } catch (_) {} });
}

resetResults();
renderCart();
registerWebMcp();
