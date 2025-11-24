import { motion } from "framer-motion";
import { Check } from "lucide-react";

const FeatureComparison = () => {
  const features = [
    { feature: "Shift Management", company: "Create & Manage", partTimer: "View Assigned" },
    { feature: "GPS Time Tracking", company: "Monitor All", partTimer: "Check In/Out" },
    { feature: "Payment Processing", company: "Calculate & Pay", partTimer: "Track Earnings" },
    { feature: "Unique Code System", company: "Assign Promoters", partTimer: "Get Assigned" },
    { feature: "Work History", company: "All Promoters", partTimer: "Personal History" },
    { feature: "Certificate Generation", company: "Verify Certs", partTimer: "Generate Certs" },
    { feature: "Multi-Day Shifts", company: "Full Support", partTimer: "Full Support" },
    { feature: "Reports & Analytics", company: "Full Dashboard", partTimer: "Personal Stats" },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
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
            Feature <span className="text-gradient">Comparison</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See what's available for companies and part-timers
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* Desktop Table */}
          <div className="hidden md:block glass-card rounded-2xl border border-border/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left py-6 px-8 text-lg font-bold">Feature</th>
                  <th className="text-center py-6 px-8 text-lg font-bold text-primary">For Companies</th>
                  <th className="text-center py-6 px-8 text-lg font-bold text-accent">For Part-Timers</th>
                </tr>
              </thead>
              <tbody>
                {features.map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-5 px-8 font-medium">{item.feature}</td>
                    <td className="py-5 px-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">{item.company}</span>
                      </div>
                    </td>
                    <td className="py-5 px-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="w-5 h-5 text-accent" />
                        <span className="text-sm text-muted-foreground">{item.partTimer}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {features.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="glass-card rounded-xl border border-border/50 p-6"
              >
                <h3 className="font-bold text-lg mb-4">{item.feature}</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-primary mb-1">For Companies</div>
                      <div className="text-sm text-muted-foreground">{item.company}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-accent mb-1">For Part-Timers</div>
                      <div className="text-sm text-muted-foreground">{item.partTimer}</div>
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

export default FeatureComparison;
