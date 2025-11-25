import { motion } from "framer-motion";
import { QrCode, Clock, History, Award, MapPin, DollarSign, FileText, Smartphone } from "lucide-react";
import ScreenshotCard from "./ScreenshotCard";

const ForPartTimers = () => {
  const features = [
    {
      icon: <Award className="w-6 h-6" />,
      title: "Professional Work Certificates",
      description: "Get verified proof of your work experience with official certificates featuring QR code authentication and complete work details",
      gradient: "from-green-500 to-emerald-500",
      stats: [
        "Official certificate with QR verification",
        "Shows total hours, dates, and company info",
        "Perfect for resumes and job applications",
        "Instant PDF download with company stamp",
        "Proof of skills and experience gained"
      ]
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Track Your Earnings",
      description: "See exactly how much you earn in real-time with automatic calculations based on your hourly rate and hours worked",
      gradient: "from-blue-500 to-cyan-500",
      stats: [
        "Real-time earnings calculator",
        "Track every hour you work",
        "Know your total accumulated earnings",
        "Multi-day shift support",
        "Complete payment history"
      ]
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "GPS-Verified Time Tracking",
      description: "Accurate time tracking with GPS verification ensures you get paid for every minute you work",
      gradient: "from-purple-500 to-pink-500",
      stats: [
        "GPS location verification",
        "Automatic check-in/out",
        "Live timer during shifts",
        "Complete work session history"
      ]
    },
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "Your Unique Code",
      description: "Get assigned instantly with your personal promoter code - companies find and assign you in seconds",
      gradient: "from-orange-500 to-red-500",
      stats: ["Personal identifier", "Quick assignment", "Easy to share"]
    }
  ];

  const keyFeatures = [
    { icon: <QrCode className="w-5 h-5" />, text: "Get Your Unique Promoter Code" },
    { icon: <MapPin className="w-5 h-5" />, text: "GPS-Verified Check-In/Out" },
    { icon: <Clock className="w-5 h-5" />, text: "Automatic Time Tracking" },
    { icon: <DollarSign className="w-5 h-5" />, text: "Real-Time Earnings Calculator" },
    { icon: <History className="w-5 h-5" />, text: "Complete Work History" },
    { icon: <Award className="w-5 h-5" />, text: "Generate Work Certificates" },
    { icon: <Smartphone className="w-5 h-5" />, text: "Mobile-Friendly Interface" },
    { icon: <FileText className="w-5 h-5" />, text: "Multi-Day Shift Support" }
  ];

  return (
    <section id="for-part-timers" className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-block px-4 py-2 bg-accent/10 rounded-full mb-6">
            <span className="text-accent font-semibold">For Part-Timers</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Get Paid. <span className="text-gradient">Get Certified.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Every hour tracked. Every shift verified. Build your professional portfolio with work certificates.
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="space-y-24 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}
            >
              {/* Screenshot */}
              <div className="w-full lg:w-1/2">
                <ScreenshotCard
                  title={feature.title}
                  gradient={feature.gradient}
                  type="promoter"
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
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
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
          <h3 className="text-2xl font-bold text-center mb-10">Everything You Need</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-xl hover:bg-accent/5 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
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

export default ForPartTimers;
