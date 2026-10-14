(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const make=$('#vehicleMake'),model=$('#vehicleModel'),year=$('#vehicleYear'),region=$('#vehicleRegion'),result=$('#selectionResult');
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=x=>String(x||'').normalize('NFKC').toUpperCase().replace(/Ё/g,'Е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  let index,models=new Map(),productCache=new Map();
  const option=(value,label=value)=>`<option value="${esc(value)}">${esc(label)}</option>`;
  function show(html,kind='manual') {
    result.className='selection-result selection-result--'+kind;
    result.innerHTML=html;
    result.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function notice(title,text) { show(`<h2>${esc(title)}</h2><p class="result-reason">${esc(text)}</p><a class="primary-button" href="https://prodat4iki.ru/contacts">Связаться со специалистом</a>`); }
  function setupModels() {
    const entries=models.get(make.value)||new Map();
    model.innerHTML=option('','Выберите модель')+[...entries.keys()].sort((a,b)=>a.localeCompare(b,'ru')).map(v=>option(v)).join('');
    model.disabled=!entries.size;year.disabled=true;region.disabled=true;
    year.innerHTML=option('','Выберите год');
  }
  function setupYears() {
    const years=models.get(make.value)?.get(model.value)||new Set();
    year.innerHTML=option('','Выберите год')+[...years].sort((a,b)=>b-a).map(v=>option(v)).join('');
    year.disabled=!years.size;region.disabled=true;
  }
  async function findProducts(vehicle) {
    if(!productCache.has(vehicle.make)){
      const file=index.chunks[vehicle.make];
      if(!/^\.\/kit-fitment\/[a-f0-9]{12}\.json$/.test(file||''))throw Error('invalid chunk');
      const response=await fetch(file,{cache:'no-cache'});if(!response.ok)throw Error('chunk unavailable');
      const products=await response.json();if(!Array.isArray(products))throw Error('invalid chunk');productCache.set(vehicle.make,products);
    }
    return productCache.get(vehicle.make).filter(p=>p.availableAtExport).flatMap(p=>{
      const fitment=p.fitments.find(f=>normalize(f.make)===normalize(vehicle.make)&&normalize(f.model)===normalize(vehicle.model)&&f.years.includes(Number(vehicle.year)));
      return fitment?[{...p,fitment}]:[];
    });
  }
  async function renderProducts(vehicle,prefix='') {
    let products;
    try{products=await findProducts(vehicle);}catch{notice('Не удалось загрузить применяемость','Повторите подбор позже или свяжитесь со специалистом. Без справочника товар не предлагаем.');return;}
    const heading=`${vehicle.make} ${vehicle.model}, ${vehicle.year}`;
    if(!products.length){notice(heading,'В опубликованных карточках нет совпадения с этими данными. Товар наугад не предлагаем: требуется сверка OE-номера специалистом.');return;}
    const market=vehicle.market==='eu'?'Россия / Европа':vehicle.market==='us'?'США / Канада':'не указан';
    show(`${prefix}<small>ПРИМЕНЯЕМОСТЬ ИЗ КАТАЛОГА KIT</small><h2>${esc(heading)}</h2><p>Найдено карточек с указанной продавцом применяемостью: ${products.length}. Рынок поставки: ${esc(market)}. Экспорт не содержит полной матрицы рынков и комплектаций: частоту, OE-номер и комплектацию нужно сверить перед покупкой.</p><div class="kit-products" id="kitProductResults"></div><button type="button" class="primary-button" id="kitMore">Показать ещё</button><p class="kit-snapshot">Справочник обновлён ${esc(new Date(index.exportedAt).toLocaleDateString('ru-RU'))}. Актуальные цены и наличие — в KIT. VIN в модуле не сохраняется.</p>`,'ok');
    let visible=0;
    const renderMore=()=>{
      $('#kitProductResults').insertAdjacentHTML('beforeend',products.slice(visible,visible+12).map(p=>`<article class="kit-product"><h3>${esc(p.title)}</h3><p>${esc(p.fitment.sourceLine)}</p>${p.fitment.condition?`<p class="kit-fitment-warning">Есть дополнительное условие по VIN, кузову или комплектации. Нужна ручная сверка.</p>`:''}<a href="${esc(p.url)}">Открыть товар в KIT →</a></article>`).join(''));
      visible+=12;$('#kitMore').hidden=visible>=products.length;
    };
    $('#kitMore').addEventListener('click',renderMore);renderMore();
  }
  function switchTab(tab) {
    for(const button of document.querySelectorAll('[data-selection-tab]')){const active=button.dataset.selectionTab===tab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));}
    $('#carPanel').classList.toggle('hidden',tab!=='car');$('#vinPanel').classList.toggle('hidden',tab!=='vin');result.classList.add('hidden');
  }
  function resolveDecoded(decoded) {
    const makeValue=[...models.keys()].find(v=>normalize(v)===normalize(decoded.Make));
    if(!makeValue)return null;
    const yearValue=Number(decoded.ModelYear);
    const candidates=[...(models.get(makeValue)||new Map()).entries()].filter(([,years])=>!yearValue||years.has(yearValue));
    const exact=candidates.filter(([name])=>normalize(name)===normalize(decoded.Model));
    const series=decoded.LocalVehicle?.series;
    const bySeries=series?candidates.filter(([name])=>normalize(name).split(' ').includes(normalize(series))):[];
    const matching=exact.length===1?exact:bySeries;
    if(matching.length!==1)return {make:makeValue,year:yearValue,needsModel:true,needsYear:!yearValue};
    return {make:makeValue,model:matching[0][0],year:yearValue,needsYear:!yearValue};
  }
  function clarifyVehicle(vehicle,market) {
    switchTab('car');
    if(!vehicle)return;
    make.value=vehicle.make;setupModels();
    if(vehicle.model){model.value=vehicle.model;setupYears();}
    if(vehicle.year&&vehicle.model){year.value=String(vehicle.year);region.disabled=false;}
    region.value=market;
    (vehicle.model?year:model).focus();
  }
  async function initialize() {
    make.disabled=true;$('#vehicleForm button').disabled=true;
    async function loadCatalog() {
    try {
      const response=await fetch('./kit-fitment-index.json',{cache:'no-cache'});if(!response.ok)throw Error('catalog');index=await response.json();
      if(index.version!==2||index.coverage!=='complete'||!index.vehicles||!index.chunks)throw Error('invalid catalog');
      for(const [make,entries] of Object.entries(index.vehicles))models.set(make,new Map(Object.entries(entries).map(([name,years])=>[name,new Set(years)])));
      make.innerHTML=option('','Выберите марку')+[...models.keys()].sort((a,b)=>a.localeCompare(b,'ru')).map(v=>option(v)).join('');make.disabled=false;$('#vehicleForm button').disabled=false;
    } catch { notice('Каталог временно недоступен','Справочник не загрузился. Декодирование VIN доступно, но товары без данных применяемости не покажем.'); }
    }
    make.addEventListener('change',setupModels);model.addEventListener('change',setupYears);year.addEventListener('change',()=>{region.disabled=!year.value;});
    $('#vehicleForm').addEventListener('submit',async event=>{event.preventDefault();const button=$('#vehicleForm button');button.disabled=true;try{if(index)await renderProducts({make:make.value,model:model.value,year:Number(year.value),market:region.value});}finally{button.disabled=false;}});
    for(const b of document.querySelectorAll('[data-selection-tab]'))b.addEventListener('click',()=>switchTab(b.dataset.selectionTab));
    if(location.hash==='#vin')switchTab('vin');
    const input=$('#vinInput'),error=$('#vinError'),button=$('#vinSubmit');
    input.addEventListener('input',()=>{input.value=window.TpmsVinDecoder.normalizeVin(input.value);$('#vinCounter').textContent=`${input.value.length} / 17`;error.classList.add('hidden');});
    $('#vinForm').addEventListener('submit',async event=>{
      event.preventDefault();const vin=window.TpmsVinDecoder.normalizeVin(input.value);const invalid=window.TpmsVinDecoder.validateVin(vin);
      if(invalid){error.textContent=invalid;error.classList.remove('hidden');input.setAttribute('aria-invalid','true');input.focus();return;}
      input.removeAttribute('aria-invalid');button.disabled=true;button.textContent='Проверяем VIN…';
      let decoded;
      try{decoded=await window.TpmsVinDecoder.decodeVin(vin);}catch{decoded=window.TpmsVinDecoder.localDecode(vin);}
      try {
        const identity=[decoded.Make,decoded.LocalVehicle?.modification||decoded.Model,decoded.ModelYear].filter(Boolean).join(' ');
        const local=decoded.LocalVehicle;
        const source=decoded.DecodeSource==='manufacturer-code'?'Собственная база кодов производителя. VIN не отправлялся во внешний декодер.':decoded.DecodeSource==='vpic'?'Данные vPIC дополнены локальными правилами.':'Доступны только локальные данные производителя; полного распознавания нет.';
        const prefix=`<small>АВТОМОБИЛЬ ПО VIN</small><h2>${esc(identity||'Не удалось определить автомобиль')}</h2><p>${esc(source)}</p>${local?.series?`<p>Кузов: ${esc(local.series)} · код типа: ${esc(local.typeCode)}. ${local.from?`Период выпуска модели: ${local.from}–${local.to}. Это не год конкретного автомобиля.`:''}</p>`:''}`;
        if(/indirect/i.test(decoded.TPMS||'')){show(prefix+'<p>Декодер указал косвенную TPMS. Радиодатчики без дополнительной проверки не предлагаем.</p>');return;}
        const warnings=String(decoded.ErrorCode||'0').split(',').some(x=>x.trim()&&x.trim()!=='0');
        if(warnings&&decoded.LocalVehicle?.confidence!=='exact-type'){show(prefix+'<p>Декодер вернул неполные или противоречивые данные. Автоматический подбор заблокирован.</p><a class="primary-button" href="https://prodat4iki.ru/contacts">Сверить VIN со специалистом</a>');return;}
        const vehicle=index&&resolveDecoded(decoded);
        if(!vehicle||vehicle.needsModel||vehicle.needsYear||!/^direct$/i.test(decoded.TPMS||'')){
          const text=vehicle?.needsYear?'Точный год не определён. Укажите год по документам и проверьте поколение модели.':vehicle?.needsModel?'В каталоге нет однозначного совпадения модели: уточните модель и поколение.':'Тип TPMS и OE-номер не подтверждены. По каталогу можно посмотреть кандидатов, но не гарантировать совместимость комплектации.';
          show(prefix+`<p>${esc(text)} Применяемость из описаний товаров не заменяет проверку установленного датчика.</p><button class="primary-button" type="button" id="kitClarify">Уточнить автомобиль</button><a class="primary-button" href="https://prodat4iki.ru/contacts">Сверить комплектацию</a>`);
          $('#kitClarify').addEventListener('click',()=>clarifyVehicle(vehicle,$('#vinRegion').value));return;
        }
        vehicle.market=$('#vinRegion').value;
        await renderProducts(vehicle,prefix);
      } finally {button.disabled=false;button.textContent='Расшифровать VIN';}
    });
    // Bind forms first: VIN must never fall through to a native GET submission.
    const decoderReady=typeof window.TpmsVinDecoder?.validateVin==='function';
    input.disabled=!decoderReady;button.disabled=!decoderReady;
    await loadCatalog();
  }
  initialize();
})();
