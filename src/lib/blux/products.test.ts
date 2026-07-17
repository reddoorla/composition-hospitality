import { describe, it, expect } from "vitest";
import { allProducts, getProduct, productSlugs } from "./products";
import { categorySlug } from "./product-types";

describe("products loader", () => {
  it("loads the converted catalog with unique slugs", () => {
    const all = allProducts();
    expect(all.length).toBeGreaterThan(0);
    // Every product is addressable and slugs are unique (the detail routes).
    const slugs = productSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(getProduct(slugs[0]!)).toBeDefined();
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProduct("no-such-product-xyz")).toBeUndefined();
  });
});

describe("categorySlug", () => {
  it("slugifies a category to its listing path segment", () => {
    expect(categorySlug("Upholstered")).toBe("upholstered");
    expect(categorySlug("Ottomans & Benches")).toBe("ottomans-benches");
    expect(categorySlug("  Case  ")).toBe("case");
  });
});
