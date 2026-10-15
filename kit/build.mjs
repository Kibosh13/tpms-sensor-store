import {mkdir, readFile, writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
import {templates} from "./templates.mjs";

const root = fileURLToPath(new URL("./generated/style-v2/", import.meta.url));
const shelf = {id:'shelf',title:'ProДатчики · товары · оформление v4',html:await readFile(new URL('./shelf.html',import.meta.url),'utf8'),css:await readFile(new URL('./shelf.css',import.meta.url),'utf8'),schema:JSON.parse(await readFile(new URL('./shelf.schema.json',import.meta.url),'utf8')),settings:{titleText:'Датчики в наличии',titleAlign:'left',columns:3,count:6,palette:'pd-paper',section:{hPaddingDesktop:'800',hPaddingMobile:'200',isFullscreen:'default',paddingTop:'single',paddingBottom:'single'},verticalRhythm:'1000',verticalRhythmTouch:'700',dataSource:{id:'01a13ad8-7b20-79c4-84a1-7ebf1fb8b95e',slug:'tpms',type:'collection'}}};
for (const template of [...templates,shelf]) {
  const folder = join(root, template.id);
  await mkdir(folder, {recursive:true});
  const schema = {...template.schema, properties:Object.fromEntries(Object.entries(template.schema.properties).map(([key, field]) => [key, {...field, default:template.settings[key]}]))};
  const create = {title:template.title, html:template.html, css:template.css, json_schema:JSON.stringify(schema), commit_message:"Восстановление оформления ProДатчики по GitHub · kit-custom-sections"};
  await Promise.all([
    writeFile(join(folder,"template.html"),template.html+"\n"),
    writeFile(join(folder,"template.css"),template.css+"\n"),
    writeFile(join(folder,"template.schema.json"),JSON.stringify(schema,null,2)+"\n"),
    writeFile(join(folder,"settings.json"),JSON.stringify(template.settings,null,2)+"\n"),
    writeFile(join(folder,"create.json"),JSON.stringify(create,null,2)+"\n")
  ]);
  console.log(`${template.id}: ${Object.keys(schema.properties).length} редактируемых полей`);
}
