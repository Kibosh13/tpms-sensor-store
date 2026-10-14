const makes = ['Alfa Romeo','Aston Martin','Great Wall','Land Rover','Rolls-Royce','Mercedes-Benz','Mercedes Benz','Mercedes','Acura','Audi','BAIC','Bentley','BMW','Buick','BYD','Cadillac','Changan','Chery','Chevrolet','Chrysler','Citroen','Citroën','Dacia','Daewoo','Daihatsu','Dodge','Dongfeng','DS','FAW','Fiat','Ford','Geely','Genesis','GMC','Haval','Honda','Hongqi','Hummer','Hyundai','Infiniti','Isuzu','JAC','Jaguar','Jeep','Kia','Lada','Lamborghini','Lexus','Lifan','Lincoln','Lotus','Maserati','Mazda','MG','Mini','Mitsubishi','Nissan','Opel','Peugeot','Porsche','RAM','Renault','Rover','Saab','Scion','Seat','Skoda','Škoda','Smart','SsangYong','Subaru','Suzuki','Tesla','Toyota','Volkswagen','Volvo','Voyah','Zeekr','Zotye'].sort((a,b)=>b.length-a.length);
makes.push('Москвич','ВАЗ','ГАЗ','УАЗ','WEY','Tank','Exeed','Omoda','Jaecoo','Jetour','GAC','Foton','Lynk & Co','Li Auto','Luxgen','Proton','Perodua','Ravon','Roewe','Saturn');
makes.sort((a,b)=>b.length-a.length);
const escaped = x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const makePattern = new RegExp('^('+makes.map(escaped).join('|')+')\\s+','i');
const aliases = {'mercedes':'Mercedes-Benz','mercedes benz':'Mercedes-Benz','citroën':'Citroen','škoda':'Skoda'};
export const normalize = x=>String(x||'').normalize('NFKC').toUpperCase().replace(/Ё/g,'Е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function parseFitments(description) {
  const records=[];
  for(const raw of String(description||'').split(/\r?\n|<br\s*\/?\s*>/i)) {
    const line=raw.replace(/<[^>]*>/g,'').replace(/\u00a0/g,' ').trim();
    const prefix=line.match(makePattern);
    if(!prefix)continue;
    const firstYear=line.slice(prefix[0].length).search(/\b(?:19|20)\d{2}\b/);
    if(firstYear<1)continue;
    const cut=prefix[0].length+firstYear;
    const model=line.slice(prefix[0].length,cut).replace(/[:;,\s]+$/,'').trim();
    const tail=line.slice(cut).replace(/\bг(?:ода|од|г)?\.?\s*$/i,'').trim();
    // Do not infer years from arbitrary prose or OEM numbers.
    if(!/^(?:(?:19|20)\d{2}[\s,;—–\-./]*)+$/.test(tail))continue;
    const years=new Set();
    for(const match of tail.matchAll(/((?:19|20)\d{2})(?:\s*[-—–]\s*((?:19|20)\d{2}))?/g)) {
      const from=Number(match[1]),to=Number(match[2]||match[1]);
      if(to<from||to-from>50)continue;
      for(let y=from;y<=to;y++)years.add(y);
    }
    if(!years.size||!model)continue;
    const found=makes.find(m=>m.toLowerCase()===prefix[1].toLowerCase());
    const make=aliases[found.toLowerCase()]||found;
    const condition=/VIN|шасси|кузов.{0,8}№|с\s+номера|до\s+номера|только|кроме|\bUSA\b|\bUS\b|\bEU\b/i.test(model) ? model : '';
    records.push({make,model,years:[...years].sort((a,b)=>a-b),condition,sourceLine:line});
  }
  return records;
}
export function isSensor(v) {
  const text=String(v.name||'')+' '+String(v.description||'').split(/\r?\n/).slice(0,3).join(' ');
  if(/сканер|программатор|вентил[ья]|ниппел|адаптер|ремкомплект/i.test(v.name||''))return false;
  return /датчик[\s\S]{0,35}давлен|давлен[\s\S]{0,35}шин|mx[-\s]?sensor|nfc[-\s]?sensor|\btpms\b/i.test(text);
}
export function buildIndex(exported) {
  if(exported.coverage!=='complete')throw Error('Refusing a partial catalog export');
  const products=[];
  for(const v of exported.items) {
    if(v.status!=='PUBLISHED'||!isSensor(v))continue;
    const fitments=parseFitments(v.description);
    if(!fitments.length)continue;
    const frequencyLine=(v.description||'').split(/\r?\n/).find(l=>/частот|frequency/i.test(l))||'';
    const frequencies=[...new Set((frequencyLine.match(/\b(?:315|433)\b/g)||[]).map(Number))];
    const relative=v.relative_link_url;
    if(!relative||!relative.startsWith('/products/')||relative.startsWith('//'))continue;
    products.push({id:v.id,kitId:v.kit_id,title:v.name,brand:v.brand||'',url:'https://prodat4iki.ru'+relative,
      availableAtExport:(v.stocks||[]).some(s=>Number(s.quantity)>Number(s.reserved)),frequencies,fitments});
  }
  products.sort((a,b)=>a.id.localeCompare(b.id));
  return {version:1,exportedAt:new Date().toISOString(),source:'KIT: описания опубликованных товаров',coverage:exported.coverage,publishedVariantsRead:exported.received,products};
}
