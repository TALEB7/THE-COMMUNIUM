'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  ShoppingBag,
  Gavel,
  Settings,
  Coins,
  CreditCard,
  GraduationCap,
  Shield,
  Search,
  Building2,
  GitCompareArrows,
  BellRing,
  MessagesSquare,
  Calendar,
  Users2,
  Link2,
  Activity,
  ChevronDown,
  Award,
  BarChart3,
  Bookmark,
  Megaphone,
  HelpCircle,
  MessageSquareQuote,
  Mail,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-client';

/* ─── Icon map (href → icon) ─── */
const iconMap: Record<string, any> = {
  '/dashboard': LayoutDashboard,
  '/feed': Activity,
  '/profile': User,
  '/forums': MessagesSquare,
  '/groups': Users2,
  '/events': Calendar,
  '/connections': Link2,
  '/mentorship': GraduationCap,
  '/polls': BarChart3,
  '/announcements': Megaphone,
  '/testimonials': MessageSquareQuote,
  '/marketplace': ShoppingBag,
  '/auctions': Gavel,
  '/comparisons': GitCompareArrows,
  '/alerts': BellRing,
  '/search': Search,
  '/company-creation': Building2,
  '/badges': Award,
  '/bookmarks': Bookmark,
  '/faq': HelpCircle,
  '/contact': Mail,
  '/tokens': Coins,
  '/membership': CreditCard,
  '/admin': Shield,
  '/settings': Settings,
};

function useSections() {
  const { t } = useT();
  return [
    {
      label: null,
      items: [
        { name: t.nav.dashboard, href: '/dashboard' },
        { name: t.nav.feed, href: '/feed' },
        { name: t.nav.profile, href: '/profile' },
      ],
    },
    {
      label: t.nav.community,
      items: [
        { name: t.nav.forums, href: '/forums' },
        { name: t.nav.groups, href: '/groups' },
        { name: t.nav.events, href: '/events' },
        { name: t.nav.connections, href: '/connections' },
        { name: t.nav.mentorship, href: '/mentorship' },
        { name: t.nav.polls, href: '/polls' },
        { name: t.nav.announcements, href: '/announcements' },
        { name: t.nav.testimonials, href: '/testimonials' },
      ],
    },
    {
      label: t.nav.commerce,
      items: [
        { name: t.nav.marketplace, href: '/marketplace' },
        { name: t.nav.auctions, href: '/auctions' },
        { name: t.nav.comparisons, href: '/comparisons' },
        { name: t.nav.priceAlerts, href: '/alerts' },
      ],
    },
    {
      label: t.nav.tools,
      items: [
        { name: t.nav.search, href: '/search' },
        { name: t.nav.companyCreation, href: '/company-creation' },
        { name: t.nav.badges, href: '/badges' },
        { name: t.nav.bookmarks, href: '/bookmarks' },
        { name: t.nav.helpCenter, href: '/faq' },
        { name: t.nav.contact, href: '/contact' },
      ],
    },
    {
      label: t.nav.account,
      items: [
        { name: t.nav.tokens, href: '/tokens' },
        { name: t.nav.membership, href: '/membership' },
        { name: t.nav.admin, href: '/admin' },
        { name: t.nav.settings, href: '/settings' },
      ],
    },
  ];
}

function SidebarSection({
  label,
  items,
  pathname,
  defaultOpen = true,
}: {
  label: string | null;
  items: { name: string; href: string }[];
  pathname: string;
  defaultOpen?: boolean;
}) {
  const hasActive = items.some(
    (i) => pathname === i.href || pathname.startsWith(i.href + '/'),
  );
  const [open, setOpen] = useState(defaultOpen || hasActive);

  return (
    <div>
      {label && (
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between px-3 py-1.5 mt-1 mb-0.5"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 dark:text-[#808080]">
            {label}
          </span>
          <ChevronDown
            className={cn(
              'h-3 w-3 text-primary/40 dark:text-[#606060] transition-transform duration-200',
              open ? '' : '-rotate-90',
            )}
          />
        </button>
      )}
      {(open || !label) && (
        <div className="space-y-0.5">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = iconMap[item.href];
            return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] transition-all duration-300 relative group',
                      isActive
                        ? 'bg-primary text-black font-bold shadow-lg shadow-primary/20 scale-[1.02]'
                        : 'text-muted-foreground dark:text-[#b0b0b0] hover:bg-muted dark:hover:bg-[#1a1a1a] hover:text-foreground dark:hover:text-white'
                    )}
                  >
                    {Icon && (
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110',
                          isActive ? 'text-black' : 'text-muted-foreground dark:text-[#b0b0b0]'
                        )}
                      />
                    )}
                    <span className="truncate">{item.name}</span>
                  </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const sections = useSections();
  const { signOut: handleSignOut } = useAuth();
  const { t } = useT();

  return (
    <aside className="hidden w-60 border-r border-border bg-card dark:bg-[#0a0a0a] dark:border-[#1a1a1a] lg:block overflow-y-auto">
      <div className="flex h-full flex-col">
        <nav className="flex-1 px-2 py-3 space-y-1">
          {sections.map((section, i) => (
            <div key={section.label || 'top'}>
              {i > 0 && section.label && (
                <div className="mx-3 my-1 border-t border-border/40 dark:border-[#1a1a1a]" />
              )}
              <SidebarSection
                label={section.label}
                items={section.items}
                pathname={pathname}
                defaultOpen={i < 3}
              />
            </div>
          ))}
        </nav>

        <div className="border-t border-border/40 dark:border-[#1a1a1a] px-4 py-2.5 space-y-2">
          <button
            onClick={() => handleSignOut()}
            className="flex items-center gap-2.5 w-full text-left font-medium text-destructive hover:text-destructive/80 transition-colors py-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-[13px]">{t.header?.signOut || 'Se déconnecter'}</span>
          </button>
          <p className="text-[10px] text-muted-foreground font-heading tracking-wide uppercase">
            &copy; 2026 The Communium
          </p>
        </div>
      </div>
    </aside>
  );
}
