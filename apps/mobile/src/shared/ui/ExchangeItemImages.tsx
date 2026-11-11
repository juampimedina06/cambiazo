import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { ImagePlus, X } from 'lucide-react-native';
import { colors } from '../theme/colors';

export interface ExchangeItemImagesProps {
  images: string[];
  onRemoveImage?: (uri: string) => void;
  height?: number;
  testID?: string;
}

/**
 * Horizontal image carousel with pagination pill and empty placeholder,
 * replicating products-app's ProductImages UX in Cambiazo's 60-30-10 design language.
 */
export const ExchangeItemImages: React.FC<ExchangeItemImagesProps> = ({
  images,
  onRemoveImage,
  height = 220,
  testID,
}) => {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const slideWidth = Math.max(240, width - 40);

  if (!images || images.length === 0) {
    return (
      <View
        style={[styles.emptyContainer, { height: 150 }]}
        testID={testID ? `${testID}-empty` : undefined}
      >
        <View style={styles.emptyIconCircle}>
          <ImagePlus size={26} color={colors.brand.primary} />
        </View>
        <Text style={styles.emptyTitle}>Sin fotos cargadas todavía</Text>
        <Text style={styles.emptyHint}>
          Sacá una foto o elegí hasta 5 imágenes de tu galería
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper} testID={testID}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event: any) => {
          const offsetX = event?.nativeEvent?.contentOffset?.x ?? 0;
          const layoutWidth = event?.nativeEvent?.layoutMeasurement?.width || slideWidth;
          const nextIndex = Math.round(offsetX / layoutWidth);
          if (nextIndex >= 0 && nextIndex < images.length) {
            setActiveIndex(nextIndex);
          }
        }}
      >
        {images.map((uri, index) => (
          <View key={`${uri}-${index}`} style={[styles.slide, { width: slideWidth, height }]}>
            <Image
              source={{ uri }}
              style={styles.image}
              resizeMode="cover"
            />
            {onRemoveImage && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => {
                  onRemoveImage(uri);
                  if (activeIndex >= images.length - 1 && activeIndex > 0) {
                    setActiveIndex(activeIndex - 1);
                  }
                }}
                testID={`btn-remove-image-${index}`}
              >
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {images.length > 1 && (
        <View style={styles.indicatorBadge}>
          <Text style={styles.indicatorText}>
            {Math.min(activeIndex + 1, images.length)} / {images.length}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.background.surface,
    marginBottom: 12,
  },
  slide: {
    position: 'relative',
    backgroundColor: colors.background.divider,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 27, 75, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorBadge: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    backgroundColor: colors.background.surface,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptyHint: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

