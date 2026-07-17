import { error } from "@sveltejs/kit";
import { getProduct, productSlugs } from "$lib/blux/products";

// Inherit the layout's `prerender = "auto"`: the entries below are prerendered
// as static pages, and an unconverted starter (empty catalog → no entries)
// simply generates nothing instead of erroring on an unseen forced-prerender
// route.

// The prerender entry list: every product slug. Empty on an unconverted starter,
// so no product routes are generated until `blux convert` fills products.json.
export function entries() {
  return productSlugs().map((slug) => ({ slug }));
}

export function load({ params }) {
  const product = getProduct(params.slug);
  if (!product) error(404, { message: "Product not found" });
  return { product, title: product.title };
}
