import { createHash } from "node:crypto";
import { hasLocalCoordinates, normalizeSearch, reportDistrict } from "../js/potholes-data.mjs";
import { ANALYSIS_DISTRICTS, analysisDistrict, createPotholeAnalyses, timestamp, inYear } from "./potholes-analysis.mjs";

const fingerprint = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const slug = (name) => normalizeSearch(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const iso = (value) => new Date(value).toISOString();

export function createBoroughProfiles(catalog) {
  const analyses = new Map(ANALYSIS_DISTRICTS.map((name) => [name, createPotholeAnalyses(catalog)]));
  const excludedReports = new Map();
  return {
    addReports(records, sourceYear) {
      const grouped = new Map(ANALYSIS_DISTRICTS.map((name) => [name, []]));
      for (const record of records) {
        if (record.etat === "information" || record.nature === "Information") continue;
        const district = analysisDistrict([reportDistrict(record)]);
        if (district) grouped.get(district).push(record);
        else excludedReports.set(sourceYear, (excludedReports.get(sourceYear) || 0) + 1);
      }
      for (const [district, records] of grouped) analyses.get(district).addReports(records, sourceYear);
    },
    finish(positions, history, globalAnalysis, matchStreet = () => ({ kind: "unmatched" }), geography = null) {
      const grouped = new Map(ANALYSIS_DISTRICTS.map((name) => [name, []]));
      const streets = new Map();
      for (const position of positions) {
        const district = analysisDistrict(position.arrondissements);
        if (!district || !hasLocalCoordinates(position)) continue;
        grouped.get(district).push(position);
        const match = matchStreet(position);
        streets.set(position.positionId, match.kind === "matched" ? match.street.rue : null);
      }
      const observationEnd = globalAnalysis.couverture.signalementsFin;
      const profiles = [];
      for (const [name, localPositions] of grouped) {
        const localAnalysis = analyses.get(name).finish(localPositions, history, observationEnd);
        const periods = localAnalysis.periodes.map((period) => {
          const start = timestamp(period.debut);
          const end = timestamp(period.fin);
          const repairEnd = timestamp(period.sansColmatage.fin);
          const repairStart = timestamp(period.sansColmatage.debut);
          const streetRows = new Map();
          let locationsWithoutStreet = 0;
          const locationRows = localPositions.flatMap((position) => {
            const allDates = position.signalements.map((record) => timestamp(record[1])).filter(Number.isFinite).sort((left, right) => left - right);
            const dates = allDates.filter((value) => value >= start && value <= end);
            if (!dates.length) return [];
            const repairs = (history[position.positionId] || []).filter((record) => Number.isFinite(timestamp(record[0]))
              && timestamp(record[0]) >= allDates[0] && timestamp(record[0]) <= repairEnd);
            const firstRepair = repairs.map((record) => timestamp(record[0])).filter((value) => value > dates[0] && value >= start).sort((left, right) => left - right)[0];
            const anniversary = firstRepair === undefined ? null : inYear(firstRepair, new Date(firstRepair).getUTCFullYear() + 1);
            const returnObserved = anniversary === null || anniversary > end ? null : allDates.some((value) => value > firstRepair && value <= anniversary);
            const comparableCount = allDates.filter((value) => value >= repairStart && value <= repairEnd).length;
            const years = [...new Set(dates.map((value) => new Date(value).getUTCFullYear()))];
            const namedStreet = streets.get(position.positionId);
            const row = {
              positionId: position.positionId, latitude: position.latitude, longitude: position.longitude,
              lieu: position.rues[0] || null, rue: namedStreet, signalements: dates.length, annees: years,
              premierSignalement: iso(dates[0]), dernierSignalement: iso(dates.at(-1)),
              premierSignalementHistorique: iso(allDates[0]), colmatages: repairs.length,
              dernierColmatage: repairs.map((record) => record[0]).sort().at(-1) || null,
              sansColmatage: comparableCount >= 2 && repairs.length === 0,
              signalementsComparables: comparableCount, retour12Mois: returnObserved,
            };
            if (namedStreet) {
              const key = normalizeSearch(namedStreet);
              if (!streetRows.has(key)) streetRows.set(key, { rue: namedStreet, emplacements: 0, signalements: 0, persistants: 0,
                sansColmatage: 0, retours: 0, annees: new Set(), premierSignalement: row.premierSignalement, dernierSignalement: row.dernierSignalement });
              const street = streetRows.get(key);
              street.emplacements += 1;
              street.signalements += dates.length;
              if (years.length > 1) street.persistants += 1;
              if (row.sansColmatage) street.sansColmatage += 1;
              if (returnObserved) street.retours += 1;
              years.forEach((year) => street.annees.add(year));
              if (row.premierSignalement < street.premierSignalement) street.premierSignalement = row.premierSignalement;
              if (row.dernierSignalement > street.dernierSignalement) street.dernierSignalement = row.dernierSignalement;
            } else locationsWithoutStreet += 1;
            return [row];
          });
          const cityPeriod = globalAnalysis.periodes.find((entry) => entry.id === period.id);
          const local = cityPeriod.arrondissements.lignes.find((entry) => entry.nom === name);
          const remaining = cityPeriod.arrondissements.lignes.filter((entry) => entry.nom !== name);
          const { concentration, arrondissements, ...analysis } = period;
          const reports = period.annuels.reduce((total, entry) => total + (entry.signalements || 0), 0);
          return {
            ...analysis,
            indicateurs: {
              signalements: reports, emplacements: period.persistance.emplacements,
              persistants: period.persistance.classes.slice(1).reduce((total, value) => total + value, 0),
              retours: period.retours.revenus, sansPosition: reports - period.persistance.signalements,
            },
            comparaison: {
              local: { emplacements: local.emplacements, recurrents: local.recurrents },
              reste: { emplacements: remaining.reduce((total, entry) => total + entry.emplacements, 0), recurrents: remaining.reduce((total, entry) => total + entry.recurrents, 0) },
            },
            rues: [...streetRows.values()].map((entry) => ({ ...entry, annees: [...entry.annees].sort((left, right) => left - right) }))
              .sort((left, right) => right.persistants - left.persistants || right.signalements - left.signalements || left.rue.localeCompare(right.rue)),
            emplacements: locationRows.sort((left, right) => right.annees.length - left.annees.length || right.signalements - left.signalements || left.positionId.localeCompare(right.positionId)),
            emplacementsSansRue: locationsWithoutStreet,
          };
        });
        const profile = { schemaVersion: 1, id: slug(name), nom: name, origine: globalAnalysis.origine,
          couverture: globalAnalysis.couverture, geographie: geography, periodes: periods };
        profile.version = fingerprint(profile);
        profiles.push(profile);
      }
      const index = {
        schemaVersion: 1, origine: globalAnalysis.origine, couverture: globalAnalysis.couverture,
        donneesModifieesLe: globalAnalysis.donneesModifieesLe, geographie: geography,
        periodes: globalAnalysis.periodes.map((period) => ({ id: period.id, premiereAnnee: period.premiereAnnee, derniereAnnee: period.derniereAnnee })),
        signalementsNonAttribues: [...excludedReports].sort(([left], [right]) => left - right).map(([annee, nombre]) => ({ annee, nombre })),
        arrondissements: profiles.map((profile) => ({ id: profile.id, nom: profile.nom, fichier: `arrondissements/${profile.id}.json`, version: profile.version })),
      };
      index.version = fingerprint(index);
      return { index, profiles };
    },
  };
}