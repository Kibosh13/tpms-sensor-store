// Source templates for KIT. Merchant fields are declared in each JSON schema;
// responsive layout, spacing and typography stay in the template CSS.
const text = (title, maxLength = 120) => ({type:"string", title, maxLength});
const longText = title => ({type:"string", title, maxLength:600});
const link = title => ({type:"string", title, maxLength:500});
const group = (title,properties) => ({type:"object",title,properties,required:Object.keys(properties)});
const facts = Object.fromEntries([1,2,3].map(n=>[`fact${n}`,group(`Факт ${n}`,{value:text("Значение",25),description:text("Подпись",90)})]));
const services = Object.fromEntries([1,2,3,4].map(n=>[`service${n}`,group(`Услуга ${n}`,{title:text("Название услуги",65),description:longText("Описание услуги"),price:text("Цена",25)})]));
const delivery = Object.fromEntries([1,2,3].map(n=>[`option${n}`,group(`Способ получения ${n}`,{title:text("Название",55),description:longText("Условия"),price:text("Стоимость",25)})]));
const css = `
.pd-band { --pd-accent: var(--ys-color-token-brand-primary, #f4eb00); --pd-ink: #151618; --pd-dark: #111214; --pd-paper: #f1f1ed; box-sizing: border-box; width: 100%; color: var(--pd-ink); background: var(--pd-paper); font-family: var(--ys-font-family, Manrope, sans-serif); padding: var(--ys-spacing-1200, 112px) var(--ys-spacing-300, 24px); }
.pd-band *, .pd-band *::before, .pd-band *::after { box-sizing: border-box; }
.pd-band--dark { background: var(--pd-dark); color: #f2f2ed; }
.pd-shell { width: min(100%, 1280px); margin-inline: auto; min-width: 0; }
.pd-eyebrow { margin: 0 0 var(--ys-spacing-200, 16px); color: #827c00; font-size: 12px; font-weight: 800; letter-spacing: .18em; line-height: 1.5; text-transform: uppercase; }
.pd-band--dark .pd-eyebrow { color: var(--pd-accent); }
.pd-h1 { max-width: 840px; margin: 0 0 var(--ys-spacing-300, 24px); font-size: clamp(42px, 7vw, 84px); font-weight: 800; letter-spacing: -.05em; line-height: 1.04; overflow-wrap: break-word; }
.pd-h2 { max-width: 740px; margin: 0 0 var(--ys-spacing-300, 24px); font-size: clamp(28px, 4vw, 48px); font-weight: 800; line-height: 1.1; letter-spacing: -.04em; overflow-wrap: break-word; }
.pd-lead { max-width: 660px; margin: 0; color: #71747a; font-size: 17px; line-height: 1.7; }
.pd-band--dark .pd-lead { color: #93979e; }
.pd-button { display: inline-flex; align-items: center; justify-content: center; gap: var(--ys-spacing-100, 8px); min-height: 54px; margin-top: var(--ys-spacing-300, 24px); border: 0; border-radius: 12px; padding: var(--ys-spacing-200, 16px) var(--ys-spacing-350, 28px); color: #111214; background: var(--pd-accent); text-align: center; text-decoration: none; font-size: 15px; font-weight: 800; line-height: 1.4; }
.pd-button:hover { filter: brightness(.94); }
.pd-button:focus-visible, .pd-link:focus-visible { outline: 3px solid var(--pd-accent); outline-offset: 4px; }
.pd-link { display: inline-block; color: var(--pd-accent); text-decoration: none; border-bottom: 2px solid var(--pd-accent); font-size: 14px; font-weight: 800; padding-bottom: var(--ys-spacing-50, 4px); }
.pd-split { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); gap: var(--ys-spacing-800, 64px); align-items: center; }
.pd-card { min-width: 0; border: 1px solid #d5d5cf; border-radius: 20px; background: #fbfbf8; padding: var(--ys-spacing-500, 40px); color: #151618; }
.pd-card h2 { margin: 0 0 var(--ys-spacing-200, 16px); font-size: 26px; line-height: 1.2; letter-spacing: -.025em; }
.pd-card p { color: #75787d; line-height: 1.7; font-size: 14px; }
.pd-card .pd-button { width: 100%; }
.pd-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--ys-spacing-200, 16px); margin-top: var(--ys-spacing-500, 40px); padding-top: var(--ys-spacing-300, 24px); border-top: 1px solid #ffffff14; }
.pd-facts strong { display: block; color: var(--pd-accent); font-size: 20px; font-weight: 800; }
.pd-facts span { display: block; margin-top: var(--ys-spacing-100, 8px); color: #909399; font-size: 12px; line-height: 1.5; }
.pd-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--ys-spacing-300, 24px); margin-top: var(--ys-spacing-600, 48px); }
.pd-service { min-width: 0; padding: var(--ys-spacing-400, 32px); border: 1px solid #ffffff14; border-radius: 16px; background: #1b1d20; }
.pd-service small { display: block; margin-bottom: var(--ys-spacing-500, 40px); color: #777b82; font-size: 12px; }
.pd-service h3 { margin: 0 0 var(--ys-spacing-200, 16px); font-size: 20px; line-height: 1.25; letter-spacing: -.02em; }
.pd-service p { min-height: 96px; margin: 0 0 var(--ys-spacing-300, 24px); color: #96999f; font-size: 14px; line-height: 1.7; overflow-wrap: anywhere; }
.pd-service strong { display: block; color: var(--pd-accent); font-size: 25px; }
.pd-info-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--ys-spacing-300, 24px); margin-top: var(--ys-spacing-500, 40px); }
.pd-info { min-width: 0; border: 1px solid #d5d5cf; border-radius: 18px; padding: var(--ys-spacing-400, 32px); background: #fbfbf8; }
.pd-info h3 { margin: 0 0 var(--ys-spacing-150, 12px); font-size: 24px; line-height: 1.2; }
.pd-info p { min-height: 72px; color: #777a7e; font-size: 14px; line-height: 1.7; }
.pd-info strong { display: block; margin-top: var(--ys-spacing-200, 16px); font-size: 22px; }
.pd-contact-map { padding: var(--ys-spacing-600, 48px); border: 1px solid #ffffff14; border-radius: 20px; background: #25272a; min-height: 360px; display: grid; align-content: center; }
.pd-contact-map h3 { margin: 0 0 var(--ys-spacing-200, 16px); font-size: clamp(28px, 3vw, 40px); line-height: 1.15; letter-spacing: -.04em; }
.pd-contact-map p { color: #a3a7ad; font-size: 14px; line-height: 1.7; }
.pd-contact-row { display: grid; grid-template-columns: 100px minmax(0, 1fr); gap: var(--ys-spacing-200, 16px); padding-block: var(--ys-spacing-200, 16px); border-top: 1px solid #ffffff14; }
.pd-contact-row span { color: #92969d; font-size: 13px; }
.pd-contact-row strong, .pd-contact-row a { color: #f2f2ed; font-size: 15px; font-weight: 700; text-decoration: none; overflow-wrap: anywhere; }
.pd-inline-actions { display: flex; align-items: center; flex-wrap: wrap; gap: var(--ys-spacing-300, 24px); }
.pd-service h3, .pd-service strong, .pd-info h3, .pd-info strong, .pd-contact-map h3, .pd-card h2 { overflow-wrap: anywhere; }
@media (max-width: 1050px) { .pd-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .pd-split { gap: var(--ys-spacing-400, 32px); } }
@media (max-width: 760px) { .pd-band { padding: var(--ys-spacing-900, 72px) var(--ys-spacing-200, 16px); } .pd-split, .pd-grid, .pd-info-grid { grid-template-columns: minmax(0, 1fr); } .pd-h1 { font-size: 42px; } .pd-h2 { font-size: 34px; } .pd-lead { font-size: 15px; } .pd-card, .pd-contact-map { padding: var(--ys-spacing-300, 24px); } .pd-facts strong { font-size: 17px; } .pd-facts span { font-size: 11px; } .pd-service p, .pd-info p { min-height: 0; } .pd-contact-row { grid-template-columns: minmax(0, 1fr); gap: var(--ys-spacing-100, 8px); } }
`;
function template(id, title, html, properties, defaults) {
  const extra = id === 'hero' ? '\n.pd-band { overflow-wrap: anywhere; }\n.pd-button { max-width: 100%; }\n.pd-band--dark .pd-card .pd-eyebrow { color: #827c00; }' : '';
  return {id, title, html:html.trim(), css:css.trim()+extra, schema:{title, type:"object", properties, required:Object.keys(properties)}, settings:defaults};
}
export const templates = [
  template("intro", "ProДатчики · заголовок страницы", `
    <section class="pd-band pd-band--dark"><div class="pd-shell"><p class="pd-eyebrow">{{settings.eyebrow}}</p><h1 class="pd-h1">{{settings.title}}</h1><p class="pd-lead">{{settings.description}}</p><a class="pd-button" href="{{settings.buttonUrl}}">{{settings.buttonText}}</a></div></section>`,
    {eyebrow:text("Надзаголовок",40),title:text("Заголовок",100),description:longText("Описание"),buttonText:text("Текст кнопки",45),buttonUrl:link("Ссылка кнопки")},
    {eyebrow:"КАТАЛОГ TPMS",title:"Датчики давления шин на 98% марок авто",description:"Ищите по названию или артикулу, выберите марку автомобиля и производителя. Для точной совместимости сначала выберите автомобиль или проверьте VIN.",buttonText:"Подобрать по автомобилю или VIN →",buttonUrl:"/selection"}),
  template("hero", "ProДатчики · первый экран", `
    <section class="pd-band pd-band--dark"><div class="pd-shell pd-split"><div><p class="pd-eyebrow">{{settings.eyebrow}}</p><h1 class="pd-h1">{{settings.title}}</h1><p class="pd-lead">{{settings.description}}</p><div class="pd-facts">${[1,2,3].map(n=>`<div><strong>{{settings.fact${n}.value}}</strong><span>{{settings.fact${n}.description}}</span></div>`).join('')}</div></div><div class="pd-card"><p class="pd-eyebrow">{{settings.panelEyebrow}}</p><h2>{{settings.panelTitle}}</h2><p>{{settings.panelDescription}}</p><a class="pd-button" href="{{settings.buttonUrl}}">{{settings.buttonText}}</a><p>{{settings.panelNote}}</p></div></div></section>`,
    {eyebrow:text("Надзаголовок",40),title:text("Заголовок",90),description:longText("Описание"),panelEyebrow:text("Надзаголовок панели",40),panelTitle:text("Заголовок панели",50),panelDescription:longText("Описание подбора"),panelNote:text("Подсказка под кнопкой",180),buttonText:text("Текст кнопки",45),buttonUrl:link("Адрес подбора"),...facts},
    {eyebrow:"TPMS / ДАТЧИКИ ДАВЛЕНИЯ",title:"Подберём датчики под ваш автомобиль",description:"Оригинальные и программируемые датчики. Проверим совместимость, запрограммируем и пропишем в системе автомобиля.",panelEyebrow:"БЫСТРЫЙ ПОДБОР",panelTitle:"Укажите автомобиль",panelDescription:"Марка, модель, год выпуска и рынок поставки помогут определить нужный датчик.",panelNote:"Также доступна отдельная проверка по VIN.",buttonText:"Продолжить точный подбор",buttonUrl:"/selection",fact1:{value:"Подбор",description:"по вашему автомобилю"},fact2:{value:"2 года",description:"гарантия на датчики Autel"},fact3:{value:"от 1 600 ₽",description:"датчик с программированием"}}),
  template("services", "ProДатчики · услуги и цены", `
    <section class="pd-band pd-band--dark"><div class="pd-shell"><p class="pd-eyebrow">{{settings.eyebrow}}</p><h2 class="pd-h2">{{settings.title}}</h2><p class="pd-lead">{{settings.description}}</p><div class="pd-grid">${[1,2,3,4].map(n=>`<article class="pd-service"><small>0${n}</small><h3>{{settings.service${n}.title}}</h3><p>{{settings.service${n}.description}}</p><strong>{{settings.service${n}.price}}</strong></article>`).join('')}</div><a class="pd-button" href="{{settings.buttonUrl}}">{{settings.buttonText}}</a></div></section>`,
    {eyebrow:text("Надзаголовок",40),title:text("Заголовок",100),description:longText("Описание"),buttonText:text("Текст кнопки",45),buttonUrl:link("Ссылка записи"),...services},
    {eyebrow:"СЕРВИС",title:"Работаем с датчиками давления шин с 2019 г.",description:"Диагностика, прописка и клонирование без шиномонтажа. Программирование наших датчиков — бесплатно.",buttonText:"Записаться на проверку",buttonUrl:"/contacts",service1:{title:"Диагностика ваших датчиков",description:"Проверим сигнал, батарею и ошибки каждого вашего датчика.",price:"1 000 ₽"},service2:{title:"Программирование наших датчиков",description:"Запрограммируем купленные у нас датчики под ваш автомобиль.",price:"0 ₽"},service3:{title:"Прописка",description:"Добавим ID датчиков в систему автомобиля и проверим связь.",price:"1 000 ₽"},service4:{title:"Клонирование",description:"Скопируем ID рабочего датчика на новый совместимый датчик.",price:"1 000 ₽"}}),
  template("delivery", "ProДатчики · доставка и оплата", `
    <section class="pd-band"><div class="pd-shell"><p class="pd-eyebrow">{{settings.eyebrow}}</p><h2 class="pd-h2">{{settings.title}}</h2><p class="pd-lead">{{settings.description}}</p><div class="pd-info-grid">${[1,2,3].map(n=>`<article class="pd-info"><h3>{{settings.option${n}.title}}</h3><p>{{settings.option${n}.description}}</p><strong>{{settings.option${n}.price}}</strong></article>`).join('')}</div><a class="pd-button" href="{{settings.buttonUrl}}">{{settings.buttonText}}</a></div></section>`,
    {eyebrow:text("Надзаголовок",40),title:text("Заголовок",100),description:longText("Описание"),buttonText:text("Текст кнопки",45),buttonUrl:link("Ссылка кнопки"),...delivery},
    {eyebrow:"ПОЛУЧЕНИЕ ЗАКАЗА",title:"Оплата и доставка",description:"Перед оплатой сверим совместимость датчиков. Условия получения и стоимость доставки подтвердим при оформлении заказа.",buttonText:"Как нас найти",buttonUrl:"/contacts",option1:{title:"Самовывоз",description:"Москва, Кронштадтский бульвар, 35Б, офис 3108. Ежедневно с 11:00 до 18:00.",price:"Бесплатно"},option2:{title:"Доставка по Москве",description:"Способ получения и стоимость согласуем при оформлении заказа.",price:"По тарифу службы"},option3:{title:"Доставка по России",description:"Службу доставки, стоимость и сроки подтвердим перед отправкой.",price:"Расчёт при оформлении"}}),
  template("contacts", "ProДатчики · контакты и самовывоз", `
    <section class="pd-band pd-band--dark"><div class="pd-shell pd-split"><div class="pd-contact-map"><p class="pd-eyebrow">{{settings.mapEyebrow}}</p><h3>{{settings.building}}</h3><p>{{settings.office}}</p><a class="pd-button" href="{{settings.mapUrl}}">{{settings.mapButtonText}}</a></div><div><p class="pd-eyebrow">{{settings.eyebrow}}</p><h2 class="pd-h2">{{settings.title}}</h2><div class="pd-contact-row"><span>Адрес</span><strong>{{settings.address}}</strong></div><div class="pd-contact-row"><span>Режим работы</span><strong>{{settings.hours}}</strong></div><div class="pd-contact-row"><span>Телефон</span><strong><a href="{{settings.phoneUrl}}">{{settings.phone}}</a></strong></div><div class="pd-inline-actions"><a class="pd-button" href="{{settings.bookingUrl}}">{{settings.bookingText}}</a><a class="pd-link" href="{{settings.phoneUrl}}">Позвонить</a></div></div></div></section>`,
    {mapEyebrow:text("Надзаголовок адресной карточки",40),building:text("Здание",80),office:text("Офис и часы",120),mapUrl:link("Ссылка на карту"),mapButtonText:text("Текст кнопки карты",45),eyebrow:text("Надзаголовок",40),title:text("Заголовок",100),address:text("Адрес",180),hours:text("Режим работы",70),phone:text("Телефон",35),phoneUrl:link("Ссылка для звонка"),bookingUrl:link("Ссылка записи"),bookingText:text("Текст записи",45)},
    {mapEyebrow:"PROДАТЧИКИ · МОСКВА",building:"Кронштадтский бульвар, 35Б",office:"Офис 3108 · ежедневно с 11:00 до 18:00",mapUrl:"https://yandex.ru/maps/?text=Москва%2C%20Кронштадтский%20бульвар%2C%2035Б",mapButtonText:"Открыть в Яндекс Картах ↗",eyebrow:"САМОВЫВОЗ И СЕРВИС",title:"Как нас найти",address:"г. Москва, Кронштадтский бульвар, 35Б, офис 3108",hours:"Ежедневно, 11:00–18:00",phone:"+7 (977) 396-17-19",phoneUrl:"tel:+79773961719",bookingUrl:"tel:+79773961719",bookingText:"Записаться на сервис"})
];
