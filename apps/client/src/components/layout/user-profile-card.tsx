'use client';

import { User } from 'lucide-react';
import Link from 'next/link';

import { useUser } from '@/lib/auth-client';

export function UserProfileCard() {
  const { user } = useUser();

  const firstName = user?.firstName ?? 'Demo';
  const lastName = user?.lastName ?? 'User';
  const fullName = `${firstName} ${lastName}`;
  const memberId = user?.id ? `#${user.id.slice(-6).toUpperCase()}` : '#COM-001';

  return (
    <Link href="/profile" className="flex items-center gap-3 rounded-lg border-2 border-primary/40 dark:border-[#333] bg-card dark:bg-[#121212] px-3 py-2 shadow-sm hover:border-primary dark:hover:border-[#555] hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(160,160,160,0.15)] transition-all cursor-pointer">
      {/* Avatar — circular with glowing gray gradient border */}
      <div className="avatar-glow h-9 w-9">
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={fullName}
            className="h-full w-full object-cover rounded-full"
          />
        ) : (
          <User className="h-5 w-5 text-primary dark:text-[#b0b0b0]" />
        )}
      </div>

      {/* Name & ID */}
      <div className="hidden sm:block leading-tight">
        <p className="text-sm font-bold text-foreground font-heading truncate max-w-[120px]">
          {fullName}
        </p>
        <p className="text-[10px] font-medium text-primary dark:text-[#808080] tracking-wider">
          {memberId}
        </p>
      </div>
    </Link>
  );
}
