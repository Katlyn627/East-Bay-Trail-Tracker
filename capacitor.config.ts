import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eastbay.trailtracker',
  appName: 'East Bay Trail Tracker',
  webDir: 'dist',
  server: {
    url: 'http://192.168.68.58:5173',
    cleartext: true
  }
};

export default config;
