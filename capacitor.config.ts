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
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
