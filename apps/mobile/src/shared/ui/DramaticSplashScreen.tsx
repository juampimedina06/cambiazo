import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface DramaticSplashScreenProps {
  durationMs?: number;
  onFinish?: () => void;
}

const TOTAL_SEGMENTS = 48;
const RADIUS = 62;
const CENTER_X = 100;
const CENTER_Y = 100;
const BEAD_DIAMETER = 18;
const START_ANGLE_DEG = 40;
const SWEEP_ANGLE_DEG = 280;

// Pre-compute geometric coordinates for all segments of the curved pencil "C"
const SEGMENTS = Array.from({ length: TOTAL_SEGMENTS }, (_, i) => {
  const fraction = i / (TOTAL_SEGMENTS - 1);
  const angleDeg = START_ANGLE_DEG + fraction * SWEEP_ANGLE_DEG;
  const angleRad = (angleDeg * Math.PI) / 180;
  const x = CENTER_X + RADIUS * Math.cos(angleRad) - BEAD_DIAMETER / 2;
  const y = CENTER_Y + RADIUS * Math.sin(angleRad) - BEAD_DIAMETER / 2;
  return { id: i, fraction, x, y, angleDeg };
});

/**
 * Dramatic School Splash Screen with Progressive Pencil-Drawing "C" Completion
 * Instead of rotating the whole logo like a wheel, the pencil tip literally
 * traces and completes the curved letter "C" from 0% to 100%.
 */
export const DramaticSplashScreen: React.FC<DramaticSplashScreenProps> = ({
  durationMs = 2400,
  onFinish,
}) => {
  // Animation drivers
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const finishSparkleAnim = useRef(new Animated.Value(0)).current;

  const [drawProgress, setDrawProgress] = useState(0);

  useEffect(() => {
    // 1. Initial fade-in & elastic entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous subtle pulse while drawing
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.97,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Listener tracking the pencil drawing progress (0 to 1)
    const progressListener = progressAnim.addListener(({ value }: { value: number }) => {
      setDrawProgress(value);
    });

    // 4. Animate the pencil drawing the "C"
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: durationMs - 450,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      // 5. Completion moment: flash sparkle at the pencil tip
      Animated.sequence([
        Animated.spring(finishSparkleAnim, {
          toValue: 1,
          friction: 3,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.delay(150),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start(() => {
        pulseLoop.stop();
        if (onFinish) {
          onFinish();
        }
      });
    });

    return () => {
      progressAnim.removeListener(progressListener);
      pulseLoop.stop();
    };
  }, [durationMs, fadeAnim, scaleAnim, progressAnim, pulseAnim, finishSparkleAnim, onFinish]);

  // Current tip coordinates along the drawing arc
  const currentAngleDeg = START_ANGLE_DEG + drawProgress * SWEEP_ANGLE_DEG;
  const currentAngleRad = (currentAngleDeg * Math.PI) / 180;
  const tipX = CENTER_X + RADIUS * Math.cos(currentAngleRad);
  const tipY = CENTER_Y + RADIUS * Math.sin(currentAngleRad);
  const tipRotationDeg = currentAngleDeg + 90; // Tangent direction pointing forward

  const progressPercent = Math.round(drawProgress * 100);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Deep School Chalkboard Background with Ambient Violet/Yellow Glows */}
      <View style={styles.ambientBackground}>
        <View style={styles.glowViolet} />
        <View style={styles.glowYellow} />
      </View>

      {/* Center Stage: The Progressive Pencil-Drawing "C" */}
      <Animated.View style={[styles.centerStage, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.pencilStageCanvas}>
          {/* Faint Guide Track of the "C" */}
          <View style={styles.guideTrackCircle} />

          {/* 1. Stationary Eraser & Ferrule at the start (Bottom-Right, 40°) */}
          <View style={styles.eraserAnchor}>
            <View style={styles.metalFerrule} />
            <View style={styles.pinkEraser} />
          </View>

          {/* 2. Overlapping Curved Beads forming the Yellow Pencil Body */}
          {SEGMENTS.map((seg) => {
            const isVisible = seg.fraction <= drawProgress;
            if (!isVisible) return null;
            return (
              <View
                key={seg.id}
                style={[
                  styles.pencilBead,
                  {
                    left: seg.x,
                    top: seg.y,
                  },
                ]}
              >
                <View style={styles.beadHighlight} />
              </View>
            );
          })}

          {/* 3. Moving Pencil Tip (Wood Cone + Graphite Point) actively drawing the line */}
          <View
            style={[
              styles.movingPencilTip,
              {
                left: tipX - 10,
                top: tipY - 14,
                transform: [{ rotate: `${tipRotationDeg}deg` }] as any,
              },
            ]}
          >
            <View style={styles.woodCone} />
            <View style={styles.graphiteLead} />
          </View>

          {/* 4. Completion Sparkle / Flash at 100% */}
          <Animated.View
            style={[
              styles.sparkleContainer,
              {
                left: tipX - 18,
                top: tipY - 18,
                transform: [{ scale: finishSparkleAnim }],
                opacity: finishSparkleAnim,
              },
            ]}
          >
            <View style={styles.sparkleStar} />
            <View style={[styles.sparkleStar, { transform: [{ rotate: '45deg' }] as any }]} />
          </Animated.View>
        </View>

        {/* Brand Name Typography */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>
            CAMBIA<Text style={styles.brandTitleZ}>Z</Text>O
          </Text>
          <Text style={styles.brandSubtitle}>
            {progressPercent < 50
              ? 'Dibujando tu recreo...'
              : progressPercent < 100
              ? 'Completando el lápiz...'
              : '¡Todo listo!'}
          </Text>
        </View>
      </Animated.View>

      {/* Bottom HUD: Progress Bar & School Indicators */}
      <View style={styles.bottomHud}>
        <View style={styles.loadingInfoRow}>
          <Text style={styles.loadingLabel}>Cargando experiencia escolar</Text>
          <Text style={styles.percentageText}>{progressPercent}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>

        <View style={styles.schoolPillsRow}>
          <View style={styles.miniSchoolPill}>
            <Text style={styles.miniPillEmoji}>✏️</Text>
            <Text style={styles.miniPillText}>Lápiz C</Text>
          </View>
          <View style={styles.miniSchoolPill}>
            <Text style={styles.miniPillEmoji}>⚡</Text>
            <Text style={styles.miniPillText}>QR Kiosco</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090814',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090814',
    overflow: 'hidden',
  },
  glowViolet: {
    position: 'absolute',
    top: '28%',
    left: '15%',
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: (SCREEN_WIDTH * 0.7) / 2,
    backgroundColor: 'rgba(108, 60, 233, 0.2)',
  },
  glowYellow: {
    position: 'absolute',
    top: '38%',
    right: '15%',
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    borderRadius: (SCREEN_WIDTH * 0.65) / 2,
    backgroundColor: 'rgba(250, 204, 21, 0.16)',
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  pencilStageCanvas: {
    width: 200,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideTrackCircle: {
    position: 'absolute',
    left: CENTER_X - RADIUS,
    top: CENTER_Y - RADIUS,
    width: RADIUS * 2,
    height: RADIUS * 2,
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
    borderRightColor: 'transparent',
  },

  /* Fixed Eraser & Ferrule (Starting at bottom-right, ~40deg) */
  eraserAnchor: {
    position: 'absolute',
    left: 146,
    top: 133,
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ rotate: '-50deg' }],
    zIndex: 10,
  },
  metalFerrule: {
    width: 7,
    height: BEAD_DIAMETER,
    backgroundColor: '#94A3B8',
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
  },
  pinkEraser: {
    width: 11,
    height: BEAD_DIAMETER - 2,
    backgroundColor: '#F472B6',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },

  /* Overlapping Yellow Pencil Beads */
  pencilBead: {
    position: 'absolute',
    width: BEAD_DIAMETER,
    height: BEAD_DIAMETER,
    borderRadius: BEAD_DIAMETER / 2,
    backgroundColor: '#FACC15',
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  beadHighlight: {
    width: BEAD_DIAMETER * 0.45,
    height: BEAD_DIAMETER * 0.45,
    borderRadius: (BEAD_DIAMETER * 0.45) / 2,
    backgroundColor: '#FEF08A',
    opacity: 0.8,
  },

  /* Moving Active Pencil Tip */
  movingPencilTip: {
    position: 'absolute',
    width: 20,
    height: 28,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 20,
  },
  woodCone: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FDE68A',
  },
  graphiteLead: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1E1B4B',
  },

  /* Completion Sparkle */
  sparkleContainer: {
    position: 'absolute',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  sparkleStar: {
    position: 'absolute',
    width: 22,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 10,
  },

  /* Brand Typography */
  brandContainer: {
    marginTop: 22,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  brandTitleZ: {
    color: '#FACC15',
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 5,
    letterSpacing: 0.5,
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
  loadingLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
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
