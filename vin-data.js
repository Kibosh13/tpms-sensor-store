(function () {
  const mercedesTypes = {
    "210026": {
      make: "Mercedes-Benz",
      model: "E-Класс",
      series: "W210",
      modification: "E 320 CDI",
      body: "Седан",
      fuel: "Дизель",
      from: 1999,
      to: 2002,
      marketHint: "eu",
      sourceLabel: "Mercedes-Benz, тип 210.026",
      sourceUrl: "https://originalteile.mercedes-benz.de/original-teile-klassen/e-klasse/w210/e-320-cdi-210026/"
    }
  };

  function decode(vin) {
    if (!/^WDB[A-HJ-NPR-Z0-9]{14}$/.test(vin)) return null;
    const rawType = vin.slice(3, 9);
    const vehicle = mercedesTypes[rawType];
    if (!vehicle) return /^\d{6}$/.test(rawType) ? {
      make: "Mercedes-Benz",
      typeCode: `${rawType.slice(0, 3)}.${rawType.slice(3)}`,
      marketHint: "eu",
      confidence: "manufacturer-format"
    } : null;
    return {
      ...vehicle,
      typeCode: `${rawType.slice(0, 3)}.${rawType.slice(3)}`,
      confidence: "exact-type"
    };
  }

  window.ManufacturerVinData = {decode};
})();
