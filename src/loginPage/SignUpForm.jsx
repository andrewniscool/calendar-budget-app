import React, { useState } from "react";
import { registerUser } from "../services/userService";

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
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
