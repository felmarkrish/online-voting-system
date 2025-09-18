"use client";

import React, { useEffect, useState } from "react";

export default function AddPopulationPage() {
  const [photo, setPhoto] = useState(null);
  const [currentTime, setCurrentTime] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [age, setAge] = useState("");
  const [contact, setContact] = useState("");
  const [gender, setGender] = useState("");
  const [residence, setResidence] = useState("");
  const [requestdate, setRequestdate] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [userpass, setPassword] = useState("");
  const [role, setRole] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/addpopulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname,
          lastname,
          age,
          contact,
          gender,
          email,
          residence,
          requestdate,
          username,
          userpass,
          role,
          photo,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(data.message || "Request saved successfully!");
        // Clear form after success
        setFirstname("");
        setLastname("");
        setAge("");
        setContact("");
        setGender("");
        setResidence("");
        setUsername("");
        setEmail("");
        setPassword("");
        setRole("");
        setPhoto(null);
      } else {
        alert(data.message || "Failed to save request. Please try again.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("An error occurred. Please try again later.");
    }
  };

 const startCamera = () => {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      const video = document.getElementById("video");
      video.srcObject = stream;

      // Wait for video metadata to load to get real dimensions
      video.onloadedmetadata = () => {
        video.play();
      };
    })
    .catch(err => console.error("Camera error:", err));
};

const capturePhoto = () => {
  const video = document.getElementById("video");

  // Make sure video dimensions are ready
  if (!video.videoWidth || !video.videoHeight) {
    console.error("Video not ready yet!");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;  // actual video width
  canvas.height = video.videoHeight; // actual video height
  const ctx = canvas.getContext("2d");

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/png");
  setPhoto(dataUrl);
};

  // Update current time
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
      setRequestdate(formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="voter-bg min-h-screen flex flex-col">
      <header className="bg-color-3 text-white py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Online Voting System – <span className="font-normal">User Panel</span>
        </h1>
        <div>{currentTime}</div>
      </header>

      <div className="">
        <aside>
          <ul className="space-y-4">
            <li
              className="text-right cursor-pointer hover:text-red-600"
              onClick={() => {
                localStorage.removeItem("username");
                window.location.href = "/login";
              }}
            >
              Close
            </li>
          </ul>
        </aside>

        <main className="flex-1 p-8">

          <div className="big-paadding-1 flex-col items-center justify-center p-6">
            <h1 className="text-2xl font-bold mb-6">REQUEST FORM</h1>

            <form
              onSubmit={handleSubmit}
              className="flex-wrap-wrap gap-20 flex p-6 rounded bg-blur w-full"
            >
              {/* Capture Photo */}
              <div className="flex flex-col items-center full-width justify-center mb-4">
                <label className="block mb-2 font-medium">Capture Photo</label>

                {!photo && (
                  <video id="video" autoPlay className="w-64 h-48 border mb-2 object-cover"></video>
                )}
                {photo && (
                  <img src={photo} alt="Captured" className="w-64 h-48 mt-2 border" />
                )}

                <div className="flex space-x-2 mt-2">
                  {!photo && (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Start Camera
                    </button>
                  )}

                  {!photo && (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      Capture
                    </button>
                  )}

                  {photo && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        startCamera();
                      }}
                      className="bg-yellow-500 text-white px-3 py-1 rounded"
                    >
                      Recapture
                    </button>
                  )}
                </div>
              </div>

              {/* Firstname */}
              <div className="textcontainer pad-right-100">
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
              <div className="textcontainer pad-right-100">
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
              <div className="textcontainer pad-right-100">
                <label htmlFor="age" className="block mb-2 font-medium">
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value))}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Enter age"
                />
              </div>

              {/* Contact */}
              <div className="textcontainer pad-right-100">
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
                      setContact(val);
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
              <div className="textcontainer pad-right-100">
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
              <div className="textcontainer pad-right-100">
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
                  <option value="Voter">Voter</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              {/* Username */}
              <div className="textcontainer pad-right-100">
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
              <div className="textcontainer pad-right-100">
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
