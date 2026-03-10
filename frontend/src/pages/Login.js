import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { AuthContext } from '../contexts/AuthContext';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username.trim(), password);
            setUser(true);
            navigate('/');
        } catch (err) {
            setError('Login failed. Check credentials and try again.');
            setLoading(false);
        }
    };

    const container = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', fontFamily: 'Inter, system-ui, Arial' };
    const card = { width: 360, padding: 24, borderRadius: 8, boxShadow: '0 6px 18px rgba(15,23,42,0.08)', background: '#fff' };
    const title = { margin: 0, marginBottom: 12, fontSize: 20, color: '#0b74de' };
    const label = { display: 'block', fontSize: 13, marginBottom: 6, color: '#333' };
    const input = { width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 12, fontSize: 14 };
    const row = { display: 'flex', gap: 8, alignItems: 'center' };
    const btn = { width: '100%', padding: '10px 12px', background: '#0b74de', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 };
    const btnDisabled = { ...btn, opacity: 0.6, cursor: 'not-allowed' };
    const small = { fontSize: 13, color: '#6b7280' };
    const errorStyle = { marginTop: 8, color: '#dc2626', fontSize: 13 };

    return (
        <div style={container}>
            <form style={card} onSubmit={handleSubmit} aria-labelledby="login-heading">
                <h2 id="login-heading" style={title}>Sign in</h2>

                <label style={label} htmlFor="username">Username</label>
                <input
                    id="username"
                    style={input}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your-username"
                    autoComplete="username"
                    required
                />

                <label style={label} htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                    <input
                        id="password"
                        style={{ ...input, paddingRight: 90 }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                    />
                    <div style={{ position: 'absolute', right: 10, top: 8 }}>
                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            style={{ background: 'transparent', border: 'none', color: '#0b74de', cursor: 'pointer', padding: 6 }}
                            aria-pressed={showPassword}
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>

                {error && <div role="alert" style={errorStyle}>{error}</div>}

                <div style={{ marginTop: 12 }}>
                    <button type="submit" className={`btn btn-primary`} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={small}>No account? <a href="/signup">Create one</a></div>
                    <div style={small}><a className="btn-link" href="/forgot">Forgot?</a></div>
                </div>
            </form>
        </div>
    );
}