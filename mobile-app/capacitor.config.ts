import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'mobile-app',
  webDir: 'dist/mobile-app',
  server: {
    url: 'http://localhost:58935',
    cleartext: true
  },
};

export default config;
