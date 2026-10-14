import fs from 'node:fs/promises';
import path from 'node:path';

// Only generated settings are changed here. Constructor content is edited by
// official section/page/theme commands, never by this script.
const workspace = path.resolve(process.argv[2] || '../tpms-kit-migration');
const base = JSON.parse(await fs.readFile(path.join(workspace, 'storefront.json.base.json'), 'utf8'));
const settingsDir = path.join(workspace, 'settings');
await fs.mkdir(settingsDir, {recursive:true});
async function save(name, value) {
  await fs.writeFile(path.join(settingsDir, `${name}.json`), JSON.stringify(value,null,2)+'\n');
}
const theme = structuredClone(base.global_settings);
theme.appearance.colors.brandPrimary = '#f4eb00';
theme.appearance.colors.backgroundPrimary = '#f1f1ed';
theme.appearance.colors.text = '#151618';
theme.appearance.colors.palettes = theme.appearance.colors.palettes.filter(p => !['pd-dark','pd-paper'].includes(p.id));
theme.appearance.colors.palettes.push(
  {id:'pd-dark',name:'ProДатчики · графит',backgroundPrimary:'#111214',text:'#f2f2ed'},
  {id:'pd-paper',name:'ProДатчики · светлая',backgroundPrimary:'#f1f1ed',text:'#151618'}
);
theme.appearance.section.maxWidthDesktop = '1280';
theme.appearance.section.hPaddingDesktop = '200';
theme.appearance.section.hPaddingMobile = '200';
theme.appearance.grid.hGap = '300';
theme.appearance.grid.vGap = '300';
theme.typography.fontFamily.predefined.name = 'Manrope';
theme.productSnippet.photo.fit = 'contain';
theme.productSnippet.photo.aspectRatio = '1:1';
theme.productSnippet.photo.enableParanja = false;
theme.productSnippet.general.background = 'secondary';
theme.productSnippet.general.enableBorder = 'yes';
theme.productSnippet.effects.imageLoading ||= 'neutral';
theme.navigation.pageTransition ||= 'none';
theme.outOfStockProducts.badgeText ||= 'Товар закончился';
theme.delivery ||= {enableProgress:true};
// Payment provider is not connected yet. Do not advertise unavailable benefits.
theme.features.enableYandexSplit = false;
theme.features.enableYandexDiscount = false;
await save('theme',theme);
const main = base.pages.find(p => p.alias === 'main');
const header = structuredClone(main.layout.find(s => s.widget === 'YandexKit.Header').settings);
header.palette = 'pd-dark';
header.enableBorder = false;
header.modules.additional.enableCustomerLocation = false;
header.modules.main.logo = 'sm';
await save('header',header);
const footer = structuredClone(main.layout.find(s => s.widget === 'YandexKit.Footer').settings);
footer.palette = 'pd-dark';
footer.about.description = 'Датчики давления шин. Подбор, диагностика, программирование и клонирование без шиномонтажа. Работаем с 2019 года.';
footer.legalInfo.copyrightText = '© ProДатчики';
await save('footer',footer);
await save('shelf',{
  titleText:'Популярные датчики',titleAlign:'left',palette:'pd-paper',
  count:4,columns:4,verticalRhythm:'600',verticalRhythmTouch:'400',
  dataSource:{id:'01a13ad8-7b20-79c4-84a1-7ebf1fb8b95e',slug:'tpms',type:'collection'}
});
console.log('Prepared theme, header, footer and real sensor shelf settings.');
