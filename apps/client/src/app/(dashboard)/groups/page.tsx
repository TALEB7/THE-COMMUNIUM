'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-url';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Plus, Loader2, ArrowLeft, Crown, Shield, Search } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { GroupCard } from '@/components/groups/group-card';
import { GroupHeader } from '@/components/groups/group-header';
import { GroupPostCard } from '@/components/groups/group-post-card';
import { CreateGroupForm } from '@/components/groups/create-group-form';
import {
  useGroups, useGroup, useGroupPosts, useActiveMeeting,
  useCreateGroup, useJoinGroup, useLeaveGroup,
  useCreateGroupPost, useStartMeeting,
} from '@/hooks/groups/use-groups';
import { Send } from 'lucide-react';

type ViewMode = 'browse' | 'detail' | 'create';

export default function GroupsPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const { t } = useT();

  const [view, setView] = useState<ViewMode>('browse');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [postContent, setPostContent] = useState('');

  const { data: groupsData, isLoading } = useGroups(searchQuery);
  const { data: group, isLoading: groupLoading } = useGroup(view === 'detail' ? selectedGroupId : null);
  const { data: postsData } = useGroupPosts(view === 'detail' ? selectedGroupId : null);

  const isMember = group?.members?.some((m) => m.userId === userId) ?? false;
  const isOwner = group?.ownerId === userId;

  const { data: activeMeeting } = useActiveMeeting(view === 'detail' ? selectedGroupId : null, isMember);

  const createGroup = useCreateGroup(() => { setView('browse'); });
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const createPost = useCreateGroupPost(selectedGroupId);
  const startMeeting = useStartMeeting();

  const openDetail = (id: string) => { setSelectedGroupId(id); setView('detail'); };

  // ── BROWSE ──
  if (view === 'browse') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary font-heading">👥 {t.groups.title}</h1>
            <p className="text-sm text-muted-foreground">{t.groups.description}</p>
          </div>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:brightness-110 transition"
          >
            <Plus className="h-4 w-4" />
            {t.groups.createGroup}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.groups.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !groupsData?.groups?.length ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">{t.groups.noGroups}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.groups.noGroupsDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupsData.groups.map((g) => (
              <GroupCard key={g.id} group={g} onClick={() => openDetail(g.id)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── DETAIL ──
  if (view === 'detail') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => setView('browse')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition">
          <ArrowLeft className="h-4 w-4" />
          {t.groups.allGroups}
        </button>

        {groupLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !group ? (
          <p className="text-muted-foreground">{t.groups.groupNotFound}</p>
        ) : (
          <>
            <GroupHeader
              group={group}
              userId={userId!}
              isMember={isMember}
              isOwner={isOwner}
              activeMeeting={activeMeeting}
              isJoining={joinGroup.isPending}
              isLeaving={leaveGroup.isPending}
              isStartingMeeting={startMeeting.isPending}
              onJoin={() => joinGroup.mutate({ groupId: group.id, userId: userId! })}
              onLeave={() => leaveGroup.mutate({ groupId: group.id, userId: userId! })}
              onJoinMeeting={(id) => router.push(`/meetings/${id}`)}
              onStartMeeting={() => startMeeting.mutate({ groupId: group.id, hostId: userId! }, {
                onSuccess: (data) => router.push(`/meetings/${data.id}`),
              })}
            />

            {/* Members */}
            {group.members?.length > 0 && (
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground/80 mb-3">{t.groups.membersTitle}</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-xs">
                        <img src={getMediaUrl(m.user?.avatarUrl) || '/default-avatar.png'} alt="" className="w-5 h-5 rounded-full object-cover" />
                        {m.user?.firstName} {m.user?.lastName}
                        {m.role === 'ADMIN' && <Crown className="h-3 w-3 text-primary" />}
                        {m.role === 'MODERATOR' && <Shield className="h-3 w-3 text-blue-500" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground/80">{t.groups.publications}</h3>

              {isMember && (
                <div className="flex gap-2">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder={t.groups.writeSomething}
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary resize-none"
                  />
                  <button
                    onClick={() => createPost.mutate({ authorId: userId!, content: postContent }, { onSuccess: () => setPostContent('') })}
                    disabled={!postContent || createPost.isPending}
                    className="px-4 self-end py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:brightness-110 disabled:opacity-50 transition"
                  >
                    {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              )}

              {!postsData?.posts?.length ? (
                <Card className="border-border">
                  <CardContent className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">{t.groups.noPublications}</p>
                  </CardContent>
                </Card>
              ) : (
                postsData.posts.map((post) => <GroupPostCard key={post.id} post={post} />)
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── CREATE ──
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => setView('browse')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition">
        <ArrowLeft className="h-4 w-4" />
        {t.groups.back}
      </button>
      <h1 className="text-2xl font-bold text-primary font-heading">{t.groups.createGroup}</h1>
      <CreateGroupForm
        isPending={createGroup.isPending}
        onSubmit={(form) => createGroup.mutate({ ...form, ownerId: userId! })}
      />
    </div>
  );
}
