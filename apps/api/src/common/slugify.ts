/**
 * Produces URL-safe slugs: "Samsung Galaxy S24" → "samsung-galaxy-s24".
 * Used for category/brand/product/vendor slugs.
 *
 * Rules:
 *  - lowercase
 *  - letters, numbers, dashes only
 *  - collapses multiple dashes
 *  - trims leading/trailing dashes
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}
