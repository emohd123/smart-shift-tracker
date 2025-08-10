import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Gift, 
  Users, 
  Clock, 
  CheckCircle,
  Medal,
  Crown,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  category: "shifts" | "time" | "certificates" | "engagement";
}

interface UserLevel {
  level: number;
  title: string;
  pointsRequired: number;
  perks: string[];
}

interface GamificationProps {
  userId?: string;
  className?: string;
}

export const GamificationSystem: React.FC<GamificationProps> = ({ userId, className }) => {
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);

  const levels: UserLevel[] = [
    {
      level: 1,
      title: "Rookie",
      pointsRequired: 0,
      perks: ["Basic features access"]
    },
    {
      level: 2,
      title: "Promoter",
      pointsRequired: 500,
      perks: ["Priority support", "Early access to features"]
    },
    {
      level: 3,
      title: "Expert",
      pointsRequired: 1000,
      perks: ["Advanced analytics", "Custom certificates", "Bonus credits"]
    },
    {
      level: 4,
      title: "Champion",
      pointsRequired: 2000,
      perks: ["VIP support", "Exclusive training", "Revenue sharing"]
    },
    {
      level: 5,
      title: "Legend",
      pointsRequired: 5000,
      perks: ["All features", "Partner benefits", "Leadership program"]
    }
  ];


  const currentLevel = levels.find(l => l.level === userLevel);
  const nextLevel = levels.find(l => l.level === userLevel + 1);
  const levelProgress = nextLevel 
    ? ((userPoints - currentLevel!.pointsRequired) / (nextLevel.pointsRequired - currentLevel!.pointsRequired)) * 100 
    : 100;

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const pendingAchievements = achievements.filter(a => !a.unlocked);

  const claimReward = (achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlocked) {
      const updatedAchievements = achievements.map(a => 
        a.id === achievementId ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a
      );
      setAchievements(updatedAchievements);
      setUserPoints(prev => prev + achievement.points);
      setRecentAchievement(achievement);
      
      toast.success(`Achievement Unlocked: ${achievement.title}!`, {
        description: `You earned ${achievement.points} points!`
      });
    }
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'shifts':
        return <Zap className="h-4 w-4" />;
      case 'time':
        return <Clock className="h-4 w-4" />;
      case 'certificates':
        return <Medal className="h-4 w-4" />;
      case 'engagement':
        return <Users className="h-4 w-4" />;
    }
  };

  const getLevelIcon = (level: number) => {
    if (level >= 5) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (level >= 4) return <Trophy className="h-5 w-5 text-purple-500" />;
    if (level >= 3) return <Medal className="h-5 w-5 text-blue-500" />;
    return <Star className="h-5 w-5 text-green-500" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* User Level and Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getLevelIcon(userLevel)}
              <div>
                <CardTitle className="text-lg">Level {userLevel} - {currentLevel?.title}</CardTitle>
                <CardDescription>{userPoints} total points earned</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {userPoints} XP
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {userLevel + 1}</span>
              <span>{Math.round(levelProgress)}%</span>
            </div>
            <Progress value={levelProgress} className="h-2" />
            {nextLevel && (
              <p className="text-xs text-muted-foreground">
                {nextLevel.pointsRequired - userPoints} points needed for next level
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Level Perks */}
      {currentLevel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Level Perks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentLevel.perks.map((perk, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unlockedAchievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                  <Badge variant="secondary">+{achievement.points}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingAchievements.filter(a => a.progress !== undefined).map((achievement) => (
                <div key={achievement.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-muted text-muted-foreground">
                        {achievement.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {achievement.progress}/{achievement.maxProgress}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">+{achievement.points}</Badge>
                  </div>
                  <Progress 
                    value={(achievement.progress! / achievement.maxProgress!) * 100} 
                    className="h-1" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>All Achievements</CardTitle>
          <CardDescription>Complete challenges to earn points and unlock rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`p-4 rounded-lg border transition-all ${
                  achievement.unlocked 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-muted/30 border-muted'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-full ${
                    achievement.unlocked 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {achievement.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    {getCategoryIcon(achievement.category)}
                    <Badge variant={achievement.unlocked ? "default" : "secondary"}>
                      +{achievement.points}
                    </Badge>
                  </div>
                </div>
                
                <h4 className="font-medium mb-1">{achievement.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                
                {achievement.unlocked ? (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                ) : achievement.progress !== undefined ? (
                  <div className="space-y-1">
                    <Progress 
                      value={(achievement.progress / achievement.maxProgress!) * 100} 
                      className="h-1" 
                    />
                    <p className="text-xs text-muted-foreground">
                      {achievement.progress}/{achievement.maxProgress}
                    </p>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Locked
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};