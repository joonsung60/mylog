import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCuXa0nMJOvtZd7sOIx2jwSbGnYi3h3yhM",
  authDomain: "mylog-91010.firebaseapp.com",
  projectId: "mylog-91010",
  storageBucket: "mylog-91010.firebasestorage.app",
  messagingSenderId: "349029032516",
  appId: "1:349029032516:web:87a18a5107e39a5ff81211",
  measurementId: "G-FZ740VBB1X"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);