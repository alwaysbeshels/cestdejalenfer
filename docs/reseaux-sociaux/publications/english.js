(() => {
  if (new URLSearchParams(location.search).get("lang") !== "en") return;

  document.documentElement.lang = "en-CA";
  document.title = "C'est déjà l'enfer | Social media posts";
  document.querySelector('meta[name="description"]').content = "Independent social media posts for C'est déjà l'enfer, available in French and English.";

  const copy = {
    ".cover-hook": "At least know where.",
    "#maps-title": 'Driving <span class="accent">or walking.</span>',
    ".maps .intro": "Two maps. Different impacts.",
    ".screen-pair figure:nth-child(1) .screen-label": "The driving map",
    ".screen-pair figure:nth-child(2) .screen-label": "The walking map",
    "#potholes-title": 'What about <span class="accent">potholes?</span>',
    ".potholes .intro": "Montréal's published 311 reports<br>and mechanized road-patching records.",
    ".potholes .image-caption": "Find a street, a report<br>and a location's history.",
    "#reader-title": 'Walking: a<br><span class="accent">screen reader mode.</span>',
    ".reader > .intro": "Designed for people who use VoiceOver.",
    ".reader-copy h3": "A more direct way to read.",
    ".reader-points li:nth-child(1)": "Search and location<br>outside the menu.",
    ".reader-points li:nth-child(2)": "Restriction details<br>directly below the map.",
    ".reader-points li:nth-child(3)": "Your preferred mode,<br>remembered next time.",
    ".reader-note": "A walking map view,<br>used with your device's<br>screen reader.",
    "#closing-title": 'Explore<br><span class="accent">your area.</span>',
    ".closing-copy > p:first-child": "Discover the website.<br>Follow along as<br>the project grows.",
    ".closing-question": "Which area<br>will you explore?",
    ".closing-availability": "Free · FR / EN"
  };
  for (const [selector, value] of Object.entries(copy)) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Missing translated element: ${selector}`);
    element.innerHTML = value;
  }

  const images = {
    "auto-desktop.png": { source: "_sources/current/en/auto-desktop.png", alt: "The complete driving map in English on a laptop, including filters, restriction details and the map." },
    "auto-mobile.png": { source: "_sources/current/en/auto-mobile.png", alt: "The complete English mobile interface of the driving map." },
    "auto-detail.png": { source: "_sources/current/en/auto-detail.png", alt: "The complete English driving map interface, with navigation, filters, restriction details and map geometry." },
    "pedestrian-desktop.png": { source: "_sources/current/en/pedestrian-desktop.png", alt: "The complete English walking map interface, showing area filters and published pedestrian restrictions." },
    "potholes-map.png": { source: "_sources/current/en/potholes-map.png", alt: "The complete English Potholes interface, with its filters, public reports and map." },
    "pedestrian-reader.png": { source: "_sources/current/en/pedestrian-reader.png", alt: "The walking map's screen reader mode activated in English, with the map above search, location and restriction details." }
  };
  for (const image of document.querySelectorAll(".artboard img")) {
    const filename = image.getAttribute("src").split("/").at(-1);
    const translated = images[filename];
    if (!translated) throw new Error(`Missing image translation: ${filename}`);
    if (translated.source) image.src = translated.source;
    image.alt = translated.alt;
  }
  document.querySelector(".cover-stage").setAttribute("aria-label", "Original laptop and foreground phone montage showing the English website");
  document.querySelector(".preview-nav").setAttribute("aria-label", "Publication files and language");
  document.querySelector('[data-preview-link="guide"]').textContent = "Files and captions";
  document.querySelector('[data-preview-link="site"]').textContent = "Website";
  document.querySelector('[data-preview-link="site"]').href = "https://cestdejalenfer.ca/en/";
})();