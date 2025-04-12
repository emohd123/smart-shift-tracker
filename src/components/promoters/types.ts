
export interface PromoterData {
  id: string;
  full_name: string;
  phone_number: string;
  nationality: string;
  gender: string;
  verification_status: string;
  total_hours: number;
  total_shifts: number;
  average_rating: number;
  profile_photo_url: string | null;
  created_at: string;
  // Update the index signature to also allow boolean values
  [key: string]: string | number | boolean | null;
}
