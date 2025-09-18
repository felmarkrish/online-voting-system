"use client";

import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretRight, faBars } from "@fortawesome/free-solid-svg-icons";

export default function DashboardPage() {
  const [username, setUsername] = useState("");
  const [elections, setElections] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch elections + participants
  useEffect(() => {
    async function fetchElections() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("API returned status " + res.status);
        const data = await res.json();
        setElections(data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    }
    fetchElections();
  }, []);

  // Get username from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
  }, []);

  return (
    <div className="main-bg min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-color-2 text-white py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold">
          Online Voting System –{" "}
          <span className="font-normal">Admin Panel</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="italic hidden sm:inline">
            Welcome {username || "Admin"}
          </span>
          <button
            className="sm:hidden text-white focus:outline-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FontAwesomeIcon icon={faBars} size="lg" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`bg-blurry w-64 shadow-md p-6 fixed sm:static inset-y-0 left-0 transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } sm:translate-x-0 transition-transform duration-200 ease-in-out z-20`}
        >
          <ul className="space-y-4">
            <li className="font-semibold cursor-pointer hover:text-blue-600">
              <a href="/dashboard">Dashboard</a>
            </li>
            <li className="cursor-pointer hover:text-blue-600">
              <a href="/addelection">Add Election</a>
            </li>
            <li className="cursor-pointer hover:text-blue-600">
              <a href="/candidateregistration">Register Candidates</a>
            </li>
            <li className="cursor-pointer hover:text-blue-600">
              <a href="/listpopulation">Verify Membership</a>
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

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-x-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-6">
            Onboard Monitoring
          </h2>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-color-1 p-6 rounded-lg shadow text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-medium">
                All Elections Proceeding
              </h3>
              <p className="text-2xl sm:text-3xl font-bold mt-2">
                {elections.length}
              </p>
            </div>
            <div className="bg-color-3 p-6 rounded-lg shadow text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-medium">
                Total Candidates
              </h3>
              <p className="text-2xl sm:text-3xl font-bold mt-2">
                {elections.reduce((acc, e) => acc + e.participants.length, 0)}
              </p>
            </div>
          </div>

          {/* Elections Table */}
          <div className="rounded-lg shadow overflow-x-auto">
            <h3 className="text-base sm:text-lg font-semibold px-4 sm:px-6 py-3 border-b">
              Candidate Preview
            </h3>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-color-2 text-white">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Election Name</th>
                  <th className="px-4 sm:px-6 py-3"># of Participants</th>
                </tr>
              </thead>
              <tbody>
                {elections.map((election, index) => (
                  <React.Fragment key={index}>
                    <tr className="border-b">
                      <td className="px-4 sm:px-6 py-3 flex justify-between items-center">
                        {election.name}
                        <button
                          className={`ml-2 transition-transform duration-200 ${
                            openDropdown === index ? "rotate-90" : "rotate-0"
                          }`}
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown === index ? null : index
                            )
                          }
                        >
                          <FontAwesomeIcon
                            icon={faCaretRight}
                            className="text-gray-600"
                          />
                        </button>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        {election.participants.length}
                      </td>
                    </tr>

                    {openDropdown === index && (
                      <tr>
                        <td colSpan={2} className="p-4">
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm border">
                              <thead>
                                <tr className="bg-color-2 text-white">
                                  <th className="px-4 py-2 border">Photo</th>
                                  <th className="px-4 py-2 border">First Name</th>
                                  <th className="px-4 py-2 border">Last Name</th>
                                  <th className="px-4 py-2 border">Age</th>
                                  <th className="px-4 py-2 border">
                                    Place of Residence
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {election.participants.length > 0 ? (
                                  election.participants.map((p, i) => (
                                    <tr key={i} className="border-b">
                                      <td className="px-4 py-2 border">
                                        {p.photo ? (
                                          <img
                                            src={p.photo}
                                            alt={`${p.firstname} ${p.lastname}`}
                                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                                          />
                                        ) : (
                                          <span>No Photo</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 border">
                                        {p.firstname}
                                      </td>
                                      <td className="px-4 py-2 border">
                                        {p.lastname}
                                      </td>
                                      <td className="px-4 py-2 border">{p.age}</td>
                                      <td className="px-4 py-2 border">
                                        {p.residence}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="px-4 py-2 text-center"
                                    >
                                      No participants
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
