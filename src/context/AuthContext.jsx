import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('dezire_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      // ---- When MongoDB is ready, replace this block with real API call ----
      // const res = await fetch('http://localhost:5000/api/user/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data.message);
      // localStorage.setItem('dezire_token', data.token);
      // localStorage.setItem('dezire_user', JSON.stringify(data.user));
      // setUser(data.user);
      // -----------------------------------------------------------------------

      // MOCK login for now (works without MongoDB)
      if (!email || !password) throw new Error('Please fill all fields');
      if (password.length < 6) throw new Error('Password must be at least 6 characters');

      const mockUser = {
        id: 'user_' + Date.now(),
        firstName: email.split('@')[0],
        lastName: '',
        email: email,
        phone: '',
      };
      localStorage.setItem('dezire_user', JSON.stringify(mockUser));
      localStorage.setItem('dezire_token', 'mock_token_' + Date.now());
      setUser(mockUser);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (firstName, lastName, email, phone, password, address = null) => {
    setLoading(true);
    setError('');
    try {
      // ---- When MongoDB is ready, replace this block with real API call ----
      // const res = await fetch('http://localhost:5000/api/user/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ firstName, lastName, email, phone, password })
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data.message);
      // localStorage.setItem('dezire_token', data.token);
      // localStorage.setItem('dezire_user', JSON.stringify(data.user));
      // setUser(data.user);
      // -----------------------------------------------------------------------

      // MOCK signup for now (works without MongoDB)
      if (!firstName || !email || !password) throw new Error('Please fill all required fields');
      if (password.length < 8) throw new Error('Password must be at least 8 characters');

      const mockUser = {
        id: 'user_' + Date.now(),
        firstName,
        lastName,
        email,
        phone,
        address: address && (address.line1 || address.city || address.state || address.pin)
          ? address
          : null,
      };
      localStorage.setItem('dezire_user', JSON.stringify(mockUser));
      localStorage.setItem('dezire_token', 'mock_token_' + Date.now());
      setUser(mockUser);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('dezire_user');
    localStorage.removeItem('dezire_token');
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('dezire_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, updateUser, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}