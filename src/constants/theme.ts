// Shared design tokens. Import alongside `colors` wherever a screen is
// being restyled - keeps spacing/radius/type consistent instead of every
// screen inventing its own numbers.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const type = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: 0.2 },
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 19, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.6 }, // for uppercase eyebrow labels
};

// One shadow scale, tuned for navy-on-cream so cards lift without looking
// muddy. iOS reads shadow*, Android reads elevation.
export const shadow = {
  sm: {
    shadowColor: '#0F1626',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#0F1626',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  gold: {
    shadowColor: '#B69757',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
};
