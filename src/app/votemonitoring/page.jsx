"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import banner from "@/images/banner.jpg";

function VoterMonitoringInner() {
  const [username, setUsername] = useState("");
  const [voteCounts, setVoteCounts] = useState([]);
  const [startup, setStartup] = useState({ start: "", num_winners: 1 });
  const searchParams = useSearchParams();
  const reqId = searchParams.get("reqId");
  const withReqId = (path) => `${path}?reqId=${reqId}`;
  const [isValid, setIsValid] = useState(false);
  const [checkedReqId, setCheckedReqId] = useState(false); // ✅ track if validation finishedF

   // Hooks always run
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
          setCheckedReqId(true);
        } catch (err) {
          console.error("Validation error:", err);
          setIsValid(false);
          setCheckedReqId(true);
        }
      }
  
      validateReqId();
    }, [reqId]);
  
  useEffect(() => {
    fetch(`/api/votemonitoring?reqId=${reqId}`)
      .then((res) => res.json())
      .then((data) => {
        // API should return { voteCountcandidates: [...], startup: {...} }
        setVoteCounts(data.voteCountcandidates || []);
        setStartup(data.startup || { start: "", num_winners: 1 });
        console.log("checkdata", data.voteCountcandidates);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, [reqId]);

  // Group by elect_name (memoized)
  const groupedVotes = useMemo(() => {
    return voteCounts.reduce((acc, curr) => {
      const key = curr.elect_name || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    }, {});
  }, [voteCounts]);

  // helper to get stable id
  const getStableId = (c) =>
    c.vid ?? c.popId ?? c.candidateId ?? `${c.firstname}-${c.lastname}`;

  // helper to find num_winners for an election group:
  const getNumWinnersFor = (candidates) => {
    // prefer an explicit per-row num_winners if present
    const found = candidates.find(
      (x) => x.num_winners != null && x.num_winners !== ""
    );
    if (found && !Number.isNaN(Number(found.num_winners)))
      return Number(found.num_winners);
    // fallback to startup.num_winners if available (global fallback)
    if (
      startup &&
      startup.num_winners &&
      !Number.isNaN(Number(startup.num_winners))
    ) {
      return Number(startup.num_winners);
    }
    // last fallback
    return 1;
  };

  // Get username from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
  }, []);

  // Render loading or error
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
    <div className="main-bg small-padding min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="position-fix full-width z-2">
        <header className="full-width bg-color-2 text-white py-4 px-6 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">
            Online Voting System –{" "}
            <span className="font-normal">Voters Panel</span>
          </h1>
          <span className="italic">Welcome {username || "Voter"}</span>
        </header>

        <aside className="w-full flex justify-center sm:justify-end">
          <ul className="voterscontainermenu flex flex-wrap sm:flex-row justify-center sm:justify-end items-center gap-4 sm:gap-5 p-4 sm:p-8 text-sm sm:text-base">
            <li>
              <a href={withReqId("/voterdashboard")}>Dashboard</a>
            </li>
            <li>
              <a href={withReqId("/votemonitoring")}>Vote Monitoring</a>
            </li>
            <li>
              <a href={withReqId("/votepage")}>Vote now</a>
            </li>
            <li>
              <a href={withReqId("/votehistory")}>Voting history</a>
            </li>
            <li
              className="height-fit cursor-pointer hover:text-red-600"
              onClick={async () => {
                // Call API to clear cookies
                await fetch("/api/logout", { method: "POST" });

                // Clear localStorage
                localStorage.removeItem("username");

                // Redirect to login
                window.location.href = "/login";
              }}
            >
              Logout
            </li>
          </ul>
        </aside>
      </div>

      {/* Banner */}
      <div className="banner-container">
        <Image src={banner} alt="Banner" className="w-full" />
      </div>

      {/* Main */}
      <main className="flex-1 p-4 sm:p-8">
        <div className="mx-auto text-center max-w-6xl">
          <h1 className="strongheader text-2xl sm:text-3xl font-bold mb-6 text-white">
            Vote Monitoring
          </h1>

          {voteCounts.length === 0 ? (
            <p className="text-lg text-green-800">
              No vote counts available yet.
            </p>
          ) : startup?.start === "stop" ? (
            // show winners only when startup.start is "stop"
            <div className="mt-10 text-white p-6 rounded-2xl">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 strongh2">
                Election Results
              </h2>

              {Object.entries(groupedVotes).map(([electName, candidates]) => {
                // sort highest votes first
                const sorted = candidates
                  .slice()
                  .sort((a, b) => b.totalCount - a.totalCount);

                // ✅ pull numWinners from *this election’s candidates*
                const numWinners = parseInt(sorted[0]?.numWinners || 1, 10);

                return (
                  <div key={electName} className="mb-8">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 strongh3">
                      {electName}
                    </h3>
                    <div className="flex flex-wrap justify-center gap-10">
                      {sorted.map((c, idx) => {
                        const isShow = idx < numWinners; // ✅ only winners get the class
                        return (
                          <div
                            key={`${c.electionId}-${c.popId}`}
                            className={`w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 flex flex-col items-center isHide transition-all ${
                              isShow ? "isShow" : ""
                            }`}
                          >
                            {c.photo ? (
                              <img
                                src={c.photo}
                                alt={`${c.firstname} ${c.lastname}`}
                                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover mb-3"
                              />
                            ) : (
                              <span className="text-gray-400 mb-3">
                                No Photo
                              </span>
                            )}
                            <p className="font-medium text-sm sm:text-base">
                              {c.firstname} {c.lastname}
                            </p>
                            <p className="text-green-400 text-sm sm:text-lg font-semibold">
                              Votes: {c.totalCount}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // live monitoring: show all candidates, highlight top N per election

            Object.entries(groupedVotes).map(([electName, candidates]) => {
              const sorted = candidates
                .slice()
                .sort((a, b) => b.totalCount - a.totalCount);

              return (
                <div
                  key={electName}
                  className="bg-blur mt-0 mb-6 sm:mb-8 mx-4 sm:mx-8 lg:mx-[80px] p-4 sm:p-6 rounded-2xl shadow-md text-white"
                >
                  <h1 className="strongh1 text-lg sm:text-xl font-semibold mb-6 sm:mb-[40px]">
                    {electName}
                  </h1>

                  <div className="flex flex-wrap justify-center gap-10">
                    {sorted.map((c, idx) => {
                      const isWinner = idx < c.numWinners; // ✅ use numWinners from candidate
                      return (
                        <div
                          key={`${electName}-${getStableId(c)}`}
                          className={`w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 rounded-lg flex flex-col items-center mb-4 transition-all ${
                            isWinner ? "lead" : ""
                          }`}
                        >
                          {c.photo ? (
                            <img
                              src={c.photo}
                              alt={`${c.firstname} ${c.lastname}`}
                              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover mb-3"
                            />
                          ) : (
                            <span className="text-gray-400 mb-3">No Photo</span>
                          )}
                          <p className="font-medium textcapital text-sm sm:text-base">
                            {c.firstname} {c.lastname}
                          </p>
                          <p className="text-green-400 text-sm sm:text-lg font-semibold">
                            Votes: {c.totalCount}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}


// ✅ Export with Suspense wrapper
export default function VoterMonitoringPage() {
  return (
     <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VoterMonitoringInner />
    </Suspense>
  );
}

