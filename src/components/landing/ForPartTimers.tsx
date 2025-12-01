import { motion } from "framer-motion";
import { Award, Clock, MapPin, DollarSign } from "lucide-react";
import AnimatedCertificate from "./AnimatedCertificate";

const ForPartTimers = () => {
  const benefits = [
    {
      icon: <Award className="w-8 h-8" />,
      title: "Work Certificates",
      description: "Official certificates with QR verification proving every hour you worked",
      gradient: "from-violet-500 to-purple-500",
      features: ["QR code authentication", "Company stamp included", "Perfect for job applications"]
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Track Earnings",
      description: "Real-time payment tracking so you always know what you've earned",
      gradient: "from-green-500 to-emerald-500",
      features: ["Live earnings counter", "Complete payment history", "Multi-day shifts supported"]
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "GPS Time Tracking",
      description: "Location-verified check-in ensures you get paid for every minute worked",
      gradient: "from-blue-500 to-cyan-500",
      features: ["GPS verification", "Automatic tracking", "Session breakdown"]
    }
  ];

  return (
    <section id="for-part-timers" className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-6"
          >
            <span className="text-primary font-semibold">For Part-Timers</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Get Paid. <span className="text-gradient">Get Certified.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Every hour tracked. Every shift verified. Build your professional portfolio with work certificates.
          </p>
        </motion.div>

        {/* Animated Certificate Hero */}
        <div className="mb-20">
          <AnimatedCertificate />
        </div>

        {/* Example Counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="glass-card inline-block rounded-2xl border border-primary/30 p-8 shadow-xl">
            <p className="text-muted-foreground mb-2">Example Journey</p>
            <div className="flex items-center gap-4 text-2xl md:text-3xl font-bold">
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-primary"
              >
                127 hours
              </motion.span>
              <span className="text-muted-foreground">→</span>
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="text-gradient"
              >
                Certificate Generated
              </motion.span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Build your professional portfolio</p>
          </div>
        </motion.div>

        {/* 3 Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="glass-card rounded-2xl border border-border/50 p-8 hover:shadow-2xl transition-all duration-500 hover:border-primary/30"
            >
              {/* Animated Icon */}
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${benefit.gradient} flex items-center justify-center text-white mb-6 shadow-lg`}
              >
                {benefit.icon}
              </motion.div>

              <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground mb-4">{benefit.description}</p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2">
                {benefit.features.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                  >
                    {feature}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Key Features as Icon Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: <Award />, text: "Work Certificates" },
              { icon: <Clock />, text: "Time Tracking" },
              { icon: <DollarSign />, text: "Real-Time Earnings" },
              { icon: <MapPin />, text: "GPS Verified" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 glass-card px-4 py-2 rounded-full border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="w-5 h-5 text-primary">{item.icon}</div>
                <span className="text-sm font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ForPartTimers;
