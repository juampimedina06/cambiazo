import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { authStore } from '../src/shared/store/auth-store';
import { DramaticSplashScreen } from '../src/shared/ui/DramaticSplashScreen';

export default function RootIndex() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const state = authStore.getState();

  if (!isSplashComplete) {
    return <DramaticSplashScreen onFinish={() => setIsSplashComplete(true)} />;
  }

  if (state.currentRole === 'STUDENT') {
    return <Redirect href="/(student)" />;
  }

  if (state.currentRole === 'PARENT') {
    return <Redirect href="/(parent)" />;
  }

  return <Redirect href="/(auth)/school-code" />;
}
