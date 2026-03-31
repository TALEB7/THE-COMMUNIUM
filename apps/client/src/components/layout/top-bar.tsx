'use client';

import { Bell, Search, User } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

let useUser: () => { user: any } = () => ({ user: null });
let UserButton: React.ComponentType<any> = () => null;

try {
  // Only load Clerk hooks if the provider is available
  const clerk = require('@/lib/auth-client');
  if (
    typeof window !== 'undefined' ||
    (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder' &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_'))
  ) {
    useUser = clerk.useUser;
    UserButton = clerk.UserButton;
  }
} catch {
  // Clerk not available
}

export function TopBar() {
  let user: any = null;
  try {
    const result = useUser();
    user = result?.user;
  } catch {
    // Clerk not configured
  }

  return (
    <header className="flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-8 py-4 sticky top-0 z-30">
      {/* Search */}
      <div className="flex max-w-lg flex-1 items-center gap-3 rounded-2xl border border-border bg-background/50 px-4 py-2.5 transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_20px_rgba(212,175,55,0.1)]">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher des membres, discussions, opportunités..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        <ModeToggle />

        {/* Notifications */}
        <button className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-muted hover:text-primary transition-all group">
          <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary border-2 border-card" />
        </button>

        {/* User */}
        <div className="flex items-center gap-4 pl-4 border-l border-border/50">
          <div className="hidden text-right lg:block">
            <p className="text-sm font-bold text-foreground leading-tight">
              {user?.firstName ?? 'Demo'} {user?.lastName ?? 'User'}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-tight">
              {user?.accountType === 'business' ? 'Compte Business' : 'Membre Platinum'}
            </p>
          </div>
          {user ? (
            <div className="ring-2 ring-primary/20 rounded-full p-0.5 transition-transform hover:scale-110">
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary/10 transition-transform hover:scale-110">
              <User className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
