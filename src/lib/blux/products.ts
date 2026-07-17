// Render-side product catalog from the Blux convert's products.json. Blux
// serves a detail page per "products" feed record at /products/<slug> from a
// Handlebars template; the emit (reddoor-maintenance src/blux/products.ts)
// rebuilds the catalog — cleaned categories, faithful slugs, resolved images —
// and this module is the render's read side. The starter ships an empty
// catalog, so an unconverted site has no product routes; `blux convert`
// replaces products.json per-site. Server-side only (imports the full catalog);
// client components import ./product-types instead.
import catalog from "./products.json";
import type { Product } from "./product-types";

export type { Product, ProductImage } from "./product-types";
export { categorySlug } from "./product-types";

const PRODUCTS = catalog as Product[];
const BY_SLUG = new Map(PRODUCTS.map((p) => [p.slug, p]));

/** The whole catalog (checked-in; empty until `blux convert`). */
export function allProducts(): Product[] {
  return PRODUCTS;
}

/** One product by its slug, or undefined. */
export function getProduct(slug: string): Product | undefined {
  return BY_SLUG.get(slug);
}

/** Every product slug — the prerender entry list for /products/[slug]. */
export function productSlugs(): string[] {
  return PRODUCTS.map((p) => p.slug);
}
