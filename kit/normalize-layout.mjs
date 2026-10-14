import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const workspace=path.resolve(process.argv[2]);
const toolsDir=path.resolve(process.argv[3]);
const work=path.join(workspace,'storefront.json');
const content=JSON.parse(await fs.readFile(work,'utf8'));
const templateIds=JSON.parse(await fs.readFile(new URL('./template-ids.json',import.meta.url),'utf8')).templates;
let moves=0;
function move(page,section,position){
  execFileSync('python3',[
    path.join(toolsDir,'skills/kit-storefront-constructor/scripts/kit.py'),
    '--bff-url','https://prodat4iki.ru',
    '--skill-prompt','Перенеси сайт ProДатчики в KIT, сохрани дизайн и реальные товары.',
    '--skill-session-id','5fba547d-33c3-4aa5-a956-0bbefdbd19be',
    '--skill-harness','codex','section','move','--work',work,
    '--id',section.id,'--page-id',page.id,'--position',String(position)
  ],{encoding:'utf8',env:{...process.env,YANDEX_KIT_SKILLS_TELEMETRY_DISABLED:'1'}});
  moves++;
}
for(const page of content.pages){
  const primary=page.layout.find(section=>section.widget==='YandexKit.Mystique'&&[templateIds.product,templateIds.catalog].includes(section.template_id));
  if(primary&&page.layout.indexOf(primary)>1)move(page,primary,2);
  const footer=page.layout.find(section=>section.widget==='YandexKit.Footer');
  if(footer&&page.layout.at(-1)?.id!==footer.id)move(page,footer,page.layout.length);
}
const normalized=JSON.parse(await fs.readFile(work,'utf8'));
for(const page of normalized.pages){
  if(page.layout.some(section=>section.widget==='YandexKit.Footer')&&page.layout.at(-1)?.widget!=='YandexKit.Footer')throw Error(`Footer is not last: ${page.id}`);
  const primary=page.layout.find(section=>section.widget==='YandexKit.Mystique'&&[templateIds.product,templateIds.catalog].includes(section.template_id));
  if(primary&&page.layout.indexOf(primary)!==1)throw Error(`Primary content is not first: ${page.id}`);
}
console.log(`Footer order verified on ${normalized.pages.length} pages; ${moves} workspace moves, no publication.`);
