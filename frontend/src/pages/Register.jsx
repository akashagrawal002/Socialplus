import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useStore';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password)
      return toast.error('Please fill in all fields.');
    if (form.password.length < 8)
      return toast.error('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await register(form.email, form.password, form.full_name);
      toast.success('Account created! Welcome to SocialPulse 🚀');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-syne font-extrabold text-3xl bg-gradient-to-r from-accent to-accent3
                          bg-clip-text text-transparent mb-1">
            SocialPulse<span className="text-accent2">AI</span>
          </div>
          <p className="text-text2 text-sm">Create your free account</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="input-group">
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                placeholder="Rahul Sharma"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>

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
                placeholder="Min. 8 characters"
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
                  Creating account...
                </span>
              ) : 'Get Started Free →'}
            </button>
          </form>

          <p className="text-center text-sm text-text2 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center text-xs text-text3">
          ✦ 50 free AI credits · No credit card needed · Cancel anytime
        </div>
      </div>
    </div>
  );
}
