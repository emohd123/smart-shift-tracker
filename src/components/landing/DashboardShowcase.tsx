import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, User, Clock } from "lucide-react";
import ScreenshotCard from "./ScreenshotCard";

const DashboardShowcase = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-secondary/10 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
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
            See It In <span className="text-gradient">Action</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore the platform from different perspectives
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-12 h-auto p-1 glass-card">
              <TabsTrigger value="company" className="gap-2 py-3">
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Company Dashboard</span>
                <span className="sm:hidden">Company</span>
              </TabsTrigger>
              <TabsTrigger value="promoter" className="gap-2 py-3">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Promoter Dashboard</span>
                <span className="sm:hidden">Promoter</span>
              </TabsTrigger>
              <TabsTrigger value="tracking" className="gap-2 py-3">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Time Tracking</span>
                <span className="sm:hidden">Tracking</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="mt-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <ScreenshotCard
                  title="Company Dashboard"
                  gradient="from-blue-500 to-cyan-500"
                  type="company"
                />
                <div className="mt-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Manage all shifts, track live attendance, and monitor earnings in real-time
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    <span className="glass-card px-4 py-2 rounded-full border border-border/50">
                      Live Stats
                    </span>
                    <span className="glass-card px-4 py-2 rounded-full border border-border/50">
                      Active Shifts
                    </span>
                    <span className="glass-card px-4 py-2 rounded-full border border-border/50">
                      Payment Summary
                    </span>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="promoter" className="mt-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <ScreenshotCard
                  title="Promoter Dashboard"
                  gradient="from-purple-500 to-pink-500"
                  type="promoter"
                />
                <div className="mt-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    View your unique code, upcoming shifts, and track your earnings
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    <span className="glass-card px-4 py-2 rounded-full border border-border/50">
                      Unique Code
                    </span>
                    <span className="glass-card px-4 py-2 rounded-full border border-border/50">
                      Next Shift
                    </span>
                    <span className="glass-card px-4 py-2 rounded-full border border-border/50">
                      Total Earnings
                    </span>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="tracking" className="mt-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <ScreenshotCard
                  title="Time Tracking"
                  gradient="from-green-500 to-emerald-500"
                  type="promoter"
                />
                <div className="mt-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    GPS-verified check-in/out with automatic time logging and multi-day support
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    <span className="glass-card px-4 py-2 rounded-full border border-border/50">
                      GPS Verified
                    </span>
                    <span className="glass-card px-4 py-2 rounded-full border border-border/50">
                      Live Timer
                    </span>
                    <span className="glass-card px-4 py-2 rounded-full border border-border/50">
                      Session History
                    </span>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardShowcase;
