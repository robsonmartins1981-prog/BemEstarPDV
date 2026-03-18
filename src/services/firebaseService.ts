import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  enableIndexedDbPersistence,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuração do Firebase (Substituir pelos dados reais do console)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// Inicialização do Firestore com Cache Local Persistente (Offline-First)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const auth = getAuth(app);

/**
 * Tenta habilitar a persistência do IndexedDB (Legado, mas útil em alguns contextos)
 */
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Múltiplas abas abertas, persistência só pode ser habilitada em uma.
    console.warn('[Firebase] Persistência falhou: múltiplas abas.');
  } else if (err.code === 'unimplemented') {
    // O navegador não suporta persistência.
    console.warn('[Firebase] Persistência não suportada pelo navegador.');
  }
});

export { 
  app, 
  db, 
  auth,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit
};
