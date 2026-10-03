/* Événements personnalisés Google Analytics (GA4) — cestdejalenfer.ca
   Chargé sur toutes les pages après la balise gtag. Sans effet si gtag
   est absent ou bloqué (bloqueur de publicité, fichier local, etc.). */
(function () {
  "use strict";

  function track(eventName, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params || {});
    }
  }
  window.analyticsTrack = track;

  /* --- Contexte de page : "map", "pedestrian", "potholes" ou "faq" --- */
  function pageName() {
    const mode = document.body?.dataset.mapMode;
    if (mode === "pedestrian" || mode === "potholes") return mode;
    if (document.querySelector(".faq-shell")) return "faq";
    return "map";
  }

  function sectionOf(element) {
    const card = element.closest(".stats-card");
    if (card?.dataset.card) return `entraves:${card.dataset.card}`;
    const wrap = element.closest("[data-table]");
    if (wrap?.dataset.table) return `entraves:${wrap.dataset.table}`;
    const table = element.closest("table");
    if (table?.dataset.tableControls) return `nids-de-poule:${table.dataset.tableControls}`;
    if (table?.dataset.ranking) return `nids-de-poule:${table.dataset.ranking}`;
    if (table?.id === "boroughStreetsTable") return "nids-de-poule:borough_streets";
    if (table?.id === "boroughLocationsTable") return "nids-de-poule:borough_locations";
    return "";
  }

  /* --- Filtres : cartes auto/piéton, vue stats entraves, nids-de-poule --- */
  const FILTER_CONTAINERS = [
    { selector: ".source-filters", type: "source" },
    { selector: ".impact-filters", type: "impact" },
    { selector: ".time-filters", type: "time" },
    { selector: ".pedestrian-area-filters", type: "pedestrian_area" },
    { selector: "#municipalityList", type: "municipality" },
    { selector: "#reportYears", type: "report_year" }
  ];
  const FILTER_FIELDS = {
    dateStart: "date_start",
    dateEnd: "date_end",
    reportState: "report_state",
    reportDistrict: "report_district",
    repairYear: "repair_year",
    repairMonth: "repair_month",
    repairDevice: "repair_device",
    chartsPeriod: "charts_period",
    boroughSelect: "borough",
    boroughPeriod: "borough_period",
    boroughLocationFilter: "borough_location_filter"
  };

  document.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLSelectElement)) return;

    if (FILTER_FIELDS[input.id]) {
      track("filter_applied", {
        page: pageName(),
        filter_type: FILTER_FIELDS[input.id],
        filter_value: String(input.value || "all").slice(0, 100)
      });
      return;
    }
    // Mode de dates de la vue statistiques des entraves (période vs toutes).
    if (input.name === "statsDateMode") {
      if (input.checked) {
        track("filter_applied", { page: "map", filter_type: "stats_date_mode", filter_value: String(input.value) });
      }
      return;
    }
    // Sélecteurs d'arrondissement/territoire de la vue stats des entraves.
    const territory = input.dataset?.filter;
    if (territory === "territory-municipality" || territory === "territory-borough") {
      track("filter_applied", { page: "map", filter_type: territory, filter_value: String(input.value || "all").slice(0, 100) });
      return;
    }
    // Filtre de colonne des tableaux de nids-de-poule (classements, sommaire).
    if (input.classList.contains("pothole-column-filter")) {
      track("filter_applied", {
        page: "potholes",
        filter_type: "table_column",
        filter_value: String(input.value || "all").slice(0, 100),
        section: sectionOf(input)
      });
      return;
    }
    // Multi-sélecteurs des cartes de statistiques des entraves (source, compagnie, etc.).
    const multi = input.closest(".stats-multi");
    if (multi) {
      track("filter_applied", {
        page: "map",
        filter_type: `stats_multi_${multi.dataset.name || "unknown"}`,
        filter_value: String(input.value).slice(0, 100),
        filter_state: input.checked ? "on" : "off",
        section: sectionOf(multi)
      });
      return;
    }
    for (const { selector, type } of FILTER_CONTAINERS) {
      if (input.closest(selector)) {
        const params = {
          page: pageName(),
          filter_type: type,
          filter_value: String(input.value).slice(0, 100)
        };
        if (input.type === "checkbox" || input.type === "radio") {
          params.filter_state = input.checked ? "on" : "off";
        }
        track("filter_applied", params);
        return;
      }
    }
  });

  /* --- Recherches : champ de carte, nids-de-poule, filtres de stats --- */
  let searchTimer = null;
  document.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.type !== "search" && input.id !== "boroughSearch") return;
    const term = input.value.trim();
    if (term.length < 2) return;
    let section = "";
    if (input.id === "boroughSearch") section = "nids-de-poule:boroughs";
    else if (input.classList.contains("stats-multi-search")) section = sectionOf(input);
    else if (input.closest(".stats-filter-search")) section = sectionOf(input);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      track("search", { page: pageName(), search_term: term.slice(0, 100), section });
    }, 1200);
  });

  /* --- Clics : onglets, tris, agrandissements, liens importants --- */
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    // Onglets des statistiques des entraves routières (Général, Routes, etc.).
    const statsTab = target.closest("[data-stats-tab]");
    if (statsTab) {
      track("stats_tab_opened", {
        page: "map",
        tab: `entraves:${String(statsTab.dataset.statsTab || "unknown")}`
      });
      return;
    }
    // Onglets des statistiques des nids-de-poule (Sommaire, Graphiques, Arrondissements).
    const potholeStatsTab = target.closest("[data-statistics-tab]");
    if (potholeStatsTab) {
      track("stats_tab_opened", {
        page: "potholes",
        tab: `nids-de-poule:${String(potholeStatsTab.dataset.statisticsTab || "unknown")}`
      });
      return;
    }
    // Modes de la page nids-de-poule (Signalements, Colmatages, Comment ça marche, Statistiques).
    const potholeMode = target.closest("[data-pothole-mode]");
    if (potholeMode) {
      const mode = String(potholeMode.dataset.potholeMode || "unknown");
      track("pothole_mode_opened", {
        page: "potholes",
        tab: mode === "repairs" ? "colmatages:repairs" : `nids-de-poule:${mode}`
      });
      return;
    }
    // Agrandissement d'une section de la vue stats des entraves.
    const expand = target.closest(".stats-expand");
    if (expand) {
      const card = expand.closest(".stats-card");
      track("stats_section_expanded", {
        page: "map",
        section: `entraves:${card?.dataset.card || "unknown"}`,
        expand_state: expand.getAttribute("aria-expanded") === "true" ? "collapse" : "expand"
      });
      return;
    }
    // Tri d'une colonne des tableaux de la vue stats des entraves.
    const sort = target.closest(".stats-sort");
    if (sort) {
      const wrap = sort.closest("[data-table]");
      const label = sort.querySelector("span")?.textContent || sort.textContent || "";
      track("stats_table_sorted", {
        page: "map",
        section: `entraves:${wrap?.dataset.table || "unknown"}`,
        column: label.trim().slice(0, 100)
      });
      return;
    }
    // Tri d'une colonne des tableaux de statistiques de nids-de-poule.
    const potholeSort = target.closest(".pothole-table-sort, .pothole-borough-sort");
    if (potholeSort) {
      const cell = potholeSort.closest("th");
      const label = potholeSort.querySelector("span")?.textContent || potholeSort.textContent || "";
      track("stats_table_sorted", {
        page: "potholes",
        section: sectionOf(potholeSort),
        column: label.trim().slice(0, 100),
        direction: cell?.getAttribute("aria-sort") || ""
      });
      return;
    }
    // Puces de filtre par impact dans les cartes de stats des entraves.
    const chip = target.closest('.stats-chip[data-filter="impact"]');
    if (chip) {
      track("filter_applied", {
        page: "map",
        filter_type: "stats_impact_chip",
        filter_value: String(chip.dataset.value || ""),
        filter_state: chip.getAttribute("aria-pressed") === "true" ? "off" : "on",
        section: sectionOf(chip)
      });
      return;
    }
    if (target.closest('a[href*="forms.gle"]')) {
      track("report_form_click", { page: pageName() });
      return;
    }
    if (target.closest("a[data-view='stats']")) {
      track("stats_view_click", { page: pageName() });
      return;
    }
    if (target.closest("#todayDates")) {
      track("filter_applied", { page: pageName(), filter_type: "date", filter_value: "today" });
    }
  });

  /* --- Sections dépliables : FAQ, « comment ça marche », données de graphiques --- */
  function sectionDetails(details) {
    const article = details.closest("[data-borough-analysis], [data-analysis], [data-chart]");
    if (article) {
      const key = article.dataset.boroughAnalysis || article.dataset.analysis || article.dataset.chart;
      return `nids-de-poule:${key}`;
    }
    const section = details.closest(".pothole-document-section, .pothole-document");
    const heading = section?.querySelector("h2, h3");
    if (heading?.dataset?.i18n) return `nids-de-poule:${heading.dataset.i18n}`;
    const card = details.closest(".stats-card");
    if (card?.dataset.card) return `entraves:${card.dataset.card}`;
    return "";
  }

  document.addEventListener("toggle", (event) => {
    const details = event.target;
    if (!(details instanceof HTMLDetailsElement) || !details.open) return;

    const page = pageName();
    // FAQ générale et page « Comment ça marche » des nids-de-poule.
    if (details.closest(".faq-list") || details.closest("#howView")) {
      const question = details.id || details.querySelector("summary [data-i18n]")?.dataset.i18n || "";
      if (question) {
        track("faq_question_opened", { page, question: question.slice(0, 100) });
      }
      return;
    }
    // Onglet « Comment ça marche » des stats des entraves.
    if (details.closest(".stats-how")) {
      const summary = details.querySelector("summary");
      track("faq_question_opened", {
        page: "map",
        question: (summary?.textContent || "").trim().slice(0, 100),
        section: "entraves:how"
      });
      return;
    }
    // Tableaux de données sous les graphiques (entraves et nids-de-poule).
    if (details.matches(".stats-chart-values, .pothole-analysis-values, .pothole-ranking-method, .pothole-borough-chart-details")) {
      track("chart_details_opened", { page, section: sectionDetails(details) });
    }
  }, true);

  /* --- Changement de langue (événement dispatché par js/i18n.js) --- */
  window.addEventListener("languagechange", (event) => {
    track("language_switched", {
      page: pageName(),
      language: event.detail?.language || "unknown"
    });
  });

  /* --- Popups de la carte (ajoutés par Leaflet dans .leaflet-popup-pane) --- */
  function observePopups() {
    const pane = document.querySelector(".leaflet-popup-pane");
    if (!pane || pane.dataset.analyticsObserved) return;
    pane.dataset.analyticsObserved = "1";
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement) || !node.classList.contains("leaflet-popup")) continue;
          track("map_popup_opened", {
            page: pageName(),
            street: (node.querySelector(".popup-title")?.textContent || "").trim().slice(0, 100),
            grouped_count: node.querySelectorAll(".popup-card").length
          });
        }
      }
    }).observe(pane, { childList: true });
  }

  /* --- Nids-de-poule : boîte de détails (titre mis à jour une fois chargé) --- */
  function observePotholeDialog() {
    const dialog = document.querySelector("#potholeDialog");
    if (!dialog || dialog.dataset.analyticsObserved) return;
    dialog.dataset.analyticsObserved = "1";
    const title = dialog.querySelector("#detailTitle");
    if (!title) return;
    const genericTitle = title.textContent.trim();
    new MutationObserver(() => {
      const street = title.textContent.trim();
      if (dialog.open && street && street !== genericTitle) {
        track("pothole_detail_opened", { page: "potholes", street: street.slice(0, 100) });
      }
    }).observe(title, { childList: true, characterData: true, subtree: true });
  }

  function observeDomFeatures() {
    observePopups();
    observePotholeDialog();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeDomFeatures);
  } else {
    observeDomFeatures();
  }

  // La carte des nids-de-poule est créée à la demande : détecter son apparition.
  function observeBody() {
    if (!document.body || typeof MutationObserver !== "function") return;
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.classList.contains("leaflet-popup-pane") || (node.children.length && node.querySelector(".leaflet-popup-pane"))) observePopups();
          if (node.id === "potholeDialog" || (node.children.length && node.querySelector("#potholeDialog"))) observePotholeDialog();
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeBody);
  } else {
    observeBody();
  }
})();
