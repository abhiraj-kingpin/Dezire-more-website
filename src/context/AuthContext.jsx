import { createContext, useContext, useState, useEffect } from 'react';
import { BASE } from '../hooks/useProducts';

const AuthContext = createContext();
const TOKEN_KEY = 'dezire_token';

async function parseJson(res) {
  try { return await res.json(); } catch { return {}; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Global "please log in" prompt — cart/wishlist/checkout can all trigger
  // this instead of performing a guest action, without needing to know
  // anything about how the auth modal itself is implemented.
  const [authOpen, setAuthOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState('');

  const promptLogin = (message = 'Please log in to continue') => {
    setAuthPrompt(message);
    setAuthOpen(true);
  };

  const authHeaders = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const applySession = (token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
  };

  // Restore session on app load by validating the stored token against the server.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }
    fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => { if (!res.ok) throw new Error(); return parseJson(res); })
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const signupRequestOtp = async ({ email, password, firstName, lastName, phone }) => {
    setError('');
    try {
      const res = await fetch(`${BASE}/auth/signup/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, phone }),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.error || 'Could not start sign up');
      return { success: true, ...data };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const verifySignupOtp = async (email, code) => {
    setError('');
    try {
      const res = await fetch(`${BASE}/auth/signup/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      applySession(data.token, data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const resendSignupOtp = async (email) => {
    try {
      const res = await fetch(`${BASE}/auth/signup/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.error || 'Could not resend code');
      return { success: true, ...data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        if (data.needsVerification) {
          return { success: false, needsVerification: true, email: data.email, message: data.error };
        }
        throw new Error(data.error || 'Login failed');
      }
      applySession(data.token, data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    // Cart/wishlist are in-memory only (not saved per-account server-side),
    // so clear them on logout — otherwise they'd leak into the next
    // account signed in on the same device.
    window.dispatchEvent(new CustomEvent('dm:logout'));
  };

  const updateUser = async (updates) => {
    const res = await fetch(`${BASE}/auth/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(updates),
    });
    const data = await parseJson(res);
    if (res.ok) setUser(data.user);
    return { success: res.ok, ...data };
  };

  const addAddress = async (address) => {
    const res = await fetch(`${BASE}/auth/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(address),
    });
    const data = await parseJson(res);
    if (res.ok) setUser(u => ({ ...u, addresses: data.addresses }));
    return { success: res.ok, ...data };
  };

  const updateAddress = async (id, address) => {
    const res = await fetch(`${BASE}/auth/addresses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(address),
    });
    const data = await parseJson(res);
    if (res.ok) setUser(u => ({ ...u, addresses: data.addresses }));
    return { success: res.ok, ...data };
  };

  const deleteAddress = async (id) => {
    const res = await fetch(`${BASE}/auth/addresses/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await parseJson(res);
    if (res.ok) setUser(u => ({ ...u, addresses: data.addresses }));
    return { success: res.ok, ...data };
  };

  const subscribeMembership = async (tier) => {
    const res = await fetch(`${BASE}/auth/membership/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ tier }),
    });
    const data = await parseJson(res);
    if (res.ok) setUser(u => ({ ...u, membership: data.membership }));
    return { success: res.ok, ...data };
  };

  return (
    <AuthContext.Provider value={{
      user, loading, error, setError,
      signupRequestOtp, verifySignupOtp, resendSignupOtp, login, logout, updateUser,
      addAddress, updateAddress, deleteAddress, subscribeMembership,
      authOpen, setAuthOpen, authPrompt, promptLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
