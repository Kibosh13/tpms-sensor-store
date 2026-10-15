// Prepares a pulled workspace only. Never publishes or writes catalog data.
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const [workPath, toolsDir] = process.argv.slice(2);
if (!workPath || !toolsDir) throw Error('Usage: node kit/apply-style-refresh.mjs WORK_JSON TOOLKIT_DIR');
const read = async p => JSON.parse(await fs.readFile(p,'utf8'));
const work = await read(workPath);
const registry = await read(new URL('./style-refresh.json',import.meta.url));
assert.notEqual(registry.state,'published','This one-off migration is already published. Prepare a fresh, minimal edit instead of replaying it.');
const previous = registry.sourceTemplates ?? (await read(new URL('./template-ids.json',import.meta.url))).templates;
const next = registry.templates;
const settingsDir = path.join(path.dirname(workPath),'settings');
await fs.mkdir(settingsDir,{recursive:true});
const command = args => {
  const r = spawnSync('python3',[path.join(toolsDir,'skills/kit-storefront-constructor/scripts/kit.py'),'--bff-url','https://prodat4iki.ru','--skill-prompt','Сайт будто без стилей, он критично отличается от того что мы делали на гите','--skill-session-id','5fba547d-33c3-4aa5-a956-0bbefdbd19be','--skill-harness','codex',...args],{encoding:'utf8',env:{...process.env,YANDEX_KIT_SKILLS_TELEMETRY_DISABLED:'1'}});
  if(r.status !== 0) throw Error(r.stderr || r.stdout);
};
const writeSettings = async (name,value) => {
  const file = path.join(settingsDir,`${name}.json`);
  await fs.writeFile(file,JSON.stringify(value,null,2)+'\n');
  return file;
};
const preserved = (value,schema,at='settings') => {
  if(value===null || typeof value!=='object') return;
  for(const [key,child] of Object.entries(value)) {
    assert.ok(schema.properties?.[key],`Filled field would be lost: ${at}.${key}`);
    // Model refs keep their original object; the KIT schema validates the body.
    if(!schema.properties[key].$ref) preserved(child,schema.properties[key],`${at}.${key}`);
  }
};
const seen = new Set();
let rebound=0,native=0;
for (const page of work.pages) for (const section of page.layout) {
  if(seen.has(section.id)) continue;
  seen.add(section.id);
  const name = Object.keys(next).find(key=>previous[key]===section.template_id);
  if(name) {
    const built = await read(new URL(`./generated/style-v2/${name}/create.json`,import.meta.url));
    preserved(section.settings,JSON.parse(built.json_schema));
    const settings = structuredClone(section.settings);
    if(name==='hero' && settings.title==='Подберём датчики под ваш автомобиль') settings.title='Подберём датчики\nпод ваш автомобиль';
    if(name==='services') {
      settings.ctaEyebrow ??= 'Датчики под ваш автомобиль';
      settings.ctaDescription ??= 'Подбор → программирование → прописка → проверка';
    }
    if(name==='shelf') Object.assign(settings,{columns:3,count:6,verticalRhythm:'1000',verticalRhythmTouch:'700'});
    const file = await writeSettings(section.id,settings);
    command(['section','set','--work',workPath,'--id',section.id,'--template-id',next[name],'--settings-file',file]);
    rebound++;
  } else if(section.widget==='YandexKit.Header') {
    const settings=structuredClone(section.settings);
    settings.modules.main.logo.logo='xl';
    settings.modules.main.additional.enableActionTitle=true;
    settings.enableBorder=true;
    const file=await writeSettings(section.id,settings);
    command(['section','set','--work',workPath,'--id',section.id,'--settings-file',file]);
    native++;
  } else if(section.widget==='YandexKit.Footer') {
    const settings=structuredClone(section.settings);
    settings.about.logoSize='lg';
    const file=await writeSettings(section.id,settings);
    command(['section','set','--work',workPath,'--id',section.id,'--settings-file',file]);
    native++;
  } else if(section.widget==='YandexKit.ProductsListing' && section.settings.palette==='pd-paper') {
    const settings=structuredClone(section.settings);
    settings.snippets.columns=3;
    settings.snippets.enableTwoColumnsOnTouch=false;
    const file=await writeSettings(section.id,settings);
    command(['section','set','--work',workPath,'--id',section.id,'--settings-file',file]);
    native++;
  }
}
const theme=structuredClone(work.global_settings);
theme.appearance.colors.brandPrimary='#f4ea00';
theme.appearance.section.hPaddingDesktop='800';
theme.typography.titleSize='5xl';
theme.productSnippet.photo.aspectRatio='4:3';
theme.productSnippet.price.priceTextWeight='bold';
theme.productSnippet.title.titleSize='md';
const file=await writeSettings('theme',theme);
command(['theme','set','--work',workPath,'--settings-file',file]);
console.log(JSON.stringify({rebound,native,pages:work.pages.length,publication:'not attempted'}));
