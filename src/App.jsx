import React, { useState } from "react";
import LoginForm from "./loginPage/LoginForm";
import SignUpForm from "./loginPage/SignUpForm";
import CalendarList from "./CalendarList";
import { isLoggedIn as hasStoredSession, logoutUser } from "./services/userService";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasStoredSession());
  const [showSignUp, setShowSignUp] = useState(false);

  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
    setShowSignUp(false);
  };

  if (isLoggedIn) {
    return <CalendarList onLogout={handleLogout} />;
  }

  return (
    <>
      {showSignUp ? (
        <SignUpForm onSignUpSuccess={() => setShowSignUp(false)} onCancel={() => setShowSignUp(false)} />
      ) : (
        <LoginForm
          onLoginSuccess={() => setIsLoggedIn(true)}
          onShowSignUp={() => setShowSignUp(true)}
        />
      )}
    </>
  );
}

export default App;
