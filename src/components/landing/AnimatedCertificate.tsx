import { motion } from "framer-motion";
import { Award, CheckCircle, QrCode, Calendar, Clock, Building2 } from "lucide-react";

const AnimatedCertificate = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-2xl mx-auto"
    >
      {/* Floating glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 blur-3xl animate-pulse-soft" />
      
      {/* Certificate Card */}
      <div className="relative glass-card rounded-2xl border-2 border-border/50 p-8 md:p-12 bg-background/95 backdrop-blur-xl shadow-2xl">
        {/* Header with animated badge */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 rounded-xl bg-gradient-to-r from-accent to-accent/80 flex items-center justify-center shadow-lg"
            >
              <Award className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold">Work Certificate</h3>
              <p className="text-sm text-muted-foreground">Official Verification</p>
            </div>
          </div>
          
          {/* Animated QR Code */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div className="w-20 h-20 bg-background rounded-lg border-2 border-accent/30 flex items-center justify-center">
              <QrCode className="w-12 h-12 text-accent" />
            </div>
            {/* Scanning line effect */}
            <motion.div
              initial={{ top: 0 }}
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-0.5 bg-accent/50"
            />
          </motion.div>
        </div>

        {/* Certificate Details */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-sm">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Company Name:</span>
            <span className="font-semibold">Tech Solutions Ltd.</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Work Period:</span>
            <span className="font-semibold">Jan 2024 - Jun 2024</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Total Hours:</span>
            <motion.span 
              className="font-bold text-accent text-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              127 hours
            </motion.span>
          </div>
        </div>

        {/* Verification Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 bg-accent/10 rounded-lg p-3 border border-accent/20"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle className="w-5 h-5 text-accent" />
          </motion.div>
          <span className="text-sm font-medium text-accent">Verified Certificate</span>
        </motion.div>

        {/* Floating badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="absolute -top-3 -right-3 flex gap-2"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-accent text-white text-xs px-3 py-1 rounded-full shadow-lg font-semibold"
          >
            Official
          </motion.div>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="bg-primary text-white text-xs px-3 py-1 rounded-full shadow-lg font-semibold"
          >
            PDF Ready
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnimatedCertificate;
