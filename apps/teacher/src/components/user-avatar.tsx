import { Avatar, AvatarFallback, AvatarImage } from "@package/ui";
import BoringAvatar from "boring-avatars";

interface UserAvatarProps {
  id: string;
  pictureUrl?: string;
  name: string;
  size?: number;
}

export function UserAvatar({
  id,
  pictureUrl,
  name,
  size = 24,
}: UserAvatarProps) {
  return (
    <Avatar style={{ width: size, height: size }}>
      <AvatarImage src={pictureUrl} alt={name} />
      <AvatarFallback className="p-0">
        <BoringAvatar
          name={id}
          variant="marble"
          size={size}
          style={{ width: size, height: size }}
        />
      </AvatarFallback>
    </Avatar>
  );
}
