const sourceList = document.querySelector("#faqSourceList");
const otherSourceList = document.querySelector("#faqOtherSourceList");
const backToTop = document.querySelector("#backToTop");
const snapshotTooltip = document.createElement("div");

snapshotTooltip.className = "source-tooltip";
snapshotTooltip.hidden = true;
document.body.append(snapshotTooltip);

let sourceFilterState = { municipality: null, mrc: null, sector: null, dataType: null };
let cmmMunicipalityMetadata = null;
let cmmMetadataLoadPromise = null;
let pendingSourceFilter = null;

const NOT_APPLICABLE = "__not-applicable__";

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
  const month = new Intl.DateTimeFormat("en-CA", {
    month: "short",
    timeZone: "UTC",
  }).format(date).replace(/\.$/, "").toUpperCase();
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

function normalizeMunicipalityKey(value) {
  return String(value || "")
    .replace(/^Ville de\s+/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function loadCmmMunicipalityMetadata() {
  const response = await fetch(new URL("data/municipalites_cmm.csv?v=20261017-cmm-table-final2", LANGUAGE_ROOT_URL));
  if (!response.ok) {
    throw new Error(`CMM municipality roster returned HTTP ${response.status}`);
  }
  const [headerLine, ...lines] = (await response.text()).replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  const indexes = {
    municipality: headers.indexOf("MUNICIPALITÉS"),
    mrc: headers.indexOf("MRC"),
    sector: headers.indexOf("SECTEUR")
  };
  if (Object.values(indexes).some((index) => index < 0)) {
    throw new Error("CMM municipality roster is missing a required column");
  }

  const metadata = new Map();
  for (const [lineIndex, line] of lines.entries()) {
    const cells = line.split(",");
    if (cells.length !== headers.length) {
      throw new Error(`CMM municipality roster row ${lineIndex + 2} has an invalid column count`);
    }
    const name = cells[indexes.municipality].trim();
    const mrc = cells[indexes.mrc].trim();
    const sector = cells[indexes.sector].trim();
    const key = normalizeMunicipalityKey(name);
    if (!name || !mrc || !sector || metadata.has(key)) {
      throw new Error(`CMM municipality roster row ${lineIndex + 2} has an invalid or duplicate municipality`);
    }
    metadata.set(key, {
      sector,
      mrc
    });
  }
  const expectedCount = Number(window.CMM_MUNICIPALITY_TOTAL);
  if (!Number.isSafeInteger(expectedCount) || metadata.size !== expectedCount) {
    throw new Error(`CMM municipality roster count mismatch: expected ${expectedCount}, received ${metadata.size}`);
  }
  return metadata;
}

function sourceFilterOptionLabel(key, value) {
  if (value === NOT_APPLICABLE) return t("faq.notApplicable");
  if (key === "dataType") {
    const labelKey = {
      live: "faq.live",
      snapshot: "faq.snapshot",
      "snapshot-source": "faq.snapshotSource"
    }[value] || "faq.live";
    return t(labelKey);
  }
  if (key === "sector") {
    return {
      "Agglomeration de Montreal": "Agglomération de Montréal",
      "Agglomeration de Longueuil": "Agglomération de Longueuil"
    }[value] || value;
  }
  return value;
}

function sourceType(source) {
  return source.dataType === "snapshot" || source.dataType === "snapshot-source"
    ? source.dataType
    : "live";
}

function sourceLinkUrl(source) {
  const sourceUrl = source.faqUrl || (currentLanguage() === "en" && source.enUrl ? source.enUrl : source.url);
  return new URL(sourceUrl, LANGUAGE_ROOT_URL).href;
}

function renderSourceFilter(key, values) {
  const headerKey = {
    municipality: "faq.municipalityHeader",
    mrc: "faq.mrcHeader",
    sector: "faq.sectorHeader",
    dataType: "faq.typeHeader"
  }[key];
  if (!headerKey) {
    throw new Error(`Unknown FAQ source filter: ${key}`);
  }
  const wrapper = document.createElement("div");
  wrapper.className = "source-filter-menu";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "source-filter-button";
  button.textContent = t(headerKey);
  const selectedValues = sourceFilterState[key];
  const filterIsActive = selectedValues !== null && selectedValues.size > 0;
  const activeFilterIndicator = document.createElement("span");
  activeFilterIndicator.className = "source-filter-active-indicator";
  activeFilterIndicator.setAttribute("aria-hidden", "true");
  button.append(activeFilterIndicator);
  button.classList.toggle("has-active-filter", filterIsActive);
  button.setAttribute("aria-label", filterIsActive
    ? `${t(headerKey)} — ${t("faq.filterApplied")}`
    : t(headerKey));
  button.setAttribute("aria-expanded", "false");
  const menu = document.createElement("div");
  menu.className = "source-filter-options";
  menu.hidden = true;

  const allLabel = document.createElement("label");
  const allInput = document.createElement("input");
  allInput.type = "checkbox";
  allInput.value = "__all__";
  const allSelected = selectedValues === null
    || (selectedValues.size > 0 && values.every((value) => selectedValues.has(value)));
  allInput.checked = allSelected;
  allInput.indeterminate = selectedValues !== null && selectedValues.size > 0 && !allSelected
    && values.some((value) => selectedValues.has(value));
  allLabel.className = "source-filter-all";
  allLabel.append(allInput, document.createTextNode(t("faq.all")));
  menu.append(allLabel);

  const optionInputs = values.map((value) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = value;
    input.checked = selectedValues === null || selectedValues.has(value);
    input.addEventListener("change", () => {
      const checked = optionInputs.filter((item) => item.checked).map((item) => item.value);
      sourceFilterState[key] = values.length > 0 && checked.length === values.length
        ? null
        : new Set(checked);
      renderFaqSources(key);
    });
    label.append(input, document.createTextNode(sourceFilterOptionLabel(key, value)));
    menu.append(label);
    return input;
  });

  allInput.addEventListener("change", () => {
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

function sourceFilterMatches(key, value) {
  const selectedValues = sourceFilterState[key];
  return selectedValues === null || selectedValues.size === 0 || selectedValues.has(value);
}

function sourcePassesActiveFilters(source, skippedFilter, isOther = false) {
  if (!isOther) {
    if (skippedFilter !== "municipality" && !sourceFilterMatches("municipality", source.municipality)) return false;
    if (skippedFilter !== "mrc" && !sourceFilterMatches("mrc", source.mrcFilterValue)) return false;
    if (skippedFilter !== "sector" && !sourceFilterMatches("sector", source.sectorFilterValue)) return false;
  }
  return skippedFilter === "dataType" || sourceFilterMatches("dataType", sourceType(source));
}

function availableFilterValues(key, generalSources, otherSources) {
  const selected = sourceFilterState[key] === null ? [] : [...sourceFilterState[key]];
  let available;
  if (key === "dataType") {
    available = [
      ...generalSources.filter((source) => sourcePassesActiveFilters(source, key)).map(sourceType),
      ...otherSources.filter((source) => sourcePassesActiveFilters(source, key, true)).map(sourceType)
    ];
  } else {
    const value = {
      municipality: (source) => source.municipality,
      mrc: (source) => source.mrcFilterValue,
      sector: (source) => source.sectorFilterValue
    }[key];
    available = generalSources
      .filter((source) => sourcePassesActiveFilters(source, key))
      .map(value);
  }
  return [...new Set([...available, ...selected])].sort((a, b) => a.localeCompare(b, currentLanguage()));
}

function renderSourceFilters(generalSources, otherSources, openKey = null) {
  const filterValues = {
    municipality: availableFilterValues("municipality", generalSources, otherSources),
    mrc: availableFilterValues("mrc", generalSources, otherSources),
    sector: availableFilterValues("sector", generalSources, otherSources),
    dataType: availableFilterValues("dataType", generalSources, otherSources)
  };
  const filters = new Map();
  for (const [key, values] of Object.entries(filterValues)) {
    const header = document.querySelector(`[data-source-filter="${key}"]`);
    if (!header) throw new Error(`FAQ source filter header is missing: ${key}`);
    header.querySelector(".source-filter-menu")?.remove();
    const filter = renderSourceFilter(key, values);
    header.append(filter);
    filters.set(key, filter);
  }

  if (openKey && filters.has(openKey)) {
    const openWrapper = filters.get(openKey);
    const openMenu = openWrapper.querySelector(".source-filter-options");
    const openButton = openWrapper.querySelector(".source-filter-button");
    openMenu.hidden = false;
    openButton.setAttribute("aria-expanded", "true");
  }
}

function appendSourceRow(source, list, includeMunicipality) {
  const row = document.createElement("tr");
  const nameCell = document.createElement("td");
  const typeCell = document.createElement("td");
  const linkCell = document.createElement("td");
  const link = document.createElement("a");
  const sourceUrl = sourceLinkUrl(source);
  const snapshotUpdate = formatSnapshotUpdate(source);

  if (includeMunicipality) {
    const municipalityCell = document.createElement("td");
    const mrcCell = document.createElement("td");
    const sectorCell = document.createElement("td");
    municipalityCell.textContent = source.municipality;
    mrcCell.textContent = sourceFilterOptionLabel("mrc", source.mrcFilterValue);
    sectorCell.textContent = sourceFilterOptionLabel("sector", source.sectorFilterValue);
    row.append(municipalityCell, mrcCell, sectorCell);
  }

  nameCell.textContent = currentLanguage() === "en" && source.nameEn ? source.nameEn : source.name;
  const dataType = sourceType(source);
  typeCell.textContent = sourceFilterOptionLabel("dataType", dataType);
  if (dataType === "snapshot" || (dataType === "snapshot-source" && snapshotUpdate)) {
    const indicator = document.createElement("span");
    indicator.className = "snapshot-indicator";
    indicator.setAttribute("aria-hidden", "true");
    indicator.textContent = "i";
    typeCell.append(indicator);
  }
  link.href = sourceUrl;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = t("faq.sourceLink");

  if (snapshotUpdate) {
    attachSnapshotTooltip(typeCell, snapshotUpdate);
  }

  linkCell.append(link);
  row.append(nameCell, typeCell, linkCell);
  list.append(row);
}

function appendSourceTableMinimumRows(list, columnCount, sourceCount) {
  const missingRows = Math.max(0, 5 - sourceCount);
  for (let index = 0; index < missingRows; index++) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = columnCount;
    if (sourceCount === 0 && index === 0) {
      row.className = "source-empty-row";
      cell.textContent = t("faq.noSourcesMatch");
    } else {
      row.className = "source-empty-spacer";
      row.setAttribute("aria-hidden", "true");
    }
    row.append(cell);
    list.append(row);
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
  if (!sourceList || !otherSourceList || !Array.isArray(window.SOURCE_CATALOG)) {
    return;
  }
  if (!cmmMunicipalityMetadata) {
    pendingSourceFilter = openKey || pendingSourceFilter;
    if (!cmmMetadataLoadPromise) {
      cmmMetadataLoadPromise = loadCmmMunicipalityMetadata().then((metadata) => {
        cmmMunicipalityMetadata = metadata;
        const errorNotice = document.getElementById("faqSourceMetadataError");
        if (errorNotice) errorNotice.hidden = true;
        const pendingFilter = pendingSourceFilter;
        pendingSourceFilter = null;
        renderFaqSources(pendingFilter);
      }).catch((error) => {
        const errorNotice = document.getElementById("faqSourceMetadataError");
        if (errorNotice) errorNotice.hidden = false;
        console.error("FAQ CMM municipality metadata failed to load", error);
      });
    }
    return;
  }

  const municipalityCoverage = document.getElementById("faqMunicipalityCoverageCount");
  const municipalityCoverageTotal = document.getElementById("faqMunicipalityCoverageTotal");
  if (!municipalityCoverage || !municipalityCoverageTotal) {
    throw new Error("FAQ municipality coverage markup is missing");
  }
  const total = Number(window.CMM_MUNICIPALITY_TOTAL);
  if (!Number.isSafeInteger(total) || total <= 0) {
    throw new Error("FAQ CMM municipality total is missing or invalid");
  }
  const mappedMunicipalities = new Set(window.SOURCE_CATALOG
    .filter((source) => source.inMap === true && source.cmmMunicipality)
    .map((source) => source.cmmMunicipality.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()));
  const language = currentLanguage();
  const municipalityUnit = language === "en"
    ? (mappedMunicipalities.size === 1 ? "municipality" : "municipalities")
    : (mappedMunicipalities.size === 1 ? "municipalité" : "municipalités");
  municipalityCoverage.textContent = `${mappedMunicipalities.size} ${municipalityUnit}`;
  municipalityCoverageTotal.textContent = String(total);

  const faqSources = window.SOURCE_CATALOG.filter((source) => source.inMap === true || source.inFaq === true);
  const sourceCount = document.getElementById("faqSourceUrlCount");
  if (!sourceCount) {
    throw new Error("FAQ source URL count markup is missing");
  }
  sourceCount.textContent = String(new Set(faqSources.map(sourceLinkUrl)).size);
  const generalSources = faqSources
    .filter((source) => source.faqGroup !== "other")
    .map((source) => {
      const municipality = sourceMunicipality(source);
      const metadata = cmmMunicipalityMetadata.get(normalizeMunicipalityKey(municipality));
      return {
        ...source,
        municipality,
        mrcFilterValue: metadata ? metadata.mrc : NOT_APPLICABLE,
        sectorFilterValue: metadata?.sector || NOT_APPLICABLE
      };
    });
  const otherSources = faqSources.filter((source) => source.faqGroup === "other");
  const matchesDataType = (source) => sourceFilterMatches("dataType", sourceType(source));
  const visibleGeneralSources = generalSources
    .filter((source) => sourceFilterMatches("municipality", source.municipality))
    .filter((source) => sourceFilterMatches("mrc", source.mrcFilterValue))
    .filter((source) => sourceFilterMatches("sector", source.sectorFilterValue))
    .filter(matchesDataType)
    .sort((first, second) => first.municipality.localeCompare(second.municipality, currentLanguage(), { sensitivity: "base" })
      || first.name.localeCompare(second.name, currentLanguage(), { sensitivity: "base" }));
  const visibleOtherSources = otherSources
    .filter(matchesDataType)
    .sort((first, second) => first.name.localeCompare(second.name, currentLanguage(), { sensitivity: "base" }));

  renderSourceFilters(generalSources, otherSources, openKey);
  sourceList.replaceChildren();
  otherSourceList.replaceChildren();

  visibleGeneralSources.forEach((source) => appendSourceRow(source, sourceList, true));
  appendSourceTableMinimumRows(sourceList, 6, visibleGeneralSources.length);
  visibleOtherSources.forEach((source) => appendSourceRow(source, otherSourceList, false));
  appendSourceTableMinimumRows(otherSourceList, 3, visibleOtherSources.length);
}

function sortFaqLists() {
  document.querySelectorAll(".faq-list").forEach((list) => {
    [...list.querySelectorAll(":scope > details")]
      .sort((first, second) => {
        const priority = Number(first.dataset.sortPriority || 0) - Number(second.dataset.sortPriority || 0);
        return priority || first.querySelector("summary").textContent.localeCompare(second.querySelector("summary").textContent, currentLanguage(), { sensitivity: "base" });
      })
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

function updatePotholesFaqLink() {
  document.getElementById("potholesFaqLink").href = `${languagePath(currentLanguage(), "potholes.html")}?mode=how`;
  document.getElementById("statsHowFaqLink").href = `${languagePath(currentLanguage(), "")}?view=stats&tab=how`;
}

backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("scroll", updateBackToTop, { passive: true });
window.addEventListener("hashchange", openAnchoredDetails);
window.addEventListener("languagechange", () => {
  updatePotholesFaqLink();
  renderFaqSources();
  sortFaqLists();
  updateFaqSectionLinks();
});
updatePotholesFaqLink();
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