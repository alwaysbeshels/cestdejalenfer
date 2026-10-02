import { hasLocalCoordinates, normalizeSearch } from "../js/potholes-data.mjs";

const districtKey = (value) => normalizeSearch(value).replace(/[\u2018\u2019]/g, "'").replace(/\s*-\s*/g, "-");
const districts = new Map([
  "Ahuntsic-Cartierville", "Anjou", "C\u00f4te-des-Neiges-Notre-Dame-de-Gr\u00e2ce", "Lachine", "LaSalle",
  "Le Plateau-Mont-Royal", "Le Sud-Ouest", "L'\u00cele-Bizard-Sainte-Genevi\u00e8ve", "Mercier-Hochelaga-Maisonneuve",
  "Montr\u00e9al-Nord", "Outremont", "Pierrefonds-Roxboro", "Rivi\u00e8re-des-Prairies-Pointe-aux-Trembles",
  "Rosemont-La Petite-Patrie", "Saint-Laurent", "Saint-L\u00e9onard", "Verdun", "Ville-Marie", "Villeray-Saint-Michel-Parc-Extension",
].map((name) => [districtKey(name), name]));

export const ANALYSIS_DISTRICTS = Object.freeze([...districts.values()]);

export function analysisDistrict(names) {
  const unique = [...new Set(names.map(districtKey))];
  return unique.length === 1 ? districts.get(unique[0]) || null : null;
}

export function timestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) return NaN;
  return Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value.length === 10 ? `${value}T00:00:00` : value}Z`);
}

export function inYear(value, year) {
  const date = new Date(value);
  const month = date.getUTCMonth();
  const day = Math.min(date.getUTCDate(), new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
  date.setUTCFullYear(year, month, day);
  return date.getTime();
}

export function createPotholeAnalyses(catalog) {
  const sourceYears = [...new Set(catalog.signalements.map((entry) => entry.annee))].sort((left, right) => left - right);
  const reportsByYear = new Map(sourceYears.map((year) => [year, []]));
  let observedUntil = -Infinity;
  let invalidDates = 0;
  let totalReports = 0;
  const repairStart = Math.min(...catalog.reparations.map((entry) => timestamp(entry.premiereIntervention)).filter(Number.isFinite));
  const repairEnd = Math.max(...catalog.reparations.map((entry) => timestamp(entry.derniereIntervention)).filter(Number.isFinite));
  return {
    addReports(records, sourceYear) {
      for (const record of records) {
        const date = timestamp(record.dateCreation);
        if (Number.isFinite(date)) observedUntil = Math.max(observedUntil, date);
        if (record.etat === "information" || record.nature === "Information") continue;
        totalReports += 1;
        if (!Number.isFinite(date)) { invalidDates += 1; continue; }
        if (!reportsByYear.has(sourceYear)) throw new Error("Annee absente du catalogue d'analyse");
        reportsByYear.get(sourceYear).push(date);
      }
    },
    finish(positions, history, observationEnd = null) {
      if (observationEnd !== null) {
        const end = timestamp(observationEnd);
        if (!Number.isFinite(end) || end < observedUntil) throw new Error("Fin d'observation incoherente");
        observedUntil = end;
      }
      if (!Number.isFinite(observedUntil) || !Number.isFinite(repairStart) || !Number.isFinite(repairEnd)) {
        throw new Error("Couverture temporelle insuffisante pour les analyses");
      }
      const lastYear = new Date(observedUntil).getUTCFullYear();
      const prepared = positions.filter((position) => hasLocalCoordinates(position)).map((position) => {
        const dates = position.signalements.map((record) => timestamp(record[1])).filter(Number.isFinite).sort((left, right) => left - right);
        const repairs = [...new Set((history[position.positionId] || []).map((record) => timestamp(record[0])))]
          .filter((date) => Number.isFinite(date) && date >= repairStart && date <= repairEnd).sort((left, right) => left - right);
        return { id: position.positionId, dates, repairs, district: analysisDistrict(position.arrondissements) };
      }).filter((position) => position.dates.length);
      const periods = [
        { id: "recent", firstYear: Math.max(sourceYears[0], lastYear - 4) },
        { id: "all", firstYear: sourceYears[0] },
      ].map(({ id, firstYear }) => {
        const start = Date.UTC(firstYear, 0, 1);
        const matchingStart = Math.max(start, repairStart);
        const persistence = [0, 0, 0, 0, 0];
        const unpatched = [0, 0, 0, 0];
        const districtTotals = new Map([...districts.values()].map((name) => [name, { nom: name, emplacements: 0, recurrents: 0 }]));
        const locationCounts = [];
        let mappedReports = 0;
        let excludedDistricts = 0;
        let cohortCount = 0;
        let returningCount = 0;
        let incompleteFollowup = 0;
        let unpatchedReports = 0;
        for (const position of prepared) {
          const reports = position.dates.filter((date) => date >= start && date <= observedUntil);
          if (!reports.length) continue;
          const years = new Set(reports.map((date) => new Date(date).getUTCFullYear())).size;
          persistence[Math.min(years, 5) - 1] += 1;
          mappedReports += reports.length;
          locationCounts.push({ id: position.id, count: reports.length });
          if (position.district) {
            const district = districtTotals.get(position.district);
            district.emplacements += 1;
            if (years > 1) district.recurrents += 1;
          } else excludedDistricts += 1;
          const firstRepair = position.repairs.find((date) => date > reports[0] && date >= start);
          if (firstRepair !== undefined) {
            const anniversary = inYear(firstRepair, new Date(firstRepair).getUTCFullYear() + 1);
            if (anniversary <= observedUntil) {
              cohortCount += 1;
              if (position.dates.some((date) => date > firstRepair && date <= anniversary)) returningCount += 1;
            } else incompleteFollowup += 1;
          }
          const comparable = position.dates.filter((date) => date >= matchingStart && date <= repairEnd);
          if (comparable.length >= 2 && !position.repairs.some((date) => date >= position.dates[0])) {
            const bucket = Math.min(comparable.length - 2, 3);
            unpatched[bucket] += 1;
            unpatchedReports += comparable.length;
          }
        }
        locationCounts.sort((left, right) => right.count - left.count || left.id.localeCompare(right.id));
        const topLocations = Math.ceil(locationCounts.length * 0.1);
        const topReports = locationCounts.slice(0, topLocations).reduce((sum, entry) => sum + entry.count, 0);
        const annual = Array.from({ length: lastYear - firstYear + 1 }, (unused, index) => {
          const year = firstYear + index;
          const dates = reportsByYear.get(year);
          return { annee: year, signalements: dates ? dates.length : null };
        });
        const periodReports = [...reportsByYear.values()].reduce((sum, dates) => sum + dates.filter((date) => date >= start && date <= observedUntil).length, 0);
        const boroughs = [...districtTotals.values()].map((district) => ({
          ...district, proportion: district.emplacements ? district.recurrents / district.emplacements : null,
        })).sort((left, right) => (right.proportion ?? -1) - (left.proportion ?? -1) || left.nom.localeCompare(right.nom));
        return {
          id, premiereAnnee: firstYear, derniereAnnee: lastYear, debut: new Date(start).toISOString(), fin: new Date(observedUntil).toISOString(),
          annuels: annual,
          persistance: { emplacements: locationCounts.length, classes: persistence, signalements: mappedReports, nonLocalises: periodReports - mappedReports },
          concentration: { emplacements: locationCounts.length, principaux: topLocations, signalements: mappedReports, principauxSignalements: topReports, autresSignalements: mappedReports - topReports },
          retours: { observes: cohortCount, revenus: returningCount, sansRetour: cohortCount - returningCount, suiviIncomplet: incompleteFollowup, moisSuivi: 12 },
          sansColmatage: { emplacements: unpatched.reduce((sum, count) => sum + count, 0), classes: unpatched, signalements: unpatchedReports,
            debut: matchingStart <= repairEnd ? new Date(matchingStart).toISOString() : null, fin: new Date(repairEnd).toISOString() },
          arrondissements: { lignes: boroughs, emplacementsExclus: excludedDistricts },
        };
      });
      return {
        schemaVersion: 4,
        couverture: {
          signalementsFin: new Date(observedUntil).toISOString(), colmatagesDebut: new Date(repairStart).toISOString(), colmatagesFin: new Date(repairEnd).toISOString(),
          signalements: totalReports, datesInvalides: invalidDates, rayonAppariementM: catalog.rayonAppariementM,
        },
        periodes: periods,
      };
    },
  };
}