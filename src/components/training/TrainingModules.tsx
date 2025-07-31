import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, Award, BookOpen, Play, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrainingModule {
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
}

interface UserProgress {
  progress_percentage: number;
  completed_at: string | null;
  certificate_issued: boolean;
  started_at: string;
}

interface UserCredits {
  credits_balance: number;
}

export default function TrainingModules() {
  const { isAuthenticated } = useAuth();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [userCredits, setUserCredits] = useState<UserCredits>({ credits_balance: 0 });
  const [loading, setLoading] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    loadModules();
    if (isAuthenticated) {
      loadUserProgress();
      loadUserCredits();
    }
  }, [isAuthenticated]);

  const loadModules = async () => {
    try {
      const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const loadUserProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('user_module_progress')
        .select('module_id, progress_percentage, completed_at, certificate_issued, started_at');

      if (error) throw error;
      
      const progressMap = (data || []).reduce((acc, item) => {
        acc[item.module_id] = {
          progress_percentage: item.progress_percentage,
          completed_at: item.completed_at,
          certificate_issued: item.certificate_issued,
          started_at: item.started_at
        };
        return acc;
      }, {} as Record<string, UserProgress>);
      
      setUserProgress(progressMap);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const loadUserCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_balance')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setUserCredits(data || { credits_balance: 0 });
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const handleEnroll = async (moduleId: string, priceCredits: number) => {
    if (!isAuthenticated) {
      toast.error("Please log in to enroll in training modules");
      return;
    }

    if (priceCredits > userCredits.credits_balance) {
      toast.error(`Insufficient credits. You need ${priceCredits} credits but only have ${userCredits.credits_balance}.`);
      return;
    }

    setEnrollingId(moduleId);
    try {
      const { data, error } = await supabase.functions.invoke('enroll-training', {
        body: { moduleId }
      });

      if (error) throw error;

      toast.success("Successfully enrolled in training module!");
      loadUserProgress();
      loadUserCredits();
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error("Failed to enroll in module");
    } finally {
      setEnrollingId(null);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'interactive': return Users;
      case 'mixed': return BookOpen;
      default: return BookOpen;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Training Modules</h2>
        <p className="text-muted-foreground">
          Enhance your skills with our professional training courses
        </p>
        {isAuthenticated && (
          <Badge variant="outline" className="text-sm">
            <Award className="h-3 w-3 mr-1" />
            Credits Available: {userCredits.credits_balance}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const ContentIcon = getContentTypeIcon(module.content_type);
          const progress = userProgress[module.id];
          const isEnrolled = !!progress;
          const isCompleted = progress?.progress_percentage === 100;
          const canEnroll = isAuthenticated && !isEnrolled && userCredits.credits_balance >= module.price_credits;

          return (
            <Card key={module.id} className="h-full flex flex-col">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <Badge className={getDifficultyColor(module.difficulty_level)}>
                    {module.difficulty_level}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ContentIcon className="h-4 w-4" />
                    {module.content_type}
                  </div>
                </div>
                
                <CardTitle className="text-lg">{module.title}</CardTitle>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {module.estimated_duration} min
                  </div>
                  <Badge variant="secondary">
                    {module.category}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <CardDescription className="line-clamp-3">
                  {module.description}
                </CardDescription>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Skills you'll learn:</p>
                  <div className="flex flex-wrap gap-1">
                    {module.skills_covered.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {module.skills_covered.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{module.skills_covered.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {isEnrolled && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress.progress_percentage}%</span>
                    </div>
                    <Progress value={progress.progress_percentage} className="h-2" />
                    {isCompleted && (
                      <Badge className="bg-green-500">
                        <Award className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      {module.price_credits === 0 ? 'Free' : `${module.price_credits} credits`}
                    </span>
                  </div>

                  {isEnrolled ? (
                    <Button className="w-full" variant={isCompleted ? "secondary" : "default"}>
                      {isCompleted ? "Review Course" : "Continue Learning"}
                    </Button>
                  ) : isAuthenticated ? (
                    <Button
                      onClick={() => handleEnroll(module.id, module.price_credits)}
                      disabled={!canEnroll || enrollingId === module.id}
                      className="w-full"
                      variant={canEnroll ? "default" : "outline"}
                    >
                      {enrollingId === module.id ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Enrolling...
                        </div>
                      ) : !canEnroll && module.price_credits > 0 ? (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Need {module.price_credits - userCredits.credits_balance} more credits
                        </div>
                      ) : (
                        `Enroll ${module.price_credits > 0 ? `(${module.price_credits} credits)` : '(Free)'}`
                      )}
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Login to Enroll
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {modules.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Training Modules Available</h3>
            <p className="text-muted-foreground">
              Training modules will appear here once they are published.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}