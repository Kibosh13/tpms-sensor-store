import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const workspace = path.resolve(process.argv[2]);
const toolsDir = path.resolve(process.argv[3]);
const work = path.join(workspace,'storefront.json');
const repo = path.resolve(import.meta.dirname,'..');
const ids = JSON.parse(await fs.readFile(path.join(repo,'kit/template-ids.json'),'utf8')).templates;
const sessionId = '5fba547d-33c3-4aa5-a956-0bbefdbd19be';
const prompt = 'Перенеси сайт ProДатчики в мой KIT, сохрани редактируемое оформление и реальные товары, подбор по авто и VIN.';
function run(...args) {
  const output = execFileSync('python3',[
    path.join(toolsDir,'skills/kit-storefront-constructor/scripts/kit.py'),
    '--bff-url','https://prodat4iki.ru','--skill-prompt',prompt,
    '--skill-session-id',sessionId,'--skill-harness','codex',...args
  ],{encoding:'utf8',env:{...process.env,YANDEX_KIT_SKILLS_TELEMETRY_DISABLED:'1'},maxBuffer:8*1024*1024});
  return JSON.parse(output);
}
let content = JSON.parse(await fs.readFile(work,'utf8'));
const cartSection=content.pages.find(p=>p.alias==='cart').layout.find(s=>s.widget==='YandexKit.ShoppingCart');
run('section','set','--work',work,'--id',cartSection.id,'--settings-file',path.join(workspace,'settings/cart.json'));
const pages = Object.fromEntries(content.pages.filter(p=>p.variant_type==='default'&&p.alias).map(p=>[p.alias,p.id]));
for(const route of ['services','contacts','selection']) {
  const p=content.pages.find(p=>p.pattern==='/'+route);
  if(!p)throw Error('Missing prepared page '+route);
  pages[route]=p.id;
}
await fs.writeFile(path.join(repo,'kit/page-ids.json'),JSON.stringify({store:'kit3917',state:'workspace-only',pages},null,2)+'\n');
// Remove legacy theme decorations, not catalog entities or legal/account pages.
const remove = new Set();
for(const p of content.pages)for(const s of p.layout) {
  if(['YandexKit.AnnouncementBar','YandexKit.BannersCarousel','YandexKit.FeaturedCollections','YandexKit.EmailSubscription'].includes(s.widget))remove.add(s.id);
  if(p.alias==='main'&&!['YandexKit.Header','YandexKit.Footer','YandexKit.Mystique'].includes(s.widget))remove.add(s.id);
  if(p.alias==='catalog'&&s.widget==='YandexKit.CollectionsListing')remove.add(s.id);
  if(p.id===pages.categoryAndCollection&&s.widget==='YandexKit.ProductsListing')remove.add(s.id);
  if(p.id===pages.productCard&&s.widget==='YandexKit.ProductDetails')remove.add(s.id);
  if(['delivery','payment'].includes(p.alias)&&s.widget==='YandexKit.RichText'&&String(s.settings.content||'').startsWith('Шаблон для страницы'))remove.add(s.id);
}
for(const id of remove){run('section','remove','--work',work,'--id',id);}
console.log(`Removed ${remove.size} legacy layout sections in the workspace only.`);
async function add(page,name,changes={}) {
  const base=JSON.parse(await fs.readFile(path.join(repo,'kit/generated',name,'settings.json'),'utf8'));
  const settings={...base,...changes};
  const latest=JSON.parse(await fs.readFile(work,'utf8'));
  const existing=latest.pages.find(p=>p.id===pages[page]).layout.find(s=>s.widget==='YandexKit.Mystique'&&s.template_id===ids[name]);
  if(existing){console.log(`${page}: ${name} already prepared (${existing.id})`);return;}
  const file=path.join(workspace,'settings',`${page}-${name}.json`);
  await fs.writeFile(file,JSON.stringify(settings,null,2)+'\n');
  const result=run('section','add','--work',work,'--page-id',pages[page],
    '--widget','YandexKit.Mystique','--template-id',ids[name],'--settings-file',file);
  console.log(`${page}: ${name} added (${result.section_id})`);
}
const sensorSource={id:'01a13ad8-7b20-79c4-84a1-7ebf1fb8b95e',slug:'tpms',type:'collection'};
await add('main','hero');
await add('main','shelf',{palette:'pd-paper',dataSource:sensorSource});
await add('main','services');
await add('main','delivery');
await add('main','contacts');
await add('catalog','intro',{buttonText:'Открыть все датчики',buttonUrl:'/collections/tpms'});
await add('catalog','shelf',{palette:'pd-paper',titleText:'Датчики давления шин',count:12,dataSource:sensorSource});
const baseline=JSON.parse(await fs.readFile(path.join(workspace,'before-migration.json'),'utf8'));
for(const p of baseline.pages.filter(p=>p.layout.some(s=>s.widget==='YandexKit.ProductsListing'))) {
  const key='listing-'+p.id;
  pages[key]=p.id;
  await add(key,'catalog',{palette:'pd-paper'});
}
await add('productCard','product',{palette:'pd-paper'});
await add('services','intro',{eyebrow:'СЕРВИС TPMS',title:'Работаем с датчиками без шиномонтажа',description:'Диагностика, программирование, прописка и клонирование. Для этих работ снимать шины не нужно.',buttonText:'Записаться на проверку',buttonUrl:'/contacts'});
await add('services','services');
await add('services','contacts');
await add('contacts','intro',{eyebrow:'МОСКВА · САМОВЫВОЗ',title:'Как нас найти',description:'г. Москва, Кронштадтский бульвар, 35Б, офис 3108. Ежедневно с 11:00 до 18:00.',buttonText:'Позвонить',buttonUrl:'tel:+79773961719'});
await add('contacts','contacts',{title:'Самовывоз и помощь с датчиками'});
await add('selection','intro',{eyebrow:'ТОЧНЫЙ ПОДБОР',title:'Подбор датчиков под ваш автомобиль',description:'Выберите марку, модель, год и рынок поставки либо расшифруйте VIN. Подбор использует применяемость реальных товаров KIT; неполные данные требуют сверки специалистом.',buttonText:'Открыть подбор по авто и VIN',buttonUrl:'https://kibosh13.github.io/tpms-sensor-store/kit-selection.html'});
await add('delivery','intro',{eyebrow:'ПОЛУЧЕНИЕ ЗАКАЗА',title:'Доставка и самовывоз',description:'Способ получения, стоимость и сроки подтвердим при оформлении заказа. Самовывоз — в нашем офисе в Москве.',buttonText:'Как нас найти',buttonUrl:'/contacts'});
await add('delivery','delivery');
await add('payment','intro',{eyebrow:'ОФОРМЛЕНИЕ ЗАКАЗА',title:'Оплата заказа',description:'Доступные способы оплаты отображаются при оформлении заказа в KIT. Если нужного варианта нет, свяжитесь с нами до оплаты — подскажем порядок оформления.',buttonText:'Перейти в корзину',buttonUrl:'/cart'});
const finalContent=JSON.parse(await fs.readFile(work,'utf8'));
console.log(`Prepared ${finalContent.pages.reduce((n,p)=>n+p.layout.filter(s=>s.widget==='YandexKit.Mystique').length,0)} custom section copies; nothing published.`);
// New sections append after chrome. Constructor preview visually sorts chrome,
// but production renders layout order: normalize before the publication gate.
execFileSync(process.execPath,[path.join(repo,'kit/native-catalog.mjs'),workspace,toolsDir],{stdio:'inherit'});
execFileSync(process.execPath,[path.join(repo,'kit/normalize-layout.mjs'),workspace,toolsDir],{stdio:'inherit'});
