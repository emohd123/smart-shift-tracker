
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";
import { motion } from "framer-motion";

interface TimeHistoryHeaderProps {
  totalEarnings: number;
}

const TimeHistoryHeader = ({ totalEarnings }: TimeHistoryHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/time')}
          className="group"
        >
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Time Tracking
        </Button>
        
        <Button variant="outline" size="sm">
          <Download size={16} className="mr-2" />
          Export CSV
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-primary" />
            Time Tracking History
          </h2>
          <p className="text-muted-foreground text-sm">
            Your complete record of tracked time and earnings
          </p>
        </div>
        <motion.div 
          className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-md text-center"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-sm text-muted-foreground">Total Earnings</div>
          <div className="text-xl font-bold text-primary">{formatBHD(totalEarnings)}</div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TimeHistoryHeader;
