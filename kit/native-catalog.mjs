import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const workspace=path.resolve(process.argv[2]);
const toolsDir=path.resolve(process.argv[3]);
const work=path.join(workspace,'storefront.json');
const content=JSON.parse(await fs.readFile(work,'utf8'));
const original=JSON.parse(await fs.readFile(path.join(workspace,'before-migration.json'),'utf8'));
const ids=JSON.parse(await fs.readFile(new URL('./template-ids.json',import.meta.url),'utf8')).templates;
const source=original.pages.find(p=>p.alias==='categoryAndCollection'&&p.variant_type==='default').layout.find(s=>s.widget==='YandexKit.ProductsListing');
const settings=structuredClone(source.settings);
settings.palette='pd-paper';
settings.snippets.columns=4;
settings.snippets.rows=6;
settings.snippet.enableButton='enabled';
settings.snippet.reviews ||= 'default';
settings.filtersPosition='drawer';
settings.modules.quickFilters.isEnabled=false;
const file=path.join(workspace,'settings/native-catalog.json');
await fs.writeFile(file,JSON.stringify(settings,null,2)+'\n');
function run(...args){
  return JSON.parse(execFileSync('python3',[
    path.join(toolsDir,'skills/kit-storefront-constructor/scripts/kit.py'),
    '--bff-url','https://prodat4iki.ru',
    '--skill-prompt','Перенеси сайт ProДатчики в KIT с полноценным каталогом для более 1000 товаров.',
    '--skill-session-id','5fba547d-33c3-4aa5-a956-0bbefdbd19be',
    '--skill-harness','codex',...args
  ],{encoding:'utf8',env:{...process.env,YANDEX_KIT_SKILLS_TELEMETRY_DISABLED:'1'},maxBuffer:4*1024*1024}));
}
let count=0;
for(const page of content.pages){
  const listing=page.layout.find(s=>s.widget==='YandexKit.Mystique'&&s.template_id===ids.catalog);
  if(!listing)continue;
  run('section','remove','--work',work,'--id',listing.id);
  run('section','add','--work',work,'--page-id',page.id,'--widget','YandexKit.ProductsListing','--settings-file',file,'--position','2');
  count++;
}
console.log(`Prepared ${count} native catalog pages with 24 products per page; nothing published.`);
