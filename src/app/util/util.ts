
/**
 * Brands a type by intersecting it with a type with a brand property based on
 * the provided brand string.
 */
export type Brand<T, Brand extends string> = T & {
  readonly [B in Brand as `__${B}_brand`]: never;
};
