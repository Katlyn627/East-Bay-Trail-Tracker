import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eastbay.trailtracker',
  appName: 'East Bay Trail Tracker',
  webDir: 'dist',
  server: {
    // Allows dynamic LAN IP for local development without hardcoding
    url: process.env.VITE_DEV_SERVER_URL || undefined,
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;