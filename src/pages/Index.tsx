
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Users, 
  BarChart,
  User,
  UserPlus
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Clock className="text-white" size={18} />
            </div>
            <span className="font-semibold text-lg">SmartShift</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="default" size="sm">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Smart Timesheet System
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            A modern solution for tracking time, managing shifts, and processing payroll
            for part-time promoters.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                <UserPlus size={18} className="mr-2" />
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <User size={18} className="mr-2" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 bg-card/50">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Clock size={24} />} 
              title="Time Tracking" 
              description="Clock in and out with GPS verification for location accuracy"
            />
            <FeatureCard 
              icon={<Calendar size={24} />} 
              title="Shift Management" 
              description="Create, assign and manage shifts with ease"
            />
            <FeatureCard 
              icon={<Users size={24} />} 
              title="User Roles" 
              description="Role-based access for promoters and administrators"
            />
            <FeatureCard 
              icon={<BarChart size={24} />} 
              title="Reporting" 
              description="Generate reports on attendance and payroll"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Join the growing number of companies that use our smart timesheet system to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup">
              <Button size="lg">
                <UserPlus size={18} className="mr-2" />
                Create Account
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                <User size={18} className="mr-2" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card/50">
        <div className="container px-4 text-center text-muted-foreground">
          <p className="mb-2">© 2023 SmartShift Tracker. All rights reserved.</p>
          <p className="text-sm">A modern timesheet solution for scheduling and payroll processing.</p>
        </div>
      </footer>
    </div>
  );
};

// Feature card component
const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) => {
  return (
    <div className="bg-card rounded-lg border border-border p-6 hover-scale group">
      <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Index;
