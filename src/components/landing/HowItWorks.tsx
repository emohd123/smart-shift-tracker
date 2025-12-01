import { motion } from "framer-motion";
import { Building2, UserCheck, DollarSign, QrCode, MapPin, Trophy } from "lucide-react";

const HowItWorks = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 }
  };

  const partTimerSteps = [
    {
      icon: <QrCode className="w-8 h-8" />,
      title: "Get Your Unique Code",
      description: "Receive your personal promoter code for easy assignment",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Get Assigned to Shifts",
      description: "Companies find and assign you using your unique code",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Auto Time-Tracking",
      description: "GPS check-in/out with real-time earnings and work certificates",
      gradient: "from-pink-500 to-rose-500"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How <span className="text-gradient">It Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start earning and building your professional portfolio in 3 steps
          </p>
        </motion.div>

        {/* For Part-Timers */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-3">For Part-Timers</h3>
            <p className="text-muted-foreground">Start earning with your unique code</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partTimerSteps.map((step, index) => (
              <motion.div key={index} variants={item}>
                <div className="relative group">
                  {/* Connector line (desktop only) */}
                  {index < partTimerSteps.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-border via-primary/30 to-border z-0" />
                  )}

                  <div className="glass-card rounded-2xl border border-border/50 p-8 hover:shadow-2xl transition-all duration-500 hover:border-primary/30 relative z-10 bg-background">
                    <div className="flex flex-col items-center text-center">
                      {/* Step number */}
                      <div className="text-5xl font-bold text-primary/20 mb-4">
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${step.gradient} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {step.icon}
                      </div>

                      {/* Content */}
                      <h4 className="text-xl font-semibold mb-3">{step.title}</h4>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
