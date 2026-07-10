import { useEffect, useState } from 'react';
import LoginForm from './loginPage/LoginForm';
import SignUpForm from './loginPage/SignUpForm';
import AccountActionForm from './loginPage/AccountActionForm';
import CalendarList from './CalendarList';
import { getSession, logoutUser } from './services/userService';
import { DEV_USER, SKIP_AUTH } from './devConfig';

function initialAuthView() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('verify')) return { mode: 'verify', token: params.get('verify') };
  if (params.get('reset')) return { mode: 'reset', token: params.get('reset') };
  return { mode: 'login', token: null };
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [authView, setAuthView] = useState(initialAuthView);

  useEffect(() => {
    if (SKIP_AUTH) {
      setUser(DEV_USER);
      setLoading(false);
      return undefined;
    }

    getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    const expireSession = () => setUser(null);
    window.addEventListener('auth:expired', expireSession);
    return () => window.removeEventListener('auth:expired', expireSession);
  }, []);

  async function handleLogout() {
    if (SKIP_AUTH) {
      setUser(null);
      setAuthView({ mode: 'login', token: null });
      return;
    }

    try {
      await logoutUser();
    } finally {
      setUser(null);
      setAuthView({ mode: 'login', token: null });
    }
  }

  function returnToLogin(message = '') {
    window.history.replaceState({}, '', window.location.pathname);
    setNotice(message);
    setAuthView({ mode: 'login', token: null });
  }

  if (loading) return <p style={{ padding: 40 }}>Loading session...</p>;
  if (user) return <CalendarList onLogout={handleLogout} />;

  if (authView.mode === 'signup') {
    return (
      <SignUpForm
        onSignUpSuccess={(message) => returnToLogin(message)}
        onCancel={() => returnToLogin()}
      />
    );
  }

  if (authView.mode !== 'login') {
    return (
      <AccountActionForm
        mode={authView.mode}
        token={authView.token}
        onDone={() => returnToLogin()}
      />
    );
  }

  return (
    <>
      {notice && <p style={{ maxWidth: 340, margin: '30px auto 0' }}>{notice}</p>}
      <LoginForm
        onLoginSuccess={setUser}
        onShowSignUp={() => setAuthView({ mode: 'signup', token: null })}
        onForgotPassword={() => setAuthView({ mode: 'forgot', token: null })}
        onResend={() => setAuthView({ mode: 'resend', token: null })}
        onLegacyAccount={() => setAuthView({ mode: 'legacy', token: null })}
      />
    </>
  );
}

export default App;
