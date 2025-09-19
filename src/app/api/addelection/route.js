import { NextResponse } from "next/server";
import {
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✅ GET all elections
export async function GET() {
  try {
    const q = query(collection(db, "electorial_tbl"), orderBy("idx"));
    const snapshot = await getDocs(q);

    const elections = snapshot.docs.map((docSnap) => ({
      electId: docSnap.id,
      ...docSnap.data(),
    }));

    return NextResponse.json(elections, { status: 200 });
  } catch (err) {
    console.error("GET elections error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ POST new election
export async function POST(req) {
  try {
    const { election_name, num_winners, createddate, idx } = await req.json();
    if (!election_name || !num_winners) {
      return NextResponse.json(
        { error: "Election name and number of winners required" },
        { status: 400 }
      );
    }

    // Check for existing election with same name
    const snapshot = await getDocs(collection(db, "electorial_tbl"));
    const existing = snapshot.docs.find(
      (d) => d.data().election_name === election_name
    );

    if (existing) {
      const electionRef = doc(db, "electorial_tbl", existing.id);
      await updateDoc(electionRef, { num_winners, idx });
      return NextResponse.json({
        message: "Election updated silently",
        electId: existing.id,
      });
    }

    const newElectID = `2025-${Date.now()}`;
    const electionRef = doc(db, "electorial_tbl", newElectID);

    await setDoc(electionRef, {
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

// ✅ PUT election
export async function PUT(req) {
  try {
    const { electId, election_name, num_winners, idx } = await req.json();
    if (!electId || !election_name || !num_winners) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const electionRef = doc(db, "electorial_tbl", electId);
    const snap = await getDoc(electionRef);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Election not found" }, { status: 404 });
    }

    // Check duplicate election name
    const snapshot = await getDocs(collection(db, "electorial_tbl"));
    const duplicate = snapshot.docs.find(
      (d) => d.data().election_name === election_name && d.id !== electId
    );
    if (duplicate) {
      return NextResponse.json({ error: "Duplicate election name" }, { status: 400 });
    }

    // Allow updating status if provided

    await updateDoc(electionRef, updateData);

    return NextResponse.json({ message: "Election updated successfully" });
  } catch (err) {
    console.error("PUT elections error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ DELETE election
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
