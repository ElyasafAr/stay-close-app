import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stayclose.app',
  appName: 'Stay Close',
  webDir: 'out',
  // Server configuration for live reload during development
  // Comment this out for production builds
  // server: {
  //   url: 'http://YOUR_LOCAL_IP:3000',
  //   cleartext: true
  // },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
