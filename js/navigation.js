(() => {
  const script = document.currentScript;
  const rootUrl = new URL("../", script.src);
  const wrapperPage = script.dataset.page;
  const pages = new Set(["index.html", "faq.html", "pedestrian.html", "potholes.html"]);
  const handoffKey = "static-page-handoff";
  const preparations = new Map();
  let navigationVersion = 0;

  document.documentElement.setAttribute("data-page-loading", "");

  function finishTransition() {
    const pending = window.staticPageTransition;
    if (!pending || pending.finishing) return;
    pending.finishing = true;
    pending.transition.ready.then(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) pending.transition.skipTransition();
      pending.release();
    }).catch(pending.release);
  }

  window.addEventListener("pagereveal", (event) => {
    const transition = event.viewTransition;
    if (!transition) return;
    transition.finished.catch(() => {});
    transition.updateCallbackDone.catch(() => {});
    if (typeof transition.waitUntil !== "function") {
      transition.skipTransition();
      return;
    }
    let release;
    transition.waitUntil(new Promise((resolve) => { release = resolve; }));
    window.staticPageTransition = { transition, release, finishing: false };
    if (document.documentElement.hasAttribute("data-page-ready")) finishTransition();
  });

  function revealPage() {
    document.documentElement.removeAttribute("data-page-loading");
    document.documentElement.removeAttribute("data-navigation-pending");
    document.documentElement.setAttribute("data-page-ready", "");
    finishTransition();
  }

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    navigationVersion++;
    document.documentElement.removeAttribute("data-navigation-pending");
  });

  function destination(link) {
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return null;
    const url = new URL(link.href, document.baseURI);
    if (url.origin !== rootUrl.origin || !url.pathname.startsWith(rootUrl.pathname)) return null;
    const relative = url.pathname.slice(rootUrl.pathname.length);
    const match = /^(?:(fr|en)\/)?(index\.html|faq\.html|pedestrian\.html|potholes\.html)?$/.exec(relative);
    if (!match) return null;
    if (url.pathname === location.pathname) return null;
    return { url, page: match[2] || "index.html", wrapped: Boolean(match[1]) };
  }

  async function readPage(page) {
    const response = await fetch(new URL(page, rootUrl), { cache: "no-cache", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Page request failed: ${response.status}`);
    const html = await response.text();
    const parsed = new DOMParser().parseFromString(html, "text/html");
    if (!parsed.body.dataset.documentTitle) throw new Error("Invalid application page");
    return { html, parsed };
  }

  function prepare(page) {
    if (!preparations.has(page)) {
      const pending = readPage(page).then(async ({ html, parsed }) => {
        const assets = [...parsed.querySelectorAll('link[rel="stylesheet"][href], script[src]')]
          .map(element => ({ element, url: new URL(element.getAttribute("href") || element.getAttribute("src"), rootUrl) }))
          .filter(({ url }) => (url.origin === rootUrl.origin || ["unpkg.com", "cdn.jsdelivr.net"].includes(url.hostname)) && /\.(?:css|js|mjs)$/.test(url.pathname));
        await Promise.allSettled(assets.map(({ element, url }) => fetch(url, {
          cache: "force-cache", signal: AbortSignal.timeout(2500),
          mode: url.origin === rootUrl.origin ? "same-origin" : element.hasAttribute("crossorigin") ? "cors" : "no-cors",
          integrity: element.getAttribute("integrity") || ""
        })));
        return { html, createdAt: Date.now() };
      });
      preparations.set(page, pending);
      pending.catch(() => preparations.delete(page));
    }
    return preparations.get(page);
  }

  function warmLink(event) {
    if (navigator.connection?.saveData) return;
    const target = destination(event.target.closest?.("a[href]"));
    if (target) prepare(target.page).catch(() => {});
  }

  function setupNavigation() {
    document.addEventListener("pointerover", warmLink, { passive: true });
    document.addEventListener("focusin", warmLink);
    document.addEventListener("click", async (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = destination(event.target.closest?.("a[href]"));
      if (!target) return;
      event.preventDefault();
      const version = ++navigationVersion;
      document.documentElement.setAttribute("data-navigation-pending", "");
      try {
        const packet = await prepare(target.page);
        if (version !== navigationVersion) return;
        if (target.wrapped) {
          try {
            sessionStorage.setItem(handoffKey, JSON.stringify({ ...packet, destination: target.url.href, page: target.page }));
          } catch {}
        }
      } catch {}
      if (version === navigationVersion) location.assign(target.url.href);
    });
    Promise.resolve(window.STATS_VIEW?.whenReady?.()).finally(() => requestAnimationFrame(revealPage));
  }

  async function loadWrapperContent(html) {
    const parsed = new DOMParser().parseFromString(html, "text/html");
    if (!parsed.body.dataset.documentTitle) throw new Error("Invalid application page");
    const sharedScriptPath = new URL(script.src).pathname;
    const sharedStylePath = new URL("css/navigation.css", rootUrl).pathname;
    parsed.querySelectorAll("script[src], link[href]").forEach(element => {
      const pathname = new URL(element.getAttribute("src") || element.getAttribute("href"), rootUrl).pathname;
      if (pathname === sharedScriptPath || pathname === sharedStylePath) element.remove();
    });
    const scripts = [...parsed.querySelectorAll("script")];
    const styles = [...parsed.querySelectorAll('link[rel="stylesheet"]')].map(link => new Promise(resolve => {
      link.addEventListener("load", resolve, { once: true });
      link.addEventListener("error", resolve, { once: true });
    }));
    for (const element of [...document.head.children]) {
      if (!element.matches('base, meta[charset], meta[name="viewport"], link[rel="stylesheet"]')) element.remove();
    }
    parsed.head.querySelectorAll('base, meta[charset], meta[name="viewport"]').forEach(element => element.remove());
    document.head.append(...parsed.head.childNodes);
    for (const attribute of parsed.body.attributes) document.body.setAttribute(attribute.name, attribute.value);
    document.body.replaceChildren(...parsed.body.childNodes);
    await Promise.all(styles);
    for (const original of scripts) {
      const replacement = document.createElement("script");
      for (const attribute of original.attributes) replacement.setAttribute(attribute.name, attribute.value);
      replacement.textContent = original.textContent;
      if ((original.src || original.type === "module") && !original.hasAttribute("async")) {
        replacement.async = false;
        await new Promise((resolve, reject) => {
          replacement.addEventListener("load", resolve, { once: true });
          replacement.addEventListener("error", () => reject(new Error("Application script failed to load")), { once: true });
          original.replaceWith(replacement);
        });
      } else {
        original.replaceWith(replacement);
      }
    }
    setupNavigation();
  }

  if (wrapperPage) {
    if (!pages.has(wrapperPage)) throw new Error("Unknown application page");
    let handoff;
    try {
      handoff = JSON.parse(sessionStorage.getItem(handoffKey) || "null");
      sessionStorage.removeItem(handoffKey);
    } catch {}
    const useHandoff = handoff?.page === wrapperPage && handoff.destination === location.href
      && Date.now() - handoff.createdAt < 15000 && performance.getEntriesByType("navigation")[0]?.type !== "reload";
    (useHandoff ? Promise.resolve(handoff) : readPage(wrapperPage)).then(({ html }) => loadWrapperContent(html)).catch(() => {
      const link = document.createElement("a");
      link.href = new URL(wrapperPage, rootUrl).href;
      link.textContent = link.href;
      document.body.replaceChildren(link);
      revealPage();
    });
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupNavigation, { once: true });
  } else {
    setupNavigation();
  }
})();