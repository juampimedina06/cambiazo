import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Check,
  Images,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { colors } from '../../../src/shared/theme/colors';
import { Button } from '../../../src/shared/ui/Button';
import { MAX_EXCHANGE_IMAGES, useCameraStore } from '../../../src/shared/store';

/**
 * Full-screen camera & multi-photo gallery picker replicating products-app's CameraScreen.
 */
export default function CommunityCameraScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { selectedImages, addSelectedImage, addSelectedImages } = useCameraStore();

  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | undefined>(undefined);
  const cameraRef = useRef<CameraView | null>(null);

  const remainingSlots = Math.max(1, MAX_EXCHANGE_IMAGES - selectedImages.length);

  const handleRequestPermissions = async () => {
    try {
      const { status } = await requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Necesitamos permiso de cámara para sacar fotos de tus útiles escolares.',
        );
      }
    } catch {
      Alert.alert('Error', 'No se pudo solicitar el permiso de cámara.');
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
    });

    if (result.canceled || !result.assets?.length) return;

    addSelectedImages(result.assets.map((asset) => asset.uri));
    router.back();
  };

  const handleShutterPress = async () => {
    if (!cameraRef.current) return;
    const picture = await cameraRef.current.takePictureAsync({
      quality: 0.7,
    });
    if (!picture?.uri) return;
    setCapturedUri(picture.uri);
  };

  const handleConfirmPhoto = () => {
    if (!capturedUri) return;
    addSelectedImage(capturedUri);
    router.back();
  };

  if (!cameraPermission) {
    return <View style={styles.container} />;
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer} testID="screen-camera-permission">
        <View style={styles.permissionIcon}>
          <Camera size={36} color={colors.brand.primary} />
        </View>
        <Text style={styles.permissionTitle}>Permiso de Cámara</Text>
        <Text style={styles.permissionText}>
          Necesitamos acceso a tu cámara para fotografiar el útil escolar, o podés elegir fotos desde tu galería.
        </Text>
        <Button
          label="Habilitar Cámara"
          onPress={handleRequestPermissions}
          variant="primary"
          style={styles.permissionBtn}
        />
        <Button
          label="Elegir desde Galería"
          icon={<Images size={18} color={colors.brand.primaryDark} />}
          onPress={handlePickFromGallery}
          variant="secondary"
          style={styles.permissionBtn}
        />
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelLink}>
          <Text style={styles.cancelLinkText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (capturedUri) {
    return (
      <View style={styles.container} testID="screen-camera-preview">
        <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="cover" />

        <TouchableOpacity
          style={styles.topLeftBtn}
          onPress={() => router.back()}
          testID="btn-camera-close"
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.topRightBtn}
          onPress={() => setCapturedUri(undefined)}
          testID="btn-camera-retake"
        >
          <X size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shutterBtn, { left: width / 2 - 34 }]}
          onPress={handleConfirmPhoto}
          testID="btn-camera-confirm"
        >
          <Check size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="screen-camera">
      <CameraView {...({ ref: cameraRef } as any)} style={styles.camera} facing={facing} />

      <TouchableOpacity
        style={styles.topLeftBtn}
        onPress={() => router.back()}
        testID="btn-camera-back"
      >
        <ArrowLeft size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.topRightBtn}
        onPress={() => setFacing((curr) => (curr === 'back' ? 'front' : 'back'))}
        testID="btn-camera-flip"
      >
        <RefreshCw size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.galleryBtn}
        onPress={handlePickFromGallery}
        testID="btn-camera-gallery"
      >
        <Images size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.shutterBtn, { left: width / 2 - 34 }]}
        onPress={handleShutterPress}
        testID="btn-camera-shutter"
      >
        <Camera size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topLeftBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryBtn: {
    position: 'absolute',
    bottom: 34,
    left: 28,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtn: {
    position: 'absolute',
    bottom: 26,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.brand.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.background.canvas,
  },
  permissionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionBtn: {
    width: '100%',
    marginBottom: 12,
  },
  cancelLink: {
    marginTop: 8,
    padding: 12,
  },
  cancelLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
});

