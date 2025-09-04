
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
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-shimmer leading-tight">
              Smart Timesheet
              <br />
              <span className="text-gradient">System</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              A modern solution for tracking time, managing shifts, and processing payroll
              for part-time promoters. Built for efficiency and simplicity.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
          >
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto group hover-lift glass-card bg-gradient-to-r from-primary to-primary-light shadow-xl">
                <UserPlus size={20} className="mr-2" />
                Get Started Free
                <ArrowRight size={16} className="ml-2 opacity-70 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto hover-lift glass-card">
                <User size={20} className="mr-2" />
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Stats or features preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto"
          >
            {[
              { number: "500+", label: "Happy Users" },
              { number: "10k+", label: "Hours Tracked" },
              { number: "99.9%", label: "Uptime" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-gradient">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Enhanced Features section with 3D cards */}
      <motion.section 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="py-24 glass-card border-y border-border/30 relative"
      >
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your workforce efficiently and professionally
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              variants={item}
              icon={<Clock size={28} />} 
              title="Smart Time Tracking" 
              description="GPS-verified clock-in/out with location accuracy and automatic break detection"
              gradient="from-blue-500 to-blue-600"
            />
            <FeatureCard
              variants={item}
              icon={<Calendar size={28} />} 
              title="Shift Management" 
              description="Intelligent scheduling system with drag-and-drop interface and conflict detection"
              gradient="from-green-500 to-green-600"
            />
            <FeatureCard
              variants={item}
              icon={<Users size={28} />} 
              title="Role-Based Access" 
              description="Secure multi-level permissions with customizable user roles and permissions"
              gradient="from-purple-500 to-purple-600"
            />
            <FeatureCard
              variants={item}
              icon={<BarChart size={28} />} 
              title="Advanced Analytics" 
              description="Real-time reporting with data visualization and export capabilities"
              gradient="from-orange-500 to-orange-600"
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
