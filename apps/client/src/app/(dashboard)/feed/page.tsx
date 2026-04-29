'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-client';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { getMediaUrl } from '@/lib/media-url';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Loader2,
  ShoppingBag,
  Gavel,
  Calendar,
  Users,
  GraduationCap,
  Trophy,
  MessageCircle,
  Link2,
  Globe,
  User,
} from 'lucide-react';

type FeedType = 'global' | 'personal';

export default function FeedPage() {
  const { t } = useT();
  const { userId } = useAuth();
  const [feedType, setFeedType] = useState<FeedType>('global');

  const typeConfig: Record<string, { icon: any; label: string; bg: string; text: string }> = {
    POST:        { icon: MessageCircle, label: t.feed.post,           bg: 'bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-400' },
    LISTING:     { icon: ShoppingBag,  label: t.feed.listing,         bg: 'bg-green-500/10',   text: 'text-green-600 dark:text-green-400' },
    AUCTION:     { icon: Gavel,        label: t.feed.auctionType,     bg: 'bg-orange-500/10',  text: 'text-orange-600 dark:text-orange-400' },
    EVENT:       { icon: Calendar,     label: t.feed.event,           bg: 'bg-purple-500/10',  text: 'text-purple-600 dark:text-purple-400' },
    CONNECTION:  { icon: Link2,        label: t.feed.connection,      bg: 'bg-sky-500/10',     text: 'text-sky-600 dark:text-sky-400' },
    GROUP_JOIN:  { icon: Users,        label: t.feed.group,           bg: 'bg-teal-500/10',    text: 'text-teal-600 dark:text-teal-400' },
    MENTORSHIP:  { icon: GraduationCap,label: t.feed.mentorshipType,  bg: 'bg-indigo-500/10',  text: 'text-indigo-600 dark:text-indigo-400' },
    ACHIEVEMENT: { icon: Trophy,       label: t.feed.achievement,     bg: 'bg-primary/10',     text: 'text-primary' },
  };

  // Global feed
  const { data: globalFeed, isLoading: globalLoading } = useQuery({
    queryKey: ['feed-global'],
    queryFn: () => api.get('/activity-feed/global').then((r) => r.data),
    enabled: feedType === 'global',
  });

  // Personal feed
  const { data: personalFeed, isLoading: personalLoading } = useQuery({
    queryKey: ['feed-personal', userId],
    queryFn: () => api.get(`/activity-feed/personal/${userId}`).then((r) => r.data),
    enabled: feedType === 'personal' && !!userId,
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['feed-stats', userId],
    queryFn: () => api.get(`/activity-feed/stats/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  const feed = feedType === 'global' ? globalFeed : personalFeed;
  const isLoading = feedType === 'global' ? globalLoading : personalLoading;

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return t.common.timeJustNow;
    if (min < 60) return t.common.timeMinAgo.replace('{n}', String(min));
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return t.common.timeHoursAgo.replace('{n}', String(hrs));
    const days = Math.floor(hrs / 24);
    return t.common.timeDaysAgo.replace('{n}', String(days));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-heading">{`📰 ${t.feed.title}`}</h1>
          <p className="text-sm text-muted-foreground">{t.feed.description}</p>
        </div>
        {stats && (
          <Badge variant="outline" className="border-[#C8102E] text-primary text-xs">
            {stats.totalActivities} {t.feed.activities}
          </Badge>
        )}
      </div>

      {/* Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setFeedType('global')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition ${
            feedType === 'global' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground/80'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          {t.feed.global}
        </button>
        <button
          onClick={() => setFeedType('personal')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition ${
            feedType === 'personal' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground/80'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          {t.feed.myNetwork}
        </button>
      </div>

      {/* Feed items */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !feed?.items?.length ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <Activity className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">{t.feed.noActivity}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {feedType === 'personal'
                ? t.feed.noActivityPersonal
                : t.feed.noActivityGlobal}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {feed.items.map((item: any) => {
            const config = typeConfig[item.type] || typeConfig.POST;
            const Icon = config.icon;
            return (
              <Card key={item.id} className="border-border hover:border-primary/50 transition">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Activity type icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
                      <Icon className={`h-5 w-5 ${config.text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <img
                            src={getMediaUrl(item.user?.avatarUrl) || '/default-avatar.png'}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <p className="text-sm">
                            <span className="font-semibold text-primary">
                              {item.user?.firstName} {item.user?.lastName}
                            </span>
                          </p>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-current ${config.text}`}>
                            {config.label}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{formatTime(item.createdAt)}</span>
                      </div>

                      {item.title && (
                        <p className="text-sm font-medium text-foreground mt-1">{item.title}</p>
                      )}
                      {item.content && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-3">{item.content}</p>
                      )}

                      {/* Metadata */}
                      {item.metadata && (
                        <div className="flex gap-2 mt-2">
                          {item.metadata.price && (
                            <Badge variant="secondary" className="text-xs">{item.metadata.price} MAD</Badge>
                          )}
                          {item.metadata.city && (
                            <Badge variant="outline" className="text-xs">{item.metadata.city}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Activity stats */}
      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground/80 mb-3">{t.feed.activitiesByType}</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]: [string, any]) => {
                const config = typeConfig[type] || typeConfig.POST;
                const Icon = config.icon;
                return (
                  <div
                    key={type}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}: {count}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
