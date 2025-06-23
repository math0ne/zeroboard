import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.math0ne.zeroboard',
  appName: 'ZeroBoard',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'Light',
      backgroundColor: '#ffffff',
      overlaysWebView: false,
    },
  },
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
    useLegacyBridge: false,
  },
};

export default config;
