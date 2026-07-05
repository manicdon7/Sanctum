import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): any => ({
  ...config,
  name: 'Sanctum',
  slug: 'sanctum',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1C1815',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.sanctum.app',
    infoPlist: {
      NSFaceIDUsageDescription: 'Sanctum uses Face ID to keep your journal private.',
      NSCameraUsageDescription: 'Sanctum uses the camera to capture moments for your vault.',
      NSMicrophoneUsageDescription: 'Sanctum uses the microphone for voice memos.',
      NSPhotoLibraryUsageDescription: 'Sanctum saves media to your vault.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1C1815',
    },
    package: 'com.sanctum.app',
    permissions: [
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.VIBRATE',
    ],
    blockedPermissions: [
      'android.permission.READ_PHONE_STATE',
      'com.google.android.gms.permission.AD_ID',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-font',
    'expo-local-authentication',
    'expo-camera',
    [
      'expo-image-picker',
      {
        photosPermission: 'Sanctum saves photos to your private vault.',
        cameraPermission: 'Sanctum uses the camera to capture moments.',
        microphonePermission: 'Sanctum uses the microphone for voice memos.',
      },
    ],
  ],
  extra: {
    ...config.extra,
    syncBackendUrl: process.env.SANCTUM_SYNC_URL ?? null,
  },
  experiments: {
    typedRoutes: false,
  },
});
