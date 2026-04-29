"use client";

import { useState } from "react";
import { useUser, UserProfile } from "@/lib/auth-client";
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useUser();
  const { t } = useT();
  const { toast } = useToast();
  const [tab, setTab] = useState<"account" | "notifications">("account");

  const { data: prefs = {}, isLoading: prefsLoading } = useQuery<Record<string, boolean>>({
    queryKey: ['notification-prefs', user?.id],
    queryFn: () => api.get(`/notifications/${user!.id}/preferences`).then((r) => r.data),
    enabled: !!user?.id && tab === 'notifications',
  });

  const [localPrefs, setLocalPrefs] = useState<Record<string, boolean>>({});
  const mergedPrefs = { ...prefs, ...localPrefs };

  const savePrefs = useMutation({
    mutationFn: () => api.patch(`/notifications/${user?.id}/preferences`, mergedPrefs),
    onSuccess: () => {
      toast({ title: t.common.save, description: 'Préférences mises à jour.' });
      setLocalPrefs({});
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de sauvegarder.', variant: 'destructive' }),
  });

  const togglePref = (key: string) => {
    setLocalPrefs((p) => ({ ...p, [key]: !mergedPrefs[key] }));
  };

  const prefGroups = [
    {
      title: t.settings.messagesGroup,
      items: [
        { key: "emailMessages", label: t.settings.byEmail },
        { key: "pushMessages", label: t.settings.push },
        { key: "inAppMessages", label: t.settings.inApp },
      ],
    },
    {
      title: t.settings.auctionsGroup,
      items: [
        { key: "emailBids", label: t.settings.byEmail },
        { key: "pushBids", label: t.settings.push },
        { key: "inAppBids", label: t.settings.inApp },
      ],
    },
    {
      title: t.settings.mentorshipGroup,
      items: [
        { key: "emailMentorship", label: t.settings.byEmail },
        { key: "pushMentorship", label: t.settings.push },
        { key: "inAppMentorship", label: t.settings.inApp },
      ],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary font-heading">⚙️ {t.settings.title}</h1>

      {/* Tab pills */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {(["account", "notifications"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === tabKey
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tabKey === "account" ? t.settings.accountTab : t.settings.notificationsTab}
          </button>
        ))}
      </div>

      {/* Account */}
      {tab === "account" && (
        <div className="bg-card rounded-xl border border-border p-6">
          <UserProfile
            appearance={{
              elements: { rootBox: "w-full", card: "shadow-none border-0 p-0" },
            }}
          />
        </div>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          {prefsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {prefGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold text-foreground mb-3">{group.title}</h3>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <button
                          onClick={() => togglePref(item.key)}
                          className={`relative w-10 h-6 rounded-full transition-colors ${
                            mergedPrefs[item.key] ? "bg-primary" : "bg-muted"
                          }`}
                          role="switch"
                          aria-checked={!!mergedPrefs[item.key]}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              mergedPrefs[item.key] ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={() => savePrefs.mutate()}
                disabled={savePrefs.isPending || Object.keys(localPrefs).length === 0}
                className="ygo-btn-gold disabled:opacity-50"
              >
                {savePrefs.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.save}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
