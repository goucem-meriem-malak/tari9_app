import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useT } from '@/store/useLocaleStore';

const { width: SCREEN_W } = Dimensions.get('window');
const LOGO_SIZE = 160;

interface Props {
  onFinish: () => void;
}

/**
 * Runs once on cold start, before RootNavigator mounts. Sequence:
 * 1. Shield fades + springs in from 0.85 -> 1
 * 2. A diagonal gold shimmer sweeps across it once
 * 3. Wordmark + tagline rise in underneath
 * 4. Everything holds briefly, then fades out and calls onFinish
 *
 * Total runtime ~2.4s. If that ever feels long once real auth/data checks
 * are wired in behind it, shorten HOLD_MS first - the motion itself is
 * already fast.
 */
export default function AnimatedSplash({ onFinish }: Props) {
  const t = useT();
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const shimmerX = useSharedValue(-1);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(10);
  const taglineOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    logoScale.value = withSpring(1, { damping: 9, stiffness: 90, mass: 0.6 });

    // shimmer sweeps once, starting just after the logo settles
    shimmerX.value = withDelay(550, withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }));

    textOpacity.value = withDelay(650, withTiming(1, { duration: 450 }));
    textTranslateY.value = withDelay(650, withTiming(0, { duration: 450, easing: Easing.out(Easing.quad) }));

    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));

    // hold, then fade the whole screen out and hand off
    screenOpacity.value = withDelay(
      2000,
      withSequence(
        withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) runOnJS(onFinish)();
        })
      )
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shimmerX.value * (LOGO_SIZE * 1.6) - LOGO_SIZE * 0.3 },
      { rotate: '20deg' },
    ],
    opacity: shimmerX.value > -1 && shimmerX.value < 1 ? 1 : 0,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      {/* soft radial-ish glow behind the shield */}
      <View style={styles.glow} />

      <View style={styles.logoWrap}>
        <Animated.Image source={require('../../assets/logo.png')} style={[styles.logo, logoStyle]} resizeMode="contain" />
        {/* shimmer sweep, clipped to the logo's bounding box */}
        <View style={styles.shimmerMask} pointerEvents="none">
          <Animated.View style={[styles.shimmerBar, shimmerStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(231, 208, 130, 0.85)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>

      <Animated.Text style={[styles.wordmark, textStyle]}>TARI9</Animated.Text>
      <Animated.Text style={[styles.tagline, taglineStyle]}>{t('splash.tagline')}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.navy900,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  glow: {
    position: 'absolute',
    width: SCREEN_W * 1.1,
    height: SCREEN_W * 1.1,
    borderRadius: SCREEN_W * 0.55,
    backgroundColor: colors.gold600,
    opacity: 0.07,
  },
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  shimmerMask: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 24,
  },
  shimmerBar: {
    position: 'absolute',
    top: -LOGO_SIZE * 0.3,
    width: LOGO_SIZE * 0.5,
    height: LOGO_SIZE * 1.6,
  },
  wordmark: {
    marginTop: 22,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 6,
    color: colors.textOnDark,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: colors.gold400,
  },
});
