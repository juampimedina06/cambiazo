import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface DramaticSplashScreenProps {
  durationMs?: number;
  onFinish?: () => void;
}

/**
 * Premium Dramatic Splash Screen with Vector Curved Pencil "C" Spinner
 * Replaces cluttered stock photo with clean, high-contrast school chalkboard blueprint.
 */
export const DramaticSplashScreen: React.FC<DramaticSplashScreenProps> = ({
  durationMs = 2600,
  onFinish,
}) => {
  // Animation drivers
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.7)).current;
  const pencilSpinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sniperReticleAnim = useRef(new Animated.Value(45)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    // 1. Initial fade-in & elastic logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(sniperReticleAnim, {
        toValue: 12,
        friction: 5,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous Pencil Spinner Rotation (The Spinner / Sniper charge loop)
    const spinLoop = Animated.loop(
      Animated.timing(pencilSpinAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    // 3. Energetic Pulse Loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 350,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: 350,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 4. Progress bar charging to 100%
    const progressListener = progressAnim.addListener(({ value }: { value: number }) => {
      setProgressPercent(Math.round(value * 100));
    });

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: durationMs - 400,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      // 5. Exit Transition: Zoom out with flash and fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 380,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(logoScaleAnim, {
          toValue: 1.15,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        spinLoop.stop();
        pulseLoop.stop();
        if (onFinish) {
          onFinish();
        }
      });
    });

    return () => {
      progressAnim.removeListener(progressListener);
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [durationMs, fadeAnim, logoScaleAnim, pencilSpinAnim, pulseAnim, sniperReticleAnim, progressAnim, onFinish]);

  // Interpolations
  const spinInterpolation = pencilSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const counterSpinInterpolation = pencilSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Sleek Dark School Blueprint Grid Background */}
      <View style={styles.gridOverlay}>
        <View style={styles.ambientGlowPrimary} />
        <View style={styles.ambientGlowYellow} />
      </View>

      {/* Center Stage: The Animated Pencil "C" Spinner & Sniper Reticle */}
      <View style={styles.centerStage}>
        {/* Outer Charging Pulse Wave */}
        <Animated.View
          style={[
            styles.pulseWave,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Outer Sniper Target Rings */}
        <Animated.View
          style={[
            styles.sniperRingDashed,
            { transform: [{ rotate: counterSpinInterpolation }] },
          ]}
        >
          <View style={styles.orbitingMintParticle} />
        </Animated.View>

        {/* Sniper Reticle Corner Brackets */}
        <Animated.View
          style={[
            styles.reticleCorner,
            styles.reticleTopLeft,
            { transform: [{ translateX: Animated.multiply(sniperReticleAnim, -1) }, { translateY: Animated.multiply(sniperReticleAnim, -1) }] },
          ]}
        />
        <Animated.View
          style={[
            styles.reticleCorner,
            styles.reticleTopRight,
            { transform: [{ translateX: sniperReticleAnim }, { translateY: Animated.multiply(sniperReticleAnim, -1) }] },
          ]}
        />
        <Animated.View
          style={[
            styles.reticleCorner,
            styles.reticleBottomLeft,
            { transform: [{ translateX: Animated.multiply(sniperReticleAnim, -1) }, { translateY: sniperReticleAnim }] },
          ]}
        />
        <Animated.View
          style={[
            styles.reticleCorner,
            styles.reticleBottomRight,
            { transform: [{ translateX: sniperReticleAnim }, { translateY: sniperReticleAnim }] },
          ]}
        />

        {/* The Animated Curved Pencil "C" Spinner */}
        <Animated.View
          style={[
            styles.pencilSpinnerContainer,
            {
              transform: [
                { scale: logoScaleAnim },
                { rotate: spinInterpolation },
              ],
            },
          ]}
        >
          {/* Main Curved Yellow Body (The "C") */}
          <View style={styles.pencilBodyArc}>
            <View style={styles.pencilBevelHighlight} />
          </View>

          {/* Top Tip: Wood + Graphite Lead */}
          <View style={styles.topTipContainer}>
            <View style={styles.woodCone} />
            <View style={styles.graphiteLead} />
          </View>

          {/* Bottom End: Silver Ferrule + Pink Eraser */}
          <View style={styles.bottomEraserContainer}>
            <View style={styles.metalFerrule} />
            <View style={styles.pinkEraser} />
          </View>
        </Animated.View>

        {/* Brand Name Title */}
        <Animated.View style={[styles.brandContainer, { transform: [{ scale: logoScaleAnim }] }]}>
          <Text style={styles.brandTitle}>
            CAMBIA<Text style={styles.brandTitleZ}>Z</Text>O
          </Text>
          <Text style={styles.brandSubtitle}>Billetera Escolar & Comunidad</Text>
        </Animated.View>
      </View>

      {/* Bottom HUD: Charging Bar & School Status */}
      <View style={styles.bottomHud}>
        <View style={styles.loadingInfoRow}>
          <Text style={styles.loadingStatusText}>
            {progressPercent < 35
              ? 'Afilando el lápiz...'
              : progressPercent < 75
              ? 'Cargando billetera escolar...'
              : '¡Listo para el recreo!'}
          </Text>
          <Text style={styles.percentageText}>{progressPercent}%</Text>
        </View>

        {/* High-tech charging track */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>

        {/* School Supplies Ticker */}
        <View style={styles.schoolPillsRow}>
          <View style={styles.miniSchoolPill}>
            <Text style={styles.miniPillEmoji}>✏️</Text>
            <Text style={styles.miniPillText}>Lápiz C</Text>
          </View>
          <View style={styles.miniSchoolPill}>
            <Text style={styles.miniPillEmoji}>⚡</Text>
            <Text style={styles.miniPillText}>QR Rápido</Text>
          </View>
          <View style={styles.miniSchoolPill}>
            <Text style={styles.miniPillEmoji}>⭐</Text>
            <Text style={styles.miniPillText}>Puntos</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const STAGE_SIZE = 160;
const PENCIL_RADIUS = 100;
const PENCIL_THICKNESS = 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090814',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0818',
    overflow: 'hidden',
  },
  ambientGlowPrimary: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: (SCREEN_WIDTH * 0.7) / 2,
    backgroundColor: 'rgba(108, 60, 233, 0.22)',
  },
  ambientGlowYellow: {
    position: 'absolute',
    top: '40%',
    right: '15%',
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: (SCREEN_WIDTH * 0.6) / 2,
    backgroundColor: 'rgba(250, 204, 21, 0.14)',
  },
  centerStage: {
    width: STAGE_SIZE,
    height: STAGE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: -40,
  },
  pulseWave: {
    position: 'absolute',
    width: PENCIL_RADIUS + 40,
    height: PENCIL_RADIUS + 40,
    borderRadius: (PENCIL_RADIUS + 40) / 2,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.35)',
  },
  sniperRingDashed: {
    position: 'absolute',
    width: PENCIL_RADIUS + 54,
    height: PENCIL_RADIUS + 54,
    borderRadius: (PENCIL_RADIUS + 54) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(108, 60, 233, 0.45)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitingMintParticle: {
    position: 'absolute',
    top: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 6,
  },
  reticleCorner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#FACC15',
  },
  reticleTopLeft: {
    top: -15,
    left: -15,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  reticleTopRight: {
    top: -15,
    right: -15,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
  },
  reticleBottomLeft: {
    bottom: -15,
    left: -15,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  reticleBottomRight: {
    bottom: -15,
    right: -15,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
  },

  /* Curved Pencil "C" Geometry */
  pencilSpinnerContainer: {
    width: PENCIL_RADIUS,
    height: PENCIL_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pencilBodyArc: {
    width: PENCIL_RADIUS,
    height: PENCIL_RADIUS,
    borderRadius: PENCIL_RADIUS / 2,
    borderWidth: PENCIL_THICKNESS,
    borderColor: '#FACC15',
    borderRightColor: 'transparent', // Forms the "C" opening on the right
    position: 'relative',
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
    elevation: 8,
  },
  pencilBevelHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PENCIL_RADIUS / 2,
    borderWidth: 2,
    borderColor: '#FEF08A',
    borderRightColor: 'transparent',
  },
  topTipContainer: {
    position: 'absolute',
    top: -2,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  woodCone: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FDE68A',
  },
  graphiteLead: {
    position: 'absolute',
    top: 0,
    left: 5,
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1E1B4B',
  },
  bottomEraserContainer: {
    position: 'absolute',
    bottom: -2,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  metalFerrule: {
    width: 7,
    height: PENCIL_THICKNESS + 2,
    backgroundColor: '#94A3B8',
    borderRadius: 1.5,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
  },
  pinkEraser: {
    width: 10,
    height: PENCIL_THICKNESS,
    backgroundColor: '#F472B6',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },

  /* Brand Typography below Pencil */
  brandContainer: {
    position: 'absolute',
    bottom: -80,
    alignItems: 'center',
    width: 260,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  brandTitleZ: {
    color: '#FACC15',
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
    letterSpacing: 1,
  },

  /* Bottom HUD */
  bottomHud: {
    position: 'absolute',
    bottom: 50,
    left: 36,
    right: 36,
    alignItems: 'center',
    gap: 14,
  },
  loadingInfoRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingStatusText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  percentageText: {
    color: '#FACC15',
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    width: '100%',
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FACC15',
    borderRadius: 4,
  },
  schoolPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  miniSchoolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  miniPillEmoji: {
    fontSize: 12,
  },
  miniPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
});
