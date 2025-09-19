"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

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

  const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        const video = document.getElementById("video");
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
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

 const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!firstname || !lastname || !age || !contact || !gender || !residence || !email || !username || !userpass || !role) {
      return Swal.fire({ icon: "warning", title: "Please fill all fields" });
    }

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
        Swal.fire({ icon: "success", title: data.message || "Request saved successfully!" });
        // Clear form
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
        Swal.fire({ icon: "error", title: data.error || "Failed to save request" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Network error", text: err.message });
    }
  };

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

                {!photo ? (
                  <video id="video" autoPlay className="w-64 h-48 border mb-2 object-cover"></video>
                ) : (
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

              {/* Other form fields */}
              {[
                { label: "Firstname", state: firstname, set: setFirstname, type: "text" },
                { label: "Lastname", state: lastname, set: setLastname, type: "text" },
                { label: "Age", state: age, set: setAge, type: "number" },
                { label: "Contact", state: contact, set: setContact, type: "text" },
                { label: "Residence", state: residence, set: setResidence, type: "text" },
                { label: "Email", state: email, set: setEmail, type: "email" },
                { label: "Username", state: username, set: setUsername, type: "text" },
                { label: "Password", state: userpass, set: setPassword, type: "password" },
              ].map((field, idx) => (
                <div className="textcontainer pad-right-100" key={idx}>
                  <label className="block mb-2 font-medium">{field.label}</label>
                  <input
                    type={field.type}
                    value={field.state}
                    onChange={(e) => field.set(field.type === "number" ? parseInt(e.target.value) : e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                </div>
              ))}

              {/* Gender */}
              <div className="textcontainer pad-right-100">
                <label className="block mb-2 font-medium">Gender</label>
                <select
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

              {/* Role */}
              <div className="textcontainer pad-right-100">
                <label className="block mb-2 font-medium">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                >
                  <option value="">Select Role</option>
                  <option value="Voter">Voter</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              {/* Submit Button */}
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
