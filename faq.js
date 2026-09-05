const sourceList = document.querySelector("#faqSourceList");
const backToTop = document.querySelector("#backToTop");

function renderFaqSources() {
  if (!sourceList || !Array.isArray(window.SOURCE_CATALOG)) {
    return;
  }

  [...window.SOURCE_CATALOG]
    .sort((first, second) => first.name.localeCompare(second.name, "fr", { sensitivity: "base" }))
    .forEach(({ name, url }) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const linkCell = document.createElement("td");
    const link = document.createElement("a");

    nameCell.textContent = name;
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Ouvrir la source";
    linkCell.append(link);
    row.append(nameCell, linkCell);
      sourceList.append(row);
    });
}

function sortFaqLists() {
  document.querySelectorAll(".faq-list").forEach((list) => {
    [...list.querySelectorAll(":scope > details")]
      .sort((first, second) => first.querySelector("summary").textContent.localeCompare(second.querySelector("summary").textContent, "fr", { sensitivity: "base" }))
      .forEach((item) => list.append(item));
  });
}

function updateBackToTop() {
  backToTop.hidden = window.scrollY < 320;
}

function openAnchoredDetails() {
  const target = document.querySelector(location.hash);
  if (target instanceof HTMLDetailsElement) {
    target.open = true;
    requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  }
}

backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("scroll", updateBackToTop, { passive: true });
window.addEventListener("hashchange", openAnchoredDetails);
renderFaqSources();
sortFaqLists();
updateBackToTop();
openAnchoredDetails();