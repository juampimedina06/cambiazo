import React from 'react';
import { Redirect } from 'expo-router';
import { authStore } from '../src/shared/store/auth-store';

export default function RootIndex() {
  const state = authStore.getState();

  if (state.currentRole === 'STUDENT') {
    return <Redirect href="/(student)" />;
  }

  if (state.currentRole === 'PARENT') {
    return <Redirect href="/(parent)" />;
  }

  return <Redirect href="/(auth)/school-code" />;
}
