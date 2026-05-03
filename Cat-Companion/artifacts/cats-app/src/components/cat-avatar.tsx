import { Cat } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface CatAvatarProps {
  photoUrl?: string | null;
  name?: string;
  className?: string;
  fallbackClassName?: string;
}

export function CatAvatar({ photoUrl, name, className, fallbackClassName }: CatAvatarProps) {
  return (
    <Avatar className={cn("border border-border shadow-sm", className)}>
      {photoUrl ? (
        <AvatarImage src={photoUrl} alt={name || "Cat"} className="object-cover" />
      ) : null}
      <AvatarFallback className={cn("bg-secondary text-secondary-foreground", fallbackClassName)}>
        <Cat className="h-1/2 w-1/2 opacity-50" />
      </AvatarFallback>
    </Avatar>
  );
}
