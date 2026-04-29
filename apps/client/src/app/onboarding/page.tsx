"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth-client";
import { api } from "@/lib/api";
import {
  User, Briefcase, Calendar, Hash, Globe, MapPin,
  ChevronLeft, ArrowRight, CheckCircle2, Star,
  ShieldCheck, Zap, Loader2, Camera, Search,
} from "lucide-react";
import { ProfileImageUpload } from "@/components/profile/profile-image-upload";

const INTERESTS = [
  "Finance & Investissement", "Immobilier", "Commerce & Import-Export",
  "Agriculture & Agroalimentaire", "Tech & Innovation", "Industrie & Manufacturing",
  "Services & Consulting", "RH & Recrutement", "Santé & Pharma",
  "Tourisme & Hôtellerie", "Éducation & Formation", "Startup & Entrepreneuriat",
  "Marchés Publics", "International & Export", "Artisanat & Tradition",
  "Marketing & Communication", "Juridique & Compliance", "Logistique & Transport",
  "Energie & Environnement", "E-commerce", "Intelligence Artificielle", "Data Science",
];

const PERSONAL_PLANS = [
  { id: "personal_free",    name: "Gratuit",  price: "0",   perks: ["Profil complet", "Réseau de contacts", "Marketplace standard"] },
  { id: "personal_premium", name: "Premium",  price: "200", isRecommended: true,
    perks: ["Badge VIP", "Réductions jusqu'à 90%", "Gagnez des TKS!", "Priorité support"] },
];

const BUSINESS_PLANS = [
  { id: "business_free",    name: "Pack Standard",    price: "0",    perks: ["Page Entreprise", "Listing standard", "Visibilité locale"] },
  { id: "business_premium", name: "Pack Premium",     price: "500",  isRecommended: true,
    perks: ["Ligne directe business", "Partenariats investis", "Accès marchés publics", "Matchmaking"] },
  { id: "company_creation", name: "Création Société", price: "3000",
    perks: ["Accompagnement complet", "Domiciliation", "Business Premium inclus"] },
];

const STEP_LABELS = ["Centres d'intérêt", "Identité", "Offre", "Photo"];

// Shared styles — theme-aware (light / dark)
const inp = [
  "w-full h-11 rounded-xl text-sm focus:outline-none transition px-4",
  "bg-gray-100 border border-gray-200 text-gray-900 placeholder:text-gray-400",
  "focus:border-[#C8102E]/50 focus:ring-1 focus:ring-[#C8102E]/20",
  "dark:bg-white/[0.05] dark:border-white/[0.08] dark:text-white dark:placeholder:text-white/20",
  "dark:focus:border-[#C8102E]/50 dark:focus:bg-white/[0.07]",
].join(" ");
const label = "block text-[11px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest mb-1.5";
const backBtn = "flex-[0.4] h-12 flex items-center justify-center gap-2 border border-gray-200 dark:border-white/[0.1] rounded-2xl text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] font-semibold text-sm transition-all";
const nextBtn = "flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#C8102E] to-[#E8233E] text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    accountType: "personal", interests: [] as string[],
    birthday: "", identityType: "cin", identityNumber: "",
    companyName: "", rc: "", creationDate: "",
    phone: "", country: "Maroc", city: "", address: "",
    avatarUrl: "", selectedPlan: "personal_free",
  });

  useEffect(() => {
    if (isLoaded && user) {
      const type = (user as any).accountType || "personal";
      setForm((p) => ({
        ...p,
        accountType: type,
        phone: (user as any).phone || "",
        selectedPlan: type === "business" ? "business_free" : "personal_free",
      }));
    }
  }, [isLoaded, user]);

  const field = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const toggleInterest = (tag: string) =>
    setForm((p) => ({
      ...p,
      interests: p.interests.includes(tag)
        ? p.interests.filter((i) => i !== tag)
        : [...p.interests, tag],
    }));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/onboarding", {
        clerkId: user?.id,
        email: (user as any).email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        ...form,
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d0e12] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#C8102E]" />
      </div>
    );
  }

  const filtered = INTERESTS.filter((i) => i.toLowerCase().includes(search.toLowerCase()));

  // ─────────────────────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── STEP 1 — Interests ──────────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                Choisissez vos secteurs d'activité
              </h2>
              <p className="text-gray-500 dark:text-white/40 text-sm">
                Sélectionnez au moins <span className="text-gray-700 dark:text-white/70 font-semibold">3 domaines</span> pour personnaliser votre expérience
              </p>
            </div>

            <div className="relative max-w-sm mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un secteur..."
                className={`${inp} pl-10 rounded-full`}
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {filtered.map((tag) => {
                const sel = form.interests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className={`px-3.5 py-2 rounded-full text-sm font-bold border transition-all duration-200 ${
                      sel
                        ? "bg-gradient-to-r from-purple-600 to-fuchsia-500 border-transparent text-white shadow-lg shadow-purple-600/30 scale-[1.04]"
                        : "bg-gray-100 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/50 hover:border-[#C8102E]/30 hover:text-gray-900 dark:hover:text-white/80"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {form.interests.length > 0 && (
              <p className="text-center text-xs text-fuchsia-400 font-bold">
                {form.interests.length} sélectionné{form.interests.length > 1 ? "s" : ""}
              </p>
            )}

            <button onClick={() => setStep(2)} disabled={form.interests.length < 3} className={nextBtn}>
              Continuer <ArrowRight className="h-4 w-4" />
            </button>
            {form.interests.length < 3 && (
              <p className="text-center text-xs text-white/25">
                {3 - form.interests.length} secteur{3 - form.interests.length > 1 ? "s" : ""} de plus requis
              </p>
            )}
          </div>
        );

      // ── STEP 2 — Identity ───────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-center">
              <div className="inline-flex p-3.5 rounded-2xl bg-[#C8102E]/10 mb-3">
                <User className="h-6 w-6 text-[#C8102E]" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Informations de profil</h2>
              <p className="text-gray-500 dark:text-white/40 text-sm">Complétez votre identité pour rejoindre l'élite du réseau</p>
            </div>

            {form.accountType === "personal" ? (
              <>
                <div>
                  <label className={label}>Date de naissance</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50" />
                    <input name="birthday" type="date" value={form.birthday} onChange={field}
                      className={`${inp} pl-10`} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Type de pièce</label>
                    <select name="identityType" value={form.identityType} onChange={field}
                      className={`${inp} cursor-pointer appearance-none`}>
                      <option value="cin">CIN</option>
                      <option value="passport">Passeport</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>Numéro</label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50" />
                      <input name="identityNumber" value={form.identityNumber} onChange={field}
                        className={`${inp} pl-10 uppercase`} placeholder="BE 123456" required />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className={label}>Nom de l'entreprise</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50" />
                    <input name="companyName" value={form.companyName} onChange={field}
                      className={`${inp} pl-10`} placeholder="Société SARL" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Date de création</label>
                    <input name="creationDate" type="date" value={form.creationDate} onChange={field}
                      className={inp} required />
                  </div>
                  <div>
                    <label className={label}>RC</label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50" />
                      <input name="rc" value={form.rc} onChange={field}
                        className={`${inp} pl-10`} placeholder="12345" required />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Ville</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50" />
                  <input name="city" value={form.city} onChange={field}
                    className={`${inp} pl-10`} placeholder="Casablanca" required />
                </div>
              </div>
              <div>
                <label className={label}>Pays</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50" />
                  <input name="country" value={form.country} onChange={field}
                    className={`${inp} pl-10`} required />
                </div>
              </div>
            </div>

            <div>
              <label className={label}>Adresse complète</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50" />
                <input name="address" value={form.address} onChange={field}
                  className={`${inp} pl-10`} placeholder="Quartier, Rue, Étage..." required />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep(1)} className={backBtn}>
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button onClick={() => setStep(3)} className={nextBtn}>
                Continuer <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      // ── STEP 3 — Plan ───────────────────────────────────────────────────────
      case 3: {
        const plans = form.accountType === "personal" ? PERSONAL_PLANS : BUSINESS_PLANS;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-center">
              <div className="inline-flex p-3.5 rounded-2xl bg-[#C8102E]/10 mb-3">
                <Star className="h-6 w-6 text-[#C8102E]" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Choisissez votre offre</h2>
              <p className="text-gray-500 dark:text-white/40 text-sm">Accédez à des privilèges exclusifs dès aujourd'hui</p>
            </div>

            <div className={`grid grid-cols-1 ${plans.length > 2 ? "lg:grid-cols-3" : "md:grid-cols-2"} gap-3`}>
              {plans.map((plan) => {
                const sel = form.selectedPlan === plan.id;
                return (
                  <button key={plan.id} onClick={() => setForm((p) => ({ ...p, selectedPlan: plan.id }))}
                    className={`relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all ${
                      sel
                        ? "border-[#C8102E] bg-[#C8102E]/5 shadow-lg shadow-[#C8102E]/10 scale-[1.02]"
                        : "border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] hover:border-gray-300 dark:hover:border-white/20"
                    }`}
                  >
                    {plan.isRecommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#C8102E] to-[#E8233E] text-white text-[10px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap">
                        Recommandé
                      </div>
                    )}
                    <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                      <span className="text-[11px] text-gray-400 dark:text-white/30 uppercase">Dhs/An</span>
                    </div>
                    <ul className="space-y-1.5 mb-4 flex-1">
                      {plan.perks.map((perk, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-white/55">
                          <CheckCircle2 className="h-3 w-3 text-[#C8102E] shrink-0" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                    <div className={`w-full py-2 rounded-xl text-center text-xs font-bold ${
                      sel ? "bg-[#C8102E] text-black" : "bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/40"
                    }`}>
                      {sel ? "✓ Sélectionné" : "Choisir ce plan"}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep(2)} className={backBtn}>
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button onClick={() => setStep(4)} className={nextBtn}>
                Continuer <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      }

      // ── STEP 4 — Photo ──────────────────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-center">
              <div className="inline-flex p-3.5 rounded-2xl bg-[#C8102E]/10 mb-3">
                <Camera className="h-6 w-6 text-[#C8102E]" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Finalisez votre profil</h2>
              <p className="text-gray-500 dark:text-white/40 text-sm">Une photo professionnelle augmente votre visibilité de 400%</p>
            </div>

            <div className="flex flex-col items-center gap-6 py-4">
              <ProfileImageUpload
                initialValue={form.avatarUrl}
                onUploadComplete={(url) => setForm((p) => ({ ...p, avatarUrl: url }))}
              />
              <div className="w-full max-w-xs space-y-2.5">
                {[
                  { icon: ShieldCheck, text: "Vérification Premium Inclus" },
                  { icon: Zap,         text: "Activation Instantanée" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 p-3 bg-[#C8102E]/5 border border-[#C8102E]/15 rounded-xl">
                    <Icon className="h-4 w-4 text-[#C8102E] shrink-0" />
                    <span className="text-xs font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className={backBtn}>
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button onClick={handleSubmit} disabled={loading} className={nextBtn}>
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <>Rejoindre The Communium <CheckCircle2 className="h-4 w-4" /></>}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Page shell ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0e12] relative overflow-hidden">
      {/* Aurora — dark mode only */}
      <div className="fixed inset-0 pointer-events-none -z-10 hidden dark:block">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[140px]" />
        <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      {/* Top bar — red in both modes */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C8102E] via-red-400 to-transparent z-50" />

      <div className="max-w-2xl mx-auto px-4 pt-16 pb-20">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2.5">
            <img src="/communium_logo.png" alt="The Communium" width={28} height={28} className="rounded" />
            <span className="text-xs font-extrabold text-[#C8102E] tracking-widest uppercase opacity-80">
              The Communium
            </span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEP_LABELS.map((lbl, i) => {
            const s = i + 1;
            const done = step > s;
            const active = step === s;
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 font-bold text-sm transition-all duration-300 ${
                    done   ? "bg-[#C8102E] border-[#C8102E] text-white" :
                    active ? "bg-[#C8102E]/10 border-[#C8102E] text-[#C8102E]" :
                             "bg-gray-200 border-gray-300 text-gray-400 dark:bg-white/[0.04] dark:border-white/[0.1] dark:text-white/30"
                  }`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : s}
                  </div>
                  <span className={`text-[9px] font-bold uppercase mt-1.5 tracking-widest whitespace-nowrap ${
                    active ? "text-[#C8102E]" : "text-gray-400 dark:text-white/20"
                  }`}>
                    {lbl}
                  </span>
                </div>
                {s < STEP_LABELS.length && (
                  <div className={`w-14 h-px mx-1 mb-5 transition-colors ${step > s ? "bg-[#C8102E]/60" : "bg-gray-200 dark:bg-white/[0.07]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#13141a] border border-gray-200 dark:border-white/[0.08] rounded-3xl shadow-lg dark:shadow-black/50 p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C8102E]/30 to-transparent" />
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
