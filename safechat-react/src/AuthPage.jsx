// src/AuthPage.jsx
import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const api = {
    signup: (username, email, password) => fetch(`${API_BASE_URL}/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    }),
    login: (username, password) => fetch(`${API_BASE_URL}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
};

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleAuthAction = async () => {
    if (mode === 'login') {
      if (!username || !password) { alert('Please enter username and password.'); return; }
      try {
        const response = await api.login(username, password);
        const data = await response.json();
        if (response.ok) { onLogin(data.username); } else { alert(`Login failed: ${data.detail}`); }
      } catch (error) { alert('An error occurred during login. Is the backend server running?'); console.error("Login API call failed:", error); }
    } else {
      if (password !== confirmPassword) { alert('Passwords do not match!'); return; }
      if (!username || !email || !password) { alert('Please fill out all fields.'); return; }
      try {
        const response = await api.signup(username, email, password);
        const data = await response.json();
        if (response.ok) { alert('Sign up successful! Please log in.'); setMode('login'); } else { alert(`Sign up failed: ${data.detail}`); }
      } catch (error) { alert('An error occurred during sign up. Is the backend server running?'); console.error("Signup API call failed:", error); }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-sc-surface">
      <div className="w-full max-w-sm p-10 space-y-6 bg-sc-container-low rounded-card elevation-3 animate-scale-in">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl font-bold text-gradient-primary tracking-tight animate-fade-in-up">SafeChat</h1>
          <p className="text-sm text-sc-text-muted mt-2 animate-fade-in-up stagger-1">Your secure communication platform</p>
        </div>

        <h2 className="font-display text-2xl font-bold text-center text-sc-text animate-fade-in-up stagger-2">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-center text-sc-text-muted text-sm">
          {mode === 'login' ? 'Log in to continue your secure chat' : 'Join the SafeChat community today'}
        </p>

        <div className="space-y-4">
          <input type="text" placeholder="Username" value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-5 py-3.5 text-sc-text bg-sc-container-high rounded-2xl border border-sc-outline/30 focus:outline-none focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral placeholder-sc-text-muted/60 transition-all duration-200"
          />
          {mode === 'signup' && (
            <input type="email" placeholder="Email Address" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 text-sc-text bg-sc-container-high rounded-2xl border border-sc-outline/30 focus:outline-none focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral placeholder-sc-text-muted/60 transition-all duration-200"
            />
          )}
          <input type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-3.5 text-sc-text bg-sc-container-high rounded-2xl border border-sc-outline/30 focus:outline-none focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral placeholder-sc-text-muted/60 transition-all duration-200"
          />
          {mode === 'signup' && (
            <input type="password" placeholder="Confirm Password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-5 py-3.5 text-sc-text bg-sc-container-high rounded-2xl border border-sc-outline/30 focus:outline-none focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral placeholder-sc-text-muted/60 transition-all duration-200"
            />
          )}
        </div>

        <button onClick={handleAuthAction}
          className="w-full px-5 py-3.5 font-bold text-sc-on-primary bg-gradient-primary rounded-full hover-scale border border-sc-primary/20 focus:outline-none transition-all duration-200"
        >
          {mode === 'login' ? 'Login' : 'Sign Up'}
        </button>

        <p className="text-sm text-center text-sc-text-muted">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="font-semibold text-sc-primary hover:text-sc-primary-light ml-1 transition-colors">
            {mode === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}