#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const INDEX_URL = "https://www.ville.mercier.qc.ca/info-travaux/";
const SOURCE_ORIGIN = new URL(INDEX_URL).origin;
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../data/mercier-roadworks-snapshot.json");
const USER_AGENT = "Mozilla/5.0 (compatible; MercierSnapshot/1.0)";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizedPath(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function validateNoticeUrl(value, baseUrl = INDEX_URL) {
  const url = new URL(value, baseUrl);
  if (url.protocol !== "https:" || url.origin !== SOURCE_ORIGIN
    || !url.pathname.startsWith("/info-travaux/") || normalizedPath(url.pathname) === "/info-travaux/") {
    throw new Error(`Unexpected Mercier info-travaux URL: ${url.href}`);
  }
  return url.href;
}

async function readHtmlPage(page, url, kind) {
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  if (!response || response.status() !== 200) {
    throw new Error(`Mercier ${kind} request failed: ${response?.status() ?? "no response"} ${url}`);
  }
  const contentType = response.headers()["content-type"] || "";
  if (!/text\/html/i.test(contentType)) {
    throw new Error(`Mercier ${kind} returned unexpected content type: ${contentType || "(missing)"}`);
  }
  if (new URL(page.url()).origin !== SOURCE_ORIGIN) {
    throw new Error(`Mercier ${kind} redirected outside the official host: ${page.url()}`);
  }

  const result = await page.evaluate((pageKind) => {
    const heading = document.querySelector("h1")?.innerText.trim() || "";
    const canonical = document.querySelector('link[rel="canonical"]')?.href || "";
    const content = document.querySelector(".the-content");
    const contentText = content?.innerText.trim() || "";
    const jsonLd = [];
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      jsonLd.push(JSON.parse(script.textContent || "null"));
    }

    const pages = jsonLd.flatMap((value) => {
      const flatten = (entry) => {
        if (Array.isArray(entry)) return entry.flatMap(flatten);
        if (!entry || typeof entry !== "object") return [];
        return [entry, ...(Array.isArray(entry["@graph"]) ? entry["@graph"].flatMap(flatten) : [])];
      };
      return flatten(value);
    });
    const pageMetadata = pages.find((entry) => {
      const types = Array.isArray(entry["@type"]) ? entry["@type"] : [entry["@type"]];
      return types.includes("WebPage") && entry.url === canonical;
    });

    if (pageKind === "index") {
      const listing = document.querySelector(".childs");
      return {
        heading,
        canonical,
        listingPresent: Boolean(listing),
        links: [...(listing?.querySelectorAll(".child a[href]") || [])].map((anchor) => ({
          url: anchor.href,
          title: anchor.querySelector("h1,h2,h3,h4,h5,h6")?.innerText.trim() || anchor.innerText.trim()
        })),
        contentText,
        jsonLd: pageMetadata || null
      };
    }

    return {
      heading,
      canonical,
      contentText,
      paragraphs: [...(content?.querySelectorAll("p") || [])].map((paragraph) => paragraph.innerText.trim()).filter(Boolean),
      media: [...(content?.querySelectorAll("img[src]") || [])].map((image) => ({
        url: image.src,
        alt: image.alt || ""
      })),
      attachments: [...(content?.querySelectorAll("a[href]") || [])].map((anchor) => ({
        url: anchor.href,
        title: anchor.innerText.trim()
      })),
      jsonLd: pageMetadata || null,
      metaPublishedAt: document.querySelector('meta[property="article:published_time"]')?.content || null,
      metaModifiedAt: document.querySelector('meta[property="article:modified_time"]')?.content || null
    };
  }, kind);

  const expectedUrl = new URL(url);
  const canonicalUrl = result.canonical ? new URL(result.canonical) : null;
  if (!canonicalUrl || canonicalUrl.origin !== SOURCE_ORIGIN
    || normalizedPath(canonicalUrl.pathname) !== normalizedPath(expectedUrl.pathname)) {
    throw new Error(`Mercier ${kind} has a missing or unexpected canonical URL: ${result.canonical || "(missing)"}`);
  }
  if (!result.heading) throw new Error(`Mercier ${kind} is missing its page heading`);
  if (kind === "index" && !result.listingPresent) {
    throw new Error("Mercier Info-Travaux page no longer exposes the expected notice listing");
  }
  if (kind === "notice" && (!result.contentText || result.contentText.length < 20)) {
    throw new Error(`Mercier notice has no usable published text: ${url}`);
  }
  return result;
}

async function fingerprintMedia(item) {
  const url = new URL(item.url);
  if (url.protocol !== "https:" || url.origin !== SOURCE_ORIGIN) {
    throw new Error(`Unexpected Mercier media URL: ${url.href}`);
  }

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Cache-Control": "no-cache" }
  });
  if (response.status !== 200) {
    throw new Error(`Mercier media request failed: HTTP ${response.status} ${url.href}`);
  }
  if (new URL(response.url).origin !== SOURCE_ORIGIN) {
    throw new Error(`Mercier media redirected outside the official host: ${response.url}`);
  }
  const contentType = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
  if (!contentType.startsWith("image/")) {
    throw new Error(`Mercier media returned unexpected content type: ${contentType || "(missing)"}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error(`Mercier media is empty: ${url.href}`);

  return {
    url: url.href,
    alt: item.alt,
    contentType,
    byteLength: bytes.length,
    sha256: sha256(bytes)
  };
}

function normalizeAttachment(item, baseUrl) {
  const url = new URL(item.url, baseUrl);
  if (url.protocol !== "https:") {
    throw new Error(`Unexpected Mercier attachment URL: ${url.href}`);
  }
  return { url: url.href, title: item.title };
}

async function makeInventoryEntry(link, notice, indexPosition) {
  const id = new URL(notice.canonical).pathname.split("/").filter(Boolean).at(-1);
  if (!id) throw new Error(`Cannot derive a stable ID from Mercier notice URL: ${notice.canonical}`);

  return {
    indexPosition,
    id: `mercier-${id}`,
    indexTitle: link.title,
    title: notice.heading,
    url: notice.canonical,
    publishedAt: notice.jsonLd?.datePublished || notice.metaPublishedAt || null,
    sourceModifiedAt: notice.metaModifiedAt || notice.jsonLd?.dateModified || null,
    contentSha256: sha256(notice.contentText),
    media: await Promise.all(notice.media.map(fingerprintMedia)),
    attachments: notice.attachments.map((item) => normalizeAttachment(item, notice.canonical))
  };
}

async function readReviewedSnapshot() {
  const previous = JSON.parse(await readFile(OUT, "utf8"));
  const review = previous.validation?.mercierReview;
  if (!Array.isArray(review?.inventory) || !review.index) {
    throw new Error("Mercier snapshot has no completed review inventory; review the full source before refreshing it.");
  }
  if (!Array.isArray(previous.review) || previous.review.length !== review.inventory.length
    || review.index.noticeCount !== review.inventory.length
    || previous.extraction?.sourceNoticeCount !== review.inventory.length
    || previous.extraction?.indexContentSha256 !== review.index.contentSha256) {
    throw new Error("Mercier snapshot review decisions do not match its source inventory.");
  }
  const inventoryIds = review.inventory.map((item) => item.id);
  const decisionIds = previous.review.map((item) => item.id);
  if (new Set(inventoryIds).size !== inventoryIds.length || !isDeepStrictEqual(inventoryIds, decisionIds)) {
    throw new Error("Mercier snapshot review decisions are missing, duplicated, or out of inventory order.");
  }
  const first = review.inventory[0];
  const restartPoint = first ? {
    url: first.url,
    publishedAt: first.publishedAt,
    sourceModifiedAt: first.sourceModifiedAt
  } : null;
  if (!isDeepStrictEqual(restartPoint, review.restartPoint)) {
    throw new Error("Mercier snapshot restart point does not match its latest reviewed notice.");
  }
  return { previous, review };
}

async function main() {
  const { previous, review } = await readReviewedSnapshot();
  const browser = await chromium.launch({ headless: true });
  let index;
  const inventory = [];
  try {
    const context = await browser.newContext({ userAgent: USER_AGENT });
    const page = await context.newPage();
    await page.route("**/*", (route) => route.request().resourceType() === "image"
      ? route.abort()
      : route.continue());

    index = await readHtmlPage(page, INDEX_URL, "index");
    const noticeLinks = index.links.map((link) => ({
      ...link,
      url: validateNoticeUrl(link.url)
    }));
    const uniqueUrls = new Set(noticeLinks.map((link) => link.url));
    if (uniqueUrls.size !== noticeLinks.length) {
      throw new Error("Mercier Info-Travaux listing contains duplicate notice URLs");
    }
    if (noticeLinks.some((link) => !link.title)) {
      throw new Error("Mercier Info-Travaux listing contains a notice without a title");
    }

    for (const link of noticeLinks) {
      const notice = await readHtmlPage(page, link.url, "notice");
      inventory.push(await makeInventoryEntry(link, notice, inventory.length + 1));
    }
    await context.close();
  } finally {
    await browser.close();
  }

  const ids = inventory.map((notice) => notice.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Mercier notice pages contain conflicting stable IDs");
  }

  const indexContentSha256 = sha256(JSON.stringify({ contentText: index.contentText, links: index.links }));
  const currentIndex = {
    url: index.canonical,
    title: index.heading,
    noticeCount: inventory.length,
    contentSha256: indexContentSha256
  };
  const currentRestartPoint = inventory.length === 0
    ? null
    : {
      url: inventory[0].url,
      publishedAt: inventory[0].publishedAt,
      sourceModifiedAt: inventory[0].sourceModifiedAt
    };
  const changedUrls = [];
  const previousByUrl = new Map(review.inventory.map((item) => [item.url, item]));
  for (const item of inventory) {
    const prior = previousByUrl.get(item.url);
    if (!prior) changedUrls.push(`new: ${item.url}`);
    else if (!isDeepStrictEqual(item, prior)) changedUrls.push(`changed: ${item.url}`);
  }
  for (const item of review.inventory) {
    if (!inventory.some((current) => current.url === item.url)) changedUrls.push(`removed: ${item.url}`);
  }
  if (!isDeepStrictEqual(currentIndex, review.index)) changedUrls.push("index content, title, ordering, or notice count");
  if (!isDeepStrictEqual(currentRestartPoint, review.restartPoint)) changedUrls.push("latest reviewed notice restart point");
  if (changedUrls.length > 0) {
    throw new Error(`Mercier source changed; previous snapshot and extractedAt were preserved. Fully review before updating: ${changedUrls.join("; ")}`);
  }

  const extractedAt = new Date().toISOString();
  await writeFile(OUT, `${JSON.stringify({ ...previous, extractedAt }, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: OUT,
    extractedAt,
    sourceNoticeCount: inventory.length,
    lastReviewedNotice: currentRestartPoint?.url || null,
    retainedRecords: previous.records.length,
    reviewCandidates: previous.review.length,
    result: "unchanged reviewed inventory; only extractedAt updated"
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
