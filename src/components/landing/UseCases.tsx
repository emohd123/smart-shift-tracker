import { motion } from "framer-motion";
import { Store, Calendar, Users } from "lucide-react";
import ScreenshotCard from "./ScreenshotCard";

const UseCases = () => {
  const cases = [
    {
      icon: <Store className="w-6 h-6" />,
      title: "Retail Promotions",
      description: "Manage 50+ promoters across multiple locations with real-time tracking and automated payroll",
      gradient: "from-blue-500 to-cyan-500",
      stats: ["Multi-location support", "Real-time attendance", "Automated payments"]
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Event Management",
      description: "Track staff for multi-day events with GPS verification and complete session history",
      gradient: "from-purple-500 to-pink-500",
      stats: ["Multi-day tracking", "GPS verification", "Session breakdowns"]
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Part-Time Employment",
      description: "Part-timers track hours, monitor earnings, and generate professional work certificates",
      gradient: "from-green-500 to-emerald-500",
      stats: ["Hour tracking", "Earnings monitor", "Work certificates"]
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
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
            Real-World <span className="text-gradient">Use Cases</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how different businesses leverage our platform
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {cases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="glass-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:border-primary/30 h-full">
                {/* Mini Screenshot */}
                <div className="relative h-48 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-10`} />
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `
                        linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                        linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px'
                    }} />
                  </div>
                  <div className="relative z-10 p-6">
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-foreground/10 rounded animate-pulse" />
                      <div className="h-2 w-32 bg-foreground/5 rounded animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${useCase.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                    {useCase.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{useCase.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {useCase.description}
                  </p>
                  <div className="space-y-2">
                    {useCase.stats.map((stat, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-muted-foreground">{stat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
