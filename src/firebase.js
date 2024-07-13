import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA5IoKfD_0fXOTY88-V7fEzz0izZdUrGxI",
  authDomain: "onesense-4a320.firebaseapp.com",
  projectId: "onesense-4a320",
  storageBucket: "onesense-4a320.appspot.com",
  messagingSenderId: "975002921589",
  appId: "1:975002921589:web:a44984cf11c47ac91b663c",
  measurementId: "G-27EJHW1BM0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const storage = getStorage(app);
const firestore = getFirestore(app);

export { storage, firestore };