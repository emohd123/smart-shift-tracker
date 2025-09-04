import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Building2, Users, Calendar, X } from "lucide-react";
import { motion } from "framer-motion";
import { UserRole } from "../SignupModal";

interface RoleSelectionStepProps {
  onRoleSelect: (role: UserRole) => void;
  onClose: () => void;
}

export function RoleSelectionStep({ onRoleSelect, onClose }: RoleSelectionStepProps) {
  return (
    <div className="w-full max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="text-center relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-0 top-0 h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-r from-primary to-primary-light flex items-center justify-center mb-4 shadow-lg">
          <Clock className="text-white" size={24} />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Join SmartShift</h2>
        <p className="text-lg text-muted-foreground">
          Choose how you'd like to use our platform
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Part-timer Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group"
          whileHover={{ scale: 1.02 }}
        >
          <Card className="h-full border-2 hover:border-blue-300 transition-all duration-300 cursor-pointer hover:shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="text-white" size={24} />
              </div>
              <CardTitle className="text-2xl">Part-timer</CardTitle>
              <CardDescription className="text-base">
                Track your shifts and manage your work hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Clock in/out with GPS tracking</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>View assigned shifts and schedules</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span>Request work certificates</span>
                </div>
              </div>
              <Button 
                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                onClick={() => onRoleSelect("part_timer")}
              >
                Join as Part-timer
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Company Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="group"
          whileHover={{ scale: 1.02 }}
        >
          <Card className="h-full border-2 hover:border-purple-300 transition-all duration-300 cursor-pointer hover:shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="text-white" size={24} />
              </div>
              <CardTitle className="text-2xl">Company</CardTitle>
              <CardDescription className="text-base">
                Manage your workforce and assign shifts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>Manage part-time employees</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span>Create and assign shifts</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span>Track employee hours and generate reports</span>
                </div>
              </div>
              <Button 
                className="w-full mt-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                onClick={() => onRoleSelect("company")}
              >
                Join as Company
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 pt-6 border-t">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <button 
            className="text-primary hover:underline font-medium"
            onClick={onClose}
          >
            Sign in instead
          </button>
        </p>
      </div>
    </div>
  );
}