import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AdminLogin({ onLoginSuccess, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { window.history.pushState({}, '', '/admin'); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    setTimeout(() => {
      if (username === 'admin' && password === '123') { onLoginSuccess(username); setUsername(''); setPassword(''); }
      else { setError('Invalid username or password'); }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-sc-surface flex flex-col">
      <div className="bg-gradient-primary px-5 py-4 border-b border-sc-primary/20">
        <button onClick={onCancel} className="flex items-center gap-2 text-sc-on-primary/80 hover:text-sc-on-primary transition">
          <ArrowLeftIcon className="w-5 h-5" /><span>Back</span>
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-sc-container-low rounded-card p-10 elevation-3 animate-scale-in">
            <h1 className="font-display text-3xl font-bold text-sc-text mb-2 text-center animate-fade-in-up">Admin Access</h1>
            <p className="text-sc-text-muted text-center mb-8 text-sm animate-fade-in-up stagger-1">Enter your credentials to access the admin panel</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="animate-fade-in-up stagger-2">
                <label htmlFor="username" className="block text-sm font-medium text-sc-text mb-2">Username</label>
                <input id="username" type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }} placeholder="Enter username" disabled={isLoading}
                  className="w-full px-5 py-3 bg-sc-container-high rounded-2xl text-sc-text placeholder-sc-text-muted/50 border border-sc-outline/30 focus:outline-none focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral transition-all disabled:opacity-50" />
              </div>
              <div className="animate-fade-in-up stagger-3">
                <label htmlFor="password" className="block text-sm font-medium text-sc-text mb-2">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="Enter password" disabled={isLoading}
                  className="w-full px-5 py-3 bg-sc-container-high rounded-2xl text-sc-text placeholder-sc-text-muted/50 border border-sc-outline/30 focus:outline-none focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral transition-all disabled:opacity-50" />
              </div>
              {error && (<div className="bg-sc-primary-light/15 rounded-2xl p-4 border border-sc-primary/20 animate-fade-in-up"><p className="text-sc-primary text-sm">{error}</p></div>)}
              <button type="submit" disabled={isLoading || !username || !password}
                className="w-full px-5 py-3 bg-gradient-primary text-sc-on-primary font-semibold rounded-full hover-scale border border-sc-primary/20 transition-all disabled:opacity-50 animate-fade-in-up stagger-4">
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <p className="text-sc-text-muted text-xs text-center mt-8">Contact your system administrator for access.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
