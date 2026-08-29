/**
 * Seeds a handful of mock providers into Firestore so the client-side app
 * has real data to query against (client-side phase has no worker app yet
 * to create these documents itself).
 *
 * Usage:
 *   1. Fill in your Firebase config in .env (see .env.example)
 *   2. npm run seed
 *
 * Coordinates are centered around Tébessa, Algeria - adjust as needed.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import 'dotenv/config';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BASE = { lat: 35.4, lng: 8.12 }; // Tébessa

function jitter(v: number, spread = 0.03) {
  return v + (Math.random() - 0.5) * spread;
}

const mockProviders = [
  { type: 'mechanic', name: 'Karim Auto Repair', phone: '+213555000001' },
  { type: 'mechanic', name: 'Rapide Mécanique', phone: '+213555000002' },
  { type: 'tow', name: 'Tow Express Tébessa', phone: '+213555000003' },
  { type: 'taxi', name: 'Yacine Taxi', phone: '+213555000004' },
  { type: 'taxi', name: 'City Cab Tébessa', phone: '+213555000005' },
  { type: 'ambulance', name: 'Croissant Rouge Local Unit', phone: '+213555000006' },
  { type: 'garage', name: 'Garage Amine', phone: '+213555000007' },
  { type: 'station', name: 'Fuel Point Mobile', phone: '+213555000008' },
] as const;

async function seed() {
  for (const p of mockProviders) {
    const id = `${p.type}-${p.name.toLowerCase().replace(/\s+/g, '-')}`;
    await setDoc(doc(collection(db, 'providers'), id), {
      ownerUid: 'seed-data', // placeholder - these aren't real worker accounts, just demo data for the client-side flow
      type: p.type,
      name: p.name,
      phone: p.phone,
      available: true,
      rating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
      location: { lat: jitter(BASE.lat), lng: jitter(BASE.lng) },
      address: { raw: 'Tébessa, Algeria', city: 'Tébessa', country: 'Algeria' },
    });
    console.log(`Seeded ${id}`);
  }
  console.log('Done.');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
