(function () {
  const currentYear = new Date().getFullYear();
  const make = document.querySelector("#vehicleMake");
  const model = document.querySelector("#vehicleModel");
  const year = document.querySelector("#vehicleYear");
  const region = document.querySelector("#vehicleRegion");
  const result = document.querySelector("#selectionResult");

  const escapeHtml = value => String(value || "").replace(/[&<>"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[char]);
  const wmiMakes = {JTD:"Toyota",JTN:"Toyota","4T1":"Toyota","5TD":"Toyota",WBA:"BMW",WBS:"BMW",WBY:"BMW",WDB:"Mercedes-Benz",WDC:"Mercedes-Benz",WDD:"Mercedes-Benz",WVW:"Volkswagen",WVG:"Volkswagen",KNA:"Kia",KND:"Kia",KNM:"Kia",KMH:"Hyundai",TMA:"Hyundai",JHM:"Honda","1HG":"Honda","2HG":"Honda",LGW:"Haval",L6T:"Geely"};

  function setupVehicleForm() {
    make.innerHTML += Object.keys(window.VehicleData.catalog).map(value => `<option>${value}</option>`).join("");
    make.addEventListener("change", () => {
      const models = Object.keys(window.VehicleData.catalog[make.value] || {});
      model.innerHTML = `<option value="">Выберите модель</option>${models.map(value => `<option>${value}</option>`).join("")}`;
      model.disabled = !models.length; year.disabled = true; region.disabled = true;
    });
    model.addEventListener("change", () => {
      const years = Array.from({length:currentYear - 1980}, (_, index) => currentYear - index);
      year.innerHTML = `<option value="">Выберите год</option>${years.map(value => `<option>${value}</option>`).join("")}`;
      year.disabled = !model.value; region.disabled = true;
    });
    year.addEventListener("change", () => { region.disabled = !year.value; });
    document.querySelector("#vehicleForm").addEventListener("submit", event => {
      event.preventDefault();
      const match = window.VehicleData.lookup(make.value, model.value, Number(year.value), region.value);
      renderCompatibility({vehicle:`${make.value} ${model.value}, ${year.value}`, match, source:"vehicle", selection:{make:make.value,model:model.value,year:Number(year.value)}});
    });
  }

  function switchTab(tab) {
    document.querySelectorAll("[data-selection-tab]").forEach(button => { const active = button.dataset.selectionTab === tab; button.classList.toggle("active", active); button.setAttribute("aria-selected", String(active)); });
    document.querySelector("#carPanel").classList.toggle("hidden", tab !== "car");
    document.querySelector("#vinPanel").classList.toggle("hidden", tab !== "vin");
    result.classList.add("hidden");
  }

  function normalizeVin(value) { return value.toUpperCase().replace(/[\s-]+/g, ""); }

  function validateVin(vin) {
    if (vin.length !== 17) return "VIN должен состоять ровно из 17 символов.";
    if (/[IOQ]/.test(vin)) return "В VIN не используются буквы I, O и Q.";
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return "Используйте только латинские буквы и цифры.";
    if (/^(.)(\1){16}$/.test(vin)) return "Проверьте номер: VIN не может состоять из одного повторяющегося символа.";
    if (/^[1-5]/.test(vin) && !hasValidChecksum(vin)) return "Контрольная цифра VIN не совпадает. Проверьте 9-й символ.";
    return "";
  }

  function hasValidChecksum(vin) {
    const map = {A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,J:1,K:2,L:3,M:4,N:5,P:7,R:9,S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9};
    const weights = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];
    const sum = [...vin].reduce((total, char, index) => total + (Number.isNaN(Number(char)) ? map[char] : Number(char)) * weights[index], 0);
    const expected = sum % 11 === 10 ? "X" : String(sum % 11);
    return vin[8] === expected;
  }

  function modelYearFromVin(vin) {
    const codes = "ABCDEFGHJKLMNPRSTVWXY123456789";
    const index = codes.indexOf(vin[9]);
    if (index < 0) return null;
    const candidates = [1980 + index, 2010 + index, 2040 + index].filter(value => value <= currentYear + 1);
    return Math.max(...candidates);
  }

  const makeAliases = {TOYOTA:"Toyota",BMW:"BMW","MERCEDES-BENZ":"Mercedes-Benz",MERCEDES:"Mercedes-Benz",VOLKSWAGEN:"Volkswagen",KIA:"Kia",HYUNDAI:"Hyundai",HONDA:"Honda",HAVAL:"Haval",GEELY:"Geely"};
  function localVehicle(decoded) {
    const localMake = makeAliases[String(decoded.Make || "").toUpperCase()] || decoded.Make;
    const models = Object.keys(window.VehicleData.catalog[localMake] || {});
    const decodedModel = String(decoded.Model || "").toLowerCase();
    const localModel = models.find(item => item.toLowerCase() === decodedModel || decodedModel.includes(item.toLowerCase()) || item.toLowerCase().includes(decodedModel));
    return {make:localMake, model:localModel, year:Number(decoded.ModelYear) || null};
  }

  function matchForVin(decoded, vin) {
    const vehicle = localVehicle(decoded);
    const errorCodes = String(decoded.ErrorCode || "0").split(",").map(code => code.trim()).filter(code => code && code !== "0");
    if (errorCodes.length) return {status:"manual",reason:"Декодер вернул неполные или противоречивые данные. Для этого VIN требуется ручная сверка по каталогу применяемости.",vehicleData:vehicle,evidence:"vin-warning"};
    const tpms = String(decoded.TPMS || "").toLowerCase();
    if (tpms.includes("indirect")) return {status:"indirect",system:"indirect",frequency:null,relearn:"калибровка через меню автомобиля",oem:"ABS",vehicleData:vehicle,evidence:"vpic"};
    if (!vehicle.make || !vehicle.model || !vehicle.year) {
      const knownType = tpms.includes("direct") ? "Декодер подтверждает прямую систему TPMS, но " : "";
      return {status:"manual",reason:`${knownType}модели нет во внутренней матрице. Нужна сверка протокола и OE-номера по профессиональному каталогу.`,vehicleData:vehicle,evidence:tpms ? "vpic" : "partial"};
    }
    const market = /^[1-5]/.test(vin) ? "us" : "eu";
    const matrixMatch = window.VehicleData.lookup(vehicle.make, vehicle.model, vehicle.year, market);
    if (!tpms.includes("direct")) {
      return {status:"manual",reason:"VIN распознан, но декодер не подтвердил тип TPMS. Сверим прямую или косвенную систему по комплектации.",candidate:matrixMatch,vehicleData:vehicle,evidence:"partial"};
    }
    if (matrixMatch.status === "confirmed") return {...matrixMatch,vehicleData:vehicle,evidence:"vpic+matrix"};
    return {...matrixMatch,vehicleData:vehicle,evidence:"vpic+matrix"};
  }

  function resultActions(match, vehicle, selection) {
    if (match.status === "confirmed") {
      const params = new URLSearchParams({frequency:String(match.frequency),vehicle,make:selection?.make || "",model:selection?.model || "",year:String(selection?.year || ""),verified:"1"});
      return `<a class="primary-button" href="catalog.html?${params}">Показать подходящие датчики</a>`;
    }
    if (match.status === "indirect") return `<a class="primary-button" href="services.html">Диагностика системы</a>`;
    return `<a class="primary-button" href="contacts.html?request=vin">Отправить VIN специалисту</a>`;
  }

  function renderCompatibility({vehicle, match, source, decoded, vin, selection}) {
    const confirmed = match.status === "confirmed";
    const indirect = match.status === "indirect";
    const label = confirmed ? "Совместимость подтверждена" : indirect ? "Датчики в колёсах не нужны" : match.status === "ambiguous" ? "Нужна проверка комплектации" : "Нужна ручная сверка";
    const detail = confirmed ? `<div class="result-specs"><div><span>Частота</span><strong>${match.frequency} МГц</strong></div><div><span>Прописка</span><strong>${escapeHtml(match.relearn)}</strong></div><div><span>Штатный производитель</span><strong>${escapeHtml(match.oem)}</strong></div></div>` : indirect ? `<p class="result-reason">В автомобиле используется косвенная система через ABS. Радиодатчики покупать не нужно.</p>` : `<p class="result-reason">${escapeHtml(match.reason)}</p>`;
    const decodedInfo = decoded ? `<div class="decoded-grid"><div><span>Марка</span><strong>${escapeHtml(decoded.Make || "Не определена")}</strong></div><div><span>Модель</span><strong>${escapeHtml(decoded.Model || "Не определена")}</strong></div><div><span>Год</span><strong>${escapeHtml(decoded.ModelYear || modelYearFromVin(vin) || "Не определён")}</strong></div><div><span>Тип TPMS</span><strong>${escapeHtml(decoded.TPMS === "Direct" ? "Прямая система" : decoded.TPMS === "Indirect" ? "Косвенная система" : "Не определён")}</strong></div><div><span>Страна производства</span><strong>${escapeHtml(decoded.PlantCountry || "Не указана")}</strong></div></div>` : "";
    const evidence = source === "vin" ? `<p class="result-source">${match.evidence === "vpic+matrix" ? "Источник решения: VIN-декодер + матрица применимости TPMS" : match.evidence === "vpic" ? "Источник решения: тип TPMS из VIN-декодера" : "Данных VIN недостаточно для автоматического выбора товара"}</p>` : "";
    result.className = `selection-result selection-result--${confirmed ? "ok" : indirect ? "info" : "manual"}`;
    result.innerHTML = `<div class="selection-result__head"><span>${confirmed ? "✓" : indirect ? "i" : "?"}</span><div><small>${source === "vin" ? "Результат проверки VIN" : "Результат подбора"}</small><h2>${label}</h2><p>${escapeHtml(vehicle)}</p></div></div>${decodedInfo}${detail}${evidence}<div class="selection-result__actions">${resultActions(match, vehicle, selection || match.vehicleData)}<span>${confirmed ? "До оплаты ещё раз сверим OE-номер по полному VIN." : "Случайные товары не показываем."}</span></div>`;
    result.classList.remove("hidden");
    result.scrollIntoView({behavior:"smooth",block:"nearest"});
  }

  async function decodeVin(vin) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`, {signal:controller.signal});
      if (!response.ok) throw new Error("Сервис декодирования временно недоступен");
      const payload = await response.json();
      const decoded = payload.Results?.[0];
      if (!decoded) throw new Error("Декодер не вернул данные");
      return enrichDecoded(decoded, vin);
    } finally { clearTimeout(timer); }
  }

  function enrichDecoded(decoded, vin) {
    const fallbackMake = wmiMakes[vin.slice(0,3)] || "";
    return {...decoded,Make:decoded.Make || fallbackMake,ModelYear:decoded.ModelYear || String(modelYearFromVin(vin) || ""),DecodeSource:decoded.Make ? "vpic" : fallbackMake ? "wmi" : "partial"};
  }

  function localDecode(vin) {
    return enrichDecoded({Make:"",Model:"",ModelYear:"",PlantCountry:"",TPMS:"",ErrorCode:"local"}, vin);
  }

  function setupVinForm() {
    const input = document.querySelector("#vinInput");
    const counter = document.querySelector("#vinCounter");
    const error = document.querySelector("#vinError");
    const button = document.querySelector("#vinSubmit");
    input.addEventListener("input", () => {
      const caret = input.selectionStart;
      input.value = normalizeVin(input.value);
      input.setSelectionRange(caret, caret);
      counter.textContent = `${input.value.length} / 17`;
      error.classList.add("hidden");
    });
    document.querySelector("#vinForm").addEventListener("submit", async event => {
      event.preventDefault();
      const vin = normalizeVin(input.value);
      const message = validateVin(vin);
      if (message) { error.textContent = message; error.classList.remove("hidden"); input.setAttribute("aria-invalid","true"); input.focus(); return; }
      input.removeAttribute("aria-invalid");
      button.disabled = true; button.textContent = "Проверяем VIN…";
      result.className = "selection-result selection-result--loading";
      result.innerHTML = `<div class="loading-row"><span></span><div><strong>Декодируем автомобиль</strong><p>Проверяем производителя, модель и год выпуска.</p></div></div>`;
      result.classList.remove("hidden");
      try {
        const decoded = await decodeVin(vin);
        const vehicle = [decoded.Make,decoded.Model,decoded.ModelYear].filter(Boolean).join(" ");
        const match = matchForVin(decoded, vin);
        sessionStorage.setItem("tpms-vin-selection", JSON.stringify({vin,vehicle,decodedAt:Date.now()}));
        renderCompatibility({vehicle:vehicle || `VIN …${vin.slice(-6)}`,match,source:"vin",decoded,vin,selection:match.vehicleData});
      } catch (requestError) {
        const decoded = localDecode(vin);
        const vehicle = [decoded.Make,decoded.ModelYear].filter(Boolean).join(" ") || `VIN …${vin.slice(-6)}`;
        const match = {status:"manual",reason:"Онлайн-декодер временно недоступен. Мы определили доступные данные локально, но для выбора датчика нужна ручная сверка.",vehicleData:localVehicle(decoded),evidence:"partial"};
        sessionStorage.setItem("tpms-vin-selection", JSON.stringify({vin,vehicle,decodedAt:Date.now()}));
        renderCompatibility({vehicle,match,source:"vin",decoded,vin,selection:match.vehicleData});
      } finally { button.disabled = false; button.textContent = "Расшифровать VIN"; }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupVehicleForm(); setupVinForm();
    document.querySelectorAll("[data-selection-tab]").forEach(button => button.addEventListener("click", () => switchTab(button.dataset.selectionTab)));
    if (location.hash === "#vin") switchTab("vin");
    const params = new URLSearchParams(location.search);
    if (params.get("make") && params.get("model") && params.get("year") && params.get("region")) {
      make.value = params.get("make"); make.dispatchEvent(new Event("change"));
      model.value = params.get("model"); model.dispatchEvent(new Event("change"));
      year.value = params.get("year"); year.dispatchEvent(new Event("change"));
      region.value = params.get("region");
      const match = window.VehicleData.lookup(make.value, model.value, Number(year.value), region.value);
      renderCompatibility({vehicle:`${make.value} ${model.value}, ${year.value}`, match, source:"vehicle", selection:{make:make.value,model:model.value,year:Number(year.value)}});
    }
  });
})();
