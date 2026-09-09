const sourceList = document.querySelector("#faqSourceList");
const sourceTable = document.querySelector(".source-table");
const backToTop = document.querySelector("#backToTop");
const snapshotTooltip = document.createElement("div");

snapshotTooltip.className = "source-tooltip";
snapshotTooltip.hidden = true;
document.body.append(snapshotTooltip);

let sourceFilterState = { municipality: null, dataType: null };

function showSnapshotTooltip(event) {
  const tooltipText = event.currentTarget.dataset.snapshotTooltip;
  if (!tooltipText) {
    return;
  }

  snapshotTooltip.textContent = tooltipText;
  snapshotTooltip.hidden = false;

  const offsetX = 12;
  const offsetY = 12;
  const left = Math.min(event.clientX + offsetX, window.innerWidth - 220);
  const top = Math.min(event.clientY + offsetY, window.innerHeight - 52);
  snapshotTooltip.style.left = `${left}px`;
  snapshotTooltip.style.top = `${top}px`;
}

function hideSnapshotTooltip() {
  snapshotTooltip.hidden = true;
}

function attachSnapshotTooltip(element, text) {
  if (!text) {
    return;
  }

  element.dataset.snapshotTooltip = text;
  element.addEventListener("mouseenter", showSnapshotTooltip, { passive: true });
  element.addEventListener("mousemove", showSnapshotTooltip, { passive: true });
  element.addEventListener("mouseleave", hideSnapshotTooltip, { passive: true });
  element.addEventListener("focus", showSnapshotTooltip, { passive: true });
  element.addEventListener("blur", hideSnapshotTooltip, { passive: true });
}

function formatSnapshotUpdate(source) {
  const extractedAt = source.extractedAt || source.updatedAt;
  if (!extractedAt) {
    return "";
  }

  const date = new Date(extractedAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = date.toLocaleString(currentLanguage() === "en" ? "en-CA" : "fr-CA", {
    month: "long",
    timeZone: "UTC",
  }).slice(0, 4);
  const year = date.getUTCFullYear();
  const formatted = `${day} ${month} ${year}`;

  return `${t("faq.snapshotUpdated")}: ${formatted}`;
}

function sourceMunicipality(source) {
  if (source.municipality) {
    return source.municipality;
  }
  if (/^(Ville de )?Montréal|^Quartier des spectacles/.test(source.name)) return "Montréal";
  if (/^Ville de Montreal/.test(source.name)) return "Montréal";
  if (/^Laval Info-Travaux/.test(source.name)) return "Laval";
  if (/^DDO/.test(source.name)) return "Dollard-des-Ormeaux";
  if (/^(MTMD|Quebec 511)/.test(source.name)) return t("faq.sourceProvincial");
  if (/^(OpenStreetMap|OSRM|Overpass)/.test(source.name)) return t("faq.sourceRegional");
  if (/^Mobilité Montréal/.test(source.name)) return t("faq.sourceRegional");
  if (/^Ville de /.test(source.name)) return source.name.replace(/^Ville de /, "").split(" - ")[0];
  return source.name.split(" - ")[0];
}

function sourceType(source) {
  return source.dataType === "snapshot" ? "snapshot" : "live";
}

function renderSourceFilter(key, values) {
  const wrapper = document.createElement("div");
  wrapper.className = "source-filter-menu";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "source-filter-button";
  button.textContent = t(key === "municipality" ? "faq.municipalityHeader" : "faq.typeHeader");
  button.setAttribute("aria-label", t(key === "municipality" ? "faq.municipalityHeader" : "faq.typeHeader"));
  button.setAttribute("aria-expanded", "false");
  const menu = document.createElement("div");
  menu.className = "source-filter-options";
  menu.hidden = true;

  const allLabel = document.createElement("label");
  const allInput = document.createElement("input");
  allInput.type = "checkbox";
  allInput.value = "__all__";
  allInput.checked = sourceFilterState[key] === null || sourceFilterState[key].size === values.length;
  allLabel.className = "source-filter-all";
  allLabel.append(allInput, document.createTextNode(t("faq.all")));
  menu.append(allLabel);

  const optionInputs = values.map((value) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = value;
    input.checked = sourceFilterState[key] === null || sourceFilterState[key].has(value);
    input.addEventListener("change", () => {
      const checked = optionInputs.filter((item) => item.checked).map((item) => item.value);
      sourceFilterState[key] = new Set(checked);
      allInput.checked = checked.length === values.length;
      renderFaqSources(key);
    });
    label.append(input, document.createTextNode(key === "dataType" ? t(value === "snapshot" ? "faq.snapshot" : "faq.live") : value));
    menu.append(label);
    return input;
  });

  allInput.addEventListener("change", () => {
    optionInputs.forEach((input) => {
      input.checked = allInput.checked;
    });
    sourceFilterState[key] = allInput.checked ? null : new Set();
    renderFaqSources(key);
  });

  button.addEventListener("click", () => {
    document.querySelectorAll(".source-filter-menu").forEach((otherWrapper) => {
      if (otherWrapper !== wrapper) {
        const otherMenu = otherWrapper.querySelector(".source-filter-options");
        const otherButton = otherWrapper.querySelector(".source-filter-button");
        otherMenu.hidden = true;
        otherButton.setAttribute("aria-expanded", "false");
      }
    });
    menu.hidden = !menu.hidden;
    button.setAttribute("aria-expanded", String(!menu.hidden));
  });
  wrapper.append(button, menu);
  return wrapper;
}

function renderSourceFilters(sources, openKey = null) {
  const municipalityHeader = document.querySelector('[data-source-filter="municipality"]');
  const typeHeader = document.querySelector('[data-source-filter="dataType"]');
  if (!municipalityHeader || !typeHeader) return;
  municipalityHeader.querySelector(".source-filter-menu")?.remove();
  typeHeader.querySelector(".source-filter-menu")?.remove();

  const municipalityFilter = renderSourceFilter("municipality", [...new Set(sources.map(sourceMunicipality))].sort((a, b) => a.localeCompare(b, currentLanguage())));
  const typeFilter = renderSourceFilter("dataType", ["live", "snapshot"]);
  municipalityHeader.append(municipalityFilter);
  typeHeader.append(typeFilter);

  if (openKey) {
    const openWrapper = openKey === "municipality" ? municipalityFilter : typeFilter;
    const openMenu = openWrapper.querySelector(".source-filter-options");
    const openButton = openWrapper.querySelector(".source-filter-button");
    openMenu.hidden = false;
    openButton.setAttribute("aria-expanded", "true");
  }
}

document.addEventListener("click", (event) => {
  document.querySelectorAll(".source-filter-menu").forEach((wrapper) => {
    if (!wrapper.contains(event.target)) {
      const menu = wrapper.querySelector(".source-filter-options");
      const button = wrapper.querySelector(".source-filter-button");
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    }
  });
});

function renderFaqSources(openKey = null) {
  if (!sourceList || !Array.isArray(window.SOURCE_CATALOG)) {
    return;
  }

  const activeSources = window.SOURCE_CATALOG
    .filter((source) => source.inMap === true)
    .map((source) => ({ ...source, municipality: sourceMunicipality(source) }))
    .filter((source) => (sourceFilterState.municipality === null || sourceFilterState.municipality.size === 0 || sourceFilterState.municipality.has(source.municipality))
      && (sourceFilterState.dataType === null || sourceFilterState.dataType.size === 0 || sourceFilterState.dataType.has(sourceType(source))))
    .sort((first, second) => first.municipality.localeCompare(second.municipality, currentLanguage(), { sensitivity: "base" })
      || first.name.localeCompare(second.name, currentLanguage(), { sensitivity: "base" }));

  renderSourceFilters(window.SOURCE_CATALOG.filter((source) => source.inMap === true).map((source) => ({ ...source, municipality: sourceMunicipality(source) })), openKey);
  sourceList.replaceChildren();

  activeSources
    .forEach((source) => {
    const row = document.createElement("tr");
    const municipalityCell = document.createElement("td");
    const nameCell = document.createElement("td");
    const typeCell = document.createElement("td");
    const linkCell = document.createElement("td");
    const link = document.createElement("a");
    const snapshotUpdate = formatSnapshotUpdate(source);

    municipalityCell.textContent = source.municipality;
    nameCell.textContent = currentLanguage() === "en" && source.nameEn ? source.nameEn : source.name;
    typeCell.textContent = t(source.dataType === "snapshot" ? "faq.snapshot" : "faq.live");
    if (source.dataType === "snapshot") {
      const indicator = document.createElement("span");
      indicator.className = "snapshot-indicator";
      indicator.setAttribute("aria-hidden", "true");
      indicator.textContent = "i";
      typeCell.append(indicator);
    }
    link.href = currentLanguage() === "en" && source.enUrl ? source.enUrl : source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = t("faq.sourceLink");

    if (snapshotUpdate) {
      attachSnapshotTooltip(typeCell, snapshotUpdate);
    }

    linkCell.append(link);
    row.append(municipalityCell, nameCell, typeCell, linkCell);
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

function updateFaqSectionLinks() {
  document.querySelectorAll(".faq-section-link").forEach((link) => {
    const hash = link.dataset.sectionHash || link.getAttribute("href");
    const target = hash ? document.querySelector(hash) : null;

    if (!target) {
      return;
    }

    link.dataset.sectionHash = hash;
    link.href = `${window.location.pathname}${hash}`;
  });
}

function setupFaqSectionLinks() {
  updateFaqSectionLinks();

  document.querySelectorAll(".faq-section-link").forEach((link) => {
    const hash = link.dataset.sectionHash || link.getAttribute("href");
    const target = hash ? document.querySelector(hash) : null;

    if (!target) {
      return;
    }

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
  updateFaqSectionLinks();
});
setupFaqSectionLinks();
renderFaqSources();
sortFaqLists();
updateBackToTop();
openAnchoredDetails();

function reassertFavicon() {
  const icons = [
    { rel: "icon", href: "favicon.ico", sizes: "48x48", type: null },
    { rel: "icon", href: "favicon.svg", sizes: null, type: "image/svg+xml" },
  ];

  icons.forEach((icon) => {
    const selector = icon.href.endsWith(".svg")
      ? 'head link[rel="icon"][type="image/svg+xml"]'
      : 'head link[rel="icon"]:not([type="image/svg+xml"])';
    let link = document.querySelector(selector);
    if (!link) {
      link = document.createElement("link");
      link.rel = icon.rel;
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

window.addEventListener("load", reassertFavicon);