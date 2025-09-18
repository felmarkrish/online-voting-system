// app/api/population/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // adjust path
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

// GET - fetch all population joined with users
export async function GET() {
  try {
    const populationRef = collection(db, "population");
    const populationSnap = await getDocs(populationRef);

    const data = [];

    for (const popDoc of populationSnap.docs) {
      const pop = popDoc.data();
      const userDoc = await getDoc(doc(db, "users", pop.reqId));
      const user = userDoc.exists() ? userDoc.data() : {};

      data.push({
        ...pop,
        username: user.username || null,
        userpass: user.userpass || null,
        role: user.role || null,
        userstatus: user.userstatus || null,
        photo: pop.photo || null, // assume stored as base64 string
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching population:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT - update existing population record
export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      reqId,
      firstname,
      lastname,
      age,
      contact,
      gender,
      email,
      residence,
      username,
      userpass,
      role,
      photo, // base64 string
    } = body;

    if (!reqId) {
      return NextResponse.json({ success: false, error: "reqId is required" }, { status: 400 });
    }

    // Update population
    const popRef = doc(db, "population", reqId);
    await setDoc(
      popRef,
      { firstname, lastname, age, contact, gender, email, residence, photo },
      { merge: true }
    );

    // Update user
    const userRef = doc(db, "users", reqId);
    await setDoc(
      userRef,
      { username, userpass, role, userstatus: "Active" },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: "✅ Population record updated successfully",
    });
  } catch (err) {
    console.error("Error updating population:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE - remove population and user
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reqId = searchParams.get("reqId");

    if (!reqId) {
      return NextResponse.json({ error: "Missing population ID" }, { status: 400 });
    }

    await deleteDoc(doc(db, "users", reqId));
    await deleteDoc(doc(db, "population", reqId));

    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error("Error deleting population:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
