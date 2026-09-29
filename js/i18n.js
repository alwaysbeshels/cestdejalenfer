const DEFAULT_LANGUAGE = "fr";
const LANGUAGE_STORAGE_KEY = "preferredLanguage";

function languageFromPath() {
  const match = window.location.pathname.match(/(?:^|\/)(fr|en)(?:\/|$)/);
  return match?.[1] || null;
}

function languagePath(language, pageOverride = null) {
  const path = window.location.pathname;
  const page = pageOverride === null ? (path.endsWith("pedestrian.html") ? "pedestrian.html" : path.endsWith("faq.html") ? "faq.html" : "") : pageOverride;
  const isLocalFile = window.location.protocol === "file:";
  if (isLocalFile) {
    return page ? `/${language}/${page}` : `/${language}/`;
  }

  const segments = path.split("/").filter(Boolean);
  const projectBase = window.location.hostname.endsWith(".github.io") && segments.length
    ? `/${segments[0]}/`
    : "/";
  return `${projectBase}${language}/${page}`;
}

function currentLanguage() {
  const routeLanguage = languageFromPath();
  if (routeLanguage && window.TRANSLATIONS?.[routeLanguage]) {
    return routeLanguage;
  }

  return DEFAULT_LANGUAGE;
}

const installedApp = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const mapModeKey = "installedMapMode";
const redirectToSavedMode = installedApp && document.body.dataset.mapMode !== "pedestrian"
  && document.body.dataset.documentTitle === "document.mapTitle"
  && window.localStorage.getItem(mapModeKey) === "pedestrian";
if (redirectToSavedMode) {
  window.location.replace(languagePath(currentLanguage(), "pedestrian.html"));
}

function t(key, language = currentLanguage()) {
  if (document.body?.dataset.mapMode === "pedestrian") {
    const scoped = window.TRANSLATIONS?.[language]?.[`pedestrian.${key}`]
      ?? window.TRANSLATIONS?.[DEFAULT_LANGUAGE]?.[`pedestrian.${key}`];
    if (scoped !== undefined) return scoped;
  }
  return window.TRANSLATIONS?.[language]?.[key]
    ?? window.TRANSLATIONS?.[DEFAULT_LANGUAGE]?.[key]
    ?? key;
}

function translateElement(element, language = currentLanguage()) {
  const key = element.dataset.i18n;
  if (key) {
    element.innerHTML = t(key, language);
  }

  ["ariaLabel", "title", "placeholder"].forEach((attribute) => {
    const keyName = `i18n${attribute[0].toUpperCase()}${attribute.slice(1)}`;
    if (element.dataset[keyName]) {
      element.setAttribute(attribute === "ariaLabel" ? "aria-label" : attribute, t(element.dataset[keyName], language));
    }
  });
}

function ensureFavicon() {
  const icons = [
    { href: "favicon.ico", sizes: "48x48", type: null },
    { href: "favicon.svg", sizes: null, type: "image/svg+xml" },
  ];

  icons.forEach((icon) => {
    const selector = icon.type
      ? 'head link[rel="icon"][type="image/svg+xml"]'
      : 'head link[rel="icon"]:not([type="image/svg+xml"])';
    let link = document.querySelector(selector);
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    if (icon.type) {
      link.type = icon.type;
    } else {
      link.removeAttribute("type");
    }
    if (icon.sizes) {
      link.setAttribute("sizes", icon.sizes);
    }
    link.href = icon.href;
  });
}

function applyTranslations(language = currentLanguage()) {
  document.documentElement.lang = language;
  document.title = t(document.body.dataset.documentTitle, language);
  ensureFavicon();
  document.querySelectorAll("[data-i18n], [data-i18n-aria-label], [data-i18n-title], [data-i18n-placeholder]")
    .forEach((element) => translateElement(element, language));

  document.querySelectorAll("[data-i18n-value]").forEach((element) => {
    element.value = t(element.dataset.i18nValue, language);
  });

  const languageToggle = document.querySelector("#languageToggle");
  if (languageToggle) {
    languageToggle.textContent = t("language.switch", language);
    languageToggle.setAttribute("aria-label", t("language.switchLabel", language));
    languageToggle.title = t("language.switchLabel", language);
  }

  document.querySelectorAll("[data-language-page]").forEach((link) => {
    const page = link.dataset.languagePage === "pedestrian" ? "pedestrian.html" : link.dataset.languagePage === "faq" ? "faq.html" : "";
    link.href = languagePath(language, page);
  });

  const sourceFaqLink = document.querySelector('#sourceCard a[href*="faq.html"]');
  if (sourceFaqLink) {
    sourceFaqLink.href = `${languagePath(language, "faq.html")}#sources-utilisees`;
  }

  window.dispatchEvent(new CustomEvent("languagechange", { detail: { language } }));
}

function setLanguage(language) {
  if (!window.TRANSLATIONS?.[language]) {
    return;
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  window.history.replaceState({}, "", languagePath(language));
  applyTranslations(language);
}

function setupLanguageToggle() {
  const languageToggle = document.querySelector("#languageToggle");
  if (!languageToggle) {
    return;
  }

  languageToggle.addEventListener("click", () => setLanguage(currentLanguage() === "fr" ? "en" : "fr"));
  applyTranslations();
}

function setupInstallApp() {
  const container = document.querySelector("#installAppContainer");
  if (!container) return;

  const button = document.querySelector("#installApp");
  const help = document.querySelector("#installAppHelp");
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  help.dataset.i18n = isIos ? "nav.installHelp" : /Chrome|Chromium|Edg\//.test(navigator.userAgent) ? "nav.installHelpChrome" : "nav.installHelpBrowser";
  translateElement(help);
  let installPrompt = null;
  let installedHere = false;
  const isInstalled = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  function refresh() {
    container.hidden = installedHere || isInstalled() || !window.isSecureContext || !("serviceWorker" in navigator);
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    refresh();
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installedHere = true;
    refresh();
  });
  window.matchMedia("(display-mode: standalone)").addEventListener("change", refresh);

  button.addEventListener("click", async () => {
    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      await prompt.prompt();
      refresh();
    } else {
      help.hidden = !help.hidden;
      button.setAttribute("aria-expanded", String(!help.hidden));
    }
  });
  refresh();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => {
    setupLanguageToggle();
    setupInstallApp();
  });
} else {
  setupLanguageToggle();
  setupInstallApp();
}

window.addEventListener("load", ensureFavicon);
