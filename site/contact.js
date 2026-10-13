document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const request = params.get("request");
  const reason = document.querySelector("#contactReason");
  if (request === "service") reason.value = "Диагностика датчиков";
  if (request === "vin") document.querySelector("#contactTitle").textContent = "Проверить совместимость по VIN";
  try {
    const saved = JSON.parse(sessionStorage.getItem("tpms-vin-selection"));
    if (saved?.vin && Date.now() - saved.decodedAt < 60 * 60 * 1000) document.querySelector("#contactVehicle").value = saved.vin;
  } catch (_) {}
  const form = document.querySelector("#contactForm");
  const success = document.querySelector("#contactSuccess");
  form.addEventListener("submit", event => { event.preventDefault(); form.classList.add("hidden"); success.classList.remove("hidden"); });
  document.querySelector("#newRequest").addEventListener("click", () => { form.reset(); form.classList.remove("hidden"); success.classList.add("hidden"); });
});
