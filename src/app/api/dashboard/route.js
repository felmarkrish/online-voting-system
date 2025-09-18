// app/api/elections/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // adjust path
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

export async function GET() {
  try {
    // ✅ Fetch all elections
    const electionsRef = collection(db, "electorial_tbl");
    const electionsSnapshot = await getDocs(query(electionsRef, orderBy("createdAt")));
    const elections = electionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // ✅ Fetch all running candidates
    const candidatesRef = collection(db, "running_candidate");
    const candidatesSnapshot = await getDocs(candidatesRef);
    const candidates = candidatesSnapshot.docs.map((doc) => doc.data());

    // ✅ Fetch population (candidate details + photo)
    const populationRef = collection(db, "population");
    const populationSnapshot = await getDocs(populationRef);
    const populationMap = {};
    populationSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      populationMap[data.reqId] = {
        ...data,
        photo: data.photo
          ? `data:image/jpeg;base64,${data.photo}` // assuming stored as base64 string
          : null,
      };
    });

    // ✅ Combine elections with participants
    const data = elections.map((el) => {
      const participants = candidates
        .filter((c) => c.electId === el.id) // match election ID
        .map((c) => {
          const popData = populationMap[c.candidateId];
          return popData
            ? {
                ...popData,
                runCandidacy: c.candidateId,
                electID: c.electId,
              }
            : null;
        })
        .filter(Boolean); // remove nulls

      return {
        id: el.id,
        name: el.election_name,
        participants,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("API GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
