
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 

const firebaseConfig = {
  apiKey: "AIzaSyAsul5CRQPBX9nDtAZNb6D2evCQ8xf2rTs",
  authDomain: "nomeai.firebaseapp.com",
  projectId: "nomeai",
  storageBucket: "nomeai.firebasestorage.app",
  messagingSenderId: "601961073777",
  appId: "1:601961073777:web:b4b6e4827bc313041d5fd0",
  measurementId: "G-3NCC3PVLMN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;