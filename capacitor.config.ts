import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dk.cohero.app',
  appName: 'Cohéro Student',
  webDir: 'public', // Vi peger på public mappen da den altid findes 
  server: {
    url: 'https://student.cohero.dk',
    cleartext: true
  }
};

export default config;
