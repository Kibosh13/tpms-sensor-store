import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const repo=path.resolve(import.meta.dirname,'..');
class Element {
  value='';innerHTML='';disabled=false;hidden=false;dataset={};events={};attributes={};
  classList={add(){},remove(){},toggle(){}};
  addEventListener(type,handler){this.events[type]=handler;}
  setAttribute(name,value){this.attributes[name]=value;}
  removeAttribute(name){delete this.attributes[name];}
  scrollIntoView(){}focus(){}
  insertAdjacentHTML(_,html){this.innerHTML+=html;}
}
const nodes=new Map();const query=s=>{if(!nodes.has(s))nodes.set(s,new Element());return nodes.get(s);};
const tabs=['car','vin'].map(tab=>{const e=new Element();e.dataset.selectionTab=tab;return e;});
const index=JSON.parse(await fs.readFile(path.join(repo,'site/kit-fitment-index.json'),'utf8'));
let resolveIndex,requests=[];
const ctx={document:{querySelector:query,querySelectorAll:()=>tabs,body:{dataset:{kitPicker:'true'}},addEventListener(){}},location:{hash:''},AbortController,URLSearchParams,setTimeout,clearTimeout,console,
  fetch:async url=>{requests.push(url);if(url==='./kit-fitment-index.json')return new Promise(resolve=>{resolveIndex=()=>resolve({ok:true,json:async()=>index});});if(url.startsWith('./kit-fitment/'))return {ok:true,json:async()=>JSON.parse(await fs.readFile(path.join(repo,'site',url.slice(2)),'utf8'))};throw Error('Unexpected network request in offline test: '+url);}
};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['vehicle-data.js','vin-data.js','selection.js','kit-selection.js'])vm.runInContext(await fs.readFile(path.join(repo,'site',file),'utf8'),ctx,{filename:file});
assert.equal(typeof query('#vinForm').events.submit,'function','VIN handler must be attached before catalog fetch finishes');
query('#vinInput').value='AAAAAAAAAAAAAAAAA';let prevented=false;
await query('#vinForm').events.submit({preventDefault(){prevented=true;}});
assert.equal(prevented,true);assert.equal(requests.length,1,'Invalid VIN must not be sent to a decoder');
resolveIndex();await new Promise(resolve=>setImmediate(resolve));
assert.equal(query('#vehicleMake').disabled,false);
let selected;
for(const [make,url] of Object.entries(index.chunks)){
  const products=JSON.parse(await fs.readFile(path.join(repo,'site',url.slice(2)),'utf8'));
  assert.ok(products.every(p=>p.url.startsWith('https://prodat4iki.ru/products/')));
  assert.ok(products.every(p=>!('stocks' in p)&&!('pricing' in p)), 'No private stock details or stale prices in public picker');
  selected??=products.find(p=>p.availableAtExport&&p.fitments.some(f=>!f.condition));
}
const vehicle=selected.fitments.find(f=>!f.condition);
query('#vehicleMake').value=vehicle.make;query('#vehicleMake').events.change();
assert.ok(query('#vehicleModel').innerHTML.includes(vehicle.model.replace(/&/g,'&amp;')));
query('#vehicleModel').value=vehicle.model;query('#vehicleModel').events.change();
query('#vehicleYear').value=String(vehicle.years[0]);query('#vehicleYear').events.change();
query('#vehicleRegion').value='eu';
await query('#vehicleForm').events.submit({preventDefault(){}});
assert.ok(query('#kitProductResults').innerHTML.includes('https://prodat4iki.ru/products/'));
assert.ok(query('#selectionResult').innerHTML.includes(vehicle.make));
query('#vehicleModel').value='MODEL NOT IN CATALOG';
await query('#vehicleForm').events.submit({preventDefault(){}});
assert.ok(query('#selectionResult').innerHTML.includes('нет совпадения'));
const html=await fs.readFile(path.join(repo,'site/kit-selection.html'),'utf8');
assert.ok(!html.includes('common.js'),'Do not expose the demo cart in the KIT picker');
assert.ok(html.includes('noindex, nofollow'));
for(const match of html.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:[^" ]*)"/g))await fs.access(path.join(repo,'site',match[1]));
console.log('Picker: event binding, invalid VIN, real car matching, missing model, privacy fields and local assets checked offline.');
