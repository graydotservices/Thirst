'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError('Invalid email or password. Please try again.');
      } else if (authData.user) {
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('role, status')
          .eq('email', authData.user.email)
          .single();

        if (staffError || !staffData) {
          setError('User role not found. Please contact an administrator.');
          await supabase.auth.signOut();
        } else if (staffData.status === 'inactive') {
          setError('Your account has been deactivated.');
          await supabase.auth.signOut();
        } else {
          // Route based on role
          if (staffData.role === 'cashier') {
            router.push('/admin/billing');
          } else {
            router.push('/admin/dashboard');
          }
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0f0c29', // Fallback
        backgroundImage: 'linear-gradient(135deg, #240b36 0%, #c31432 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 24px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px #2a1b38 inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}} />
      {/* Animated Background Orbs */}
      <div 
        className="animate-float" 
        style={{ position: 'absolute', top: '10%', left: '15%', width: '40vw', height: '40vw', minWidth: 300, minHeight: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,201,93,0.4) 0%, transparent 60%)', filter: 'blur(60px)', animationDuration: '8s' }} 
      />
      <div 
        className="animate-float" 
        style={{ position: 'absolute', bottom: '5%', right: '10%', width: '50vw', height: '50vw', minWidth: 350, minHeight: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,79,138,0.5) 0%, transparent 70%)', filter: 'blur(70px)', animationDuration: '12s', animationDelay: '1s' }} 
      />
      <div 
        className="animate-float" 
        style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '60vw', height: '60vw', minWidth: 400, minHeight: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', filter: 'blur(80px)', animationDuration: '15s', animationDelay: '2s' }} 
      />

      {/* Glassmorphic Card */}
      <div
        className="animate-scale-in"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 'clamp(28px, 6vw, 40px) clamp(16px, 5vw, 32px)',
          background: 'rgba(20, 10, 20, 0.4)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo Area */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
            width: 76, height: 76, borderRadius: '50%', 
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
            marginBottom: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)' 
          }}>
            <Image src="/logo-v2.png" alt="Thirst." width={50} height={50} style={{ objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '2rem', color: 'white', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Thirst<span style={{ color: 'var(--color-gold)' }}>.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem', fontWeight: 500 }}>Admin Portal</p>
        </div>

        {/* Error */}
        {error && (
          <div className="animate-fade-in" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', color: '#fca5a5', fontSize: '0.875rem', fontWeight: 500, textAlign: 'center', backdropFilter: 'blur(4px)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', zIndex: 2 }} />
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  fontSize: '1rem',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
                onFocus={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onBlur={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', zIndex: 2 }} />
              <input
                id="admin-password"
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                style={{
                  width: '100%',
                  padding: '16px 48px 16px 48px',
                  fontSize: '1rem',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
                onFocus={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onBlur={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.9)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'color 0.2s ease', zIndex: 2 }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center', 
              padding: '16px', 
              fontSize: '1.0625rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
              boxShadow: '0 4px 15px rgba(255, 75, 43, 0.4)',
              border: 'none',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 75, 43, 0.6)'; } }}
            onMouseLeave={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 75, 43, 0.4)'; } }}
          >
            {loading ? (
              <span className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
            ) : (
              'Enter Admin Panel'
            )}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Secure Server Connection
          </p>
        </div>
      </div>
    </div>
  );
}

