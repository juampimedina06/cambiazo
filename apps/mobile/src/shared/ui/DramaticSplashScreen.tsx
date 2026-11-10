import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface DramaticSplashScreenProps {
  durationMs?: number;
  onFinish?: () => void;
}

/**
 * Dramatic School Splash Screen with Animated Pencil "C" Spinner & Sniper Lock-On Effect
 */
export const DramaticSplashScreen: React.FC<DramaticSplashScreenProps> = ({
  durationMs = 2600,
  onFinish,
}) => {
  // Animation drivers
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomAnim = useRef(new Animated.Value(1.08)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const reticleLockAnim = useRef(new Animated.Value(30)).current; // Inward distance
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    // 1. Initial fade-in & cinematic zoom-in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(zoomAnim, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous 360 spinner rotation (Simulating the Sniper / Spinner charge loop)
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    // 3. Energetic pulse (charge-up rhythm)
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 4. Sniper reticle locking onto the pencil C
    Animated.spring(reticleLockAnim, {
      toValue: 10,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // 5. Progress bar charging to 100%
    const progressListener = progressAnim.addListener(({ value }: { value: number }) => {
      setProgressPercent(Math.round(value * 100));
    });

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: durationMs - 400,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      // 6. Dramatic Exit: Quick flash & smooth fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start(() => {
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
  }, [durationMs, fadeAnim, zoomAnim, spinAnim, pulseAnim, reticleLockAnim, progressAnim, onFinish]);

  // Interpolations
  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const reverseSpinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.imageContainer, { transform: [{ scale: zoomAnim }] }]}>
        <ImageBackground
          source={require('../../../assets/splash-school-bg.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {/* Dark chalkboard atmospheric overlay */}
          <View style={styles.overlay} />

          {/* Center Stage: The Animated Pencil Spinner & Sniper Target */}
          <View style={styles.centerStage}>
            {/* Outer Charging Pulse Glow */}
            <Animated.View
              style={[
                styles.glowAura,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />

            {/* Rotating Outer Radar / Spinner Ring */}
            <Animated.View
              style={[
                styles.spinnerOuterRing,
                {
                  transform: [{ rotate: spinInterpolation }],
                },
              ]}
            >
              <View style={styles.orbitingParticle} />
              <View style={styles.orbitingParticleOpposite} />
            </Animated.View>

            {/* Reverse Inner Counter-Spinner Ring */}
            <Animated.View
              style={[
                styles.spinnerInnerRing,
                {
                  transform: [{ rotate: reverseSpinInterpolation }],
                },
              ]}
            />

            {/* Sniper Crosshairs / Corner Reticles */}
            <Animated.View
              style={[
                styles.reticleCorner,
                styles.reticleTopLeft,
                { transform: [{ translateX: Animated.multiply(reticleLockAnim, -1) }, { translateY: Animated.multiply(reticleLockAnim, -1) }] },
              ]}
            />
            <Animated.View
              style={[
                styles.reticleCorner,
                styles.reticleTopRight,
                { transform: [{ translateX: reticleLockAnim }, { translateY: Animated.multiply(reticleLockAnim, -1) }] },
              ]}
            />
            <Animated.View
              style={[
                styles.reticleCorner,
                styles.reticleBottomLeft,
                { transform: [{ translateX: Animated.multiply(reticleLockAnim, -1) }, { translateY: reticleLockAnim }] },
              ]}
            />
            <Animated.View
              style={[
                styles.reticleCorner,
                styles.reticleBottomRight,
                { transform: [{ translateX: reticleLockAnim }, { translateY: reticleLockAnim }] },
              ]}
            />

            {/* Central Target Center Point */}
            <Animated.View
              style={[
                styles.targetCenterDot,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          </View>

          {/* Bottom HUD: Progress Bar & School Indicators */}
          <View style={styles.bottomHud}>
            <View style={styles.loadingInfoRow}>
              <Text style={styles.loadingStatusText}>
                {progressPercent < 40
                  ? 'Afilando el lápiz...'
                  : progressPercent < 80
                  ? 'Preparando el recreo...'
                  : '¡Todo listo!'}
              </Text>
              <Text style={styles.percentageText}>{progressPercent}%</Text>
            </View>

            {/* Cyber / Neon Yellow Charging Track */}
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>

            {/* Subtle school emojis ticker */}
            <View style={styles.emojiRow}>
              <Text style={styles.emoji}>✏️</Text>
              <Text style={styles.emoji}>📐</Text>
              <Text style={styles.emoji}>📚</Text>
            </View>
          </View>
        </ImageBackground>
      </Animated.View>
    </Animated.View>
  );
};

const RETICLE_SIZE = 140;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1917',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  centerStage: {
    position: 'absolute',
    top: '38%',
    left: '50%',
    marginLeft: -RETICLE_SIZE / 2,
    marginTop: -RETICLE_SIZE / 2,
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowAura: {
    position: 'absolute',
    width: RETICLE_SIZE * 0.9,
    height: RETICLE_SIZE * 0.9,
    borderRadius: (RETICLE_SIZE * 0.9) / 2,
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.4)',
  },
  spinnerOuterRing: {
    position: 'absolute',
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    borderRadius: RETICLE_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(250, 204, 21, 0.35)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitingParticle: {
    position: 'absolute',
    top: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FACC15',
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 8,
  },
  orbitingParticleOpposite: {
    position: 'absolute',
    bottom: -5,
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
  spinnerInnerRing: {
    position: 'absolute',
    width: RETICLE_SIZE * 0.72,
    height: RETICLE_SIZE * 0.72,
    borderRadius: (RETICLE_SIZE * 0.72) / 2,
    borderWidth: 1.5,
    borderTopColor: '#FACC15',
    borderRightColor: 'transparent',
    borderBottomColor: '#10B981',
    borderLeftColor: 'transparent',
  },
  reticleCorner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: '#FACC15',
  },
  reticleTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  reticleTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
  },
  reticleBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  reticleBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
  },
  targetCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(250, 204, 21, 0.8)',
  },
  bottomHud: {
    position: 'absolute',
    bottom: 60,
    left: 32,
    right: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingInfoRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  loadingStatusText: {
    color: '#F8F7FF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  percentageText: {
    color: '#FACC15',
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FACC15',
    borderRadius: 4,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  emoji: {
    fontSize: 16,
  },
});
