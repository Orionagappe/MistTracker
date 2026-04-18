import { useState } from 'react';
import { authAPI, setAuthToken } from '../api';
import '../styles/LoginPage.css';

function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    userName: '',
    accountId: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await authAPI.register(formData.userName, formData.accountId, formData.password);
      
      // Auto-login after registration
      const loginResponse = await authAPI.login(formData.accountId, formData.password);
      setAuthToken(loginResponse.data.token);
      onLogin(loginResponse.data.user);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData.accountId, formData.password);
      setAuthToken(response.data.token);
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>MistTracker</h1>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <div className="form-group">
              <label htmlFor="userName">Full Name</label>
              <input
                id="userName"
                type="text"
                name="userName"
                placeholder="John Doe"
                value={formData.userName}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="accountId">Email / Account ID</label>
            <input
              id="accountId"
              type="email"
              name="accountId"
              placeholder="user@example.com"
              value={formData.accountId}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Processing...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="toggle-auth">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setFormData({ userName: '', accountId: '', password: '', confirmPassword: '' });
                  setError('');
                }}
              >
                Login
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setFormData({ userName: '', accountId: '', password: '', confirmPassword: '' });
                  setError('');
                }}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
