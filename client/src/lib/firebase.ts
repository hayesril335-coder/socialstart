import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

const firebaseConfig = {
  apiKey: 'AIzaSyBy6vVQgVqHeD75pql1jUjvL1N_kuXWa6U',
  authDomain: 'socialstart-main.firebaseapp.com',
  projectId: 'socialstart-main',
  storageBucket: 'socialstart-main.firebasestorage.app',
  messagingSenderId: '70199058708',
  appId: '1:70199058708:web:5807813edf42514f086201',
  measurementId: 'G-HZJ2JHSYTE',
}

const firebaseApp = initializeApp(firebaseConfig)

const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY
if (appCheckSiteKey) {
  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  })
}

export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
export const storage = getStorage(firebaseApp)
