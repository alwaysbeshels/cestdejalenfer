#!/usr/bin/env node
// Genere et rafraichit les snapshots nids-de-poule de Montreal dans data/nids-de-poule/ :
// signalements 311 (courants + historique) et travaux de colmatage mecanise reels.
//
// Par defaut, seule l'annee courante est retelechargee. Les annees anterieures ne sont
// reconstruites que si la source a reellement change, ce qui est detecte par une sonde
// legere (nombre d'enregistrements, derniere date de creation, dernier changement de
// statut). Un fichier n'est reecrit que si son contenu change : verification.json porte
// seul la date de chaque verification.
//
// Usage :
//   node tools/build-nids-de-poule-snapshot.mjs                  rafraichissement normal
//   node tools/build-nids-de-poule-snapshot.mjs --tout           tout reconstruire
//   node tools/build-nids-de-poule-snapshot.mjs --annees=2024,2025
//   node tools/build-nids-de-poule-snapshot.mjs --rayon=50
//   node tools/build-nids-de-poule-snapshot.mjs --force          re-telecharger les GeoPackage

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasLocalCoordinates, reportStreet, reportDistrict, buildActivePeriods } from "../js/potholes-data.mjs";
import { createPotholeRankings, loadPotholeStreets } from "./potholes-rankings.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "data", "nids-de-poule");
const CACHE_DIR = path.join(ROOT, "tools", "cache-nids-de-poule");
const FICHIER_VERIFICATION = "verification.json";

// Le WAF de donnees.montreal.ca renvoie 403 sur le User-Agent par defaut de Node et Python.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
const CKAN = "https://donnees.montreal.ca/api/3/action";
const PAGE_SIZE = 20000; // le serveur plafonne une reponse SQL a 32 000 lignes

const DATASET_311 = "https://donnees.montreal.ca/dataset/requete-311";
const DATASET_COLMATAGE =
  "https://donnees.montreal.ca/dataset/refection-de-chaussee-par-remplissage-mecanise-de-nid-de-poule";

// L'annee 2016 est publiee a l'identique dans deux ressources (8 768 enregistrements dans
// chacune) : elle n'est lue que depuis la ressource 2014-2016. La ressource f180b33d
// (archives 2017-2018) est annoncee active mais sa table est absente du datastore ; 2017
// et 2018 viennent donc de la ressource 2016-2018.
const SOURCES_311 = [
  { resourceId: "f62595b0-b26a-4e7b-ba67-05b84521ab64", libelle: "Requetes 3-1-1 (archives 2014 a 2016)", annees: [2014, 2015, 2016] },
  { resourceId: "dbc02208-907c-46ff-a052-e4c42042d327", libelle: "Requetes 3-1-1 (archives 2016 a 2018)", annees: [2017, 2018] },
  { resourceId: "dbfc05f8-b939-4639-ae52-2e77f738e43f", libelle: "Requetes 3-1-1 (archives 2019 a 2021)", annees: [2019, 2020, 2021] },
  { resourceId: "2cfa0e06-9be4-49a6-b7f1-ee9f2363a872", libelle: "Requetes 3-1-1 (2022 a ce jour)", annees: [2022, 2023, 2024, 2025, 2026] },
];

const SOURCES_COLMATAGE = [
  { annee: 2016, resourceId: "bfb60be3-22d0-43db-8795-19d28dab1d76", format: "csv" },
  { annee: 2017, resourceId: "db9f7ad5-63fb-48a8-a282-8276367383e9", format: "csv" },
  { annee: 2018, resourceId: "b6dbc325-bec5-4d51-876e-4a54fd6bd563", format: "csv" },
  { annee: 2019, resourceId: "c3d11c03-17d2-4909-9c45-a4d5e0050816", format: "csv" },
  { annee: 2020, resourceId: "1fd93da8-08bc-4ff3-a233-2917eaeab6c6", format: "csv" },
  { annee: 2021, resourceId: "0ca3cabe-9035-4309-94ad-4125126e099e", format: "gpkg" },
  { annee: 2022, resourceId: "7689cd42-0bcf-40ef-84a3-5f198fcf6b38", format: "gpkg" },
  { annee: 2023, resourceId: "b41845e8-216e-42c0-94a8-2ca74c75127c", format: "gpkg" },
  { annee: 2024, resourceId: "7a36daa6-621f-4fc8-a50c-2250ac058402", format: "gpkg" },
  { annee: 2025, resourceId: "e4f7b534-fba2-428f-b68e-10ed96ae8281", format: "gpkg" },
];

const CHAMPS_311 = [
  "ID_UNIQUE", "NATURE", "ACTI_NOM", "TYPE_LIEU_INTERV", "RUE", "RUE_INTERSECTION1",
  "RUE_INTERSECTION2", "LIN_CODE_POSTAL", "ARRONDISSEMENT", "ARRONDISSEMENT_GEO",
  "UNITE_RESP_PARENT", "DDS_DATE_CREATION", "PROVENANCE_ORIGINALE", "PROVENANCE_TELEPHONE",
  "PROVENANCE_COURRIEL", "PROVENANCE_PERSONNE", "PROVENANCE_COURRIER", "PROVENANCE_TELECOPIEUR",
  "PROVENANCE_INSTANCE", "PROVENANCE_MOBILE", "PROVENANCE_MEDIASOCIAUX", "PROVENANCE_SITEINTERNET",
  "LOC_LAT", "LOC_LONG", "LOC_X", "LOC_Y", "LOC_ERREUR_GDT", "DERNIER_STATUT", "DATE_DERNIER_STATUT",
];

const STATUTS_OUVERTS = new Set(["Acceptee", "Prise en charge", "Transmise pour traitement", "Reactivee", "Urgente"]);
const STATUTS_FERMES = new Set(["Terminee", "Annulee", "Refusee", "Supprimee"]);

const args = process.argv.slice(2);
const flag = (nom) => args.find((a) => a.startsWith(`--${nom}=`))?.split("=")[1];
const RAYON_M = Number(flag("rayon") ?? 25);
const FORCE_TELECHARGEMENT = args.includes("--force");
const TOUT = args.includes("--tout");
const ANNEES_FORCEES = flag("annees") ? new Set(flag("annees").split(",").map((v) => Number(v.trim()))) : null;
const ANNEE_COURANTE = new Date().getFullYear();

const sansAccent = (v) => (v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const arrondir = (v, n) => (v == null || !Number.isFinite(Number(v)) ? null : Number(Number(v).toFixed(n)));

// Les cles absentes sont retirees plutot que serialisees a null : sur plus d'un million
// d'enregistrements, les champs vides representent l'essentiel du poids des fichiers.
function compacter(objet) {
  const sortie = {};
  for (const [cle, valeur] of Object.entries(objet)) {
    if (valeur == null || valeur === "") continue;
    if (typeof valeur === "object" && !Array.isArray(valeur)) {
      const enfant = compacter(valeur);
      if (Object.keys(enfant).length) sortie[cle] = enfant;
      continue;
    }
    sortie[cle] = valeur;
  }
  return sortie;
}

async function ckanPost(action, payload, tentative = 0) {
  const response = await fetch(`${CKAN}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT, Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    if (tentative < 4 && (response.status === 403 || response.status === 429 || response.status >= 500)) {
      await sleep(2000 * (tentative + 1));
      return ckanPost(action, payload, tentative + 1);
    }
    throw new Error(`${action} HTTP ${response.status} : ${(await response.text()).slice(0, 200)}`);
  }
  const data = await response.json();
  if (!data.success) throw new Error(`${action} : ${JSON.stringify(data.error).slice(0, 200)}`);
  return data.result;
}

// Les comparaisons de plages ISO fonctionnent aussi bien sur les colonnes texte (ressource
// courante) que timestamp (archives). cast, to_char et EXTRACT sont refuses par la liste
// blanche de fonctions du datastore.
const filtreAnnee = (annee) =>
  `"ACTI_NOM" = 'Nid-de-poule' AND "DDS_DATE_CREATION" >= '${annee}-01-01' AND "DDS_DATE_CREATION" < '${annee + 1}-01-01'`;

async function sonderAnnee311(resourceId, annee) {
  const sql =
    `SELECT count(*) AS "nombre", max("DDS_DATE_CREATION") AS "creationMax", ` +
    `max("DATE_DERNIER_STATUT") AS "statutMax" FROM "${resourceId}" WHERE ${filtreAnnee(annee)}`;
  const { records } = await ckanPost("datastore_search_sql", { sql });
  const r = records[0] ?? {};
  return { nombre: Number(r.nombre ?? 0), creationMax: r.creationMax ?? null, statutMax: r.statutMax ?? null };
}

async function lireAnnee311(resourceId, annee) {
  const lignes = [];
  const colonnes = CHAMPS_311.map((c) => `"${c}"`).join(",");
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const sql = `SELECT ${colonnes} FROM "${resourceId}" WHERE ${filtreAnnee(annee)} ORDER BY "_id" LIMIT ${PAGE_SIZE} OFFSET ${offset}`;
    const { records } = await ckanPost("datastore_search_sql", { sql });
    for (const r of records) lignes.push(r);
    if (records.length < PAGE_SIZE) break;
  }
  return lignes;
}

// EPSG:2950 (NAD83 / MTM zone 8) vers WGS84 et retour. Valide contre 4 000 enregistrements
// 311 publiant a la fois LOC_X/LOC_Y et LOC_LAT/LOC_LONG : ecart maximal 0,17 mm.
const A = 6378137.0;
const F = 1 / 298.257222101;
const E2 = F * (2 - F);
const LON0 = (-73.5 * Math.PI) / 180;
const K0 = 0.9999;
const FE = 304800.0;

function mtm8VersWgs84(E, N) {
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
  const M = N / K0;
  const mu = M / (A * (1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 ** 3) / 256));
  const p =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const ep2 = E2 / (1 - E2);
  const C = ep2 * Math.cos(p) ** 2;
  const T = Math.tan(p) ** 2;
  const Nn = A / Math.sqrt(1 - E2 * Math.sin(p) ** 2);
  const R = (A * (1 - E2)) / (1 - E2 * Math.sin(p) ** 2) ** 1.5;
  const D = (E - FE) / (Nn * K0);
  const lat =
    p -
    ((Nn * Math.tan(p)) / R) *
      ((D * D) / 2 -
        ((5 + 3 * T + 10 * C - 4 * C * C - 9 * ep2) * D ** 4) / 24 +
        ((61 + 90 * T + 298 * C + 45 * T * T - 252 * ep2 - 3 * C * C) * D ** 6) / 720);
  const lon =
    LON0 +
    (D - ((1 + 2 * T + C) * D ** 3) / 6 + ((5 - 2 * C + 28 * T - 3 * C * C + 8 * ep2 + 24 * T * T) * D ** 5) / 120) /
      Math.cos(p);
  return [(lat * 180) / Math.PI, (lon * 180) / Math.PI];
}

function wgs84VersMtm8(latDeg, lonDeg) {
  const p = (latDeg * Math.PI) / 180;
  const l = (lonDeg * Math.PI) / 180;
  const ep2 = E2 / (1 - E2);
  const Nn = A / Math.sqrt(1 - E2 * Math.sin(p) ** 2);
  const T = Math.tan(p) ** 2;
  const C = ep2 * Math.cos(p) ** 2;
  const Aa = (l - LON0) * Math.cos(p);
  const M =
    A *
    ((1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 ** 3) / 256) * p -
      ((3 * E2) / 8 + (3 * E2 * E2) / 32 + (45 * E2 ** 3) / 1024) * Math.sin(2 * p) +
      ((15 * E2 * E2) / 256 + (45 * E2 ** 3) / 1024) * Math.sin(4 * p) -
      ((35 * E2 ** 3) / 3072) * Math.sin(6 * p));
  const E =
    FE + K0 * Nn * (Aa + ((1 - T + C) * Aa ** 3) / 6 + ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * Aa ** 5) / 120);
  const N =
    K0 *
    (M +
      Nn *
        Math.tan(p) *
        ((Aa * Aa) / 2 +
          ((5 - T + 9 * C + 4 * C * C) * Aa ** 4) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * Aa ** 6) / 720));
  return [E, N];
}

function decoderPointGeoPackage(blob) {
  const vue = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  const drapeaux = vue.getUint8(3);
  const tailleEnveloppe = { 0: 0, 1: 32, 2: 48, 3: 48, 4: 64 }[(drapeaux >> 1) & 0x07];
  const debut = 8 + tailleEnveloppe;
  const petitBoutiste = vue.getUint8(debut) === 1;
  return [vue.getFloat64(debut + 5, petitBoutiste), vue.getFloat64(debut + 13, petitBoutiste)];
}

async function metaRessource(resourceId) {
  const r = await ckanPost("resource_show", { id: resourceId });
  return { url: r.url, derniereModification: r.last_modified ?? null };
}

async function telechargerGeoPackage(resourceId, annee, url) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const fichier = path.join(CACHE_DIR, `colmatage-${annee}.gpkg`);
  if (FORCE_TELECHARGEMENT || !existsSync(fichier) || statSync(fichier).size === 0) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) throw new Error(`GeoPackage ${annee} HTTP ${response.status}`);
    writeFileSync(fichier, Buffer.from(await response.arrayBuffer()));
  }
  return fichier;
}

function normaliserHeure(dateJour, dateHeure) {
  const jour = String(dateJour ?? "").slice(0, 10);
  if (!jour) return null;
  let heure = String(dateHeure ?? "").trim();
  const ampm = heure.match(/^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = Number(ampm[1]) % 12;
    if (ampm[4].toUpperCase() === "PM") h += 12;
    heure = `${String(h).padStart(2, "0")}:${ampm[2]}:${ampm[3]}`;
  }
  return /^\d{2}:\d{2}:\d{2}$/.test(heure) ? `${jour}T${heure}` : jour;
}

async function telechargerColmatage(source, url) {
  const interventions = [];
  if (source.format === "csv") {
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const sql = `SELECT "Appareil","DateJour","DateHeure","Latitude","Longitude" FROM "${source.resourceId}" ORDER BY "_id" LIMIT ${PAGE_SIZE} OFFSET ${offset}`;
      const { records } = await ckanPost("datastore_search_sql", { sql });
      for (const r of records) {
        const lat = Number(r.Latitude);
        const lon = Number(r.Longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        interventions.push(
          compacter({
            horodatage: normaliserHeure(r.DateJour, r.DateHeure),
            appareil: r.Appareil == null ? null : String(r.Appareil),
            latitude: arrondir(lat, 6),
            longitude: arrondir(lon, 6),
          })
        );
      }
      if (records.length < PAGE_SIZE) break;
    }
    return { interventions, origine: "datastore CSV (WGS84 publie)" };
  }

  const fichier = await telechargerGeoPackage(source.resourceId, source.annee, url);
  const db = new DatabaseSync(fichier, { readOnly: true });
  const [{ table_name: table }] = db.prepare("SELECT table_name FROM gpkg_contents").all();
  const colonnes = db.prepare(`PRAGMA table_info("${table}")`).all().map((c) => c.name);
  const colGeom = colonnes.find((c) => /^geom/i.test(c)) ?? "geom";
  const colDate = colonnes.find((c) => sansAccent(c).toLowerCase().startsWith("date")) ?? "Date";
  const colAppareil = colonnes.find((c) => /vehic|appareil/i.test(sansAccent(c))) ?? null;
  for (const ligne of db.prepare(`SELECT * FROM "${table}"`).iterate()) {
    const [x, y] = decoderPointGeoPackage(ligne[colGeom]);
    const [lat, lon] = mtm8VersWgs84(x, y);
    const brut = String(ligne[colDate] ?? "").trim();
    interventions.push(
      compacter({
        horodatage: brut ? brut.replace(" ", "T").replace(/\.\d+$/, "") : null,
        appareil: colAppareil && ligne[colAppareil] != null ? String(ligne[colAppareil]) : null,
        latitude: arrondir(lat, 6),
        longitude: arrondir(lon, 6),
      })
    );
  }
  db.close();
  return { interventions, origine: "GeoPackage EPSG:2950 reprojete en WGS84" };
}

// Grille reguliere en metres : les coordonnees projetees rendent la distance exacte.
function construireIndexSpatial(points, taille) {
  const grille = new Map();
  points.forEach((p, i) => {
    const cle = `${Math.floor(p.x / taille)}|${Math.floor(p.y / taille)}`;
    let seau = grille.get(cle);
    if (!seau) grille.set(cle, (seau = []));
    seau.push(i);
  });
  return { grille, taille };
}

function interventionsProches(index, points, x, y, rayon) {
  const { grille, taille } = index;
  const portee = Math.ceil(rayon / taille);
  const gx = Math.floor(x / taille);
  const gy = Math.floor(y / taille);
  const trouves = [];
  for (let dx = -portee; dx <= portee; dx += 1) {
    for (let dy = -portee; dy <= portee; dy += 1) {
      for (const i of grille.get(`${gx + dx}|${gy + dy}`) ?? []) {
        const p = points[i];
        const d = Math.hypot(p.x - x, p.y - y);
        if (d <= rayon) trouves.push({ point: p, distance: d });
      }
    }
  }
  return trouves;
}

function lireJson(fichier) {
  const chemin = path.join(OUT_DIR, fichier);
  if (!existsSync(chemin)) return null;
  try {
    return JSON.parse(readFileSync(chemin, "utf8"));
  } catch {
    return null;
  }
}

function empreinteDe(contenu) {
  const copie = { ...contenu };
  delete copie.contenuModifieLe;
  return createHash("sha256").update(JSON.stringify(copie)).digest("hex");
}

function ecrireSiModifie(fichier, contenu, etat) {
  const empreinte = empreinteDe(contenu);
  const precedent = etat.fichiers?.[fichier];
  const chemin = path.join(OUT_DIR, fichier);
  if (precedent?.empreinte === empreinte && existsSync(chemin)) {
    return { empreinte, contenuModifieLe: precedent.contenuModifieLe, modifie: false };
  }
  const contenuModifieLe = new Date().toISOString();
  writeFileSync(chemin, JSON.stringify({ ...contenu, contenuModifieLe }));
  return { empreinte, contenuModifieLe, modifie: true };
}

const clePosition = (lat, lon) => `${Number(lat).toFixed(7)},${Number(lon).toFixed(7)}`;

async function construireCarteLocale() {
  const catalogue = lireJson("index.json");
  if (!catalogue?.signalements?.length || !catalogue?.reparations?.length) throw new Error("Index des snapshots absent");
  const referenceRues = await loadPotholeStreets(CACHE_DIR, args.includes("--actualiser-rues"));
  const datesDebut = catalogue.reparations.map((entree) => entree.premiereIntervention).filter(Boolean).sort();
  const datesFin = catalogue.reparations.map((entree) => entree.derniereIntervention).filter(Boolean).sort();
  const classements = createPotholeRankings(referenceRues.rues, {
    firstRepair: datesDebut[0], lastRepair: datesFin.at(-1), latestYear: Math.max(...catalogue.reparations.map((entree) => entree.annee)),
  });
  const positions = new Map();
  const annees = [];
  for (const entree of catalogue.signalements) {
    const snapshot = lireJson(entree.fichier);
    if (!snapshot || snapshot.signalements?.length !== entree.nombre) throw new Error(`Snapshot incomplet : ${entree.fichier}`);
    let informations = 0;
    let nonCartographiables = 0;
    snapshot.signalements.forEach((record, recordIndex) => {
      if (record.etat === "information" || record.nature === "Information") { informations += 1; return; }
      if (!record.positionFiable || !record.positionId || !hasLocalCoordinates(record)) { nonCartographiables += 1; return; }
      let position = positions.get(record.positionId);
      if (!position) {
        position = {
          positionId: record.positionId, latitude: record.latitude, longitude: record.longitude,
          rues: new Set(), arrondissements: new Set(), signalements: [], premierSignalement: "", dernierSignalement: "",
        };
        positions.set(record.positionId, position);
      }
      const rue = reportStreet(record);
      const arrondissement = reportDistrict(record);
      if (rue) position.rues.add(rue);
      if (arrondissement) position.arrondissements.add(arrondissement);
      position.signalements.push([record.idUnique || "", record.dateCreation || "", record.dernierStatut || "", entree.annee, recordIndex]);
      if (record.dateCreation && (!position.premierSignalement || record.dateCreation < position.premierSignalement)) position.premierSignalement = record.dateCreation;
      if (record.dateCreation > position.dernierSignalement) position.dernierSignalement = record.dateCreation;
    });
    annees.push({ annee: entree.annee, nombre: entree.nombre, informations, nonCartographiables });
  }
  const points = [];
  const sources = [];
  for (const entree of catalogue.reparations) {
    const snapshot = lireJson(entree.fichier);
    if (!snapshot || snapshot.interventions?.length !== entree.nombre) throw new Error(`Snapshot incomplet : ${entree.fichier}`);
    let exclus = 0;
    for (const record of snapshot.interventions) {
      classements.addRepair(record, entree.annee);
      if (!hasLocalCoordinates(record) || !Number.isFinite(Date.parse(record.horodatage))) { exclus += 1; continue; }
      const [x, y] = wgs84VersMtm8(record.latitude, record.longitude);
      points.push({ ...record, x, y });
    }
    sources.push({ annee: entree.annee, nombre: entree.nombre, exclus, premiereIntervention: snapshot.premiereIntervention, derniereIntervention: snapshot.derniereIntervention });
  }
  const rayon = Number(catalogue.rayonAppariementM);
  if (!Number.isFinite(rayon) || rayon <= 0) throw new Error("Rayon d'appariement invalide");
  const spatial = construireIndexSpatial(points, 100);
  const historique = {};
  const carte = [];
  for (const position of positions.values()) {
    const [x, y] = wgs84VersMtm8(position.latitude, position.longitude);
    const uniques = new Map();
    for (const voisin of interventionsProches(spatial, points, x, y, rayon)) {
      const intervention = voisin.point;
      if (intervention.horodatage < position.premierSignalement) continue;
      const cle = [intervention.horodatage, intervention.appareil || "", intervention.latitude, intervention.longitude].join("|");
      uniques.set(cle, [intervention.horodatage, intervention.appareil || "", Number(voisin.distance.toFixed(1)), intervention.latitude, intervention.longitude]);
    }
    const interventions = [...uniques.values()].sort((left, right) => left[0].localeCompare(right[0]));
    if (interventions.length) historique[position.positionId] = interventions;
    carte.push({
      ...position,
      rues: [...position.rues], arrondissements: [...position.arrondissements],
      signalements: position.signalements.sort((left, right) => left[1].localeCompare(right[1])),
      nombreColmatages: interventions.length,
      dernierColmatage: interventions.at(-1)?.[0] || "",
      periodesActives: buildActivePeriods(position.signalements.map((record) => record[1]), interventions.map((record) => record[0])),
    });
  }
  carte.sort((left, right) => left.positionId.localeCompare(right.positionId));
  const origine = {
    indexModifieLe: catalogue.contenuModifieLe,
    signalements: catalogue.signalements.map((entree) => [entree.fichier, entree.contenuModifieLe]),
    reparations: catalogue.reparations.map((entree) => [entree.fichier, entree.contenuModifieLe]),
  };
  const schemaVersion = 2;
  const version = empreinteDe({ origine, schemaVersion });
  const classementsCalcules = classements.finish(carte, historique);
  classementsCalcules.geobase = {
    source: referenceRues.source, recupereLe: referenceRues.recupereLe, empreinte: referenceRues.empreinte,
    troncons: referenceRues.rues.length, tronconsSource: referenceRues.nombreTronconsSource,
  };
  const sorties = {
    "statistiques.json": { version, origine, annees, classements: classementsCalcules },
    "carte.json": {
      version, schemaVersion, origine, rayonAppariementM: rayon, annees, reparations: sources,
      colonnesSignalements: ["idUnique", "dateCreation", "dernierStatut", "annee", "index"],
      positions: carte,
    },
    "historique-colmatages.json": {
      version, rayonAppariementM: rayon,
      colonnes: ["horodatage", "appareil", "distanceM", "latitude", "longitude"],
      positions: historique,
    },
  };
  for (const [fichier, contenu] of Object.entries(sorties)) {
    const precedent = lireJson(fichier);
    if (precedent && empreinteDe(precedent) === empreinteDe(contenu)) {
      console.log(`  ${fichier} : inchange`);
      continue;
    }
    writeFileSync(path.join(OUT_DIR, fichier), JSON.stringify({ ...contenu, contenuModifieLe: new Date().toISOString() }));
    console.log(`  ${fichier} : genere depuis les snapshots locaux`);
  }
  console.log(`  carte : ${carte.length} positions; colmatages exclus : ${sources.reduce((total, source) => total + source.exclus, 0)}`);
}

function normaliser(r) {
  const estInformation = r.NATURE === "Information";
  const positionFiable = !estInformation && r.LOC_ERREUR_GDT === "0" && r.LOC_LAT != null;
  const statut = sansAccent(r.DERNIER_STATUT);
  const dateCreation = r.DDS_DATE_CREATION;
  const dateDernierStatut = r.DATE_DERNIER_STATUT;
  let delai = null;
  if (dateCreation && dateDernierStatut) {
    const d = (Date.parse(dateDernierStatut) - Date.parse(dateCreation)) / 86400000;
    delai = Number.isFinite(d) ? Number(d.toFixed(2)) : null;
  }
  return compacter({
    idUnique: r.ID_UNIQUE,
    nature: r.NATURE,
    categorie: r.ACTI_NOM,
    typeLieuIntervention: r.TYPE_LIEU_INTERV,
    rue: r.RUE,
    intersection1: r.RUE_INTERSECTION1,
    intersection2: r.RUE_INTERSECTION2,
    codePostal: r.LIN_CODE_POSTAL,
    arrondissement: r.ARRONDISSEMENT,
    arrondissementGeo: r.ARRONDISSEMENT_GEO,
    uniteResponsable: r.UNITE_RESP_PARENT,
    dateCreation,
    provenance: r.PROVENANCE_ORIGINALE,
    provenanceDetail: {
      telephone: Number(r.PROVENANCE_TELEPHONE ?? 0) || null,
      courriel: Number(r.PROVENANCE_COURRIEL ?? 0) || null,
      personne: Number(r.PROVENANCE_PERSONNE ?? 0) || null,
      courrier: Number(r.PROVENANCE_COURRIER ?? 0) || null,
      telecopieur: Number(r.PROVENANCE_TELECOPIEUR ?? 0) || null,
      instance: Number(r.PROVENANCE_INSTANCE ?? 0) || null,
      mobile: Number(r.PROVENANCE_MOBILE ?? 0) || null,
      mediasSociaux: Number(r.PROVENANCE_MEDIASOCIAUX ?? 0) || null,
      siteInternet: Number(r.PROVENANCE_SITEINTERNET ?? 0) || null,
    },
    latitude: arrondir(r.LOC_LAT, 7),
    longitude: arrondir(r.LOC_LONG, 7),
    x: arrondir(r.LOC_X, 2),
    y: arrondir(r.LOC_Y, 2),
    precisionLocalisation:
      r.LOC_ERREUR_GDT === "0" ? "lieu-de-la-requete" : r.LOC_ERREUR_GDT === "1" ? "bureau-arrondissement" : null,
    positionFiable,
    positionId: positionFiable ? clePosition(r.LOC_LAT, r.LOC_LONG) : null,
    dernierStatut: r.DERNIER_STATUT,
    dateDernierStatut,
    etat: estInformation
      ? "information"
      : STATUTS_OUVERTS.has(statut)
      ? "ouvert"
      : STATUTS_FERMES.has(statut)
      ? "ferme"
      : "inconnu",
    delaiTraitementJours: delai,
  });
}

function apparierColmatage(record, index, points) {
  if (!record.positionFiable || record.x == null || record.y == null) return null;
  const proches = interventionsProches(index, points, record.x, record.y, RAYON_M);
  const creation = Date.parse(record.dateCreation);
  const cloture = record.dateDernierStatut ? Date.parse(record.dateDernierStatut) : null;
  const apres = proches
    .filter((p) => p.point.horodatage && Date.parse(p.point.horodatage) >= creation)
    .sort((a, b) => Date.parse(a.point.horodatage) - Date.parse(b.point.horodatage));
  const premiere = apres[0] ?? null;
  const avantCloture = premiere && cloture != null ? Date.parse(premiere.point.horodatage) <= cloture : null;
  return compacter({
    rayonM: RAYON_M,
    interventionsDansLeRayon: proches.length,
    premiereApresSignalement: premiere
      ? {
          horodatage: premiere.point.horodatage,
          appareil: premiere.point.appareil,
          distanceM: Number(premiere.distance.toFixed(1)),
          joursApresSignalement: Number(((Date.parse(premiere.point.horodatage) - creation) / 86400000).toFixed(2)),
          avantClotureDeLaRequete: avantCloture,
        }
      : null,
    confiance: !premiere ? "aucune" : avantCloture ? (premiere.distance <= 15 ? "elevee" : "moyenne") : "faible",
  });
}

function pointsDepuisInterventions(interventions, cible) {
  // Les distances sont calculees en metres projetes ; la reprojection depuis des
  // coordonnees arrondies a 6 decimales coute moins de 0,1 m, negligeable ici.
  for (const i of interventions ?? []) {
    if (i.latitude == null || i.longitude == null) continue;
    const [x, y] = wgs84VersMtm8(i.latitude, i.longitude);
    cible.push({ x, y, horodatage: i.horodatage, appareil: i.appareil });
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const debut = Date.now();
  const etat = lireJson(FICHIER_VERIFICATION) ?? {};
  etat.fichiers ??= {};
  const rayonChange = etat.rayonAppariementM != null && Number(etat.rayonAppariementM) !== RAYON_M;
  if (rayonChange) {
    console.log(`Rayon modifie (${etat.rayonAppariementM} m -> ${RAYON_M} m) : les appariements sont recalcules.`);
  }
  console.log(`Rayon d'appariement : ${RAYON_M} m | annee courante : ${ANNEE_COURANTE}`);

  // 1. Colmatage : une ressource n'est retelechargee que si CKAN annonce une modification.
  console.log("\n== Travaux de colmatage mecanise ==");
  const tousLesPoints = [];
  const etatColmatage = {};
  const metaColmatage = [];
  const fichiersModifies = [];

  for (const source of SOURCES_COLMATAGE) {
    const fichier = `reparations-${source.annee}.json`;
    try {
      const { url, derniereModification } = await metaRessource(source.resourceId);
      const precedent = etat.reparations?.[source.annee];
      const snapshot = lireJson(fichier);
      const inchange =
        !TOUT && !FORCE_TELECHARGEMENT && snapshot && precedent?.ressourceDerniereModification === derniereModification;

      let contenu;
      if (inchange) {
        contenu = snapshot;
        console.log(`  ${source.annee} : inchange (${snapshot.nombre} interventions)`);
      } else {
        const { interventions, origine } = await telechargerColmatage(source, url);
        const dates = interventions.map((i) => i.horodatage).filter(Boolean).sort();
        contenu = {
          annee: source.annee,
          source: "Ville de Montreal - Travaux de colmatage mecanise de nid-de-poule des chaussees",
          datasetUrl: DATASET_COLMATAGE,
          ressourceUrl: url,
          ressourceDerniereModification: derniereModification,
          origineGeometrie: origine,
          nombre: interventions.length,
          premiereIntervention: dates[0] ?? null,
          derniereIntervention: dates[dates.length - 1] ?? null,
          appareils: [...new Set(interventions.map((i) => i.appareil).filter(Boolean))].sort(),
          avertissement:
            "Traces GPS des appareils de colmatage mecanise uniquement. Les reparations manuelles ne sont pas publiees.",
          interventions,
        };
        console.log(`  ${source.annee} : recharge (${interventions.length} interventions)`);
      }

      const ecriture = ecrireSiModifie(fichier, contenu, etat);
      if (ecriture.modifie) fichiersModifies.push(fichier);
      etat.fichiers[fichier] = { empreinte: ecriture.empreinte, contenuModifieLe: ecriture.contenuModifieLe };
      etatColmatage[source.annee] = {
        ressourceDerniereModification: contenu.ressourceDerniereModification,
        nombre: contenu.nombre,
        verifieLe: new Date().toISOString(),
      };
      metaColmatage.push({
        annee: source.annee,
        fichier,
        nombre: contenu.nombre,
        premiereIntervention: contenu.premiereIntervention,
        derniereIntervention: contenu.derniereIntervention,
        contenuModifieLe: ecriture.contenuModifieLe,
      });
      pointsDepuisInterventions(contenu.interventions, tousLesPoints);
    } catch (erreur) {
      console.error(`  ${source.annee} : ECHEC - ${erreur.message}`);
      etatColmatage[source.annee] = { echec: erreur.message, verifieLe: new Date().toISOString() };
      const snapshot = lireJson(fichier);
      metaColmatage.push({ annee: source.annee, fichier, nombre: snapshot?.nombre ?? 0, echec: erreur.message });
      pointsDepuisInterventions(snapshot?.interventions, tousLesPoints);
    }
  }
  const index = construireIndexSpatial(tousLesPoints, 100);
  console.log(`  total indexe : ${tousLesPoints.length} interventions`);

  // 2. Signalements 311 : sonde legere, puis rechargement uniquement si necessaire.
  console.log("\n== Signalements 311 ==");
  const parAnnee = new Map();
  const etatSignalements = {};
  const metaSignalements = [];

  for (const source of SOURCES_311) {
    for (const annee of source.annees) {
      const fichier = `signalements-${annee}.json`;
      const snapshot = lireJson(fichier);
      const precedent = etat.signalements?.[annee];
      let sonde = null;
      let raison = null;

      if (TOUT) raison = "option --tout";
      else if (ANNEES_FORCEES?.has(annee)) raison = "annee forcee";
      else if (!snapshot) raison = "snapshot absent";
      else if (annee === ANNEE_COURANTE) raison = "annee courante";

      if (!raison) {
        sonde = await sonderAnnee311(source.resourceId, annee);
        if (!precedent) raison = "aucune verification anterieure";
        else if (precedent.nombre !== sonde.nombre) raison = `nombre ${precedent.nombre} -> ${sonde.nombre}`;
        else if (precedent.creationMax !== sonde.creationMax) raison = "nouvelle date de creation";
        else if (precedent.statutMax !== sonde.statutMax) raison = "statut mis a jour";
      }

      let enregistrements;
      if (raison) {
        enregistrements = (await lireAnnee311(source.resourceId, annee)).map(normaliser);
        sonde = sonde ?? (await sonderAnnee311(source.resourceId, annee));
        console.log(`  ${annee} : recharge (${enregistrements.length}) - ${raison}`);
      } else {
        // Le bloc colmatage est toujours recalcule : il depend du corpus de reparations.
        enregistrements = snapshot.signalements.map(({ colmatage, ...reste }) => reste);
        console.log(`  ${annee} : inchange (${enregistrements.length})`);
      }

      parAnnee.set(annee, { enregistrements, source });
      etatSignalements[annee] = {
        ressourceId: source.resourceId,
        nombre: sonde?.nombre ?? enregistrements.length,
        creationMax: sonde?.creationMax ?? precedent?.creationMax ?? null,
        statutMax: sonde?.statutMax ?? precedent?.statutMax ?? null,
        verifieLe: new Date().toISOString(),
      };
    }
  }

  // 3. Recurrence par position. Les compteurs cumulatifs vivent uniquement dans
  // positions.json : les inscrire dans chaque signalement obligerait a reecrire les treize
  // millesimes des qu'un seul nouveau signalement arrive.
  const compteur = new Map();
  for (const [annee, { enregistrements }] of parAnnee) {
    for (const s of enregistrements) {
      if (!s.positionId) continue;
      let e = compteur.get(s.positionId);
      if (!e) compteur.set(s.positionId, (e = { total: 0, parAnnee: {}, premier: null, dernier: null }));
      e.total += 1;
      e.parAnnee[annee] = (e.parAnnee[annee] ?? 0) + 1;
      if (s.dateCreation) {
        if (!e.premier || s.dateCreation < e.premier) e.premier = s.dateCreation;
        if (!e.dernier || s.dateCreation > e.dernier) e.dernier = s.dateCreation;
      }
    }
  }

  for (const [annee, entree] of [...parAnnee.entries()].sort((a, b) => a[0] - b[0])) {
    const fichier = `signalements-${annee}.json`;
    const signalements = entree.enregistrements.map((s) => {
      const colmatage = apparierColmatage(s, index, tousLesPoints);
      return colmatage ? { ...s, colmatage } : s;
    });
    const ouverts = signalements.filter((s) => s.etat === "ouvert").length;
    const apparies = signalements.filter((s) => s.colmatage?.premiereApresSignalement).length;
    const ecriture = ecrireSiModifie(
      fichier,
      {
        annee,
        source: "Ville de Montreal - Demandes de services citoyennes (Requetes 311)",
        datasetUrl: DATASET_311,
        ressourceId: entree.source.resourceId,
        ressourceLibelle: entree.source.libelle,
        categorie: "Nid-de-poule",
        nombre: signalements.length,
        nombreOuverts: ouverts,
        nombreAvecColmatageApparie: apparies,
        rayonAppariementM: RAYON_M,
        avertissements: [
          "La position publiee est obfusquee : chaque requete est relocalisee au milieu du troncon le plus proche de plus de 45 m.",
          "positionId designe un troncon de rue, pas un trou unique. Les compteurs de recurrence sont dans positions.json.",
          "Les enregistrements NATURE = Information n'ont ni identifiant, ni statut, ni position.",
          "precisionLocalisation = bureau-arrondissement signale un repli administratif : la position n'est pas celle du nid-de-poule.",
          "colmatage est une correspondance spatio-temporelle plausible, pas une confirmation de reparation par la Ville.",
        ],
        signalements,
      },
      etat
    );
    if (ecriture.modifie) fichiersModifies.push(fichier);
    etat.fichiers[fichier] = { empreinte: ecriture.empreinte, contenuModifieLe: ecriture.contenuModifieLe };
    metaSignalements.push({
      annee,
      fichier,
      nombre: signalements.length,
      nombreOuverts: ouverts,
      nombreAvecColmatageApparie: apparies,
      contenuModifieLe: ecriture.contenuModifieLe,
    });
  }

  const positions = [...compteur.entries()]
    .map(([positionId, e]) => {
      const [latitude, longitude] = positionId.split(",").map(Number);
      return {
        positionId,
        latitude,
        longitude,
        signalementsTotal: e.total,
        signalementsParAnnee: e.parAnnee,
        premierSignalement: e.premier,
        dernierSignalement: e.dernier,
      };
    })
    .sort((a, b) => b.signalementsTotal - a.signalementsTotal || a.positionId.localeCompare(b.positionId));
  const ecriturePositions = ecrireSiModifie(
    "positions.json",
    {
      source: "Agregation locale des signalements 311 de categorie Nid-de-poule",
      definition:
        "Une position regroupe les signalements partageant exactement la meme coordonnee obfusquee, c'est-a-dire le meme troncon de rue.",
      jointure: "positions[].positionId correspond a signalements[].positionId des fichiers signalements-<annee>.json.",
      nombrePositions: positions.length,
      positions,
    },
    etat
  );
  if (ecriturePositions.modifie) fichiersModifies.push("positions.json");
  etat.fichiers["positions.json"] = {
    empreinte: ecriturePositions.empreinte,
    contenuModifieLe: ecriturePositions.contenuModifieLe,
  };

  const ecritureIndex = ecrireSiModifie(
    "index.json",
    {
      genere: "tools/build-nids-de-poule-snapshot.mjs",
      rayonAppariementM: RAYON_M,
      sources: [
        { nom: "Demandes de services citoyennes (Requetes 311)", url: DATASET_311, frequence: "quotidienne, vers 12:05 UTC" },
        { nom: "Travaux de colmatage mecanise de nid-de-poule des chaussees", url: DATASET_COLMATAGE, frequence: "bilan annuel" },
      ],
      signalements: metaSignalements,
      reparations: metaColmatage,
      limitesConnues: [
        "Couverture limitee a l'ile de Montreal : aucune autre municipalite du Grand Montreal ne publie ses nids-de-poule.",
        "Les reparations publiees ne couvrent que le colmatage mecanise et s'arretent a l'annee bilan la plus recente.",
        "Aucune source ne publie les reparations planifiees : la date d'une reparation future ne peut pas etre deduite.",
        "L'annee 2016 est publiee a l'identique dans deux ressources ; elle n'est lue que depuis la ressource 2014-2016.",
        "La ressource f180b33d (archives 2017-2018) est annoncee active mais sa table est absente du datastore.",
      ],
    },
    etat
  );
  if (ecritureIndex.modifie) fichiersModifies.push("index.json");
  etat.fichiers["index.json"] = {
    empreinte: ecritureIndex.empreinte,
    contenuModifieLe: ecritureIndex.contenuModifieLe,
  };

  writeFileSync(
    path.join(OUT_DIR, FICHIER_VERIFICATION),
    JSON.stringify(
      {
        role: "Seul fichier du dossier reecrit a chaque execution. Les autres ne changent que si leur contenu change.",
        derniereVerification: new Date().toISOString(),
        rayonAppariementM: RAYON_M,
        anneeCourante: ANNEE_COURANTE,
        fichiersModifiesCetteExecution: [...new Set(fichiersModifies)].sort(),
        signalements: etatSignalements,
        reparations: etatColmatage,
        fichiers: Object.fromEntries(Object.entries(etat.fichiers).sort(([a], [b]) => a.localeCompare(b))),
      },
      null,
      2
    )
  );

  await construireCarteLocale();
  console.log(`\n  positions.json : ${positions.length} positions${ecriturePositions.modifie ? " (reecrit)" : " (inchange)"}`);
  console.log(`  fichiers modifies : ${fichiersModifies.length ? [...new Set(fichiersModifies)].sort().join(", ") : "aucun"}`);
  console.log(`\nTermine en ${((Date.now() - debut) / 1000).toFixed(1)} s -> ${path.relative(ROOT, OUT_DIR)}/`);
}

const execution = args.includes("--carte-locale") ? Promise.resolve().then(construireCarteLocale) : main();
execution.catch((erreur) => {
  console.error("Echec :", erreur.message);
  process.exitCode = 1;
});
