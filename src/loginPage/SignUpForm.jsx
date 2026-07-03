import React, { useState } from "react";
import { registerUser } from "../services/userService";
import AuthCard from "./AuthCard";

function SignUpForm({ onSignUpSuccess, onCancel }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await registerUser(username, email, password);
      onSignUpSuccess(result.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <AuthCard title="Create account" subtitle="Set up an account to save calendars and budgets.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-left">
          <span className="text-sm font-medium text-slate-700">Username</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="block text-left">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-left">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <div className="flex gap-3">
          <button className="flex-1 rounded-md bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700" type="submit">
            Register
          </button>
          <button className="rounded-md border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
        {message && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}
      </form>
    </AuthCard>
  );
}

export default SignUpForm;
