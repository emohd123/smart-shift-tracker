
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

export default function LoginForm() {
  const { login, loading, authError } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // Attempt to create admin user on component mount
  useEffect(() => {
    const createAdminUser = async () => {
      try {
        setIsCreatingAdmin(true);
        const { error } = await supabase.functions.invoke('create-admin');
        if (error) {
          console.error('Error creating admin:', error);
        }
      } catch (err) {
        console.error('Failed to create admin user:', err);
      } finally {
        setIsCreatingAdmin(false);
      }
    };

    createAdminUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      console.log("Attempting login with:", email);
      await login(email, password);
      toast({
        title: "Logged in successfully",
        description: "Welcome to SmartShift",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setFormError((error as Error).message || "Invalid email or password");
      toast({
        title: "Login failed",
        description: (error as Error).message || "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
          <Clock className="text-white" size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome to SmartShift</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Sign in to manage your shifts and track time
        </p>
      </div>

      {formError && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {isCreatingAdmin && (
        <Alert className="text-sm bg-yellow-50 border-yellow-200">
          <AlertDescription>Setting up admin account...</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email or Username</Label>
          <Input
            id="email"
            type="text"
            placeholder="yourname@example.com or username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link 
              to="/forgot-password" 
              className="text-xs text-primary hover:text-primary/90"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 font-medium"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>

        <div className="text-center">
          <div className="text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
