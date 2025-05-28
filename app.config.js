import 'dotenv/config';

export default {
  expo: {
    name: 'problems',
    slug: 'problems',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'problems',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription:
          'This app uses the camera to take photos of climbing walls for problem creation',
        NSPhotoLibraryUsageDescription:
          'This app uses the photo library to save photos of climbing walls',
        NSPhotoLibraryAddUsageDescription:
          'This app saves photos of climbing walls to your photo library',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
      edgeToEdgeEnabled: true,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission:
            'This app uses the camera to take photos of climbing walls for problem creation',
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission:
            'This app uses the photo library to save photos of climbing walls',
          savePhotosPermission:
            'This app saves photos of climbing walls to your photo library',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
  },
};