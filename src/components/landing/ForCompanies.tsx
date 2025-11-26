import { motion } from "framer-motion";
import { Building2, Users, Clock, BarChart3 } from "lucide-react";

const ForCompanies = () => {
  return (
    <section id="for-companies" className="py-16 bg-gradient-to-b from-background to-secondary/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-4">
              <span className="text-primary font-semibold">For Companies</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Manage Your <span className="text-gradient">Workforce</span>
            </h2>
          </div>

          {/* Compact Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="glass-card rounded-2xl border border-border/50 p-8 md:p-10 hover:shadow-2xl transition-all duration-500"
          >
            {/* Icon Grid */}
            <div className="flex justify-center gap-4 mb-6">
              {[
                { icon: <Building2 />, gradient: "from-blue-500 to-cyan-500" },
                { icon: <Users />, gradient: "from-purple-500 to-pink-500" },
                { icon: <Clock />, gradient: "from-green-500 to-emerald-500" },
                { icon: <BarChart3 />, gradient: "from-orange-500 to-red-500" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.gradient} flex items-center justify-center text-white shadow-lg`}
                >
                  {item.icon}
                </motion.div>
              ))}
            </div>

            <h3 className="text-2xl font-bold text-center mb-6">Simple Workforce Management</h3>
            
            {/* 3-Step Flow */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <div className="text-sm font-semibold text-primary mb-1">1. Create Shifts</div>
                <div className="text-xs text-muted-foreground">Set location, time & pay rate</div>
              </div>
              <div className="hidden md:block text-primary">→</div>
              <div className="text-center">
                <div className="text-sm font-semibold text-primary mb-1">2. Assign by Code</div>
                <div className="text-xs text-muted-foreground">Use unique promoter codes</div>
              </div>
              <div className="hidden md:block text-primary">→</div>
              <div className="text-center">
                <div className="text-sm font-semibold text-primary mb-1">3. Auto-Track & Pay</div>
                <div className="text-xs text-muted-foreground">GPS tracking & calculations</div>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "GPS Verification",
                "Real-Time Monitoring",
                "Auto Calculations",
                "Certificate Generation"
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  {feature}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ForCompanies;
