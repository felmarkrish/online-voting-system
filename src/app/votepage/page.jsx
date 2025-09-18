"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";
import banner from "@/images/banner.jpg"; // adjust path

export default function VoterPage() {
  const [username, setUsername] = useState("");
  const [elections, setElections] = useState([]);
  const [selected, setSelected] = useState({});
  const [startup, setStartup] = useState(null);
  const searchParams = useSearchParams();
  const reqId = searchParams.get("reqId");
  const withReqId = (path) => `${path}?reqId=${reqId}`;
  const [isValid, setIsValid] = useState(false);
  const [checkedReqId, setCheckedReqId] = useState(false);

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
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
  }, []);

  useEffect(() => {
    fetch(`/api/election?reqId=${reqId}`)
      .then((res) => res.json())
      .then((data) => {
        setStartup(data.startup);
        setElections(data.elections);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, [reqId]);

  const handleSelect = (electId, candidateId, num_winners) => {
    setSelected((prev) => {
      const current = prev[electId] || [];
      if (current.includes(candidateId)) {
        return { ...prev, [electId]: current.filter((id) => id !== candidateId) };
      } else {
        if (current.length >= num_winners) {
          Swal.fire({
            icon: "warning",
            title: "⚠️ Limit reached",
            text: `You can only vote for ${num_winners} candidate(s).`,
          });
          return prev;
        }
        return { ...prev, [electId]: [...current, candidateId] };
      }
    });
  };

  const handleSubmit = async () => {
    if (Object.keys(selected).length === 0) {
      Swal.fire({
        icon: "info",
        title: "No votes selected",
        text: "Please select at least one candidate before submitting.",
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: "Submit Vote?",
      text: "Are you sure you want to submit your votes?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, submit",
      cancelButtonText: "Cancel",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const res = await fetch("/api/election", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reqId, selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        Swal.fire({
          icon: "error",
          title: "❌ Submission failed",
          text: data.error || "Something went wrong",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "✅ Vote submitted successfully!",
        showConfirmButton: true,
      }).then(() => window.location.reload());
    } catch (err) {
      console.error("Submit error:", err);
      Swal.fire({
        icon: "error",
        title: "⚠️ Network error",
        text: "Please try again later",
      });
    }
  };

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

  return (
    <div className="main-bg small-padding main-bg min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="position-fix full-width z-2">
        <header className="full-width bg-color-2 text-white py-4 px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Online Voting System – <span className="font-normal">Voters Panel</span>
          </h1>
          <span className="italic">Welcome {username || "Voter"}</span>
        </header>
        <aside className="flex full-width w-64 justify-end">
          <ul className="voterscontainermenu flex flex-row justify-end items-center gap-5 p-8">
            <li><a href={withReqId("/voterdashboard")}>Dashboard</a></li>
             <a href={withReqId("/votemonitoring")}>Vote Monitoring</a>
            <li><a href={withReqId("/votepage")}>Vote now</a></li>
            <li><a href={withReqId("/votehistory")}>Voting history</a></li>
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
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="strongheader text-3xl font-bold mb-6 text-white">Voting Page</h1>

          {/* Show messages based on votestartup */}
         {startup?.start === "stop" && (
  <p className="text-lg text-green-500 font-semibold">{startup.message}</p>
)}

   {startup?.start === "" && (
  <p className="text-lg text-red-600 font-semibold">Please Contact the System Administrator</p>
)}

{startup?.start === "inprogress" && startup?.alreadyVoted ? (
  <p className="text-lg text-white font-semibold">
    {startup.alreadyvotemessage}
  </p>
) : null}

          {/* Show elections only if inprogress and not already voted */}
          {startup?.start === "inprogress" && !startup?.alreadyVoted && (
            <>
              {elections.map((election) => (
                <div key={election.electId} className="bg-blur mb-8 p-6 rounded-2xl shadow-md border">
                  <h2 className="text-xl font-semibold mb-4 text-white">
                    {election.election_name}{" "}
                    <span className="text-sm text-green-900 font-semibold">
                      (Select up to {election.num_winners})
                    </span>
                  </h2>

                  <div className="space-y-3">
                    {election.candidates.map((c) => (
                      <label
                        key={c.candidateId}
                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer bg-w-hover hover:bg-gray-100"
                      >
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-white"
                          checked={(selected[election.electId] || []).includes(c.candidateId)}
                          onChange={() =>
                            handleSelect(election.electId, c.candidateId, election.num_winners)
                          }
                        />
                        <span className="text-white font-medium">
                          {c.firstname} {c.lastname}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={handleSubmit}
                className="bg-color-green px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow hover:bg-blue-700 transition"
              >
                Submit Vote
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
