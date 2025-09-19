import { NextResponse } from "next/server";
import {
  collection,
  query,
  orderBy,
  where,
  limit,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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

    // ✅ Required fields check
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
        { success: false, error: "All fields required" },
        { status: 400 }
      );
    }

    // ✅ Check if password already exists in users
    const usersRef = collection(db, "users");
    const passCheckQuery = query(usersRef, where("userpass", "==", userpass));
    const passSnapshot = await getDocs(passCheckQuery);

    if (!passSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Password already exists. Choose another one." },
        { status: 400 }
      );
    }

    // ✅ Always save photo as PNG
    let photoUrl = photo;
    if (!photo.startsWith("data:image/png")) {
      photoUrl = photo.replace(/^data:image\/\w+/, "data:image/png");
    }

    // ✅ Get year and last reqId
    const year = new Date().getFullYear();
    const populationRef = collection(db, "population");

    const q = query(
      populationRef,
      where("year", "==", year),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);

    let newNumber = 1;
    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0].data();
      const lastNum = parseInt(lastDoc.reqId.split("-")[2], 10);
      newNumber = lastNum + 1;
    }

    const newReqId = `req-${year}-${String(newNumber).padStart(3, "0")}`;

    // ✅ Save population
    await setDoc(doc(db, "population", newReqId), {
      reqId: newReqId,
      firstname,
      lastname,
      age,
      contact,
      gender,
      email,
      residence,
      requestdate,
      photo: photoUrl,
      year,
      createdAt: serverTimestamp(),
    });

    // ✅ Save user
    await setDoc(doc(db, "users", newReqId), {
      reqId: newReqId,
      username,
      userpass,
      role,
      userStatus: "Inactive",
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      reqId: newReqId,
      message: "Request and user saved successfully (photo stored as PNG)",
    });
  } catch (error) {
    console.error("Error saving request:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
