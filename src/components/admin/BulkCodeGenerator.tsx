import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";

export function BulkCodeGenerator() {
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ total: 0, processed: 0, failed: 0 });

  const generateAllCodes = async () => {
    setProcessing(true);
    setStats({ total: 0, processed: 0, failed: 0 });
    
    try {
      // Fetch all promoters without codes
      const { data: promoters, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('role', 'promoter')
        .is('unique_code', null);

      if (error) throw error;

      const total = promoters?.length || 0;
      setStats({ total, processed: 0, failed: 0 });

      if (total === 0) {
        toast.info('All promoters already have unique codes!');
        setProcessing(false);
        return;
      }

      let processed = 0;
      let failed = 0;

      // Generate codes for each
      for (const promoter of promoters || []) {
        try {
          const { data, error: generateError } = await supabase.functions.invoke(
            'generate-unique-code'
          );

          if (generateError || !data?.success) {
            failed++;
            console.error(`Failed to generate code for ${promoter.email}:`, generateError);
          } else {
            processed++;
          }
          
          setStats({ total, processed: processed + failed, failed });
        } catch (err) {
          failed++;
          console.error(`Error generating code for ${promoter.email}:`, err);
        }
      }

      if (failed > 0) {
        toast.warning(`Generated codes for ${processed} promoters. ${failed} failed.`);
      } else {
        toast.success(`Successfully generated codes for ${processed} promoters!`);
      }
    } catch (error: any) {
      toast.error('Failed to generate codes: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Generate Unique Codes
        </CardTitle>
        <CardDescription>
          Generate unique codes for all promoters who don't have one yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {processing && stats.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress:</span>
              <span className="font-medium">
                {stats.processed} / {stats.total}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.processed / stats.total) * 100}%` }}
              />
            </div>
            {stats.failed > 0 && (
              <p className="text-sm text-destructive">
                {stats.failed} failed
              </p>
            )}
          </div>
        )}

        <Button 
          onClick={generateAllCodes} 
          disabled={processing}
          className="w-full"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Codes...
            </>
          ) : (
            "Generate Codes for All Promoters"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
