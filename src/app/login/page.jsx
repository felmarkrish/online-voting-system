"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { faUser, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [userpass, setUserpass] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: userpass }),

      });

      const data = await res.json();
  
      if (res.ok && data.success) {
        localStorage.setItem("username", data.username);

        if (data.role === "Admin") {
          Swal.fire({
            icon: "success",
            title: `✅ Welcome ${data.username}`,
            showConfirmButton: true,
          }).then(() => {
            router.push("/dashboard");
          });
        } else if (data.role === "Voter" && data.userStatus === "Active") {
  Swal.fire({
    icon: "success",
    title: `✅ Welcome ${data.username}`,
    showConfirmButton: true,
  }).then(() => {
    router.push(`/voterdashboard?reqId=${data.reqId}`);
  });
} else if (data.userStatus === "Inactive") {
  Swal.fire({
    icon: "warning",
    title: "⚠️ Account not Verified",
    text: "Please contact the Administrator.",
    showConfirmButton: true,
  });
} else {
  Swal.fire({
    icon: "error",
    title: "⚠️ Unknown role",
    showConfirmButton: true,
  });
}
      } else {
        Swal.fire({
          icon: "error",
          title: "❌ Login failed",
          text: data.message || data.error || "Please try again",
          showConfirmButton: true,
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      Swal.fire({
        icon: "error",
        title: "⚠️ Server error",
        text: "Try again later",
        showConfirmButton: true,
      });
    }
  }

  return (
    <div className="frm-bg flex items-center justify-center min-h-screen">
      <div className="bg-blur w-full max-w-sm bg-white p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        <form className="space-y-6" onSubmit={handleLogin}>
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1 text-white"
            >
              Username
            </label>
            <div className="flex items-center btmborder">
              <FontAwesomeIcon icon={faUser} className="text-gray-500 mr-2" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full py-2 bg-transparent border-none text-white placeholder-gray-300 focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="userpass"
              className="block text-sm font-medium mb-1 text-white"
            >
              Password
            </label>
            <div className="flex items-center btmborder">
              <FontAwesomeIcon icon={faLock} className="text-gray-500 mr-2" />
              <input
                id="userpass"
                type={showPassword ? "text" : "password"}
                value={userpass}
                onChange={(e) => setUserpass(e.target.value)}
                placeholder="Enter password"
                className="w-full py-2 bg-transparent border-none text-white placeholder-gray-300 focus:outline-none"
              />
              {/* Toggle eye icon */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-gray-500 focus:outline-none"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="globalbtn w-full bg-white text-black border border-gray-300 px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition"
          >
            Login
          </button>
          <p className="lighttext">
            <a href="/addpopulation">Request Membership</a>
          </p>
        </form>
      </div>
    </div>
  );
}
