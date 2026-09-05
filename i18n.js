const DEFAULT_LANGUAGE = "fr";
const LANGUAGE_STORAGE_KEY = "preferredLanguage";

function languageFromPath() {
  const match = window.location.pathname.match(/(?:^|\/)(fr|en)(?:\/|$)/);
  return match?.[1] || null;
}

function languagePath(language, pageOverride = null) {
  const path = window.location.pathname;
  const page = pageOverride === null ? (path.endsWith("faq.html") ? "faq.html" : "") : pageOverride;
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

function t(key, language = currentLanguage()) {
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

function applyTranslations(language = currentLanguage()) {
  document.documentElement.lang = language;
  document.title = t(document.body.dataset.documentTitle, language);
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
    const page = link.dataset.languagePage === "faq" ? "faq.html" : "";
    link.href = languagePath(language, page);
  });

  const sourceFaqLink = document.querySelector("#sourceCard a[href]");
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

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", setupLanguageToggle);
} else {
  setupLanguageToggle();
}
