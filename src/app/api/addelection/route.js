// app/api/elections/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // admin SDK
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";

// GET all elections
export async function GET() {
  try {
    const electionsRef = collection(db, "electorial_tbl");
    const q = query(electionsRef, orderBy("idx"));
    const snapshot = await getDocs(q);
    const elections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(elections);
  } catch (err) {
    console.error("GET elections error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST new election (or update silently if exists)
export async function POST(req) {
  try {
    const { election_name, num_winners, createddate, idx } = await req.json();
    if (!election_name || !num_winners) {
      return NextResponse.json(
        { error: "Election name and number of winners are required" },
        { status: 400 }
      );
    }

    // Check if election name already exists
    const electionsRef = collection(db, "electorial_tbl");
    const snapshot = await getDocs(electionsRef);
    const existing = snapshot.docs.find(doc => doc.data().election_name === election_name);

    if (existing) {
      // Update silently
      await updateDoc(doc(db, "electorial_tbl", existing.id), {
        num_winners,
        idx,
      });
      return NextResponse.json({
        message: "Election updated silently",
        electId: existing.id,
      });
    }

    // If not exists, create new election
    const newElectID = `2025-${Date.now()}`; // simple unique ID
    await setDoc(doc(db, "electorial_tbl", newElectID), {
      electId: newElectID,
      election_name,
      num_winners,
      createddate,
      idx,
    });

    return NextResponse.json({
      message: "Election added successfully",
      electId: newElectID,
    });
  } catch (err) {
    console.error("POST elections error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT update election
export async function PUT(req) {
  try {
    const { electId, election_name, num_winners, idx } = await req.json();
    if (!electId || !election_name || !num_winners) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const electionRef = doc(db, "electorial_tbl", electId);
    const electionSnap = await getDoc(electionRef);
    if (!electionSnap.exists()) {
      return NextResponse.json({ error: "Election not found" }, { status: 404 });
    }

    // Prevent duplicate names
    const electionsRef = collection(db, "electorial_tbl");
    const snapshot = await getDocs(electionsRef);
    const duplicate = snapshot.docs.find(
      doc => doc.data().election_name === election_name && doc.id !== electId
    );
    if (duplicate) {
      return NextResponse.json(
        { error: "Another election with the same name exists" },
        { status: 400 }
      );
    }

    await updateDoc(electionRef, { election_name, num_winners, idx });
    return NextResponse.json({ message: "Election updated successfully" });
  } catch (err) {
    console.error("PUT elections error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE election
export async function DELETE(req) {
  try {
    const { electId } = await req.json();
    if (!electId) {
      return NextResponse.json({ error: "Missing election ID" }, { status: 400 });
    }

    const electionRef = doc(db, "electorial_tbl", electId);
    await deleteDoc(electionRef);
    return NextResponse.json({ message: "Election deleted successfully" });
  } catch (err) {
    console.error("DELETE elections error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
