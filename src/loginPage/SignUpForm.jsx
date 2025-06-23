import React, { useState } from "react";

function SignUpForm({ onSignUpSuccess, onCancel }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Registration successful! Please log in.");
        onSignUpSuccess();
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch {
      setMessage("Network error");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 300, margin: "auto", paddingTop: 100 }}>
      <h2>Sign Up</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Register</button>
      <button type="button" onClick={onCancel} style={{ marginLeft: 10 }}>
        Cancel
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default SignUpForm;
