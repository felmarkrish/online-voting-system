// app/api/auth/validate/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reqId = searchParams.get("reqId");

    if (!reqId) {
      return NextResponse.json({ valid: false });
    }

    const userRef = doc(db, "users", reqId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false });
    }
  } catch (error) {
    console.error("Validate error:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
