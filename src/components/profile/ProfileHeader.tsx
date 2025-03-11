
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileHeaderProps {
  profilePhotoUrl: string | null;
  userName: string;
}

export default function ProfileHeader({ profilePhotoUrl, userName }: ProfileHeaderProps) {
  // Extract first letter of the name for the avatar fallback
  const initials = userName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Avatar className="w-24 h-24 border-2 border-primary">
        <AvatarImage src={profilePhotoUrl || ''} alt={userName} />
        <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <h2 className="text-2xl font-bold">{userName}</h2>
    </div>
  );
}
