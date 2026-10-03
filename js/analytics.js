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

  function pageName() {
    const mode = document.body?.dataset.mapMode;
    if (mode === "pedestrian" || mode === "potholes") return mode;
    if (document.querySelector(".faq-shell")) return "faq";
    return "map";
  }

  /* --- Filtres (cartes auto/piéton et page nids-de-poule) --- */
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
    repairDevice: "repair_device"
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

  /* --- Recherche (terme saisi, avec debounce) --- */
  let searchTimer = null;
  document.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.id !== "searchFilter" && input.id !== "reportSearch") return;
    clearTimeout(searchTimer);
    const term = input.value.trim();
    if (term.length < 2) return;
    searchTimer = setTimeout(() => {
      track("search", { page: pageName(), search_term: term.slice(0, 100) });
    }, 1200);
  });

  /* --- Clics : formulaire de signalement, vue statistiques, « aujourd'hui » --- */
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

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

  /* --- Changement de langue (événement dispatché par js/i18n.js) --- */
  window.addEventListener("languagechange", (event) => {
    track("language_switched", {
      page: pageName(),
      language: event.detail?.language || "unknown"
    });
  });

  /* --- FAQ : questions ouvertes (toggle ne bouillonne pas → capture) --- */
  document.addEventListener("toggle", (event) => {
    const details = event.target;
    if (!(details instanceof HTMLDetailsElement) || !details.open) return;
    if (!details.closest(".faq-list")) return;
    const question = details.id || details.querySelector("summary [data-i18n]")?.dataset.i18n || "";
    if (question) {
      track("faq_question_opened", { page: "faq", question: question.slice(0, 100) });
    }
  }, true);

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
