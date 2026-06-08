import React, { useState } from "react";
import { loginUser } from "../services/userService";

function LoginForm({ onLoginSuccess, onShowSignUp }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await loginUser(username, password);
      onLoginSuccess();
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 300, margin: "auto", paddingTop: 100 }}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        disabled={loading}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
      {message && <p style={{ color: "red" }}>{message}</p>}
      <button type="button" onClick={onShowSignUp} style={{ marginTop: 10 }}>
        Don't have an account? Sign Up
      </button>
    </form>
  );
}

export default LoginForm;
