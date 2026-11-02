// SH4 web — FeniXVOID · Project Ravenlight
(() => {
  try {
    const p = location.pathname;
    if (p.startsWith("/full/") || /\/carpeta\.html$/.test(p) || new URLSearchParams(location.search).has("sincarpeta")) return;
    fetch("/juego-lista.json", {
      method: "HEAD",
      cache: "no-store"
    }).then(r => {
      if (r.ok) return;
      if (r.status === 404 || r.headers.get("X-SH4-Carpeta")) {
        location.replace("/carpeta.html?volver=" + encodeURIComponent(p + location.search + location.hash));
      }
    }, () => {});
  } catch {}
})();
