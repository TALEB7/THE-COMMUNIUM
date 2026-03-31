'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth, useUser } from '@/lib/auth-client';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ShoppingBag,
  Coins,
  TrendingUp,
  MessageCircle,
  Bell,
  Award,
  GraduationCap,
  Calendar,
  Users2,
  Bookmark,
  MessagesSquare,
  Activity,
  Loader2,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { userId } = useAuth();
  const { user } = useUser();
  const { t } = useT();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => api.get(`/analytics/dashboard/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const tokens = dashboard?.tokens || {};
  const membership = dashboard?.membership;
  const notifications = dashboard?.notifications || {};
  const messages = dashboard?.messages || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-primary font-heading tracking-wide">
          {t.dashboard.greeting}, {user?.firstName ?? dashboard?.user?.firstName ?? 'Demo'} !
        </h1>
        <p className="text-muted-foreground">{t.dashboard.overview}</p>
        <div className="h-0.5 bg-gradient-to-r from-[#c9a730] via-[#e6c200] to-transparent max-w-xs mt-2" />
      </div>

      {/* Top Row — Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4 text-primary" />} label={t.dashboard.connectionsLabel} value={stats.connections ?? 0} />
        <StatCard icon={<ShoppingBag className="h-4 w-4 text-primary" />} label={t.dashboard.listingsLabel} value={stats.listings ?? 0} />
        <StatCard icon={<Coins className="h-4 w-4 text-primary" />} label={t.dashboard.tksBalance} value={tokens.balance ?? 0} sub={t.dashboard.tokensAvailable} />
        <StatCard icon={<TrendingUp className="h-4 w-4 text-primary" />} label={t.dashboard.profileViews} value={dashboard?.user?.profileViews ?? 0} sub={t.dashboard.total} />
      </div>

      {/* Second Row — Notifications + Messages + Membership */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Notifications */}
        <Card className="border-border">
          <CardContent className="pt-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.dashboard.notifications}</p>
                <p className="text-xs text-muted-foreground">{t.dashboard.unreadNotif.replace('{n}', String(notifications.unread ?? 0))}</p>
              </div>
            </div>
            <Link href="/notifications" className="text-xs text-primary font-semibold hover:underline">
              {t.common.see} <ArrowRight className="inline h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="border-border">
          <CardContent className="pt-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/100/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.dashboard.messages}</p>
                <p className="text-xs text-muted-foreground">{t.dashboard.unreadMsg.replace('{n}', String(messages.unread ?? 0))}</p>
              </div>
            </div>
            <Link href="/messages" className="text-xs text-primary font-semibold hover:underline">
              {t.common.see} <ArrowRight className="inline h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Membership */}
        <Card className="border-border">
          <CardContent className="pt-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.dashboard.membershipLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {membership?.plan ? (
                    <Badge variant="outline" className="text-[10px] border-primary text-primary">{membership.plan}</Badge>
                  ) : t.common.free}
                </p>
              </div>
            </div>
            <Link href="/membership" className="text-xs text-primary font-semibold hover:underline">
              {t.common.manage} <ArrowRight className="inline h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Third Row — Activity Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat icon={MessagesSquare} label={t.dashboard.forumPosts} value={stats.forumPosts ?? 0} />
        <MiniStat icon={Award} label={t.dashboard.badgesLabel} value={stats.badges ?? 0} />
        <MiniStat icon={GraduationCap} label={t.dashboard.mentorshipLabel} value={stats.mentorshipSessions ?? 0} />
        <MiniStat icon={Calendar} label={t.dashboard.eventsLabel} value={stats.events ?? 0} />
        <MiniStat icon={Users2} label={t.dashboard.groupsLabel} value={stats.groups ?? 0} />
        <MiniStat icon={Bookmark} label={t.dashboard.favoritesLabel} value={stats.bookmarks ?? 0} />
      </div>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-primary">{t.dashboard.quickActions}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction href="/profile" title={t.dashboard.completeProfile} description={t.dashboard.completeProfileDesc} />
          <QuickAction href="/marketplace" title={t.dashboard.exploreMarketplace} description={t.dashboard.exploreMarketplaceDesc} />
          <QuickAction href="/forums" title={t.dashboard.joinForums} description={t.dashboard.joinForumsDesc} />
          <QuickAction href="/events" title={t.dashboard.discoverEvents} description={t.dashboard.discoverEventsDesc} />
          <QuickAction href="/tokens" title={t.dashboard.myTokens} description={t.dashboard.myTokensDesc} />
          <QuickAction href="/badges" title={t.dashboard.myBadges} description={t.dashboard.myBadgesDesc} />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {dashboard?.recentActivity > 0 && (
        <Card className="border-border">
          <CardContent className="pt-5 flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              {t.dashboard.recentActivity.replace('{n}', String(dashboard.recentActivity))}
            </p>
            <Link href="/feed" className="ml-auto text-xs text-primary font-semibold hover:underline">
              {t.dashboard.seeFeed} <ArrowRight className="inline h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</div>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-center">
      <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
      <p className="text-lg font-bold text-primary">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAction({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="border border-border rounded-lg p-4 transition hover:border-primary hover:bg-accent/30 group"
    >
      <h3 className="font-semibold text-primary group-hover:text-primary transition-colors font-heading text-sm">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}
