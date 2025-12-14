// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCI4ButXE1zB1pWscY3WaXeogEjl56QkEY",
  authDomain:  "techshirt-32583.firebaseapp.com",
  projectId: "techshirt-32583",
  storageBucket:  "techshirt-32583.firebasestorage.app",
  messagingSenderId:  "529450318985",
  appId: "1:529450318985:web:1749c12af452a776369a58",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { app, messaging, getToken, onMessage };
