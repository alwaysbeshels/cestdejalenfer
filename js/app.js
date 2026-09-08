const CATEGORY_META = {
  municipal: { label: () => t("category.municipal") },
  private: { label: () => t("category.private") },
  linkedCity: { label: () => t("category.linkedCity") },
  commercial: { label: () => t("category.commercial") },
  event: { label: () => t("category.event") },
  regional: { label: () => t("category.regional") },
  q511: { label: () => t("category.q511") },
  laval: { label: () => t("category.laval") },
  longueuil: { label: () => t("category.longueuil") },
  strike: { label: () => t("category.strike") }
};

const SEVERITY_META = {
  critical: { label: () => t("severity.critical"), color: "#ff1744", width: 9, opacity: 0.98 },
  major: { label: () => t("severity.major"), color: "#ff8c00", width: 7, opacity: 0.96 },
  moderate: { label: () => t("severity.moderate"), color: "#ffe600", width: 6, opacity: 0.94 },
  parking: { label: () => t("severity.parking"), color: "#ff2bd6", width: 5, opacity: 0.92 },
  minor: { label: () => t("severity.minor"), color: "#00e676", width: 4, opacity: 0.78 }
};

function roadTypeFromText(value) {
  const text = String(value || "").toLowerCase();
  if (/\btunnel\b/.test(text)) return "tunnel";
  if (/\bpont\b|\bbridge\b|\bviaduc\b/.test(text)) return "bridge";
  if (/\bautoroute\b|\bhighway\b|\ba[- ]?\d{1,3}\b/.test(text)) return "highway";
  if (/\bchemin\b|\bch\.\s/.test(text)) return "road";
  if (/\broute\b|\br[- ]?\d{1,3}\b/.test(text)) return "route";
  if (/\brues?\b|\bstreets?\b|\bavenues?\b|\bboulevards?\b/.test(text)) return "street";
  return null;
}

function closureImpactLabel(closure) {
  if (closure.severity !== "critical") {
    return (SEVERITY_META[closure.severity] ?? SEVERITY_META.major).label();
  }

  const type = closure.roadType || roadTypeFromText(`${closure.title || ""} ${closure.streets || ""}`);
  if (type === "tunnel") return t("severity.closedTunnel");
  if (type === "bridge") return t("severity.closedBridge");
  if (type === "highway") return t("severity.closedHighway");
  if (type === "road") return t("severity.closedRoad");
  if (type === "route") return t("severity.closedRoute");
  if (type === "street") return t("severity.closedStreet");
  return t("severity.critical");
}

// Phase 2 Validation: Tous les endpoints ci-dessous ont été testés et validés HTTP 200
const LIVE_SOURCES = {
  // ✓ Phase 2 Validé - WFS Montreal (entraves ponctuelles)
  montreal: "https://api.montreal.ca/api/it-platforms/geomatic/wfs-maps/montreal/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=montreal:entraves-ponctuelles&outputFormat=application/json&CQL_FILTER=affectedArea%20like%20%27%25street%25%27",
  // ✓ Phase 2 Validé - WFS Montreal (restrictions UCI 2026)
  uciRestrictions: "https://api.montreal.ca/api/it-platforms/geomatic/wfs-feature/v1/ls-montreal/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ls-montreal:uci-2026-vdm-restrictions-circulation_v2&outputFormat=application/json",
  // ✓ Phase 2 Validé - ArcGIS Longueuil (points d'entraves)
  longueuilPoints: "https://geomatique.longueuil.quebec/public/rest/services/Communication/Gestion_des_entraves_Diffusion/FeatureServer/0/query?f=geojson&where=1%3D1&outFields=*&outSR=4326",
  // ✓ Phase 2 Validé - ArcGIS Longueuil (surfaces d'entraves)
  longueuilSurfaces: "https://geomatique.longueuil.quebec/public/rest/services/Communication/Gestion_des_entraves_Diffusion/FeatureServer/1/query?f=geojson&where=1%3D1&outFields=*&outSR=4326",
  // ✓ Phase 2 Validé - ArcGIS Laval (3 couches: fermetures, restrictions, travaux prévus)
  lavalMapService: "https://gis.laval.ca/arcgis/rest/services/ing/Obstruction_14_jours/MapServer",
  // Repentigny Open511 events with official road geometry
  repentignyOpen511: "https://info-travaux.ville.repentigny.qc.ca/api/events/",
  dorvalEntraves: "https://services2.arcgis.com/UfBk83iw7IIXzPRW/arcgis/rest/services/Entraves2410_Vue/FeatureServer/34",
  boisbriandWorks: "https://services3.arcgis.com/x2965icj4V1l01th/arcgis/rest/services/Info_travaux_2026/FeatureServer/2",
  saintEustacheLines: "https://services2.arcgis.com/wvG4T9QXold5hjxu/arcgis/rest/services/Entraves_routieres/FeatureServer/0",
  saintEustachePoints: "https://services2.arcgis.com/wvG4T9QXold5hjxu/arcgis/rest/services/Entraves_routieres_ponctuelles/FeatureServer/0",
  chateauguayWorks: "https://services5.arcgis.com/dJ7Fm5SAXQN3Do5M/arcgis/rest/services/Carte_des_travaux_en_cours_WFL1/FeatureServer/0",
  assomptionIncidents: "https://services9.arcgis.com/hcaJWZHFtN5aFHXa/arcgis/rest/services/survey123_35de01d903b74a05a2e2396b74f2cb14_results/FeatureServer/0",
  terrebonneEntraveLines: "https://services3.arcgis.com/kKl4g5Ltuw8RvFq1/arcgis/rest/services/entrave_vue_publique/FeatureServer/1",
  terrebonneEntravePoints: "https://services3.arcgis.com/kKl4g5Ltuw8RvFq1/arcgis/rest/services/entrave_vue_publique/FeatureServer/0",
  montRoyalSnapshot: "data/mont-royal-snapshot.json",
  beaconsfieldSnapshot: "data/beaconsfield-snapshot.json",
  montrealPedestrianSnapshot: "data/montreal-pedestrian-snapshot.json",
  montSaintHilaireWorks: "https://services5.arcgis.com/RupmNFqbsv0VX4xY/arcgis/rest/services/INFO_TRAVAUX_2026_Pour_diffusion_4Septembre2026_WFL1/FeatureServer",
  // ✓ Phase 2 Validé - WFS MTMD Quebec 511 (travaux routiers provinciaux)
  quebec511: "https://ws.mapserver.transports.gouv.qc.ca/swtq?service=wfs&version=2.0.0&request=getfeature&typename=ms:chantiers_mtmdet&srsname=EPSG:4326&outputformat=geojson",
  // WFS MTMD Quebec 511 - evenements (fermetures, incidents, restrictions)
  quebec511Events: "https://ws.mapserver.transports.gouv.qc.ca/swtq?service=wfs&version=2.0.0&request=getfeature&typename=ms:evenements&srsname=EPSG:4326&outputformat=geojson"
};

// Phase 2 Validé - 3 couches ArcGIS Laval confirmées
const LAVAL_LAYERS = [
  { id: 0, labelKey: "laval.closed", severity: "critical" },  // Fermetures complètes
  { id: 2, labelKey: "laval.partial", severity: "major" },    // Restrictions partielles
  { id: 3, labelKey: "laval.planned", severity: "moderate" }   // Travaux prévus
];

const LAVAL_OFFICIAL_BOUNDS = {
  west: -73.87869698387716,
  south: 45.521186071730654,
  east: -73.53037009894052,
  north: 45.69758406388658
};

const GREATER_MONTREAL_BOUNDS = {
  west: -74.8,
  south: 45.0,
  east: -72.8,
  north: 46.3
};

// Phase 2: Fallback CKAN - accès aux données si endpoints WFS/ArcGIS indisponibles
const LIVE_SOURCES_BACKUP = {
  // Backup: CKAN Montreal - Accès aux données de travaux via API publique
  ckanMontreal: {
    endpoint: "https://donnees.montreal.ca/api/3/action/package_search",
    params: {
      q: "travaux|routes|entraves",
      fq: "groups:transport",
      format: "json",
      rows: 100
    },
    description: "CKAN Montreal - Portail de données officielles travaux routiers"
  },
  
  // Backup: Données Québec - Laval datasets
  ckanLaval: {
    endpoint: "https://www.donneesquebec.ca/api/3/action/package_search",
    params: {
      q: "travaux|laval",
      fq: "organization:ville-de-laval",
      format: "json",
      rows: 100
    },
    description: "Données Québec - Datasets Laval (Fallback)"
  },
  
  // Backup: Données Québec provincial - Tous les travaux
  ckanQuebec: {
    endpoint: "https://www.donneesquebec.ca/api/3/action/package_search",
    params: {
      q: "travaux|routes|entraves|circulation",
      format: "json",
      rows: 100
    },
    description: "Données Québec - Tous les travaux provinciaux (Fallback global)"
  }
};

const REGIONAL_MAJOR_CLOSURES = [
  {
    id: "regional-a25-tunnel-lafontaine-sud-weekend",
    title: "Fermeture complète - A-25 / tunnel Louis-Hippolyte-La Fontaine sud",
    category: "regional",
    responsible: "Mobilité Montréal / MTMD",
    borough: "Montreal - Longueuil",
    startDate: "2026-09-04",
    endDate: "2026-09-08",
    impact: "Fermeture complète du tunnel vers la Rive-Sud; détour via pont Jacques-Cartier et réseau municipal.",
    trafficLabel: "Fermeture complète",
    severity: "critical",
    direction: "Direction sud vers Longueuil. Fermetures de nuit et fermeture prolongee de vendredi 23 h à mardi 5 h selon Mobilité Montréal.",
    streets: "A-25 / tunnel Louis-Hippolyte-La Fontaine, entre Montreal et R-132",
    source: "Mobilité Montréal - fermetures majeures",
    sourceUrl: "https://mobilitemontreal.gouv.qc.ca/fermetures-majeures/",
    periods: ["night"],
    routeEndpoints: [[-73.5228, 45.5934], [-73.4883, 45.5456]],
    geometry: { type: "LineString", coordinates: [[-73.521, 45.590], [-73.512, 45.575], [-73.498, 45.556], [-73.488, 45.544]] },
    point: [-73.502, 45.562]
  },
  {
    id: "regional-pont-victoria-route-112",
    title: "Pont Victoria / R-112 - travée est fermée",
    category: "regional",
    responsible: "CN / Mobilité Montréal",
    borough: "Montreal - Saint-Lambert",
    startDate: "2026-09-04",
    endDate: "2026-09-10",
    impact: "Circulation sur une voie unique avec direction variable selon l'heure; prévoir retards importants.",
    trafficLabel: "Pont a voie unique",
    severity: "major",
    direction: "Vers Montreal entre minuit et midi; vers Rive-Sud entre midi et minuit après mardi 5 h.",
    streets: "Pont Victoria / route 112",
    source: "Mobilité Montréal - fermetures majeures",
    sourceUrl: "https://mobilitemontreal.gouv.qc.ca/fermetures-majeures/",
    periods: ["day", "night"],
    routeEndpoints: [[-73.5435, 45.4942], [-73.5090, 45.4654]],
    geometry: { type: "LineString", coordinates: [[-73.537, 45.492], [-73.526, 45.482], [-73.515, 45.472]] },
    point: [-73.526, 45.482]
  },
  {
    id: "regional-r138-mercier-clement",
    title: "R-138 / secteur pont Honore-Mercier - sorties et accès Clement fermes",
    category: "regional",
    responsible: "Ville de Montreal / Mobilité Montréal",
    borough: "LaSalle",
    startDate: "2026-09-04",
    endDate: "2026-09-08",
    impact: "Fermeture des sorties et accès vers ou depuis la rue Clement; secteur a éviter et détours par Airlie, Newman, Lafleur et Saint-Patrick.",
    trafficLabel: "Sorties et accès fermes",
    severity: "critical",
    direction: "R-138 est et ouest, accès vers le pont Honore-Mercier touches.",
    streets: "Route 138, secteur rue Clement / pont Honore-Mercier",
    source: "Mobilité Montréal - fermetures majeures",
    sourceUrl: "https://mobilitemontreal.gouv.qc.ca/fermetures-majeures/",
    periods: ["day", "night"],
    routeEndpoints: [[-73.6527, 45.4250], [-73.5922, 45.4448]],
    geometry: { type: "LineString", coordinates: [[-73.641, 45.430], [-73.630, 45.430], [-73.615, 45.433], [-73.602, 45.440]] },
    point: [-73.622, 45.432]
  },
  {
    id: "regional-rue-bridge-sud",
    title: "Rue Bridge - fermeture complète direction sud",
    category: "regional",
    responsible: "Hydro-Quebec / Mobilité Montréal",
    borough: "Le Sud-Ouest",
    startDate: "2026-09-05",
    endDate: "2026-09-07",
    impact: "Direction sud fermée entre des Irlandais et Mill; direction nord partiellement ouverte avec 1 voie sur 2.",
    trafficLabel: "Direction fermée",
    severity: "critical",
    direction: "Direction sud fermée; direction nord partiellement ouverte.",
    streets: "Rue Bridge, entre des Irlandais et Mill",
    source: "Mobilité Montréal - fermetures majeures",
    sourceUrl: "https://mobilitemontreal.gouv.qc.ca/fermetures-majeures/",
    periods: ["day", "night"],
    routeEndpoints: [[-73.5529, 45.4971], [-73.5481, 45.4798]],
    geometry: { type: "LineString", coordinates: [[-73.552, 45.492], [-73.550, 45.486], [-73.548, 45.481]] },
    point: [-73.550, 45.486]
  },
  {
    id: "regional-qc511-a19-north-montreal-laval",
    title: "A-19 direction nord - voies fermées vers Laval",
    category: "q511",
    responsible: "Quebec 511 / MTMD",
    borough: "Montreal - Laval",
    startDate: "2026-09-04",
    endDate: "2026-09-04",
    impact: "Entrave routière signalée sur Quebec 511 avec voies fermées sur l'A-19 en direction nord en sortant de Montreal.",
    trafficLabel: "Voies fermées",
    severity: "major",
    direction: "Direction nord, de Montreal vers Laval. Heures et configuration exacte à confirmer dans Quebec 511.",
    streets: "Autoroute 19 / pont Papineau-Leblanc, direction nord",
    source: "Quebec 511 - carte interactive",
    sourceUrl: "https://www.quebec511.info/fr/Carte/Default.aspx",
    periods: ["day", "night"],
    geometry: {
      type: "LineString",
      coordinates: [
        [-73.658546, 45.570352],
        [-73.659264, 45.570494],
        [-73.660388, 45.570963],
        [-73.660388, 45.570963],
        [-73.661548, 45.571515],
        [-73.664318, 45.573735],
        [-73.665184, 45.574543],
        [-73.666248, 45.575518],
        [-73.666752, 45.575974],
        [-73.667693, 45.576831]
      ]
    },
    point: [-73.665184, 45.574543]
  },
  {
    id: "regional-qc511-a19-south-laval-montreal",
    title: "A-19 direction sud - voies fermées vers Montreal",
    category: "q511",
    responsible: "Quebec 511 / MTMD",
    borough: "Laval - Montreal",
    startDate: "2026-09-04",
    endDate: "2026-09-04",
    impact: "Entrave routière signalée sur Quebec 511 avec voies fermées sur l'A-19 en direction sud vers Montreal.",
    trafficLabel: "Voies fermées",
    severity: "major",
    direction: "Direction sud, de Laval vers Montreal. Heures et configuration exacte à confirmer dans Quebec 511.",
    streets: "Autoroute 19 / pont Papineau-Leblanc, direction sud",
    source: "Quebec 511 - carte interactive",
    sourceUrl: "https://www.quebec511.info/fr/Carte/Default.aspx",
    periods: ["day", "night"],
    geometry: {
      type: "LineString",
      coordinates: [
        [-73.665039, 45.574621],
        [-73.664318, 45.573735],
        [-73.661548, 45.571515],
        [-73.660388, 45.570963],
        [-73.659264, 45.570494],
        [-73.658546, 45.570352]
      ]
    },
    point: [-73.661548, 45.571515]
  },
  {
    id: "regional-qc511-a520-ouest-romeo-vachon",
    title: "A-520 ouest - accès Romeo-Vachon ferme",
    category: "q511",
    responsible: "Quebec 511 / MTMD",
    borough: "Dorval",
    startDate: "2026-09-04",
    endDate: "2026-11-11",
    impact: "Fermeture de l'accès en provenance du boulevard Romeo-Vachon en direction sud vers l'A-520 ouest; détour via A-20 est et demi-tour à la sortie 58.",
    trafficLabel: "Accès ferme",
    severity: "critical",
    direction: "A-520 ouest, accès depuis boulevard Romeo-Vachon direction sud.",
    streets: "Autoroute 520 ouest / boulevard Romeo-Vachon",
    source: "Quebec 511 / Mobilité Montréal - fermetures à prévoir",
    sourceUrl: "https://www.quebec511.info/fr/Carte/Default.aspx",
    periods: ["day", "night"],
    routeEndpoints: [[-73.7367, 45.4635], [-73.7528, 45.4625]],
    geometry: { type: "LineString", coordinates: [[-73.7367, 45.4635], [-73.7528, 45.4625]] },
    point: [-73.744, 45.463]
  }
];

const SEASONAL_PEDESTRIAN_STREETS = [
  {
    "id": "pedestrian-mont-royal-saint-laurent-resther",
    "title": "Avenue du Mont-Royal piétonne - Saint-Laurent à Resther",
    "category": "commercial",
    "responsible": "Arrondissement du Plateau-Mont-Royal",
    "borough": "Le Plateau-Mont-Royal",
    "startDate": "2026-05-28",
    "endDate": "2026-10-12",
    "impact": "Rue réservée aux piétons; circulation automobile fermée durant la piétonnisation estivale.",
    "trafficLabel": "Rue piétonne saisonnière",
    "severity": "critical",
    "direction": "Fermée à la circulation automobile dans les deux directions.",
    "streets": "Avenue du Mont-Royal, entre le boulevard Saint-Laurent et la rue Resther",
    "source": "Ville de Montréal - Piétonnisation de l'avenue du Mont-Royal",
    "sourceUrl": "https://montreal.ca/lieux/avenue-du-mont-royal",
    "periods": [
      "day",
      "night"
    ],
    "routeEndpoints": [
      [
        -73.5901,
        45.5243
      ],
      [
        -73.5791,
        45.5275
      ]
    ],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          -73.590329,
          45.524402
        ],
        [
          -73.590104,
          45.52465
        ],
        [
          -73.590039,
          45.524697
        ],
        [
          -73.589653,
          45.524522
        ],
        [
          -73.589625,
          45.52451
        ],
        [
          -73.589561,
          45.52448
        ],
        [
          -73.589436,
          45.524423
        ],
        [
          -73.588835,
          45.52509
        ],
        [
          -73.58843,
          45.525545
        ],
        [
          -73.588395,
          45.525582
        ],
        [
          -73.588196,
          45.525801
        ],
        [
          -73.587929,
          45.526099
        ],
        [
          -73.587908,
          45.526124
        ],
        [
          -73.587892,
          45.526143
        ],
        [
          -73.587831,
          45.526212
        ],
        [
          -73.587781,
          45.526267
        ],
        [
          -73.587763,
          45.526287
        ],
        [
          -73.587425,
          45.526666
        ],
        [
          -73.587374,
          45.526722
        ],
        [
          -73.587328,
          45.526773
        ],
        [
          -73.586869,
          45.527287
        ],
        [
          -73.586847,
          45.527311
        ],
        [
          -73.58679,
          45.527375
        ],
        [
          -73.586748,
          45.52742
        ],
        [
          -73.586477,
          45.527709
        ],
        [
          -73.586456,
          45.527731
        ],
        [
          -73.586422,
          45.527766
        ],
        [
          -73.586391,
          45.527799
        ],
        [
          -73.586089,
          45.528123
        ],
        [
          -73.586065,
          45.528148
        ],
        [
          -73.58603,
          45.528187
        ],
        [
          -73.585995,
          45.528223
        ],
        [
          -73.585612,
          45.528631
        ],
        [
          -73.585581,
          45.528662
        ],
        [
          -73.585554,
          45.528691
        ],
        [
          -73.585088,
          45.529187
        ],
        [
          -73.585074,
          45.529202
        ],
        [
          -73.585032,
          45.529247
        ],
        [
          -73.584996,
          45.529286
        ],
        [
          -73.584761,
          45.529538
        ],
        [
          -73.584721,
          45.529581
        ],
        [
          -73.584682,
          45.529622
        ],
        [
          -73.584179,
          45.530153
        ],
        [
          -73.584161,
          45.530171
        ],
        [
          -73.584143,
          45.53019
        ],
        [
          -73.58411,
          45.530226
        ],
        [
          -73.584044,
          45.530196
        ],
        [
          -73.583692,
          45.530037
        ],
        [
          -73.583123,
          45.529781
        ],
        [
          -73.582794,
          45.529631
        ],
        [
          -73.582743,
          45.529607
        ],
        [
          -73.58268,
          45.529579
        ],
        [
          -73.582602,
          45.529544
        ],
        [
          -73.582209,
          45.529365
        ],
        [
          -73.579646,
          45.528204
        ],
        [
          -73.579329,
          45.528061
        ],
        [
          -73.579284,
          45.528041
        ],
        [
          -73.579208,
          45.528007
        ],
        [
          -73.579127,
          45.527971
        ],
        [
          -73.57873,
          45.527796
        ],
        [
          -73.578765,
          45.527757
        ],
        [
          -73.578782,
          45.527738
        ],
        [
          -73.579028,
          45.527471
        ],
        [
          -73.579031,
          45.527468
        ]
      ]
    },
    "point": [
      -73.5846,
      45.5259
    ]
  },
  {
    "id": "pedestrian-mont-royal-resther-lorimier",
    "title": "Avenue du Mont-Royal piétonne - Resther à De Lorimier",
    "category": "commercial",
    "responsible": "Arrondissement du Plateau-Mont-Royal",
    "borough": "Le Plateau-Mont-Royal",
    "startDate": "2026-05-28",
    "endDate": "2026-09-07",
    "impact": "Rue réservée aux piétons; circulation automobile fermée durant la piétonnisation estivale.",
    "trafficLabel": "Rue piétonne saisonnière",
    "severity": "critical",
    "direction": "Fermée à la circulation automobile dans les deux directions.",
    "streets": "Avenue du Mont-Royal, entre la rue Resther et l'avenue De Lorimier",
    "source": "Ville de Montréal - Piétonnisation de l'avenue du Mont-Royal",
    "sourceUrl": "https://montreal.ca/lieux/avenue-du-mont-royal",
    "periods": [
      "day",
      "night"
    ],
    "routeEndpoints": [
      [
        -73.5791,
        45.5275
      ],
      [
        -73.5686,
        45.5307
      ]
    ],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          -73.579031,
          45.527468
        ],
        [
          -73.579028,
          45.527471
        ],
        [
          -73.578782,
          45.527738
        ],
        [
          -73.578765,
          45.527757
        ],
        [
          -73.57873,
          45.527796
        ],
        [
          -73.577321,
          45.527175
        ],
        [
          -73.576967,
          45.52701
        ],
        [
          -73.576924,
          45.526991
        ],
        [
          -73.576852,
          45.526959
        ],
        [
          -73.576786,
          45.526929
        ],
        [
          -73.576401,
          45.526755
        ],
        [
          -73.574894,
          45.526071
        ],
        [
          -73.574581,
          45.525933
        ],
        [
          -73.574511,
          45.525896
        ],
        [
          -73.574454,
          45.525856
        ],
        [
          -73.574421,
          45.525825
        ],
        [
          -73.574384,
          45.525769
        ],
        [
          -73.57437,
          45.525745
        ],
        [
          -73.574357,
          45.525721
        ],
        [
          -73.57431,
          45.52564
        ],
        [
          -73.57424,
          45.525663
        ],
        [
          -73.574202,
          45.525675
        ],
        [
          -73.574135,
          45.525702
        ],
        [
          -73.574051,
          45.525744
        ],
        [
          -73.573983,
          45.5258
        ],
        [
          -73.57355,
          45.526289
        ],
        [
          -73.573532,
          45.526309
        ],
        [
          -73.573465,
          45.526384
        ],
        [
          -73.573423,
          45.526429
        ],
        [
          -73.573399,
          45.526454
        ],
        [
          -73.573378,
          45.526474
        ],
        [
          -73.573009,
          45.526876
        ],
        [
          -73.572995,
          45.52689
        ],
        [
          -73.572971,
          45.526914
        ],
        [
          -73.572933,
          45.526954
        ],
        [
          -73.572884,
          45.526999
        ],
        [
          -73.572864,
          45.527021
        ],
        [
          -73.572459,
          45.527449
        ],
        [
          -73.572417,
          45.527494
        ],
        [
          -73.572124,
          45.527787
        ],
        [
          -73.572099,
          45.527816
        ],
        [
          -73.572046,
          45.52787
        ],
        [
          -73.571992,
          45.527923
        ],
        [
          -73.571971,
          45.527944
        ],
        [
          -73.571435,
          45.5285
        ],
        [
          -73.571399,
          45.528536
        ],
        [
          -73.570844,
          45.529117
        ],
        [
          -73.570807,
          45.529153
        ],
        [
          -73.570248,
          45.529717
        ],
        [
          -73.570227,
          45.529739
        ],
        [
          -73.570194,
          45.529778
        ],
        [
          -73.57017,
          45.529806
        ],
        [
          -73.570116,
          45.529864
        ],
        [
          -73.570075,
          45.529916
        ],
        [
          -73.569583,
          45.530439
        ],
        [
          -73.569548,
          45.530481
        ],
        [
          -73.569492,
          45.530543
        ],
        [
          -73.569359,
          45.530481
        ],
        [
          -73.569323,
          45.530464
        ],
        [
          -73.569257,
          45.530433
        ],
        [
          -73.568123,
          45.529899
        ],
        [
          -73.568057,
          45.529982
        ],
        [
          -73.567803,
          45.530301
        ],
        [
          -73.56862,
          45.530679
        ]
      ]
    },
    "point": [
      -73.5738,
      45.5291
    ]
  },
  {
    "id": "pedestrian-wellington-verdun",
    "title": "Rue Wellington piétonne",
    "category": "commercial",
    "responsible": "Arrondissement de Verdun / SDC Wellington",
    "borough": "Verdun",
    "startDate": "2026-06-01",
    "endDate": "2026-09-21",
    "impact": "Rue réservée aux piétons; circulation automobile fermée pour la saison estivale.",
    "trafficLabel": "Rue piétonne saisonnière",
    "severity": "critical",
    "direction": "Fermée à la circulation automobile dans les deux directions.",
    "streets": "Rue Wellington, entre les rues Regina et de la 6e Avenue",
    "source": "Ville de Montréal - Rues piétonnes saisonnières",
    "sourceUrl": "https://montreal.ca/lieux?mtl_content.lieux.installation.code=RUPIE",
    "periods": [
      "day",
      "night"
    ],
    "routeEndpoints": [
      [
        -73.5712,
        45.4565
      ],
      [
        -73.5634,
        45.4633
      ]
    ],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          -73.571194,
          45.456567
        ],
        [
          -73.571424,
          45.456577
        ],
        [
          -73.571432,
          45.456512
        ],
        [
          -73.571458,
          45.456288
        ],
        [
          -73.571463,
          45.456244
        ],
        [
          -73.57126,
          45.456237
        ],
        [
          -73.57107,
          45.456228
        ],
        [
          -73.569716,
          45.456169
        ],
        [
          -73.568104,
          45.456098
        ],
        [
          -73.567794,
          45.456082
        ],
        [
          -73.567762,
          45.45608
        ],
        [
          -73.567709,
          45.456078
        ],
        [
          -73.567614,
          45.456074
        ],
        [
          -73.567527,
          45.456069
        ],
        [
          -73.567124,
          45.456052
        ],
        [
          -73.565108,
          45.455963
        ],
        [
          -73.564822,
          45.455949
        ],
        [
          -73.564379,
          45.455926
        ],
        [
          -73.56434,
          45.455923
        ],
        [
          -73.564245,
          45.455915
        ],
        [
          -73.564137,
          45.456062
        ],
        [
          -73.564068,
          45.45616
        ],
        [
          -73.564008,
          45.456255
        ],
        [
          -73.563941,
          45.456393
        ],
        [
          -73.563923,
          45.45643
        ],
        [
          -73.563881,
          45.456521
        ],
        [
          -73.563854,
          45.45658
        ],
        [
          -73.5637,
          45.456912
        ],
        [
          -73.563625,
          45.457087
        ],
        [
          -73.563477,
          45.457415
        ],
        [
          -73.563445,
          45.457502
        ],
        [
          -73.563423,
          45.457578
        ],
        [
          -73.563412,
          45.457669
        ],
        [
          -73.563352,
          45.458159
        ],
        [
          -73.563348,
          45.458188
        ],
        [
          -73.56334,
          45.458245
        ],
        [
          -73.563335,
          45.458301
        ],
        [
          -73.563332,
          45.458341
        ],
        [
          -73.563303,
          45.458606
        ],
        [
          -73.563297,
          45.458663
        ],
        [
          -73.563258,
          45.459061
        ],
        [
          -73.563186,
          45.459729
        ],
        [
          -73.563176,
          45.459799
        ],
        [
          -73.563158,
          45.459938
        ],
        [
          -73.563118,
          45.460281
        ],
        [
          -73.563067,
          45.460686
        ],
        [
          -73.563056,
          45.460774
        ],
        [
          -73.563051,
          45.460822
        ],
        [
          -73.563033,
          45.460999
        ],
        [
          -73.562969,
          45.461638
        ],
        [
          -73.562967,
          45.461657
        ],
        [
          -73.562974,
          45.461733
        ],
        [
          -73.563001,
          45.461824
        ],
        [
          -73.563019,
          45.461863
        ],
        [
          -73.563178,
          45.462151
        ],
        [
          -73.563381,
          45.462464
        ],
        [
          -73.563405,
          45.462501
        ],
        [
          -73.563475,
          45.462618
        ],
        [
          -73.563543,
          45.462698
        ],
        [
          -73.563596,
          45.462776
        ],
        [
          -73.563819,
          45.463094
        ],
        [
          -73.563854,
          45.463143
        ]
      ]
    },
    "point": [
      -73.5673,
      45.4599
    ]
  },
  {
    "id": "pedestrian-sainte-catherine-quartier-spectacles",
    "title": "Rue Sainte-Catherine Est piétonne - Quartier des spectacles",
    "category": "commercial",
    "responsible": "Quartier des spectacles / Ville de Montréal",
    "borough": "Ville-Marie",
    "startDate": "2026-05-15",
    "endDate": "2026-10-15",
    "impact": "Secteur piétonnier saisonnier; circulation automobile fermée selon la programmation du Quartier des spectacles.",
    "trafficLabel": "Rue piétonne saisonnière",
    "severity": "critical",
    "direction": "Fermée à la circulation automobile dans les deux directions.",
    "streets": "Rue Sainte-Catherine Est, entre les rues De Bleury et Saint-Laurent",
    "source": "Quartier des spectacles - Rues et espaces publics",
    "sourceUrl": "https://www.quartierdesspectacles.com/",
    "periods": [
      "day",
      "night"
    ],
    "routeEndpoints": [
      [
        -73.5664,
        45.5088
      ],
      [
        -73.5595,
        45.5099
      ]
    ],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          -73.566065,
          45.508989
        ],
        [
          -73.566065,
          45.508989
        ],
        [
          -73.565995,
          45.509004
        ],
        [
          -73.565951,
          45.509049
        ],
        [
          -73.565857,
          45.509148
        ],
        [
          -73.565839,
          45.509167
        ],
        [
          -73.565801,
          45.509208
        ],
        [
          -73.56562,
          45.509122
        ],
        [
          -73.565353,
          45.508993
        ],
        [
          -73.564923,
          45.508786
        ],
        [
          -73.564887,
          45.508767
        ],
        [
          -73.564811,
          45.508731
        ],
        [
          -73.564724,
          45.50869
        ],
        [
          -73.563869,
          45.508303
        ],
        [
          -73.563803,
          45.508273
        ],
        [
          -73.56375,
          45.508249
        ],
        [
          -73.563602,
          45.508181
        ],
        [
          -73.562764,
          45.507801
        ],
        [
          -73.562737,
          45.507789
        ],
        [
          -73.562629,
          45.50774
        ],
        [
          -73.562494,
          45.507671
        ],
        [
          -73.562454,
          45.507722
        ],
        [
          -73.562043,
          45.508177
        ],
        [
          -73.561827,
          45.508394
        ],
        [
          -73.561562,
          45.508707
        ],
        [
          -73.561542,
          45.508733
        ],
        [
          -73.561497,
          45.508794
        ],
        [
          -73.561448,
          45.508855
        ],
        [
          -73.561093,
          45.509264
        ],
        [
          -73.560377,
          45.510074
        ],
        [
          -73.560292,
          45.510191
        ],
        [
          -73.560138,
          45.510402
        ],
        [
          -73.559983,
          45.510612
        ],
        [
          -73.559965,
          45.510637
        ],
        [
          -73.559931,
          45.510681
        ],
        [
          -73.559829,
          45.510633
        ],
        [
          -73.559453,
          45.510471
        ],
        [
          -73.55862,
          45.510099
        ],
        [
          -73.558597,
          45.510089
        ],
        [
          -73.558557,
          45.510071
        ],
        [
          -73.558509,
          45.510049
        ],
        [
          -73.557435,
          45.509561
        ],
        [
          -73.557404,
          45.509546
        ],
        [
          -73.557379,
          45.50953
        ],
        [
          -73.557322,
          45.509493
        ],
        [
          -73.557344,
          45.509447
        ],
        [
          -73.557462,
          45.509202
        ],
        [
          -73.557516,
          45.509069
        ],
        [
          -73.557584,
          45.508931
        ],
        [
          -73.557618,
          45.508873
        ],
        [
          -73.55764,
          45.508836
        ],
        [
          -73.557724,
          45.508867
        ],
        [
          -73.557758,
          45.508879
        ],
        [
          -73.557905,
          45.508946
        ],
        [
          -73.558242,
          45.509103
        ],
        [
          -73.558828,
          45.509375
        ],
        [
          -73.558917,
          45.509416
        ],
        [
          -73.558939,
          45.509426
        ],
        [
          -73.558953,
          45.509432
        ],
        [
          -73.558998,
          45.509451
        ],
        [
          -73.559041,
          45.509472
        ],
        [
          -73.559052,
          45.509477
        ],
        [
          -73.559644,
          45.50974
        ]
      ]
    },
    "point": [
      -73.5629,
      45.5094
    ]
  },
  {
    "id": "pedestrian-sainte-catherine-village",
    "title": "Rue Sainte-Catherine Est piétonne - Le Village",
    "category": "commercial",
    "responsible": "SDC Village Montréal / Ville de Montréal",
    "borough": "Ville-Marie",
    "startDate": "2026-05-15",
    "endDate": "2026-10-15",
    "impact": "Rue réservée aux piétons; circulation automobile fermée pour la saison estivale dans le Village.",
    "trafficLabel": "Rue piétonne saisonnière",
    "severity": "critical",
    "direction": "Fermée à la circulation automobile dans les deux directions.",
    "streets": "Rue Sainte-Catherine Est, entre la rue Saint-Hubert et l'avenue Papineau",
    "source": "Ville de Montréal - Rues piétonnes",
    "sourceUrl": "https://montreal.ca/lieux?mtl_content.lieux.installation.code=RUPIE",
    "periods": [
      "day",
      "night"
    ],
    "routeEndpoints": [
      [
        -73.5595,
        45.5158
      ],
      [
        -73.5524,
        45.5218
      ]
    ],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          -73.55955,
          45.515746
        ],
        [
          -73.559617,
          45.515777
        ],
        [
          -73.56024,
          45.516059
        ],
        [
          -73.560278,
          45.516076
        ],
        [
          -73.560305,
          45.516088
        ],
        [
          -73.560363,
          45.516113
        ],
        [
          -73.560431,
          45.516143
        ],
        [
          -73.56046,
          45.516157
        ],
        [
          -73.560737,
          45.516283
        ],
        [
          -73.561044,
          45.516422
        ],
        [
          -73.562287,
          45.516985
        ],
        [
          -73.563758,
          45.517655
        ],
        [
          -73.563787,
          45.517668
        ],
        [
          -73.56398,
          45.517758
        ],
        [
          -73.564207,
          45.517857
        ],
        [
          -73.564285,
          45.517893
        ],
        [
          -73.564251,
          45.517957
        ],
        [
          -73.564235,
          45.517981
        ],
        [
          -73.563977,
          45.518401
        ],
        [
          -73.563739,
          45.518819
        ],
        [
          -73.563724,
          45.518842
        ],
        [
          -73.563692,
          45.518901
        ],
        [
          -73.563609,
          45.518861
        ],
        [
          -73.561879,
          45.518088
        ],
        [
          -73.561846,
          45.518074
        ],
        [
          -73.561789,
          45.518048
        ],
        [
          -73.561419,
          45.517888
        ],
        [
          -73.560606,
          45.517526
        ],
        [
          -73.559862,
          45.517186
        ],
        [
          -73.559735,
          45.517127
        ],
        [
          -73.559642,
          45.517085
        ],
        [
          -73.559606,
          45.517066
        ],
        [
          -73.55955,
          45.517036
        ],
        [
          -73.559483,
          45.516998
        ],
        [
          -73.559458,
          45.516985
        ],
        [
          -73.558863,
          45.516707
        ],
        [
          -73.558565,
          45.516575
        ],
        [
          -73.558206,
          45.516412
        ],
        [
          -73.55817,
          45.516397
        ],
        [
          -73.558101,
          45.516367
        ],
        [
          -73.558066,
          45.516405
        ],
        [
          -73.557539,
          45.516975
        ],
        [
          -73.557504,
          45.517013
        ],
        [
          -73.557468,
          45.517052
        ],
        [
          -73.557159,
          45.517385
        ],
        [
          -73.557133,
          45.517412
        ],
        [
          -73.557111,
          45.517435
        ],
        [
          -73.557076,
          45.51747
        ],
        [
          -73.557025,
          45.517526
        ],
        [
          -73.556702,
          45.517876
        ],
        [
          -73.55667,
          45.517913
        ],
        [
          -73.556635,
          45.517951
        ],
        [
          -73.556287,
          45.518329
        ],
        [
          -73.556255,
          45.518366
        ],
        [
          -73.556225,
          45.518401
        ],
        [
          -73.555875,
          45.518773
        ],
        [
          -73.555844,
          45.518807
        ],
        [
          -73.555812,
          45.518843
        ],
        [
          -73.555473,
          45.519215
        ],
        [
          -73.555466,
          45.519223
        ],
        [
          -73.555434,
          45.519259
        ],
        [
          -73.555403,
          45.519294
        ],
        [
          -73.554853,
          45.519902
        ],
        [
          -73.55482,
          45.519939
        ],
        [
          -73.55479,
          45.519971
        ],
        [
          -73.554325,
          45.520465
        ],
        [
          -73.554275,
          45.520517
        ],
        [
          -73.554231,
          45.520564
        ],
        [
          -73.553992,
          45.520826
        ],
        [
          -73.553723,
          45.52111
        ],
        [
          -73.553714,
          45.52112
        ],
        [
          -73.553665,
          45.521176
        ],
        [
          -73.553617,
          45.521229
        ],
        [
          -73.553103,
          45.521789
        ],
        [
          -73.553075,
          45.52182
        ],
        [
          -73.553054,
          45.521844
        ],
        [
          -73.552979,
          45.521809
        ],
        [
          -73.552964,
          45.521802
        ],
        [
          -73.552643,
          45.521654
        ],
        [
          -73.552569,
          45.52162
        ]
      ]
    },
    "point": [
      -73.5559,
      45.5188
    ]
  },
  {
    "id": "pedestrian-duluth-est",
    "title": "Avenue Duluth Est piétonne",
    "category": "commercial",
    "responsible": "Arrondissement du Plateau-Mont-Royal",
    "borough": "Le Plateau-Mont-Royal",
    "startDate": "2026-06-01",
    "endDate": "2026-10-15",
    "impact": "Rue piétonne estivale; circulation automobile fermée entre Saint-Laurent et Saint-Denis.",
    "trafficLabel": "Rue piétonne saisonnière",
    "severity": "critical",
    "direction": "Fermée à la circulation automobile dans les deux directions.",
    "streets": "Avenue Duluth Est, entre le boulevard Saint-Laurent et la rue Saint-Denis",
    "source": "Ville de Montréal - Rues piétonnes",
    "sourceUrl": "https://montreal.ca/lieux?mtl_content.lieux.installation.code=RUPIE",
    "periods": [
      "day",
      "night"
    ],
    "routeEndpoints": [
      [
        -73.5815,
        45.5173
      ],
      [
        -73.5746,
        45.5204
      ]
    ],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          -73.581595,
          45.517198
        ],
        [
          -73.581346,
          45.517084
        ],
        [
          -73.580683,
          45.516783
        ],
        [
          -73.580461,
          45.516682
        ],
        [
          -73.579952,
          45.51645
        ],
        [
          -73.579894,
          45.516423
        ],
        [
          -73.579844,
          45.516462
        ],
        [
          -73.579649,
          45.516682
        ],
        [
          -73.579477,
          45.516877
        ],
        [
          -73.579454,
          45.516903
        ],
        [
          -73.579396,
          45.516966
        ],
        [
          -73.57934,
          45.517023
        ],
        [
          -73.578989,
          45.517396
        ],
        [
          -73.57895,
          45.517438
        ],
        [
          -73.578908,
          45.517482
        ],
        [
          -73.578588,
          45.517832
        ],
        [
          -73.57856,
          45.517862
        ],
        [
          -73.578536,
          45.517889
        ],
        [
          -73.578505,
          45.517922
        ],
        [
          -73.57817,
          45.518283
        ],
        [
          -73.57813,
          45.518329
        ],
        [
          -73.578087,
          45.518377
        ],
        [
          -73.577751,
          45.518744
        ],
        [
          -73.577709,
          45.518788
        ],
        [
          -73.57768,
          45.518818
        ],
        [
          -73.577513,
          45.51899
        ],
        [
          -73.577322,
          45.519192
        ],
        [
          -73.577281,
          45.519235
        ],
        [
          -73.577234,
          45.519285
        ],
        [
          -73.577093,
          45.519437
        ],
        [
          -73.577043,
          45.519493
        ],
        [
          -73.576868,
          45.519689
        ],
        [
          -73.576837,
          45.519723
        ],
        [
          -73.576804,
          45.519758
        ],
        [
          -73.576621,
          45.519946
        ],
        [
          -73.576443,
          45.520144
        ],
        [
          -73.576412,
          45.520175
        ],
        [
          -73.576379,
          45.52021
        ],
        [
          -73.57619,
          45.520404
        ],
        [
          -73.575965,
          45.520649
        ],
        [
          -73.575954,
          45.520661
        ],
        [
          -73.575932,
          45.520686
        ],
        [
          -73.575873,
          45.520752
        ],
        [
          -73.575856,
          45.520744
        ],
        [
          -73.575815,
          45.520725
        ],
        [
          -73.575786,
          45.520712
        ],
        [
          -73.575225,
          45.520457
        ],
        [
          -73.57475,
          45.520239
        ]
      ]
    },
    "point": [
      -73.578,
      45.5188
    ]
  },
  {
    "id": "pedestrian-de-castelnau",
    "title": "Rue De Castelnau Est piétonne",
    "category": "commercial",
    "responsible": "Arrondissement de Villeray–Saint-Michel–Parc-Extension",
    "borough": "Villeray–Saint-Michel–Parc-Extension",
    "startDate": "2026-05-15",
    "endDate": "2026-10-15",
    "impact": "Place et rue piétonne estivale; circulation automobile fermée entre Saint-Denis et De Gaspé.",
    "trafficLabel": "Rue piétonne saisonnière",
    "severity": "critical",
    "direction": "Fermée à la circulation automobile dans les deux directions.",
    "streets": "Rue De Castelnau Est, entre la rue Saint-Denis et l'avenue De Gaspé",
    "source": "Ville de Montréal - Rues piétonnes",
    "sourceUrl": "https://montreal.ca/lieux?mtl_content.lieux.installation.code=RUPIE",
    "periods": [
      "day",
      "night"
    ],
    "routeEndpoints": [
      [
        -73.618,
        45.5348
      ],
      [
        -73.6152,
        45.5365
      ]
    ],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          -73.618054,
          45.534853
        ],
        [
          -73.617955,
          45.534902
        ],
        [
          -73.617521,
          45.535116
        ],
        [
          -73.617491,
          45.535131
        ],
        [
          -73.617395,
          45.535182
        ],
        [
          -73.617278,
          45.535129
        ],
        [
          -73.617241,
          45.535113
        ],
        [
          -73.616918,
          45.534967
        ],
        [
          -73.616402,
          45.534734
        ],
        [
          -73.616374,
          45.534722
        ],
        [
          -73.616345,
          45.534709
        ],
        [
          -73.616256,
          45.534667
        ],
        [
          -73.616179,
          45.534631
        ],
        [
          -73.61612,
          45.534603
        ],
        [
          -73.616095,
          45.534591
        ],
        [
          -73.615626,
          45.534381
        ],
        [
          -73.615244,
          45.534209
        ],
        [
          -73.615211,
          45.534195
        ],
        [
          -73.615128,
          45.534158
        ],
        [
          -73.615071,
          45.534219
        ],
        [
          -73.615046,
          45.534245
        ],
        [
          -73.61481,
          45.534498
        ],
        [
          -73.614694,
          45.534622
        ],
        [
          -73.614675,
          45.534642
        ],
        [
          -73.614626,
          45.534695
        ],
        [
          -73.614715,
          45.534735
        ],
        [
          -73.615123,
          45.534919
        ],
        [
          -73.615142,
          45.534927
        ],
        [
          -73.615411,
          45.535049
        ],
        [
          -73.615476,
          45.535078
        ],
        [
          -73.615648,
          45.535155
        ],
        [
          -73.615687,
          45.535173
        ],
        [
          -73.615788,
          45.535219
        ],
        [
          -73.615849,
          45.535246
        ],
        [
          -73.616277,
          45.53544
        ],
        [
          -73.616382,
          45.535486
        ],
        [
          -73.616327,
          45.535546
        ],
        [
          -73.615994,
          45.535909
        ],
        [
          -73.615897,
          45.536014
        ],
        [
          -73.615806,
          45.536113
        ],
        [
          -73.615714,
          45.536213
        ],
        [
          -73.615621,
          45.536314
        ],
        [
          -73.615525,
          45.536419
        ],
        [
          -73.615429,
          45.536523
        ],
        [
          -73.615377,
          45.53658
        ]
      ]
    },
    "point": [
      -73.6166,
      45.5356
    ]
  },
  {
    "id": "pedestrian-bernard-outremont",
    "title": "Avenue Bernard piétonne",
    "category": "commercial",
    "responsible": "Arrondissement d'Outremont",
    "borough": "Outremont",
    "startDate": "2026-05-15",
    "endDate": "2026-10-15",
    "impact": "Rue piétonne estivale; circulation automobile fermée entre Wiseman et Bloomfield.",
    "trafficLabel": "Rue piétonne saisonnière",
    "severity": "critical",
    "direction": "Fermée à la circulation automobile dans les deux directions.",
    "streets": "Avenue Bernard, entre l'avenue Wiseman et l'avenue Bloomfield",
    "source": "Ville de Montréal - Rues piétonnes",
    "sourceUrl": "https://montreal.ca/lieux?mtl_content.lieux.installation.code=RUPIE",
    "periods": [
      "day",
      "night"
    ],
    "routeEndpoints": [
      [
        -73.6095,
        45.5186
      ],
      [
        -73.6048,
        45.5215
      ]
    ],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          -73.609902,
          45.518775
        ],
        [
          -73.609773,
          45.51892
        ],
        [
          -73.609568,
          45.51915
        ],
        [
          -73.609538,
          45.519184
        ],
        [
          -73.609494,
          45.519232
        ],
        [
          -73.609403,
          45.519192
        ],
        [
          -73.609056,
          45.519036
        ],
        [
          -73.608522,
          45.518797
        ],
        [
          -73.60764,
          45.518395
        ],
        [
          -73.606304,
          45.51781
        ],
        [
          -73.606249,
          45.517789
        ],
        [
          -73.606175,
          45.517757
        ],
        [
          -73.606141,
          45.517794
        ],
        [
          -73.606117,
          45.517822
        ],
        [
          -73.605641,
          45.518355
        ],
        [
          -73.605625,
          45.518372
        ],
        [
          -73.605589,
          45.518412
        ],
        [
          -73.605555,
          45.51845
        ],
        [
          -73.60553,
          45.518479
        ],
        [
          -73.605088,
          45.518974
        ],
        [
          -73.605054,
          45.519012
        ],
        [
          -73.605004,
          45.519068
        ],
        [
          -73.604962,
          45.519115
        ],
        [
          -73.60494,
          45.51914
        ],
        [
          -73.604717,
          45.51939
        ],
        [
          -73.604508,
          45.519624
        ],
        [
          -73.60448,
          45.519655
        ],
        [
          -73.60444,
          45.519699
        ],
        [
          -73.604395,
          45.51975
        ],
        [
          -73.60438,
          45.519767
        ],
        [
          -73.604012,
          45.52018
        ],
        [
          -73.60397,
          45.520226
        ],
        [
          -73.603929,
          45.520273
        ],
        [
          -73.60348,
          45.520775
        ],
        [
          -73.603437,
          45.520824
        ],
        [
          -73.603503,
          45.520853
        ],
        [
          -73.604848,
          45.521446
        ]
      ]
    },
    "point": [
      -73.6071,
      45.52
    ]
  },
  {
    "id": "pedestrian-place-marche-nord",
    "title": "Place du Marché-du-Nord (Marché Jean-Talon)",
    "category": "commercial",
    "responsible": "Arrondissement de Rosemont–La Petite-Patrie",
    "borough": "Rosemont–La Petite-Patrie",
    "startDate": "2026-05-15",
    "endDate": "2026-10-15",
    "impact": "Zone piétonne du Marché Jean-Talon; circulation automobile fermée aux abords du marché.",
    "trafficLabel": "Rue piétonne saisonnière",
    "severity": "critical",
    "direction": "Fermée à la circulation automobile.",
    "streets": "Place du Marché-du-Nord, entre l'avenue Casgrain et l'avenue Henri-Julien",
    "source": "Ville de Montréal - Rues piétonnes",
    "sourceUrl": "https://montreal.ca/lieux?mtl_content.lieux.installation.code=RUPIE",
    "periods": [
      "day",
      "night"
    ],
    "routeEndpoints": [
      [
        -73.6163,
        45.5363
      ],
      [
        -73.6142,
        45.5376
      ]
    ],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          -73.616305,
          45.536303
        ],
        [
          -73.616087,
          45.536534
        ],
        [
          -73.615632,
          45.537023
        ],
        [
          -73.615603,
          45.537055
        ],
        [
          -73.615546,
          45.537115
        ],
        [
          -73.615497,
          45.537164
        ],
        [
          -73.61548,
          45.537185
        ],
        [
          -73.615301,
          45.537378
        ],
        [
          -73.615221,
          45.537461
        ],
        [
          -73.615197,
          45.537486
        ],
        [
          -73.615163,
          45.537522
        ],
        [
          -73.615147,
          45.537539
        ],
        [
          -73.615124,
          45.537562
        ],
        [
          -73.615107,
          45.537581
        ],
        [
          -73.614835,
          45.537876
        ],
        [
          -73.614718,
          45.537825
        ],
        [
          -73.614618,
          45.537779
        ],
        [
          -73.614584,
          45.537763
        ],
        [
          -73.614402,
          45.53768
        ],
        [
          -73.614208,
          45.537591
        ]
      ]
    },
    "point": [
      -73.6152,
      45.5369
    ]
  },
  {
    "id": "pedestrian-ontario-est",
    "title": "Rue Ontario Est piétonne",
    "category": "commercial",
    "responsible": "Arrondissement de Mercier–Hochelaga-Maisonneuve / SDC Hochelaga",
    "borough": "Mercier–Hochelaga-Maisonneuve",
    "startDate": "2026-06-01",
    "endDate": "2026-09-15",
    "impact": "Rue piétonne estivale; circulation automobile fermée entre Pie-IX et Darling.",
    "trafficLabel": "Rue piétonne saisonnière",
    "severity": "critical",
    "direction": "Fermée à la circulation automobile dans les deux directions.",
    "streets": "Rue Ontario Est, entre le boulevard Pie-IX et la rue Darling",
    "source": "Ville de Montréal - Rues piétonnes",
    "sourceUrl": "https://montreal.ca/lieux?mtl_content.lieux.installation.code=RUPIE",
    "periods": [
      "day",
      "night"
    ],
    "routeEndpoints": [
      [
        -73.5482,
        45.5452
      ],
      [
        -73.5435,
        45.5473
      ]
    ],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          -73.548218,
          45.545205
        ],
        [
          -73.548237,
          45.545174
        ],
        [
          -73.545846,
          45.544444
        ],
        [
          -73.545438,
          45.544319
        ],
        [
          -73.545395,
          45.544306
        ],
        [
          -73.54533,
          45.544287
        ],
        [
          -73.545306,
          45.544327
        ],
        [
          -73.545009,
          45.544814
        ],
        [
          -73.544997,
          45.544834
        ],
        [
          -73.544974,
          45.544871
        ],
        [
          -73.544943,
          45.544921
        ],
        [
          -73.544922,
          45.544955
        ],
        [
          -73.544509,
          45.545631
        ],
        [
          -73.544488,
          45.545667
        ],
        [
          -73.544464,
          45.545705
        ],
        [
          -73.54401,
          45.546425
        ],
        [
          -73.543988,
          45.546461
        ],
        [
          -73.543972,
          45.546488
        ],
        [
          -73.543798,
          45.546764
        ],
        [
          -73.543581,
          45.547108
        ],
        [
          -73.543556,
          45.547148
        ],
        [
          -73.543524,
          45.547201
        ],
        [
          -73.54347,
          45.547291
        ]
      ]
    },
    "point": [
      -73.5458,
      45.5462
    ]
  }
];

const LINKED_MUNICIPALITIES = [
  { name: "Baie-d'Urfe", coordinates: [-73.916, 45.414], url: "https://baie-durfe.qc.ca/fr/nos-departements/page/info-travaux", detail: "Info-travaux avec dates et impacts", quality: "detaillee", links: [{ label: "Info-travaux", url: "https://baie-durfe.qc.ca/fr/nos-departements/page/info-travaux" }] },
  { name: "Beaconsfield", coordinates: [-73.865, 45.433], url: "https://www.beaconsfield.ca/fr/carte-interactive/info-travaux", detail: "Carte interactive et info-travaux", quality: "detaillee", links: [{ label: "Carte interactive Info-travaux", url: "https://www.beaconsfield.ca/fr/carte-interactive/info-travaux" }, { label: "Avis municipaux", url: "https://portail.beaconsfield.ca/fr/avis" }] },
  { name: "Cote-Saint-Luc", coordinates: [-73.666, 45.468], url: "https://cotesaintluc.org/en/municipal-documents/projects-and-plans/", detail: "Projects and plans", quality: "detaillee", links: [{ label: "Projects and plans", url: "https://cotesaintluc.org/en/municipal-documents/projects-and-plans/" }, { label: "Infrastructure projects", url: "https://cotesaintluc.org/en/projects/2025-infrastructure-projects-in-cote-saint%E2%80%91luc/" }] },
  { name: "Dollard-des-Ormeaux", coordinates: [-73.821, 45.494], url: "https://ville.ddo.qc.ca/info-travaux/", detail: "Info-travaux", links: [{ label: "Info-travaux", url: "https://ville.ddo.qc.ca/info-travaux/" }] },
  { name: "Dorval", coordinates: [-73.750, 45.447], url: "https://www.ville.dorval.qc.ca/fr/environnement-et-voirie/infrastructures-urbaines/info-travaux", detail: "Travaux et infrastructures", links: [{ label: "Info-travaux", url: "https://www.ville.dorval.qc.ca/fr/environnement-et-voirie/infrastructures-urbaines/info-travaux" }] },
  { name: "Hampstead", coordinates: [-73.642, 45.482], url: "https://www.hampstead.qc.ca/fr/services/entretien-et-circulation/chantiers-dans-ma-rue/", detail: "Chantiers dans ma rue", links: [{ label: "Chantiers dans ma rue", url: "https://www.hampstead.qc.ca/fr/services/entretien-et-circulation/chantiers-dans-ma-rue/" }, { label: "Projets majeurs", url: "https://www.hampstead.qc.ca/fr/info-travaux/" }] },
  { name: "Kirkland", coordinates: [-73.858, 45.450], url: "https://www.ville.kirkland.qc.ca/services-aux-citoyens/gestion-des--infrastructures/info-travaux", detail: "Info-travaux", links: [{ label: "Info-travaux", url: "https://www.ville.kirkland.qc.ca/services-aux-citoyens/gestion-des--infrastructures/info-travaux" }] },
  { name: "L'Ile-Dorval", coordinates: [-73.741, 45.433], url: "https://www.iledorval.com/", detail: "Avis municipaux", links: [{ label: "Site municipal", url: "https://www.iledorval.com/" }] },
  { name: "Montreal-Est", coordinates: [-73.507, 45.632], url: "https://ville.montreal-est.qc.ca/", detail: "Avis et travaux municipaux", links: [{ label: "Site municipal", url: "https://ville.montreal-est.qc.ca/" }] },
  { name: "Montreal-Ouest", coordinates: [-73.649, 45.452], url: "https://montreal-west.ca/", detail: "Avis et travaux municipaux", links: [{ label: "Site municipal", url: "https://montreal-west.ca/" }] },
  { name: "Ville de Mont-Royal", coordinates: [-73.642, 45.516], url: "https://www.ville.mont-royal.qc.ca/fr/actualites/divers/info-construction-tous-les-developpements-sur-les-travaux-en-cours", detail: "Info construction", links: [{ label: "Info construction", url: "https://www.ville.mont-royal.qc.ca/fr/actualites/divers/info-construction-tous-les-developpements-sur-les-travaux-en-cours" }] },
  { name: "Pointe-Claire", coordinates: [-73.806, 45.448], url: "https://www.pointe-claire.ca/réseaux-routiers-et-infrastructures-publics/travaux-et-grands-chantiers", detail: "Travaux et grands chantiers", links: [{ label: "Travaux et grands chantiers", url: "https://www.pointe-claire.ca/réseaux-routiers-et-infrastructures-publics/travaux-et-grands-chantiers" }, { label: "Grands chantiers", url: "https://www.pointe-claire.ca/réseaux-routiers-et-infrastructures-publics/travaux-et-grands-chantiers/grands-chantiers" }] },
  { name: "Sainte-Anne-de-Bellevue", coordinates: [-73.951, 45.406], url: "https://urgences.sadb.qc.ca/en/notices", detail: "Portail des avis", links: [{ label: "Portail des avis", url: "https://urgences.sadb.qc.ca/en/notices" }] },
  { name: "Senneville", coordinates: [-73.950, 45.430], url: "https://www.ville.senneville.qc.ca/", detail: "Avis municipaux", links: [{ label: "Site municipal", url: "https://www.ville.senneville.qc.ca/" }] },
  { name: "Westmount", coordinates: [-73.596, 45.485], url: "https://westmount.org/en/urban-planning-and-infrastructure/roads-and-public-works/roadwork-and-projects", detail: "Roadwork and Projects", quality: "detaillee", links: [{ label: "Roadwork and Projects", url: "https://westmount.org/en/urban-planning-and-infrastructure/roads-and-public-works/roadwork-and-projects" }, { label: "Avis en cours", url: "https://citoyen.westmount.org/en/notices" }] }
];

const LINKED_CITY_WORKS = [
  {
    id: "linked-baie-durfe-clark-graham-exo",
    title: "Reconstruction de la piste cyclable Clark-Graham - gare EXO",
    borough: "Baie-d'Urfe",
    startDate: "2026-09-15",
    endDate: "2026-10-27",
    impact: "Travaux de reconstruction; accès à la gare EXO maintenu, mais déplacements locaux a prévoir selon la signalisation.",
    trafficLabel: "Accès limite",
    severity: "moderate",
    direction: "Secteur Clark-Graham vers la gare EXO. Direction automobile non précisée dans l'avis municipal.",
    streets: "Avenue Clark-Graham vers gare EXO Baie-d'Urfe",
    responsible: "Ville de Baie-d'Urfe",
    source: "Baie-d'Urfe - Info-travaux",
    sourceUrl: "https://baie-durfe.qc.ca/fr/nos-departements/page/info-travaux",
    periods: ["day"],
    routeEndpoints: [[-73.9170, 45.4140], [-73.9055, 45.4115]],
    point: [-73.909, 45.413],
    geometry: { type: "Point", coordinates: [-73.909, 45.413] }
  },
  {
    id: "linked-ddo-ravel-roadwork",
    title: "Réfection de chaussées, bordures et trottoirs - Ravel",
    borough: "Dollard-des-Ormeaux",
    startDate: "2026-08-03",
    endDate: "2026-09-25",
    impact: "Travaux en cours sur la rue Ravel; ralentissements locaux possibles.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Direction precise non publiée dans l'avis municipal.",
    streets: "Rue Ravel",
    responsible: "Ville de Dollard-des-Ormeaux",
    source: "DDO - Info-travaux",
    sourceUrl: "https://ville.ddo.qc.ca/info-travaux/",
    periods: ["day"],
    routeEndpoints: [[-73.8252, 45.4863], [-73.8216, 45.4883]],
    point: [-73.824, 45.487],
    geometry: { type: "Point", coordinates: [-73.824, 45.487] }
  },
  {
    id: "linked-ddo-hamlet-roadwork",
    title: "Réfection de chaussées, bordures et trottoirs - Hamlet",
    borough: "Dollard-des-Ormeaux",
    startDate: "2026-08-03",
    endDate: "2026-09-25",
    impact: "Travaux en cours sur Hamlet; ralentissements locaux possibles.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Direction precise non publiée dans l'avis municipal.",
    streets: "Hamlet",
    responsible: "Ville de Dollard-des-Ormeaux",
    source: "DDO - Info-travaux",
    sourceUrl: "https://ville.ddo.qc.ca/info-travaux/",
    periods: ["day"],
    routeEndpoints: [[-73.8360, 45.4848], [-73.8292, 45.4887]],
    point: [-73.832, 45.486],
    geometry: { type: "Point", coordinates: [-73.832, 45.486] }
  },
  {
    id: "linked-ddo-malard-roadwork",
    title: "Réfection de chaussées, bordures et trottoirs - Malard",
    borough: "Dollard-des-Ormeaux",
    startDate: "2026-08-03",
    endDate: "2026-09-25",
    impact: "Travaux en cours sur Malard; ralentissements locaux possibles.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Direction precise non publiée dans l'avis municipal.",
    streets: "Malard",
    responsible: "Ville de Dollard-des-Ormeaux",
    source: "DDO - Info-travaux",
    sourceUrl: "https://ville.ddo.qc.ca/info-travaux/",
    periods: ["day"],
    routeEndpoints: [[-73.8398, 45.4886], [-73.8344, 45.4920]],
    point: [-73.836, 45.490],
    geometry: { type: "Point", coordinates: [-73.836, 45.490] }
  },
  {
    id: "linked-ddo-sunnybrooke-pickleball",
    title: "Nouveaux terrains de pickleball - parc Sunnybrooke",
    borough: "Dollard-des-Ormeaux",
    startDate: "2026-09-01",
    endDate: "2026-11-30",
    impact: "Travaux planifiés au parc Sunnybrooke; circulation locale possiblement affectee aux abords du chantier.",
    trafficLabel: "Accès limite",
    severity: "moderate",
    direction: "Accès local au parc; direction routière non précisée.",
    streets: "Parc Sunnybrooke",
    responsible: "Ville de Dollard-des-Ormeaux",
    source: "DDO - Info-travaux",
    sourceUrl: "https://ville.ddo.qc.ca/info-travaux/",
    periods: ["day"],
    routeEndpoints: [[-73.8035, 45.4970], [-73.7975, 45.4994]],
    point: [-73.801, 45.498],
    geometry: { type: "Point", coordinates: [-73.801, 45.498] }
  },
  {
    id: "linked-dorval-herron-resurfacing",
    title: "Resurfaçage du chemin Herron entre Oakville et Elm",
    borough: "Dorval",
    startDate: "2026-06-18",
    endDate: "2026-09-30",
    impact: "Travaux sur le chemin Herron; circulation locale et accès riverains à surveiller.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Chemin Herron, entre les avenues Oakville et Elm. Direction precise non publiée dans l'extrait.",
    streets: "Chemin Herron, entre Oakville et Elm",
    responsible: "Cite de Dorval",
    source: "Dorval - Info-travaux",
    sourceUrl: "https://www.ville.dorval.qc.ca/fr/environnement-et-voirie/infrastructures-urbaines/info-travaux",
    periods: ["day"],
    routeEndpoints: [[-73.7650, 45.4498], [-73.7520, 45.4511]],
    point: [-73.759, 45.450],
    geometry: { type: "Point", coordinates: [-73.759, 45.450] }
  },
  {
    id: "linked-dorval-hydro-corridor",
    title: "Hydro-Quebec - canalisation souterraine Dorval-Saint-Laurent",
    borough: "Dorval",
    startDate: "2026-08-01",
    endDate: "2026-11-30",
    impact: "Travaux de canalisation souterraine sur le corridor d'énergie; entraves locales possibles.",
    trafficLabel: "Accès limite",
    severity: "moderate",
    direction: "Corridor Dorval vers Saint-Laurent; direction routière non précisée.",
    streets: "Corridor d'énergie Dorval-Saint-Laurent",
    responsible: "Hydro-Quebec / Cite de Dorval",
    source: "Dorval - Info-travaux",
    sourceUrl: "https://www.ville.dorval.qc.ca/fr/environnement-et-voirie/infrastructures-urbaines/info-travaux",
    periods: ["day"],
    routeEndpoints: [[-73.7580, 45.4520], [-73.7330, 45.4630]],
    point: [-73.742, 45.459],
    geometry: { type: "Point", coordinates: [-73.742, 45.459] }
  },
  {
    id: "linked-hampstead-fleet",
    title: "Travaux à venir sur l'avenue Fleet",
    borough: "Hampstead",
    startDate: "2026-09-04",
    endDate: "2026-12-31",
    impact: "Travaux prévus sur l'avenue Fleet; surveiller les avis municipaux pour les fermetures et détours exacts.",
    trafficLabel: "Accès limite",
    severity: "moderate",
    direction: "Avenue Fleet; direction precise non publiée dans l'extrait.",
    streets: "Avenue Fleet",
    responsible: "Ville de Hampstead",
    source: "Hampstead - Chantiers dans ma rue",
    sourceUrl: "https://www.hampstead.qc.ca/fr/services/entretien-et-circulation/chantiers-dans-ma-rue/",
    periods: ["day"],
    routeEndpoints: [[-73.6540, 45.4780], [-73.6350, 45.4830]],
    point: [-73.646, 45.480],
    geometry: { type: "Point", coordinates: [-73.646, 45.480] }
  },
  {
    id: "linked-westmount-le-boulevard-water-main",
    title: "Water Main Break on Le Boulevard",
    borough: "Westmount",
    startDate: "2026-09-04",
    endDate: "2026-09-04",
    impact: "Intervention urgente sur conduite d'eau; entraves locales possibles entre 7 h et 9 h 25.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Le Boulevard; direction precise non publiée dans l'avis.",
    streets: "Le Boulevard",
    responsible: "City of Westmount",
    source: "Westmount - Avis en cours",
    sourceUrl: "https://citoyen.westmount.org/en/notices",
    periods: ["day"],
    routeEndpoints: [[-73.6110, 45.4865], [-73.5980, 45.4885]],
    point: [-73.605, 45.487],
    geometry: { type: "Point", coordinates: [-73.605, 45.487] }
  },
  {
    id: "linked-westmount-mountain-reconstruction",
    title: "Reconstruction of Mountain Avenue between Cedar and Sherbrooke",
    borough: "Westmount",
    startDate: "2026-08-17",
    endDate: "2026-11-30",
    impact: "Reconstruction de Mountain Avenue; détours et ralentissements locaux possibles.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Mountain Avenue entre Cedar Avenue et Sherbrooke Street. Direction precise non publiée dans l'avis.",
    streets: "Mountain Avenue, entre Cedar Avenue et Sherbrooke Street",
    responsible: "City of Westmount",
    source: "Westmount - Avis en cours",
    sourceUrl: "https://citoyen.westmount.org/en/notices",
    periods: ["day"],
    routeEndpoints: [[-73.5958, 45.4894], [-73.5895, 45.4822]],
    point: [-73.592, 45.486],
    geometry: { type: "Point", coordinates: [-73.592, 45.486] }
  },
  {
    id: "linked-westmount-argyle-metcalfe-kensington",
    title: "New Traffic Configurations on Argyle, Metcalfe and Kensington",
    borough: "Westmount",
    startDate: "2026-08-15",
    endDate: "2026-12-31",
    impact: "Nouvelles configurations de circulation; changements de parcours locaux a prévoir.",
    trafficLabel: "Accès limite",
    severity: "moderate",
    direction: "Argyle, Metcalfe et Kensington; details de direction à consulter dans l'avis.",
    streets: "Argyle, Metcalfe et Kensington",
    responsible: "City of Westmount",
    source: "Westmount - Avis en cours",
    sourceUrl: "https://citoyen.westmount.org/en/notices",
    periods: ["day", "night"],
    routeEndpoints: [[-73.6005, 45.4873], [-73.5926, 45.4852]],
    point: [-73.596, 45.486],
    geometry: { type: "Point", coordinates: [-73.596, 45.486] }
  },
  {
    id: "linked-westmount-arlington-sherbrooke",
    title: "Réhabilitation of Arlington Avenue and Sherbrooke Street West",
    borough: "Westmount",
    startDate: "2026-05-19",
    endDate: "2026-09-07",
    impact: "Réhabilitation d'Arlington Avenue et Sherbrooke Street West entre Grosvenor et Strathcona; entraves locales possibles.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Entre Grosvenor Avenue et Strathcona Avenue. Direction precise non publiée dans l'avis.",
    streets: "Arlington Avenue et Sherbrooke Street West, entre Grosvenor et Strathcona",
    responsible: "City of Westmount",
    source: "Westmount - Avis en cours",
    sourceUrl: "https://citoyen.westmount.org/en/notices",
    periods: ["day", "night"],
    routeEndpoints: [[-73.6080, 45.4805], [-73.5982, 45.4808]],
    point: [-73.603, 45.481],
    geometry: { type: "Point", coordinates: [-73.603, 45.481] }
  },
  {
    id: "linked-pointe-claire-a40-service-saint-jean",
    title: "Resurfaçage voie de desserte A-40 sud et boulevard Saint-Jean",
    borough: "Pointe-Claire",
    startDate: "2026-05-01",
    endDate: "2026-11-30",
    impact: "Grand chantier 2026 de resurfaçage; ralentissements et réductions de voies possibles sur la desserte sud de l'A-40 et boulevard Saint-Jean.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Voie de desserte sud de l'autoroute 40 et boulevard Saint-Jean; direction precise non publiée sur la page.",
    streets: "Voie de desserte sud de l'A-40 et boulevard Saint-Jean",
    responsible: "Ville de Pointe-Claire",
    source: "Pointe-Claire - Grands chantiers 2026",
    sourceUrl: "https://www.pointe-claire.ca/réseaux-routiers-et-infrastructures-publics/travaux-et-grands-chantiers/grands-chantiers",
    periods: ["day"],
    routeEndpoints: [[-73.8200, 45.4615], [-73.7890, 45.4608], [-73.7810, 45.4625]],
    point: [-73.800, 45.461],
    geometry: { type: "Point", coordinates: [-73.800, 45.461] }
  },
  {
    id: "linked-pointe-claire-lakeshore",
    title: "Resurfaçage chemin du Bord-du-Lac-Lakeshore",
    borough: "Pointe-Claire",
    startDate: "2026-05-01",
    endDate: "2026-11-30",
    impact: "Grand chantier 2026 de resurfaçage entre l'entrée de l'A-20 et l'avenue Lakeside; circulation locale à surveiller.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Chemin du Bord-du-Lac-Lakeshore entre l'entrée de l'autoroute 20 et l'avenue Lakeside.",
    streets: "Chemin du Bord-du-Lac-Lakeshore, entre A-20 et avenue Lakeside",
    responsible: "Ville de Pointe-Claire",
    source: "Pointe-Claire - Grands chantiers 2026",
    sourceUrl: "https://www.pointe-claire.ca/réseaux-routiers-et-infrastructures-publics/travaux-et-grands-chantiers/grands-chantiers",
    periods: ["day"],
    routeEndpoints: [[-73.8270, 45.4290], [-73.8040, 45.4335]],
    point: [-73.815, 45.432],
    geometry: { type: "Point", coordinates: [-73.815, 45.432] }
  },
  {
    id: "linked-pointe-claire-chestnut",
    title: "Reconstruction de l'avenue Chestnut",
    borough: "Pointe-Claire",
    startDate: "2026-05-01",
    endDate: "2026-11-30",
    impact: "Reconstruction avec remplacement des lampadaires; entraves locales possibles.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Avenue Chestnut; direction precise non publiée sur la page.",
    streets: "Avenue Chestnut",
    responsible: "Ville de Pointe-Claire",
    source: "Pointe-Claire - Grands chantiers 2026",
    sourceUrl: "https://www.pointe-claire.ca/réseaux-routiers-et-infrastructures-publics/travaux-et-grands-chantiers/grands-chantiers",
    periods: ["day"],
    routeEndpoints: [[-73.8065, 45.4520], [-73.8015, 45.4550]],
    point: [-73.804, 45.453],
    geometry: { type: "Point", coordinates: [-73.804, 45.453] }
  },
  {
    id: "linked-pointe-claire-ivanhoe",
    title: "Reconstruction de l'avenue d'Ivanhoe Crescent",
    borough: "Pointe-Claire",
    startDate: "2026-05-01",
    endDate: "2026-11-30",
    impact: "Reconstruction routière locale; réductions de circulation possibles selon la signalisation.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Avenue d'Ivanhoe Crescent; direction precise non publiée sur la page.",
    streets: "Avenue d'Ivanhoe Crescent",
    responsible: "Ville de Pointe-Claire",
    source: "Pointe-Claire - Grands chantiers 2026",
    sourceUrl: "https://www.pointe-claire.ca/réseaux-routiers-et-infrastructures-publics/travaux-et-grands-chantiers/grands-chantiers",
    periods: ["day"],
    routeEndpoints: [[-73.8025, 45.4485], [-73.7975, 45.4515]],
    point: [-73.800, 45.450],
    geometry: { type: "Point", coordinates: [-73.800, 45.450] }
  },
  {
    id: "linked-pointe-claire-saint-joachim-sainte-anne",
    title: "Fouilles archéologiques Saint-Joachim et Sainte-Anne",
    borough: "Pointe-Claire",
    startDate: "2026-05-01",
    endDate: "2026-11-30",
    impact: "Fouilles archéologiques sur des avenues locales; circulation et stationnement à surveiller.",
    trafficLabel: "Accès limite",
    severity: "moderate",
    direction: "Avenues Saint-Joachim et Sainte-Anne; direction precise non publiée sur la page.",
    streets: "Avenues Saint-Joachim et Sainte-Anne",
    responsible: "Ville de Pointe-Claire",
    source: "Pointe-Claire - Grands chantiers 2026",
    sourceUrl: "https://www.pointe-claire.ca/réseaux-routiers-et-infrastructures-publics/travaux-et-grands-chantiers/grands-chantiers",
    periods: ["day"],
    routeEndpoints: [[-73.8110, 45.4310], [-73.8020, 45.4325]],
    point: [-73.806, 45.432],
    geometry: { type: "Point", coordinates: [-73.806, 45.432] }
  },
  {
    id: "linked-pointe-claire-sources-a40-lighting",
    title: "Remplacement éclairage échangeur des Sources / A-40",
    borough: "Pointe-Claire",
    startDate: "2026-05-01",
    endDate: "2026-11-30",
    impact: "Remplacement du systeme d'éclairage sur l'échangeur des Sources et la bretelle sud de l'A-40; entraves possibles sur bretelles.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Échangeur des Sources et bretelle sud de l'autoroute 40; direction précise non publiée sur la page.",
    streets: "Échangeur des Sources / bretelle sud de l'A-40",
    responsible: "Ville de Pointe-Claire",
    source: "Pointe-Claire - Grands chantiers 2026",
    sourceUrl: "https://www.pointe-claire.ca/réseaux-routiers-et-infrastructures-publics/travaux-et-grands-chantiers/grands-chantiers",
    periods: ["day", "night"],
    routeEndpoints: [[-73.7885, 45.4700], [-73.7755, 45.4690]],
    point: [-73.782, 45.469],
    geometry: { type: "Point", coordinates: [-73.782, 45.469] }
  },
  {
    id: "linked-westmount-sainte-catherine-eastbound",
    title: "Reconstruction of Sainte-Catherine Street eastbound",
    borough: "Westmount",
    startDate: "2026-05-01",
    endDate: "2026-11-30",
    impact: "Reconstruction entre De Maisonneuve Boulevard et Glen Road en direction est; détours et ralentissements possibles.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Direction est publiée par Westmount.",
    streets: "Sainte-Catherine Street, entre De Maisonneuve Boulevard et Glen Road, eastbound",
    responsible: "City of Westmount",
    source: "Westmount - Roadwork and Projects",
    sourceUrl: "https://westmount.org/en/urban-planning-and-infrastructure/roads-and-public-works/roadwork-and-projects",
    periods: ["day"],
    routeEndpoints: [[-73.5980, 45.4804], [-73.5815, 45.4778]],
    point: [-73.590, 45.479],
    geometry: { type: "Point", coordinates: [-73.590, 45.479] }
  },
  {
    id: "linked-westmount-renfrew",
    title: "Reconstruction of Hydro Westmount infrastructure on Renfrew Avenue",
    borough: "Westmount",
    startDate: "2026-05-01",
    endDate: "2026-11-30",
    impact: "Reconstruction d'infrastructures sur Renfrew Avenue; entraves locales possibles.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Renfrew Avenue; direction precise non publiée sur la page.",
    streets: "Renfrew Avenue",
    responsible: "City of Westmount / Hydro Westmount",
    source: "Westmount - Roadwork and Projects",
    sourceUrl: "https://westmount.org/en/urban-planning-and-infrastructure/roads-and-public-works/roadwork-and-projects",
    periods: ["day"],
    routeEndpoints: [[-73.6008, 45.4815], [-73.5928, 45.4825]],
    point: [-73.596, 45.482],
    geometry: { type: "Point", coordinates: [-73.596, 45.482] }
  },
  {
    id: "linked-westmount-claremont-lorraine",
    title: "Claremont Avenue Réhabilitation and Lorraine Avenue Reconstruction",
    borough: "Westmount",
    startDate: "2026-05-01",
    endDate: "2026-11-30",
    impact: "Réhabilitation/reconstruction de rues locales; circulation et stationnement à surveiller.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Claremont Avenue et Lorraine Avenue; direction precise non publiée sur la page.",
    streets: "Claremont Avenue et Lorraine Avenue",
    responsible: "City of Westmount",
    source: "Westmount - Roadwork and Projects",
    sourceUrl: "https://westmount.org/en/urban-planning-and-infrastructure/roads-and-public-works/roadwork-and-projects",
    periods: ["day"],
    routeEndpoints: [[-73.6140, 45.4785], [-73.6085, 45.4845]],
    point: [-73.611, 45.482],
    geometry: { type: "Point", coordinates: [-73.611, 45.482] }
  },
  {
    id: "linked-westmount-murray-hill",
    title: "Murray Hill Avenue Reconstruction",
    borough: "Westmount",
    startDate: "2026-05-01",
    endDate: "2026-11-30",
    impact: "Reconstruction de Murray Hill Avenue; entraves locales possibles.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Murray Hill Avenue; direction precise non publiée sur la page.",
    streets: "Murray Hill Avenue",
    responsible: "City of Westmount",
    source: "Westmount - Roadwork and Projects",
    sourceUrl: "https://westmount.org/en/urban-planning-and-infrastructure/roads-and-public-works/roadwork-and-projects",
    periods: ["day"],
    routeEndpoints: [[-73.6025, 45.4850], [-73.5965, 45.4892]],
    point: [-73.600, 45.487],
    geometry: { type: "Point", coordinates: [-73.600, 45.487] }
  },
  {
    id: "linked-westmount-grosvenor",
    title: "Works on Grosvenor Avenue",
    borough: "Westmount",
    startDate: "2026-05-01",
    endDate: "2026-11-30",
    impact: "Travaux sur Grosvenor Avenue; entraves locales possibles.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Grosvenor Avenue; direction precise non publiée sur la page.",
    streets: "Grosvenor Avenue",
    responsible: "City of Westmount",
    source: "Westmount - Roadwork and Projects",
    sourceUrl: "https://westmount.org/en/urban-planning-and-infrastructure/roads-and-public-works/roadwork-and-projects",
    periods: ["day"],
    routeEndpoints: [[-73.6040, 45.4785], [-73.6010, 45.4865]],
    point: [-73.602, 45.482],
    geometry: { type: "Point", coordinates: [-73.602, 45.482] }
  },
  {
    id: "linked-westmount-atwater-water-main",
    title: "Ville de Montreal: Water main work on Atwater Avenue",
    borough: "Westmount",
    startDate: "2026-05-01",
    endDate: "2026-11-30",
    impact: "Travaux d'aqueduc sur Atwater Avenue mentionnes par Westmount; entraves locales possibles.",
    trafficLabel: "Voie touchée",
    severity: "major",
    direction: "Atwater Avenue; direction precise non publiée sur la page.",
    streets: "Atwater Avenue",
    responsible: "Ville de Montreal / City of Westmount",
    source: "Westmount - Roadwork and Projects",
    sourceUrl: "https://westmount.org/en/urban-planning-and-infrastructure/roads-and-public-works/roadwork-and-projects",
    periods: ["day"],
    routeEndpoints: [[-73.5860, 45.4865], [-73.5825, 45.4930]],
    point: [-73.584, 45.490],
    geometry: { type: "Point", coordinates: [-73.584, 45.490] }
  },
  {
    id: "linked-kirkland-monsadel-hydrants-night",
    title: "Inspection des bornes d'incendie - secteur rue Monsadel",
    borough: "Kirkland",
    startDate: "2026-09-08",
    endDate: "2026-09-11",
    impact: "Inspection de nuit des bornes d'incendie dans le secteur 3; impact surtout aqueduc, circulation locale à surveiller.",
    trafficLabel: "Accès limite",
    severity: "moderate",
    direction: "Secteur rue Monsadel; direction routière non publiée.",
    streets: "Rue Monsadel et secteur 3",
    responsible: "Ville de Kirkland",
    source: "Kirkland - Info-Travaux",
    sourceUrl: "https://www.ville.kirkland.qc.ca/services-aux-citoyens/gestion-des--infrastructures/info-travaux",
    periods: ["night"],
    routeEndpoints: [[-73.8640, 45.4535], [-73.8585, 45.4565]],
    point: [-73.861, 45.455],
    geometry: { type: "Point", coordinates: [-73.861, 45.455] }
  }
];

const MONTREAL_CENTER = [45.5088, -73.5878];
const MAX_LIST_ITEMS = 220;
const MAX_AUTO_FIT_ITEMS = 350;
const ARROW_ZOOM_THRESHOLD = 14;
const ARROW_DENSE_LIMIT = 250;
const DATE_FORMATTER = new Intl.DateTimeFormat("fr-CA", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});
const formattedDateCache = new Map();

const dateStart = document.querySelector("#dateStart");
const dateEnd = document.querySelector("#dateEnd");
const todayDates = document.querySelector("#todayDates");
const dateHelp = document.querySelector("#dateHelp");
const dateHelpBubble = document.querySelector("#dateHelpBubble");
const sourceHelp = document.querySelector("#sourceHelp");
const sourceHelpBubble = document.querySelector("#sourceHelpBubble");
const sourceSectionToggle = document.querySelector("#sourceSectionToggle");
const sourceFilters = document.querySelector("#sourceFilters");
const impactHelp = document.querySelector("#impactHelp");
const impactHelpBubble = document.querySelector("#impactHelpBubble");
const timeHelp = document.querySelector("#timeHelp");
const timeHelpBubble = document.querySelector("#timeHelpBubble");
const municipalityHelp = document.querySelector("#municipalityHelp");
const municipalityHelpBubble = document.querySelector("#municipalityHelpBubble");
const municipalityList = document.querySelector("#municipalityList");
const searchFilter = document.querySelector("#searchFilter");
const categoryFilters = [...document.querySelectorAll(".source-filters input[type='checkbox']")];
const impactFilters = [...document.querySelectorAll(".impact-filters input[type='checkbox']")];
const timeFilters = [...document.querySelectorAll(".time-filters input[type='checkbox']")];
const impactCountElements = [...document.querySelectorAll("[data-impact-count]")];
const closureList = document.querySelector("#closureList");
const visibleCount = document.querySelector("#visibleCount");
const resetView = document.querySelector("#resetView");
const mapStatus = document.querySelector("#mapStatus");
const mapLegend = document.querySelector("#mapLegend");
const menuToggle = document.querySelector("#menuToggle");
const menuBackdrop = document.querySelector("#menuBackdrop");
const sidePanel = document.querySelector("#sidePanel");
const appShell = document.querySelector(".app-shell");
const sourcesToggle = document.querySelector("#sourcesToggle");
const sourcesClose = document.querySelector("#sourcesClose");
const sourceCard = document.querySelector("#sourceCard");
const mapFirstVisitHint = document.querySelector("#mapFirstVisitHint");
const mapFirstVisitClose = document.querySelector("#mapFirstVisitClose");
const panelResizeHandle = document.querySelector("#panelResizeHandle");

// Regional/pedestrian/linked-city entries are (re)loaded with routed geometry on startup;
// seeding their un-routed static versions here would let dedupeClosures keep the stale copy.
let allClosures = [
  ...window.CLOSURES.map(normalizeLegacyClosure).map(prepareClosureForRuntime)
];
let currentClosures = [];
let selectedClosureId = null;
let activeMapPopup = null;

const map = L.map("map", {
  preferCanvas: true,
  fadeAnimation: false,
  zoomAnimation: true,
  zoomAnimationThreshold: 8,
  markerZoomAnimation: true,
  zoomControl: true,
  zoomSnap: 0.25,
  zoomDelta: 0.25,
  minZoom: 10,
  maxZoom: 19
}).setView(MONTREAL_CENTER, 12);

const baseLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 20,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const closureLayer = L.layerGroup().addTo(map);
const arrowLayer = L.layerGroup().addTo(map);
const fastRenderer = L.canvas({ padding: 2.0 });
let mapRenderFrame = null;
const renderedClosureLayers = new Map();
// Les entraves hors ecran restent en memoire et sont dessinees des qu'elles entrent dans la vue.
const RENDER_VIEWPORT_PADDING = 0.35;

function closuresToRender() {
  const bounds = map.getBounds().pad(RENDER_VIEWPORT_PADDING);
  return currentClosures.filter((closure) => closureIntersectsBounds(closure, bounds));
}

function renderVisibleClosures() {
  renderMap(closuresToRender());
}

function scheduleMapRender() {
  cancelAnimationFrame(mapRenderFrame);
  mapRenderFrame = requestAnimationFrame(renderVisibleClosures);
}

function dismissMapFirstVisitHint() {
  mapFirstVisitHint.hidden = true;
  window.localStorage.setItem("mapClickHintSeen", "true");
}

function mapLineWidth(width) {
  const zoom = map.getZoom();
  const scale = Math.max(0.3, Math.min(1, 0.3 + (zoom - 10) * 0.1167));
  return Math.max(1, Math.round(width * scale));
}

// Overpass est utilise en GET: Nominatim est bloque par CORS depuis un site statique.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];
const NAMED_STREET_SEARCH_RADIUS = 800;
const NAMED_STREET_CLAUSE_CHUNK = 12;
const NAMED_STREET_FAILURE_LIMIT = 6;
const STREET_TYPE_WORDS = "rues?|ruelles?|avenues?|boulevards?|chemins?|routes?|autoroutes?|mont[ée]es?|c[ôo]tes?|rangs?|places?|impasses?|croissants?|terrasses?";
let namedStreetGeometryFailures = 0;
let overpassEndpointIndex = 0;
L.control.scale({ metric: true, imperial: false }).addTo(map);

baseLayer.on("load", () => {
  document.querySelectorAll(".leaflet-tile").forEach((tile) => {
    tile.style.opacity = "1";
  });
  map.invalidateSize();
});
baseLayer.on("tileerror", () => showMapStatus(t("map.tileError"), "error"));
map.on("moveend", () => {
  renderVisibleClosures();
  updateViewportList();
});

function escapeHtml(value) {
  return correctFrenchText(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;"
  }[character]));
}

function correctFrenchText(value) {
  if (currentLanguage() !== "fr") {
    return String(value ?? "");
  }

  const corrections = [
    [/\bMontreal\b/g, "Montréal"],
    [/\bQuebec\b/g, "Québec"],
    [/\bEvenements\b/g, "Événements"],
    [/\bevenements\b/g, "événements"],
    [/\bGreves\b/g, "Grèves"],
    [/\bgreves\b/g, "grèves"],
    [/\bprives\b/g, "privés"],
    [/\bPrives\b/g, "Privés"],
    [/\bliees\b/g, "liées"],
    [/\bLiees\b/g, "Liées"],
    [/\bfermees\b/g, "fermées"],
    [/\bfermee\b/g, "fermée"],
    [/\bFermee\b/g, "Fermée"],
    [/\bbloquee\b/g, "bloquée"],
    [/\bbloquees\b/g, "bloquées"],
    [/\bBloquee\b/g, "Bloquée"],
    [/\bcomplete\b/g, "complète"],
    [/\bComplete\b/g, "Complète"],
    [/\bAcces\b/g, "Accès"],
    [/\bacces\b/g, "accès"],
    [/\blimite\b/g, "limité"],
    [/\bLimite\b/g, "Limité"],
    [/\bretranchee\b/g, "retranchée"],
    [/\bretranchees\b/g, "retranchées"],
    [/\bDetour\b/g, "Détour"],
    [/\bdetours\b/g, "détours"],
    [/\bdetour\b/g, "détour"],
    [/\bprecisee\b/g, "précisée"],
    [/\bprecise\b/g, "précise"],
    [/\bpubliee\b/g, "publiée"],
    [/\bpublies\b/g, "publiés"],
    [/\bDonnees\b/g, "Données"],
    [/\bdonnees\b/g, "données"],
    [/\bgeometrie\b/g, "géométrie"],
    [/\bgeometries\b/g, "géométries"],
    [/\bdirection routiere\b/g, "direction routière"],
    [/\broutiere\b/g, "routière"],
    [/\broutieres\b/g, "routières"],
    [/\breseau\b/g, "réseau"],
    [/\bReseau\b/g, "Réseau"],
    [/\bprevoir\b/g, "prévoir"],
    [/\bprevus\b/g, "prévus"],
    [/\bprolongee\b/g, "prolongée"],
    [/\bprolongees\b/g, "prolongées"],
    [/\bindique\b/g, "indiqué"],
    [/\bindiquee\b/g, "indiquée"],
    [/\bplanifiee\b/g, "planifiée"],
    [/\bplanifies\b/g, "planifiés"],
    [/\bseparement\b/g, "séparément"],
    [/\bconseillee\b/g, "conseillée"],
    [/\ba consulter\b/g, "à consulter"],
    [/\ba confirmer\b/g, "à confirmer"],
    [/\ba prevoir\b/g, "à prévoir"],
    [/\ba surveiller\b/g, "à surveiller"],
    [/\ba venir\b/g, "à venir"],
    [/\ba cet\b/g, "à cet"],
    [/\ba cette\b/g, "à cette"],
    [/\ba l'/g, "à l'"],
    [/\ba la\b/g, "à la"],
    [/\bmeme\b/g, "même"],
    [/\bapres\b/g, "après"]
  ];

  return corrections.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), String(value ?? ""));
}

function renderMunicipalityLinks() {
  municipalityList.innerHTML = LINKED_MUNICIPALITIES.map((municipality) => `
    <a class="municipality-link" href="${escapeHtml(municipality.url)}" target="_blank" rel="noreferrer">
      <strong>${escapeHtml(municipality.name)}</strong>
      <span>${escapeHtml(municipality.detail)}</span>
      ${municipality.quality ? `<em>${escapeHtml(municipality.quality)}</em>` : ""}
    </a>
  `).join("");
}

function parseJson(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function dateOnly(value) {
  return String(value ?? "").slice(0, 10);
}

function parseDate(value) {
  return new Date(`${dateOnly(value)}T12:00:00`);
}

function formatDate(value) {
  const key = dateOnly(value);
  if (!formattedDateCache.has(key)) {
    const parsed = parseDate(key);
    formattedDateCache.set(key, Number.isNaN(parsed.valueOf()) ? (key || t("popup.notPublished")) : DATE_FORMATTER.format(parsed));
  }
  return formattedDateCache.get(key);
}

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRange() {
  const start = parseDate(dateStart.value);
  const end = parseDate(dateEnd.value || dateStart.value);
  return start <= end ? { start, end } : { start: end, end: start };
}

function overlapsDateRange(closure, range) {
  const startTime = closure._startTime ?? parseDate(closure.startDate).valueOf();
  const endTime = closure._endTime ?? parseDate(closure.endDate).valueOf();
  const hasStart = !Number.isNaN(startTime);
  const hasEnd = !Number.isNaN(endTime);
  // Entraves sans aucune date: toujours affichees, meme avec un range selectionne.
  if (!hasStart && !hasEnd) return true;
  const lower = hasStart ? startTime : -8640000000000000;
  const upper = hasEnd ? endTime : 8640000000000000;
  return lower <= range.end.valueOf() && upper >= range.start.valueOf();
}

function getActiveCategories() {
  return new Set(categoryFilters.filter((input) => input.checked).map((input) => input.value));
}

function getActiveImpacts() {
  return new Set(impactFilters.filter((input) => input.checked).map((input) => input.value));
}

function getActiveTimePeriods() {
  return new Set(timeFilters.filter((input) => input.checked).map((input) => input.value));
}

function matchesTimePeriod(closure, activePeriods) {
  return closure.periods.some((period) => activePeriods.has(period));
}

function matchesSearch(closure, query) {
  if (!query) {
    return true;
  }
  return (closure._searchText || prepareClosureForRuntime(closure)._searchText).includes(query);
}

function severityRank(severity) {
  return { critical: 0, major: 1, moderate: 2, parking: 3, minor: 4 }[severity] ?? 5;
}

function layerRank(closure) {
  const ranks = { parking: 0, minor: 1, moderate: 2, major: 3, critical: 4 };
  return ranks[closure.severity] ?? 1;
}

function getFilteredClosures() {
  const categories = getActiveCategories();
  const impacts = getActiveImpacts();
  const timePeriods = getActiveTimePeriods();
  const dateRange = getDateRange();
  const query = searchFilter.value.trim().toLowerCase();

  const filteredClosures = [];
  allClosures.forEach((closure) => {
    if (categories.has(closure.category)
      && impacts.has(closure.severity)
      && matchesTimePeriod(closure, timePeriods)
      && overlapsDateRange(closure, dateRange)
      && matchesSearch(closure, query)) {
      filteredClosures.push(closure);
    }
  });

  return filteredClosures.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

function getFilterBaseClosures() {
  const categories = getActiveCategories();
  const timePeriods = getActiveTimePeriods();
  const dateRange = getDateRange();
  const query = searchFilter.value.trim().toLowerCase();

  const filteredClosures = [];
  allClosures.forEach((closure) => {
    if (categories.has(closure.category)
      && matchesTimePeriod(closure, timePeriods)
      && overlapsDateRange(closure, dateRange)
      && matchesSearch(closure, query)) {
      filteredClosures.push(closure);
    }
  });

  return filteredClosures;
}

function getClosuresInViewport() {
  return filterClosuresToViewport(currentClosures);
}

function filterClosuresToViewport(closures) {
  const bounds = map.getBounds();
  return closures.filter((closure) => closureIntersectsBounds(closure, bounds));
}

function closureIntersectsBounds(closure, bounds) {
  const closureBounds = closure._bounds || prepareClosureForRuntime(closure)._bounds;
  if (!closureBounds) {
    return false;
  }

  const [west, south, east, north] = closureBounds;
  return east >= bounds.getWest()
    && west <= bounds.getEast()
    && north >= bounds.getSouth()
    && south <= bounds.getNorth();
}

function mapBoundsIntersectEnvelope(bounds, envelope) {
  return envelope.east >= bounds.getWest()
    && envelope.west <= bounds.getEast()
    && envelope.north >= bounds.getSouth()
    && envelope.south <= bounds.getNorth();
}

function updateViewportList() {
  const viewportClosures = getClosuresInViewport();
  renderList(viewportClosures);
  visibleCount.textContent = String(viewportClosures.length);
  updateImpactCounts();
}

function updateImpactCounts() {
  const counts = filterClosuresToViewport(getFilterBaseClosures()).reduce((result, closure) => {
    result[closure.severity] = (result[closure.severity] || 0) + 1;
    return result;
  }, {});

  impactCountElements.forEach((element) => {
    const impact = element.dataset.impactCount;
    const count = counts[impact] || 0;
    element.textContent = `(${count} ${count === 1 ? "visible" : "visibles"})`;
  });
}

function updateMapLegend() {
  const activeImpacts = getActiveImpacts();
  let visibleChipCount = 0;
  mapLegend.querySelectorAll("[data-legend-impact]").forEach((chip) => {
    const isVisible = activeImpacts.has(chip.dataset.legendImpact);
    chip.hidden = !isVisible;
    visibleChipCount += Number(isVisible);
  });
  mapLegend.hidden = visibleChipCount === 0;
}

function categoryFromAuthority(authority) {
  const value = String(authority ?? "").toLowerCase();
  if (value.includes("city") || value.includes("ville")) {
    return "municipal";
  }

  return "private";
}

function trafficDetailsFromImpact(impactType) {
  switch (impactType) {
    case "blocked":
      return { severity: "critical", label: "Fermeture complète", impact: "Circulation automobile bloquee sur le segment indique; détour probable." };
    case "trafficLane":
      return { severity: "major", label: "Voie de circulation retranchee", impact: "Une voie de circulation est touchée; ralentissements et détours locaux possibles." };
    case "trafficLaneAndParkingLane":
      return { severity: "major", label: "Voie et stationnement retranches", impact: "Une voie de circulation et le stationnement sont touches." };
    case "parkingLane":
      return { severity: "parking", label: "Stationnement interdit", impact: "La circulation reste ouverte, mais des places de stationnement sont retranchees ou interdites." };
    default:
      return null;
  }
}

function trafficDetailsFromUciType(type) {
  switch (type) {
    case "Rue fermée":
      return { severity: "critical", label: "Rue fermée", impact: "Circulation interdite pendant la periode indiquee." };
    case "Circulation locale":
      return { severity: "moderate", label: "Circulation locale", impact: "Accès limite aux residents et besoins locaux." };
    case "Double sens":
      return { severity: "moderate", label: "Double sens temporaire", impact: "Sens de circulation modifie; prudence aux intersections." };
    default:
      return { severity: "minor", label: type || "Restriction UCI", impact: "Restriction de circulation liee à l'evenement." };
  }
}

function normalizeRegionalClosure(closure) {
  const severity = SEVERITY_META[closure.severity] ?? SEVERITY_META.major;
  return {
    ...closure,
    sourceKind: "mobilite-montreal",
    roadType: closure.roadType || roadTypeFromText(`${closure.title} ${closure.streets}`),
    color: severity.color
  };
}

function normalizePedestrianStreet(closure) {
  const severity = SEVERITY_META[closure.severity] ?? SEVERITY_META.critical;
  return {
    ...closure,
    sourceKind: "seasonal-pedestrian-street",
    roadType: "street",
    color: severity.color,
    geometry: closure.geometry || { type: "Point", coordinates: closure.point }
  };
}

function normalizeLinkedCityWork(closure) {
  const severity = SEVERITY_META[closure.severity] ?? SEVERITY_META.moderate;
  return {
    ...closure,
    category: "municipal",
    sourceKind: "linked-city-work",
    roadType: closure.roadType || roadTypeFromText(`${closure.title} ${closure.streets}`),
    color: severity.color
  };
}

function normalizeQuebec511Feature(feature) {
  const properties = feature.properties ?? {};
  const traffic = quebec511TrafficDetails(properties);
  const severity = SEVERITY_META[traffic.severity] ?? SEVERITY_META.major;
  return {
    id: `q511-${properties.identifiant || feature.id}`,
    category: "q511",
    sourceKind: "quebec511-mtmd-wfs",
    title: properties.identificationDesTravaux || "Travaux routiers MTMD",
    responsible: "MTMD / Quebec 511",
    borough: quebec511LocationLabel(properties.localisation),
    startDate: dateOnlyFromTimestamp(properties.debut),
    endDate: dateOnlyFromTimestamp(properties.fin),
    impact: [properties.entrave, properties.detoursEtItinerairesFacultatifs].filter(Boolean).join(" - ") || "Détails de circulation non publiés.",
    trafficLabel: traffic.label,
    severity: traffic.severity,
    roadType: roadTypeFromText(`${properties.identificationDesTravaux || ""} ${properties.localisation || ""} ${properties.routeAutoroute || ""} ${properties.entraveType || ""}`),
    color: severity.color,
    direction: cleanQuebec511Direction(properties.direction, properties.localisation),
    streets: properties.localisation || properties.routeAutoroute || "Localisation non publiée",
    source: "MTMD - Travaux routiers / Quebec 511",
    sourceUrl: properties.urlFrancais || "https://www.quebec511.info/fr/Carte/Default.aspx",
    periods: quebec511Periods(properties.entrave),
    geometry: feature.geometry,
    point: representativePoint(feature.geometry),
    details: [["Type", properties.entraveType], ["Détour", properties.detoursEtItinerairesFacultatifs], ["Mise à jour MTMD", properties.miseAJour]]
  };
}

function quebec511TrafficDetails(properties) {
  // entraveType ne publie que l'ampleur des travaux (Mineure/Majeure); seul le
  // texte d'entrave decrit ce qui est reellement ferme.
  const entrave = String(properties.entrave || "").toLowerCase();

  if (/stationnement/.test(entrave)) {
    return { severity: "parking", label: "Stationnement touche" };
  }

  if (/fermeture\s+compl[eè]te|route\s+barr|autoroute\s+barr/.test(entrave)) {
    return { severity: "critical", label: "Fermeture routière" };
  }

  // "Fermeture de 1 voie sur 2" ou "voie de virage fermee" laissent la route ouverte.
  if (/\bvoies?\b/.test(entrave) && /ferm/.test(entrave) && !/voie\s+de\s+desserte/.test(entrave)) {
    return { severity: "major", label: "Voie fermée" };
  }

  if (/\b(?:route|autoroute|pont|tunnel|viaduc|chauss[eé]e|chemin|rue|avenue|boulevard|acc[eè]s|sortie|entr[eé]e|bretelles?|desserte|traverse)\b[^]{0,40}?ferm/.test(entrave)
    || /\bferm[ée]e?s?\b/.test(entrave)) {
    return { severity: "critical", label: "Fermeture routière" };
  }

  if (/alternance|contresens|d[eé]vi|r[eé]tr[eé]ci|\bvoies?\b|circulation/.test(entrave)) {
    return { severity: "major", label: "Voie touchée" };
  }

  return { severity: "moderate", label: "Accès limite" };
}

function quebec511Periods(entrave) {
  const text = String(entrave || "").toLowerCase();
  if (/nuit|23 h|0 h|tous les jours|en tout temps/.test(text)) {
    return ["day", "night"];
  }
  return ["day"];
}

function quebec511LocationLabel(location) {
  const match = String(location || "").match(/À\s+([^,]+)/i);
  return match ? match[1] : "Quebec";
}

function normalizeQuebec511Event(feature) {
  const p = feature.properties ?? {};
  const geometry = feature.geometry;
  if (!geometry?.coordinates?.length) return null;

  const localisation = String(p.localisation || "").replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim();
  const entrave = String(p.entrave || "").trim();
  const cause = String(p.cause || "").trim();
  const consequence = String(p.consequence || "").trim();
  const combined = `${entrave} ${consequence} ${localisation}`.toLowerCase();

  let severity;
  let trafficLabel;
  if (/(?:pont|route|autoroute|voie)\s+ferm|fermeture(?!\s+de\s+\d)/.test(combined) || /\bferm[ée]e?\b/.test(combined) && !/1 voie|une voie/.test(combined)) {
    severity = "critical";
    trafficLabel = "Fermeture";
  } else if (/alternance|contresens|1 voie|une voie|voie de gauche|voie de droite|fermeture de \d/.test(combined)) {
    severity = "major";
    trafficLabel = entrave || "Voie touchée";
  } else {
    severity = "moderate";
    trafficLabel = entrave || "Restriction routière";
  }

  const road = p.numeroRoute ? (/^\d/.test(String(p.numeroRoute)) ? `Route ${p.numeroRoute}` : String(p.numeroRoute)) : "";
  const title = [road, localisation].filter(Boolean).join(" - ").slice(0, 90) || "Événement routier MTMD";
  const startDate = /^\d{4}-\d{2}-\d{2}/.test(p.enVigueurDepuis || "") ? p.enVigueurDepuis.slice(0, 10) : new Date().toISOString().slice(0, 10);
  // Les evenements MTMD sont de duree indeterminee: on les traite comme en cours.
  const endDate = "2099-12-31";

  return {
    id: `q511-event-${p.identifiant}`,
    category: "q511",
    sourceKind: "quebec511-event",
    title,
    responsible: "Transports Québec (MTMD) / Quebec 511",
    borough: p.municipalite || quebec511LocationLabel(localisation),
    startDate,
    endDate,
    impact: [localisation, cause && `Cause : ${cause}`, consequence && `Conséquence : ${consequence}`, p.duree && `Durée : ${p.duree}`].filter(Boolean).join(" | ") || "Détails non publiés.",
    trafficLabel,
    severity,
    roadType: roadTypeFromText(`${road} ${localisation}`),
    color: SEVERITY_META[severity].color,
    direction: p.direction ? `En direction ${p.direction}.` : "Direction non précisée.",
    streets: localisation || road || "Localisation non publiée",
    source: "MTMD / Quebec 511 - Événements",
    sourceUrl: "https://www.quebec511.info/fr/Carte/Default.aspx",
    periods: ["day", "night"],
    geometry,
    point: representativePoint(geometry),
    details: [["Cause", cause], ["Conséquence", consequence], ["Durée", p.duree], ["Détour", p.detour], ["Référence", p.identifiant]]
  };
}

function normalizeLongueuilFeature(feature, layerKind) {
  const properties = feature.properties ?? {};
  if (!properties.DATE_DEBUT || !properties.DATE_FIN || !feature.geometry) {
    return null;
  }

  const roadImpact = longueuilRoadImpact(properties.REPERCUSSIONS_ENTRAVE, properties.AUTRES_REPERCUSSIONS);
  if (!roadImpact) {
    return null;
  }

  const severity = SEVERITY_META[roadImpact.severity] ?? SEVERITY_META.major;
  const title = properties.NOM_ENTRAVE || properties.LOCALISATION_ENTRAVE || properties.DESCRIPTION || "Entrave Longueuil";
  const location = properties.LOCALISATION_ENTRAVE || properties.DESCRIPTION || title;

  return {
    id: `longueuil-${layerKind}-${properties.OBJECTID || properties.GLOBALID}`,
    title: `${roadImpact.label} - ${title}`,
    category: "municipal",
    sourceKind: `longueuil-${layerKind}`,
    responsible: longueuilResponsibleLabel(properties),
    borough: "Longueuil",
    startDate: dateOnlyFromTimestamp(properties.DATE_DEBUT),
    endDate: dateOnlyFromTimestamp(properties.DATE_FIN),
    impact: roadImpact.impact,
    trafficLabel: roadImpact.label,
    severity: roadImpact.severity,
    roadType: roadTypeFromText(`${title} ${location}`),
    periods: ["day", "night"],
    direction: "Direction precise non publiée dans les attributs Longueuil; consulter la signalisation locale.",
    streets: cleanLongueuilText(location),
    source: "Ville de Longueuil - Gestion des entraves",
    sourceUrl: properties.URL || "https://www.longueuil.quebec/fr/travaux-routiers",
    color: severity.color,
    geometry: feature.geometry,
    point: representativePoint(feature.geometry),
    rawType: properties.REPERCUSSIONS_ENTRAVE
  };
}

function longueuilRoadImpact(repercussions, otherRepercussions) {
  const value = `${repercussions || ""},${otherRepercussions || ""}`;
  if (!/Fermeture_Complete|Circ_Deviee_Alternance|Retrait_Temporaire_Stationnement/i.test(value)) {
    return null;
  }

  if (/Fermeture_Complete/i.test(value)) {
    return { severity: "critical", label: "Fermeture complète", impact: cleanLongueuilText(value) };
  }

  if (/Circ_Deviee_Alternance/i.test(value)) {
    return { severity: "major", label: "Circulation deviee ou alternee", impact: cleanLongueuilText(value) };
  }

  return { severity: "parking", label: "Stationnement retire", impact: cleanLongueuilText(value) };
}

function longueuilResponsibleLabel(properties) {
  if (properties.AUTRE_RESPONSABLE) {
    return cleanLongueuilText(properties.AUTRE_RESPONSABLE);
  }

  const labels = {
    1: "Ville de Longueuil",
    2: "Entrepreneur ou partenaire",
    3: "Service public ou réseau technique"
  };

  return labels[properties.RESPONSABLE] || "Ville de Longueuil";
}

function cleanLongueuilText(value) {
  return String(value || "Non precise")
    .replace(/_/g, " ")
    .replace(/Circ Deviee Alternance/g, "Circulation deviee ou en alternance")
    .replace(/Fermeture Complete/g, "Fermeture complète")
    .replace(/Retrait Temporaire Stationnement/g, "Retrait temporaire du stationnement")
    .replace(/Trottoirs Liens Cyclable Inaccès/g, "trottoirs ou liens cyclables inaccèssibles")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function dateOnlyFromTimestamp(value) {
  if (value === null || value === undefined || value === "") return "";
  // Dates MTMD locales "AAAA/MM/JJ HH:MM:SS" ou ISO: prendre la date telle quelle sans conversion UTC.
  const match = String(value).match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const timestamp = Number(value);
  const date = Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp) : new Date(value);
  if (Number.isNaN(date.valueOf())) return dateOnly(value);
  // Composantes locales pour eviter un decalage de jour en UTC.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function cleanQuebec511Direction(direction, text) {
  const source = `${direction || ""} ${text || ""}`;
  if (/deux directions|deux sens/i.test(source)) {
    return "Dans les deux directions.";
  }

  const match = source.match(/En direction\s+(NORD|SUD|EST|OUEST|Nord|Sud|Est|Ouest)/i);
  if (match) {
    return `En direction ${match[1].toUpperCase()}.`;
  }

  if (/direction nord/i.test(source)) return "En direction NORD.";
  if (/direction sud/i.test(source)) return "En direction SUD.";
  if (/direction est/i.test(source)) return "En direction EST.";
  if (/direction ouest/i.test(source)) return "En direction OUEST.";
  return "Direction non précisée dans Quebec 511.";
}

async function loadLinkedCityWorks() {
  const routedWorks = await Promise.all(LINKED_CITY_WORKS.map(async (work) => {
    if (!work.routeEndpoints) {
      return normalizeLinkedCityWork(work);
    }

    try {
      const geometry = await fetchRouteGeometry(work.routeEndpoints);
      return normalizeLinkedCityWork({
        ...work,
        geometry,
        point: representativePoint(geometry)
      });
    } catch (error) {
      console.warn("Linked-city route alignment failed", work.id, error);
      return normalizeLinkedCityWork(work);
    }
  }));

  return routedWorks;
}

async function loadRegionalClosures() {
  const routedClosures = await Promise.all(REGIONAL_MAJOR_CLOSURES.map(async (closure) => {
    if (!closure.routeEndpoints) {
      return normalizeRegionalClosure(closure);
    }

    try {
      const geometry = await fetchRouteGeometry(closure.routeEndpoints);
      return normalizeRegionalClosure({
        ...closure,
        geometry,
        point: representativePoint(geometry)
      });
    } catch (error) {
      console.warn("Regional route alignment failed", closure.id, error);
      return normalizeRegionalClosure(closure);
    }
  }));

  return routedClosures;
}

async function loadSeasonalPedestrianStreets() {
  return SEASONAL_PEDESTRIAN_STREETS.map((street) => normalizePedestrianStreet(street));
}

async function loadLongueuilClosures() {
  const surfaceData = await fetchJson(LIVE_SOURCES.longueuilSurfaces);

  return (surfaceData.features || [])
    .map((feature) => normalizeLongueuilFeature(feature, "surface"))
    .filter(Boolean);
}

// Le query de Laval renvoie geometry:null, mais identify sur une enveloppe couvrant
// tout le territoire retourne chaque entrave avec sa geometrie officielle.
async function loadLavalClosures() {
  const southWest = map.options.crs.project(L.latLng(LAVAL_OFFICIAL_BOUNDS.south, LAVAL_OFFICIAL_BOUNDS.west));
  const northEast = map.options.crs.project(L.latLng(LAVAL_OFFICIAL_BOUNDS.north, LAVAL_OFFICIAL_BOUNDS.east));
  const envelope = {
    xmin: southWest.x,
    ymin: southWest.y,
    xmax: northEast.x,
    ymax: northEast.y,
    spatialReference: { wkid: 102100 }
  };
  const params = new URLSearchParams({
    f: "json",
    geometry: JSON.stringify(envelope),
    geometryType: "esriGeometryEnvelope",
    sr: "3857",
    mapExtent: `${envelope.xmin},${envelope.ymin},${envelope.xmax},${envelope.ymax}`,
    imageDisplay: "2000,1400,96",
    tolerance: "1",
    layers: `all:${LAVAL_LAYERS.map((layer) => layer.id).join(",")}`,
    returnGeometry: "true",
    maxAllowableOffset: "1"
  });

  const data = await fetchJson(`${LIVE_SOURCES.lavalMapService}/identify?${params}`, { timeout: 30000 });
  return (data.results || []).map(normalizeLavalIdentifyResult).filter(Boolean);
}

async function loadQuebec511Closures() {
  const data = await fetchJson(LIVE_SOURCES.quebec511);
  return (data.features || [])
    .filter((feature) => feature.geometry?.coordinates?.length && intersectsGreaterMontreal(feature))
    .map(normalizeQuebec511Feature);
}

async function loadQuebec511Events() {
  const data = await fetchJson(LIVE_SOURCES.quebec511Events);
  return (data.features || [])
    .filter((feature) => feature.geometry?.coordinates?.length && intersectsGreaterMontreal(feature))
    .map(normalizeQuebec511Event)
    .filter(Boolean);
}

async function loadRepentignyClosures() {
  const data = await fetchJson(LIVE_SOURCES.repentignyOpen511);
  return (data.events || [])
    .filter((event) => event.status === "ACTIVE" && event.geography?.coordinates?.length && event.schedule?.intervals?.length)
    .map(normalizeRepentignyEvent)
    .filter(Boolean);
}

function normalizeRepentignyEvent(event) {
  const interval = event.schedule.intervals[0] || "";
  const [startDate, endDate] = interval.split("/");
  const road = event.roads?.[0];
  if (!startDate || !endDate || !road || !event.geography) {
    return null;
  }

  // Open511 publie UNKNOWN, MINOR, MODERATE ou MAJOR: aucune de ces valeurs ne
  // signifie une fermeture complete, seul le texte publie l'indique.
  const traffic = repentignyTrafficDetails(event);
  const severity = traffic.severity;
  const geometry = event.geography;
  const sourceUrl = event.url?.startsWith("http")
    ? event.url
    : `https://info-travaux.ville.repentigny.qc.ca${event.url || ""}`;

  return {
    id: `repentigny-open511-${event.id || event.url}`,
    title: event.headline || event.description || "Entrave routière à Repentigny",
    category: "municipal",
    sourceKind: "repentigny-open511",
    responsible: "Ville de Repentigny",
    borough: "Repentigny",
    startDate: startDate.slice(0, 10),
    endDate: endDate.split("T")[0],
    impact: [event.description, event.detour].filter(Boolean).join(" - ") || "Impact automobile publié par la Ville de Repentigny.",
    trafficLabel: traffic.label,
    severity,
    roadType: roadTypeFromText(`${road.name} ${event.headline || ""}`),
    periods: ["day", "night"],
    direction: road.direction || "Direction non publiée.",
    streets: `${road.name}${road.from && road.to ? `, entre ${road.from} et ${road.to}` : ""}`,
    source: "Ville de Repentigny - Open511",
    sourceUrl,
    color: SEVERITY_META[severity].color,
    geometry,
    point: representativePoint(geometry),
    rawType: event.event_type
  };
}

function repentignyTrafficDetails(event) {
  const text = `${event.headline || ""} ${event.description || ""}`.toLowerCase();
  const published = String(event.severity || "").toUpperCase();

  if (/\bvoies?\b/.test(text) && /ferm/.test(text)) {
    return { severity: "major", label: "Voie fermée" };
  }

  if (/fermeture\s+compl[eè]te|\b(?:route|rue|chemin|pont|boulevard|avenue|acc[eè]s|bretelle)\b[^]{0,40}?ferm|\bbarr[ée]e?s?\b/.test(text)) {
    return { severity: "critical", label: "Fermeture complète" };
  }

  if (published === "MAJOR") {
    return { severity: "major", label: "Voie touchée" };
  }

  if (published === "MODERATE" || published === "MINOR") {
    return { severity: "moderate", label: "Accès limité" };
  }

  return { severity: "major", label: "Voie touchée" };
}

async function loadMunicipalArcgisClosures() {
  const sources = [
    [LIVE_SOURCES.saintEustacheLines, normalizeSaintEustacheFeature],
    [LIVE_SOURCES.saintEustachePoints, normalizeSaintEustacheFeature],
    [LIVE_SOURCES.chateauguayWorks, normalizeChateauguayFeature],
    [LIVE_SOURCES.assomptionIncidents, normalizeAssomptionFeature]
  ];
  const results = await Promise.all(sources.map(async ([endpoint, normalizer]) => {
    try {
      const params = new URLSearchParams({ f: "json", where: "1=1", outFields: "*", returnGeometry: "true", outSR: "4326", resultRecordCount: "2000" });
      const data = await fetchJson(`${endpoint}/query?${params}`);
      return (data.features || []).map((feature) => normalizer(feature)).filter(Boolean);
    } catch (error) {
      console.warn("Municipal ArcGIS source failed", endpoint, error);
      return [];
    }
  }));
  return results.flat();
}

async function loadDorvalAndBoisbriandClosures() {
  const sources = [
    [LIVE_SOURCES.dorvalEntraves, normalizeDorvalFeature],
    [LIVE_SOURCES.boisbriandWorks, normalizeBoisbriandFeature]
  ];
  const results = await Promise.all(sources.map(async ([endpoint, normalizer]) => {
    try {
      const params = new URLSearchParams({ f: "json", where: "1=1", outFields: "*", returnGeometry: "true", outSR: "4326", resultRecordCount: "2000" });
      const data = await fetchJson(`${endpoint}/query?${params}`);
      return (data.features || []).map((feature) => normalizer(feature)).filter(Boolean);
    } catch (error) {
      console.warn("Dorval/Boisbriand source failed", endpoint, error);
      return [];
    }
  }));
  return results.flat();
}

async function loadTerrebonneClosures() {
  const endpoints = [
    LIVE_SOURCES.terrebonneEntraveLines,
    LIVE_SOURCES.terrebonneEntravePoints
  ];
  const results = await Promise.all(endpoints.map(async (endpoint) => {
    try {
      const params = new URLSearchParams({ f: "json", where: "1=1", outFields: "*", returnGeometry: "true", outSR: "4326", resultRecordCount: "2000" });
      const data = await fetchJson(`${endpoint}/query?${params}`);
      return (data.features || []).map(normalizeTerrebonneFeature).filter(Boolean);
    } catch (error) {
      console.warn("Terrebonne ArcGIS source failed", endpoint, error);
      return [];
    }
  }));
  return results.flat();
}

async function loadMontSaintHilaireClosures() {
  const layers = [3, 4, 5, 6, 15];
  const results = await Promise.all(layers.map(async (layerId) => {
    try {
      const params = new URLSearchParams({ f: "json", where: "1=1", outFields: "*", returnGeometry: "true", outSR: "4326", resultRecordCount: "2000" });
      const data = await fetchJson(`${LIVE_SOURCES.montSaintHilaireWorks}/${layerId}/query?${params}`);
      return (data.features || []).map((feature) => normalizeMontSaintHilaireFeature(feature)).filter(Boolean);
    } catch (error) {
      console.warn("Mont-Saint-Hilaire ArcGIS source failed", layerId, error);
      return [];
    }
  }));
  return results.flat();
}

async function loadMontRoyalSnapshotClosures() {
  const snapshot = await fetchJson(LIVE_SOURCES.montRoyalSnapshot);
  return (snapshot.records || []).map((record) => {
    const labels = record.trafficLabels || [];
    const hasClosure = labels.some((label) => /fermeture complète|fermeture complete/i.test(label));
    const hasLaneImpact = labels.some((label) => /entrave partielle|voie|circulation locale/i.test(label));
    const hasParkingImpact = labels.some((label) => /stationnement/i.test(label));
    const severity = hasClosure ? "critical" : hasParkingImpact && !hasLaneImpact ? "parking" : hasLaneImpact ? "major" : "moderate";
    const trafficLabel = hasClosure ? "Fermeture complète" : hasParkingImpact && !hasLaneImpact ? "Stationnement interdit" : hasLaneImpact ? "Voie touchée" : "Accès limité";
    return {
      ...record,
      category: "municipal",
      sourceKind: "mont-royal-snapshot",
      responsible: "Ville de Mont-Royal",
      borough: "Mont-Royal",
      trafficLabel,
      severity,
      roadType: roadTypeFromText(`${record.title} ${record.streets}`),
      periods: ["day", "night"],
      source: "Ville de Mont-Royal - Snapshot statique",
      color: SEVERITY_META[severity].color,
      point: representativePoint(record.geometry),
      details: [["Extraction", snapshot.extractedAt], ["Impacts publiés", labels.join(", ")], ["Référence", record.reference]]
    };
  });
}

async function loadBeaconsfieldSnapshotClosures() {
  const snapshot = await fetchJson(LIVE_SOURCES.beaconsfieldSnapshot);
  return (snapshot.records || []).map((record) => {
    const labels = record.trafficLabels || [];
    const hasClosure = labels.some((label) => /fermeture complète|fermeture complete/i.test(label));
    const hasMajor = labels.some((label) => /entrave majeure|reconfiguration/i.test(label));
    const hasLaneImpact = labels.some((label) => /entrave partielle|voie|circulation locale/i.test(label));
    const severity = hasClosure ? "critical" : hasMajor ? "critical" : hasLaneImpact ? "major" : "moderate";
    const trafficLabel = hasClosure ? "Fermeture complète" : hasMajor ? "Entrave majeure" : hasLaneImpact ? "Entrave partielle" : "Travaux municipaux";
    return {
      ...record,
      category: "municipal",
      sourceKind: "beaconsfield-snapshot",
      responsible: "Ville de Beaconsfield",
      borough: "Beaconsfield",
      trafficLabel,
      severity,
      roadType: roadTypeFromText(`${record.title} ${record.streets}`),
      periods: ["day", "night"],
      source: "Ville de Beaconsfield - Snapshot statique",
      color: SEVERITY_META[severity].color,
      point: representativePoint(record.geometry),
      details: [["Extraction", snapshot.extractedAt], ["Nature des travaux", labels.join(", ")], ["Référence", record.reference]]
    };
  });
}

async function loadMontrealPedestrianSnapshotClosures() {
  const snapshot = await fetchJson(LIVE_SOURCES.montrealPedestrianSnapshot);
  // Projets dont le trace est deja fourni a la main dans SEASONAL_PEDESTRIAN_STREETS.
  const duplicateProjects = new Set(["RP0004", "RP0029", "RP0047"]);
  const currentYear = new Date().getFullYear();
  return (snapshot.records || [])
    .filter((record) => record.geometry?.type === "LineString" && !duplicateProjects.has(record.projectId))
    .map((record) => {
      const title = String(record.title || record.streetName || "Rue piétonne").replace(/\s+/g, " ").trim();
      const limits = (record.limits || []).filter(Boolean).map((value) => value.trim()).join(" et ");
      const streets = limits ? `${record.streetName} (entre ${limits})` : record.streetName;
      const seasonal = /saisonn|estival/i.test(record.modeImplantation || "");
      const startDate = seasonal ? `${currentYear}-05-15` : (/^\d{4}-\d{2}-\d{2}$/.test(record.dateOuverture || "") ? record.dateOuverture : `${currentYear}-01-01`);
      const endDate = seasonal ? `${currentYear}-10-31` : "2099-12-31";
      return {
        id: record.id,
        title: `${title} (rue piétonne)`,
        category: "commercial",
        sourceKind: "montreal-pedestrian-opendata",
        responsible: `Ville de Montréal (${record.borough || "Montréal"})`,
        borough: record.borough || "Montréal",
        startDate,
        endDate,
        impact: `${record.typeRepartage || "Rue piétonne ou partagée."} Implantation: ${record.modeImplantation || "Non précisé"}.`,
        trafficLabel: "Rue piétonne",
        severity: "critical",
        roadType: "street",
        direction: "Fermée ou restreinte à la circulation automobile.",
        streets,
        source: "Ville de Montréal - Rues piétonnes et partagées (API)",
        sourceUrl: record.sourceUrl,
        periods: ["day", "night"],
        color: SEVERITY_META.critical.color,
        geometry: record.geometry,
        point: record.point || representativePoint(record.geometry),
        details: [
          ["Référence projet", record.projectId],
          ["Limites", (record.limits || []).filter(Boolean).map((value) => value.trim()).join(" à ")],
          ["Longueur publiée", record.publishedLengthMeters ? `${record.publishedLengthMeters} m` : "Non publiée"],
          ["Implantation", record.modeImplantation || "Non précisé"],
          ["Géométrie", record.geometryStatus]
        ]
      };
    });
}

function montSaintHilaireScheduleDates(schedule) {
  const value = String(schedule || "").toLowerCase();
  if (!value) return ["", ""];
  const year = value.match(/20\d{2}/)?.[0] || "";
  if (!year) return ["", ""];
  const startsSummer = /été|ete/.test(value);
  const startsAutumn = /automne/.test(value);
  if (startsSummer && startsAutumn) return [`${year}-06-01`, `${year}-11-30`];
  if (startsSummer) return [`${year}-06-01`, `${year}-08-31`];
  if (startsAutumn) return [`${year}-09-01`, `${year}-11-30`];
  return ["", ""];
}

function normalizeMontSaintHilaireFeature(feature) {
  const p = feature.attributes || {};
  const geometry = esriGeometryToGeoJson(feature.geometry);
  const [startDate, endDate] = montSaintHilaireScheduleDates(p.ECHEANCIER);
  if (!geometry || !p.PROJET || !startDate || !endDate) return null;
  const severity = "major";
  return {
    id: `mont-saint-hilaire-${p.OBJECTID || p.FID}-${p.PROJET}`,
    title: p.PROJET,
    category: "municipal",
    sourceKind: "mont-saint-hilaire-arcgis",
    responsible: "Ville de Mont-Saint-Hilaire",
    borough: "Mont-Saint-Hilaire",
    startDate,
    endDate,
    impact: `${p.Nature || "Travaux routiers"}${p.TRONÇON ? ` - ${p.TRONÇON}` : ""}`,
    trafficLabel: "Voie touchée",
    severity,
    roadType: roadTypeFromText(`${p.PROJET} ${p.TRONÇON || ""}`),
    periods: ["day", "night"],
    direction: "Direction non publiée.",
    streets: p.TRONÇON || p.PROJET,
    source: "Ville de Mont-Saint-Hilaire - Carte Info-travaux",
    sourceUrl: "https://experience.arcgis.com/experience/f6ea6c5a42f5440c970ec7a8bb5b17d4",
    color: SEVERITY_META[severity].color,
    geometry,
    point: representativePoint(geometry),
    details: [["Échéancier publié", p.ECHEANCIER], ["Entrepreneur", p.ENTRE], ["Nature", p.Nature]]
  };
}

function normalizeTerrebonneFeature(feature) {
  const p = feature.attributes || {};
  const geometry = esriGeometryToGeoJson(feature.geometry);
  const endDate = dateOnlyFromTimestamp(p.date_fin);
  const impact = [p.type_entrave, p.note_type_entrave, p.type_circulation, p.note_type_circulation, p.description].filter(Boolean).join(" - ");
  if (!geometry || !p.localisation || p.statut_avis !== "Actif" || (endDate && endDate < new Date().toISOString().slice(0, 10))) return null;

  const severity = municipalSeverity(impact);
  const critical = severity === "critical";
  return {
    id: `terrebonne-${p.globalid || p.OBJECTID}`,
    title: `${p.type_entrave || "Entrave routière"} - ${p.localisation}`,
    category: "municipal",
    sourceKind: "terrebonne-arcgis",
    responsible: "Ville de Terrebonne",
    borough: "Terrebonne",
    startDate: dateOnlyFromTimestamp(p.date_debut),
    endDate,
    impact: impact || "Impact automobile publié par la Ville de Terrebonne.",
    trafficLabel: critical ? "Fermeture complète" : "Voie touchée",
    severity,
    roadType: roadTypeFromText(p.localisation),
    periods: ["day", "night"],
    direction: p.note_type_circulation || "Direction non publiée.",
    streets: p.localisation,
    source: "Ville de Terrebonne - Carte des travaux",
    sourceUrl: "https://cartographie.ville.terrebonne.qc.ca/travaux/",
    color: SEVERITY_META[severity].color,
    geometry,
    point: representativePoint(geometry),
    details: [["Horaire", p.horaire], ["Type d'entrave", p.type_entrave], ["Détour", p.note_type_circulation]]
  };
}

function normalizeDorvalFeature(feature) {
  const p = feature.attributes || {};
  const geometry = esriGeometryToGeoJson(feature.geometry);
  const endDate = dateOnlyFromTimestamp(p.DateFin);
  if (!geometry || p.StatusEntr !== "Actif" || !endDate || endDate < new Date().toISOString().slice(0, 10)) return null;
  const description = p.REMARQUE || `Entrave ${p.NO_ENTRAVE || ""}`;
  const severity = municipalSeverity(description);
  return {
    id: `dorval-${p.FID}`,
    title: `${p.NO_ENTRAVE || "Entrave routière"} - ${description}`,
    category: "municipal",
    sourceKind: "dorval-arcgis",
    responsible: "Ville de Dorval",
    borough: "Dorval",
    startDate: dateOnlyFromTimestamp(p.DateDebut),
    endDate,
    impact: description,
    trafficLabel: severity === "critical" ? "Fermeture complète" : "Accès limité",
    severity,
    roadType: roadTypeFromText(description),
    roadSearchText: description,
    periods: ["day", "night"],
    direction: "Direction non publiée.",
    streets: description,
    source: "Ville de Dorval - Entraves",
    sourceUrl: "https://www.arcgis.com/apps/mapviewer/index.html?url=https://services2.arcgis.com/UfBk83iw7IIXzPRW/ArcGIS/rest/services/Entraves2410_Vue/FeatureServer/34&source=sd",
    color: SEVERITY_META[severity].color,
    geometry,
    point: representativePoint(geometry),
    details: [["Référence", p.NO_ENTRAVE], ["Type", p.TYPE_ENTRA]]
  };
}

function normalizeBoisbriandFeature(feature) {
  const p = feature.attributes || {};
  const geometry = esriGeometryToGeoJson(feature.geometry);
  const endDate = dateOnlyFromTimestamp(p.DateFin);
  const impact = [p.Impact, p.InfoSup].filter(Boolean).join(" - ");
  if (!geometry || !p.Description || !endDate || endDate < new Date().toISOString().slice(0, 10) || /^test\b/i.test(p.Description) || !impact || /rien/i.test(impact)) return null;
  const severity = municipalSeverity(impact);
  return {
    id: `boisbriand-${p.GlobalID || p.OBJECTID}`,
    title: p.Description,
    category: "municipal",
    sourceKind: "boisbriand-arcgis",
    responsible: "Ville de Boisbriand",
    borough: "Boisbriand",
    startDate: dateOnlyFromTimestamp(p.DateDebut),
    endDate,
    impact,
    trafficLabel: severity === "critical" ? "Fermeture complète" : "Voie touchée",
    severity,
    roadType: roadTypeFromText(`${p.Description} ${impact}`),
    roadSearchText: impact,
    periods: ["day", "night"],
    direction: "Direction non publiée.",
    streets: p.Description,
    source: "Ville de Boisbriand - Travaux",
    sourceUrl: "https://www.arcgis.com/apps/mapviewer/index.html?url=https://services3.arcgis.com/x2965icj4V1l01th/ArcGIS/rest/services/Info_travaux_2026/FeatureServer/2&source=sd",
    color: SEVERITY_META[severity].color,
    geometry,
    point: representativePoint(geometry),
    details: [["Période", p.PeriodeTravaux], ["Détour", p.Detour]]
  };
}

function esriGeometryToGeoJson(geometry) {
  if (!geometry) return null;
  if (typeof geometry.x === "number" && typeof geometry.y === "number") {
    return { type: "Point", coordinates: [geometry.x, geometry.y] };
  }
  if (Array.isArray(geometry.paths)) {
    return geometry.paths.length === 1
      ? { type: "LineString", coordinates: geometry.paths[0] }
      : { type: "MultiLineString", coordinates: geometry.paths };
  }
  if (Array.isArray(geometry.rings)) {
    return { type: "Polygon", coordinates: geometry.rings };
  }
  return null;
}

function municipalSeverity(text) {
  const value = String(text || "").toLowerCase();
  if (/fermeture complète|fermeture complete|toutes les voies sont fermées|toutes les voies sont fermees|rue fermée|rue fermee/.test(value)) return "critical";
  if (/certaines voies|voie fermée|voie fermee|alternée|alternee|entrave partielle/.test(value)) return "major";
  return "moderate";
}

function overpassNamePattern(value) {
  return String(value).replace(/[\\.^$|()[\]{}*+?]/g, "\\$&");
}

function streetNameMatches(candidate, wanted) {
  const first = String(candidate || "").toLowerCase();
  const second = String(wanted || "").toLowerCase();
  return Boolean(first) && Boolean(second) && (first.includes(second) || second.includes(first));
}

function metersBetween([lonA, latA], [lonB, latB]) {
  const radius = 6371000;
  const firstLat = (latA * Math.PI) / 180;
  const secondLat = (latB * Math.PI) / 180;
  const deltaLat = ((latB - latA) * Math.PI) / 180;
  const deltaLon = ((lonB - lonA) * Math.PI) / 180;
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(value));
}

// Raccorde les troncons OSM contigus sans jamais relier deux extremites eloignees.
function stitchStreetSegments(segments) {
  const remaining = segments.filter((segment) => segment.length >= 2).map((segment) => segment.slice());
  if (remaining.length === 0) {
    return [];
  }

  let polyline = remaining.shift();
  let joined = true;
  while (remaining.length > 0 && joined) {
    joined = false;
    for (let index = 0; index < remaining.length; index += 1) {
      const segment = remaining[index];
      const head = polyline[0];
      const tail = polyline[polyline.length - 1];
      if (metersBetween(tail, segment[0]) < 8) {
        polyline = polyline.concat(segment.slice(1));
      } else if (metersBetween(tail, segment[segment.length - 1]) < 8) {
        polyline = polyline.concat(segment.slice().reverse().slice(1));
      } else if (metersBetween(head, segment[segment.length - 1]) < 8) {
        polyline = segment.concat(polyline.slice(1));
      } else if (metersBetween(head, segment[0]) < 8) {
        polyline = segment.slice().reverse().concat(polyline.slice(1));
      } else {
        continue;
      }
      remaining.splice(index, 1);
      joined = true;
      break;
    }
  }

  return polyline;
}

function distanceToSegment(point, start, end) {
  const scale = Math.cos((point[1] * Math.PI) / 180) || 1;
  const projectedX = (coordinate) => coordinate[0] * scale;
  const deltaX = projectedX(end) - projectedX(start);
  const deltaY = end[1] - start[1];
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  const ratio = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((projectedX(point) - projectedX(start)) * deltaX + (point[1] - start[1]) * deltaY) / lengthSquared));
  return metersBetween(point, [(projectedX(start) + ratio * deltaX) / scale, start[1] + ratio * deltaY]);
}

function closestIndexOnPolyline(polyline, segments) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  polyline.forEach((vertex, index) => {
    segments.forEach((segment) => {
      for (let position = 0; position < segment.length - 1; position += 1) {
        const distance = distanceToSegment(vertex, segment[position], segment[position + 1]);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      }
    });
  });
  return [bestIndex, bestDistance];
}

async function fetchOverpassChunk(clauseSpecs) {
  const clauses = clauseSpecs
    .map(({ name, latitude, longitude }) => `way(around:${NAMED_STREET_SEARCH_RADIUS},${latitude},${longitude})["highway"]["name"~"${overpassNamePattern(name)}",i];`)
    .join("");
  const query = `[out:json][timeout:45];(${clauses});out geom;`;
  let lastError = new Error("No Overpass endpoint available");

  for (let attempt = 0; attempt < OVERPASS_ENDPOINTS.length; attempt += 1) {
    const endpoint = OVERPASS_ENDPOINTS[(overpassEndpointIndex + attempt) % OVERPASS_ENDPOINTS.length];
    try {
      const data = await fetchJson(`${endpoint}?data=${encodeURIComponent(query)}`, { timeout: 25000 });
      overpassEndpointIndex = (overpassEndpointIndex + attempt) % OVERPASS_ENDPOINTS.length;
      return (data.elements || []).filter((element) => element.type === "way" && Array.isArray(element.geometry));
    } catch (error) {
      lastError = error;
    }
  }

  overpassEndpointIndex = (overpassEndpointIndex + 1) % OVERPASS_ENDPOINTS.length;
  throw lastError;
}

async function fetchOverpassWays(clauseSpecs) {
  if (namedStreetGeometryFailures >= NAMED_STREET_FAILURE_LIMIT) {
    throw new Error("Named street geometry service unavailable");
  }

  const ways = [];
  let succeeded = false;
  let lastError = null;

  for (let index = 0; index < clauseSpecs.length; index += NAMED_STREET_CLAUSE_CHUNK) {
    try {
      ways.push(...await fetchOverpassChunk(clauseSpecs.slice(index, index + NAMED_STREET_CLAUSE_CHUNK)));
      succeeded = true;
    } catch (error) {
      lastError = error;
    }
  }

  if (!succeeded) {
    namedStreetGeometryFailures += 1;
    throw lastError ?? new Error("No named street geometry returned");
  }

  namedStreetGeometryFailures = 0;
  return ways;
}

function waysNamedNear(ways, wanted, point) {
  return ways
    .filter((way) => streetNameMatches(way.tags?.name, wanted))
    .map((way) => way.geometry.map((vertex) => [vertex.lon, vertex.lat]))
    .filter((coordinates) => coordinates.length > 1
      && coordinates.some((coordinate) => metersBetween(coordinate, point) <= NAMED_STREET_SEARCH_RADIUS));
}

function streetGeometryFromWays(ways, streetName, limitNames, point) {
  const streetSegments = waysNamedNear(ways, streetName, point);
  if (streetSegments.length === 0) {
    return null;
  }

  if (limitNames.length === 2) {
    const polyline = stitchStreetSegments(streetSegments);
    const firstLimit = waysNamedNear(ways, limitNames[0], point);
    const secondLimit = waysNamedNear(ways, limitNames[1], point);

    if (polyline.length > 1 && firstLimit.length > 0 && secondLimit.length > 0) {
      const [startIndex, startDistance] = closestIndexOnPolyline(polyline, firstLimit);
      const [endIndex, endDistance] = closestIndexOnPolyline(polyline, secondLimit);
      if (startDistance <= 45 && endDistance <= 45 && startIndex !== endIndex) {
        const [low, high] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
        const trimmed = polyline.slice(low, high + 1);
        if (trimmed.length > 1) {
          return { type: "LineString", coordinates: trimmed };
        }
      }
    }
  }

  return { type: "MultiLineString", coordinates: streetSegments };
}

function cleanLimitName(value) {
  const stripArticle = (text) => text.replace(/^(?:les|la|le)\s+|^l'\s*/i, "");
  return stripArticle(
    stripArticle(String(value || "").replace(/\s+/g, " "))
      .replace(new RegExp(`^(?:${STREET_TYPE_WORDS})\\s+`, "i"), "")
  )
    .replace(/[.,;:]+$/, "")
    .trim();
}

function isUsableLimitName(value) {
  return value.length >= 3 && /[A-Za-zÀ-ÿ]{3}/.test(value) && !/^\d/.test(value);
}

// Les sources publient souvent "entre X et Y" ou "de X a Y": ces bornes servent a couper le troncon.
function publishedRoadLimits(value) {
  const text = String(value || "").replace(/\s+/g, " ");
  const name = "[A-Za-zÀ-ÿ0-9'’-]+(?:\\s+[A-Za-zÀ-ÿ0-9'’-]+){0,3}";
  const patterns = [
    new RegExp(`\\bentre\\s+(${name})\\s+et\\s+(${name})`, "i"),
    new RegExp(`\\b(?:de|du)\\s+(${name})\\s+(?:à|au|jusqu'à|jusqu'au)\\s+(${name})`, "i")
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    // Sans type de voie explicite, la phrase decrit de la prose et non des limites de chantier.
    if (!match || !new RegExp(`\\b(?:${STREET_TYPE_WORDS})\\b`, "i").test(match[0])) {
      continue;
    }

    const limits = [cleanLimitName(match[1]), cleanLimitName(match[2])];
    if (limits.every(isUsableLimitName) && limits[0].toLowerCase() !== limits[1].toLowerCase()) {
      return limits;
    }
  }

  return [];
}

function hasCivicAddressOnly(value) {
  return /(^|\s)(?:devant\s+le\s+|face\s+au\s+|du\s+)?\d{1,5}\s*,?\s*(?:rue|av|ave|avenue|boul|boulevard|ch|chemin|mont[ée]e|route)\b/i.test(String(value || ""));
}

function namedRoadQueries(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const queries = [];
  const streetList = text.match(/\brues?\s+(.+?)(?=\s+-|\s+entre\b|\.)/i)?.[1];
  if (streetList) {
    streetList
      .split(/,\s*|\s+et\s+/i)
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((name) => queries.push(`Rue ${name}`));
  }
  const compoundRoads = text.match(/\bchemin\s+de\s+(?:la|l')\s+[A-Za-zÀ-ÿ0-9'’-]+(?:\s+[A-Za-zÀ-ÿ0-9'’-]+){0,2}/gi) || [];
  queries.push(...compoundRoads.map((query) => query.replace(/\s+(ainsi|entre|près|et)\b.*$/i, "").trim()));
  const ordinalStreets = text.match(/\b\d{1,3}\s*(?:e|re|er|ère)\s+(?:avenue|av\.?|rue|ruelle)\b/gi) || [];
  queries.push(...ordinalStreets.map((query) => query.replace(/\s+/g, " ").trim()));
  const pattern = new RegExp(`\\b(${STREET_TYPE_WORDS}|A[- ]?\\d{1,3}|R[- ]?\\d{1,3})\\s+([A-Za-zÀ-ÿ0-9'’-]+(?:\\s+[A-Za-zÀ-ÿ0-9'’-]+){0,2})`, "gi");
  for (const match of text.matchAll(pattern)) {
    let query = `${match[1]} ${match[2]}`.replace(/\s+(entre|près|et|sur|du|de)\b.*$/i, "").trim();
    query = query.replace(/^rues\b/i, "Rue").replace(/^avenues\b/i, "Avenue").replace(/^boulevards\b/i, "Boulevard");
    if (/^A[- ]?520$/i.test(query)) query = "Autoroute 520";
    if (/^rues?$/i.test(query) || /^chemins?$/i.test(query)) continue;
    if (query.length > match[1].length && !queries.includes(query)) queries.push(query);
  }
  return queries;
}

const MUNICIPAL_ENRICH_KINDS = new Set([
  "dorval-arcgis",
  "boisbriand-arcgis",
  "assomption-arcgis",
  "saint-eustache-arcgis",
  "chateauguay-arcgis",
  "mont-saint-hilaire-arcgis",
  "terrebonne-arcgis"
]);

function enrichmentSourceText(closure) {
  // Le separateur evite qu'une limite deborde sur la phrase suivante.
  return [closure.roadSearchText, closure.streets, closure.impact].filter(Boolean).join(" ; ");
}

function canEnrichToStreetGeometry(closure) {
  if (!MUNICIPAL_ENRICH_KINDS.has(closure.sourceKind)
    || closure.geometry?.type !== "Point"
    || !closure.roadType
    || namedRoadQueries(closure.roadSearchText || closure.streets).length === 0) {
    return false;
  }

  // Une adresse civique sans limites publiees reste un point officiel.
  return publishedRoadLimits(enrichmentSourceText(closure)).length === 2
    || !hasCivicAddressOnly(closure.streets);
}

function enrichmentPlan(closure) {
  const limits = publishedRoadLimits(enrichmentSourceText(closure));
  return {
    closure,
    point: closure.geometry.coordinates,
    roadQueries: namedRoadQueries(closure.roadSearchText || closure.streets),
    limits
  };
}

function applyStreetGeometry(plan, ways) {
  for (const roadQuery of plan.roadQueries) {
    const limitNames = plan.limits.filter((limit) => !streetNameMatches(limit, roadQuery));
    const geometry = streetGeometryFromWays(ways, roadQuery, limitNames.length === 2 ? limitNames : [], plan.point);
    if (geometry) {
      return {
        ...plan.closure,
        geometry,
        point: representativePoint(geometry),
        geometrySource: "named-street-geometry"
      };
    }
  }

  return null;
}

// Une seule requete Overpass par municipalite: le service repond en plusieurs secondes
// et limite le debit, donc une requete par entrave serait trop lente.
async function enrichMunicipalGeometriesInBackground() {
  const currentBounds = map.getBounds();
  const plans = allClosures
    .filter(canEnrichToStreetGeometry)
    .map(enrichmentPlan)
    .filter((plan) => plan.roadQueries.length > 0);
  plans.sort((first, second) => Number(closureIntersectsBounds(second.closure, currentBounds)) - Number(closureIntersectsBounds(first.closure, currentBounds)));

  const groups = new Map();
  plans.forEach((plan) => {
    const key = plan.closure.borough || "region";
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(plan);
  });

  for (const groupPlans of groups.values()) {
    const specs = new Map();
    groupPlans.forEach((plan) => {
      [...plan.roadQueries, ...plan.limits].forEach((name) => {
        const latitude = plan.point[1];
        const longitude = plan.point[0];
        specs.set(`${name}|${latitude.toFixed(3)}|${longitude.toFixed(3)}`, { name, latitude, longitude });
      });
    });

    let ways;
    try {
      ways = await fetchOverpassWays([...specs.values()]);
    } catch (error) {
      console.warn("Named street geometry lookup failed", error);
      continue;
    }

    groupPlans.forEach((plan) => {
      const enriched = applyStreetGeometry(plan, ways);
      if (!enriched) {
        return;
      }

      const index = allClosures.findIndex((item) => item.id === plan.closure.id);
      if (index !== -1) {
        allClosures[index] = prepareClosureForRuntime(enriched, { force: true });
        scheduleEnrichedGeometryUpdate();
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  flushEnrichedGeometryUpdate();
}

let enrichedGeometryTimer = null;

function scheduleEnrichedGeometryUpdate() {
  if (enrichedGeometryTimer) {
    return;
  }

  enrichedGeometryTimer = setTimeout(() => {
    enrichedGeometryTimer = null;
    updateView({ fit: false });
  }, 500);
}

function flushEnrichedGeometryUpdate() {
  if (!enrichedGeometryTimer) {
    return;
  }

  clearTimeout(enrichedGeometryTimer);
  enrichedGeometryTimer = null;
  updateView({ fit: false });
}

function normalizeSaintEustacheFeature(feature) {
  const p = feature.attributes || {};
  const geometry = esriGeometryToGeoJson(feature.geometry);
  const endDate = dateOnlyFromTimestamp(p.DateFinReelle || p.DateFinAnticipee);
  const impact = [p.ImpactCirculation, p.Alternative, p.NoteExterne].filter(Boolean).join(" - ");
  if (!geometry || !p.Localisation || /travaux terminés|travaux termines/i.test(p.TypeContrainte || "") || /toutes les voies sont ouvertes|aucune entrave/i.test(impact)) return null;
  if (endDate && endDate < new Date().toISOString().slice(0, 10)) return null;
  const severity = municipalSeverity(`${p.TypeContrainte} ${impact}`);
  return {
    id: `saint-eustache-${p.GlobalID || p.OBJECTID}`,
    title: `${p.TITRE || "Entrave routière"} - ${p.Localisation}`,
    category: "municipal",
    sourceKind: "saint-eustache-arcgis",
    responsible: p.Responsable || "Ville de Saint-Eustache",
    borough: "Saint-Eustache",
    startDate: dateOnlyFromTimestamp(p.DateDebutReelle || p.DateDebutAnticipee),
    endDate,
    impact: impact || "Impact automobile publié par la Ville de Saint-Eustache.",
    trafficLabel: severity === "critical" ? "Fermeture complète" : "Voie touchée",
    severity,
    roadType: roadTypeFromText(`${p.TITRE} ${p.Localisation}`),
    periods: ["day", "night"],
    direction: "Direction non publiée.",
    streets: p.Localisation,
    source: "Ville de Saint-Eustache - Entraves routières",
    sourceUrl: "https://www.saint-eustache.ca/info-travaux",
    color: SEVERITY_META[severity].color,
    geometry,
    point: representativePoint(geometry),
    details: [["Référence", p.NumeroDossier], ["Type", p.TypeTravaux]]
  };
}

function dateFromQuebecText(value) {
  const match = String(value || "").match(/(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})/i);
  if (!match) return "";
  const months = { janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5, juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11, decembre: 11 };
  return `${match[3]}-${String(months[match[2].toLowerCase()] + 1).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}`;
}

function normalizeChateauguayFeature(feature) {
  const p = feature.attributes || {};
  const geometry = esriGeometryToGeoJson(feature.geometry);
  const startDate = dateFromQuebecText(p.Deb_Trav);
  const endDate = dateFromQuebecText(p.Fin_Trav);
  if (!geometry || !p.NOM || /^terminé|^termine$/i.test(String(p.Légende || "")) || (endDate && endDate < new Date().toISOString().slice(0, 10))) return null;
  const severity = municipalSeverity(`${p.NOM} ${p.Comment}`);
  return {
    id: `chateauguay-${p.FID}`,
    title: p.NOM,
    category: "municipal",
    sourceKind: "chateauguay-arcgis",
    responsible: "Ville de Châteauguay",
    borough: "Châteauguay",
    startDate,
    endDate,
    impact: p.Comment || "Travaux routiers publiés par la Ville de Châteauguay.",
    trafficLabel: severity === "critical" ? "Fermeture complète" : "Voie touchée",
    severity,
    roadType: roadTypeFromText(p.NOM),
    periods: ["day", "night"],
    direction: "Direction non publiée.",
    streets: p.NOM,
    source: "Ville de Châteauguay - Travaux en cours",
    sourceUrl: "https://ville.chateauguay.qc.ca/info-travaux/travaux-en-cours-et-a-venir/",
    color: SEVERITY_META[severity].color,
    geometry,
    point: representativePoint(geometry),
    details: [["Entrepreneur", p.NOM_ENT], ["Urgence", p.NUM_URG]]
  };
}

function normalizeAssomptionFeature(feature) {
  const p = feature.attributes || {};
  const geometry = esriGeometryToGeoJson(feature.geometry);
  const impactText = [p.entrave_la_circulation, p.d_tour_de_la_circulation, p.fermeture_partielle].filter(Boolean).join(" - ");
  const startDate = dateOnlyFromTimestamp(p.d_but_des_travaux);
  const endDate = dateOnlyFromTimestamp(p.fin_des_travaux);
  if (!geometry || !p.adresse || !impactText || /aucune entrave/i.test(impactText) || (endDate && endDate < new Date().toISOString().slice(0, 10))) return null;
  const severity = municipalSeverity(impactText);
  return {
    id: `assomption-${p.globalid || p.objectid}`,
    title: `${p.type_de_travaux || "Travaux routiers"} - ${p.adresse}`,
    category: "municipal",
    sourceKind: "assomption-arcgis",
    responsible: p.personne_ressource || "Ville de L'Assomption",
    borough: "L'Assomption",
    startDate,
    endDate,
    impact: impactText,
    trafficLabel: severity === "critical" ? "Fermeture complète" : "Voie touchée",
    severity,
    roadType: roadTypeFromText(p.adresse),
    periods: ["day", "night"],
    direction: "Direction non publiée.",
    streets: p.adresse,
    source: "Ville de L'Assomption - Info-travaux",
    sourceUrl: "https://www.lassomption.ca/",
    color: SEVERITY_META[severity].color,
    geometry,
    point: representativePoint(geometry),
    details: [["Détour", p.d_tour_de_la_circulation], ["Information", p.informations_suppl_mentaires]]
  };
}

function intersectsGreaterMontreal(feature) {
  const bounds = Array.isArray(feature?.bbox) && feature.bbox.length >= 4
    ? feature.bbox
    : geometryBounds(feature?.geometry?.coordinates);

  if (!Array.isArray(bounds) || bounds.length < 4) {
    return false;
  }

  const [west, south, east, north] = bounds;
  return east >= GREATER_MONTREAL_BOUNDS.west
    && west <= GREATER_MONTREAL_BOUNDS.east
    && north >= GREATER_MONTREAL_BOUNDS.south
    && south <= GREATER_MONTREAL_BOUNDS.north;
}

function geometryBounds(coordinates) {
  const flattened = flattenCoordinates(coordinates);
  if (!flattened.length) {
    return null;
  }

  const longitudes = flattened.map(([lon]) => lon);
  const latitudes = flattened.map(([, lat]) => lat);

  return [
    Math.min(...longitudes),
    Math.min(...latitudes),
    Math.max(...longitudes),
    Math.max(...latitudes)
  ];
}

async function fetchRouteGeometry(routeEndpoints) {
  const coordinates = routeEndpoints.map(([lon, lat]) => `${lon},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
  const data = await fetchJson(url);
  const geometry = data.routes?.[0]?.geometry;
  if (!geometry?.coordinates?.length) {
    throw new Error("No routed geometry returned");
  }

  return geometry;
}

function periodsFromMontrealSchedule(properties) {
  const dayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const periods = new Set();
  let hasSpecificHours = false;

  dayKeys.forEach((day) => {
    if (!properties[`durationDays${day}Active`]) {
      return;
    }

    if (properties[`durationDays${day}AllDayRound`]) {
      periods.add("day");
      periods.add("night");
      return;
    }

    const start = minutesFromTime(properties[`durationDays${day}StartTime`]);
    const end = minutesFromTime(properties[`durationDays${day}EndTime`]);
    if (start === null || end === null) {
      return;
    }

    hasSpecificHours = true;
    if (touchesNight(start, end)) {
      periods.add("night");
    }
    if (touchesDay(start, end)) {
      periods.add("day");
    }
  });

  if (periods.size === 0) {
    return hasSpecificHours ? ["day"] : ["day", "night"];
  }

  return [...periods];
}

function minutesFromTime(value) {
  if (!value) {
    return null;
  }

  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function timeRanges(start, end) {
  if (start === end) {
    return [[0, 1440]];
  }

  return start < end ? [[start, end]] : [[start, 1440], [0, end]];
}

function overlapsRange(ranges, targetStart, targetEnd) {
  return ranges.some(([start, end]) => start < targetEnd && end > targetStart);
}

function touchesNight(start, end) {
  const ranges = timeRanges(start, end);
  return overlapsRange(ranges, 23 * 60, 1440) || overlapsRange(ranges, 0, 5 * 60);
}

function touchesDay(start, end) {
  return overlapsRange(timeRanges(start, end), 5 * 60, 23 * 60);
}

function normalizeLegacyClosure(closure) {
  const severityKey = closure.category === "regional" || closure.category === "event" ? "critical" : "major";
  const severity = SEVERITY_META[severityKey];
  return {
    ...closure,
    sourceKind: "fallback",
    severity: severityKey,
    trafficLabel: closure.category === "regional" ? "Fermeture majeure" : "Entrave routière",
    direction: "Direction precise non fournie dans les données de secours.",
    periods: ["day", "night"],
    roadType: roadTypeFromText(`${closure.title} ${closure.streets}`),
    color: severity.color,
    geometry: { type: "LineString", coordinates: closure.path.map(([lat, lon]) => [lon, lat]) },
    point: [closure.coordinates[1], closure.coordinates[0]]
  };
}

function normalizeMontrealFeature(feature, index) {
  const properties = feature.properties ?? {};
  const impacts = parseJson(properties.occupancyImpactImpactsOfSection, []);
  const polygonCoordinates = parseJson(properties.locationOccupancyZoneGeometryCoordinates, null);
  const point = feature.geometry?.type === "Point" ? feature.geometry.coordinates : parseJson(properties.locationSummaryGeometryPin, null);

  return impacts.flatMap((impact, impactIndex) => {
    const traffic = trafficDetailsFromImpact(impact.streetImpactType);
    if (!traffic) {
      return [];
    }

    const pedestrianStreet = isPedestrianStreetFeature(properties, impact);
    const displayTraffic = pedestrianStreet
      ? { severity: "critical", label: "Rue piétonne temporaire", impact: "Circulation automobile fermée pour une piétonnisation ou une rue partagée publiée par Montréal." }
      : traffic;

    const lineGeometry = parseJson(impact.spatialAnalysis?.lineGeometry, null);
    const from = impact.spatialAnalysis?.fromShortName || impact.spatialAnalysis?.fromName || "origine non précisée";
    const to = impact.spatialAnalysis?.toShortName || impact.spatialAnalysis?.toName || "destination non précisée";
    const street = impact.spatialAnalysis?.shortName || impact.streetId || properties.occupancyName || "Rue non précisée";
    const category = pedestrianStreet ? "commercial" : categoryFromAuthority(properties.siteAuthority || properties.occupancySubmitterDetailsSubmitterCategory);
    const severity = SEVERITY_META[displayTraffic.severity] ?? SEVERITY_META.major;
    const geometry = lineGeometry || (polygonCoordinates ? { type: "Polygon", coordinates: polygonCoordinates } : feature.geometry);

    return {
      id: `mtl-${properties.id || index}-${impactIndex}`,
      title: `${displayTraffic.label} - ${street}`,
      category,
      sourceKind: "montreal-wfs",
      responsible: properties.submitterSummaryOrganizationName || properties.occupancysubmitterdetailsPublicOrganization || siteAuthorityLabel(properties.siteAuthority),
      borough: properties.boroughId || "Montreal",
      startDate: dateOnly(properties.durationStartDate),
      endDate: dateOnly(properties.durationEndDate),
      impact: displayTraffic.impact,
      trafficLabel: displayTraffic.label,
      severity: displayTraffic.severity,
      roadType: pedestrianStreet
        ? "street"
        : roadTypeFromText(`${street} ${properties.occupancyName || ""} ${impact.spatialAnalysis?.name || ""}`),
      periods: periodsFromMontrealSchedule(properties),
      direction: `Segment ${from} vers ${to}. Direction exacte de voie non publiée dans ce flux si une seule direction est touchée.`,
      streets: properties.occupancyName || `${street}, entre ${from} et ${to}`,
      source: "Ville de Montreal - Info entraves et travaux",
      sourceUrl: "https://services.montreal.ca/cartes/entraves",
      color: severity.color,
      geometry,
      point,
      rawType: impact.streetImpactType,
      width: impact.streetImpactWidth
    };
  });
}

function isPedestrianStreetFeature(properties, impact) {
  const source = [
    properties.occupancyName,
    properties.obstructionTitle,
    properties.reasonKind,
    properties.reasonCategory,
    properties.submitterSummaryOrganizationName,
    impact.spatialAnalysis?.name,
    impact.spatialAnalysis?.shortName,
    impact.spatialAnalysis?.additionalInformation
  ].filter(Boolean).join(" ");

  return /piéton|pieton|piétonnisation|pietonnisation|rue partagée|rue partagee/i.test(source);
}

function normalizeUciFeature(feature) {
  const properties = feature.properties ?? {};
  const traffic = trafficDetailsFromUciType(properties.type);
  const geometry = feature.geometry;
  const point = representativePoint(geometry);

  return {
    id: `uci-${properties.id}`,
    title: `${traffic.label} - Championnats du monde UCI`,
    category: "event",
    sourceKind: "uci-wfs",
    responsible: "Montreal 2026 / Ville de Montreal",
    borough: "Secteurs du parcours UCI",
    startDate: dateOnly(properties.date_debut),
    endDate: dateOnly(properties.date_fin),
    impact: traffic.impact,
    trafficLabel: traffic.label,
    severity: traffic.severity,
    roadType: roadTypeFromText(`${properties.type || ""} ${properties.name || ""}`) || "street",
    periods: ["day", "night"],
    direction: properties.type === "Double sens" ? "Circulation autorisee dans les deux sens sur ce segment temporaire." : "Les fleches suivent le sens de la géométrie officielle publiée pour ce segment.",
    streets: `Segment UCI ${properties.id}`,
    source: "Ville de Montreal - carte UCI 2026",
    sourceUrl: "https://services.montreal.ca/cartes/uci",
    color: (SEVERITY_META[traffic.severity] ?? SEVERITY_META.major).color,
    geometry,
    point,
    rawType: properties.type
  };
}

function siteAuthorityLabel(authority) {
  const labels = {
    contractorCity: "Entrepreneur de la Ville",
    cityOfMontreal: "Ville de Montreal",
    contractorPublicOrganization: "Organisation publique ou privee",
    contractorRTU: "Compagnie de réseau technique urbain",
    csem: "CSEM"
  };

  return labels[authority] || authority || "Responsable non precise";
}

function representativePoint(geometry) {
  const coordinates = flattenCoordinates(geometry?.coordinates).filter((item) => typeof item[0] === "number" && typeof item[1] === "number");
  if (coordinates.length === 0) {
    return [MONTREAL_CENTER[1], MONTREAL_CENTER[0]];
  }

  return coordinates[Math.floor(coordinates.length / 2)];
}

function prepareClosureForRuntime(closure, { force = false } = {}) {
  if (!force && closure._runtimePrepared) {
    return closure;
  }

  const coordinates = flattenCoordinates(closure.geometry?.coordinates)
    .filter((item) => typeof item[0] === "number" && typeof item[1] === "number");
  if (coordinates.length === 0 && Array.isArray(closure.point)) {
    coordinates.push(closure.point);
  }

  let bounds = null;
  coordinates.forEach(([longitude, latitude]) => {
    if (!bounds) {
      bounds = [longitude, latitude, longitude, latitude];
      return;
    }
    bounds[0] = Math.min(bounds[0], longitude);
    bounds[1] = Math.min(bounds[1], latitude);
    bounds[2] = Math.max(bounds[2], longitude);
    bounds[3] = Math.max(bounds[3], latitude);
  });

  return {
    ...closure,
    _runtimePrepared: true,
    _searchText: [
      closure.title,
      closure.responsible,
      closure.borough,
      closure.impact,
      closure.streets,
      closure.direction,
      closure.source
    ].join(" ").toLowerCase(),
    _startTime: parseDate(closure.startDate).valueOf(),
    _endTime: parseDate(closure.endDate).valueOf(),
    _bounds: bounds
  };
}

function flattenCoordinates(coordinates) {
  if (!Array.isArray(coordinates)) {
    return [];
  }

  if (typeof coordinates[0] === "number") {
    return [coordinates];
  }

  return coordinates.flatMap(flattenCoordinates);
}

function toLatLngs(coordinates) {
  if (!Array.isArray(coordinates)) {
    return [];
  }

  if (typeof coordinates[0]?.[0] === "number") {
    return coordinates.map(([lon, lat]) => [lat, lon]);
  }

  return coordinates.map(toLatLngs);
}

// Les flux d'entraves restent relus a chaque ouverture de page; seules les geometries
// deterministes (OSRM, Nominatim) sont conservees pour toute la session du navigateur.
const GEOMETRY_CACHE_PREFIX = "entraves-geometry:";
const GEOMETRY_CACHE_MAX_CHARS = 400000;
const memoryFetchCache = new Map();
const pendingFetches = new Map();

function isGeometryHelperUrl(url) {
  return url.includes("router.project-osrm.org") || url.includes("/api/interpreter");
}

function readCachedResponse(url) {
  if (memoryFetchCache.has(url)) {
    return memoryFetchCache.get(url);
  }

  if (!isGeometryHelperUrl(url)) {
    return undefined;
  }

  try {
    const stored = window.sessionStorage.getItem(GEOMETRY_CACHE_PREFIX + url);
    if (stored === null) {
      return undefined;
    }
    const value = JSON.parse(stored);
    memoryFetchCache.set(url, value);
    return value;
  } catch {
    return undefined;
  }
}

function writeCachedResponse(url, value) {
  memoryFetchCache.set(url, value);

  if (!isGeometryHelperUrl(url)) {
    return;
  }

  try {
    const serialized = JSON.stringify(value);
    if (serialized.length <= GEOMETRY_CACHE_MAX_CHARS) {
      window.sessionStorage.setItem(GEOMETRY_CACHE_PREFIX + url, serialized);
    }
  } catch {
    // Quota atteint ou stockage indisponible: le cache memoire suffit.
  }
}

async function fetchJson(url, { timeout = 15000, cache = true } = {}) {
  if (cache) {
    const cached = readCachedResponse(url);
    if (cached !== undefined) {
      return cached;
    }

    const pending = pendingFetches.get(url);
    if (pending) {
      return pending;
    }
  }

  const request = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (cache) {
        writeCachedResponse(url, data);
      }
      return data;
    } finally {
      clearTimeout(timer);
      pendingFetches.delete(url);
    }
  })();

  if (cache) {
    pendingFetches.set(url, request);
  }

  return request;
}

async function loadOfficialData() {
  showMapStatus(t("map.loading"), "loading");

  const primarySources = await Promise.allSettled([
    fetchJson(LIVE_SOURCES.montreal),
    fetchJson(LIVE_SOURCES.uciRestrictions),
    loadRegionalClosures()
  ]);

  const primaryClosures = [];
  const sourceCounts = [];

  const montrealResult = primarySources[0];
  const uciResult = primarySources[1];
  const regionalResult = primarySources[2];

  if (montrealResult.status === "fulfilled") {
    const montrealClosures = montrealResult.value.features.flatMap(normalizeMontrealFeature);
    primaryClosures.push(...montrealClosures);
    sourceCounts.push(`${montrealClosures.length} entraves auto Montreal`);
  }

  if (uciResult.status === "fulfilled") {
    const uciClosures = uciResult.value.features.map(normalizeUciFeature);
    primaryClosures.push(...uciClosures);
    sourceCounts.push(`${uciClosures.length} segments UCI`);
  }

  if (regionalResult.status === "fulfilled") {
    primaryClosures.push(...regionalResult.value);
    sourceCounts.push(`${regionalResult.value.length} fermetures ponts/grands axes alignees aux routes`);
  }

  if (primaryClosures.length > 0) {
    allClosures = dedupeClosures([...allClosures.filter((closure) => closure.sourceKind !== "fallback"), ...primaryClosures]);
    // Garder le spinner: le chargement de fond n'est pas encore termine.
    showMapStatus(t("map.loading"), "loading");
  } else {
    showMapStatus(t("map.apiUnavailable"), "error");
  }

  map.invalidateSize(true);
  updateView({ fit: true });

  loadBackgroundOfficialData();
}

async function loadBackgroundOfficialData() {
  const backgroundSources = await Promise.allSettled([
    loadLinkedCityWorks(),
    loadSeasonalPedestrianStreets(),
    loadLongueuilClosures(),
    loadLavalClosures(),
    loadQuebec511Closures(),
    loadQuebec511Events(),
    loadRepentignyClosures(),
    loadMunicipalArcgisClosures(),
    loadDorvalAndBoisbriandClosures(),
    loadTerrebonneClosures(),
    loadMontSaintHilaireClosures(),
    loadMontRoyalSnapshotClosures(),
    loadBeaconsfieldSnapshotClosures(),
    loadMontrealPedestrianSnapshotClosures()
  ]);

  const additions = [];

  for (const result of backgroundSources) {
    if (result.status === "fulfilled") {
      additions.push(...result.value);
    }
  }

  if (additions.length > 0) {
    allClosures = dedupeClosures([...allClosures, ...additions]);
    updateView({ fit: false });
  }
  // Toujours retirer l'indicateur de chargement une fois le fond charge.
  showMapStatus(`Donnees chargees: ${allClosures.length} entraves actives dans la region.`, "ready");

  enrichMunicipalGeometriesInBackground();
}

function dedupeClosures(closures) {
  const seen = new Set();
  return closures.map(prepareClosureForRuntime).filter((closure) => {
    if (seen.has(closure.id)) {
      return false;
    }

    seen.add(closure.id);
    return true;
  });
}

function popupContent(closure) {
  const meta = CATEGORY_META[closure.category] ?? CATEGORY_META.event;
  const severity = SEVERITY_META[closure.severity] ?? SEVERITY_META.major;
  const details = (closure.details || [])
    .filter(([, value]) => isMeaningfulLavalValue(value))
    .map(([label, value]) => `<p class="popup-meta"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`)
    .join("");
  return `
    <div class="popup-card">
      <p class="popup-title">${escapeHtml(closure.title)}</p>
      <p class="popup-meta"><strong>${escapeHtml(closureImpactLabel(closure))}</strong> - ${escapeHtml(meta.label())}</p>
      <p class="popup-meta">${escapeHtml(closure.streets)}</p>
      <p class="popup-meta">${formatDate(closure.startDate)} ${t("popup.to")} ${formatDate(closure.endDate)}</p>
      ${details}
      <p class="popup-meta"><strong>${t("popup.responsible")}:</strong> ${escapeHtml(closure.responsible)}</p>
      <p class="popup-meta"><strong>${t("popup.period")}:</strong> ${escapeHtml(periodsLabel(closure.periods))}</p>
      <p class="popup-meta"><strong>${t("popup.impact")}:</strong> ${escapeHtml(closure.impact)}</p>
      <p class="popup-meta"><strong>${t("popup.direction")}:</strong> ${escapeHtml(closure.direction)}</p>
      <a href="${escapeHtml(closure.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(closure.source)}</a>
    </div>
  `;
}

function periodsLabel(periods) {
  if (periods.includes("day") && periods.includes("night")) {
    return t("popup.dayNight");
  }

  if (periods.includes("night")) {
    return t("popup.night");
  }

  return t("popup.day");
}

function groupedPopupContent(closures) {
  const title = closures.length === 1 ? t("popup.one") : `${closures.length} ${t("popup.many")}`;
  const primaryColor = closures[0]?.color || "#ff8c00";
  return `
    <div class="popup-scroll-shell" style="--popup-header-color: ${primaryColor};">
      <button class="popup-close-button" type="button" aria-label="Fermer les détails">&times;</button>
      <div class="popup-group-header">${title}</div>
      <div class="popup-scroll-body">
        ${closures.slice(0, 8).map(popupContent).join("")}
        ${closures.length > 8 ? `<p class="popup-meta">${closures.length - 8} ${t("popup.otherNearby")}</p>` : ""}
        <div class="popup-scroll-hint" aria-hidden="true">
          <span>↓</span>
        </div>
      </div>
    </div>
  `;
}

function openGroupedPopup(primaryClosure, latLng) {
  selectedClosureId = primaryClosure.id;
  renderVisibleClosures();
  const nearbyClosures = closuresNearLatLng(latLng, primaryClosure);
  openMapPopup(latLng, groupedPopupContent(nearbyClosures), 420);
}

function openMapPopup(latLng, content, maxWidth) {
  if (activeMapPopup && map.hasLayer(activeMapPopup)) {
    map.closePopup(activeMapPopup);
  }

  const popup = L.popup({
    maxWidth,
    autoPan: false,
    closeButton: false
  })
    .setLatLng(latLng)
    .setContent(content);

  activeMapPopup = popup;
  popup.on("remove", () => {
    if (activeMapPopup === popup) {
      activeMapPopup = null;
    }
  });

  popup.openOn(map);

  requestAnimationFrame(() => {
    const popupElement = popup.getElement();
    const popupContentElement = popupElement?.querySelector(".leaflet-popup-content");
    if (!popupContentElement) {
      return;
    }

    let closeButton = popupContentElement.querySelector(".popup-close-button");
    if (!closeButton) {
      closeButton = document.createElement("button");
      closeButton.className = "popup-close-button";
      closeButton.type = "button";
      closeButton.setAttribute("aria-label", t("map.closeDetails"));
      closeButton.textContent = "×";
      popupContentElement.prepend(closeButton);
    }
    closeButton.addEventListener("click", () => map.closePopup());

    const scrollBody = popupContentElement.querySelector(".popup-scroll-body");
    const scrollHint = popupContentElement.querySelector(".popup-scroll-hint");
    if (scrollBody && scrollHint) {
      const updateHintState = () => {
        const hasOverflow = scrollBody.scrollHeight > scrollBody.clientHeight + 2;
        const atBottom = scrollBody.scrollTop + scrollBody.clientHeight >= scrollBody.scrollHeight - 4;
        scrollBody.classList.toggle("has-overflow", hasOverflow && !atBottom);
        scrollBody.classList.toggle("is-scrolled", atBottom);
        scrollHint.hidden = !hasOverflow || atBottom;
      };

      updateHintState();
      scrollBody.addEventListener("scroll", () => {
        updateHintState();
      }, { passive: true });
      window.addEventListener("resize", updateHintState, { passive: true, once: true });
    }
  });

  requestAnimationFrame(() => centerPopupInMap(popup));
}

function centerPopupInMap(popup, pass = 0) {
  const popupElement = popup.getElement();
  const mapElement = map.getContainer();
  if (!popupElement || !mapElement) {
    return;
  }

  const popupBounds = popupElement.getBoundingClientRect();
  const mapBounds = mapElement.getBoundingClientRect();
  const horizontalOffset = popupBounds.left + popupBounds.width / 2 - (mapBounds.left + mapBounds.width / 2);
  const verticalOffset = popupBounds.top + popupBounds.height / 2 - (mapBounds.top + mapBounds.height / 2);

  if (pass > 0 && Math.abs(horizontalOffset) < 3 && Math.abs(verticalOffset) < 3) {
    return;
  }

  map.panBy([horizontalOffset, verticalOffset], { animate: true, duration: 0.28 });
  if (pass === 0) {
    map.once("moveend", () => requestAnimationFrame(() => centerPopupInMap(popup, 1)));
  }
}

function closuresNearLatLng(latLng, primaryClosure) {
  const center = L.latLng(latLng.lat, latLng.lng);
  return currentClosures
    .filter((closure) => closure.id === primaryClosure.id || minDistanceMeters(center, closure) <= 45)
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

function nearestClosure(latLng, maxDistanceMeters = 140) {
  const center = L.latLng(latLng.lat, latLng.lng);
  return currentClosures.reduce((nearest, closure) => {
    const distance = minDistanceMeters(center, closure);
    if (distance > maxDistanceMeters || distance >= nearest.distance) {
      return nearest;
    }

    return { closure, distance };
  }, { closure: null, distance: Number.POSITIVE_INFINITY }).closure;
}

function minDistanceMeters(center, closure) {
  const coordinates = flattenCoordinates(closure.geometry?.coordinates);
  if (coordinates.length === 0 && closure.point) {
    coordinates.push(closure.point);
  }

  return coordinates.reduce((minimum, [lon, lat]) => Math.min(minimum, center.distanceTo([lat, lon])), Number.POSITIVE_INFINITY);
}

function renderMap(closures) {
  const visibleClosureIds = new Set(closures.map((closure) => closure.id));

  renderedClosureLayers.forEach((layers, closureId) => {
    if (!visibleClosureIds.has(closureId)) {
      closureLayer.removeLayer(layers.closures);
      arrowLayer.removeLayer(layers.arrows);
      renderedClosureLayers.delete(closureId);
    }
  });

  [...closures].sort((a, b) => layerRank(a) - layerRank(b)).forEach((closure) => {
    // If closure is already rendered, check if geometry type changed via enrichment
    if (renderedClosureLayers.has(closure.id)) {
      const existing = renderedClosureLayers.get(closure.id);
      const newGeometryType = closure.geometry?.type;
      const oldGeometryType = existing._geometryType;
      
      // Only remove and re-render if geometry type actually changed (e.g., Point→MultiLineString)
      if (newGeometryType === oldGeometryType) {
        return; // Same geometry type, no need to re-render
      }
      
      // Geometry type changed, remove the old layer
      closureLayer.removeLayer(existing.closures);
      arrowLayer.removeLayer(existing.arrows);
      renderedClosureLayers.delete(closure.id);
    }

    const closureLayers = L.layerGroup().addTo(closureLayer);
    const closureArrows = L.layerGroup().addTo(arrowLayer);
    const layerData = { closures: closureLayers, arrows: closureArrows, _geometryType: closure.geometry?.type };
    renderedClosureLayers.set(closure.id, layerData);

    const severity = SEVERITY_META[closure.severity] ?? SEVERITY_META.major;
    const lineWidth = mapLineWidth(severity.width);
    const commonStyle = { color: closure.color, weight: lineWidth, opacity: severity.opacity, renderer: fastRenderer };
    const hitStyle = { color: closure.color, weight: Math.max(34, severity.width + 20), opacity: 0.01, renderer: fastRenderer };
    let mainLayer = null;

    if (closure.geometry?.type === "LineString") {
      const latLngs = toLatLngs(closure.geometry.coordinates);
      mainLayer = L.polyline(latLngs, commonStyle).addTo(closureLayers);
      mainLayer._mapLineBaseWidth = severity.width;
      L.polyline(latLngs, hitStyle).on("click", (event) => {
        dismissMapFirstVisitHint();
        openGroupedPopup(closure, event.latlng);
      }).addTo(closureLayers);
      addDirectionArrows(latLngs, closure, closureArrows);
    } else if (closure.geometry?.type === "MultiLineString") {
      closure.geometry.coordinates.forEach((lineCoordinates) => {
        const latLngs = toLatLngs(lineCoordinates);
        mainLayer = L.polyline(latLngs, commonStyle).addTo(closureLayers);
        mainLayer._mapLineBaseWidth = severity.width;
        L.polyline(latLngs, hitStyle).on("click", (event) => {
          dismissMapFirstVisitHint();
          openGroupedPopup(closure, event.latlng);
        }).addTo(closureLayers);
        addDirectionArrows(latLngs, closure, closureArrows);
      });
    } else if (closure.geometry?.type === "Polygon") {
      mainLayer = L.polygon(toLatLngs(closure.geometry.coordinates), {
        color: closure.color,
        weight: lineWidth,
        opacity: severity.opacity,
        fillColor: closure.color,
        fillOpacity: closure.severity === "critical" ? 0.32 : 0.2,
        renderer: fastRenderer
      }).addTo(closureLayers);
      mainLayer._mapLineBaseWidth = severity.width;
    } else if (closure.point) {
      mainLayer = L.circleMarker([closure.point[1], closure.point[0]], {
        radius: closure.severity === "critical" ? 8 : 6,
        color: "#ffffff",
        weight: 3,
        fillColor: closure.color,
        fillOpacity: 1,
        renderer: fastRenderer
      }).addTo(closureLayers);
    }

    if (mainLayer) {
      mainLayer.on("click", (event) => {
        dismissMapFirstVisitHint();
        openGroupedPopup(closure, event.latlng);
      });
    }
  });
}

function updateRenderedLineWidths() {
  renderedClosureLayers.forEach(({ closures }) => {
    closures.eachLayer((layer) => {
      if (layer._mapLineBaseWidth) {
        layer.setStyle({ weight: mapLineWidth(layer._mapLineBaseWidth) });
      }
    });
  });
}

function normalizeLavalIdentifyResult(result) {
  const properties = result.attributes ?? {};
  const layerId = Number(result.layerId);
  const severity = layerId === 0 ? "critical" : layerId === 2 ? "major" : "moderate";
  const startDate = lavalAttribute(properties, "DATE_DEBUT", "Début :");
  const endDate = lavalAttribute(properties, "DATE_FIN", "Fin :");
  const entrave = lavalAttribute(properties, "ENTRAVE", "Entrave :");
  const location = lavalAttribute(properties, "LOCALISATION", "Localisation :") || "Localisation non publiée";
  const circulation = lavalAttribute(properties, "CIRCULATION", "Circulation :");
  const remark = lavalAttribute(properties, "REMARQUE", "Remarques :");
  const responsible = lavalAttribute(properties, "RESPONSABLE", "Responsable :");
  const nature = lavalAttribute(properties, "NATURE", "Nature :");
  const reference = lavalAttribute(properties, "NO_REFERENCE", "Numéro de référence :");
  const impact = [entrave, circulation, remark].filter(isMeaningfulLavalValue).join(" - ");

  const geometry = lavalPathsToGeometry(result.geometry?.paths);
  if (!geometry) {
    return null;
  }

  return {
    id: `laval-${layerId}-${properties.OBJECTID || lavalAttribute(properties, "NO_OBSTRUCTION", "Obstruction # :") || location}`,
    title: `${entrave || result.layerName || "Entrave"} - ${location}`,
    category: "municipal",
    sourceKind: "laval-mapserver",
    responsible: responsible || "Ville de Laval",
    borough: "Laval",
    startDate: dateOnlyFromTimestamp(startDate),
    endDate: dateOnlyFromTimestamp(endDate),
    impact: impact || "Details de circulation non publies.",
    trafficLabel: entrave || result.layerName || "Entrave Laval",
    severity,
    roadType: roadTypeFromText(`${entrave || ""} ${location}`),
    periods: ["day", "night"],
    direction: "Direction precise non publiée dans les attributs Laval.",
    streets: location,
    source: "Laval Info-Travaux - details officiels",
    sourceUrl: "https://vl.maps.arcgis.com/apps/instant/sidebar/index.html?appid=729ff9eeb851437b9a4cf365efadfe8f",
    color: SEVERITY_META[severity].color,
    geometry,
    point: representativePoint(geometry),
    details: [["Nature", nature], ["Reference", reference]]
  };
}

// Les chemins d'identify sont projetes en EPSG:3857; la carte attend du GeoJSON en degres.
function lavalPathsToGeometry(paths) {
  if (!Array.isArray(paths) || paths.length === 0) {
    return null;
  }

  const lines = paths
    .map((path) => path.map(([x, y]) => {
      const latLng = map.options.crs.unproject(L.point(x, y));
      return [latLng.lng, latLng.lat];
    }))
    .filter((line) => line.length > 1);

  if (lines.length === 0) {
    return null;
  }

  return lines.length === 1
    ? { type: "LineString", coordinates: lines[0] }
    : { type: "MultiLineString", coordinates: lines };
}

function lavalAttribute(properties, technicalName, label) {
  return properties[technicalName]
    ?? properties[label]
    ?? Object.entries(properties).find(([name]) => name.trim() === label.trim())?.[1];
}

function isMeaningfulLavalValue(value) {
  return value && !/^null$/i.test(String(value).trim());
}

function addDirectionArrows(latLngs, closure, targetLayer) {
  if (latLngs.length < 2) {
    return;
  }

  if (currentClosures.length > ARROW_DENSE_LIMIT && map.getZoom() < ARROW_ZOOM_THRESHOLD && closure.id !== selectedClosureId) {
    return;
  }

  const midpointIndex = Math.max(1, Math.floor(latLngs.length / 2));
  const from = latLngs[midpointIndex - 1];
  const to = latLngs[midpointIndex];
  const bearing = bearingDegrees(from, to);
  addArrowMarker(to, bearing, closure.color, targetLayer);

  if (closure.rawType === "Double sens") {
    const reversed = [...latLngs].reverse();
    const middle = reversed[Math.floor(reversed.length / 2)];
    const bearing = bearingDegrees(reversed[0], reversed[reversed.length - 1]);
    addArrowMarker(middle, bearing, closure.color, targetLayer);
  }
}

function addArrowMarker(latLng, bearing, color, targetLayer) {
  L.marker(latLng, {
    interactive: false,
    icon: L.divIcon({
      className: "traffic-arrow",
      html: `<span style="--arrow-color: ${color}; transform: rotate(${bearing}deg)"></span>`
    })
  }).addTo(targetLayer);
}

function bearingDegrees(from, to) {
  const lat1 = degreesToRadians(from[0]);
  const lat2 = degreesToRadians(to[0]);
  const deltaLon = degreesToRadians(to[1] - from[1]);
  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  return (radiansToDegrees(Math.atan2(y, x)) + 360) % 360;
}

function degreesToRadians(value) {
  return value * Math.PI / 180;
}

function radiansToDegrees(value) {
  return value * 180 / Math.PI;
}

const ABBREVIATION_KEYS = {
  VM: "abbreviation.VM",
  SO: "abbreviation.SO",
  RPP: "abbreviation.RPP",
  AC: "abbreviation.AC",
  CDNNDG: "abbreviation.CDNNDG",
  SLR: "abbreviation.SLR",
  LCH: "abbreviation.LCH",
  SLN: "abbreviation.SLN",
  VRD: "abbreviation.VRD",
  VSMPE: "abbreviation.VSMPE",
  MHM: "abbreviation.MHM",
  MTN: "abbreviation.MTN",
  PMR: "abbreviation.PMR",
  MTMD: "abbreviation.MTMD",
  UCI: "abbreviation.UCI",
  BIXI: "abbreviation.BIXI",
  OSRM: "abbreviation.OSRM",
  WFS: "abbreviation.WFS",
  API: "abbreviation.API",
  Open511: "abbreviation.Open511",
  ArcGIS: "abbreviation.ArcGIS",
  CKAN: "abbreviation.CKAN"
};

const MONTREAL_BOROUGH_NAMES = {
  VM: "Ville-Marie",
  SO: "Le Sud-Ouest",
  RPP: "Rosemont–La Petite-Patrie",
  AC: "Ahuntsic-Cartierville",
  CDNNDG: "Côte-des-Neiges–Notre-Dame-de-Grâce",
  SLR: "Saint-Laurent",
  LCH: "LaSalle",
  SLN: "Saint-Léonard",
  VRD: "Verdun",
  VSMPE: "Villeray–Saint-Michel–Parc-Extension",
  MHM: "Mercier–Hochelaga-Maisonneuve",
  MTN: "Montréal-Nord",
  PMR: "Le Plateau-Mont-Royal"
};

function closureBoroughLabel(closure) {
  return MONTREAL_BOROUGH_NAMES[closure.borough] || closure.borough || t("popup.notPublished");
}

function closureMunicipalityLabel(closure) {
  const source = String(closure.source || "");
  const text = `${closure.title || ""} ${closure.streets || ""} ${closure.borough || ""}`;
  if (/Montréal|Montreal|UCI|Quartier des spectacles|Mobilité Montréal/.test(source)) return "Montréal";
  if (/Laval/.test(source)) return "Laval";
  if (/Longueuil/.test(source)) return "Longueuil";
  if (/Repentigny/.test(source)) return "Repentigny";
  if (/Mont-Royal/.test(source)) return "Mont-Royal";
  if (/Beaconsfield/.test(source)) return "Beaconsfield";
  if (/Saint-Eustache/.test(source)) return "Saint-Eustache";
  if (/Châteauguay/.test(source)) return "Châteauguay";
  if (/Assomption/.test(source)) return "L'Assomption";
  if (/Terrebonne/.test(source)) return "Terrebonne";
  if (/Mont-Saint-Hilaire/.test(source)) return "Mont-Saint-Hilaire";
  if (/Dorval/.test(source)) return "Dorval";
  if (/Boisbriand/.test(source)) return "Boisbriand";
  if (/Dollard-des-Ormeaux|DDO/.test(source)) return "Dollard-des-Ormeaux";
  if (/Baie-d'Urfe/.test(source)) return "Baie-d'Urfe";
  if (/Hampstead/.test(source)) return "Hampstead";
  if (/Westmount/.test(source)) return "Westmount";
  if (/Pointe-Claire/.test(source)) return "Pointe-Claire";
  if (/Kirkland/.test(source)) return "Kirkland";
  if (/MTMD|Quebec 511/.test(source)) return municipalityFromPublishedText(text);
  if (/OpenStreetMap|OSRM|Overpass/.test(source)) return t("faq.sourceRegional");
  return closure.responsible || t("popup.notPublished");
}

function municipalityFromPublishedText(text) {
  const municipalities = [
    "Montréal", "Montreal", "Laval", "Longueuil", "Brossard", "Boucherville", "Dorval",
    "Pointe-Claire", "Kirkland", "Westmount", "Hampstead", "Dollard-des-Ormeaux", "Repentigny",
    "Terrebonne", "Boisbriand", "Saint-Eustache", "Châteauguay", "L'Assomption", "Mascouche",
    "Mont-Saint-Hilaire", "Saint-Lambert", "Beloeil", "La Prairie", "Mirabel", "Blainville"
  ];
  const match = municipalities.find((municipality) => text.toLocaleLowerCase("fr").includes(municipality.toLocaleLowerCase("fr")));
  return match ? match.replace("Montreal", "Montréal") : t("faq.metroRegion");
}

function addAbbreviationTooltips(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest(".abbr-tooltip")) continue;
    if (Object.keys(ABBREVIATION_KEYS).some((abbreviation) => node.nodeValue.includes(abbreviation))) {
      textNodes.push(node);
    }
  }

  const pattern = new RegExp(`\\b(${Object.keys(ABBREVIATION_KEYS).sort((a, b) => b.length - a.length).join("|")})\\b`, "g");
  textNodes.forEach((textNode) => {
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    textNode.nodeValue.replace(pattern, (match, abbreviation, offset) => {
      fragment.append(document.createTextNode(textNode.nodeValue.slice(lastIndex, offset)));
      const label = document.createElement("span");
      label.className = "abbr-tooltip";
      label.tabIndex = 0;
      label.dataset.tooltip = t(ABBREVIATION_KEYS[abbreviation]);
      label.textContent = match;
      label.setAttribute("aria-label", `${match}: ${label.dataset.tooltip}`);
      fragment.append(label);
      lastIndex = offset + match.length;
      return match;
    });
    fragment.append(document.createTextNode(textNode.nodeValue.slice(lastIndex)));
    textNode.replaceWith(fragment);
  });
}

function renderList(closures) {
  if (closures.length === 0) {
    const emptyCard = document.createElement("article");
    emptyCard.className = "closure-card";
    emptyCard.innerHTML = `<h3>Aucune entrave auto trouvee</h3><p class="meta">Change la date, la recherche ou les types d'entraves. Les fermetures UCI commencent le 19 septembre 2026.</p>`;
    closureList.replaceChildren(emptyCard);
    return;
  }

  const fragment = document.createDocumentFragment();
  closures.slice(0, MAX_LIST_ITEMS).forEach((closure) => {
    const meta = CATEGORY_META[closure.category] ?? CATEGORY_META.event;
    const severity = SEVERITY_META[closure.severity] ?? SEVERITY_META.major;
    const card = document.createElement("article");
    card.className = "closure-card";
    card.dataset.severity = closure.severity;
    card.tabIndex = 0;
    card.style.borderLeftColor = closure.color || severity.color;
    card.innerHTML = `
      <div class="badge-row">
        <span class="badge severity-badge">${escapeHtml(closureImpactLabel(closure))}</span>
        <span class="badge">${escapeHtml(closureMunicipalityLabel(closure))}</span>
        <span class="badge">${escapeHtml(meta.label())}</span>
        ${closureBoroughLabel(closure) !== closureMunicipalityLabel(closure) ? `<span class="badge">${escapeHtml(closureBoroughLabel(closure))}</span>` : ""}
      </div>
      <h3>${escapeHtml(closure.title)}</h3>
      <p class="meta">${escapeHtml(closure.streets)}</p>
      <p class="meta"><strong>${formatDate(closure.startDate)}</strong> au <strong>${formatDate(closure.endDate)}</strong></p>
      <p class="meta"><strong>Moment:</strong> ${escapeHtml(periodsLabel(closure.periods))}</p>
      <p class="meta"><strong>Impact auto:</strong> ${escapeHtml(closure.impact)}</p>
      <p class="meta"><strong>Direction:</strong> ${escapeHtml(closure.direction)}</p>
    `;
    addAbbreviationTooltips(card);
    card.addEventListener("click", () => focusClosure(closure, { openPopup: true }));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        focusClosure(closure, { openPopup: true });
      }
    });
    fragment.appendChild(card);
  });

  if (closures.length > MAX_LIST_ITEMS) {
    const note = document.createElement("article");
    note.className = "closure-card list-note";
    note.innerHTML = `<h3>${closures.length - MAX_LIST_ITEMS} autres segments affiches sur la carte</h3><p class="meta">Affinez par date, rue ou responsable pour reduire la liste.</p>`;
    fragment.appendChild(note);
  }

  closureList.replaceChildren(fragment);
}

function fitMapToClosures(closures) {
  map.invalidateSize(true);

  if (closures.length === 0 || closures.length > MAX_AUTO_FIT_ITEMS) {
    map.setView(MONTREAL_CENTER, 12);
    return;
  }

  const bounds = L.latLngBounds([]);
  closures.forEach((closure) => {
    const closureBounds = closure._bounds || prepareClosureForRuntime(closure)._bounds;
    if (closureBounds) {
      const [west, south, east, north] = closureBounds;
      bounds.extend([south, west]);
      bounds.extend([north, east]);
    }
  });

  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.12), { maxZoom: 15 });
  } else {
    map.setView(MONTREAL_CENTER, 12);
  }
}

function focusClosure(closure, { openPopup = false } = {}) {
  const point = closure.point || representativePoint(closure.geometry);
  selectedClosureId = closure.id;
  scheduleMapRender();
  map.flyTo([point[1], point[0]], Math.max(map.getZoom(), 15), { duration: 0.55 });
  map.once("moveend", () => scheduleMapRender());

  if (openPopup) {
    const popupLatLng = L.latLng(point[1], point[0]);
    openMapPopup(popupLatLng, groupedPopupContent(closuresNearLatLng(popupLatLng, closure)), 380);
  }
}

function updateView({ fit = false } = {}) {
  currentClosures = getFilteredClosures();
  updateMapLegend();
  renderVisibleClosures();
  updateViewportList();
  setTimeout(() => map.invalidateSize(true), 0);
  setTimeout(() => map.invalidateSize(true), 180);

  if (fit) {
    fitMapToClosures(currentClosures);
  }
}

window.addEventListener("languagechange", () => {
  setSourceSectionOpen(!sourceFilters.hidden);
  menuToggle.setAttribute("aria-label", t(menuToggle.classList.contains("is-open") ? "menu.close" : "menu.open"));
  updateMapLegend();
  renderVisibleClosures();
  updateViewportList();
});

function showMapStatus(message, mode = "loading") {
  mapStatus.textContent = correctFrenchText(message);
  mapStatus.dataset.mode = mode;
  mapStatus.hidden = mode === "ready";

  if (mode === "ready" && !window.localStorage.getItem("mapClickHintSeen")) {
    mapFirstVisitHint.hidden = false;
  }
}

dateStart.addEventListener("change", () => {
  if (parseDate(dateStart.value) > parseDate(dateEnd.value)) {
    dateEnd.value = dateStart.value;
  }
  updateView({ fit: true });
});
dateEnd.addEventListener("change", () => updateView({ fit: true }));
todayDates.addEventListener("click", () => {
  const today = formatInputDate(new Date());
  dateStart.value = today;
  dateEnd.value = today;
  updateView({ fit: true });
});
let searchFilterTimer = null;
searchFilter.addEventListener("input", () => {
  clearTimeout(searchFilterTimer);
  searchFilterTimer = setTimeout(() => updateView({ fit: true }), 160);
});
categoryFilters.forEach((input) => input.addEventListener("change", () => updateView({ fit: true })));
impactFilters.forEach((input) => input.addEventListener("change", () => updateView({ fit: true })));
timeFilters.forEach((input) => input.addEventListener("change", () => updateView({ fit: true })));
dateHelp.addEventListener("click", () => {
  dateHelpBubble.hidden = !dateHelpBubble.hidden;
});
sourceHelp.addEventListener("click", () => {
  sourceHelpBubble.hidden = !sourceHelpBubble.hidden;
});
sourceSectionToggle.addEventListener("click", () => setSourceSectionOpen(sourceFilters.hidden));
impactHelp.addEventListener("click", () => {
  impactHelpBubble.hidden = !impactHelpBubble.hidden;
});
timeHelp.addEventListener("click", () => {
  timeHelpBubble.hidden = !timeHelpBubble.hidden;
});
municipalityHelp.addEventListener("click", () => {
  municipalityHelpBubble.hidden = !municipalityHelpBubble.hidden;
});
document.addEventListener("click", (event) => {
  [
    [dateHelp, dateHelpBubble],
    [sourceHelp, sourceHelpBubble],
    [impactHelp, impactHelpBubble],
    [timeHelp, timeHelpBubble],
    [municipalityHelp, municipalityHelpBubble]
  ].forEach(([button, bubble]) => {
    if (!button.contains(event.target) && !bubble.contains(event.target)) {
      bubble.hidden = true;
    }
  });
});
resetView.addEventListener("click", () => fitMapToClosures(currentClosures));
window.addEventListener("resize", () => map.invalidateSize());
menuToggle.addEventListener("click", () => {
  if (window.matchMedia("(max-width: 880px)").matches) {
    setMobileMenuOpen(!sidePanel.classList.contains("is-open"));
  } else {
    setDesktopPanelOpen(appShell.classList.contains("panel-collapsed"));
  }
});
menuBackdrop.addEventListener("click", () => setMobileMenuOpen(false));
sourcesToggle.addEventListener("click", () => setSourcesOpen(true));
sourcesClose.addEventListener("click", () => setSourcesOpen(false));
mapFirstVisitClose.addEventListener("click", dismissMapFirstVisitHint);
map.on("zoomend", () => {
  updateRenderedLineWidths();
});
map.on("click", (event) => {
  const closure = nearestClosure(event.latlng);
  if (closure) {
    openGroupedPopup(closure, event.latlng);
  }
});

function setMobileMenuOpen(isOpen) {
  sidePanel.classList.toggle("is-open", isOpen);
  menuToggle.classList.toggle("is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", t(isOpen ? "menu.close" : "menu.open"));
  menuBackdrop.hidden = !isOpen;
  setTimeout(() => map.invalidateSize(true), 240);
}

function setDesktopPanelOpen(isOpen) {
  appShell.classList.toggle("panel-collapsed", !isOpen);
  menuToggle.classList.toggle("is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", t(isOpen ? "menu.close" : "menu.open"));
  setTimeout(() => map.invalidateSize(true), 240);
}

function setSourcesOpen(isOpen) {
  sourceCard.hidden = !isOpen;
  sourcesToggle.hidden = isOpen;
  sourcesToggle.setAttribute("aria-expanded", String(isOpen));
}

function setSourceSectionOpen(isOpen) {
  sourceFilters.hidden = !isOpen;
  sourceSectionToggle.setAttribute("aria-expanded", String(isOpen));
  sourceSectionToggle.classList.toggle("is-open", isOpen);
  sourceSectionToggle.querySelector("span").textContent = t(isOpen ? "filters.hideSources" : "filters.showSources");
  sourceSectionToggle.querySelector("b").textContent = isOpen ? "-" : "+";
}

function setPanelWidth(width) {
  const clampedWidth = Math.max(270, Math.min(540, width));
  document.documentElement.style.setProperty("--panel-width", `${clampedWidth}px`);
}

let panelResizeStart = null;
panelResizeHandle.addEventListener("pointerdown", (event) => {
  if (window.matchMedia("(max-width: 880px)").matches) {
    return;
  }

  panelResizeStart = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startWidth: document.querySelector(".panel").getBoundingClientRect().width
  };
  panelResizeHandle.setPointerCapture(event.pointerId);
  document.body.classList.add("is-resizing-panel");
});
panelResizeHandle.addEventListener("pointermove", (event) => {
  if (!panelResizeStart || event.pointerId !== panelResizeStart.pointerId) {
    return;
  }

  setPanelWidth(panelResizeStart.startWidth + event.clientX - panelResizeStart.startX);
});
panelResizeHandle.addEventListener("pointerup", () => {
  panelResizeStart = null;
  document.body.classList.remove("is-resizing-panel");
});
panelResizeHandle.addEventListener("pointercancel", () => {
  panelResizeStart = null;
  document.body.classList.remove("is-resizing-panel");
});

const currentDate = formatInputDate(new Date());
dateStart.value = currentDate;
dateEnd.value = currentDate;

if (window.matchMedia("(max-width: 880px)").matches) {
  setMobileMenuOpen(false);
} else {
  setDesktopPanelOpen(true);
}

renderMunicipalityLinks();
updateView({ fit: true });
loadOfficialData().catch((error) => {
  console.error("Official data load failed", error);
  showMapStatus(t("map.loadError"), "error");
  updateView({ fit: true });
});