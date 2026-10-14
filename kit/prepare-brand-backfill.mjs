import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildIndex} from './fitment-parser.mjs';

// Read-only preparation. Array replacement in KIT must not be performed from
// this snapshot: reread every target and preserve all live characteristics.
const source=JSON.parse(await fs.readFile(path.resolve(process.argv[2]),'utf8'));
const destination=path.resolve(process.argv[3]);
const index=buildIndex(source);
const makeId='0199b6b0-0f8c-77ee-af6d-f322d5af261c';
const variants=new Map(source.items.map(v=>[v.id,v]));
const suggestions=[];
let existing=0;
for(const product of index.products){
  const variant=variants.get(product.id);
  if(!variant)throw Error('Missing source variant '+product.id);
  const current=(variant.characteristics||[]).find(c=>c.characteristic_id===makeId);
  if(current&&(current.values?.length||current.value)){existing++;continue;}
  suggestions.push({
    variantId:variant.id,sku:variant.sku,title:variant.name,
    characteristicId:makeId,proposedValues:[...new Set(product.fitments.map(f=>f.make))].sort(),
    evidence:'Explicit make/model/year lines in the seller description',
    characteristicsHash:createHash('sha256').update(JSON.stringify(variant.characteristics||[])).digest('hex')
  });
}
await fs.writeFile(destination,JSON.stringify({state:'read-only-suggestions-not-applied',existingValuesPreserved:existing,suggestions},null,2)+'\n');
console.log(JSON.stringify({suggestions:suggestions.length,existingValuesPreserved:existing,writesToKit:0,output:destination},null,2));
