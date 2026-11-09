import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetStep, setResetStep] = useState<'none' | 'request' | 'verify'>('none');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { signIn, signUp } = useAuth();
  const { siteName, logoUrl } = useSiteSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const isStaticVibesDomain = () => {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname.toLowerCase();
    return host === 'staticvibes.site' || host === 'www.staticvibes.site' || host.endsWith('.staticvibes.site');
  };

  const goToAdminPanel = async () => {
    navigate('/admin');
  };

  const goAfterAuth = async () => {
    // If admin and no explicit redirect, send to admin panel
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !searchParams.get('redirect')) {
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });
        if (isAdmin === true) {
          await goToAdminPanel();
          return;
        }
      }
    } catch (_) {}
    if (redirectTo.startsWith('/')) {
      navigate(redirectTo);
    } else {
      window.location.replace(redirectTo);
    }
  };
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
          await goAfterAuth();
        }
      } else {
        if (!fullName.trim()) {
          toast({ title: 'Full name required', description: 'Please enter your full name.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({ title: 'Registration Failed', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Account Created!', description: `Welcome to ${siteName}! You are now logged in.` });
          await goAfterAuth();
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const displayLogo = logoUrl || '/helpful-perfumes/helpful-perfumes-logo-transparent.png';

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="bg-background rounded-xl shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img src={displayLogo} alt={siteName} className="h-12 w-auto mx-auto object-contain" />
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                isLogin ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                !isLogin ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Registration
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-foreground mb-4">
              {isLogin ? 'Login' : 'Create Account'}
            </h2>

            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" required={!isLogin} />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input type="email" placeholder="Enter email / phone number" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {isLogin && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="rounded border-border" />
                <label htmlFor="remember" className="text-sm text-muted-foreground">Keep me logged in</label>
              </div>
            )}

            <Button type="submit" className="w-full btn-accent py-3" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'LOGIN NOW' : 'CREATE ACCOUNT'}
            </Button>

            {isLogin && (
              <p className="text-center">
                <button
                  type="button"
                  onClick={() => setResetStep('request')}
                  className="text-primary hover:underline text-sm"
                >
                  Forgot your password?
                </button>
              </p>
            )}
          </form>

          {/* Social sign-in */}
          <div className="mt-6">
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border" />
              <span className="mx-3 text-xs text-muted-foreground uppercase tracking-wider">or continue with</span>
              <div className="flex-grow border-t border-border" />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                const isLovableHosted = window.location.hostname.endsWith('.lovable.app');
                if (isLovableHosted) {
                  const result = await lovable.auth.signInWithOAuth('google', {
                    redirect_uri: window.location.origin,
                  });
                  if (result.error) {
                    setLoading(false);
                    toast({ title: 'Google sign-in failed', description: result.error.message, variant: 'destructive' });
                    return;
                  }
                  if (result.redirected) {
                    return;
                  }
                  await goAfterAuth();
                  return;
                }

                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}${redirectTo.startsWith('/') ? redirectTo : '/'}`,
                  },
                });
                if (error) {
                  setLoading(false);
                  toast({ title: 'Google sign-in failed', description: error.message, variant: 'destructive' });
                }
              }}
              className="w-full mt-3 flex items-center justify-center gap-2 border border-border rounded-lg py-2.5 hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.7 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.3-.4-3.5z"/></svg>
              <span className="text-sm font-medium">Continue with Google</span>
            </button>
          </div>
        </div>
      </motion.div>

      {resetStep !== 'none' && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={() => !loading && setResetStep('none')}>
          <div className="bg-background rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">
              {resetStep === 'request' ? 'Reset Password' : 'Enter OTP & New Password'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {resetStep === 'request'
                ? 'Enter your email — we will send a 6-digit code.'
                : `We sent a code to ${email}. Enter it below with your new password.`}
            </p>

            {resetStep === 'request' ? (
              <>
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-3" />
                <Button
                  className="w-full"
                  disabled={loading}
                  onClick={async () => {
                    if (!email) {
                      toast({ title: 'Enter your email', variant: 'destructive' });
                      return;
                    }
                    setLoading(true);
                    const { supabase } = await import('@/integrations/supabase/client');
                    const { error } = await supabase.functions.invoke('send-password-reset', { body: { email } });
                    setLoading(false);
                    if (error) {
                      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
                    } else {
                      toast({ title: 'Code sent!', description: 'Check your email for the 6-digit code.' });
                      setResetStep('verify');
                    }
                  }}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </>
            ) : (
              <>
                <Input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="mb-3 text-center text-2xl tracking-[0.5em] font-mono" />
                <Input type="password" placeholder="New password (min 6 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mb-3" />
                <Button
                  className="w-full"
                  disabled={loading}
                  onClick={async () => {
                    if (otp.length !== 6 || newPassword.length < 6) {
                      toast({ title: 'Invalid input', description: 'Enter 6-digit code and password (min 6 chars).', variant: 'destructive' });
                      return;
                    }
                    setLoading(true);
                    const { supabase } = await import('@/integrations/supabase/client');
                    const { error: vErr } = await supabase.auth.verifyOtp({ email, token: otp, type: 'recovery' });
                    if (vErr) {
                      setLoading(false);
                      toast({ title: 'Invalid code', description: vErr.message, variant: 'destructive' });
                      return;
                    }
                    const { error: uErr } = await supabase.auth.updateUser({ password: newPassword });
                    setLoading(false);
                    if (uErr) {
                      toast({ title: 'Failed', description: uErr.message, variant: 'destructive' });
                    } else {
                      toast({ title: 'Password reset!', description: 'You are now logged in.' });
                      setResetStep('none');
                      setOtp('');
                      setNewPassword('');
                      goAfterAuth();
                    }
                  }}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
                <button type="button" onClick={() => setResetStep('request')} className="text-xs text-muted-foreground hover:text-foreground mt-3 w-full text-center">
                  Resend code
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
