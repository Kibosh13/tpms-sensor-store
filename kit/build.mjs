import {mkdir, writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
import {templates} from "./templates.mjs";

const root = fileURLToPath(new URL("./generated/", import.meta.url));
for (const template of templates) {
  const folder = join(root, template.id);
  await mkdir(folder, {recursive:true});
  const schema = {...template.schema, properties:Object.fromEntries(Object.entries(template.schema.properties).map(([key, field]) => [key, {...field, default:template.settings[key]}]))};
  const create = {title:template.title, html:template.html, css:template.css, json_schema:JSON.stringify(schema), commit_message:"Перенос согласованного оформления ProДатчики"};
  await Promise.all([
    writeFile(join(folder,"template.html"),template.html+"\n"),
    writeFile(join(folder,"template.css"),template.css+"\n"),
    writeFile(join(folder,"template.schema.json"),JSON.stringify(schema,null,2)+"\n"),
    writeFile(join(folder,"settings.json"),JSON.stringify(template.settings,null,2)+"\n"),
    writeFile(join(folder,"create.json"),JSON.stringify(create,null,2)+"\n")
  ]);
  console.log(`${template.id}: ${Object.keys(schema.properties).length} редактируемых полей`);
}
