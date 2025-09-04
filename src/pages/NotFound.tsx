
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Search, FileQuestion } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="border-muted shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto p-4 rounded-full bg-primary/10 mb-4">
              <FileQuestion className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Page Not Found</CardTitle>
          </CardHeader>
          
          <CardContent className="text-center pb-6">
            <p className="text-muted-foreground mb-6">
              The page you're looking for doesn't exist or has been moved.
              The URL <span className="font-mono bg-secondary/50 px-1 rounded text-xs">{location.pathname}</span> could not be found.
            </p>
            
            <div className="relative mx-auto w-full max-w-xs mb-6">
              <div className="absolute inset-y-0 left-3 flex items-center">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="h-10 w-full rounded-md border border-input bg-background px-8 py-2 text-sm text-muted-foreground">
                {location.pathname}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-3">
            <Button
              variant="default"
              className="w-full"
              asChild
            >
              <Link to="/">
                <Home size={18} className="mr-2" />
                Return to Home
              </Link>
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={18} className="mr-2" />
              Go Back
            </Button>
          </CardFooter>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()} SmartShift. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
