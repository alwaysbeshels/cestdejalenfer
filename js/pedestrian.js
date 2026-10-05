window.PEDESTRIAN_MAP = (() => {
  let consolidatedSnapshot = null;
  let noticeSnapshot = null;
  let notices = new Map();

  function normalizeMontreal(feature, index) {
    const properties = feature.properties || {};
    const notice = notices.get(properties.permitPermitId);
    const impacts = parseJson(properties.occupancyImpactImpactsOfSection, []);
    const startDate = montrealDate(properties.durationStartDate);
    const endDate = montrealDate(properties.durationEndDate);
    if (!Array.isArray(impacts) || !validPeriod(startDate, endDate)) return [];

    const parkType = properties.occupancyImpactParkImpactBlockedType;
    const entries = impacts.map((impact, impactIndex) => ({ impact, impactIndex, area: "sidewalk" }));
    if (["blocked", "closed"].includes(parkType)) {
      entries.push({ impact: { sidewalk: { blockedType: parkType } }, impactIndex: "park", area: "park" });
    }
    return entries.flatMap(({ impact, impactIndex, area }) => {
      const type = impact.sidewalk?.blockedType;
      if (area === "sidewalk" && type !== "blocked" && type !== "obstructed") return [];
      const analysis = impact.spatialAnalysis || {};
      const line = parseJson(analysis.lineGeometry, null);
      const polygon = parseJson(properties.locationOccupancyZoneGeometryCoordinates, null);
      const geometry = line || (polygon ? { type: "Polygon", coordinates: polygon } : feature.geometry);
      if (!validGeometry(geometry)) return [];
      const street = area === "park" ? properties.occupancyImpactParkName : analysis.name || impact.streetId || properties.occupancyName;
      if (!street) return [];
      const severity = "moderate";
      const from = analysis.fromName || analysis.fromShortName;
      const to = analysis.toName || analysis.toShortName;
      const limits = [from, to].filter(Boolean).join(" / ");
      const description = [impact.additionalInformation, analysis.additionalInformation].filter(Boolean).join(" - ");
      return [{
        id: `pedestrian-mtl-${properties.id || index}-${impactIndex}`,
        title: street,
        streets: limits ? `${street} (${limits})` : street,
        category: categoryFromAuthority(properties.siteAuthority || properties.occupancySubmitterDetailsSubmitterCategory),
        pedestrianArea: area,
        sourceKind: "pedestrian-montreal-wfs",
        source: "Ville de Montr\u00e9al - Info entraves et travaux",
        sourceUrl: properties.permitPermitId
          ? `https://montreal.ca/entraves-travaux/entraves/${encodeURIComponent(properties.permitPermitId)}`
          : "https://services.montreal.ca/cartes/entraves",
        responsible: properties.submitterSummaryOrganizationName || properties.occupancysubmitterdetailsPublicOrganization || siteAuthorityLabel(properties.siteAuthority),
        borough: properties.boroughId || "Montr\u00e9al",
        startDate,
        endDate,
        severity,
        color: SEVERITY_META[severity].color,
        impact: [noticeSnapshot?.labels?.[area]?.[type] || (area === "park" ? "Travaux en cours dans le parc" : "Am\u00e9nagement pr\u00e9vu pour la circulation pi\u00e9tonne en tout temps"), description].filter(Boolean).join(" - "),
        direction: t("pedestrian.directionUnknown"),
        periods: periodsFromMontrealSchedule(properties),
        schedule: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          .filter((day) => properties[`durationDays${day}Active`])
          .map((day) => ({ day, allDay: properties[`durationDays${day}AllDayRound`] === true,
            start: properties[`durationDays${day}StartTime`], end: properties[`durationDays${day}EndTime`] })),
        geometry,
        point: representativePoint(geometry),
        geometryNote: t(geometry.type === "Point" ? "pedestrian.pointNote" : "pedestrian.geometryNote"),
        details: [
          [t("pedestrian.reference"), properties.permitPermitId],
          [t("pedestrian.area"), t(`pedestrian.area.${area}`)],
          [t("pedestrian.publishedType"), `${area === "park" ? "occupancyImpactParkImpactBlockedType" : "sidewalk.blockedType"}: ${type}`],
          [t("pedestrian.intermittent"), publishedValue(impact.sidewalk?.intermitentClosure)],
          [t("pedestrian.workType"), noticeSnapshot?.labels?.reasons?.[properties.reasonCategory] || properties.reasonCategory],
          [t("pedestrian.noticeChecked"), notice ? noticeSnapshot.extractedAt : t("pedestrian.noticeUnchecked")],
          ...noticeDetails(notice, startDate, endDate)
        ]
      }];
    });
  }

  function normalizeLongueuil(feature) {
    const properties = feature.properties || {};
    const types = String(properties.REPERCUSSIONS_ENTRAVE || "").split(",").map((type) => type.trim());
    if (!types.includes("Sentier_Ferme") || ![1, 2].includes(properties.STATUT_ENTRAVE)) return [];
    const startDate = dateOnlyFromTimestamp(properties.DATE_DEBUT);
    const endDate = dateOnlyFromTimestamp(properties.DATE_FIN);
    if (!properties.DATE_DEBUT || !properties.DATE_FIN || !validPeriod(startDate, endDate) || !validGeometry(feature.geometry)) return [];
    const title = properties.NOM_ENTRAVE || properties.LOCALISATION_ENTRAVE || properties.DESCRIPTION;
    if (!title) return [];
    return [{
      id: `pedestrian-longueuil-${properties.OBJECTID || properties.GLOBALID}`,
      title,
      streets: properties.LOCALISATION_ENTRAVE || title,
      category: "municipal",
      pedestrianArea: "path",
      sourceKind: "pedestrian-longueuil-surface",
      source: "Ville de Longueuil - Gestion des entraves",
      sourceUrl: properties.URL || "https://www.longueuil.quebec/fr/travaux-routiers",
      responsible: longueuilResponsibleLabel(properties),
      borough: "Longueuil",
      startDate,
      endDate,
      severity: "critical",
      color: SEVERITY_META.critical.color,
      impact: [t("pedestrian.pathClosed"), properties.AUTRES_REPERCUSSIONS].filter(Boolean).join(" - "),
      direction: t("pedestrian.directionUnknown"),
      periods: ["day", "night"],
      geometry: feature.geometry,
      point: representativePoint(feature.geometry),
      geometryNote: t(feature.geometry.type === "Point" ? "pedestrian.pointNote" : "pedestrian.geometryNote"),
      details: [
        [t("pedestrian.reference"), String(properties.OBJECTID || properties.GLOBALID)],
        [t("pedestrian.publishedType"), properties.REPERCUSSIONS_ENTRAVE],
        [t("pedestrian.description"), properties.DESCRIPTION],
        [t("pedestrian.workType"), properties.NATURE_ENTRAVE],
        [t("pedestrian.scheduleUnknown"), t("popup.notPublished")]
      ]
    }];
  }

  function publishedValue(value) {
    if (value === null || value === undefined || value === "") return null;
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  }

  function noticeDetails(notice, startDate, endDate) {
    if (!notice || notice.startDate !== startDate || notice.endDate !== endDate || !notice.workImpact) return [];
    const text = (html) => {
      if (typeof html !== "string") return null;
      const document = new DOMParser().parseFromString(html, "text/html");
      document.querySelectorAll("script, style, iframe").forEach((element) => element.remove());
      document.querySelectorAll("p, div, li, br").forEach((element) => element.append("\n"));
      return document.body.textContent.trim();
    };
    return [
      [t("pedestrian.description"), text(notice.workImpact.affectedArea)],
      [t("pedestrian.additionalInfo"), text(notice.workImpact.additionalInformation)],
      ...Object.entries(notice.workImpact.impactOnDailyLife || {}).map(([key, value]) =>
        [noticeSnapshot.labels.dailyLife?.[key] || key, text(value)])
    ];
  }

  function montrealDate(value) {
    const date = new Date(value);
    if (!value || !Number.isFinite(date.valueOf())) return null;
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(date);
  }

  function validPeriod(start, end) {
    return Boolean(start && end && Number.isFinite(Date.parse(start)) && Number.isFinite(Date.parse(end)) && start <= end);
  }

  function validGeometry(geometry) {
    if (!["Point", "LineString", "MultiLineString", "Polygon"].includes(geometry?.type)) return false;
    const coordinates = flattenCoordinates(geometry.coordinates);
    return coordinates.length > 0 && coordinates.every(([longitude, latitude]) =>
      Number.isFinite(longitude) && Number.isFinite(latitude) && Math.abs(longitude) <= 180 && Math.abs(latitude) <= 90);
  }

  function refresh() {
    if (!consolidatedSnapshot) return;
    allClosures = dedupeClosures(consolidatedSnapshot.records.map((record) => ({
      ...record,
      color: SEVERITY_META[record.severity].color,
      streets: record.streets || (record.sourceKind === "pedestrian-marathon-pdf" ? t("marathon.pathName") : record.streets),
      impact: record.impactKey ? t(record.impactKey) : record.impact,
      scheduleText: record.scheduleTextKey ? t(record.scheduleTextKey) : record.scheduleText,
      direction: record.side?.published || t("pedestrian.directionUnknown"),
      geometryNote: t(record.geometryNoteKey || (record.geometry.type === "Point" ? "pedestrian.pointNote" : "pedestrian.geometryNote")),
      details: [
        ...(record.details || []).map((detail) => [detail.labelKey ? t(detail.labelKey) : detail.label, detail.valueKey ? t(detail.valueKey) : detail.value]),
        ...(record.affectedUsers?.includes("cyclists") ? [[t("pedestrian.affectedUsers"), t("pedestrian.cyclists")]] : []),
        [t("pedestrian.sourceChecked"), record.sourceCheckedAt || t("popup.notPublished")],
        [t("pedestrian.side"), t(`pedestrian.side.${record.side?.code || "unknown"}`)],
        ...(record.openEnded ? [[t("pedestrian.endDate"), t("pedestrian.openEnded")]] : [])
      ]
    })));
    updateView({ fit: false });
    const failures = consolidatedSnapshot.sources.filter((source) => source.status === "failed");
    const info = document.querySelector("#pedestrianSnapshotInfo");
    if (info) info.textContent = `${t("pedestrian.generatedAt")} ${consolidatedSnapshot.generatedAt}. ${t("pedestrian.failedSources")} ${failures.length}.`;
    showMapStatus(`${t("pedestrian.loaded")}: ${allClosures.length}.`, "ready");
  }

  function renderUnmappedNotices() {
    const section = document.querySelector("#unmappedNoticesSection");
    const list = document.querySelector("#unmappedNotices");
    if (!section || !list || !consolidatedSnapshot) return;
    const notices = (consolidatedSnapshot.review || []).filter((notice) => notice.displayOnPedestrianPage === true);
    section.hidden = !notices.length || !matchesArea({ pedestrianArea: "path" });
    list.replaceChildren(...notices.map((notice) => {
      const card = document.createElement("article");
      card.className = "closure-card";
      card.dataset.noticeId = notice.id;
      const title = document.createElement("h3");
      title.textContent = notice.title;
      const period = document.createElement("p");
      period.className = "meta";
      period.textContent = notice.publishedPeriod;
      const description = document.createElement("p");
      description.textContent = notice.text;
      const source = document.createElement("a");
      source.href = notice.sourceUrl;
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      source.textContent = t("pedestrian.noticeSource");
      card.append(title, period, description, source);
      return card;
    }));
  }

  async function load() {
    showMapStatus(t("map.loading"), "loading");
    try {
      const snapshot = await fetchJson("data/pedestrian-closures-snapshot.json", { cache: false });
      if (snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.records) || !Array.isArray(snapshot.sources)
        || !Number.isFinite(Date.parse(snapshot.generatedAt))
        || snapshot.records.some((record) => !record.id || !record.sourceUrl || !["critical", "moderate"].includes(record.severity)
          || !["sidewalk", "park", "path"].includes(record.pedestrianArea) || !validGeometry(record.geometry)
          || !(validPeriod(record.startDate, record.endDate) || (record.openEnded === true && Number.isFinite(Date.parse(record.startDate)))))) {
        throw new Error("Invalid consolidated pedestrian snapshot");
      }
      consolidatedSnapshot = snapshot;
      refresh();
    } catch {
      showMapStatus(t("map.loadError"), "error");
    }
  }

  function matchesArea(closure) {
    return [...document.querySelectorAll(".pedestrian-area-filters input:checked")]
      .some((input) => input.value === closure.pedestrianArea);
  }

  function publishedPedestrianImpacts(value) {
    const clauses = String(value || "").split(/[;\n]|(?<=[.!?])\s+/).map((text) => text.trim()).filter(Boolean);
    return clauses.flatMap((text, index) => {
      const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const facility = /\b(trottoirs?|sidewalks?|sentiers?|footpaths?|passages? pietons?)\b/.exec(normalized);
      if (!facility || /\b(aucun|aucune|sans fermeture|pas ferme|pas de fermeture|no closure|not closed|rouvert|reouvert)\b/.test(normalized)) return [];
      const mentionedSides = [...normalized.matchAll(/\b(?:cote|side|trottoir|sidewalk)\s+(nord|sud|est|ouest|north|south|east|west)\b/g)].map((match) => match[1]);
      if (new Set(mentionedSides).size > 1) return [];
      const subject = facility[1];
      const closure = new RegExp(`\\b${subject}\\b(?:\\s+(?:du|de|cote|nord|sud|est|ouest|north|south|east|west|sera|est|sont|seront|completement|temporairement)){0,6}\\s+(?:ferme[es]*|inaccessible[sn]*|closed|blocked)\\b`).test(normalized)
        || new RegExp(`\\b(?:fermeture|closure)\\s+(?:(?:complete|temporaire|du|des|de|d.un|d.une|of|the)\\s+){0,4}${subject}\\b`).test(normalized);
      const arrangement = /\b(?:detour|deviation)\s+(?:pour\s+(?:les\s+)?)?(?:pietons?|pedestrians?)\b/.test(normalized)
        || /\bamenagement\s+(?:temporaire\s+)?(?:du|des|de)\s+trottoirs?\b/.test(normalized)
        || /^travaux de refection(?: permanente?)? (?:de|du|des) trottoirs?\s*\.?$/.test(normalized)
        || /\b(?:passage pieton temporaire|temporary sidewalk|temporary footpath)\b/.test(normalized);
      if (!closure && !arrangement) return [];
      const sideMatch = normalized.match(/\b(?:cote|side)\s+(nord|sud|est|ouest|north|south|east|west)\b/)
        || normalized.match(/\b(?:trottoir|sidewalk)\s+(nord|sud|est|ouest|north|south|east|west)\b/);
      const sideCodes = { nord: "north", north: "north", sud: "south", south: "south", est: "east", east: "east", ouest: "west", west: "west" };
      return [{
        index, text,
        pedestrianArea: /sentier|footpath/.test(subject) ? "path" : "sidewalk",
        severity: closure ? "critical" : "moderate",
        side: { code: sideMatch ? sideCodes[sideMatch[1]] : "unknown", published: sideMatch ? text : null, geometryStatus: "worksite-only" }
      }];
    });
  }

  function publishedCyclingImpacts(value) {
    return String(value || "").split(/[;\n]|(?<=[.!?])\s+/).map((text) => text.trim()).filter(Boolean).flatMap((text, index) => {
      const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (/\b(?:aucune fermeture|sans fermeture|pas de fermeture|ne sera pas|rouvert|reouvert)\b/.test(normalized)) return [];
      const closed = /\bfermeture\s+(?:(?:complete|temporaire|de|du|des|la|le|une|d.une)\s+){0,6}(?:pistes?|voies?|bandes?) cyclables?\b/.test(normalized)
        || /\b(?:pistes?|voies?|bandes?) cyclables?\s+(?:(?:sera|est|seront|sont|completement|temporairement)\s+){0,3}(?:ferme[es]*|inaccessible[sn]*)\b/.test(normalized);
      return closed ? [{ index, text, pedestrianArea: "path", affectedUsers: ["cyclists"], severity: "critical",
        side: { code: "not-applicable", published: null, geometryStatus: "worksite-only" } }] : [];
    });
  }

  function useNoticeSnapshot(snapshot) {
    noticeSnapshot = snapshot;
    notices = new Map((snapshot?.records || []).map((record) => [record.permitId, record]));
  }

  return { load, refresh, renderUnmappedNotices, normalizeMontreal, normalizeLongueuil, matchesArea, publishedPedestrianImpacts, publishedCyclingImpacts, useNoticeSnapshot };
})();