import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Award,
  DollarSign,
  Star,
  Circle,
} from "lucide-react";

// Animated Particle Component with varying sizes and patterns
const Particle = ({ delay = 0, pattern = 'normal' }: { delay?: number; pattern?: 'normal' | 'wave' | 'orbit' }) => {
  const sizeType = useMemo(() => Math.random(), []);
  const size = useMemo(() => {
    if (sizeType < 0.3) return Math.random() * 2 + 1; // Small
    if (sizeType < 0.7) return Math.random() * 3 + 3; // Medium
    return Math.random() * 4 + 6; // Large
  }, [sizeType]);
  const x = useMemo(() => Math.random() * 100, []);
  const y = useMemo(() => Math.random() * 100, []);
  const duration = useMemo(() => Math.random() * 12 + 8, []); // Faster: 8-20s
  const xMovement = useMemo(() => Math.random() * 20 - 10, []);
  const waveAmplitude = useMemo(() => Math.random() * 15 + 5, []);
  const orbitRadius = useMemo(() => Math.random() * 30 + 20, []);
  const orbitCenterX = useMemo(() => Math.random() * 100, []);
  const orbitCenterY = useMemo(() => Math.random() * 100, []);
  
  // Different animation patterns
  const getAnimation = () => {
    if (pattern === 'wave') {
      // Wave pattern with sine wave motion
      return {
        y: [0, -40, 0],
        x: [xMovement, xMovement + waveAmplitude, xMovement, xMovement - waveAmplitude, xMovement],
        opacity: [0.2, 0.9, 0.2],
        scale: [1, 1.6, 1],
      };
    } else if (pattern === 'orbit') {
      // Circular orbit pattern
      return {
        rotate: [0, 360],
        x: [
          orbitCenterX,
          orbitCenterX + orbitRadius * 0.707,
          orbitCenterX,
          orbitCenterX - orbitRadius * 0.707,
          orbitCenterX
        ],
        y: [
          orbitCenterY,
          orbitCenterY - orbitRadius * 0.707,
          orbitCenterY - orbitRadius,
          orbitCenterY - orbitRadius * 0.707,
          orbitCenterY
        ],
        opacity: [0.3, 0.8, 0.3],
        scale: [1, 1.4, 1],
      };
    }
    // Normal floating pattern
    return {
      y: [0, -40, 0],
      x: [0, xMovement, 0],
      opacity: [0.2, 0.9, 0.2],
      scale: [1, 1.6, 1],
    };
  };
  
  return (
    <motion.div
      className="absolute rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        willChange: 'transform, opacity',
      }}
      animate={getAnimation()}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: pattern === 'orbit' ? "linear" : [0.25, 0.46, 0.45, 0.94], // Bounce-like easing
      }}
    />
  );
};

// Floating Shapes Component with spiral patterns
const FloatingShape = ({ type, delay = 0, pattern = 'normal' }: { type: 'circle' | 'star'; delay?: number; pattern?: 'normal' | 'spiral' }) => {
  const size = useMemo(() => Math.random() * 60 + 40, []);
  const x = useMemo(() => Math.random() * 100, []);
  const y = useMemo(() => Math.random() * 100, []);
  const duration = useMemo(() => Math.random() * 8 + 10, []); // Faster: 10-18s
  const rotation = useMemo(() => Math.random() * 360, []);
  const xMovement = useMemo(() => Math.random() * 30 - 15, []);
  const spiralRadius = useMemo(() => Math.random() * 40 + 20, []);
  
  const getAnimation = () => {
    if (pattern === 'spiral') {
      return {
        y: [0, -60, -30, -60, 0],
        x: [0, xMovement, xMovement * 1.5, xMovement, 0],
        rotate: [rotation, rotation + 720, rotation + 1080, rotation + 1440, rotation + 1800],
        scale: [1, 1.3, 1.1, 1.3, 1],
      };
    }
    return {
      y: [0, -60, 0],
      x: [0, xMovement, 0],
      rotate: [rotation, rotation + 360],
      scale: [1, 1.3, 1],
    };
  };
  
  return (
    <motion.div
      className="absolute opacity-10"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        willChange: 'transform',
      }}
      animate={getAnimation()}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94], // Bounce easing
      }}
    >
      {type === 'circle' ? (
        <Circle className="w-full h-full text-blue-400" fill="currentColor" />
      ) : (
        <Star className="w-full h-full text-purple-400" fill="currentColor" />
      )}
    </motion.div>
  );
};

// Animated Grid Background
const AnimatedGrid = () => {
  return (
    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
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

const PortalLanding = () => {
  // Mobile/touch detection
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check for touch device
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    // Check for mobile screen size
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

  // Mouse parallax setup
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
  const orbX3 = useMotionValue(0);
  const orbY3 = useMotionValue(0);
  const orbX3Spring = useSpring(orbX3, springConfig);
  const orbY3Spring = useSpring(orbY3, springConfig);

  // Click ripple effects
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [particleBursts, setParticleBursts] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const rippleIdRef = useRef(0);

  // Throttled mouse move handler (desktop only)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isMobile || isTouch) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const xPercent = (clientX / innerWidth - 0.5) * 20;
    const yPercent = (clientY / innerHeight - 0.5) * 20;
    mouseX.set(xPercent);
    mouseY.set(yPercent);
    cursorX.set(clientX);
    cursorY.set(clientY);
    orbX2.set(xPercent * -0.5);
    orbY2.set(yPercent * -0.5);
    orbX3.set(xPercent * 0.3);
    orbY3.set(yPercent * 0.3);
  }, [isMobile, isTouch, mouseX, mouseY, cursorX, cursorY, orbX2, orbY2, orbX3, orbY3]);

  // Click/touch handler for ripples and particle bursts
  const handleInteraction = useCallback((clientX: number, clientY: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Add ripple
    const rippleId = rippleIdRef.current++;
    setRipples(prev => [...prev, { x, y, id: rippleId }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 1000);

    // Add particle burst
    setParticleBursts(prev => [...prev, { x: clientX, y: clientY, id: rippleId }]);
    setTimeout(() => {
      setParticleBursts(prev => prev.filter(b => b.id !== rippleId));
    }, 2000);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    handleInteraction(e.clientX, e.clientY, e.currentTarget as HTMLElement);
  }, [handleInteraction]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      handleInteraction(touch.clientX, touch.clientY, e.currentTarget as HTMLElement);
    }
  }, [handleInteraction]);

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
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const cardHover = (isMobile: boolean) => ({
    scale: isMobile ? 1 : 1.08,
    y: isMobile ? 0 : -15,
    rotateY: isMobile ? 0 : 5,
    transition: { duration: 0.4, ease: "easeOut" },
  });

  const cardTap = { scale: 0.96 };

  // Generate particles - reduced count on mobile for performance
  const particles = useMemo(() => {
    const count = isMobile ? 40 : 70; // Reduce on mobile
    return Array.from({ length: count }, (_, i) => {
      const patternType = i % 3 === 0 ? 'wave' : i % 3 === 1 ? 'orbit' : 'normal';
      return (
        <Particle 
          key={`particle-${i}`} 
          delay={i * 0.1} 
          pattern={patternType as 'normal' | 'wave' | 'orbit'}
        />
      );
    });
  }, [isMobile]);

  // Generate floating shapes - reduced count on mobile
  const shapes = useMemo(() => {
    const count = isMobile ? 10 : 18; // Reduce on mobile
    return Array.from({ length: count }, (_, i) => {
      const pattern = i % 3 === 0 ? 'spiral' : 'normal';
      return (
        <FloatingShape 
          key={`shape-${i}`} 
          type={i % 2 === 0 ? 'circle' : 'star'} 
          delay={i * 0.4}
          pattern={pattern as 'normal' | 'spiral'}
        />
      );
    });
  }, [isMobile]);

  // Generate card particles - memoized
  const cardParticles = useMemo(() => {
    const particles = [];
    for (let i = 0; i < 6; i++) {
      particles.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        xMove: Math.random() * 10 - 5,
        duration: 2 + Math.random() * 2,
        key: i
      });
    }
    return particles;
  }, []);

  return (
    <motion.div 
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden ${isMobile || isTouch ? '' : 'cursor-none'}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
    >
      {/* Animated Grid Background */}
      <AnimatedGrid />

      {/* Color shift overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(248,250,252,0.3) 0%, rgba(239,246,255,0.3) 50%, rgba(250,245,255,0.3) 100%)',
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 15,
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
            scale: [1, 1.4, 1.2, 1],
            rotate: [0, 180, 360, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute top-20 left-10 w-[400px] h-[400px] bg-gradient-to-r from-blue-400/30 via-cyan-400/20 to-blue-500/30 rounded-full blur-3xl"
        />
        <motion.div 
          style={{ 
            x: orbX2Spring, 
            y: orbY2Spring
          }}
          animate={{ 
            scale: [1, 1.5, 1.3, 1],
            rotate: [0, -180, -360, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-r from-purple-400/30 via-pink-400/20 to-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div 
          style={{ 
            x: orbX3Spring, 
            y: orbY3Spring
          }}
          animate={{ 
            x: [0, 100, -50, 0],
            y: [0, -80, 50, 0],
            scale: [1, 1.3, 1.2, 1],
            rotate: [0, 90, 180, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-400/20 via-rose-400/15 to-pink-500/20 rounded-full blur-3xl"
        />
        
        {/* Medium orbs */}
        <motion.div 
          animate={{ 
            x: [0, 80, -40, 0],
            y: [0, -50, 40, 0],
            scale: [1, 1.35, 1.2, 1],
            rotate: [0, 120, 240, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-gradient-to-r from-cyan-400/25 to-blue-400/25 rounded-full blur-2xl"
        />
        <motion.div 
          animate={{ 
            x: [0, -90, 45, 0],
            y: [0, 60, -30, 0],
            scale: [1, 1.4, 1.25, 1],
            rotate: [0, -120, -240, 0]
          }}
          transition={{ duration: 11, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-gradient-to-r from-violet-400/25 to-purple-400/25 rounded-full blur-2xl"
        />
        
        {/* Small accent orbs */}
        <motion.div 
          animate={{ 
            x: [0, 50, -25, 0],
            y: [0, -40, 25, 0],
            scale: [1, 1.3, 1.15, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute top-10 right-1/3 w-[200px] h-[200px] bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-xl"
        />
        <motion.div 
          animate={{ 
            x: [0, -60, 30, 0],
            y: [0, 45, -25, 0],
            scale: [1, 1.25, 1.1, 1]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute bottom-10 left-1/3 w-[180px] h-[180px] bg-gradient-to-r from-fuchsia-400/20 to-pink-400/20 rounded-full blur-xl"
        />

        {/* Pulsing effects on orbs */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`pulse-${i}`}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-blue-400/10"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 1.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Light ray effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`ray-${i}`}
            className="absolute w-1 h-full bg-gradient-to-b from-transparent via-blue-400/20 to-transparent"
            style={{
              left: `${20 + i * 30}%`,
              transform: `rotate(${15 + i * 10}deg)`,
              transformOrigin: 'top center',
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              x: [0, 50, 0]
            }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              delay: i * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles}
      </div>

      {/* Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {shapes}
      </div>

      {/* Animated mesh gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-30 dark:opacity-20"
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
            className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400/40 to-purple-400/40 blur-xl"
            style={{
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3]
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
          className="absolute pointer-events-none rounded-full border-2 border-blue-400/50"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ width: 300, height: 300, opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      ))}

      {/* Particle bursts on click */}
      {particleBursts.map((burst) => (
        <div key={burst.id} className="fixed pointer-events-none" style={{ left: `${burst.x}px`, top: `${burst.y}px` }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((i / 8) * Math.PI * 2) * 100,
                y: Math.sin((i / 8) * Math.PI * 2) * 100,
                opacity: 0,
                scale: 0
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.05,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full py-6 px-4 sm:px-6 lg:px-8"
        >
          <div className="container mx-auto flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              whileHover={isMobile ? {} : { scale: 1.05 }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="text-white" size={24} />
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Onestone
              </span>
            </motion.div>
          </div>
        </motion.header>

        {/* Main */}
        <motion.main
          variants={container}
          initial="hidden"
          animate="show"
          className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12"
        >
          <div className="container mx-auto max-w-5xl">
            {/* Title */}
            <motion.div variants={item} className="text-center mb-10 sm:mb-14">
              <motion.h1
                className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent px-2"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ backgroundSize: "200% 100%" }}
              >
                Choose Your Platform
              </motion.h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
                Seamlessly switch between our powerful tools for collecting
                customer data and managing part-time work.
              </p>
            </motion.div>

            {/* Cards */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
              {/* Form Builder */}
              <motion.div
                variants={item}
                whileHover={cardHover(isMobile)}
                whileTap={cardTap}
                className="group relative"
                style={{ perspective: "1000px" }}
                animate={isMobile ? {} : {
                  y: [0, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="relative h-full rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-blue-200/50 dark:border-blue-800/50 shadow-2xl hover:shadow-blue-500/30 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-500 overflow-hidden p-6 sm:p-8 flex flex-col">
                  {/* Pulsing border effect */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl border-2 border-blue-400/30 opacity-0 group-hover:opacity-100"
                    animate={{
                      scale: [1, 1.02, 1],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  {/* Animated gradient border */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100"
                    animate={{
                      background: [
                        'linear-gradient(45deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))',
                        'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(59, 130, 246, 0.3))',
                        'linear-gradient(225deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))',
                        'linear-gradient(315deg, rgba(147, 51, 234, 0.3), rgba(59, 130, 246, 0.3))',
                        'linear-gradient(45deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))',
                      ]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    style={{
                      padding: '2px',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                    }}
                  />
                  
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Animated shine effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    initial={false}
                    animate={{
                      x: ["-100%", "200%"]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 1.5,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12" />
                  </motion.div>

                  {/* Floating particles inside card */}
                  <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {cardParticles.map((particle) => (
                      <motion.div
                        key={particle.key}
                        className="absolute w-2 h-2 bg-blue-400/40 rounded-full"
                        style={{
                          left: `${particle.left}%`,
                          top: `${particle.top}%`,
                        }}
                        animate={{
                          y: [0, -20, 0],
                          x: [0, particle.xMove, 0],
                          opacity: [0, 0.6, 0],
                          scale: [0, 1, 0],
                        }}
                        transition={{
                          duration: particle.duration,
                          repeat: Infinity,
                          delay: particle.key * 0.3,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>

                  <motion.div 
                    className="relative z-10 flex-1 flex flex-col"
                    animate={{
                      x: [0, 2, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <motion.div
                      className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-6 shadow-lg relative overflow-hidden group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      animate={{
                        rotate: [0, 360]
                      }}
                      transition={{
                        rotate: {
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear",
                          repeatDelay: 0
                        }
                      }}
                    >
                      {/* Animated glow effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-50 blur-xl"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0, 0.5, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <motion.div
                        className="relative z-10"
                        animate={{
                          rotate: [0, -360]
                        }}
                        transition={{
                          rotate: {
                            duration: 20,
                            repeat: Infinity,
                            ease: "linear"
                          }
                        }}
                        style={{ transformOrigin: 'center' }}
                      >
                        <FileText className="text-white" size={32} />
                      </motion.div>
                    </motion.div>

                    <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Form Builder
                    </h2>
                    <p className="text-muted-foreground mb-5">
                      Build modern forms in minutes with drag-and-drop fields,
                      WhatsApp integration, and AI-powered form creation.
                    </p>

                    <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                      {[
                        "Drag-and-drop form fields",
                        "WhatsApp & email sharing",
                        "AI text / image to form",
                        "PDF export for responses",
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle2
                            size={16}
                            className="text-blue-500 flex-shrink-0"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <motion.a
                      href="https://app.onestoneads.com/formbuilder"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={isMobile ? {} : { scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg flex items-center justify-center gap-2 min-h-[48px] text-base">
                        Go to Form Builder
                        <ArrowRight size={18} />
                      </Button>
                    </motion.a>
                  </motion.div>
                </div>
              </motion.div>

              {/* Smart Shift */}
              <motion.div
                variants={item}
                whileHover={cardHover(isMobile)}
                whileTap={cardTap}
                className="group relative"
                style={{ perspective: "1000px" }}
                animate={isMobile ? {} : {
                  y: [0, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <div className="relative h-full rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-800/50 shadow-2xl hover:shadow-purple-500/30 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-500 overflow-hidden p-6 sm:p-8 flex flex-col">
                  {/* Pulsing border effect */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl border-2 border-purple-400/30 opacity-0 group-hover:opacity-100"
                    animate={{
                      scale: [1, 1.02, 1],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  {/* Animated gradient border */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100"
                    animate={{
                      background: [
                        'linear-gradient(45deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
                        'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(147, 51, 234, 0.3))',
                        'linear-gradient(225deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
                        'linear-gradient(315deg, rgba(236, 72, 153, 0.3), rgba(147, 51, 234, 0.3))',
                        'linear-gradient(45deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
                      ]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    style={{
                      padding: '2px',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                    }}
                  />
                  
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Animated shine effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    initial={false}
                    animate={{
                      x: ["-100%", "200%"]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 1.5,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12" />
                  </motion.div>

                  {/* Floating particles inside card */}
                  <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {cardParticles.map((particle) => (
                      <motion.div
                        key={particle.key}
                        className="absolute w-2 h-2 bg-purple-400/40 rounded-full"
                        style={{
                          left: `${particle.left}%`,
                          top: `${particle.top}%`,
                        }}
                        animate={{
                          y: [0, -20, 0],
                          x: [0, particle.xMove, 0],
                          opacity: [0, 0.6, 0],
                          scale: [0, 1, 0],
                        }}
                        transition={{
                          duration: particle.duration,
                          repeat: Infinity,
                          delay: particle.key * 0.3,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>

                  <motion.div 
                    className="relative z-10 flex-1 flex flex-col"
                    animate={{
                      x: [0, -2, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.3
                    }}
                  >
                    <motion.div
                      className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg relative overflow-hidden group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      animate={{
                        rotate: [0, 360]
                      }}
                      transition={{
                        rotate: {
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear",
                          repeatDelay: 0
                        }
                      }}
                    >
                      {/* Animated glow effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-50 blur-xl"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0, 0.5, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <motion.div
                        className="relative z-10"
                        animate={{
                          rotate: [0, -360]
                        }}
                        transition={{
                          rotate: {
                            duration: 20,
                            repeat: Infinity,
                            ease: "linear"
                          }
                        }}
                        style={{ transformOrigin: 'center' }}
                      >
                        <Clock className="text-white" size={32} />
                      </motion.div>
                    </motion.div>

                    <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Smart Shift
                    </h2>
                    <p className="text-muted-foreground mb-5">
                      Track part-time work, generate professional certificates,
                      and keep real-time visibility on earnings.
                    </p>

                    <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                      {[
                        "GPS-verified time tracking",
                        "Professional work certificates",
                        "Real-time earnings overview",
                        "Employer & part-timer dashboards",
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle2
                            size={16}
                            className="text-purple-500 flex-shrink-0"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <motion.a
                      href="https://smart-shift-tracker.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={isMobile ? {} : { scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg flex items-center justify-center gap-2 min-h-[48px] text-base">
                        Go to Smart Shift
                        <ArrowRight size={18} />
                      </Button>
                    </motion.a>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Bottom badges */}
            <motion.div
              variants={item}
              className="mt-10 sm:mt-14 flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground px-2"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                <Zap size={15} className="text-blue-500" />
                <span>Fast onboarding</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                <Award size={15} className="text-purple-500" />
                <span>Professional experience</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                <DollarSign size={15} className="text-pink-500" />
                <span>Track your earnings</span>
              </div>
            </motion.div>
          </div>
        </motion.main>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-slate-200/70 dark:border-slate-800/60 mt-8">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Onestone. Powered by Aariz Technologies.
            All rights reserved.
          </div>
        </footer>
      </div>
    </motion.div>
  );
};

export default PortalLanding;
