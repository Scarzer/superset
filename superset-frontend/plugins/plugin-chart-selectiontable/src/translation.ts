type TranslateFn = (value: string) => string;

// Superset 6.x does not consistently export `t` from @superset-ui/core.
// Use a no-op translator to avoid bundler warnings.
export const translate: TranslateFn = value => value;
