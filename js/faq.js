const sourceList = document.querySelector("#faqSourceList");
const backToTop = document.querySelector("#backToTop");

function renderFaqSources() {
  if (!sourceList || !Array.isArray(window.SOURCE_CATALOG)) {
    return;
  }

  sourceList.replaceChildren();

  [...window.SOURCE_CATALOG]
    .sort((first, second) => first.name.localeCompare(second.name, "fr", { sensitivity: "base" }))
    .forEach((source) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const linkCell = document.createElement("td");
    const link = document.createElement("a");

    nameCell.textContent = currentLanguage() === "en" && source.nameEn ? source.nameEn : source.name;
    link.href = currentLanguage() === "en" && source.enUrl ? source.enUrl : source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = t("faq.sourceLink");
    linkCell.append(link);
    row.append(nameCell, linkCell);
      sourceList.append(row);
    });
}

function sortFaqLists() {
  document.querySelectorAll(".faq-list").forEach((list) => {
    [...list.querySelectorAll(":scope > details")]
      .sort((first, second) => first.querySelector("summary").textContent.localeCompare(second.querySelector("summary").textContent, currentLanguage(), { sensitivity: "base" }))
      .forEach((item) => list.append(item));
  });
}

function updateBackToTop() {
  backToTop.hidden = window.scrollY < 320;
}

function openAnchoredDetails() {
  if (!location.hash || location.hash.length < 2) {
    return;
  }

  const target = document.querySelector(location.hash);
  if (target instanceof HTMLDetailsElement) {
    target.open = true;
    requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  }
}

function setupFaqSectionLinks() {
  document.querySelectorAll(".faq-section-link").forEach((link) => {
    const hash = link.getAttribute("href");
    const target = hash ? document.querySelector(hash) : null;

    if (!target) {
      return;
    }

    link.href = `${window.location.pathname}${hash}`;

    link.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.history.replaceState(null, "", `${window.location.pathname}${hash}`);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("scroll", updateBackToTop, { passive: true });
window.addEventListener("hashchange", openAnchoredDetails);
window.addEventListener("languagechange", () => {
  renderFaqSources();
  sortFaqLists();
});
setupFaqSectionLinks();
renderFaqSources();
sortFaqLists();
updateBackToTop();
openAnchoredDetails();

function reassertFavicon() {
  let link = document.querySelector('head link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = "favicon.svg?v=2";
}

window.addEventListener("load", reassertFavicon);