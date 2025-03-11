
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

interface LoginActionsProps {
  loading: boolean;
  isCreatingAdmin: boolean;
}

export function LoginActions({ loading, isCreatingAdmin }: LoginActionsProps) {
  return (
    <>
      <Button 
        type="submit" 
        className="w-full h-11 font-medium"
        disabled={loading || isCreatingAdmin}
      >
        {loading ? "Signing in..." : "Sign in"}
      </Button>
      
      <div className="flex justify-between items-center">
        <Link to="/">
          <Button variant="outline" size="sm" className="h-9">
            <Home size={16} className="mr-2" />
            Home
          </Button>
        </Link>
        <div className="text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </>
  );
}
