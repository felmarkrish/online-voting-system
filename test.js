import { db } from "./src/lib/firebase.js";

async function testFirestore() {
  try {
    const snapshot = await db.collection("users").get();
    console.log("Docs:", snapshot.docs.map(doc => doc.data()));
  } catch (err) {
    console.error("Firestore error:", err);
  }
}

testFirestore();
