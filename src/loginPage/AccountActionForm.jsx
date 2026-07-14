import { useEffect, useState } from 'react';
import {
  forgotPassword,
  resendVerification,
  resetPassword,
  verifyEmail,
} from '../services/userService';
import AuthCard from './AuthCard';

const titles = {
  forgot: 'Forgot Password',
  resend: 'Resend Verification',
  reset: 'Reset Password',
  verify: 'Verify Email',
};

function AccountActionForm({ mode, token, onDone, onCancel }) {
  const [email, setEmail] = useState('');
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
      if (mode === 'reset') result = await resetPassword(token, password);
      setMessage(result.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title={titles[mode]} subtitle="Complete this step to continue.">
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'verify' ? (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {loading ? 'Verifying...' : message}
        </p>
      ) : (
        <>
          {mode !== 'reset' && (
            <label className="block text-left">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
              />
            </label>
          )}
          {mode === 'reset' && (
            <label className="block text-left">
              <span className="text-sm font-medium text-slate-700">
                New password
              </span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                type="password"
                placeholder="New password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                disabled={loading}
              />
            </label>
          )}
          <button
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          {message && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}
        </>
      )}
      <button className="w-full text-sm text-slate-600 hover:text-blue-700" type="button" onClick={() => {
        onDone?.();
        onCancel?.();
      }}>
        Back to login
      </button>
    </form>
    </AuthCard>
  );
}

export default AccountActionForm;
