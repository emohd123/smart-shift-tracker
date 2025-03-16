
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileQuestion, ArrowLeft, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export const ShiftNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <FileQuestion className="h-16 w-16 text-primary" />
      </div>
      <h2 className="text-3xl font-bold mb-3">Shift Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        The shift you're looking for doesn't exist or has been removed.
        You can view all available shifts or return to the previous page.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          size="lg"
          onClick={() => navigate("/shifts")}
          className="gap-2"
        >
          <Calendar size={18} />
          View All Shifts
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft size={18} />
          Go Back
        </Button>
      </div>
    </motion.div>
  );
};
