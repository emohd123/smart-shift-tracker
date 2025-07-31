import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, Users, Gift, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ReferralStats {
  referralsCount: number;
  totalEarnings: number;
  pendingRewards: number;
  conversionRate: number;
}

interface Referral {
  id: string;
  email: string;
  status: 'pending' | 'completed' | 'cancelled';
  reward: number;
  createdAt: string;
}

const ReferralProgram: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [referralCode] = useState('REF123ABC'); // In real app, get from user profile
  
  // Mock data - in real app, fetch from API
  const stats: ReferralStats = {
    referralsCount: 12,
    totalEarnings: 240,
    pendingRewards: 60,
    conversionRate: 75
  };

  const referrals: Referral[] = [
    {
      id: '1',
      email: 'john@example.com',
      status: 'completed',
      reward: 20,
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      email: 'sarah@example.com',
      status: 'pending',
      reward: 20,
      createdAt: '2024-01-20'
    }
  ];

  const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join SmartShift and earn money!',
          text: 'Sign up for SmartShift and start earning with flexible shifts!',
          url: referralUrl
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Referral Program</h1>
        <p className="text-muted-foreground">
          Earn rewards by inviting friends to join SmartShift
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.referralsCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingRewards}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="share" className="space-y-4">
        <TabsList>
          <TabsTrigger value="share">Share & Earn</TabsTrigger>
          <TabsTrigger value="history">Referral History</TabsTrigger>
        </TabsList>

        <TabsContent value="share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Share Your Referral Link</CardTitle>
              <CardDescription>
                Earn $20 for every friend who signs up and completes their first shift
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={referralUrl} readOnly className="flex-1" />
                <Button onClick={handleCopyLink} variant="outline">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleShare} className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">How it works:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Share your unique referral link with friends</li>
                  <li>• They sign up using your link</li>
                  <li>• Once they complete their first shift, you both earn $20!</li>
                  <li>• No limit on referrals - the more you refer, the more you earn</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Referrals</CardTitle>
              <CardDescription>
                Track the status of your referrals and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{referral.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Referred on {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={referral.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {referral.status}
                      </Badge>
                      <span className="font-medium">${referral.reward}</span>
                    </div>
                  </div>
                ))}
                
                {referrals.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No referrals yet. Start sharing your link to earn rewards!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferralProgram;