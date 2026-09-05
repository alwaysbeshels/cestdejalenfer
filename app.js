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

const LIVE_SOURCES = {
  montreal: "https://api.montreal.ca/api/it-platforms/geomatic/wfs-maps/montreal/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=montreal:entraves-ponctuelles&outputFormat=application/json&CQL_FILTER=affectedArea%20like%20%27%25street%25%27",
  uciRestrictions: "https://api.montreal.ca/api/it-platforms/geomatic/wfs-feature/v1/ls-montreal/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ls-montreal:uci-2026-vdm-restrictions-circulation_v2&outputFormat=application/json",
  longueuilPoints: "https://geomatique.longueuil.quebec/public/rest/services/Communication/Gestion_des_entraves_Diffusion/FeatureServer/0/query?f=geojson&where=1%3D1&outFields=*&outSR=4326",
  longueuilSurfaces: "https://geomatique.longueuil.quebec/public/rest/services/Communication/Gestion_des_entraves_Diffusion/FeatureServer/1/query?f=geojson&where=1%3D1&outFields=*&outSR=4326",
  lavalMapService: "https://gis.laval.ca/arcgis/rest/services/ing/Obstruction_14_jours/MapServer",
  quebec511: "https://ws.mapserver.transports.gouv.qc.ca/swtq?service=wfs&version=2.0.0&request=getfeature&typename=ms:chantiers_mtmdet&srsname=EPSG:4326&outputformat=geojson"
};

const LAVAL_LAYERS = [
  { id: 0, labelKey: "laval.closed", severity: "critical" },
  { id: 2, labelKey: "laval.partial", severity: "major" },
  { id: 3, labelKey: "laval.planned", severity: "moderate" }
];

const GREATER_MONTREAL_BOUNDS = {
  west: -74.1,
  south: 45.25,
  east: -73.2,
  north: 45.9
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
    id: "pedestrian-mont-royal-saint-laurent-resther",
    title: "Avenue du Mont-Royal piétonne - Saint-Laurent à Resther",
    category: "commercial",
    responsible: "Arrondissement du Plateau-Mont-Royal",
    borough: "Le Plateau-Mont-Royal",
    startDate: "2026-05-28",
    endDate: "2026-10-12",
    impact: "Rue réservée aux piétons; circulation automobile fermée durant la piétonnisation estivale.",
    trafficLabel: "Rue piétonne saisonnière",
    severity: "critical",
    direction: "Fermée à la circulation automobile dans les deux directions.",
    streets: "Avenue du Mont-Royal, entre le boulevard Saint-Laurent et la rue Resther",
    source: "Ville de Montréal - Piétonnisation de l'avenue du Mont-Royal",
    sourceUrl: "https://montreal.ca/lieux/avenue-du-mont-royal",
    periods: ["day", "night"],
    osmQuery: "Avenue du Mont-Royal, Montréal, Québec",
    streetBounds: [-73.591, 45.515, -73.5785, 45.528],
    geometry: { type: "LineString", coordinates: [[-73.5901, 45.5243], [-73.5849, 45.5260], [-73.5791, 45.5275]] },
    point: [-73.5849, 45.5260]
  },
  {
    id: "pedestrian-mont-royal-resther-lorimier",
    title: "Avenue du Mont-Royal piétonne - Resther à De Lorimier",
    category: "commercial",
    responsible: "Arrondissement du Plateau-Mont-Royal",
    borough: "Le Plateau-Mont-Royal",
    startDate: "2026-05-28",
    endDate: "2026-09-07",
    impact: "Rue réservée aux piétons; circulation automobile fermée durant la piétonnisation estivale.",
    trafficLabel: "Rue piétonne saisonnière",
    severity: "critical",
    direction: "Fermée à la circulation automobile dans les deux directions.",
    streets: "Avenue du Mont-Royal, entre la rue Resther et l'avenue De Lorimier",
    source: "Ville de Montréal - Piétonnisation de l'avenue du Mont-Royal",
    sourceUrl: "https://montreal.ca/lieux/avenue-du-mont-royal",
    periods: ["day", "night"],
    osmQuery: "Avenue du Mont-Royal, Montréal, Québec",
    streetBounds: [-73.580, 45.527, -73.567, 45.532],
    geometry: { type: "LineString", coordinates: [[-73.5791, 45.5275], [-73.5738, 45.5290], [-73.5686, 45.5307]] },
    point: [-73.5738, 45.5290]
  },
  {
    id: "pedestrian-wellington-verdun",
    title: "Rue Wellington piétonne",
    category: "commercial",
    responsible: "Arrondissement de Verdun / SDC Wellington",
    borough: "Verdun",
    startDate: "2026-06-01",
    endDate: "2026-09-21",
    impact: "Rue réservée aux piétons; circulation automobile fermée pour la saison estivale.",
    trafficLabel: "Rue piétonne saisonnière",
    severity: "critical",
    direction: "Fermée à la circulation automobile dans les deux directions.",
    streets: "Rue Wellington, entre les rues Regina et de la 6e Avenue",
    source: "Ville de Montréal - Rues piétonnes saisonnières",
    sourceUrl: "https://montreal.ca/lieux?mtl_content.lieux.installation.code=RUPIE",
    periods: ["day", "night"],
    osmQuery: "Rue Wellington, Verdun, Montréal, Québec",
    streetBounds: [-73.5685, 45.456, -73.5668, 45.4638],
    geometry: { type: "LineString", coordinates: [[-73.5712, 45.4565], [-73.5676, 45.4597], [-73.5634, 45.4633]] },
    point: [-73.5676, 45.4597]
  },
  {
    id: "pedestrian-sainte-catherine-quartier-spectacles",
    title: "Rue Sainte-Catherine Est piétonne - Quartier des spectacles",
    category: "commercial",
    responsible: "Quartier des spectacles / Ville de Montréal",
    borough: "Ville-Marie",
    startDate: "2026-05-15",
    endDate: "2026-10-15",
    impact: "Secteur piétonnier saisonnier; circulation automobile fermée selon la programmation du Quartier des spectacles.",
    trafficLabel: "Rue piétonne saisonnière",
    severity: "critical",
    direction: "Fermée à la circulation automobile dans les deux directions.",
    streets: "Rue Sainte-Catherine Est, entre les rues De Bleury et Saint-Laurent",
    source: "Quartier des spectacles - Rues et espaces publics",
    sourceUrl: "https://www.quartierdesspectacles.com/",
    periods: ["day", "night"],
    osmQuery: "Rue Sainte-Catherine Est, Montréal, Québec",
    streetBounds: [-73.567, 45.508, -73.558, 45.511],
    geometry: { type: "LineString", coordinates: [[-73.5664, 45.5088], [-73.5629, 45.5094], [-73.5595, 45.5099]] },
    point: [-73.5629, 45.5094]
  }
];

const LINKED_MUNICIPALITIES = [
  { name: "Baie-d'Urfe", coordinates: [-73.916, 45.414], url: "https://baie-durfe.qc.ca/fr/nos-departements/page/info-travaux", detail: "Info-travaux avec dates et impacts", quality: "detaillee", links: [{ label: "Info-travaux", url: "https://baie-durfe.qc.ca/fr/nos-departements/page/info-travaux" }] },
  { name: "Beaconsfield", coordinates: [-73.865, 45.433], url: "https://portail.beaconsfield.ca/fr/avis", detail: "Portail citoyen et avis municipaux", links: [{ label: "Avis municipaux", url: "https://portail.beaconsfield.ca/fr/avis" }, { label: "Site principal", url: "https://www.beaconsfield.ca/" }] },
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

let allClosures = [
  ...window.CLOSURES.map(normalizeLegacyClosure),
  ...REGIONAL_MAJOR_CLOSURES.map(normalizeRegionalClosure),
  ...SEASONAL_PEDESTRIAN_STREETS.map(normalizePedestrianStreet),
  ...LINKED_CITY_WORKS.map(normalizeLinkedCityWork)
];
let currentClosures = [];
let selectedClosureId = null;

const map = L.map("map", {
  preferCanvas: true,
  fadeAnimation: false,
  zoomAnimation: true,
  zoomControl: true,
  minZoom: 10,
  maxZoom: 19
}).setView(MONTREAL_CENTER, 12);

const baseLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 20,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const closureLayer = L.layerGroup().addTo(map);
const arrowLayer = L.layerGroup().addTo(map);
const fastRenderer = L.canvas({ padding: 0.5 });

function dismissMapFirstVisitHint() {
  mapFirstVisitHint.hidden = true;
  window.localStorage.setItem("mapClickHintSeen", "true");
}

function mapLineWidth(width) {
  const zoom = map.getZoom();
  const scale = Math.max(0.3, Math.min(1, 0.3 + (zoom - 10) * 0.1167));
  return Math.max(1, Math.round(width * scale));
}

let lavalOfficialLines = null;
let lavalOverlayTimer = null;
let lavalOverlayRequestId = 0;
let lavalViewportIds = null;
let lavalViewportTimer = null;
let lavalViewportRequestId = 0;
L.control.scale({ metric: true, imperial: false }).addTo(map);

baseLayer.on("load", () => {
  document.querySelectorAll(".leaflet-tile").forEach((tile) => {
    tile.style.opacity = "1";
  });
  map.invalidateSize();
});
baseLayer.on("tileerror", () => showMapStatus(t("map.tileError"), "error"));
map.on("moveend zoomend", () => scheduleLavalOfficialLines());
map.on("moveend", () => {
  updateViewportList();
  scheduleLavalViewportRefresh();
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
  return new Intl.DateTimeFormat("fr-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parseDate(value));
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
  return parseDate(closure.startDate) <= range.end && parseDate(closure.endDate) >= range.start;
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

  const haystack = [
    closure.title,
    closure.responsible,
    closure.borough,
    closure.impact,
    closure.streets,
    closure.direction,
    closure.source
  ].join(" ").toLowerCase();

  return haystack.includes(query.toLowerCase());
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
  const query = searchFilter.value.trim();

  return allClosures
    .filter((closure) => categories.has(closure.category))
    .filter((closure) => impacts.has(closure.severity))
    .filter((closure) => matchesTimePeriod(closure, timePeriods))
    .filter((closure) => overlapsDateRange(closure, dateRange))
    .filter((closure) => matchesSearch(closure, query))
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

function getFilterBaseClosures() {
  const categories = getActiveCategories();
  const timePeriods = getActiveTimePeriods();
  const dateRange = getDateRange();
  const query = searchFilter.value.trim();

  return allClosures
    .filter((closure) => categories.has(closure.category))
    .filter((closure) => matchesTimePeriod(closure, timePeriods))
    .filter((closure) => overlapsDateRange(closure, dateRange))
    .filter((closure) => matchesSearch(closure, query));
}

function getClosuresInViewport() {
  return filterClosuresToViewport(currentClosures);
}

function filterClosuresToViewport(closures) {
  const bounds = map.getBounds();
  return closures.filter((closure) => closure.category === "laval"
    ? !lavalViewportIds || lavalViewportIds.has(closure.id)
    : closureIntersectsBounds(closure, bounds));
}

function closureIntersectsBounds(closure, bounds) {
  const coordinates = flattenCoordinates(closure.geometry?.coordinates);
  if (coordinates.length === 0 && closure.point) {
    coordinates.push(closure.point);
  }

  if (coordinates.length === 0) {
    return false;
  }

  const closureBounds = L.latLngBounds(coordinates.map(([longitude, latitude]) => [latitude, longitude]));
  return closureBounds.isValid() && bounds.intersects(closureBounds);
}

function updateViewportList() {
  const viewportClosures = getClosuresInViewport();
  renderList(viewportClosures);
  visibleCount.textContent = String(viewportClosures.length);
  updateImpactCounts();
}

function scheduleLavalViewportRefresh() {
  clearTimeout(lavalViewportTimer);
  lavalViewportTimer = setTimeout(refreshLavalViewportEntries, 120);
}

async function refreshLavalViewportEntries() {
  if (!getActiveCategories().has("laval")) {
    lavalViewportIds = new Set();
    updateViewportList();
    return;
  }

  const bounds = map.getBounds();
  const southWest = map.options.crs.project(bounds.getSouthWest());
  const northEast = map.options.crs.project(bounds.getNorthEast());
  const requestId = ++lavalViewportRequestId;

  try {
    const results = await Promise.all(LAVAL_LAYERS.map(async (layer) => {
      const params = new URLSearchParams({
        f: "json",
        where: "1=1",
        outFields: "OBJECTID",
        returnGeometry: "false",
        geometry: `${southWest.x},${southWest.y},${northEast.x},${northEast.y}`,
        geometryType: "esriGeometryEnvelope",
        inSR: "3857",
        spatialRel: "esriSpatialRelIntersects"
      });
      const data = await fetchJson(`${LIVE_SOURCES.lavalMapService}/${layer.id}/query?${params}`);
      return (data.features || []).map((feature) => `laval-${layer.id}-${feature.attributes.OBJECTID}`);
    }));

    if (requestId !== lavalViewportRequestId) {
      return;
    }

    lavalViewportIds = new Set(results.flat());
    updateViewportList();
  } catch (error) {
    console.warn("Laval viewport filtering failed", error);
  }
}

function updateImpactCounts() {
  const counts = filterClosuresToViewport(getFilterBaseClosures()).reduce((result, closure) => {
    result[closure.severity] = (result[closure.severity] || 0) + 1;
    return result;
  }, {});

  document.querySelectorAll("[data-impact-count]").forEach((element) => {
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
      return { severity: "critical", label: "Rue bloquee", impact: "Circulation automobile bloquee sur le segment indique; détour probable." };
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
      return { severity: "critical", label: "Rue fermée UCI", impact: "Circulation interdite pendant la periode indiquee." };
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
    color: severity.color
  };
}

function normalizePedestrianStreet(closure) {
  const severity = SEVERITY_META[closure.severity] ?? SEVERITY_META.critical;
  return {
    ...closure,
    sourceKind: "seasonal-pedestrian-street",
    color: severity.color,
    geometry: closure.geometry || { type: "Point", coordinates: closure.point }
  };
}

function normalizeLinkedCityWork(closure) {
  const severity = SEVERITY_META[closure.severity] ?? SEVERITY_META.moderate;
  return {
    ...closure,
    category: "linkedCity",
    sourceKind: "linked-city-work",
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
  const text = `${properties.entraveType || ""} ${properties.entrave || ""}`.toLowerCase();
  if (/ferm|fermeture compl|route barr|autoroute barr/.test(text)) {
    return { severity: "critical", label: "Fermeture routière" };
  }
  if (/stationnement/.test(text)) {
    return { severity: "parking", label: "Stationnement touche" };
  }
  if (/alternance|voie|entrave|circulation/.test(text)) {
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

function normalizeLavalFeature(feature, layer) {
  const properties = feature.attributes ?? {};
  const severity = SEVERITY_META[layer.severity] ?? SEVERITY_META.major;
  return {
    id: `laval-${layer.id}-${properties.OBJECTID}`,
    category: "laval",
    sourceKind: "laval-mapserver",
    title: `${properties.ENTRAVE || t(layer.labelKey)} - ${properties.LOCALISATION || t("popup.notPublished")}`,
    responsible: properties.RESPONSABLE || "Ville de Laval",
    borough: "Laval",
    startDate: dateOnlyFromTimestamp(properties.DATE_DEBUT),
    endDate: dateOnlyFromTimestamp(properties.DATE_FIN),
    impact: [properties.ENTRAVE, properties.CIRCULATION, properties.REMARQUE].filter(isMeaningfulLavalValue).join(" - ") || "Details de circulation non publies.",
    trafficLabel: properties.ENTRAVE || t(layer.labelKey),
    severity: layer.severity,
    direction: properties.DIRECTION || t("popup.notPublished"),
    streets: properties.LOCALISATION || t("popup.notPublished"),
    source: `Laval Info-Travaux - ${t(layer.labelKey)}`,
    sourceUrl: "https://vl.maps.arcgis.com/apps/instant/sidebar/index.html?appid=729ff9eeb851437b9a4cf365efadfe8f",
    periods: ["day", "night"],
    color: severity.color,
    details: [["Nature", properties.NATURE], ["Reference", properties.NO_REFERENCE]]
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
    category: "longueuil",
    sourceKind: `longueuil-${layerKind}`,
    responsible: longueuilResponsibleLabel(properties),
    borough: "Longueuil",
    startDate: dateOnlyFromTimestamp(properties.DATE_DEBUT),
    endDate: dateOnlyFromTimestamp(properties.DATE_FIN),
    impact: roadImpact.impact,
    trafficLabel: roadImpact.label,
    severity: roadImpact.severity,
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
  const timestamp = Number(value);
  const date = Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp) : new Date(value);
  return Number.isNaN(date.valueOf()) ? dateOnly(value) : date.toISOString().slice(0, 10);
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
  return Promise.all(SEASONAL_PEDESTRIAN_STREETS.map(async (street) => {
    try {
      const geometry = await fetchNamedStreetGeometry(street.osmQuery, street.streetBounds);
      return normalizePedestrianStreet({
        ...street,
        geometry,
        point: representativePoint(geometry),
        geometryFromOsm: true
      });
    } catch (error) {
      console.warn("Pedestrian street geometry failed", street.id, error);
      return normalizePedestrianStreet(street);
    }
  }));
}

async function fetchNamedStreetGeometry(query, [west, south, east, north]) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=50&polygon_geojson=1&q=${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  const segments = data
    .filter((item) => item.geojson?.type === "LineString")
    .map((item) => item.geojson.coordinates)
    .filter((coordinates) => coordinates.length > 1 && coordinates.some(([longitude, latitude]) => {
      return longitude >= west && longitude <= east && latitude >= south && latitude <= north;
    }));

  if (segments.length === 0) {
    throw new Error("No named street geometry returned");
  }

  return { type: "MultiLineString", coordinates: segments };
}

async function loadLongueuilClosures() {
  const surfaceData = await fetchJson(LIVE_SOURCES.longueuilSurfaces);

  return (surfaceData.features || [])
    .map((feature) => normalizeLongueuilFeature(feature, "surface"))
    .filter(Boolean);
}

async function loadLavalClosures() {
  const results = await Promise.all(LAVAL_LAYERS.map(async (layer) => {
    const url = `${LIVE_SOURCES.lavalMapService}/${layer.id}/query?f=json&where=1%3D1&outFields=*&returnGeometry=false`;
    const data = await fetchJson(url);
    return (data.features || []).map((feature) => normalizeLavalFeature(feature, layer));
  }));

  return results.flat();
}

async function loadQuebec511Closures() {
  const data = await fetchJson(LIVE_SOURCES.quebec511);
  return (data.features || [])
    .filter((feature) => feature.geometry?.coordinates?.length && intersectsGreaterMontreal(feature.bbox))
    .map(normalizeQuebec511Feature);
}

function intersectsGreaterMontreal(bbox) {
  if (!Array.isArray(bbox) || bbox.length < 4) {
    return false;
  }

  const [west, south, east, north] = bbox;
  return east >= GREATER_MONTREAL_BOUNDS.west
    && west <= GREATER_MONTREAL_BOUNDS.east
    && north >= GREATER_MONTREAL_BOUNDS.south
    && south <= GREATER_MONTREAL_BOUNDS.north;
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

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function loadOfficialData() {
  showMapStatus(t("map.loading"), "loading");

  const [montrealResult, uciResult, regionalResult, linkedCityResult, longueuilResult, lavalResult, quebec511Result, pedestrianStreetResult] = await Promise.allSettled([
    fetchJson(LIVE_SOURCES.montreal),
    fetchJson(LIVE_SOURCES.uciRestrictions),
    loadRegionalClosures(),
    loadLinkedCityWorks(),
    loadLongueuilClosures(),
    loadLavalClosures(),
    loadQuebec511Closures(),
    loadSeasonalPedestrianStreets()
  ]);

  const officialClosures = [];
  const sourceCounts = [];

  if (montrealResult.status === "fulfilled") {
    const montrealClosures = montrealResult.value.features.flatMap(normalizeMontrealFeature);
    officialClosures.push(...montrealClosures);
    sourceCounts.push(`${montrealClosures.length} entraves auto Montreal`);
  }

  if (uciResult.status === "fulfilled") {
    const uciClosures = uciResult.value.features.map(normalizeUciFeature);
    officialClosures.push(...uciClosures);
    sourceCounts.push(`${uciClosures.length} segments UCI`);
  }

  if (regionalResult.status === "fulfilled") {
    officialClosures.push(...regionalResult.value);
    sourceCounts.push(`${regionalResult.value.length} fermetures ponts/grands axes alignees aux routes`);
  }

  const pedestrianStreets = pedestrianStreetResult.status === "fulfilled"
    ? pedestrianStreetResult.value
    : SEASONAL_PEDESTRIAN_STREETS.map(normalizePedestrianStreet);
  officialClosures.push(...pedestrianStreets);
  sourceCounts.push(`${pedestrianStreets.length} rues piétonnes saisonnières`);

  if (quebec511Result.status === "fulfilled") {
    officialClosures.push(...quebec511Result.value);
    sourceCounts.push(`${quebec511Result.value.length} entraves Quebec 511 / MTMD`);
  }

  if (lavalResult.status === "fulfilled") {
    officialClosures.push(...lavalResult.value);
    sourceCounts.push(`${lavalResult.value.length} entraves Laval`);
  }

  if (linkedCityResult.status === "fulfilled") {
    officialClosures.push(...linkedCityResult.value);
    sourceCounts.push(`${linkedCityResult.value.length} travaux de villes liées alignes aux rues`);
  }

  if (longueuilResult.status === "fulfilled") {
    officialClosures.push(...longueuilResult.value);
    sourceCounts.push(`${longueuilResult.value.length} entraves Longueuil`);
  }

  if (officialClosures.length === 0) {
    showMapStatus(t("map.apiUnavailable"), "error");
  } else {
    allClosures = dedupeClosures(officialClosures);
    showMapStatus(`Donnees chargees: ${sourceCounts.join(" + ")}.`, "ready");
  }

  map.invalidateSize(true);
  updateView({ fit: true });
  scheduleLavalViewportRefresh();
}

function dedupeClosures(closures) {
  const seen = new Set();
  return closures.filter((closure) => {
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
      <p class="popup-meta"><strong>${escapeHtml(severity.label())}</strong> - ${escapeHtml(meta.label())}</p>
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
  return `
    <button class="popup-close-button" type="button" aria-label="Fermer les détails">&times;</button>
    <div class="popup-group-title">${title}</div>
    ${closures.slice(0, 8).map(popupContent).join("")}
    ${closures.length > 8 ? `<p class="popup-meta">${closures.length - 8} ${t("popup.otherNearby")}</p>` : ""}
  `;
}

function openGroupedPopup(primaryClosure, latLng) {
  selectedClosureId = primaryClosure.id;
  renderMap(currentClosures);
  const nearbyClosures = closuresNearLatLng(latLng, primaryClosure);
  openMapPopup(latLng, groupedPopupContent(nearbyClosures), 420);
}

function openMapPopup(latLng, content, maxWidth) {
  const popup = L.popup({
    maxWidth,
    autoPan: false
  })
    .setLatLng(latLng)
    .setContent(content)
    .openOn(map);

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
  closureLayer.clearLayers();
  arrowLayer.clearLayers();

  [...closures].sort((a, b) => layerRank(a) - layerRank(b)).forEach((closure) => {
    if (closure.category === "laval") {
      return;
    }

    const severity = SEVERITY_META[closure.severity] ?? SEVERITY_META.major;
    const lineWidth = mapLineWidth(severity.width);
    const commonStyle = { color: closure.color, weight: lineWidth, opacity: severity.opacity, renderer: fastRenderer };
    const hitStyle = { color: closure.color, weight: Math.max(34, severity.width + 20), opacity: 0.01, renderer: fastRenderer };
    let mainLayer = null;

    if (closure.geometry?.type === "LineString") {
      const latLngs = toLatLngs(closure.geometry.coordinates);
      mainLayer = L.polyline(latLngs, commonStyle).addTo(closureLayer);
      L.polyline(latLngs, hitStyle).on("click", (event) => {
        dismissMapFirstVisitHint();
        openGroupedPopup(closure, event.latlng);
      }).addTo(closureLayer);
      addDirectionArrows(latLngs, closure);
    } else if (closure.geometry?.type === "MultiLineString") {
      closure.geometry.coordinates.forEach((lineCoordinates) => {
        const latLngs = toLatLngs(lineCoordinates);
        mainLayer = L.polyline(latLngs, commonStyle).addTo(closureLayer);
        L.polyline(latLngs, hitStyle).on("click", (event) => {
          dismissMapFirstVisitHint();
          openGroupedPopup(closure, event.latlng);
        }).addTo(closureLayer);
        addDirectionArrows(latLngs, closure);
      });
    } else if (closure.geometry?.type === "Polygon") {
      mainLayer = L.polygon(toLatLngs(closure.geometry.coordinates), {
        color: closure.color,
        weight: lineWidth,
        opacity: severity.opacity,
        fillColor: closure.color,
        fillOpacity: closure.severity === "critical" ? 0.32 : 0.2,
        renderer: fastRenderer
      }).addTo(closureLayer);
    } else if (closure.point) {
      mainLayer = L.circleMarker([closure.point[1], closure.point[0]], {
        radius: closure.severity === "critical" ? 8 : 6,
        color: "#ffffff",
        weight: 3,
        fillColor: closure.color,
        fillOpacity: 1,
        renderer: fastRenderer
      }).addTo(closureLayer);
    }

    if (mainLayer) {
      mainLayer.on("click", (event) => {
        dismissMapFirstVisitHint();
        openGroupedPopup(closure, event.latlng);
      });
    }
  });
}

function scheduleLavalOfficialLines() {
  clearTimeout(lavalOverlayTimer);
  lavalOverlayTimer = setTimeout(updateLavalOfficialLines, 100);
}

function updateLavalOfficialLines() {
  if (!getActiveCategories().has("laval")) {
    lavalOverlayRequestId += 1;
    if (lavalOfficialLines) {
      map.removeLayer(lavalOfficialLines);
      lavalOfficialLines = null;
    }
    return;
  }

  const bounds = map.getBounds();
  const southWest = map.options.crs.project(bounds.getSouthWest());
  const northEast = map.options.crs.project(bounds.getNorthEast());
  const size = map.getSize();
  const params = new URLSearchParams({
    f: "image",
    bbox: `${southWest.x},${southWest.y},${northEast.x},${northEast.y}`,
    bboxSR: "3857",
    imageSR: "3857",
    size: `${Math.min(size.x, 2048)},${Math.min(size.y, 2048)}`,
    format: "png32",
    transparent: "true",
    dynamicLayers: JSON.stringify(lavalDynamicLayers())
  });
  const url = `${LIVE_SOURCES.lavalMapService}/export?${params}`;

  const requestId = ++lavalOverlayRequestId;
  const nextOverlay = L.imageOverlay(url, bounds, {
    interactive: false,
    opacity: 0,
    zIndex: 450
  }).addTo(map);

  nextOverlay.once("load", () => {
    if (requestId !== lavalOverlayRequestId || !getActiveCategories().has("laval")) {
      map.removeLayer(nextOverlay);
      return;
    }

    const previousOverlay = lavalOfficialLines;
    lavalOfficialLines = nextOverlay;
    nextOverlay.setOpacity(1);
    if (previousOverlay) {
      map.removeLayer(previousOverlay);
    }
  });
}

function lavalDynamicLayers() {
  return [
    lavalDynamicLayer(0, SEVERITY_META.critical.color, mapLineWidth(SEVERITY_META.critical.width)),
    lavalDynamicLayer(2, SEVERITY_META.major.color, mapLineWidth(SEVERITY_META.major.width)),
    lavalDynamicLayer(3, SEVERITY_META.moderate.color, mapLineWidth(SEVERITY_META.moderate.width))
  ];
}

function lavalDynamicLayer(layerId, color, width) {
  const [red, green, blue] = color.match(/[\da-f]{2}/gi).map((value) => Number.parseInt(value, 16));
  return {
    id: layerId,
    source: { type: "mapLayer", mapLayerId: layerId },
    drawingInfo: {
      renderer: {
        type: "simple",
        symbol: { type: "esriSLS", style: "esriSLSSolid", color: [red, green, blue, 255], width }
      }
    }
  };
}

async function identifyLavalClosure(latLng) {
  if (!getActiveCategories().has("laval")) {
    return false;
  }

  const bounds = map.getBounds();
  const southWest = map.options.crs.project(bounds.getSouthWest());
  const northEast = map.options.crs.project(bounds.getNorthEast());
  const size = map.getSize();
  const projectedPoint = map.options.crs.project(latLng);
  const params = new URLSearchParams({
    f: "json",
    geometry: `${projectedPoint.x},${projectedPoint.y}`,
    geometryType: "esriGeometryPoint",
    sr: "3857",
    mapExtent: `${southWest.x},${southWest.y},${northEast.x},${northEast.y}`,
    imageDisplay: `${size.x},${size.y},96`,
    tolerance: "12",
    layers: "visible:0,2,3",
    returnGeometry: "false"
  });

  try {
    const data = await fetchJson(`${LIVE_SOURCES.lavalMapService}/identify?${params}`);
    const result = data.results?.[0];
    if (!result) {
      return false;
    }

    const closure = normalizeLavalIdentifyResult(result);
    openMapPopup(latLng, popupContent(closure), 420);
    return true;
  } catch (error) {
    console.warn("Laval identify failed", error);
    return false;
  }
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

  return {
    id: `laval-identify-${layerId}-${properties.OBJECTID || lavalAttribute(properties, "NO_OBSTRUCTION", "Obstruction # :") || location}`,
    title: `${entrave || result.layerName || "Entrave"} - ${location}`,
    category: "laval",
    responsible: responsible || "Ville de Laval",
    borough: "Laval",
    startDate: dateOnlyFromTimestamp(startDate),
    endDate: dateOnlyFromTimestamp(endDate),
    impact: impact || "Details de circulation non publies.",
    trafficLabel: entrave || result.layerName || "Entrave Laval",
    severity,
    periods: ["day", "night"],
    direction: "Direction precise non publiée dans les attributs Laval.",
    streets: location,
    source: "Laval Info-Travaux - details officiels",
    sourceUrl: "https://vl.maps.arcgis.com/apps/instant/sidebar/index.html?appid=729ff9eeb851437b9a4cf365efadfe8f",
    color: SEVERITY_META[severity].color,
    details: [["Nature", nature], ["Reference", reference]]
  };
}

function lavalAttribute(properties, technicalName, label) {
  return properties[technicalName]
    ?? properties[label]
    ?? Object.entries(properties).find(([name]) => name.trim() === label.trim())?.[1];
}

function isMeaningfulLavalValue(value) {
  return value && !/^null$/i.test(String(value).trim());
}

function addDirectionArrows(latLngs, closure) {
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
  addArrowMarker(to, bearing, closure.color);

  if (closure.rawType === "Double sens") {
    const reversed = [...latLngs].reverse();
    const middle = reversed[Math.floor(reversed.length / 2)];
    const bearing = bearingDegrees(reversed[0], reversed[reversed.length - 1]);
    addArrowMarker(middle, bearing, closure.color);
  }
}

function addArrowMarker(latLng, bearing, color) {
  L.marker(latLng, {
    interactive: false,
    icon: L.divIcon({
      className: "traffic-arrow",
      html: `<span style="--arrow-color: ${color}; transform: rotate(${bearing}deg)"></span>`
    })
  }).addTo(arrowLayer);
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

function renderList(closures) {
  closureList.innerHTML = "";

  if (closures.length === 0) {
    closureList.innerHTML = `<article class="closure-card"><h3>Aucune entrave auto trouvee</h3><p class="meta">Change la date, la recherche ou les types d'entraves. Les fermetures UCI commencent le 19 septembre 2026.</p></article>`;
    return;
  }

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
        <span class="badge severity-badge">${escapeHtml(severity.label())}</span>
        <span class="badge">${escapeHtml(meta.label())}</span>
        <span class="badge">${escapeHtml(closure.borough)}</span>
      </div>
      <h3>${escapeHtml(closure.title)}</h3>
      <p class="meta">${escapeHtml(closure.streets)}</p>
      <p class="meta"><strong>${formatDate(closure.startDate)}</strong> au <strong>${formatDate(closure.endDate)}</strong></p>
      <p class="meta"><strong>Moment:</strong> ${escapeHtml(periodsLabel(closure.periods))}</p>
      <p class="meta"><strong>Impact auto:</strong> ${escapeHtml(closure.impact)}</p>
      <p class="meta"><strong>Direction:</strong> ${escapeHtml(closure.direction)}</p>
    `;
    card.addEventListener("click", () => focusClosure(closure, { openPopup: true }));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        focusClosure(closure, { openPopup: true });
      }
    });
    closureList.appendChild(card);
  });

  if (closures.length > MAX_LIST_ITEMS) {
    const note = document.createElement("article");
    note.className = "closure-card list-note";
    note.innerHTML = `<h3>${closures.length - MAX_LIST_ITEMS} autres segments affiches sur la carte</h3><p class="meta">Affinez par date, rue ou responsable pour reduire la liste.</p>`;
    closureList.appendChild(note);
  }
}

function fitMapToClosures(closures) {
  map.invalidateSize(true);

  if (closures.length === 0 || closures.length > MAX_AUTO_FIT_ITEMS) {
    map.setView(MONTREAL_CENTER, 12);
    return;
  }

  const bounds = L.latLngBounds([]);
  closures.forEach((closure) => flattenCoordinates(closure.geometry?.coordinates).forEach(([lon, lat]) => bounds.extend([lat, lon])));

  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.12), { maxZoom: 15 });
  } else {
    map.setView(MONTREAL_CENTER, 12);
  }
}

function focusClosure(closure, { openPopup = false } = {}) {
  const point = closure.point || representativePoint(closure.geometry);
  selectedClosureId = closure.id;
  renderMap(currentClosures);
  map.flyTo([point[1], point[0]], Math.max(map.getZoom(), 15), { duration: 0.55 });
  map.once("moveend", () => renderMap(currentClosures));

  if (openPopup) {
    const popupLatLng = L.latLng(point[1], point[0]);
    openMapPopup(popupLatLng, groupedPopupContent(closuresNearLatLng(popupLatLng, closure)), 380);
  }
}

function updateView({ fit = false } = {}) {
  currentClosures = getFilteredClosures();
  updateImpactCounts();
  updateMapLegend();
  renderMap(currentClosures);
  updateLavalOfficialLines();
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
  renderMap(currentClosures);
  updateViewportList();
  updateLavalOfficialLines();
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
searchFilter.addEventListener("input", () => updateView({ fit: true }));
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
map.on("zoomend", () => renderMap(currentClosures));
map.on("click", (event) => {
  const closure = nearestClosure(event.latlng);
  if (closure && closure.category !== "laval") {
    openGroupedPopup(closure, event.latlng);
    return;
  }

  identifyLavalClosure(event.latlng);
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