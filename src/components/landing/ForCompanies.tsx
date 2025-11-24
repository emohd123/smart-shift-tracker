import { motion } from "framer-motion";
import { Activity, Users, MapPin, BarChart3, Clock, FileCheck, Download, Shield } from "lucide-react";
import ScreenshotCard from "./ScreenshotCard";

const ForCompanies = () => {
  const features = [
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Live Dashboard",
      description: "Real-time monitoring of active shifts, working promoters, hours tracked, and live earnings calculations",
      gradient: "from-blue-500 to-cyan-500",
      stats: ["Active shifts counter", "Promoters currently working", "Live earnings calculation", "Total hours tracked"]
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Shift Management",
      description: "Create and manage shifts with ease using our intuitive interface and unique promoter code system",
      gradient: "from-purple-500 to-pink-500",
      stats: ["Quick shift creation", "GPS location mapping", "Assign by unique code", "Auto check-in/out system"]
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Attendance & Payroll",
      description: "Track attendance with GPS verification, multi-day shift support, and automatic payment calculations",
      gradient: "from-green-500 to-emerald-500",
      stats: ["Multi-day shift tracking", "Session history breakdown", "Payment summary", "Total earnings calculation"]
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics & Reports",
      description: "Comprehensive reporting with data visualization, export capabilities, and payroll insights",
      gradient: "from-orange-500 to-red-500",
      stats: ["Revenue analytics charts", "Export to CSV/PDF", "Payroll reports", "Performance metrics"]
    }
  ];

  const keyFeatures = [
    { icon: <MapPin className="w-5 h-5" />, text: "GPS-Verified Time Tracking" },
    { icon: <Clock className="w-5 h-5" />, text: "Multi-Day Shift Support" },
    { icon: <BarChart3 className="w-5 h-5" />, text: "Automatic Payment Calculation" },
    { icon: <Users className="w-5 h-5" />, text: "Unique Promoter Code System" },
    { icon: <Activity className="w-5 h-5" />, text: "Real-Time Attendance Monitoring" },
    { icon: <FileCheck className="w-5 h-5" />, text: "Work History & Session Breakdown" },
    { icon: <Download className="w-5 h-5" />, text: "Export Reports (CSV/PDF)" },
    { icon: <Shield className="w-5 h-5" />, text: "Certificate Generation for Promoters" }
  ];

  return (
    <section id="for-companies" className="py-24 bg-gradient-to-b from-background to-secondary/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-6">
            <span className="text-primary font-semibold">For Companies</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Manage Your Workforce <span className="text-gradient">Effortlessly</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Complete workforce management platform with real-time tracking, GPS verification, and automated payroll
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="space-y-24 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
            >
              {/* Screenshot */}
              <div className="w-full lg:w-1/2">
                <ScreenshotCard
                  title={feature.title}
                  gradient={feature.gradient}
                  type="company"
                />
              </div>

              {/* Content */}
              <div className="w-full lg:w-1/2 space-y-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-3xl font-bold">{feature.title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.stats.map((stat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-foreground">{stat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Key Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card rounded-3xl border border-border/50 p-12"
        >
          <h3 className="text-2xl font-bold text-center mb-10">Complete Feature Set</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-xl hover:bg-primary/5 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {feature.icon}
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ForCompanies;
