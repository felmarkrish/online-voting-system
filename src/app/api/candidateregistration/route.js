// app/api/data/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // adjust path if needed
import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

export async function GET() {
  try {
    // ✅ Fetch population with active users
    const populationRef = collection(db, "population");
    const usersRef = collection(db, "users");

    const populationSnapshot = await getDocs(
      query(populationRef, orderBy("createdAt", "desc"))
    );
    const usersSnapshot = await getDocs(usersRef);

    // Map users by reqId for quick lookup
    const usersMap = {};
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userstatus === "Active") {
        usersMap[data.reqId] = data;
      }
    });

    // Combine population with active users
    const populationData = populationSnapshot.docs
      .map((docSnap) => {
        const popData = docSnap.data();
        const userData = usersMap[popData.reqId];
        if (!userData) return null; // skip if no active user
        return {
          ...popData,
          username: userData.username,
          userpass: userData.userpass,
          role: userData.role,
        };
      })
      .filter(Boolean); // remove nulls

    // Fetch elections
    const electionsRef = collection(db, "electorial_tbl");
    const electionsSnapshot = await getDocs(
      query(electionsRef, orderBy("createdAt", "desc"))
    );
    const electionsData = electionsSnapshot.docs.map((doc) => doc.data());

    return NextResponse.json({
      population: populationData,
      elections: electionsData,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE population + user
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reqId = searchParams.get("reqId");

    if (!reqId) {
      return NextResponse.json({ error: "Missing population ID" }, { status: 400 });
    }

    // Delete population
    await deleteDoc(doc(db, "population", reqId));
    // Delete user
    await deleteDoc(doc(db, "users", reqId));

    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Insert or update candidate in running_candidate
export async function POST(req) {
  try {
    const { electId, candidateId } = await req.json();

    if (!electId || !candidateId) {
      return NextResponse.json(
        { error: "Missing electId or candidateId" },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    const candidateRef = doc(db, "running_candidate", `${candidateId}-${currentYear}`);
    const candidateSnap = await getDoc(candidateRef);

    if (candidateSnap.exists()) {
      // Update election for candidate
      await setDoc(candidateRef, { electId, candidateId, year: currentYear }, { merge: true });
      return NextResponse.json({
        success: true,
        message: "Candidate updated for this year!",
      });
    }

    // Insert new candidate
    await setDoc(candidateRef, { electId, candidateId, year: currentYear });

    return NextResponse.json({
      success: true,
      message: "Candidate registered successfully!",
    });
  } catch (error) {
    console.error("Insert error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
