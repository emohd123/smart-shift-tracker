
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginFormAlert } from "./LoginFormAlert";
import { LoginCredentials } from "./LoginCredentials";
import { LoginActions } from "./LoginActions";
import { supabase } from "@/integrations/supabase/client";

export default function LoginForm() {
  const { login, loading, authError } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);

  // Attempt to create admin user on component mount
  useEffect(() => {
    const createAdminUser = async () => {
      try {
        setIsCreatingAdmin(true);
        setFormError(null);
        
        const { data, error } = await supabase.functions.invoke('create-admin');
        
        if (error) {
          console.error('Error creating admin:', error);
          setFormError(`Failed to set up admin account: ${error.message}`);
        } else {
          console.log('Admin creation response:', data);
          setAdminCreated(true);
          
          // Auto-fill the admin credentials for convenience
          setEmail('emohd123@gmail.com');
          setPassword('password123');
        }
      } catch (err) {
        console.error('Failed to create admin user:', err);
        setFormError(`Error setting up admin: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsCreatingAdmin(false);
      }
    };

    createAdminUser();
  }, [toast]);

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

      <LoginFormAlert 
        formError={formError} 
        isCreatingAdmin={isCreatingAdmin} 
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <LoginCredentials 
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
        />

        <LoginActions 
          loading={loading} 
          isCreatingAdmin={isCreatingAdmin} 
        />
      </form>
    </div>
  );
}
