"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation"; // ✅ to grab reqId
import banner from "@/images/banner.jpg"; // adjust path
import { useRouter } from "next/navigation";

function VoterDashboardPageInner() {
  const [username, setUsername] = useState("");
  const [elections, setElections] = useState([]);
  const searchParams = useSearchParams();
  const reqId = searchParams.get("reqId"); // ✅ get reqId from URL
  const [isValid, setIsValid] = useState(false);
  const [checkedReqId, setCheckedReqId] = useState(false); // ✅ track if validation finished

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
    async function fetchElections() {
      try {
        const res = await fetch("/api/election");
        if (!res.ok) throw new Error("API returned status " + res.status);
        const data = await res.json();
        setElections(data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    }
    fetchElections();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
  }, []);

  // Render loading or error
  if (!checkedReqId) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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

const withReqId = (path) => `${path}?reqId=${reqId}`;
  return (
    <div className="voter-bg min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="position-fix full-width z-2">
        <header className="full-width bg-color-2 text-white py-4 px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Online Voting System –{" "}
            <span className="font-normal">Voters Panel</span>
          </h1>
          <span className="italic">Welcome {username || "Voter"}</span>
        </header>
        <aside className="flex full-width w-64">
          <ul className="voterscontainermenu flex height-fit margin-0 space-y-4 full-width flex-row justify-end items-center gap-5 p-8">
            <li className="height-fit margin-0 font-semibold cursor-pointer hover:text-blue-600">
              <a href={withReqId("/voterdashboard")}>Dashboard</a>
            </li>
            <li className="height-fit margin-0 cursor-pointer hover:text-blue-600">
              <a href={withReqId("/votemonitoring")}>Vote Monitoring</a>
            </li>
            <li className="height-fit margin-0 cursor-pointer hover:text-blue-600">
              <a href={withReqId("/votepage")}>Vote now</a>
            </li>
            <li className="height-fit margin-0 cursor-pointer hover:text-blue-600">
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

      {/* Sidebar + Body */}
      <div>
        {/* Banner */}
        <div className="banner-container">
          <Image src={banner} alt="Banner" className="w-full" />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <section
            aria-labelledby="voter-intro"
            className="bg-blur rounded-2xl p-6 md:p-10 shadow-lg max-w-3xl mx-auto my-8"
          >
            <header className="mb-4">
              <h1
                id="voter-intro"
                className="text-2xl md:text-3xl font-semibold text-gray-800"
              >
                Welcome to the Voter’s Dashboard
              </h1>
              <p className="mt-2 text-sm md:text-base text-white">
                A simple note about why this system exists.
              </p>
            </header>

            <div className="space-y-4 text-gray-700 leading-relaxed text-white">
              <p>
                We built this voting platform to make participation effortless
                and dependable. Voting should be straightforward — not stressful
                or time-consuming — so you can focus on making an informed
                choice.
              </p>

              <p>
                By bringing elections online, the goal is to reduce barriers and
                uncertainty on election day, allowing everyone to cast their
                vote with confidence from wherever they are.
              </p>

              <p>
                This dashboard is your starting point: quick to access, clear to
                use, and designed so your voice is counted without unnecessary
                hassle.
              </p>
            </div>

            <footer className="mt-6 flex items-center justify-between">
              <small className="text-xs text-green-500">
                Your vote matters — thank you for participating.
              </small>
              <a
                href={withReqId("/votepage")}
                className="ml-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Go to Ballot
              </a>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}


// ✅ Export with Suspense wrapper
export default function VoterDashboardPage() {
  return (
     <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VoterDashboardPageInner />
    </Suspense>
  );
}
