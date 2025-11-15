import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useUniqueCodeGeneration = () => {
  const [generating, setGenerating] = useState(false);

  const generateCode = async (): Promise<string | null> => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-unique-code');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.success) {
        toast.success(`Unique code generated: ${data.code}`);
        return data.code;
      }
      
      throw new Error('Failed to generate code');
    } catch (error: any) {
      toast.error('Failed to generate code: ' + error.message);
      return null;
    } finally {
      setGenerating(false);
    }
  };

  return { generateCode, generating };
};
