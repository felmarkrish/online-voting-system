import { NextResponse } from "next/server";
import {
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✅ GET population + elections
export async function GET() {
  try {
    // Population ordered by createdAt
    const popQuery = query(collection(db, "population"), orderBy("createdAt", "desc"));
    const populationSnapshot = await getDocs(popQuery);

    // Users
    const usersSnapshot = await getDocs(collection(db, "users"));
    const usersMap = {};
    usersSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // 🔑 Make sure field name matches: in your users collection it's "userStatus" (capital S)
      if (data.userStatus === "Active") {
        usersMap[data.reqId] = data;
      }
    });

    const populationData = populationSnapshot.docs
      .map((docSnap) => {
        const popData = docSnap.data();
        const userData = usersMap[popData.reqId];
        if (!userData) return null;
        return {
          ...popData,
          username: userData.username,
          userpass: userData.userpass,
          role: userData.role,
        };
      })
      .filter(Boolean);

    // Elections ordered by createdAt
    const electQuery = query(collection(db, "electorial_tbl"), orderBy("createddate", "desc"));
    const electionsSnapshot = await getDocs(electQuery);
    const electionsData = electionsSnapshot.docs.map((docSnap) => docSnap.data());

    return NextResponse.json({ population: populationData, elections: electionsData });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ✅ DELETE population + user
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reqId = searchParams.get("reqId");

    if (!reqId) {
      return NextResponse.json({ error: "Missing population ID" }, { status: 400 });
    }

    await deleteDoc(doc(db, "population", reqId));
    await deleteDoc(doc(db, "users", reqId));

    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ POST - Insert / update candidate
export async function POST(req) {
  try {
    const { electId, candidateId } = await req.json();
    if (!electId || !candidateId) {
      return NextResponse.json({ error: "Missing electId or candidateId" }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const candidateRef = doc(db, "running_candidate", `${candidateId}-${currentYear}`);
    const candidateSnap = await getDoc(candidateRef);

    await setDoc(
      candidateRef,
      { electId, candidateId, year: currentYear },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: candidateSnap.exists()
        ? "Candidate updated for this year!"
        : "Candidate registered successfully!",
    });
  } catch (error) {
    console.error("Insert error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
