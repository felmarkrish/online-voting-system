// app/api/save-request/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // Admin SDK
import admin from "firebase-admin";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      firstname,
      lastname,
      age,
      contact,
      gender,
      email,
      residence,
      requestdate,
      photo,
      username,
      userpass,
      role,
    } = body;

    // ✅ Validate required fields
    if (
      !firstname ||
      !lastname ||
      !age ||
      !contact ||
      !gender ||
      !email ||
      !residence ||
      !requestdate ||
      !username ||
      !userpass ||
      !role ||
      !photo
    ) {
      return NextResponse.json(
        { success: false, error: "⚠️ All fields are required" },
        { status: 400 }
      );
    }

    // ✅ Get current year
    const year = new Date().getFullYear();

    // ✅ Find last reqId for this year in Firestore
    const populationRef = db.collection("population");
    const snapshot = await populationRef
      .where("year", "==", year)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    let newNumber = 1;
    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0].data();
      const lastReqId = lastDoc.reqId; // e.g., req-2025-004
      const lastNum = parseInt(lastReqId.split("-")[2], 10);
      newNumber = lastNum + 1;
    }

    // ✅ Build new reqId
    const newReqId = `req-${year}-${String(newNumber).padStart(3, "0")}`;

    // ✅ Save population data
    await populationRef.doc(newReqId).set({
      reqId: newReqId,
      firstname,
      lastname,
      age,
      contact,
      gender,
      email,
      residence,
      requestdate,
      photo, // store base64 string
      year,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ✅ Save user data
    const usersRef = db.collection("users");
    await usersRef.doc(newReqId).set({
      reqId: newReqId,
      username,
      userpass,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      reqId: newReqId,
      message: "✅ Request and user saved successfully",
    });
  } catch (error) {
    console.error("❌ Error saving request:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
