// app/api/votehistory/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year"), 10);
    const voterId = searchParams.get("voterId");

    if (isNaN(year) || !voterId) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing year/voterId" },
        { status: 400 }
      );
    }

    // ✅ Query votedetails collection
    const voteQuery = query(
      collection(db, "votedetails"),
      where("voterId", "==", voterId),
      where("year", "==", year)
    );
    const voteSnap = await getDocs(voteQuery);

    const data = [];

    for (const voteDoc of voteSnap.docs) {
      const vote = voteDoc.data();

      // Fetch voter details
      const popRef = collection(db, "population");
      const popQuery = query(popRef, where("reqId", "==", vote.popId));
      const popSnap = await getDocs(popQuery);

      const popData = popSnap.docs[0]?.data() || {};

      data.push({
        elect_name: vote.elect_name,
        monthdate: vote.monthdate,
        firstname: popData.firstname || "",
        lastname: popData.lastname || "",
        photo: popData.photo || null, // base64 stored directly in Firestore
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching Votes:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
