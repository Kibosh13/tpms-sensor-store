(function () {
  const direct = (from, to, frequency, relearn, oem) => ({from,to,system:"direct",frequency,relearn,oem});
  const indirect = (from, to) => ({from,to,system:"indirect",frequency:null,relearn:"сброс через меню автомобиля",oem:"ABS"});
  const catalog = {
    Toyota: {
      Camry:[direct(2010,2026,433,"OBD / автоматически","Pacific")], RAV4:[direct(2010,2026,433,"OBD","Pacific")], "Land Cruiser":[direct(2010,2026,433,"OBD","Pacific")], Corolla:[direct(2010,2026,433,"OBD / автоматически","Pacific")]
    },
    BMW: {
      "3 серия":[direct(2010,2026,433,"автоматически","Huf / Continental")], "5 серия":[direct(2010,2026,433,"OBD / автоматически","Huf / Continental / Schrader")], X3:[direct(2010,2026,433,"автоматически","Huf / Schrader")], X5:[direct(2010,2026,433,"OBD / автоматически","Huf / Continental / Schrader")]
    },
    "Mercedes-Benz": {
      "C-Класс":[direct(2010,2026,433,"OBD / автоматически","Schrader")], "E-Класс":[direct(2010,2026,433,"OBD / автоматически","Schrader / Continental")], GLC:[direct(2015,2026,433,"OBD / автоматически","Schrader")], GLE:[direct(2015,2026,433,"OBD / автоматически","Schrader / Huf")]
    },
    Volkswagen: {
      Polo:[direct(2017,2020,433,"автоматически","Huf / Beru"),indirect(2010,2026)], Tiguan:[direct(2010,2020,433,"OBD / автоматически","Huf / Continental"),indirect(2010,2026)], Touareg:[direct(2010,2026,433,"OBD / автоматически","Huf / Beru")], Passat:[direct(2010,2021,433,"OBD / автоматически","Huf / Continental"),indirect(2010,2026)]
    },
    Kia: {
      Rio:[direct(2011,2026,433,"OBD / копирование ID","TRW / Continental")], Sportage:[direct(2010,2026,433,"OBD / автоматически","TRW / Continental / Schrader")], K5:[direct(2020,2026,433,"OBD / автоматически","Continental")], Sorento:[direct(2010,2026,433,"OBD","Continental")]
    },
    Hyundai: {
      Solaris:[direct(2011,2026,433,"OBD","Continental")], Creta:[direct(2016,2026,433,"OBD / автоматически","Schrader / Continental")], Tucson:[direct(2010,2026,433,"OBD / автоматически","TRW / Schrader")], "Santa Fe":[direct(2010,2026,433,"OBD / автоматически","Lear / Continental / Schrader")]
    },
    Haval: {
      Jolion:[direct(2021,2026,433,"OBD","Schrader / Dias")], F7:[direct(2018,2026,433,"OBD","Schrader / Dias")], Dargo:[direct(2020,2026,433,"OBD / автоматически","Schrader / SAT")], H9:[direct(2014,2026,433,"OBD / автоматически","Schrader")]
    },
    Geely: {
      Coolray:[direct(2019,2026,433,"OBD","Baolong")], Monjaro:[direct(2021,2026,433,"OBD","Baolong")], Atlas:[direct(2015,2026,433,"OBD","Dias / Schrader / Baolong")], Tugella:[direct(2020,2026,433,"OBD","Baolong")]
    },
    Honda: {
      Accord:[direct(2008,2012,315,"OBD / автоматически","TRW / Pacific"),indirect(2013,2026)], Civic:[direct(2008,2013,315,"OBD / автоматически","TRW / Pacific"),indirect(2014,2026)], "CR-V":[direct(2007,2013,315,"OBD / автоматически","TRW / Pacific"),indirect(2014,2026)]
    }
  };

  function lookup(make, model, year, region) {
    const rules = catalog[make]?.[model];
    if (!rules || !Number.isInteger(year)) return {status:"manual",reason:"Для этой модификации пока нет подтверждённой записи во внутренней матрице совместимости."};
    const matches = rules.filter(rule => year >= rule.from && year <= rule.to);
    if (!matches.length) return {status:"manual",reason:"Для выбранного года нет однозначной записи. Проверим OE-номер датчика по VIN."};
    const directMatch = matches.find(rule => rule.system === "direct");
    const indirectMatch = matches.find(rule => rule.system === "indirect");
    if (directMatch && indirectMatch) return {status:"ambiguous",direct:directMatch,indirect:indirectMatch,reason:"На этой модели встречаются прямая и косвенная системы TPMS. Тип зависит от рынка и комплектации."};
    if (indirectMatch) return {status:"indirect",...indirectMatch};
    if (directMatch) {
      if (region === "unknown") return {status:"manual",reason:"Частота и протокол зависят от рынка поставки. Для окончательного выбора нужен VIN.",candidate:directMatch};
      const expected = region === "us" ? 315 : 433;
      return {status:"confirmed",...directMatch,frequency:expected,market:region};
    }
    return {status:"manual",reason:"Не удалось определить тип системы TPMS."};
  }

  window.VehicleData = {catalog, lookup};
})();
