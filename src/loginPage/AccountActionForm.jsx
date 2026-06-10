import { useEffect, useState } from 'react';
import {
  enrollLegacyEmail,
  forgotPassword,
  resendVerification,
  resetPassword,
  verifyEmail,
} from '../services/userService';

const titles = {
  forgot: 'Forgot Password',
  resend: 'Resend Verification',
  legacy: 'Add Email to Existing Account',
  reset: 'Reset Password',
  verify: 'Verify Email',
};

function AccountActionForm({ mode, token, onDone, onCancel }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(mode === 'verify');

  useEffect(() => {
    if (mode !== 'verify') return;
    verifyEmail(token)
      .then((result) => setMessage(result.message))
      .catch((error) => setMessage(error.response?.data?.message || 'Verification failed'))
      .finally(() => setLoading(false));
  }, [mode, token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      let result;
      if (mode === 'forgot') result = await forgotPassword(email);
      if (mode === 'resend') result = await resendVerification(email);
      if (mode === 'legacy') result = await enrollLegacyEmail(username, password, email);
      if (mode === 'reset') result = await resetPassword(token, password);
      setMessage(result.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 340, margin: 'auto', paddingTop: 100 }}>
      <h2>{titles[mode]}</h2>
      {mode === 'verify' ? (
        <p>{loading ? 'Verifying...' : message}</p>
      ) : (
        <>
          {mode === 'legacy' && (
            <input
              type="text"
              placeholder="Existing username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              disabled={loading}
            />
          )}
          {mode !== 'reset' && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading}
            />
          )}
          {(mode === 'legacy' || mode === 'reset') && (
            <input
              type="password"
              placeholder={mode === 'reset' ? 'New password' : 'Current password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
              disabled={loading}
            />
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          {message && <p>{message}</p>}
        </>
      )}
      <button type="button" onClick={() => {
        onDone?.();
        onCancel?.();
      }}>
        Back to login
      </button>
    </form>
  );
}

export default AccountActionForm;
