import { supabase } from "@/integrations/supabase/client";

/**
 * Generate unique promoter codes in format: PROMO-XXXXXX
 * Where XXXXXX is a random 6-character alphanumeric string
 */
export const generateUniquePromoterCode = (): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar chars (I, O, 0, 1)
  let code = 'PROMO-';
  
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return code;
};

/**
 * Check if code already exists in database
 */
export const checkCodeExists = async (code: string): Promise<boolean> => {
  const { data } = await supabase
    .from('profiles')
    .select('unique_code')
    .eq('unique_code', code)
    .maybeSingle();
  
  return !!data;
};

/**
 * Generate unique code with collision detection
 */
export const generateUniqueCode = async (): Promise<string> => {
  let code = generateUniquePromoterCode();
  let attempts = 0;
  const maxAttempts = 10;
  
  while (await checkCodeExists(code) && attempts < maxAttempts) {
    code = generateUniquePromoterCode();
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique code after 10 attempts');
  }
  
  return code;
};
