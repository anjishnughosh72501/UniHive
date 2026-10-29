/**
/**
 * MediaWiki Imageinfo API Client for UniHive
 * Documentation: https://www.mediawiki.org/wiki/API:Imageinfo
 *
 * Uses Wikimedia Commons Imageinfo API with anonymous CORS (origin=*)
 * to provide real product photographs, licensing credits, and interactive
 * hardware image search for catalog additions.
 */

const COMMONS_API_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';
const CACHE_KEY = 'unihive_image_cache_v1';

// In-memory cache backed by localStorage
let memCache = null;

function getCache() {
  if (memCache) return memCache;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    memCache = raw ? JSON.parse(raw) : {};
  } catch (e) {
    memCache = {};
  }
  return memCache;
}

function setCache(title, data) {
  const cache = getCache();
  cache[title] = { data, timestamp: Date.now() };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // LocalStorage quota safety
  }
}

/**
 * Fetch image information for a specific Wikimedia Commons file using API:Imageinfo
 * @param {string} fileTitle - e.g. "File:Arduino Uno - R3.jpg"
 * @param {number} width - Target thumbnail width (default 800px)
 * @returns {Promise<Object|null>} Image info metadata object
 */
export async function fetchImageInfo(fileTitle, width = 800) {
  if (!fileTitle) return null;
  const normalizedTitle = fileTitle.startsWith('File:') ? fileTitle : `File:${fileTitle}`;

  // Check cache
  const cache = getCache();
  if (cache[normalizedTitle] && (Date.now() - cache[normalizedTitle].timestamp < 7 * 24 * 3600 * 1000)) {
    return cache[normalizedTitle].data;
  }

  const params = new URLSearchParams({
    action: 'query',
    titles: normalizedTitle,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|dimensions',
    iiurlwidth: String(width),
    format: 'json',
    origin: '*'
  });

  try {
    const res = await fetch(`${COMMONS_API_ENDPOINT}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`MediaWiki API error ${res.status}`);
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    if (!page || !page.imageinfo || !page.imageinfo.length) return null;

    const info = page.imageinfo[0];
    const meta = info.extmetadata || {};

    const cleanArtist = meta.Artist?.value ? meta.Artist.value.replace(/<[^>]*>?/gm, '').trim() : 'Wikimedia Commons';
    const licenseName = meta.LicenseShortName?.value || meta.UsageTerms?.value || 'CC';

    const result = {
      title: page.title,
      thumbUrl: info.thumburl || info.url,
      originalUrl: info.url,
      descriptionUrl: info.descriptionurl,
      width: info.thumbwidth || info.width,
      height: info.thumbheight || info.height,
      license: licenseName,
      artist: cleanArtist,
      source: 'Wikimedia Commons (API:Imageinfo)'
    };

    setCache(normalizedTitle, result);
    return result;
  } catch (err) {
    console.warn(`[UniHive] Wikimedia Imageinfo fetch failed for ${normalizedTitle}:`, err);
    return null;
  }
}

/**
 * Search Wikimedia Commons for hardware images via generator=search + prop=imageinfo
 * @param {string} query - Keyword e.g. "ESP32", "Raspberry Pi", "LiPo battery"
 * @param {number} limit - Maximum images to return
 * @param {number} width - Thumbnail width
 */
export async function searchWikimediaImages(query, limit = 8, width = 400) {
  if (!query || !query.trim()) return [];

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6', // File namespace
    gsrsearch: query.trim(),
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: String(width),
    format: 'json',
    origin: '*'
  });

  try {
    const res = await fetch(`${COMMONS_API_ENDPOINT}?${params.toString()}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`MediaWiki search error ${res.status}`);
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return [];

    const list = [];
    for (const page of Object.values(pages)) {
      if (page.imageinfo && page.imageinfo.length) {
        const info = page.imageinfo[0];
        const meta = info.extmetadata || {};
        list.push({
          title: page.title,
          thumbUrl: info.thumburl || info.url,
          originalUrl: info.url,
          descriptionUrl: info.descriptionurl,
          license: meta.LicenseShortName?.value || 'CC',
          artist: meta.Artist?.value ? meta.Artist.value.replace(/<[^>]*>?/gm, '').trim() : 'Wikimedia Commons'
        });
      }
    }
    return list;
  } catch (err) {
    console.warn(`[UniHive] Wikimedia search failed for "${query}":`, err);
    return [];
  }
}
