"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function CandidateRegistrationPage() {
  // States
  const [selectedElection, setSelectedElection] = useState("");
  const [elections, setElections] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [reqIdToUpdate, setReqIdToUpdate] = useState(null);
  const [population, setPopulation] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [photo, setPhoto] = useState(null);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [age, setAge] = useState("");
  const [contact, setContact] = useState("");
  const [gender, setGender] = useState("");
  const [residence, setResidence] = useState("");
  const [username, setUsername] = useState("");

  const DB_API = "/api/candidateregistration";

  // Fetch elections and population
  const fetchElections = async () => {
    try {
      const res = await fetch(DB_API);
      const data = await res.json();
      if (Array.isArray(data.elections)) setElections(data.elections);
    } catch (err) {
      console.error("Error fetching elections:", err);
      Swal.fire({ icon: "error", title: "Failed to fetch elections" });
    }
  };

  const fetchPopulation = async () => {
    try {
      const res = await fetch(DB_API);
      const data = await res.json();
      if (Array.isArray(data.population)) setPopulation(data.population);
    } catch (err) {
      console.error("Fetch population error:", err);
      Swal.fire({ icon: "error", title: "Failed to fetch population" });
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
    fetchElections();
    fetchPopulation();
  }, []);

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
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Register Candidate
  const sethandleRegisterCandidate = async (e) => {
    e.preventDefault();

    if (!selectedElection || !reqIdToUpdate) {
      Swal.fire({
        icon: "warning",
        title: "Please select an election and candidate first!",
      });
      return;
    }

    try {
      const res = await fetch(DB_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          electId: selectedElection,
          candidateId: reqIdToUpdate,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire({ icon: "success", title: data.message });
        fetchPopulation();
        clearForm();
      } else {
        Swal.fire({ icon: "error", title: data.error || "Registration failed" });
      }
    } catch (err) {
      console.error("Register error:", err);
      Swal.fire({ icon: "error", title: "Network error, try again later" });
    }
  };

  const clearForm = () => {
    setFirstname("");
    setLastname("");
    setAge("");
    setContact("");
    setGender("");
    setResidence("");
    setPhoto(null);
    setReqIdToUpdate(null);
    setSelectedElection("");
  };

  // Edit candidate
  const handleEdit = (pop) => {
    setFirstname(pop.firstname);
    setLastname(pop.lastname);
    setAge(pop.age);
    setContact(pop.contact);
    setGender(pop.gender);
    setResidence(pop.residence);
    setUsername(pop.username);
    setReqIdToUpdate(pop.reqId);
    setPhoto(pop.photo || null);
  };

  // Filter + Pagination
  const filteredPopulation = population.filter(
    (pop) =>
      pop.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pop.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pop.reqId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPopulation.length / itemsPerPage);
  const paginatedPopulation = filteredPopulation.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="main-bg min-h-screen flex flex-col bg-gray-100">
      <header className="bg-color-2 text-white py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Online Voting System –{" "}
          <span className="font-normal">Admin Panel</span>
        </h1>
        <div>{currentTime}</div>
        <span className="italic">Welcome {username || "Admin"}</span>
      </header>

      <div className="flex flex-1 candidateregistration">
        {/* Sidebar */}
        <aside className="bg-blurry w-64 shadow-md p-6">
          <ul className="space-y-4">
            <li className="font-semibold cursor-pointer hover:text-blue-600">
              <a href="/dashboard">Dashboard</a>
            </li>
            <li className="cursor-pointer hover:text-blue-600">
              <a href="/addelection">Add Election</a>
            </li>
            <li className="cursor-pointer hover:text-blue-600">
              <a href="/dashboard">Register Candidates</a>
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

        {/* Main content */}
        <main className="flex-1 p-8">
          {/* Request Form */}
          <div className="flex-col items-center justify-center">
            {/* (form unchanged) */}
            <form
              onSubmit={sethandleRegisterCandidate}
              className="listpopulation flex-wrap-wrap gap-20 flex p-6 rounded shadow-md w-full"
            >
              {/* Capture Photo */}
              <div className="captureclass flex flex-col items-center justify-center">
                <label className="block mb-2 font-medium">Photo</label>
                {!photo && (
                  <video
                    id="video"
                    autoPlay
                    className="w-64 h-48 border mb-2"
                  ></video>
                )}

                {photo && (
                  <img
                    src={photo} // ✅ base64 string with MIME prefix
                    alt="Profile"
                    className="w-64 h-48 rounded border mt-2"
                  />
                )}
              </div>
              <div className="textcontainer ">
                <label htmlFor="firstname" className="block mb-2 font-medium">
                  Firstname
                </label>
                <input
                  id="firstname"
                  type="text"
                  value={firstname}
                  readOnly
                  onChange={(e) => setFirstname(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                />
              </div>

              {/* Lastname */}
              <div className="textcontainer ">
                <label htmlFor="lastname" className="block mb-2 font-medium">
                  Lastname
                </label>
                <input
                  id="lastname"
                  type="text"
                  value={lastname}
                  readOnly
                  onChange={(e) => setLastname(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                />
              </div>

              {/* Age */}
              <div className="textcontainer ">
                <label htmlFor="age" className="block mb-2 font-medium">
                  Age
                </label>
                <input
                  id="age"
                  type="text"
                  value={age}
                  readOnly
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                />
              </div>

              {/* Contact */}
              <div className="textcontainer ">
                <label htmlFor="contact" className="block mb-2 font-medium">
                  Contact
                </label>
                <div className="flex">
                  <span className="inline-flex">+63:</span>
                  <input
                    id="contact"
                    type="text"
                    value={contact}
                    readOnly
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setContact(val);
                    }}
                    className="w-full margin-0 border rounded-r mb-4"
                    placeholder="9xxxxxxxxx"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="textcontainer ">
                <label htmlFor="gender" className="block mb-2 font-medium">
                  Gender
                </label>
                <input
                  id="gender"
                  type="text"
                  value={gender}
                  readOnly
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                />
              </div>
              {/* Residence */}
              <div className="textcontainer ">
                <label htmlFor="residence" className="block mb-2 font-medium">
                  Residence
                </label>
                <input
                  id="residence"
                  type="text"
                  value={residence}
                  readOnly
                  onChange={(e) => setResidence(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                />
              </div>
              <div className="no-border textcontainer">
                <label htmlFor="election" className="block mb-2 font-medium">
                  Election
                </label>
                <select
                  id="election"
                  className="w-full p-2 border rounded mb-4"
                  value={selectedElection}
                  onChange={(e) => setSelectedElection(e.target.value)}
                >
                  <option value="">-- Select Election --</option>
                  {elections.map((election) => (
                    <option key={election.id} value={election.electId}>
                      {election.election_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex space-x-4 w-full mt-4 justify-center">
                <button
                  type="submit"
                  className="button-pad bg-color-blue text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  Register
                </button>
              </div>
            </form>
          </div>

          {/* population Table */}
          <div className="mt-8 overflow-x-auto w-full">
            <h2 className="text-xl font-semibold mb-4">
              All Verified population
            </h2>

            {/* ✅ Search Bar */}
            <input
              type="text"
              placeholder="Search by ID, Firstname or Lastname..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // reset to first page on search
              }}
              className="border rounded px-3 py-2 mb-4 w-1/3"
            />

            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-color-2">
                  <th className="border px-4 py-2">ID</th>
                  <th className="border px-4 py-2">First Name</th>
                  <th className="border px-4 py-2">Last Name</th>
                  <th className="border px-4 py-2">Residence</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPopulation.length > 0 ? (
                  paginatedPopulation.map((pop, index) => (
                    <tr key={`${pop.reqId}-${index}`}>
                      <td className="border px-4 py-2">{pop.reqId}</td>
                      <td className="border px-4 py-2">{pop.firstname}</td>
                      <td className="border px-4 py-2">{pop.lastname}</td>
                      <td className="border px-4 py-2">{pop.residence}</td>
                      <td className="flex justify-center border px-4 py-2 space-x-2">
                        <button
                          onClick={() => handleEdit(pop)}
                          className="bg-color-yellow text-white px-2 py-1 rounded"
                        >
                          View Information
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No population found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* ✅ Pagination */}
            {totalPages >= 1 && (
              <div className="flex justify-center items-center mt-4 space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === i + 1 ? "bg-blue-500 text-white" : ""
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
