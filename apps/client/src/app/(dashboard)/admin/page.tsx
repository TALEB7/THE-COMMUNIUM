"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/auth-client";
import { useT } from "@/lib/i18n";

interface Stats {
  users: { total: number; new7d: number; new30d: number };
  listings: { total: number; active: number };
  auctions: { total: number; active: number };
  payments: { total: number; revenue30d: number };
  messages: { total: number };
  mentorship: { totalMentors: number; activeSessions: number };
  reports: { pending: number };
}

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  membership: { plan: string } | null;
  tksWallet: { balance: number } | null;
  _count: { listings: number; payments: number };
}

type Tab = "overview" | "users" | "reports" | "testimonials" | "newsletter" | "contact";

export default function AdminDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

  // Phase 7 state
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [newsStats, setNewsStats] = useState<any>(null);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [contactStats, setContactStats] = useState<any>(null);

  const { t } = useT();

  useEffect(() => {
    if (!user?.id) return;
    const headers = { "x-admin-id": user.id };

    Promise.all([
      fetch(`${apiUrl}/admin/dashboard`, { headers }).then((r) => r.ok ? r.json() : null),
      fetch(`${apiUrl}/admin/users`, { headers }).then((r) => r.ok ? r.json() : null),
      fetch(`${apiUrl}/testimonials/admin/all`).then((r) => r.ok ? r.json() : null),
      fetch(`${apiUrl}/newsletter/subscribers/stats`).then((r) => r.ok ? r.json() : null),
      fetch(`${apiUrl}/newsletter/contact`).then((r) => r.ok ? r.json() : null),
      fetch(`${apiUrl}/newsletter/contact/stats`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([s, u, tData, ns, cm, cs]) => {
        if (s) setStats(s);
        if (u) setUsers(u.users || []);
        if (tData) setTestimonials(tData.data || []);
        if (ns) setNewsStats(ns);
        if (cm) setContactMessages(cm.data || []);
        if (cs) setContactStats(cs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id, apiUrl]);

  const handleTestimonialAction = async (id: string, action: "approve" | "reject" | "feature") => {
    try {
      await fetch(`${apiUrl}/testimonials/${id}/${action}`, { method: "PATCH" });
      // Refresh
      const res = await fetch(`${apiUrl}/testimonials/admin/all`);
      if (res.ok) { const d = await res.json(); setTestimonials(d.data || []); }
    } catch {}
  };

  const handleContactAction = async (id: string, status: string) => {
    try {
      await fetch(`${apiUrl}/newsletter/contact/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const res = await fetch(`${apiUrl}/newsletter/contact`);
      if (res.ok) { const d = await res.json(); setContactMessages(d.data || []); }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const StatCard = ({ label, value, sub, icon }: { label: string; value: number | string; sub?: string; icon: string }) => (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-primary">{typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-green-600 mt-1">{sub}</p>}
    </div>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: t.admin.tabOverview },
    { key: "users", label: t.admin.tabUsers },
    { key: "testimonials", label: t.admin.tabTestimonials },
    { key: "newsletter", label: t.admin.tabNewsletter },
    { key: "contact", label: t.admin.tabContact },
    { key: "reports", label: t.admin.tabReports },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-primary font-heading">{t.admin.title}</h1>
        <div className="flex gap-1.5 flex-wrap">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === tabItem.key
                  ? "bg-primary text-white"
                  : "bg-card text-muted-foreground hover:bg-accent border border-border"
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && stats && stats.users && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="👥" label={t.admin.users} value={stats.users?.total ?? 0} sub={`+${stats.users?.new7d ?? 0} ${t.admin.thisWeek}`} />
          <StatCard icon="📝" label={t.admin.activeListings} value={stats.listings?.active ?? 0} />
          <StatCard icon="🔨" label={t.admin.activeAuctions} value={stats.auctions?.active ?? 0} />
          <StatCard icon="💰" label={t.admin.revenue30d} value={`${(stats.payments?.revenue30d ?? 0).toLocaleString("fr-FR")} MAD`} />
          <StatCard icon="💬" label={t.admin.messagesTotal} value={stats.messages?.total ?? 0} />
          <StatCard icon="🎓" label={t.admin.mentors} value={stats.mentorship?.totalMentors ?? 0} />
          <StatCard icon="📚" label={t.admin.activeSessions} value={stats.mentorship?.activeSessions ?? 0} />
          <StatCard icon="⚠️" label={t.admin.reports} value={stats.reports.pending} sub={t.admin.pendingReports} />
          {newsStats && <StatCard icon="📮" label={t.admin.newsletterSubs} value={newsStats.active ?? 0} />}
          {contactStats && <StatCard icon="✉️" label={t.admin.contactMessages} value={contactStats.new ?? 0} sub={t.admin.newMessages} />}
        </div>
      )}

      {/* ── Users ── */}
      {tab === "users" && (
        <div>
          <div className="mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.admin.searchUser}
              className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a730]/50 w-full max-w-md"
            />
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-accent border-b border-[#d4c088]/20">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.tableHeaders.name}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.tableHeaders.email}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.tableHeaders.role}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.tableHeaders.plan}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.tableHeaders.tks}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.tableHeaders.status}</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((u) => {
                    if (!search) return true;
                    const q = search.toLowerCase();
                    return u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                  })
                  .map((u) => (
                    <tr key={u.id} className="border-b border-border hover:bg-accent">
                      <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          u.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-muted text-foreground/80"
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.membership?.plan || "-"}</td>
                      <td className="px-4 py-3 font-medium text-amber-700">{u.tksWallet?.balance || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          u.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>{u.status}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Testimonials Moderation ── */}
      {tab === "testimonials" && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">{t.admin.moderateTestimonials}</p>
          {!testimonials.length ? (
            <div className="bg-card rounded-xl p-12 text-center border border-border">
              <p className="text-4xl mb-4">💬</p>
              <p className="text-muted-foreground">{t.admin.noTestimonials}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testimonials.map((item: any) => (
                <div key={item.id} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-primary">
                          {item.author?.firstName} {item.author?.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.role && `${item.role}`}{item.company && ` · ${item.company}`}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-xs ${i < item.rating ? 'text-primary' : 'text-muted-foreground/50'}`}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-foreground/80">{item.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {item.isApproved ? t.common.approved : t.common.pending}
                      </span>
                      {item.isFeatured && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-accent text-primary">★ Featured</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    {!item.isApproved && (
                      <button onClick={() => handleTestimonialAction(item.id, "approve")}
                        className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                        {t.admin.approve}
                      </button>
                    )}
                    {item.isApproved && (
                      <button onClick={() => handleTestimonialAction(item.id, "reject")}
                        className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-red-600 rounded-lg hover:bg-red-100 transition">
                        {t.admin.reject}
                      </button>
                    )}
                    <button onClick={() => handleTestimonialAction(item.id, "feature")}
                      className="px-3 py-1.5 text-xs font-medium bg-accent text-primary rounded-lg hover:bg-accent transition">
                      {item.isFeatured ? t.admin.unfeatureBtn : t.admin.featureBtn}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Newsletter ── */}
      {tab === "newsletter" && (
        <div className="space-y-4">
          {newsStats && (
            <div className="grid grid-cols-3 gap-4">
              <StatCard icon="📮" label={t.admin.activeSubs} value={newsStats.active ?? 0} />
              <StatCard icon="📭" label={t.admin.unsubscribed} value={newsStats.unsubscribed ?? 0} />
              <StatCard icon="📊" label={t.admin.totalHistory} value={newsStats.total ?? 0} />
            </div>
          )}
          <div className="bg-card rounded-xl p-8 text-center border border-border">
            <p className="text-4xl mb-3">📰</p>
            <p className="text-muted-foreground">{t.admin.campaignManagement}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.admin.campaignManagementDesc}</p>
          </div>
        </div>
      )}

      {/* ── Contact Messages ── */}
      {tab === "contact" && (
        <div>
          {contactStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatCard icon="🆕" label={t.admin.newContact} value={contactStats.new ?? 0} />
              <StatCard icon="👁️" label={t.admin.readContact} value={contactStats.read ?? 0} />
              <StatCard icon="✅" label={t.admin.repliedContact} value={contactStats.replied ?? 0} />
              <StatCard icon="📦" label={t.admin.archivedContact} value={contactStats.archived ?? 0} />
            </div>
          )}
          {!contactMessages.length ? (
            <div className="bg-card rounded-xl p-12 text-center border border-border">
              <p className="text-4xl mb-4">✉️</p>
              <p className="text-muted-foreground">{t.admin.noContactMessages}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contactMessages.map((m: any) => (
                <div key={m.id} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-primary">{m.name}</span>
                        <span className="text-xs text-muted-foreground">{m.email}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">{m.subject}</p>
                      <p className="text-sm text-muted-foreground">{m.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(m.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${
                      m.status === "NEW" ? "bg-blue-100 text-blue-700" :
                      m.status === "READ" ? "bg-yellow-100 text-yellow-700" :
                      m.status === "REPLIED" ? "bg-green-100 text-green-700" :
                      "bg-muted text-muted-foreground"
                    }`}>{m.status}</span>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    {m.status === "NEW" && (
                      <button onClick={() => handleContactAction(m.id, "READ")}
                        className="px-3 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition">
                        {t.admin.markRead}
                      </button>
                    )}
                    {(m.status === "NEW" || m.status === "READ") && (
                      <button onClick={() => handleContactAction(m.id, "REPLIED")}
                        className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                        {t.admin.markReplied}
                      </button>
                    )}
                    {m.status !== "ARCHIVED" && (
                      <button onClick={() => handleContactAction(m.id, "ARCHIVED")}
                        className="px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted transition">
                        {t.admin.archive}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reports ── */}
      {tab === "reports" && (
        <div className="bg-card rounded-xl p-12 text-center border border-border">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-muted-foreground">{t.admin.noReports}</p>
        </div>
      )}
    </div>
  );
}
