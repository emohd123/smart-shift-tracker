
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { 
  Clock, 
  User,
  UserPlus,
  ArrowRight,
  Building2,
  Award,
  DollarSign,
  CheckCircle,
  FileCheck
} from "lucide-react";
import HowItWorks from "@/components/landing/HowItWorks";
import ForCompanies from "@/components/landing/ForCompanies";
import ForPartTimers from "@/components/landing/ForPartTimers";

// Animated Particle Component
const Particle = ({ delay = 0 }: { delay?: number }) => {
  const size = useMemo(() => Math.random() * 3 + 2, []);
  const x = useMemo(() => Math.random() * 100, []);
  const y = useMemo(() => Math.random() * 100, []);
  const duration = useMemo(() => Math.random() * 15 + 10, []);
  const xMovement = useMemo(() => Math.random() * 20 - 10, []);
  
  return (
    <motion.div
      className="absolute rounded-full bg-gradient-to-r from-primary/20 to-primary-light/20"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        willChange: 'transform, opacity',
      }}
      animate={{
        y: [0, -40, 0],
        x: [0, xMovement, 0],
        opacity: [0.2, 0.8, 0.2],
        scale: [1, 1.5, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    />
  );
};

// Animated Grid Background
const AnimatedGrid = () => {
  return (
    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(to right, currentColor 1px, transparent 1px),
          linear-gradient(to bottom, currentColor 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }}>
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: ['0% 0%', '50px 50px'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
    </div>
  );
};

const Index = () => {
  // Mobile/touch detection
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    const checkMobile = () => {
      const isMobileScreen = window.matchMedia('(max-width: 768px)').matches;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileScreen || isMobileDevice);
    };

    checkTouch();
    checkMobile();

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleResize = () => {
      checkMobile();
    };
    
    mediaQuery.addEventListener('change', handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      mediaQuery.removeEventListener('change', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mouse parallax setup (desktop only)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 200 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  const orbX2 = useMotionValue(0);
  const orbY2 = useMotionValue(0);
  const orbX2Spring = useSpring(orbX2, springConfig);
  const orbY2Spring = useSpring(orbY2, springConfig);

  // Click ripple effects
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const rippleIdRef = useRef(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isMobile || isTouch) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const xPercent = (clientX / innerWidth - 0.5) * 15;
    const yPercent = (clientY / innerHeight - 0.5) * 15;
    mouseX.set(xPercent);
    mouseY.set(yPercent);
    cursorX.set(clientX);
    cursorY.set(clientY);
    orbX2.set(xPercent * -0.5);
    orbY2.set(yPercent * -0.5);
  }, [isMobile, isTouch, mouseX, mouseY, cursorX, cursorY, orbX2, orbY2]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const rippleId = rippleIdRef.current++;
    setRipples(prev => [...prev, { x, y, id: rippleId }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 1000);
  }, []);

  useEffect(() => {
    if (isMobile || isTouch) return;
    
    let rafId: number;
    const throttledMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => handleMouseMove(e));
    };

    window.addEventListener('mousemove', throttledMove);
    return () => {
      window.removeEventListener('mousemove', throttledMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [handleMouseMove, isMobile, isTouch]);

  // Generate particles - reduced count on mobile
  const particles = useMemo(() => {
    const count = isMobile ? 30 : 50;
    return Array.from({ length: count }, (_, i) => (
      <Particle key={`particle-${i}`} delay={i * 0.1} />
    ));
  }, [isMobile]);

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
    <div 
      className={`min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 mesh-gradient relative overflow-hidden ${isMobile || isTouch ? '' : 'cursor-none'}`}
      onClick={handleClick}
    >
      {/* Animated Grid Background */}
      <AnimatedGrid />

      {/* Animated mesh gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 20%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Enhanced animated background layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orbs with parallax */}
        <motion.div 
          style={{ x, y }}
          animate={{ 
            scale: [1, 1.3, 1.2, 1],
            rotate: [0, 180, 360, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute top-20 left-10 w-[400px] h-[400px] bg-gradient-to-r from-primary/20 via-primary-light/15 to-primary/20 rounded-full blur-3xl"
        />
        <motion.div 
          style={{ 
            x: orbX2Spring, 
            y: orbY2Spring
          }}
          animate={{ 
            scale: [1, 1.4, 1.3, 1],
            rotate: [0, -180, -360, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute bottom-20 right-10 w-[450px] h-[450px] bg-gradient-to-r from-violet-500/20 via-purple-500/15 to-violet-500/20 rounded-full blur-3xl"
        />
        
        {/* Medium orbs */}
        <motion.div 
          animate={{ 
            x: [0, 60, -30, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.3, 1.2, 1],
            rotate: [0, 120, 240, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-gradient-to-r from-primary-light/15 to-primary/15 rounded-full blur-2xl"
        />
        <motion.div 
          animate={{ 
            x: [0, -70, 35, 0],
            y: [0, 50, -25, 0],
            scale: [1, 1.35, 1.25, 1],
            rotate: [0, -120, -240, 0]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute bottom-1/4 left-1/4 w-[320px] h-[320px] bg-gradient-to-r from-violet-500/15 to-purple-500/15 rounded-full blur-2xl"
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles}
      </div>

      {/* Cursor glow effect - desktop only */}
      {!isMobile && !isTouch && (
        <motion.div
          className="fixed pointer-events-none z-50"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
          }}
          initial={{ left: 0, top: 0 }}
        >
          <motion.div
            className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/30 to-primary-light/30 blur-xl"
            style={{
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}

      {/* Click ripples */}
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          className="absolute pointer-events-none rounded-full border-2 border-primary/40"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ width: 0, height: 0, opacity: 0.6 }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
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
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                y: [0, -5, 0]
              }}
              transition={{ 
                backgroundPosition: { duration: 5, repeat: Infinity, ease: "linear" },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              style={{
                background: "linear-gradient(90deg, hsl(var(--foreground)), hsl(var(--primary)), hsl(var(--primary-light)), hsl(var(--foreground)))",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              SmartShift
            </motion.h1>
            <motion.p 
              className="text-2xl md:text-3xl text-gradient font-semibold mb-8"
              animate={{ opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Track Time. Get Certified. Get Paid.
            </motion.p>
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Work part-time, track every hour, and get professional certificates proving your experience.
            </motion.p>
          </motion.div>

          {/* Enhanced Benefit Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {[
              { icon: Award, label: "Work Certificates", gradient: "from-primary to-primary-light" },
              { icon: DollarSign, label: "Track Earnings", gradient: "from-violet-500 to-purple-500" }
            ].map((benefit, index) => (
              <motion.div
                key={benefit.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`group relative flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${benefit.gradient} text-white shadow-lg overflow-hidden`}
              >
                {/* Animated gradient overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="relative z-10"
                >
                  <benefit.icon size={16} />
                </motion.div>
                <span className="text-sm font-medium relative z-10">{benefit.label}</span>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Enhanced CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
          >
            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }} 
              whileTap={{ scale: 0.95 }}
              className="group relative"
            >
              <Link to="/signup?role=promoter">
                <Button size="lg" className="w-full sm:w-auto group relative overflow-hidden bg-gradient-to-r from-primary to-primary-light text-white border-0 shadow-xl hover:shadow-2xl">
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1.5,
                      ease: "easeInOut"
                    }}
                  />
                  <UserPlus size={20} className="mr-2 relative z-10" />
                  <span className="relative z-10">I'm a Part-Timer</span>
                  <motion.div
                    className="ml-2 relative z-10"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight size={16} className="opacity-70" />
                  </motion.div>
                </Button>
              </Link>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }} 
              whileTap={{ scale: 0.95 }}
              className="group"
            >
              <Link to="/signup?role=company">
                <Button size="lg" variant="outline" className="w-full sm:w-auto hover-lift glass-card group relative overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary-light/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <Building2 size={20} className="mr-2 relative z-10" />
                  <span className="relative z-10">I'm a Company</span>
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Enhanced Mini Feature Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12"
          >
            {[
              { icon: FileCheck, label: "Get Certified", description: "Professional work certificates", gradient: "from-primary to-primary-light" },
              { icon: Clock, label: "Track Hours", description: "Every minute counts", gradient: "from-violet-500 to-purple-500" },
              { icon: DollarSign, label: "Know Earnings", description: "Real-time pay tracking", gradient: "from-green-500 to-emerald-500" }
            ].map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative flex flex-col items-center text-center p-6 glass-card rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-2xl transition-all duration-500 overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                />
                
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100"
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "easeInOut"
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" />
                </motion.div>

                <motion.div 
                  className={`w-14 h-14 rounded-full bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white mb-4 shadow-lg relative z-10`}
                  whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <feature.icon size={24} />
                  </motion.div>
                </motion.div>
                <h4 className="font-semibold mb-2 relative z-10 group-hover:text-primary transition-colors">{feature.label}</h4>
                <p className="text-sm text-muted-foreground relative z-10">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced Part-Timer Focused Stats with Counter Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto"
          >
            {[
              { number: 2000, suffix: "+", label: "Certificates Generated", icon: Award },
              { number: 50000, suffix: "+", label: "Hours Tracked", icon: Clock },
              { number: 500, suffix: "K+", label: "Paid to Part-Timers", prefix: "₪", icon: DollarSign }
            ].map((stat, index) => (
              <StatCard 
                key={index}
                number={stat.number}
                suffix={stat.suffix}
                prefix={stat.prefix}
                label={stat.label}
                icon={stat.icon}
                delay={index * 0.1}
              />
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works Section with enhanced transitions */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
      >
        <HowItWorks />
      </motion.div>

      {/* For Part-Timers Section with enhanced transitions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
      >
        <ForPartTimers />
      </motion.div>

      {/* For Companies Section with enhanced transitions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
      >
        <ForCompanies />
      </motion.div>

      {/* Enhanced CTA Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 py-20 relative"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p 
            className="text-muted-foreground mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Join the growing number of companies that use our smart timesheet system to streamline their operations.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto group relative overflow-hidden bg-gradient-to-r from-primary to-primary-light text-white shadow-xl hover:shadow-2xl">
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1.5,
                      ease: "easeInOut"
                    }}
                  />
                  <UserPlus size={18} className="mr-2 relative z-10" />
                  <span className="relative z-10">Create Account</span>
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto hover-lift glass-card group relative overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary-light/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <User size={18} className="mr-2 relative z-10" />
                  <span className="relative z-10">Sign In</span>
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Enhanced Footer with animations */}
      <footer className="py-16 border-t border-border bg-card/50 relative overflow-hidden">
        {/* Footer background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="container px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8"
          >
            {/* Brand */}
            <div>
              <motion.div 
                className="flex items-center gap-3 mb-4"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-primary-light flex items-center justify-center shadow-lg"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="text-white" size={20} />
                </motion.div>
                <span className="font-bold text-xl text-gradient">SmartShift</span>
              </motion.div>
              <p className="text-sm text-muted-foreground">
                Complete workforce management for companies and part-timers with GPS-verified tracking and automated payroll.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  { href: "#for-companies", label: "For Companies", isLink: false },
                  { href: "#for-part-timers", label: "For Part-Timers", isLink: false },
                  { href: "/login", label: "Sign In", isLink: true },
                  { href: "/signup", label: "Get Started", isLink: true }
                ].map((item, index) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    {item.isLink ? (
                      <Link to={item.href} className="hover:text-primary transition-colors flex items-center gap-2 group">
                        <span>{item.label}</span>
                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      <a href={item.href} className="hover:text-primary transition-colors flex items-center gap-2 group">
                        <span>{item.label}</span>
                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "GPS-Verified Time Tracking",
                  "Unique Promoter Code System",
                  "Multi-Day Shift Support",
                  "Work Certificate Generation"
                ].map((feature, index) => (
                  <motion.li
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 group"
                    whileHover={{ x: 5 }}
                  >
                    <CheckCircle size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>{feature}</span>
                  </motion.li>
                ))}
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

// Stat Card Component with Counter Animation
const StatCard = ({ 
  number, 
  suffix, 
  prefix = "", 
  label, 
  icon: Icon, 
  delay = 0 
}: { 
  number: number;
  suffix: string;
  prefix?: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  delay?: number;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = number / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= number) {
        setCount(number);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible, number]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      const kValue = num / 1000;
      // For numbers >= 10000, show whole number (e.g., 50K), otherwise show whole number if divisible, else 1 decimal
      if (kValue >= 10) {
        return Math.floor(kValue).toString() + 'K';
      }
      // If it's a whole number (e.g., 2.0), show without decimal
      return kValue % 1 === 0 ? Math.floor(kValue).toString() + 'K' : kValue.toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <motion.div 
      ref={ref}
      className="text-center group"
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, type: "spring" }}
      whileHover={{ scale: 1.05, y: -5 }}
    >
      <motion.div
        className="flex items-center justify-center mb-2"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-primary-light/20 flex items-center justify-center">
          <Icon size={20} className="text-primary" />
        </div>
      </motion.div>
      <motion.div 
        className="text-3xl md:text-4xl font-bold mb-2"
        animate={{ 
          scale: isVisible ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 0.5, delay }}
      >
        <span 
          className="bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent"
          style={{
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {prefix}{formatNumber(count)}{suffix}
        </span>
      </motion.div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
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
