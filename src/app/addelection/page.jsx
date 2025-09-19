"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function AddElectionPage() {
  const [currentTime, setCurrentTime] = useState("");
  const [electionName, setElectionName] = useState("");
  const [numWinners, setNumWinners] = useState(1);
  const [electionIndex, setElectionIndex] = useState(1);
  const [dateCreated, setCreateddate] = useState("");
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [elections, setElections] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [alreadyVoteMessage, setAlreadyVoteMessage] = useState("");
  const [startStatus, setStartStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const DB_API = "/api/addelection";

  // Fetch elections
  const fetchElections = async () => {
    try {
      const res = await fetch(DB_API);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data;
      if (Array.isArray(list)) setElections(list);
    } catch (err) {
      console.error("Fetch elections error:", err);
      Swal.fire({ icon: "error", title: "Failed to fetch elections" });
    }
  };

  // Fetch startup info
  const fetchStartup = async () => {
    try {
      const res = await fetch(`/api/votestartup?year=${currentYear}`);
      const data = await res.json();

      const startupData =
        data && Object.keys(data).length > 0
          ? data
          : { year: currentYear, start: "", message: "", alreadyvotemessage: "" };

      setYear(startupData.year || currentYear);
      setMessage(startupData.message || "");
      setAlreadyVoteMessage(startupData.alreadyvotemessage || "");
      setStartStatus(startupData.start || "");
    } catch (err) {
      console.error("Fetch startup error:", err);
      Swal.fire({ icon: "error", title: "Failed to fetch startup info" });
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
    fetchElections();
    fetchStartup();
  }, []);

  // Add / Update election
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!electionName.trim() || numWinners < 1 || electionIndex < 1) {
      Swal.fire({ icon: "warning", title: "Please fill all fields correctly" });
      return;
    }

    try {
      const res = await fetch(DB_API, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          electId: editingId,
          election_name: electionName,
          num_winners: numWinners,
          createddate: dateCreated,
          idx: electionIndex,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: editingId ? "Election Updated" : "Election Saved",
        });
        setElectionName("");
        setNumWinners(1);
        setElectionIndex(1);
        setEditingId(null);
        fetchElections();
      } else {
        Swal.fire({ icon: "error", title: data.error || "Failed to save election" });
      }
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({ icon: "error", title: "Network error, try again later" });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Election?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(DB_API, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ electId: id }),
      });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Election deleted successfully" });
        fetchElections();
      } else {
        Swal.fire({ icon: "error", title: "Failed to delete election" });
      }
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({ icon: "error", title: "Network error, try again later" });
    }
  };

  const handleEdit = (election) => {
    setElectionName(election.election_name || "");
    setNumWinners(election.num_winners || 1);
    setElectionIndex(election.idx || 1);
    setEditingId(election.electId || null);
  };

  // Clock
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now);
      setCurrentTime(formatted);
      setCreateddate(formatted);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Startup election toggle
  const handleSubmitstartup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      year,
      message,
      alreadyvotemessage: alreadyVoteMessage,
      start: startStatus === "inprogress" ? "stop" : "inprogress",
    };

    try {
      const res = await fetch("/api/votestartup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: `Election ${
            payload.start === "inprogress" ? "Started" : "Stopped"
          } (${year})`,
        });
        setStartStatus(payload.start);
      } else {
        Swal.fire({ icon: "error", title: data.error || "Failed to update startup" });
      }
    } catch (err) {
      console.error("Startup error:", err);
      setLoading(false);
      Swal.fire({ icon: "error", title: "Network error, try again later" });
    }
  };

  return (
    <div className="main-bg min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-color-2 text-white py-4 px-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h1 className="text-lg sm:text-2xl font-bold text-center sm:text-left">
          Online Voting System – <span className="font-normal">Admin Panel</span>
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base">
          <span>{currentTime}</span>
          <span className="italic">Welcome {username || "Admin"}</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="bg-blurry w-full md:w-64 shadow-md p-6">
          <ul className="space-y-4 text-center md:text-left">
            <li className="font-semibold hover:text-blue-600">
              <a href="/dashboard">Dashboard</a>
            </li>
            <li className="hover:text-blue-600">
              <a href="/addelection">Add Election</a>
            </li>
            <li className="hover:text-blue-600">
              <a href="/candidateregistration">Register Candidates</a>
            </li>
            <li className="cursor-pointer hover:text-blue-600">
              <a href="/listpopulation">Verify Membership</a>
            </li>
            <li
              className="height-fit cursor-pointer hover:text-red-600"
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

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          <h1 className="text-xl font-semibold mb-6 text-center">Onboard Monitoring</h1>

          {/* Forms */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 justify-center addelection">
            {/* Add Election Form */}
            <form
              className="bg-color-3 p-6 rounded shadow-md w-full max-w-md"
              onSubmit={handleSubmit}
            >
              <h2 className="text-xl font-bold mb-6 text-center">
                {editingId ? "Edit Election" : "Add Election"}
              </h2>

              <label className="block mb-2 font-medium">Election Name</label>
              <input
                type="text"
                value={electionName}
                onChange={(e) => setElectionName(e.target.value)}
                className="w-full p-2 border rounded mb-4"
                placeholder="Enter election name"
              />

              <label className="block mb-2 font-medium">Number of Winners</label>
              <input
                type="number"
                value={numWinners}
                min={1}
                onChange={(e) =>
                  setNumWinners(e.target.value ? parseInt(e.target.value, 10) : 1)
                }
                className="w-full p-2 border rounded mb-4"
              />

              <label className="block mb-2 font-medium">Index</label>
              <input
                type="number"
                value={electionIndex}
                min={1}
                onChange={(e) =>
                  setElectionIndex(e.target.value ? parseInt(e.target.value, 10) : 1)
                }
                className="w-full p-2 border rounded mb-4"
              />

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  {editingId ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setElectionName("");
                    setNumWinners(1);
                    setElectionIndex(1);
                    setEditingId(null);
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition"
                >
                  Clear
                </button>
              </div>
            </form>

            {/* Startup Election Form */}
            <form
              className="bg-color-1 p-6 rounded shadow-md w-full max-w-md space-y-4"
              onSubmit={handleSubmitstartup}
            >
              <div>
                <label className="block font-medium mb-2">Year</label>
                <input
                  type="number"
                  value={year || currentYear}
                  readOnly
                  className="w-full p-2 border rounded cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Already Voted Message</label>
                <textarea
                  value={alreadyVoteMessage}
                  onChange={(e) => setAlreadyVoteMessage(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 rounded text-white font-semibold transition ${
                  startStatus === "inprogress"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading
                  ? "Processing..."
                  : startStatus === "inprogress"
                  ? `Stop Election (${year})`
                  : `Start Election (${year})`}
              </button>
            </form>
          </div>

          {/* Elections Table */}
          <div className="mt-8 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-4">All Elections</h2>
            <table className="min-w-full border border-gray-300 text-sm addelectiontable">
              <thead>
                <tr className="bg-color-2 text-white">
                  <th className="border px-4 py-2">ID</th>
                  <th className="border px-4 py-2">Election Name</th>
                  <th className="border px-4 py-2">Winners</th>
                  <th className="border px-4 py-2">Created Date</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {elections.length > 0 ? (
                  elections.map((el) => (
                    <tr key={el.electId} className="odd:bg-gray-30 border-b addelectionrow">
                      <td className="border px-4 py-2">{el.electId}</td>
                      <td className="border px-4 py-2">{el.election_name}</td>
                      <td className="border px-4 py-2">{el.num_winners}</td>
                      <td className="border px-4 py-2">{el.createddate}</td>
                      <td className="flex justify-center px-4 py-2 space-x-2">
                        <button
                          onClick={() => handleEdit(el)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(el.electId)}
                          className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No elections found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
