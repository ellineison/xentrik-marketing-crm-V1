import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, UserPlus } from 'lucide-react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const logoUrl = "/lovable-uploads/20bc55f1-9a4b-4fc9-acf0-bfef2843d250.png";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithEmail, isAuthenticated } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is already logged in and redirect if so
  useEffect(() => {
    const checkAuth = async () => {
      // First check if we have isAuthenticated flag from context
      if (isAuthenticated) {
        console.log("User already authenticated via context, redirecting to dashboard");
        navigate('/dashboard');
        return;
      }
      
      // Double-check with Supabase directly as a fallback
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log("Active session found, redirecting to dashboard");
        navigate('/dashboard');
      }
    };
    
    checkAuth();
  }, [navigate, isAuthenticated]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please enter both email and password"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      
      // After successful login, check if the user is a creator
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if the user is associated with any creator
        const { data: creatorTeamMembers } = await supabase
          .from('creator_team_members')
          .select('creator_id')
          .eq('team_member_id', user.id)
          .limit(1);
        
        // If the user is associated with a creator, store this info in localStorage
        if (creatorTeamMembers && creatorTeamMembers.length > 0) {
          localStorage.setItem('isCreator', 'true');
          localStorage.setItem('creatorId', creatorTeamMembers[0].creator_id);
        }
        
        // Fetch the user's profile data to get roles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, roles')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          localStorage.setItem('userRole', profileData.role);
          
          // Store roles array in localStorage
          if (profileData.roles && profileData.roles.length > 0) {
            localStorage.setItem('userRoles', JSON.stringify(profileData.roles));
            
            // Check if user has Creator role
            if (profileData.roles.includes('Creator')) {
              localStorage.setItem('isCreator', 'true');
            }
          }
        }
      }
      
    } catch (error) {
      // Error is already handled in the context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <div className="text-center pt-6">
            <img src={logoUrl} alt="XENTRIK MARKETING" className="h-44 mx-auto" />
          </div>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="pl-10" 
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="pl-10 pr-10" 
                    required 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute inset-y-0 right-0 flex items-center justify-center" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                variant="premium"
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="text-center">
                <Link to="/forgot-password">
                  <Button variant="link" className="text-sm">
                    Forgot password?
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-muted-foreground">Powered by Ones &amp; Zeros AI</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
