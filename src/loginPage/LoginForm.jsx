import React, { useState } from "react";
import { loginUser } from "../services/userService";
import AuthCard from "./AuthCard";

function LoginForm({ onLoginSuccess, onShowSignUp, onForgotPassword, onResend }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const user = await loginUser(email, password);
      onLoginSuccess(user);
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <AuthCard title="Sign in" subtitle="Open your calendar and budget workspace.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-left">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </label>
        <label className="block text-left">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </label>
        <button
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {message && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}
      </form>

      <div className="mt-6 grid gap-2 text-sm">
        <button type="button" onClick={onShowSignUp} className="text-blue-700 hover:underline">
          Don't have an account? Sign up
        </button>
        <button type="button" onClick={onForgotPassword} className="text-slate-600 hover:text-blue-700">
          Forgot password
        </button>
        <button type="button" onClick={onResend} className="text-slate-600 hover:text-blue-700">
          Resend verification
        </button>
      </div>
    </AuthCard>
  );
}

export default LoginForm;
