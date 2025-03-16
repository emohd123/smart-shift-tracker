
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Users, 
  BarChart,
  User,
  UserPlus,
  ArrowRight
} from "lucide-react";

const Index = () => {
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header with enhanced visual style */}
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8 border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Clock className="text-primary-foreground" size={20} />
            </div>
            <span className="font-semibold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              SmartShift
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <User size={16} />
                <span className="hidden sm:inline">Login</span>
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="default" size="sm" className="gap-2">
                <UserPlus size={16} />
                <span className="hidden sm:inline">Sign Up</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section with motion animations */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 py-20 md:py-28"
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
          >
            Smart Timesheet System
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-muted-foreground mb-8"
          >
            A modern solution for tracking time, managing shifts, and processing payroll
            for part-time promoters.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto group">
                <UserPlus size={18} className="mr-2" />
                Get Started
                <ArrowRight size={16} className="ml-2 opacity-70 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <User size={18} className="mr-2" />
                Sign In
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Features section with item animations */}
      <motion.section 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="py-20 bg-card/30 border-y border-border/30"
      >
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              variants={item}
              icon={<Clock size={24} />} 
              title="Time Tracking" 
              description="Clock in and out with GPS verification for location accuracy"
            />
            <FeatureCard
              variants={item}
              icon={<Calendar size={24} />} 
              title="Shift Management" 
              description="Create, assign and manage shifts with ease"
            />
            <FeatureCard
              variants={item}
              icon={<Users size={24} />} 
              title="User Roles" 
              description="Role-based access for promoters and administrators"
            />
            <FeatureCard
              variants={item}
              icon={<BarChart size={24} />} 
              title="Reporting" 
              description="Generate reports on attendance and payroll"
            />
          </div>
        </div>
      </motion.section>

      {/* CTA Section with hover effects */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 py-20"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Join the growing number of companies that use our smart timesheet system to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto hover-scale">
                <UserPlus size={18} className="mr-2" />
                Create Account
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto hover-scale">
                <User size={18} className="mr-2" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer with subtle animation */}
      <footer className="py-10 border-t border-border bg-card/50">
        <div className="container px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="mb-2 text-primary/90 font-medium">© {new Date().getFullYear()} SmartShift Tracker. All rights reserved.</p>
            <p className="text-sm text-muted-foreground">A modern timesheet solution for scheduling and payroll processing.</p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

// Enhanced Feature card component with motion
const FeatureCard = ({ icon, title, description, variants }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  variants?: any;
}) => {
  return (
    <motion.div 
      variants={variants}
      className="bg-card rounded-lg border border-border p-6 hover-scale group transition-all duration-300 hover:shadow-md hover:border-primary/20"
    >
      <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
};

export default Index;
