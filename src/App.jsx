import React, { useState } from "react";
import LoginForm from "./loginPage/LoginForm";
import SignUpForm from "./loginPage/SignUpForm";  // You’ll create this
import CalendarList from "./CalendarList";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  if (isLoggedIn) {
    return <CalendarList />;
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
