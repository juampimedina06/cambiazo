import { useEffect, useState } from 'react';

export const MAX_EXCHANGE_IMAGES = 5;

export interface CameraStoreState {
  selectedImages: string[];
}

type Listener = (state: CameraStoreState) => void;

class CameraStore {
  private state: CameraStoreState = {
    selectedImages: [],
  };

  private readonly listeners = new Set<Listener>();

  getState(): CameraStoreState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  addSelectedImage(imageUri: string): void {
    this.addSelectedImages([imageUri]);
  }

  addSelectedImages(imageUris: string[]): void {
    const next = [...this.state.selectedImages];
    for (const raw of imageUris) {
      const uri = raw.trim();
      if (!uri || next.includes(uri)) continue;
      if (next.length >= MAX_EXCHANGE_IMAGES) break;
      next.push(uri);
    }
    this.state = { selectedImages: next };
    this.emit();
  }

  removeSelectedImage(imageUri: string): void {
    this.state = {
      selectedImages: this.state.selectedImages.filter((uri) => uri !== imageUri),
    };
    this.emit();
  }

  clearImages(): void {
    this.state = { selectedImages: [] };
    this.emit();
  }
}

export const cameraStore = new CameraStore();

/**
 * React hook mirroring products-app's useCameraStore pattern without requiring Zustand.
 */
export function useCameraStore() {
  const [state, setState] = useState<CameraStoreState>(() => cameraStore.getState());

  useEffect(() => {
    return cameraStore.subscribe(setState);
  }, []);

  return {
    selectedImages: state.selectedImages,
    addSelectedImage: (uri: string) => cameraStore.addSelectedImage(uri),
    addSelectedImages: (uris: string[]) => cameraStore.addSelectedImages(uris),
    removeSelectedImage: (uri: string) => cameraStore.removeSelectedImage(uri),
    clearImages: () => cameraStore.clearImages(),
  };
}

