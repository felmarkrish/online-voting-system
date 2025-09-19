"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function ListPopulationPage() {
  // population states
  const [currentTime, setCurrentTime] = useState("");
  const [message, setMessage] = useState("");
  const [reqIdToUpdate, setReqIdToUpdate] = useState(null);
  const [population, setPopulation] = useState([]);
  

  // Pagination + search
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Population form states
  const [photo, setPhoto] = useState(null);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [age, setAge] = useState("");
  const [contact, setContact] = useState("");
  const [gender, setGender] = useState("");
  const [residence, setResidence] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [userpass, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const DB_API = "/api/listpopulation"; // ✅ relative path works in Next.js

  // Fetch Population
  const fetchlistpopultion = async () => {
    try {
      const res = await fetch(DB_API);
      const data = await res.json();
      console.log("checkdata:", data);
      const list = Array.isArray(data) ? data : data;
      if (Array.isArray(list)) setPopulation(list);
    } catch (err) {
      console.error("Fetch population error:", err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
    fetchlistpopultion();
  }, []);

  // Pagination + search filter
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

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Running datetime
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


useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
    fetchlistpopultion();
  }, []);

    // Delete population
  const handleDelete = async (reqId) => {
  if (!reqId) return;

  const result = await Swal.fire({
    title: "Are you sure?",
    text: "Do you want to decline this request?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, decline it!",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`${DB_API}?reqId=${reqId}`, { method: "DELETE" });
    const data = await res.json();

    if (res.ok && !data.error) {
      Swal.fire("Declined!", "Request declined successfully.", "success");
      fetchlistpopultion();
      clearForm();
    } else {
      Swal.fire("Error!", data.error || "Failed to decline request.", "error");
    }
  } catch (err) {
    console.error("Delete error:", err);
    Swal.fire("Error!", "An error occurred while declining. Please try again.", "error");
  }
};




 const handleVerified = async (e) => {
  e.preventDefault();

  if (!reqIdToUpdate) {
    return Swal.fire("Warning", "No record selected to verify!", "warning");
  }

  const result = await Swal.fire({
    title: "Are you sure?",
    text: "Do you want to verify this member?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, verify!",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch("/api/listpopulation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        reqId: reqIdToUpdate, 
        userstatus: "Active",
        firstname: firstname,
        lastname: lastname,
        age: age,
        contact: contact,
        gender: gender,
        email: email,
        residence: residence,
        username: username,
        userpass: userpass,
        role: role,
        photo: photo,
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      Swal.fire("Verified!", data.message || "Member verified successfully!", "success");
      fetchlistpopultion();
      clearForm();
    } else {
      Swal.fire("Error!", data.error || "Failed to verify member.", "error");
    }
  } catch (err) {
    console.error("Verify error:", err);
    Swal.fire("Error!", "An error occurred while verifying. Please try again.", "error");
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
    setUsername("");
    setPassword("");
    setEmail("");
    setReqIdToUpdate(null);
  };




  // Camera handlers (placeholder — you’ll implement)
  const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then(stream => {
        const video = document.getElementById("video");
        video.srcObject = stream;
      })
       .catch(err => Swal.fire({ icon: "error", title: "Camera error", text: err.message }));
  };

  const capturePhoto = () => {
   const video = document.getElementById("video");
 
   // Check if camera has started
   if (!video.srcObject) {
     return Swal.fire({
       icon: "warning",
       title: "Camera not started",
       text: "Please click 'Start Camera' before capturing a photo."
     });
   }
 
   if (!video.videoWidth || !video.videoHeight) {
     return Swal.fire({
       icon: "warning",
       title: "Video not ready",
       text: "Please wait for the camera to load."
     });
   }
 
   const canvas = document.createElement("canvas");
   canvas.width = video.videoWidth;
   canvas.height = video.videoHeight;
   const ctx = canvas.getContext("2d");
   ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
 
   setPhoto(canvas.toDataURL("image/png"));
 };


    // Edit form
  const handleEdit = (population) => {
    setFirstname(population.firstname);
    setLastname(population.lastname);
    setAge(population.age);
     setContact(population.contact);
    setGender(population.gender);
    setResidence(population.residence);
     setEmail(population.email);
    setPassword(population.userpass);
    setUsername(population.username);
     setRole(population.role);
     setReqIdToUpdate(population.reqId);

       // ✅ Set the photo here
  setPhoto(population.photo || null);
  };

  // Running datetime
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
    //   setCreateddate(formatted);
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="main-bg min-h-screen flex flex-col bg-gray-100">
      <header className="bg-color-2 text-white py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Online Voting System – <span className="font-normal">Admin Panel</span>
        </h1>
        <div>{currentTime}</div>
        <span className="italic">Welcome {username || "Admin"}</span>
      </header>

      <div className="flex flex- 1 verifymember">
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

        {/* Main content */}
        <main className="flex-1 p-8">
            {/* Request Form */}
          <div className="flex-col items-center justify-center">

            <form
              onSubmit={handleVerified}
              className="listpopulation flex-wrap-wrap gap-20 flex p-6 rounded shadow-md w-full"
            >
   {/* Capture Photo */}
<div className="captureclass flex flex-col items-center justify-center">
  <label className="block mb-2 font-medium">Capture Photo</label>

  {!photo && (
    <video id="video" autoPlay className="w-64 h-48 border mb-2"></video>
  )}

  {photo && (
    <img
      src={photo} // ✅ base64 string with MIME prefix
      alt="Profile"
      className="w-64 h-48 rounded border mt-2"
    />
  )}

  <div className="flex space-x-2 mt-2">
    {!photo && (
      <button type="button" onClick={startCamera} className="bg-green-500 text-white px-3 py-1 rounded">
        Start Camera
      </button>
    )}
    {!photo && (
      <button type="button" onClick={capturePhoto} className="bg-blue-500 text-white px-3 py-1 rounded">
        Capture
      </button>
    )}
    {photo && (
      <button type="button" onClick={() => { setPhoto(null); startCamera(); }} className="bg-yellow-500 text-white px-3 py-1 rounded">
        Recapture
      </button>
    )}
  </div>
</div>
              {/* Textboxes */}
              {/* Firstname */}
              <div className="textcontainer ">
                <label htmlFor="firstname" className="block mb-2 font-medium">
                  Firstname
                </label>
                <input
                  id="firstname"
                  type="text"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Enter firstname"
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
                  onChange={(e) => setLastname(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Enter lastname"
                />
              </div>

              {/* Age */}
              <div className="textcontainer ">
                <label htmlFor="age" className="block mb-2 font-medium">
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Enter age"
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
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setContact(e.target.value);
                    }}
                    className="w-full margin-0 border rounded-r mb-4"
                    placeholder="9xxxxxxxxx"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="no-border textcontainer pad-right-100">
                <label htmlFor="gender" className="block mb-2 font-medium">
                  Gender
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
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
                  onChange={(e) => setResidence(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Enter residence"
                />
              </div>

              {/* Email */}
              <div className="textcontainer ">
                <label htmlFor="email" className="block mb-2 font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Enter email"
                />
              </div>

              {/* Role */}
              <div className="no-border textcontainer pad-right-100">
                <label htmlFor="role" className="block mb-2 font-medium">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                >
                  <option value="">Select Role</option>
                  <option value="Admin">Administrator</option>
                  <option value="Voter">Voter</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              {/* Username */}
              <div className="textcontainer ">
                <label htmlFor="username" className="block mb-2 font-medium">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Enter username"
                />
              </div>

              {/* Password */}
              <div className="textcontainer ">
                <label htmlFor="password" className="block mb-2 font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={userpass}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Enter password"
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-4 w-full mt-4 justify-center">
                <button
                  type="submit"
                  className="button-pad bg-color-blue text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  Verified
                </button>
              </div>
    

            </form>
          </div>
          {/* population Table */}
          <div className="mt-8 overflow-x-auto w-full">
            <h2 className="text-xl font-semibold mb-4">All population</h2>

            {/* Search bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by ID, Firstname or Lastname..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 border rounded w-80"
              />
            </div>

            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-color-2">
                  <th className="border px-4 py-2">ID</th>
                  <th className="border px-4 py-2">First Name</th>
                  <th className="border px-4 py-2">Last Name</th>
                  <th className="border px-4 py-2">Residence</th>
                  <th className="border px-4 py-2">Status</th>
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
                      <td
                        className={`border px-4 py-2 text-white ${
                          pop.userstatus === "Active"
                            ? "bg-green-500"
                            : pop.userstatus === "Inactive"
                            ? "bg-red-500"
                            : "bg-gray-400"
                        }`}
                      >
                        {pop.userstatus}
                      </td>
                      <td className="flex justify-center border px-4 py-2 space-x-2">
                        <button
                          onClick={() => handleEdit(pop)}
                          className="bg-color-yellow text-white px-2 py-1 rounded"
                        >
                          View
                        </button>
                          <button
                          onClick={() => handleDelete(pop.reqId)}
                          className="bg-color-red text-white px-2 py-1 rounded"
                        >
                          Decline Request
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No population found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination controls */}
            <div className="flex justify-center mt-4 space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
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
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
