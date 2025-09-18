// src/lib/firebase.js
import admin from "firebase-admin";
import serviceAccount from "../../firebase-service-account.json"; // adjust path

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore();
