"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import banner from "@/images/banner.jpg";
import { useSearchParams } from "next/navigation";

// ✅ Inner component that uses useSearchParams
function VoterHistoryPageInner() {
  const searchParams = useSearchParams();
  const reqId = searchParams.get("reqId"); // get reqId from URL
  const withReqId = (path) => `${path}?reqId=${reqId}`;

  const [username, setUsername] = useState("");
  const [votes, setVotes] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear()); // default = current year
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [checkedReqId, setCheckedReqId] = useState(false); // ✅ track if validation finished

  // validate reqId
  useEffect(() => {
    async function validateReqId() {
      if (!reqId) {
        setIsValid(false);
        setCheckedReqId(true);
        return;
      }

      try {
        const res = await fetch(`/api/validateReqId?reqId=${reqId}`);
        const data = await res.json();
        setIsValid(data.valid);
      } catch (err) {
        console.error("Validation error:", err);
        setIsValid(false);
      } finally {
        setCheckedReqId(true);
      }
    }

    validateReqId();
  }, [reqId]);

  // Get username from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
  }, []);

  // Fetch votes
  useEffect(() => {
    async function fetchVotes() {
      if (!reqId) return; // ✅ only fetch if reqId exists
      setLoading(true);
      try {
        const res = await fetch(
          `/api/votehistory?year=${year}&voterId=${reqId}`
        );
        if (!res.ok) throw new Error("API returned " + res.status);

        const data = await res.json();
        setVotes(data.data || []); // use data.data from your API
      } catch (err) {
        console.error("Error fetching vote history:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVotes();
  }, [year, reqId]);

  // Render checks
  if (!checkedReqId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-xl font-bold text-red-600">
          ❌ Invalid or missing URL. Please login again.
        </h1>
      </div>
    );
  }

  return (
    <div className="main-bg min-h-screen flex flex-col">
      {/* Header */}
      <div className="position-fix full-width z-2">
        <header className="full-width bg-color-2 text-white py-4 px-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Online Voting System –{" "}
            <span className="font-normal">Voters Panel</span>
          </h1>
          <span className="italic">Welcome {username || "Voter"}</span>
        </header>
        <aside className="flex full-width w-64">
          <ul className="voterscontainermenu flex height-fit margin-0 space-y-4 full-width flex-row justify-end items-center gap-5 p-8">
            <li className="font-semibold cursor-pointer hover:text-blue-600">
              <a href={withReqId("/voterdashboard")}>Dashboard</a>
            </li>
            <li className="cursor-pointer hover:text-blue-600">
              <a href={withReqId("/votemonitoring")}>Vote Monitoring</a>
            </li>
            <li className="cursor-pointer hover:text-blue-600">
              <a href={withReqId("/votepage")}>Vote now</a>
            </li>
            <li className="cursor-pointer hover:text-blue-600">
              <a href={withReqId("/votehistory")}>Voting history</a>
            </li>
            <li
              className="cursor-pointer hover:text-red-600"
              onClick={async () => {
                await fetch("/api/logout", { method: "POST" });
                localStorage.removeItem("username");
                window.location.href = "/login";
              }}
            >
              Logout
            </li>
          </ul>
        </aside>
      </div>

      {/* Banner */}
      <div>
        <div className="banner-container">
          <Image src={banner} alt="Banner" className="w-full" />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="min-h-screen p-6">
            <header className="max-w-3xl mx-auto text-center">
              <h1 className="strongheader font-bold w-full text-center">
                Vote History
              </h1>
            </header>

            {/* Year Filter */}
            <div className="mb-4 filterdateclass flex justify-center">
              <label className="mr-2 font-semibold">Filter by Year:</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="border rounded px-2 py-1"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                  (y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Vote History Table */}
            {loading ? (
              <p className="text-center">Loading...</p>
            ) : votes.length > 0 ? (
              <div className="w-full shadow rounded-lg">
                <div className="votersparentContainer flex flex-col gap-20">
                  {Object.entries(
                    votes.reduce((acc, vote) => {
                      if (!acc[vote.elect_name]) acc[vote.elect_name] = [];
                      acc[vote.elect_name].push(vote);
                      return acc;
                    }, {})
                  ).map(([electName, voteList]) => (
                    <div key={electName} className="mb-6">
                      <h1 className="text-xl font-bold mb-2 text-center strongh1">
                        {electName}
                      </h1>
                      <div className="flex items-center justify-center child-holder gap-20">
                        {voteList.map((vote, idx) => (
                          <div
                            key={idx}
                            className="flex items-center rounded p-2 gap-4 flex-col"
                          >
                            <div className="photoContainer">
                              {vote.photo ? (
                                <img
                                  src={vote.photo}
                                  alt={`${vote.firstname} ${vote.lastname}`}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-400">No Photo</span>
                              )}
                            </div>
                            <div>
                              <h2 className="font-semibold strongh3">
                                {vote.firstname} {vote.lastname}
                              </h2>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center">No votes found for {year}.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ✅ Export with Suspense wrapper
export default function VoterHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <VoterHistoryPageInner />
    </Suspense>
  );
}
