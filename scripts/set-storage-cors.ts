const fs = require('fs');
const path = require('path');

// Manuel indlæsning af .env for at sikre credentials
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      // Fjern eventuelle anføørselstegn
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key.trim()] = value;
    }
  });
}

console.log('🔑 Check Service Account Var:', process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? 'Fundet' : 'Mangler');

const { adminStorage } = require('../src/firebase/server-init');

async function setCors() {
  try {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'studio-7870211338-fe921.firebasestorage.app';
    console.log(`📡 Sætter CORS for bucket: ${bucketName}...`);
    
    const bucket = adminStorage.bucket(bucketName);
    
    await bucket.setCorsConfiguration([
      {
        maxAgeSeconds: 3600,
        method: ['GET', 'POST', 'PUT', 'DELETE'],
        origin: ['http://localhost:3000', 'https://cohero.dk', 'https://www.cohero.dk'],
        responseHeader: ['Content-Type', 'Authorization', 'x-goog-meta-path'],
      },
    ]);

    console.log('✅ CORS er nu konfigureret korrekt!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fejl ved konfiguration af CORS:', error);
    process.exit(1);
  }
}

setCors();
