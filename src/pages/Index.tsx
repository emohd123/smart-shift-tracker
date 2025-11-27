
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
  ArrowRight,
  Building2,
  Award,
  DollarSign,
  MapPin,
  CheckCircle,
  FileCheck
} from "lucide-react";
import HowItWorks from "@/components/landing/HowItWorks";
import ForCompanies from "@/components/landing/ForCompanies";
import ForPartTimers from "@/components/landing/ForPartTimers";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 mesh-gradient">
      {/* Enhanced Header with glass morphism */}
      <header className="w-full py-4 px-4 sm:px-6 lg:px-8 border-b border-border/40 glass-card sticky top-0 z-30">
        <div className="container flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-primary-light flex items-center justify-center shadow-lg">
              <Clock className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl text-gradient">
              SmartShift
            </span>
          </motion.div>
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link to="/login">
              <Button variant="ghost" size="sm" className="gap-2 hover-lift">
                <User size={16} />
                <span className="hidden sm:inline">Login</span>
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gap-2 hover-lift shadow-lg bg-gradient-to-r from-primary to-primary-light">
                <UserPlus size={16} />
                <span className="hidden sm:inline">Sign Up</span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Enhanced Hero section with parallax effects */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="container mx-auto px-4 py-24 md:py-32 relative overflow-hidden"
      >
        {/* Background decoration with floating orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              x: [0, -50, 0],
              y: [0, 30, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{
                background: "linear-gradient(90deg, hsl(var(--foreground)), hsl(var(--primary)), hsl(var(--accent)), hsl(var(--foreground)))",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              SmartShift
            </motion.h1>
            <p className="text-2xl md:text-3xl text-gradient font-semibold mb-8">
              Track Time. Get Certified. Get Paid.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Work part-time, track every hour, and get professional certificates proving your experience.
            </p>
          </motion.div>

          {/* Benefit Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {[
              { icon: Award, label: "Work Certificates", gradient: "from-primary to-primary-light" },
              { icon: DollarSign, label: "Track Earnings", gradient: "from-accent to-accent/80" },
              { icon: MapPin, label: "GPS Verified", gradient: "from-primary to-accent" },
              { icon: CheckCircle, label: "Build Your Resume", gradient: "from-primary-light to-primary" }
            ].map((benefit, index) => (
              <motion.div
                key={benefit.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${benefit.gradient} text-white shadow-lg hover:shadow-xl transition-all hover:scale-105`}
              >
                <benefit.icon size={16} />
                <span className="text-sm font-medium">{benefit.label}</span>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/signup?role=promoter">
                <Button size="lg" className="w-full sm:w-auto group hover-lift bg-gradient-to-r from-primary to-accent text-white border-0 shadow-xl hover:shadow-2xl">
                  <UserPlus size={20} className="mr-2" />
                  I'm a Part-Timer
                  <ArrowRight size={16} className="ml-2 opacity-70 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/signup?role=company">
                <Button size="lg" variant="outline" className="w-full sm:w-auto hover-lift glass-card">
                  <Building2 size={20} className="mr-2" />
                  I'm a Company
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Mini Feature Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12"
          >
            {[
              { icon: FileCheck, label: "Get Certified", description: "Professional work certificates" },
              { icon: Clock, label: "Track Hours", description: "Every minute counts" },
              { icon: DollarSign, label: "Know Earnings", description: "Real-time pay tracking" }
            ].map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                className="flex flex-col items-center text-center p-4 glass-card rounded-xl hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white mb-3 shadow-md">
                  <feature.icon size={24} />
                </div>
                <h4 className="font-semibold mb-1">{feature.label}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Part-Timer Focused Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto"
          >
            {[
              { number: "2,000+", label: "Certificates Generated" },
              { number: "50,000+", label: "Hours Tracked" },
              { number: "₪500K+", label: "Paid to Part-Timers" }
            ].map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.5, type: "spring" }}
              >
                <div className="text-3xl font-bold text-gradient">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* For Part-Timers Section */}
      <ForPartTimers />

      {/* For Companies Section */}
      <ForCompanies />

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
      <footer className="py-16 border-t border-border bg-card/50">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8"
          >
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-primary-light flex items-center justify-center shadow-lg">
                  <Clock className="text-white" size={20} />
                </div>
                <span className="font-bold text-xl text-gradient">SmartShift</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete workforce management for companies and part-timers with GPS-verified tracking and automated payroll.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#for-companies" className="hover:text-primary transition-colors">For Companies</a></li>
                <li><a href="#for-part-timers" className="hover:text-primary transition-colors">For Part-Timers</a></li>
                <li><Link to="/login" className="hover:text-primary transition-colors">Sign In</Link></li>
                <li><Link to="/signup" className="hover:text-primary transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>GPS-Verified Time Tracking</li>
                <li>Unique Promoter Code System</li>
                <li>Multi-Day Shift Support</li>
                <li>Work Certificate Generation</li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center pt-8 border-t border-border/50"
          >
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SmartShift Tracker. All rights reserved.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

// Enhanced Feature card component with 3D effects
const FeatureCard = ({ icon, title, description, variants, gradient }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  variants?: any;
  gradient?: string;
}) => {
  return (
    <motion.div 
      variants={variants}
      className="group relative"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass-card rounded-2xl border border-border/50 p-8 h-full backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:border-primary/30 relative overflow-hidden">
        {/* Gradient background on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient || 'from-primary/5 to-primary-light/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
        
        {/* Content */}
        <div className="relative z-10">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${gradient || 'from-primary to-primary-light'} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
            {icon}
          </div>
          <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
        
        {/* Shine effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer" />
        </div>
      </div>
    </motion.div>
  );
};

export default Index;
