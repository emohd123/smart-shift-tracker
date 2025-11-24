import { motion } from "framer-motion";
import { Monitor } from "lucide-react";

type ScreenshotCardProps = {
  title: string;
  gradient: string;
  type: "company" | "promoter";
};

const ScreenshotCard = ({ title, gradient, type }: ScreenshotCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="relative group"
    >
      {/* Browser window mockup */}
      <div className="glass-card rounded-2xl border border-border/50 overflow-hidden shadow-2xl bg-background">
        {/* Browser chrome */}
        <div className="bg-muted/30 px-4 py-3 flex items-center gap-2 border-b border-border/50">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-background/50 rounded px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
              <Monitor className="w-3 h-3" />
              <span>smartshift.app/{type === "company" ? "dashboard" : "tracking"}</span>
            </div>
          </div>
        </div>

        {/* Screenshot placeholder */}
        <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10">
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Content mockup */}
          <div className="relative z-10 p-8 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-foreground/10 rounded animate-pulse" />
                <div className="h-3 w-24 bg-foreground/5 rounded animate-pulse" />
              </div>
              <div className="h-10 w-10 rounded-full bg-foreground/5 animate-pulse" />
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass-card rounded-lg p-4 border border-border/30">
                <div className="h-3 w-16 bg-foreground/10 rounded mb-2 animate-pulse" />
                <div className="h-6 w-20 bg-foreground/20 rounded animate-pulse" />
              </div>
              <div className="glass-card rounded-lg p-4 border border-border/30">
                <div className="h-3 w-16 bg-foreground/10 rounded mb-2 animate-pulse" />
                <div className="h-6 w-20 bg-foreground/20 rounded animate-pulse" />
              </div>
            </div>

            {/* Content blocks */}
            <div className="space-y-3 flex-1">
              <div className="glass-card rounded-lg p-4 border border-border/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-foreground/10 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-foreground/10 rounded animate-pulse" />
                    <div className="h-2 w-32 bg-foreground/5 rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-foreground/5 rounded animate-pulse" />
                  <div className="h-2 w-3/4 bg-foreground/5 rounded animate-pulse" />
                </div>
              </div>
              <div className="glass-card rounded-lg p-4 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-foreground/10 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-foreground/10 rounded animate-pulse" />
                    <div className="h-2 w-32 bg-foreground/5 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hover overlay with gradient */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="glass-card px-6 py-3 rounded-full border border-border/50">
                <span className="text-sm font-semibold">{title}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shadow glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 -z-10 rounded-2xl`} />
    </motion.div>
  );
};

export default ScreenshotCard;
