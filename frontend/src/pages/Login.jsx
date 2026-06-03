import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const login    = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields.');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-syne font-extrabold text-3xl bg-gradient-to-r from-accent to-accent3
                          bg-clip-text text-transparent mb-1">
            SocialPulse<span className="text-accent2">AI</span>
          </div>
          <p className="text-text2 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="input-group">
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="loader-dot" /><span className="loader-dot" /><span className="loader-dot" />
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-sm text-text2 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:underline font-medium">
              Create one free
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-4 text-center text-xs text-text3">
          50 free AI generations on signup · No credit card required
        </div>
      </div>
    </div>
  );
}
