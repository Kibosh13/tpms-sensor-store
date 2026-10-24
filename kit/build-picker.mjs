import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildIndex} from './fitment-parser.mjs';
const repo=path.resolve(import.meta.dirname,'..');
const source=path.resolve(process.argv[2]);
const index=buildIndex(JSON.parse(await fs.readFile(source,'utf8')));
const indexPath=path.join(repo,'site/kit-fitment-index.json');
const sourceHash=createHash('sha256').update(JSON.stringify(index.products)).digest('hex');
try { const previous=JSON.parse(await fs.readFile(indexPath,'utf8'));if(previous.sourceHash===sourceHash)index.exportedAt=previous.exportedAt; } catch {}
const vehicles={};
for(const product of index.products)for(const f of product.fitments){vehicles[f.make]??={};vehicles[f.make][f.model]??=new Set();for(const year of f.years)vehicles[f.make][f.model].add(year);}
const dir=path.join(repo,'site/kit-fitment');await fs.mkdir(dir,{recursive:true});
const chunks={};const expectedFiles=new Set();
for(const make of Object.keys(vehicles).sort()) {
  const name=createHash('sha256').update(make).digest('hex').slice(0,12)+'.json';expectedFiles.add(name);chunks[make]='./kit-fitment/'+name;
  const products=index.products.filter(p=>p.fitments.some(f=>f.make===make)).map(p=>({...p,fitments:p.fitments.filter(f=>f.make===make)}));
  await fs.writeFile(path.join(dir,name),'['+products.map(p=>JSON.stringify(p)).join(',\n')+']\n');
  for(const model of Object.keys(vehicles[make]))vehicles[make][model]=[...vehicles[make][model]].sort((a,b)=>a-b);
}
let removed=0;
for(const name of await fs.readdir(dir)){if(/^[a-f0-9]{12}\.json$/.test(name)&&!expectedFiles.has(name)){await fs.unlink(path.join(dir,name));removed++;}}
await fs.writeFile(indexPath,JSON.stringify({version:2,exportedAt:index.exportedAt,source:index.source,sourceHash,coverage:index.coverage,publishedVariantsRead:index.publishedVariantsRead,vehicles,chunks},null,2)+'\n');
console.log('Lazy brand chunks:',Object.keys(chunks).length,'; obsolete generated chunks removed:',removed);
let html=await fs.readFile(path.join(repo,'site/selection.html'),'utf8');
html=html.replace('<body>','<body data-kit-picker="true">')
  .replace('id="vinInput"','id="vinInput" disabled')
  .replace('id="vinSubmit"','id="vinSubmit" disabled')
  .replace('Проверить совместимость</button>','Найти по применяемости</button>')
  .replace('<script src="./common.js?v=5" defer></script>','')
  .replace('<link rel="stylesheet" href="./styles.css?v=5">','<link rel="stylesheet" href="./styles.css?v=5"><link rel="stylesheet" href="./kit-picker.css?v=1">')
  .replace(/<script src="\.\/selection\.js\?v=\d+" defer><\/script>/,'<script src="./selection.js?v=7" defer></script><script src="./kit-selection.js?v=4" defer></script>')
  .replace('<site-header active="selection"></site-header>','<header class="header kit-header"><div class="shell header__inner"><a class="brand" href="https://prodat4iki.ru/"><img src="./assets/logo-clean.png" alt="ProДатчики"></a><nav class="nav" aria-label="Главное меню"><a href="https://prodat4iki.ru/collections/tpms">Каталог</a><a href="https://prodat4iki.ru/services">Услуги</a><a href="https://prodat4iki.ru/contacts">Контакты</a></nav><a class="kit-cart-link" href="https://prodat4iki.ru/cart">Корзина →</a></div></header>')
  .replace('<site-footer></site-footer>','<footer class="footer"><div class="shell footer__inner"><p>ProДатчики · +7 (977) 396-17-19 · ежедневно, 11:00–18:00</p><p><a href="https://prodat4iki.ru/collections/tpms">Вернуться в магазин</a></p></div></footer>')
  .replace('href="index.html"','href="https://prodat4iki.ru/"')
  .replace('Сначала определяем автомобиль и тип системы. Товар показываем как совместимый только при подтверждённой частоте и протоколе.','Подобрать датчики давления шин для авто онлайн.')
  .replace('ТОЧНЫЙ ПОДБОР TPMS','ПОДБОР ДАТЧИКОВ')
  .replace('Декодируем автомобиль','Определяем автомобиль')
  .replace('Производитель, модель, год и рынок поставки.','Марку, модель и год, если эти сведения доступны. Рынок поставки уточняем отдельно.')
  .replace('Сверяем TPMS','Сверяем применяемость')
  .replace('Тип системы, частоту, протокол и способ прописки по каталогу применяемости.','Марку, модель, год и ограничения из описания конкретного товара. Перед покупкой проверяем комплектацию.')
  .replace('Россия / Европа — 433 МГц','Россия / Европа')
  .replace('США / Канада — 315 МГц','США / Канада')
  .replace('VIN сначала сверяется с локальными кодами производителя, затем отправляется по HTTPS в официальный декодер vPIC NHTSA. На сайте номер не сохраняется. Рынок поставки проверяется отдельно: страна сборки его не заменяет.','VIN проверяется по данным производителя. Если их недостаточно, номер передаётся во внешний сервис расшифровки. На этой странице VIN не сохраняется. Год, комплектацию и рынок поставки при необходимости уточняем отдельно.');
await fs.writeFile(path.join(repo,'site/kit-selection.html'),html);
console.log(JSON.stringify({publishedRead:index.publishedVariantsRead,productsWithParsedFitment:index.products.length,fitmentRows:index.products.reduce((s,p)=>s+p.fitments.length,0),available:index.products.filter(p=>p.availableAtExport).length,generated:['site/kit-fitment-index.json','site/kit-fitment/','site/kit-selection.html']},null,2));
