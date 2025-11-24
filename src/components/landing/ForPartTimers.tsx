import { motion } from "framer-motion";
import { QrCode, Clock, History, Award, MapPin, DollarSign, FileText, Smartphone } from "lucide-react";
import ScreenshotCard from "./ScreenshotCard";

const ForPartTimers = () => {
  const features = [
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "Unique Promoter Code",
      description: "Get your personal unique code that companies use to find and assign you to shifts instantly",
      gradient: "from-orange-500 to-red-500",
      stats: ["Personal unique identifier", "Easy to share", "Quick assignment", "No email lookups needed"]
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Smart Time Tracking",
      description: "GPS-verified check-in and check-out with automatic time logging and live earnings display",
      gradient: "from-blue-500 to-cyan-500",
      stats: ["GPS location verification", "Auto check-in/out", "Live timer during shift", "Multi-day shift support"]
    },
    {
      icon: <History className="w-6 h-6" />,
      title: "Complete Work History",
      description: "Track all your completed shifts with detailed session breakdowns, hours worked, and payment status",
      gradient: "from-purple-500 to-pink-500",
      stats: ["All completed shifts", "Total hours tracked", "Payment status tracking", "Session breakdowns"]
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Work Certificates",
      description: "Generate professional work certificates with QR code verification for your resume and job applications",
      gradient: "from-green-500 to-emerald-500",
      stats: ["Professional certificates", "QR code verification", "Shows hours & skills", "PDF download"]
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
            Your Complete Work <span className="text-gradient">Platform</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Track your time, monitor earnings, and build your professional portfolio with automated certificates
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
