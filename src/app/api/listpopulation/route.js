import { NextResponse } from "next/server";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✅ GET - fetch all population joined with users
export async function GET() {
  try {
    const populationSnap = await getDocs(collection(db, "population"));
    const usersSnap = await getDocs(collection(db, "users"));

    const usersMap = {};
    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      usersMap[data.reqId] = data;
    });

    const data = populationSnap.docs.map((popDoc) => {
      const pop = popDoc.data();
      const user = usersMap[pop.reqId] || {};
      return {
        ...pop,
        username: user.username || null,
        userpass: user.userpass || null,
        role: user.role || null,
        userstatus: user.userStatus || null, // 🔑 careful: your DB field is userStatus (capital S)
        photo: pop.photo || null,
      };
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching population:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ✅ PUT - update existing population record
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
      photo,
    } = body;

    if (!reqId) {
      return NextResponse.json({ success: false, error: "reqId is required" }, { status: 400 });
    }

    // Update population
    await setDoc(
      doc(db, "population", reqId),
      { firstname, lastname, age, contact, gender, email, residence, photo },
      { merge: true }
    );

    // Update user
    await setDoc(
      doc(db, "users", reqId),
      { username, userpass, role, userStatus: "Active" },
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

// ✅ DELETE - remove population and user
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
