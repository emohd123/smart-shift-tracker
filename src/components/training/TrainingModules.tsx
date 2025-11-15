import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Award, PlayCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TrainingModule = {
  id: string;
  title: string;
  description: string;
  content_type: string;
  difficulty_level: string;
  estimated_duration: number;
  price_credits: number;
  category: string;
  skills_covered: string[];
  preview_content: string;
};

export default function TrainingModules() {
  const { isAuthenticated, subscription } = useAuth();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
    if (isAuthenticated) {
      fetchUserCredits();
    }
  }, [isAuthenticated]);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from("training_modules")
        .select("*")
        .eq("is_active", true)
        .order("price_credits", { ascending: true });
      
      if (error) throw error;
      
      // Map the data to ensure estimated_duration is treated as number
      const mappedData = (data || []).map(module => ({
        ...module,
        estimated_duration: typeof module.estimated_duration === 'string' 
          ? parseInt(module.estimated_duration) || 0
          : module.estimated_duration
      }));
      
      setModules(mappedData);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const { data } = await supabase
        .from("user_credits")
        .select("credits_balance")
        .single();
      
      if (data) {
        setUserCredits(data.credits_balance);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    }
  };

  const handleEnrollModule = async (moduleId: string, creditsRequired: number) => {
    if (!isAuthenticated) {
      toast.error("Please log in to enroll in training modules");
      return;
    }

    // Check if user is subscribed (premium users get free access)
    if (subscription?.subscribed && ['premium', 'enterprise'].includes(subscription.subscription_tier)) {
      toast.success("Free access with your premium subscription!");
      // Redirect to module content or mark as enrolled
      return;
    }

    if (userCredits < creditsRequired) {
      toast.error(`Insufficient credits. You need ${creditsRequired} credits for this module.`);
      return;
    }

    setLoading(moduleId);
    try {
      const { data, error } = await supabase.functions.invoke('use-credits', {
        body: { 
          certificateId: moduleId, 
          creditsRequired 
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Successfully enrolled in training module!");
        setUserCredits(data.remainingBalance);
        
        // Record enrollment - get current user ID
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase
            .from("user_module_progress")
            .insert({
              user_id: userData.user.id,
              module_id: moduleId,
              progress_percentage: 0
            });
        }
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error("Failed to enroll in module");
    } finally {
      setLoading(null);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircle className="h-4 w-4" />;
      case 'interactive': return <Award className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Professional Training Modules</h2>
        <p className="text-muted-foreground">
          Enhance your skills with expert-designed training courses
        </p>
        {isAuthenticated && (
          <p className="text-sm text-muted-foreground">
            Current Credits: <strong>{userCredits}</strong>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => (
          <Card key={module.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {module.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getDifficultyColor(module.difficulty_level)}>
                    {module.difficulty_level}
                  </Badge>
                  {module.price_credits > 0 && (
                    <Badge variant="outline">
                      {module.price_credits} credits
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{module.estimated_duration} min</span>
                </div>
                <div className="flex items-center gap-1">
                  {getContentTypeIcon(module.content_type)}
                  <span className="capitalize">{module.content_type}</span>
                </div>
                <Badge variant="secondary">{module.category}</Badge>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Skills You'll Learn:</h4>
                <div className="flex flex-wrap gap-1">
                  {module.skills_covered.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Preview:</h4>
                <p className="text-sm text-muted-foreground">
                  {module.preview_content}
                </p>
              </div>

              <Button
                onClick={() => handleEnrollModule(module.id, module.price_credits)}
                disabled={loading === module.id || (!isAuthenticated)}
                className="w-full"
                variant={module.price_credits === 0 ? "default" : "outline"}
              >
                {loading === module.id ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Enrolling...
                  </div>
                ) : (
                  <>
                    {module.price_credits === 0 ? "Start Free Course" : 
                     subscription?.subscribed && ['premium', 'enterprise'].includes(subscription.subscription_tier) ? 
                     "Access with Subscription" : `Enroll for ${module.price_credits} Credits`}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {subscription?.subscribed && (
        <div className="text-center bg-primary/5 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Premium Benefit:</strong> As a {subscription.subscription_tier} subscriber, you get free access to all training modules!
          </p>
        </div>
      )}
    </div>
  );
}