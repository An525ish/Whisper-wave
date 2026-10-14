const ART_VARIANTS = 4;

/** Stable art variant per room — reorders never recolor. */
export const roomArtVariant = (slug: string): number => {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return hash % ART_VARIANTS;
};

/** First letter for an avatar tile, upper-cased; `?` when blank. */
export const initialOf = (label: string): string => (label.trim().charAt(0) || '?').toUpperCase();
