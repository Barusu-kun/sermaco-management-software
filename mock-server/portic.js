// portic.js — Récupération des escales (port calls) d'un navire depuis Portic.
// Flux public validé : GET escalas.do (cookie) → POST ListarEscalasPublic.do → HTML ISO-8859-1.
const BASE = 'https://app.portic.net/WebPortic2005';
const CACHE_TTL = 5 * 60 * 1000; // 5 min
const cache = new Map();

// Décalage horaire Europe/Madrid (heuristique DST UE : dernier dim. mars → dernier dim. oct = +2, sinon +1)
function madridOffset(y, mIdx, d) {
  const lastSunday = (year, monthIdx) => {
    const last = new Date(Date.UTC(year, monthIdx + 1, 0));
    return last.getUTCDate() - last.getUTCDay();
  };
  const date = Date.UTC(y, mIdx, d);
  const start = Date.UTC(y, 2, lastSunday(y, 2), 1);
  const end = Date.UTC(y, 9, lastSunday(y, 9), 1);
  return date >= start && date < end ? 2 : 1;
}

function parseMadrid(str) {
  const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, dd, mm, yyyy, HH, MM] = m.map(Number);
  const off = madridOffset(yyyy, mm - 1, dd);
  return new Date(Date.UTC(yyyy, mm - 1, dd, HH - off, MM));
}

function parseEscalas(html) {
  const rows = [];
  const anchorRe = /MM_openBrWindow\('ConsultarDetalleBuquePublic\.do\?([^']+)'[^>]*>\s*<SPAN[^>]*>\s*([^<]+?)\s*<\/SPAN>/g;
  const anchors = [...html.matchAll(anchorRe)];
  for (let i = 0; i < anchors.length; i++) {
    const start = anchors[i].index;
    const end = i + 1 < anchors.length ? anchors[i + 1].index : html.length;
    const chunk = html.slice(start, end);
    const qs = anchors[i][1];
    const name = anchors[i][2].trim();
    const imo = qs.match(/regLloyds=([^&]*)/)?.[1] || null;
    const nif = qs.match(/nif=([^&]*)/)?.[1] || null;
    const consignatari = qs.match(/consignatari=([^&]*?)(?:&armador=|$)/)?.[1]?.trim() || null;
    const armador = qs.match(/armador=([^&]*)$/)?.[1]?.trim() || null;
    const dates = [...chunk.matchAll(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/g)].map((m) => m[1]);
    const cells = [...chunk.matchAll(/&nbsp;&nbsp;\s*([^<]+?)\s*</g)].map((m) => m[1].trim()).filter(Boolean);
    if (!dates[0]) continue;
    rows.push({
      name,
      imo,
      nif,
      consignatari,
      armador,
      muelle: cells[0] || null,
      tipo: cells[1] || null,
      etaStr: dates[0] || null,
      etdStr: dates[1] || null,
      eta: dates[0] ? parseMadrid(dates[0]) : null,
      etd: dates[1] ? parseMadrid(dates[1]) : null,
    });
  }
  return rows;
}

async function getCookie() {
  const r = await fetch(`${BASE}/escalas.do`, { redirect: 'manual' });
  return (r.headers.get('set-cookie') || '').match(/JSESSIONID=[^;]+/)?.[0] || '';
}

/**
 * Récupère les escales d'un navire (par nom, IMO optionnel).
 * @returns {Promise<Array>} liste d'escales { name, imo, consignatari, armador, muelle, tipo, eta, etd, etaStr, etdStr }
 */
async function fetchEscalas(name, imo) {
  const cacheKey = `${name}|${imo || ''}`.toUpperCase();
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  const cookie = await getCookie();
  const body = `nom=${encodeURIComponent(name)}&buque=${encodeURIComponent(imo || '')}&paginaActual=0&elementsPagina=50&elementsTotal=0`;
  const r = await fetch(`${BASE}/ListarEscalasPublic.do`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: `${BASE}/escalas.do`,
      Origin: 'https://app.portic.net',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body,
  });
  if (!r.ok) throw new Error(`Portic HTTP ${r.status}`);
  const html = Buffer.from(await r.arrayBuffer()).toString('latin1');
  const data = parseEscalas(html);
  cache.set(cacheKey, { ts: Date.now(), data });
  return data;
}

module.exports = { fetchEscalas, parseMadrid };
