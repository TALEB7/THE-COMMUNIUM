'use client';

import Link from 'next/link';
import Image from 'next/image';
import { SignedIn, SignedOut } from '@/lib/auth-client';
import { UserProfileCard } from '@/components/layout/user-profile-card';
import { HeaderDropdowns } from '@/components/layout/header-dropdowns';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { MessageSquare, Bell, Search } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { ModeToggle } from '@/components/mode-toggle';

export function DashboardHeader() {
  const { t } = useT();

  return (
    <header className="sticky top-0 z-30 bg-card dark:bg-[#0a0a0a]/95 dark:backdrop-blur-xl border-b border-border dark:border-[#1a1a1a]">
      <div className="flex items-center justify-between px-6 py-3">
        {/* LEFT — Brand + Profile */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <img
              src="/communium_logo.png"
              alt="The Communium"
              width="36"
              height="36"
              className="rounded object-contain"
            />
            <div className="hidden sm:block">
              <span className="text-lg font-extrabold text-primary font-heading tracking-wider uppercase">
                The Communium
              </span>
              <div className="h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
            </div>
          </Link>
          <div className="w-px h-6 bg-border dark:bg-[#1a1a1a] hidden sm:block" />
          <SignedIn>
            <UserProfileCard />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="text-sm text-primary hover:text-primary/80 font-semibold">
              {t.header.signIn}
            </Link>
          </SignedOut>
          <div className="w-px h-6 bg-border dark:bg-[#1a1a1a] hidden md:block" />
          <HeaderDropdowns />
        </div>

        {/* RIGHT — Quick actions */}
        <div className="flex items-center gap-1">
          <ModeToggle />
          <div className="w-px h-6 bg-border dark:bg-[#1a1a1a] mx-1 hidden sm:block" />
          <LanguageSwitcher />
          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
          <Link
            href="/search"
            className="p-2 text-muted-foreground dark:text-[#b0b0b0] hover:text-primary dark:hover:text-white dark:hover:bg-[#1a1a1a] hover:bg-accent rounded-lg transition-all"
            title={t.header.searchTooltip}
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/messages"
            className="relative p-2 text-muted-foreground dark:text-[#b0b0b0] hover:text-primary dark:hover:text-white dark:hover:bg-[#1a1a1a] hover:bg-accent rounded-lg transition-all"
            title={t.header.messagesTooltip}
          >
            <MessageSquare className="h-5 w-5" />
          </Link>
          <Link
            href="/notifications"
            className="relative p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-all"
            title={t.header.notificationsTooltip}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive/100 rounded-full" />
          </Link>
          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
          <Link
            href="/tokens"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-accent rounded-lg transition-all"
          >
            <span>★</span>
            <span>0 Tks</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
