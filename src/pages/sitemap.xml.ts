/**
 * The sitemap: a one-page site has one URL worth indexing. Built from
 * `site` in astro.config.mjs; the 404 page and the share card are left out.
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const home = new URL("/", site).href;
  const lastmod = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${home}</loc><lastmod>${lastmod}</lastmod></url>
</urlset>
`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
