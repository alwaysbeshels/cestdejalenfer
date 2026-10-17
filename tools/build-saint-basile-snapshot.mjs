import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { chromium } from "playwright";

const OUTPUT = "data/saint-basile-worksites-snapshot.json";
const MAP_URL = "https://www.villesblg.ca/carte-interactive/?categorie=travaux";
const WORKS_URL = "https://www.villesblg.ca/services-aux-citoyens/infrastructures-et-reseau-routier/travaux/";
const MILLENIA_URL = "https://www.villesblg.ca/services-aux-citoyens/infrastructures-et-reseau-routier/projets-de-construction-residentielle/projet-le-millenia/";
const TIME_ZONE = "America/Toronto";
const previousSnapshot = JSON.parse(await readFile(OUTPUT, "utf8"));
const recordSupplementalReview = process.argv.includes("--review-supplemental-sources");
const NOTICE_CONTEXT = {
  "61620": {
    url: `${WORKS_URL}reconstruction-dune-portion-du-rang-des-vingt/`,
    impact: "Le projet est publié en cours, jusqu’en octobre, de 7 h à 17 h. Des entraves partielles sont annoncées pour des travaux paysagers sporadiques; circulation possible. Des travaux de Bell et Hydro-Québec se font en alternance avec des signaleurs. Les entraves précises seront communiquées lorsqu’elles seront connues.",
    sourceText: "Les travaux de reconstruction du rang des Vingt sont en cours et se poursuivront jusqu’en octobre, de 7 h à 17 h. Travaux d’aménagement paysager sporadiques : Entraves partielles à prévoir, mais circulation possible. Travaux de Bell et Hydro-Québec sur leurs poteaux : Circulation en alternance grâce à des signaleurs."
  },
  "61629": {
    url: `${WORKS_URL}rehabilitation-du-bassin-de-montpellier/`,
    impact: "Point de chantier au bassin de Montpellier. L’entretien est publié de mai à octobre dans le programme 2025–2029; la Ville demande de ne pas circuler près des équipes. Aucun tracé piétonnier ni fermeture de rue n’est publié.",
    sourceText: "Les interventions de nettoyage seront réalisées régulièrement par des équipes spécialisées entre mai et octobre. Dans un souci de sécurité, nous demandons aux résidents et aux usagers de ne pas circuler à proximité des travailleurs pendant les opérations d’entretien."
  },
  "69149": {
    url: `${WORKS_URL}refection-postes-pompage/`,
    impact: "L’avis publie une fermeture complète de la rue Alvares pendant les travaux. La première phase du 29 septembre au 6 octobre est passée; une seconde phase est annoncée vers la fin novembre pour environ deux semaines, sans dates exactes. Le point du chantier n’est pas le tracé de la fermeture.",
    sourceText: "Phase 1 : Du 29 septembre au 6 octobre. Phase 2 : Fin novembre, pour une durée de 2 semaines. Lorsqu’elles seront connues, les dates exactes vous seront transmises par le biais d’un avis Espace citoyen. La rue Alvares sera complètement fermée à la circulation entre l’entrée de la résidence pour aînés Villas d’aujourd’hui et le boulevard Sir-Wilfrid-Laurier (route 116), et ce, pendant l’entièreté des travaux."
  },
  "69150": {
    url: `${WORKS_URL}refection-postes-pompage/`,
    impact: "L’avis annonce que l’intersection Bella-Vista/des Martinets sera inaccessible à la circulation pendant environ une semaine à partir de la semaine du 19 octobre. Les jours exacts ne sont pas publiés; le point officiel reste un chantier, pas un tracé de fermeture.",
    sourceText: "Les travaux débuteront dans la semaine du 19 octobre et devraient durer environ 1 semaine. L’intersection sera inaccessible à la circulation automobile pendant l’entièreté des travaux et des chemins de détour sont prévus."
  },
  "69151": {
    url: `${WORKS_URL}refection-postes-pompage/`,
    impact: "L’avis décrit deux phases au 21, avenue des Ormes et seulement de brèves entraves lors des déplacements de camions dans la première phase. Les dates exactes de reprise ne sont pas publiées; le point ne délimite aucune entrave.",
    sourceText: "21, avenue des Ormes : Travaux en deux phases (début le 8 septembre pour une durée de 3 semaines, puis reprise en octobre pour une durée de 3 semaines). Dans la première phase, la circulation automobile ne sera perturbée que brièvement, lors des déplacements de camions. Ces entraves partielles ne dureront que quelques minutes."
  },
  "69152": {
    url: `${WORKS_URL}refection-postes-pompage/`,
    impact: "L’avis prévoit une circulation locale seulement pour certains numéros de l’avenue des Ormes pendant les travaux au 52. La reprise de mi-novembre est annoncée pour deux semaines, sans dates exactes; le point du chantier ne dessine pas le secteur.",
    sourceText: "52, avenue des Ormes : Travaux en deux phases (début le 14 septembre pour une durée de 1 semaine, puis reprise à mi-novembre pour 2 semaines). Les résidences situées au 49, 50, 51 et 53, avenue des Ormes se retrouveront dans la zone des travaux et seule la circulation locale sera permise pendant les travaux."
  },
  "70776": {
    url: `${WORKS_URL}amenagement-dune-patinoire-et-de-terrains-de-pickleball-au-parc-du-ruisseau/`,
    impact: "Le périmètre de la patinoire et les terrains de volleyball sont fermés; les autres parties et installations du parc restent accessibles. La durée est approximative et aucune entrave de rue ou fermeture d’un sentier public n’est publiée.",
    sourceText: "L’enceinte de la patinoire et les terrains de volleyball libre seront complètement fermés et inaccessibles. Le périmètre sera clôturé et occupé par de la machinerie. Les autres portions et installations récréatives du parc du Ruisseau demeureront accessibles en tout temps."
  },
  "70780": {
    url: `${WORKS_URL}refection-de-la-rue-lafrance-ouest/`,
    impact: "La réfection routière est terminée. La mise à jour du 16 octobre annonce seulement la pose de roche décorative dans les noues le samedi 17 octobre; aucune entrave routière ou piétonne n’est publiée.",
    sourceText: "Les noues sont maintenant plantées. L’entrepreneur sera sur place ce samedi 17 octobre pour y ajouter de la roche décorative."
  },
  "70781": {
    url: MILLENIA_URL,
    impact: "Le point officiel est associé au projet Le Millénia. L’avis du 16 octobre décrit des fermetures de pavage dès le 9 octobre et une fermeture devant le 265, rue Prévert dès le 19 octobre pour environ deux jours; les fins exactes ne sont pas publiées et une limite de tronçon Prévert est contradictoire. Aucune fermeture n’est dessinée à partir du point.",
    sourceText: "Rue Belzil, entre les rues Audet et Anne-Hébert : Dès le 9 octobre Fermée à la circulation, sauf pour la circulation locale. Entrave complète lors des travaux de pose d’asphalte. Les interventions devraient durer une semaine. Devant le 265, rue Prévert, près de l’intersection avec la rue Anne-Hébert : Dès le 19 octobre Fermée à la circulation pendant le pavage (durée d’environ 2 jours)."
  },
  "70782": {
    url: MILLENIA_URL,
    impact: "Le point officiel est associé au projet Le Millénia. L’avis du 16 octobre décrit des fermetures de pavage sur Anne-Hébert et Prévert, mais ne publie pas de fin exacte et formule de façon incohérente une limite de tronçon Prévert. Aucune fermeture n’est dessinée à partir du point.",
    sourceText: "Rue Anne-Hébert, entre la rue Prévert et la nouvelle entrée privée du bâtiment A, et la rue Prévert, entre les rues Anne-Hébert et Prévert : Dès le 9 octobre Entrave complète lors des travaux de pose d’asphalte. Les interventions devraient durer une semaine."
  },
  "72323": {
    url: `${WORKS_URL}sentier-mobilier-parc-montpellier/`,
    impact: "Le projet touche les sentiers du parc de Montpellier. L’avis indique une fermeture du parc à partir du 8 septembre pour environ trois semaines, puis une intervention le 3 octobre; il ne confirme pas une fermeture piétonne encore en vigueur le 17 octobre. Aucune entrave de rue n’est annoncée.",
    sourceText: "Le parc de Montpellier sera fermé à partir du 8 septembre, pour une durée approximative de 3 semaines. Ce samedi 3 octobre, l’entrepreneur procédera à l’installation de pavés unis. Aucune entrave de rue n’est prévue."
  }
};

const EXPIRED_HYDRANT_NOTICE = {
  url: `${WORKS_URL}ajout-dune-borne-fontaine-sur-la-montee-des-trinitaires/`,
  publishedPeriod: "Du 3 au 7 août 2026",
  reason: "La carte marque encore ce point comme en cours, mais l’avis détaillé donne une fermeture terminée le 7 août 2026. La contradiction n’est pas résolue; le point n’est pas conservé parmi les chantiers courants."
};
const SAINT_BASILE_MEDIA_REVIEW = new Map([
  ["IM-WEB_2020-07-03_info-travaux_1920x600.jpg", ["376e071a5b648a2ab3e2e6a628ad1b3fdafdfa6e3cb3f81c8fae499ef5402cb9", "Generic Info-Travaux banner; no location or closure geometry."]],
  ["sw-img_une_travaux-1.jpg", ["63c80a60237eaa6c9a7c3ad5cf76c6d3a0b1a6bb7e4780ecd9a73d09f31c10d8", "Photograph of an excavator, utility truck and concrete pipes at a construction site; it contains no labels, road limits, dates, directions or closure configuration."]],
  ["amenagement-patinoire-terrains-ruisseau.png", ["a30600eaeb665d79d76d0759a847cf3b349e116f3f09415b9b8df6dcb9aae1b8", "Aerial photograph of park sports facilities; it does not define a road closure or public path outline."]],
  ["lafrance-ouest_1920x600-scaled.jpg", ["50f33b915487c2d350f82018d9e000348e09ca3c70b1ff73b9bed078dabd578b", "Completed-street rendering with a multi-use path; not a temporary closure diagram."]],
  ["Bouclage-116_1920x600.png", ["d9d4bd1c96ddb5e0538dea098cd8f25fe6e7aaf6da9dd45877f71e3ecb7998e8", "Street-view photograph of Route 116 and its shoulder; no closure or work-limit annotation."]],
  ["travaux-dragage_1920x600.png", ["23efb1a96f693ed9bc73dfa807a4ee5e4ae7e584f81ecee7f8d7508c84c0e97d", "Aerial view of the Montpellier basin and surrounding park; no route restriction is shown."]],
  ["refection-postes-pompage_1920x600-scaled.jpg", ["59cf10a4589c1c84b3e9c873b056ee1a61f7f2ecaefc1ae59406bcd1130dff47", "Street-view photograph of a local road and cycling path; no temporary limits or closure signs."]],
  ["parc-montpellier_1920x600-scaled.png", ["49e92f04a0b6791c149d3fc0fc8c09f6b76a66b8a202ab2ce55a4cf1636a7ec5", "Aerial view of the park basin and paths; it does not delineate a temporary pedestrian closure."]],
  ["sw-img_une_entretien-conduites-sanitaires-et-pluviales.jpg", ["c054fd464d58333e13682205b30ac2d34fc0aeda003c0d2e6256ef5465f279e7", "Close-up of a storm-sewer cover; no road or obstruction geometry."]],
  ["sw-img_une-edifice-Leopold-bouchard.jpg", ["9194cff5e2cf695869f9201dfb12a81dbc4b60328ad7fd5996f1d343f444bb14", "Photograph of the municipal building where work is interior; no road geometry."]],
  ["sw-img_une_amelioration-reseau-egouts-sanitaires.jpg", ["34f3baf1bb438d4c2a7532101d763c69d517c557e07b63d438d9ffa516af57d3", "Photograph of wastewater/sewer work; no temporary route geometry."]],
  ["ajout-surface-caoutchouc-parc-montpellier_1920x600-scaled.jpg", ["ae45f9c67bd109dd84f669df4743cada42670dd2b813f17e4ee74e3f5a8fefb8", "Photograph of a splash-pad playground; no public-road restriction."]],
  ["rehabilitation-vanne-116_1920x600-scaled.jpg", ["be6ff664ca0c6fce35155b554fe898b00c579b3f42c64ebf2930f9a137e637a0", "Street-view photograph of Route 116; it does not mark the shoulder work limits."]],
  ["balancoires-cheminot_1920x600.png", ["ebad0a76cb691a39071e91e96ebc3616d302fe25824530328a98787b57937790", "Photograph of park playground equipment; no street obstruction geometry."]],
  ["borne-incendie_1920x600.jpg", ["a7ed3497ade4b41c9a43df560d4e981b6059a019699761c077bac7e4ceda1f18", "Close-up of a fire hydrant; it does not identify the published street closure extent."]],
  ["Millenia-04-scaled.jpg", ["61e852d92d0348e0c4e6e6c1421c2f242841178be9c79abf1dc676cdd0115470", "Architectural rendering of a proposed multi-use path within the development; not a temporary closure map."]],
  ["Millenia-03-scaled.jpg", ["20af8a7032148dce6a08bf0fc9bc8d725e8ff0d58c9983476a56ec654fbcaa7f", "Architectural rendering of proposed apartments and park space; no road restriction geometry."]],
  ["millenia1.png", ["72547420bc23138a8144c15e5d1ca2c3054b93c22d024a1fddd55873e13ae3c9", "Architectural rendering of the proposed residential development; it does not establish a temporary street closure."]],
  ["millenia2.png", ["e5a87a1daa1a6936235e83a453b8abd71be5c6697abeb2427b00631a5ac7786b", "Architectural rendering of the proposed residential development; it does not establish a temporary street closure."]],
  ["Plan-preliminaire-pour-site-web_VF.pdf", ["dab62835905f61bb4137000b2c15668cb2baecc64e7d3273fc6e68bd5c1c5b75", "One-page preliminary park plan. It shows sports facilities and park paths, not an automobile restriction; the notice says the rest of the park remains accessible.", "visually-inspected"]],
  ["Seance-dinformation-Lafrance-Ouest-VF.pdf", ["3e7a6e6350dccd145be9ad81e642f3fb8432bea4e07539e3e1ebb139cb825498", "All 25 historical 2024 presentation slides were inspected; they cover construction phases, driveway access and mobility design through 2025, not the October 2026 landscaping visit.", "visually-inspected"]],
  ["Plan-vulgarise_VF.pdf", ["c895ff541fd6e3aefa7cc2a01020a273615e6ddfb6fe4c356f1a065bdf2ffa6d", "One-page plan of the completed Lafrance street and multi-use path; it is not a current obstruction trace.", "visually-inspected", 1]],
  ["LET_egout-collecteur_bouchard_VF.pdf", ["5a8ee947131fad1f6e668b3c3a89b2e3823d3f0708d085e0461a1dc959a07b9e", "All three letter pages and their access sketch were inspected; the text says the 2026 fall work is not on the public street, and any local interruption is unscheduled.", "visually-inspected"]],
  ["LET_egout-collecteur_autourPrinicpale_VF.pdf", ["1c3f1e5c115cc72dbfb8cfba16aad763a9adab1caab0abcde19bca6b57a2b07c", "Both letter pages were inspected; the diagram is a local access sketch, not georeferenced restriction geometry, and no dated public-road closure is published.", "visually-inspected"]],
  ["LET_egout-collecteur_BellaVista_VF.pdf", ["62a5378b774c8933b0bf22de3825200140e6efd5ea0c95d4536fdba0e007554b", "Both letter pages were inspected; the works are future 2027 and the sketch gives no current public-road closure.", "visually-inspected"]],
  ["DO-EX_2021-04-09_reponses-consultation-ecrite-PPCMOI-20-03.pdf", ["3652bc58cb5396409c53f7810f84c63dee410d560f88473f34687cd9a97fa617", "Historical 2021 written-consultation report about the proposed development and long-term traffic study; it is not a 2026 work restriction. Relevant circulation pages were reviewed.", "visually-inspected-relevant-pages"]],
  ["Presentation-seance-Conseil.pdf", ["a113cd9f644e0f5d175dad1bef8567e89e4dc7a50e092f42e37a9c115b5280db", "Historical 2021 development presentation; mobility slides show conceptual site paths and traffic-study context, not current temporary restrictions.", "visually-inspected-relevant-pages", 19]],
  ["GLR_2023_Liste-des-questions-frequentes-FAQ-travaux-infrastructures-routieres.pdf", ["7a67a5a9f0bd3d0c92d94e53f11490553c49b9d5c9185fed7b56d0c23da0b459", "All 14 text pages were reviewed. Pages 2, 10 and 11 describe generic communications, usual hours and access around an active excavation; they provide no project-specific dates, named roads, limits, or closure geometry. Text-reviewed; not a project plan.", "text-reviewed-all-pages", 14]]
]);
const SAINT_BASILE_PAGE_DECISIONS = new Map([
  [WORKS_URL, { decision: "complete-index-reviewed", reason: "All 15 linked work-detail pages and the related Le Millénia detail page were reviewed; no pagination was published." }],
  [`${WORKS_URL}reconstruction-dune-portion-du-rang-des-vingt/`, { decision: "worksite-point-only", reason: "The project is current, but the notice says partial interruptions with circulation possible and alternating traffic; exact current closure bounds and dates are not published." }],
  [`${WORKS_URL}amenagement-dune-patinoire-et-de-terrains-de-pickleball-au-parc-du-ruisseau/`, { decision: "worksite-point-only", reason: "Only the rink/volleyball facility is fenced; other park portions remain accessible. Approximate period, no road closure or public-path geometry." }],
  [`${WORKS_URL}refection-de-la-rue-lafrance-ouest/`, { decision: "worksite-point-only", reason: "The 2024 street reconstruction is complete; the 16 October 2026 visit is landscaping on 17 October, with no traffic or pedestrian closure published." }],
  [`${WORKS_URL}ajout-dune-nouvelle-conduite-daqueduc-en-bordure-du-boul-sir-wilfrid-laurier-route-116-projet-de-la-rievr/`, { decision: "review-status-conflict", reason: "The notice says work began in late August and continues to November with both lanes open, while the map status is upcoming. No traffic closure is published." }],
  [`${WORKS_URL}rehabilitation-du-bassin-de-montpellier/`, { decision: "worksite-point-only", reason: "The 2025–2029 maintenance is ongoing in season, but the notice publishes no closed route or exact affected pedestrian trace." }],
  [`${WORKS_URL}refection-postes-pompage/`, { decision: "review-approximate-phases", reason: "The notice publishes full or local-only road restrictions in later phases, but the exact November dates are not yet published. Existing official points remain neutral worksite points." }],
  [`${WORKS_URL}sentier-mobilier-parc-montpellier/`, { decision: "review-uncertain-pedestrian-end", reason: "A park/path closure began on 8 September for approximately three weeks; the 2 October update does not confirm that the closure remains active on 17 October. No street obstruction is published." }],
  [`${WORKS_URL}construction-dun-nouvel-egout-collecteur-par-la-ville-de-saint-bruno-de-montarville/`, { decision: "review-no-public-road-closure", reason: "The three 2026 letters describe site access and added truck traffic, but no dated public-road closure or verified geometry; the responsible authority is Ville de Saint-Bruno-de-Montarville." }],
  [`${WORKS_URL}remplacement-thermopompes-edifice-leopold-bouchard/`, { decision: "excluded-no-road-impact", reason: "The notice explicitly says the work is inside the building with no obstruction." }],
  [`${WORKS_URL}raccordements-inverses/`, { decision: "excluded-no-road-impact", reason: "The notice concerns inspections and corrections on private properties; no public-road restriction is published." }],
  [`${WORKS_URL}surface-caoutchouc-jeux-eau-parc-montpellier/`, { decision: "excluded-park-only", reason: "The notice concerns a playground surface and publishes no roadway or public-path restriction." }],
  [`${WORKS_URL}rehabilitation-vanne-route-116/`, { decision: "review-shoulder-only-no-dates", reason: "The notice says only the shoulder is affected overnight from about 22 h, but gives no work dates or exact segment; no road lane closure is published." }],
  [`${WORKS_URL}travaux-de-reconstruction-de-lemissaire-pluvial-du-parc-du-ruisseau-et-de-rehabilitation-dune-chambre-pluviale-sur-la-rue-principale/`, { decision: "review-worksite-no-traffic-impact", reason: "Approximate October–November work dates and locations are published, but no automobile or pedestrian restriction is stated and no exact worksite geometry is available." }],
  [`${WORKS_URL}mise-a-niveau-des-aires-de-balancoires-aux-parcs-des-cheminots-et-des-fromagers/`, { decision: "excluded-expired-no-road-impact", reason: "The June–July park work is past; the notice explicitly says no traffic obstruction." }],
  [`${WORKS_URL}ajout-dune-borne-fontaine-sur-la-montee-des-trinitaires/`, { decision: "review-map-status-conflict-expired-notice", reason: EXPIRED_HYDRANT_NOTICE.reason }],
  [MILLENIA_URL, { decision: "review-closure-period-and-geometry", reason: "The 16 October notice publishes local paving closures beginning 9 and 19 October, but no exact closure end; the Prévert limit is self-contradictory and the official points do not delineate the closed segments." }]
]);

function localDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(date);
}

function validPoint(item) {
  const latitude = Number(item.lat ?? item.latitude);
  const longitude = Number(item.lng ?? item.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= 45 && latitude <= 47 && longitude >= -75 && longitude <= -72
    ? [longitude, latitude]
    : null;
}

async function captureSupplementalReview(browser) {
  const page = await browser.newPage();
  try {
    await page.route("**/*", (route) => ["image", "font", "media"].includes(route.request().resourceType())
      ? route.abort()
      : route.continue());
    const indexResponse = await page.goto(WORKS_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (!indexResponse || indexResponse.status() !== 200 || new URL(page.url()).origin !== "https://www.villesblg.ca") {
      throw new Error("Saint-Basile works index failed validation");
    }
    const index = await page.evaluate(() => {
      const root = document.querySelector("main") || document.body;
      const links = [...root.querySelectorAll("a[href]")].map((anchor) => ({
        title: (anchor.innerText || anchor.parentElement?.innerText || "").replace(/\s+/g, " ").trim(),
        url: anchor.href
      })).filter((item) => item.url.startsWith(location.origin));
      const noticeUrls = links.map((item) => item.url)
        .filter((url) => url.startsWith(`${location.href}`.replace(/#.*$/, "")))
        .filter((url) => url.startsWith("https://www.villesblg.ca/services-aux-citoyens/infrastructures-et-reseau-routier/travaux/")
          && url !== location.href && !url.includes("#"))
        .filter((url, index, all) => all.indexOf(url) === index);
      return {
        title: document.title,
        text: root.textContent.replace(/\s+/g, " ").trim(),
        noticeUrls,
        milleniaLinks: links.filter((item) => item.url === "https://www.villesblg.ca/services-aux-citoyens/infrastructures-et-reseau-routier/projets-de-construction-residentielle/projet-le-millenia/")
      };
    });
    const expectedMilleniaUrl = MILLENIA_URL;
    if (index.noticeUrls.length !== 15 || index.milleniaLinks.length !== 1) {
      throw new Error(`Saint-Basile notice inventory changed (detail pages: ${index.noticeUrls.length}; Millenia links: ${index.milleniaLinks.length}).`);
    }
    const urls = [WORKS_URL, ...index.noticeUrls, expectedMilleniaUrl];
    const pages = [];
    const assets = new Map();
    for (const url of urls) {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      if (!response || response.status() !== 200 || new URL(page.url()).origin !== "https://www.villesblg.ca") {
        throw new Error(`Saint-Basile supplemental page failed validation: ${url}`);
      }
      const content = await page.evaluate(() => {
        const root = document.querySelector("main") || document.body;
        const images = [...root.querySelectorAll("img[src]")].map((image) => ({
          url: new URL(image.getAttribute("src") || image.currentSrc, location.href).href,
          alt: image.alt || ""
        })).filter((image) => image.url.startsWith("https://"));
        const attachments = [...root.querySelectorAll("a[href]")].map((anchor) => ({
          title: (anchor.innerText || anchor.parentElement?.innerText || "").replace(/\s+/g, " ").trim(),
          url: anchor.href
        })).filter((item) => /\.(pdf|jpe?g|png|webp)(?:$|\?)/i.test(item.url));
        return {
          title: document.title,
          text: root.textContent.replace(/\s+/g, " ").trim(),
          modifiedAt: document.querySelector('meta[property="article:modified_time"]')?.content || null,
          images,
          attachments
        };
      });
      if (!content.title || content.text.length < 40) {
        throw new Error(`Saint-Basile page has no complete published text: ${url}`);
      }
      const mediaUrls = [...new Set([
        ...content.images.map((item) => item.url),
        ...content.attachments.map((item) => item.url)
      ])];
      pages.push({
        url,
        title: content.title,
        sourceModifiedAt: content.modifiedAt,
        contentSha256: createHash("sha256").update(content.text).digest("hex"),
        imageUrls: content.images,
        attachmentUrls: content.attachments,
        mediaUrls,
        decision: url === WORKS_URL
          ? { decision: "complete-index-reviewed", reason: "All linked project pages and the related Le Millénia article were inventoried; no pagination is published." }
          : SAINT_BASILE_PAGE_DECISIONS.get(url)
      });
      if (!pages.at(-1).decision) throw new Error(`Saint-Basile notice has no saved review decision: ${url}`);
      mediaUrls.forEach((mediaUrl) => assets.set(mediaUrl, url));
    }
    const mediaReview = [];
    for (const [url, pageUrl] of assets) {
      const address = new URL(url);
      if (address.protocol !== "https:" || address.hostname !== "www.villesblg.ca") {
        throw new Error(`Unexpected Saint-Basile notice media URL: ${address.href}`);
      }
      const response = await fetch(address, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(90000) });
      if (!response.ok || new URL(response.url).origin !== "https://www.villesblg.ca") {
        throw new Error(`Saint-Basile notice media fetch failed (${response.status}): ${address.href}`);
      }
      const contentType = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
      if (!contentType.startsWith("image/") && contentType !== "application/pdf") {
        throw new Error(`Unexpected Saint-Basile media content type ${contentType}: ${address.href}`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      const filename = address.pathname.split("/").at(-1);
      const expected = SAINT_BASILE_MEDIA_REVIEW.get(filename);
      if (!expected) throw new Error(`Saint-Basile media has no completed visual review: ${address.href}`);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      if (sha256 !== expected[0]) throw new Error(`Saint-Basile notice media changed; re-inspect before refreshing: ${address.href}`);
      mediaReview.push({
        url: address.href,
        parentNoticeUrl: pageUrl,
        contentType,
        byteLength: bytes.length,
        sha256,
        pageCount: expected[3] || null,
        inspectionStatus: expected[2] || "visually-inspected",
        observations: [expected[1]]
      });
    }
    const fingerprint = createHash("sha256").update(JSON.stringify({
      pages: pages.map(({ url, title, sourceModifiedAt, contentSha256, imageUrls, attachmentUrls }) => ({
        url, title, sourceModifiedAt, contentSha256, imageUrls, attachmentUrls
      })),
      media: mediaReview.map(({ url, contentType, byteLength, sha256 }) => ({ url, contentType, byteLength, sha256 }))
    })).digest("hex");
    const previousReview = previousSnapshot.validation?.saintBasileReview;
    if (!previousReview && !recordSupplementalReview) {
      throw new Error("Saint-Basile has no saved review baseline for its linked notices/media; inspect them before the first snapshot refresh.");
    }
    if (previousReview && previousReview.fingerprint !== fingerprint && !recordSupplementalReview) {
      throw new Error("Saint-Basile notice text, inventory, or media changed; preserve the prior snapshot and fully review the changed source first.");
    }
    if (previousReview && previousReview.fingerprint === fingerprint && !recordSupplementalReview) {
      return { ...previousReview, checkedAt: new Date().toISOString() };
    }
    const modifiedDates = pages.map((item) => item.sourceModifiedAt).filter(Boolean).sort();
    const newestModifiedAt = modifiedDates.at(-1) || null;
    return {
      status: "complete",
      reviewedAt: new Date().toISOString(),
      checkedAt: new Date().toISOString(),
      previousRestartPoint: previousReview?.restartPoint || null,
      restartPoint: {
        indexUrl: WORKS_URL,
        latestPublishedModification: newestModifiedAt,
        noticeUrlsAtBoundary: pages.filter((item) => item.sourceModifiedAt === newestModifiedAt).map((item) => item.url)
      },
      index: {
        url: WORKS_URL,
        title: pages[0].title,
        contentSha256: pages[0].contentSha256,
        noticeCount: pages.filter((item) => item.url !== WORKS_URL && item.url !== MILLENIA_URL).length,
        relatedProjectPageCount: pages.some((item) => item.url === MILLENIA_URL) ? 1 : 0
      },
      inventory: pages,
      mediaReview,
      fingerprint
    };
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.goto(MAP_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => typeof actMapData !== "undefined"
    && Array.isArray(actMapData) && actMapData.length > 0, { timeout: 60000 });

  const mapData = await page.evaluate(() => {
    const plainText = (value) => new DOMParser().parseFromString(String(value || ""), "text/html")
      .body.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    return actMapData.map((item) => ({
      id: String(item.id || ""),
      title: plainText(item.title),
      address: plainText(item.address),
      description: plainText(item.description),
      excerpt: plainText(item.excerpt),
      category: plainText(item.categ),
      categorySlugs: String(item.categslugs || ""),
      latitude: item.lat ?? item.latitude ?? null,
      longitude: item.lng ?? item.longitude ?? null,
      publishedDate: plainText(item.date),
      streetWorks: plainText(item.rue_travaux),
      detourPlan: plainText(item.plan_de_detour),
      link: item.link || null,
      imageCount: Array.isArray(item.images) ? item.images.length : 0
    }));
  });

  if (!mapData.length || mapData.some((item) => !item.id) || new Set(mapData.map((item) => item.id)).size !== mapData.length) {
    throw new Error("Saint-Basile map response has missing or conflicting project IDs");
  }

  const workItems = mapData.filter((item) => item.categorySlugs.split("|").includes("travaux"));
  const supplementalReview = await captureSupplementalReview(browser);
  const extractedAt = new Date().toISOString();
  supplementalReview.checkedAt = extractedAt;
  const currentOnlyDate = localDate(new Date());
  const records = [];
  const review = [];

  for (const item of workItems) {
    const status = item.categorySlugs.split("|").find((slug) => slug.startsWith("refection-ou-amenagement-")) || "";
    const point = validPoint(item);
    if (item.id === "lieu-71142") {
      review.push({
        id: item.id,
        title: item.title,
        sourceUrl: EXPIRED_HYDRANT_NOTICE.url,
        sourceStatus: status,
        publishedPeriod: EXPIRED_HYDRANT_NOTICE.publishedPeriod,
        reason: EXPIRED_HYDRANT_NOTICE.reason,
        publishedPoint: point ? { type: "Point", coordinates: point } : null
      });
      continue;
    }
    if (status === "refection-ou-amenagement-a-venir") {
      review.push({
        id: item.id,
        title: item.title,
        sourceUrl: item.link,
        sourceStatus: status,
        reason: "Published as upcoming, not currently in progress."
      });
      continue;
    }
    if (status !== "refection-ou-amenagement-en-cours") {
      review.push({
        id: item.id,
        title: item.title,
        sourceUrl: item.link,
        sourceStatus: status || null,
        reason: "The map's published status is not an explicit in-progress status."
      });
      continue;
    }
    if (!point) {
      review.push({
        id: item.id,
        title: item.title,
        sourceUrl: item.link,
        sourceStatus: status,
        reason: "No valid public map point is available."
      });
      continue;
    }

    const notice = NOTICE_CONTEXT[item.id];
    const mapDescription = item.description || item.excerpt || "";
    records.push({
      id: `saint-basile-${item.id}`,
      sourceId: item.id,
      title: item.title,
      streets: item.address || item.streetWorks || item.title,
      startDate: null,
      endDate: null,
      currentOnlyDate,
      worksiteOnly: true,
      sourceStatus: status,
      impact: notice?.impact || "Point de chantier publié; l’avis ne précise pas l’impact sur la circulation automobile.",
      trafficLabel: "Chantier — impact routier non publié",
      severity: "worksite",
      direction: "Direction non publiée.",
      reference: item.id,
      geometry: { type: "Point", coordinates: point },
      point,
      geometryNote: notice
        ? "Point officiel de chantier; les avis détaillés citent des fermetures ou travaux localisés, mais ne publient pas de géométrie de segment vérifiable pour ces restrictions."
        : "Point officiel de la carte des travaux; aucun segment d’entrave n’est publié dans cette couche.",
      sourceDescription: [mapDescription, notice?.sourceText].filter(Boolean).join("\n\n"),
      publishedDate: item.publishedDate || null,
      streetWorks: item.streetWorks || null,
      detourPlan: item.detourPlan || null,
      sourceUrl: notice?.url || item.link || MAP_URL,
      sourceMapUrl: MAP_URL,
      ...(notice?.url && notice.url !== MAP_URL
        ? { relatedSources: [{ url: MAP_URL, label: "Carte officielle des travaux" }] }
        : {}),
      periods: [],
      schedule: [],
      imageCount: item.imageCount
    });
  }

  if (!records.length) throw new Error("Saint-Basile map returned no current worksite points");
  if (records.some((record) => record.startDate || record.endDate || !record.currentOnlyDate)) {
    throw new Error("Saint-Basile worksite-only records must remain bounded to the successful check date");
  }

  const snapshot = {
    schemaVersion: 1,
    extractedAt,
    sourceUrl: MAP_URL,
    municipality: "Ville de Saint-Basile-le-Grand",
    timeZone: TIME_ZONE,
    policy: "Retain the official map points whose published category status is refection-ou-amenagement-en-cours. Worksite points are not traffic closures and are visible only for the successful check date.",
    sourceReview: {
      receivedMapItems: mapData.length,
      workItemsReceived: workItems.length,
      retainedCurrentPoints: records.length,
      reviewCount: review.length,
      supplementalNoticeReview: {
        indexUrl: WORKS_URL,
        additionalNoticeUrl: MILLENIA_URL,
        reviewedAt: supplementalReview.reviewedAt,
        checkedAt: supplementalReview.checkedAt,
        reviewedNoticeCount: supplementalReview.index.noticeCount,
        relatedProjectPageCount: supplementalReview.index.relatedProjectPageCount,
        restartPoint: supplementalReview.restartPoint,
        currentTrafficRestrictionsNotMapped: [
          {
            url: NOTICE_CONTEXT["69150"].url,
            title: "Fermeture de l’intersection Bella-Vista/des Martinets",
            reason: "Le début est donné comme la semaine du 19 octobre et la durée comme environ une semaine; les dates exactes ne sont pas publiées. Le point reste un chantier neutre."
          },
          {
            url: MILLENIA_URL,
            title: "Pavage des rues Belzil, Anne-Hébert et Prévert",
            reason: "L’avis du 16 octobre décrit des fermetures à partir du 9 et du 19 octobre, mais sans dates de fin exactes; une limite de tronçon sur Prévert se contredit. Les points officiels restent des points de chantier, pas des lignes de fermeture."
          }
        ],
        expiredOrNonRoadNotices: [
          {
            url: EXPIRED_HYDRANT_NOTICE.url,
            title: "Ajout d’une borne-fontaine sur la montée des Trinitaires",
            reason: EXPIRED_HYDRANT_NOTICE.reason
          },
          {
            url: `${WORKS_URL}sentier-mobilier-parc-montpellier/`,
            title: "Réaménagement des sentiers et ajout de mobilier urbain au parc de Montpellier",
            reason: "La fermeture du parc commence le 8 septembre pour environ trois semaines; la mise à jour du 2 octobre ne confirme pas que la fermeture continue le 17 octobre. Pas de tracé piéton ou d’entrave de rue publié."
          },
          {
            url: `${WORKS_URL}construction-dun-nouvel-egout-collecteur-par-la-ville-de-saint-bruno-de-montarville/`,
            title: "Nouvel égout collecteur – Ville de Saint-Bruno-de-Montarville",
            reason: "Les lettres décrivent des accès de chantier et une hausse de camions, mais aucune fermeture de voie publique datée ou géométrie de restriction."
          }
        ],
        inventory: supplementalReview.inventory.map(({ url, title, sourceModifiedAt, decision, reason }) => ({
          url, title, sourceModifiedAt, decision, reason
        }))
      },
      review
    },
    validation: { ...(previousSnapshot.validation || {}), saintBasileReview: supplementalReview },
    records
  };

  await writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: OUTPUT,
    extractedAt,
    receivedMapItems: mapData.length,
    workItemsReceived: workItems.length,
    retainedCurrentPoints: records.length,
    review: review.length
  }, null, 2));
} finally {
  await browser.close();
}
