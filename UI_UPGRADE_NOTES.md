# UI upgrade — batch 1: design system + animated splash

## What changed
- `src/constants/colors.ts` — rebuilt around the new logo. Navy (`#232D40` family)
  is now the structural brand color, gold (`#D4AF6A` family) is the accent/CTA
  color, sampled directly from your shield. `primary` still points at a single
  value so every screen that already imports `colors.primary` updates for free.
- `src/constants/theme.ts` — new: spacing, radius, type scale, shadow presets.
  Nothing uses these yet — they're there for the next screens.
- `src/components/AnimatedSplash.tsx` — new: the logo animation. Shield fades +
  springs in, a gold shimmer sweeps across it once, wordmark and tagline rise in,
  then it fades out into the app. ~2.4s total.
- `App.tsx` — shows `AnimatedSplash` first, then swaps to `RootNavigator`.
- `app.json` — native splash background is now navy, and uses the new logo as
  its static image (this is what shows for the split second before JS loads,
  before your animated one takes over).
- `assets/logo.png` — the new logo, added.
- `babel.config.js` — was missing from the export; added, with the Reanimated
  plugin wired in.

## Before you run it
Two new packages, both standard Expo-managed (no config plugin needed beyond
what's below):

```bash
npx expo install react-native-reanimated expo-linear-gradient
```

That's it — `babel.config.js` above already has the Reanimated plugin. Do a
clean start after installing (`npx expo start -c`) since Reanimated's plugin
needs a fresh Metro cache.

## Next
This covers the entry point. Same navy/gold language + the new `theme.ts`
tokens should carry through: auth screens next, then service selection, then
the booking/map flow. Say the word on which one and I'll do that page
complete — cards, buttons, empty/loading states, the lot — same as this batch.
