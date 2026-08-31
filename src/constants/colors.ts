// Premium navy + gold palette, sampled directly from the new shield logo.
// Navy is the structural/brand color (headers, primary surfaces, primary
// buttons). Gold is the accent/CTA color - use it sparingly, for the
// things that should catch the eye (main action buttons, active states,
// the logo/splash, small highlight details). Don't tint whole screens gold.

export const colors = {
  // Navy family (from the logo's shield background)
  navy900: '#0F1626', // deepest - splash/intro background
  navy800: '#151E31', // dark surfaces, headers
  navy700: '#232D40', // brand navy - primary buttons/icons on light bg
  navy600: '#3A4459', // secondary text on dark surfaces

  // Gold family (from the logo's foil)
  gold400: '#E7D082', // light highlight, shimmer
  gold500: '#D4AF6A', // main accent - CTAs, active states, focus rings
  gold600: '#B69757', // deep gold - pressed states, shadows on gold

  // Neutrals
  background: '#F7F6F2', // warm off-white, pairs with gold better than grey
  surface: '#FFFFFF',
  text: '#141821',
  textMuted: '#6B7280',
  textOnDark: '#F3F1EA',
  textMutedOnDark: '#9CA6B8',
  border: '#E7E4DC',
  borderOnDark: 'rgba(243, 241, 234, 0.14)',

  // Semantic
  danger: '#C1483B',
  success: '#1E8E5A',
  warning: '#D19A34',

  // Backwards-compatible aliases (existing screens reference these) -
  // now pointing at the new palette instead of the old green.
  primary: '#232D40', // was #0E6046
  primaryLight: 'rgba(35, 45, 64, 0.5)',
  accent: '#D4AF6A',
};
