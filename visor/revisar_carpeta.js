// SH4 web — FeniXVOID · Project Ravenlight
(() => {
  try {
    const p = location.pathname;
    if (location.hostname === "sh4.ravenlight.net" && p.startsWith("/sh4/")) return location.replace(p.slice(4) + location.search + location.hash);
    if (p.startsWith("/full/")) {
      if (/\/clave\.html$/.test(p)) return;
      fetch("/full/juego-lista.json", {
        method: "HEAD",
        cache: "no-store"
      }).then(r => {
        if (r.status === 403) location.replace("/full/clave.html?volver=" + encodeURIComponent(p + location.hash)); else if (r.ok) try {
          sessionStorage.removeItem("sh4intento");
        } catch {}
      }, () => {});
      return;
    }
    if (/\/carpeta\.html$/.test(p) || new URLSearchParams(location.search).has("sincarpeta")) return;
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
