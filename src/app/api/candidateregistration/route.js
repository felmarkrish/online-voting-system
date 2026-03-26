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
    const currentYear = new Date().getFullYear();

    // 1️⃣ Fetch population
    const popSnap = await getDocs(query(collection(db, "population"), orderBy("createdAt", "desc")));

    // 2️⃣ Fetch users
    const usersSnap = await getDocs(collection(db, "users"));
    const usersMap = {};
    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.userStatus === "Active") usersMap[data.reqId] = data;
    });

    // 3️⃣ Fetch running candidates
    const candidatesSnap = await getDocs(collection(db, "running_candidate"));
    const candidatesMap = {}; // candidateId -> running candidate (current year only)
    candidatesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.year === currentYear) {   // ✅ only current year
        candidatesMap[data.candidateId] = data;
      }
    });

    // 4️⃣ Fetch elections
    const electionsSnap = await getDocs(query(collection(db, "electorial_tbl"), orderBy("createddate", "desc")));
    const electionsMap = {}; // electId -> election_name
    electionsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      electionsMap[data.electId] = data.election_name;
    });

    // 5️⃣ Merge population with candidate + election name
    const populationData = popSnap.docs
      .map((docSnap) => {
        const pop = docSnap.data();
        const user = usersMap[pop.reqId];
        if (!user) return null;

        const candidate = candidatesMap[pop.reqId]; // only current year candidates
        const electionName = candidate ? electionsMap[candidate.electId] : null;

        return {
          ...pop,
          username: user.username,
          userpass: user.userpass,
          role: user.role,
          runningCandidate: candidate || null,
          electionName: electionName || null,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ population: populationData });
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
