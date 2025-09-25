  // firebase/config.js
  import { initializeApp } from "firebase/app";
  import { getFirestore } from "firebase/firestore";
  import { getAuth } from "firebase/auth";

  // ✅ Your Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyBppdYgee72AUmdw5E5TLI4I-3OYb7bbDU",
    authDomain: "online-voting-system-d7d85.firebaseapp.com",
    projectId: "online-voting-system-d7d85",
    storageBucket: "online-voting-system-d7d85.firebasestorage.app",
    messagingSenderId: "471963240542",
    appId: "1:471963240542:web:ff86aef6ae58bba2d00ccf",
    measurementId: "G-NPWTH88QQX",
  };

  // ✅ Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // ✅ Export services you’ll use
  export const db = getFirestore(app);
  export const auth = getAuth(app);
