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

const TOTAL_SEGMENTS = 100;
const RADIUS = 70;
const CENTER_X = 120;
const CENTER_Y = 120;
const PENCIL_WIDTH = 32;
const SEGMENT_HEIGHT = 9;
const START_ANGLE_DEG = 42;
const SWEEP_ANGLE_DEG = 276;

// Pre-compute tangential flat segments for a crisp hexagonal 3-facet pencil shaft
const SEGMENTS = Array.from({ length: TOTAL_SEGMENTS }, (_, i) => {
  const fraction = i / (TOTAL_SEGMENTS - 1);
  const angleDeg = START_ANGLE_DEG + fraction * SWEEP_ANGLE_DEG;
  const angleRad = (angleDeg * Math.PI) / 180;
  const cx = CENTER_X + RADIUS * Math.cos(angleRad);
  const cy = CENTER_Y + RADIUS * Math.sin(angleRad);
  return {
    id: i,
    fraction,
    left: cx - PENCIL_WIDTH / 2,
    top: cy - SEGMENT_HEIGHT / 2,
    angleDeg,
  };
});

const START_RAD = (START_ANGLE_DEG * Math.PI) / 180;
const START_X = CENTER_X + RADIUS * Math.cos(START_RAD);
const START_Y = CENTER_Y + RADIUS * Math.sin(START_RAD);

/**
 * Clean, Architectural Splash Screen
 * The hexagonal 3-facet pencil progressively traces and completes the letter "C"
 * with zero circular bead artifacts and a minimalist, professional layout.
 */
export const DramaticSplashScreen: React.FC<DramaticSplashScreenProps> = ({
  durationMs = 2300,
  onFinish,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [drawProgress, setDrawProgress] = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const progressListener = progressAnim.addListener(({ value }: { value: number }) => {
      setDrawProgress(value);
    });

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: durationMs - 400,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      Animated.sequence([
        Animated.delay(140),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onFinish) {
          onFinish();
        }
      });
    });

    return () => {
      progressAnim.removeListener(progressListener);
    };
  }, [durationMs, fadeAnim, scaleAnim, progressAnim, onFinish]);

  // Leading pencil tip position & tangent angle
  const currentAngleDeg = START_ANGLE_DEG + drawProgress * SWEEP_ANGLE_DEG;
  const currentAngleRad = (currentAngleDeg * Math.PI) / 180;
  const tipX = CENTER_X + RADIUS * Math.cos(currentAngleRad);
  const tipY = CENTER_Y + RADIUS * Math.sin(currentAngleRad);

  const progressPercent = Math.round(drawProgress * 100);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.centerBlock, { transform: [{ scale: scaleAnim }] }]}>
        {/* Geometric Pencil "C" Canvas */}
        <View style={styles.pencilCanvas}>
          {/* Subtle Track Guide */}
          <View style={styles.guideRing} />

          {/* 1. Eraser & Metal Ferrule anchored at start of the "C" */}
          <View
            style={[
              styles.eraserPivotBox,
              {
                left: START_X - PENCIL_WIDTH / 2,
                top: START_Y - 32,
                transform: [{ rotate: `${START_ANGLE_DEG}deg` }],
              },
            ]}
          >
            <View style={styles.eraserTip} />
            <View style={styles.ferruleBand}>
              <View style={styles.ferruleGroove} />
            </View>
          </View>

          {/* 2. Flat 3-Facet Hexagonal Pencil Body Segments */}
          {SEGMENTS.map((seg) => {
            if (seg.fraction > drawProgress) return null;
            return (
              <View
                key={seg.id}
                style={[
                  styles.shaftSegment,
                  {
                    left: seg.left,
                    top: seg.top,
                    transform: [{ rotate: `${seg.angleDeg}deg` }],
                  },
                ]}
              >
                <View style={styles.facetInner} />
                <View style={styles.facetCenter} />
                <View style={styles.facetOuter} />
              </View>
            );
          })}

          {/* 3. Leading Carved Wood Cone & Graphite Point */}
          <View
            style={[
              styles.tipPivotBox,
              {
                left: tipX - PENCIL_WIDTH / 2,
                top: tipY - 34,
                transform: [{ rotate: `${currentAngleDeg}deg` }],
              },
            ]}
          >
            <View style={styles.tipForwardHalf}>
              <View style={styles.woodCone} />
              <View style={styles.graphiteApex} />
            </View>
          </View>
        </View>

        {/* Minimalist Brand Header */}
        <View style={styles.brandBlock}>
          <Text style={styles.brandTitle}>
            CAMBIA<Text style={styles.brandAccent}>Z</Text>O
          </Text>
          <Text style={styles.brandTagline}>ECOSISTEMA ESCOLAR</Text>
        </View>
      </Animated.View>

      {/* Clean, Sharp Linear Progress Footer (No rounded pills or clutter) */}
      <View style={styles.footer}>
        <View style={styles.progressHeader}>
          <Text style={styles.statusText}>INICIANDO</Text>
          <Text style={styles.percentText}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pencilCanvas: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  guideRing: {
    position: 'absolute',
    left: CENTER_X - RADIUS,
    top: CENTER_Y - RADIUS,
    width: RADIUS * 2,
    height: RADIUS * 2,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRightColor: 'transparent',
  },

  /* Eraser & Ferrule Pivot Box (32 x 64 centered at START_X, START_Y) */
  eraserPivotBox: {
    position: 'absolute',
    width: PENCIL_WIDTH,
    height: 64,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 10,
  },
  eraserTip: {
    width: PENCIL_WIDTH,
    height: 18,
    backgroundColor: '#F43F5E',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  ferruleBand: {
    width: PENCIL_WIDTH,
    height: 14,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ferruleGroove: {
    width: PENCIL_WIDTH,
    height: 3,
    backgroundColor: '#94A3B8',
  },

  /* 3-Facet Hexagonal Pencil Shaft Segment (32px wide) */
  shaftSegment: {
    position: 'absolute',
    width: PENCIL_WIDTH,
    height: SEGMENT_HEIGHT,
    flexDirection: 'row',
    zIndex: 5,
  },
  facetInner: {
    width: 9,
    height: SEGMENT_HEIGHT,
    backgroundColor: '#D97706',
  },
  facetCenter: {
    width: 14,
    height: SEGMENT_HEIGHT,
    backgroundColor: '#FACC15',
  },
  facetOuter: {
    width: 9,
    height: SEGMENT_HEIGHT,
    backgroundColor: '#FEF08A',
  },

  /* Sharp Carved Tip Pivot Box (32 x 68 centered at tipX, tipY) */
  tipPivotBox: {
    position: 'absolute',
    width: PENCIL_WIDTH,
    height: 68,
    zIndex: 15,
  },
  tipForwardHalf: {
    marginTop: 34,
    width: PENCIL_WIDTH,
    height: 34,
    alignItems: 'center',
  },
  woodCone: {
    width: 0,
    height: 0,
    borderLeftWidth: PENCIL_WIDTH / 2,
    borderRightWidth: PENCIL_WIDTH / 2,
    borderTopWidth: 32,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FDE68A',
  },
  graphiteApex: {
    position: 'absolute',
    top: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#334155',
  },

  /* Minimalist Typography */
  brandBlock: {
    marginTop: 28,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 5,
  },
  brandAccent: {
    color: '#FACC15',
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
    letterSpacing: 3,
  },

  /* Clean Architectural Footer (No rounded pills) */
  footer: {
    position: 'absolute',
    bottom: 56,
    width: 200,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  percentText: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    width: '100%',
    height: 2,
    backgroundColor: '#1E293B',
  },
  progressFill: {
    height: 2,
    backgroundColor: '#FACC15',
  },
});
