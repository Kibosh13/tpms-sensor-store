import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {templates} from './templates.mjs';

test('KIT cannot reset headings to regular weight',()=>{
  const css=fs.readFileSync(new URL('./brand.css',import.meta.url),'utf8');
  for(const selector of ['.pd-h1','.pd-h2','.pd-card h2','.pd-service h3','.pd-info h3','.pd-contact-map h3']) {
    const rule=css.slice(css.indexOf(selector+' {')).split('}')[0];
    assert.match(rule,/font-weight:[78]00/);
  }
});
test('merchant text fields remain editable and referenced',()=>{
  const walk=(schema,html,prefix='settings')=>{
    for(const [key,field] of Object.entries(schema.properties||{})) {
      const at=prefix+'.'+key;
      if(field.type==='object') walk(field,html,at);
      else assert.ok(html.includes('{{'+at+'}}'),`Missing editable field ${at}`);
    }
  };
  for(const t of templates) walk(t.schema,t.html);
});
test('reference composition and mobile single-column fallback are present',()=>{
  const byId=Object.fromEntries(templates.map(t=>[t.id,t]));
  assert.equal((byId.services.html.match(/class="pd-service-icon"/g)||[]).length,4);
  assert.match(byId.services.html,/pd-service-cta/);
  assert.match(byId.delivery.html,/pd-delivery-grid/);
  assert.match(byId.contacts.html,/pd-contact-grid/);
  assert.match(byId.hero.css,/max-width:760px/);
  assert.match(byId.hero.css,/\.pd-grid \{ grid-template-columns:minmax\(0,1fr\)/);
});
test('sections are scoped and do not introduce executable code or embedded frames',()=>{
  for(const t of templates) {
    assert.doesNotMatch(t.html,/<(?:script|style|iframe)\b/i);
    assert.doesNotMatch(t.css,/:global\(|@import|https?:/);
  }
});
test('real-product shelf retains native data and cart controllers',()=>{
  const html=fs.readFileSync(new URL('./shelf.html',import.meta.url),'utf8');
  assert.match(html,/ya-kit-featured-products-controller/);
  assert.match(html,/ya-kit-product-snippet-controller/);
  assert.match(html,/controller.onAddToCart/);
  assert.match(html,/ya-kit-section-layout-row/);
  assert.equal((html.match(/<ya-kit-section-layout-row>/g)||[]).length,1);
  assert.equal((html.match(/<\/ya-kit-section-layout-row>/g)||[]).length,1);
});
