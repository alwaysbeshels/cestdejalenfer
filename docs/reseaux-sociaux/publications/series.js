(() => {
  const language = document.documentElement.lang.startsWith("en") ? "en" : "fr";
  const definitions = [
    { post: "04-statistiques-entraves-routieres", key: "01-general", capture: "04-LANG-general-screen.png", complete: "04-LANG-general-complete.png",
      fr: { title: "Statistiques", accent: "routières.", intro: "La vue d'ensemble : impacts et durées prévues.", note: "Des données filtrées, pas un inventaire exhaustif." },
      en: { title: "Road restriction", accent: "statistics.", intro: "The overview: impacts and planned durations.", note: "Filtered records, not a complete inventory." } },
    { post: "04-statistiques-entraves-routieres", key: "02-autoroutes", capture: "04-LANG-roads-screen.png", complete: "04-LANG-roads-complete.png",
      fr: { title: "Autoroutes", accent: "et routes.", intro: "Les axes et directions concernés.", note: "Consulter les restrictions publiées pour la sélection." },
      en: { title: "Highways", accent: "and roads.", intro: "The roads and directions affected.", note: "Explore published restrictions for the selection." } },
    { post: "04-statistiques-entraves-routieres", key: "03-public-prive", capture: "04-LANG-private-screen.png", complete: "04-LANG-private-complete.png",
      fr: { title: "Public", accent: "et privé.", intro: "Qui réalise les travaux, pour le compte de qui?", note: "Des rôles publiés; certaines informations restent inconnues." },
      en: { title: "Public", accent: "and private.", intro: "Who performs the work, and on whose behalf?", note: "Published roles; some information remains unknown." } },
    { post: "04-statistiques-entraves-routieres", key: "04-municipalites", capture: "04-LANG-territory-screen.png", complete: "04-LANG-territory-complete.png",
      fr: { title: "Un territoire,", accent: "son portrait.", intro: "Lire les données disponibles par municipalité.", note: "La couverture et les pratiques de publication varient." },
      en: { title: "A place,", accent: "a closer look.", intro: "Explore the available records by municipality.", note: "Coverage and publishing practices vary." } },
    { post: "07-statistiques-nids-de-poule", key: "01-bilans", capture: "07-LANG-summary-screen.png", complete: "07-LANG-summary-complete.png",
      fr: { title: "Les signalements,", accent: "en chiffres.", intro: "Les bilans des données publiées pour Montréal.", note: "Des demandes et des interventions, pas des trous uniques." },
      en: { title: "Reports,", accent: "at a glance.", intro: "Summaries of Montréal's published records.", note: "Reports and interventions, not individual potholes." } },
    { post: "07-statistiques-nids-de-poule", key: "02-analyses", capture: "07-LANG-charts-screen.png", complete: "07-LANG-charts-complete.png",
      fr: { title: "Des analyses,", accent: "du contexte.", intro: "Explorer les volumes et la récurrence des signalements.", note: "Lire chaque résultat avec sa période et ses limites." },
      en: { title: "Analysis,", accent: "with context.", intro: "Explore report volumes and recurring locations.", note: "Read each result with its period and limitations." } },
    { post: "07-statistiques-nids-de-poule", key: "03-arrondissement", capture: "07-LANG-boroughs-screen.png", complete: "07-LANG-boroughs-complete.png",
      fr: { title: "Un arrondissement,", accent: "ses données.", intro: "Un portrait local pour examiner les signalements.", note: "Des emplacements signalés, pas une note de performance." },
      en: { title: "A borough,", accent: "its data.", intro: "A local profile for exploring reported locations.", note: "Reported locations, not a performance score." } },
    { post: "08-statistiques-personnalisees", key: "01-comparer", capture: "08-LANG-bars-screen.png",
      fr: { title: "Ta question,", accent: "ton graphique.", intro: "Personnalisé : choisir les dimensions et les filtres.", note: "Exemple : municipalités et types d'impact." },
      en: { title: "Your question,", accent: "your chart.", intro: "Custom: choose the dimensions and filters.", note: "Example: municipalities and impact types." } },
    { post: "08-statistiques-personnalisees", key: "02-repartition", capture: "08-LANG-doughnut-screen.png",
      fr: { title: "Une autre façon", accent: "de comparer.", intro: "Changer de graphique, garder le contexte.", note: "Exemple : répartition des entraves par impact." },
      en: { title: "Another way", accent: "to compare.", intro: "Change the chart, keep the context.", note: "Example: the distribution of restrictions by impact." } },
    { post: "09-installation-mobile", key: "01-iphone", capture: "09-LANG-iphone-help.png", installation: true,
      fr: { title: "Sur iPhone,", accent: "comme une appli.", intro: "Ajoute le site à ton écran d'accueil.", steps: ["Ouvre le site dans Safari.", "Touche Partager, puis Sur l'écran d'accueil.", "Confirme avec Ajouter."], note: "Les libellés peuvent varier selon la version.", imageNote: "Aide d'installation du site." },
      en: { title: "On iPhone,", accent: "like an app.", intro: "Add the website to your home screen.", steps: ["Open the website in Safari.", "Tap Share, then Add to Home Screen.", "Confirm with Add."], note: "Labels may vary by version.", imageNote: "The website's installation help." } },
    { post: "09-installation-mobile", key: "02-android", capture: "09-LANG-android-help.png", installation: true,
      fr: { title: "Sur Android,", accent: "à portée de main.", intro: "Retrouve le site depuis ton écran d'accueil.", steps: ["Ouvre le site dans Chrome.", "Ouvre le menu ⋮, puis Installer ou Ajouter à l'écran d'accueil.", "Confirme l'installation ou l'ajout."], note: "Le bouton du site peut proposer l'installation directement.", imageNote: "Aide d'installation du site." },
      en: { title: "On Android,", accent: "within reach.", intro: "Open the website from your home screen.", steps: ["Open the website in Chrome.", "Open the ⋮ menu, then Install or Add to Home Screen.", "Confirm the installation or addition."], note: "The website's button may offer installation directly.", imageNote: "The website's installation help." } }
  ];

  const original = document.querySelector("#statistics-series-anchor");
  const manifest = [];
  for (const definition of definitions) {
    const copy = definition[language];
    const image = `_sources/current/${definition.capture.replace("LANG", language)}`;
    const id = `series-${definition.post.slice(0, 2)}-${definition.key}`;
    const sheet = document.createElement("div");
    sheet.className = "sheet";
    sheet.innerHTML = `<section class="artboard series-post${definition.installation ? " installation-post" : ""}" data-export="${id}" data-post="${definition.post}" data-image="${definition.key}" aria-labelledby="${id}-title">
      <h2 class="series-title" id="${id}-title">${copy.title}<br><span>${copy.accent}</span></h2>
      <p class="series-intro">${copy.intro}</p>
      ${definition.installation
        ? `<div class="install-layout"><div><ol class="install-steps">${copy.steps.map(step => `<li>${step}</li>`).join("")}</ol><p class="install-note">${copy.note}</p></div><figure><div class="phone"><img src="${image}" alt="${copy.imageNote}"></div><figcaption class="installation-credit">${copy.imageNote}<br>© OpenStreetMap contributors</figcaption></figure></div>`
        : `<figure class="series-figure"><img src="${image}" alt="${copy.intro}"><figcaption>${copy.note}</figcaption></figure>`}
    </section>`;
    if (definition.post.startsWith("04")) original.before(sheet);
    else document.querySelector("main").append(sheet);
    manifest.push({ id, post: definition.post, key: definition.key, language, image,
      complete: definition.complete ? `_sources/current/${definition.complete.replace("LANG", language)}` : null,
      title: `${copy.title} ${copy.accent}`, intro: copy.intro, note: copy.note, installation: Boolean(definition.installation) });
  }
  original.remove();
  window.SOCIAL_SERIES = manifest;
})();