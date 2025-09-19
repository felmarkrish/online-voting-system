import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, query, where, setDoc } from "firebase/firestore";

// GET - fetch votestartup by year
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year"), 10);
    if (!year || year < 2000 || year > 2100)
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });

    // Admin SDK style
     const q = query(collection(db, "votestartup"), where("year", "==", year));
    const snapshot = await getDocs(q);

    const startup = snapshot.docs[0]?.data() || {
      year,
      start: "",
      message: "",
      alreadyvotemessage: "",
    };

    return NextResponse.json(startup, { status: 200 });
  } catch (err) {
    console.error("Firestore GET error:", err);
    return NextResponse.json(
      { error: "Database query failed", details: err.message },
      { status: 500 }
    );
  }
}


// PUT - insert or update votestartup
export async function PUT(req) {
  try {
    const { year, message, alreadyvotemessage, start } = await req.json();

    if (!year || message == null || alreadyvotemessage == null || !start) {
      return NextResponse.json(
        { error: "Year, Message, Already Vote Message, and Start are required" },
        { status: 400 }
      );
    }

    // Normalize start values to match frontend toggle
    const validStatuses = ["inprogress", "stop"];
    if (!validStatuses.includes(start)) {
      return NextResponse.json({ error: "Invalid start status" }, { status: 400 });
    }

    // Use year as document ID
    const docRef = doc(db, "votestartup", year.toString());
    await setDoc(
      docRef,
      { year, message, alreadyvotemessage, start },
      { merge: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: `Election ${start === "inprogress" ? "started" : "stopped"} for ${year}`,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Firestore PUT error:", err);
    return NextResponse.json(
      { error: "Database query failed", details: err.message },
      { status: 500 }
    );
  }
}
