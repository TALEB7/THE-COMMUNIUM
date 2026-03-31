"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth-client";
import { 
  User, Briefcase, Calendar, Hash, Globe, MapPin, 
  ChevronLeft, ArrowRight, CheckCircle2, Star, 
  ShieldCheck, Zap, Loader2, Camera
} from "lucide-react";
import { ProfileImageUpload } from "@/components/profile/profile-image-upload";

// Plans Data
const PERSONAL_PLANS = [
  {
    id: "personal_free",
    name: "Gratuit",
    price: "0",
    perks: ["Profil complet", "Réseau de contacts", "Marketplace standard"],
  },
  {
    id: "personal_premium",
    name: "Premium",
    price: "200",
    isRecommended: true,
    perks: ["Badge VIP", "Réductions jusqu'à 90%", "Gagnez des TKS!", "Priorité support"],
  }
];

const BUSINESS_PLANS = [
  {
    id: "business_free",
    name: "Pack Standard",
    price: "0",
    perks: ["Page Entreprise", "Listing standard", "Visibilité locale"],
  },
  {
    id: "business_premium",
    name: "Pack Premium",
    price: "500",
    isRecommended: true,
    perks: ["Ligne directe business", "Partenariats investis", "Accès marchés publics", "Matchmaking"],
  },
  {
    id: "company_creation",
    name: "Création Société",
    price: "3000",
    perks: ["Accompagnement complet", "Domiciliation", "Business Premium inclus"],
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    accountType: "personal", // personal | business
    // Personal fields
    birthday: "",
    identityType: "cin", // cin | passport
    identityNumber: "",
    // Business fields
    companyName: "",
    rc: "",
    creationDate: "",
    // Common fields
    phone: "",
    country: "Maroc",
    city: "",
    address: "",
    avatarUrl: "",
    selectedPlan: "personal_free",
  });

  useEffect(() => {
    if (isLoaded && user) {
      setFormData(prev => ({
        ...prev,
        accountType: (user as any).accountType || "personal",
        phone: (user as any).phone || "",
        selectedPlan: (user as any).accountType === "business" ? "business_free" : "personal_free"
      }));
    }
  }, [isLoaded, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const res = await fetch(`${apiUrl}/auth/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user?.id,
          email: (user as any).email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          ...formData
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Erreur lors de la finalisation.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1: // Identity Details
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10">
              <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6 gold-glow">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground font-heading tracking-tight mb-2">Informations de profil</h2>
              <p className="text-muted-foreground">Complétez votre identité pour rejoindre l'élite du réseau</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {formData.accountType === "personal" ? (
                <>
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Date de naissance</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-primary/60" />
                      <input 
                        name="birthday"
                        type="date"
                        value={formData.birthday}
                        onChange={handleInputChange}
                        className="form-input pl-12 h-12 rounded-2xl border-border/50 bg-background/30"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Type de pièce</label>
                      <select 
                        name="identityType"
                        value={formData.identityType}
                        onChange={handleInputChange}
                        className="form-input h-12 rounded-2xl border-border/50 bg-background/30 appearance-none cursor-pointer"
                      >
                        <option value="cin">Carte d'Identité (CIN)</option>
                        <option value="passport">Passeport</option>
                      </select>
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Numéro de pièce</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-3.5 h-5 w-5 text-primary/60" />
                        <input 
                          name="identityNumber"
                          type="text"
                          value={formData.identityNumber}
                          onChange={handleInputChange}
                          className="form-input pl-12 h-12 uppercase rounded-2xl border-border/50 bg-background/30"
                          placeholder="BE 123456"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nom de l'entreprise</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-3.5 h-5 w-5 text-primary/60" />
                      <input 
                        name="companyName"
                        type="text"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="form-input pl-12 h-12 rounded-2xl border-border/50 bg-background/30"
                        placeholder="Société SARL"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Date de création</label>
                      <input 
                        name="creationDate"
                        type="date"
                        value={formData.creationDate}
                        onChange={handleInputChange}
                        className="form-input h-12 rounded-2xl border-border/50 bg-background/30"
                        required
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Registre Commerce (RC)</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-3.5 h-5 w-5 text-primary/60" />
                        <input 
                          name="rc"
                          type="text"
                          value={formData.rc}
                          onChange={handleInputChange}
                          className="form-input pl-12 h-12 rounded-2xl border-border/50 bg-background/30"
                          placeholder="12345"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Ville</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-primary/60" />
                    <input 
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="form-input pl-12 h-12 rounded-2xl border-border/50 bg-background/30"
                      placeholder="Casablanca"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Pays</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-3.5 h-5 w-5 text-primary/60" />
                    <input 
                      name="country"
                      type="text"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="form-input pl-12 h-12 rounded-2xl border-border/50 bg-background/30"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Adresse complète</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-primary/60" />
                  <input 
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input pl-12 h-12 rounded-2xl border-border/50 bg-background/30"
                    placeholder="Quartier, Rue, Etage..."
                    required
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="ygo-btn-gold w-full h-14 mt-6 text-base"
            >
              <span>Continuer</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        );

      case 2: // Plan Selection
        const currentPlans = formData.accountType === "personal" ? PERSONAL_PLANS : BUSINESS_PLANS;
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="text-center mb-10">
              <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6 gold-glow">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground font-heading tracking-tight mb-2">Choisissez votre offre</h2>
              <p className="text-muted-foreground">Accédez à des privilèges exclusifs dès aujourd'hui</p>
            </div>

            <div className={`grid grid-cols-1 ${currentPlans.length > 2 ? 'lg:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
              {currentPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setFormData(prev => ({ ...prev, selectedPlan: plan.id }))}
                  className={`relative flex flex-col p-8 rounded-[2rem] border-2 transition-all duration-500 text-left group ${
                    formData.selectedPlan === plan.id
                      ? "border-primary bg-primary/[0.03] ring-4 ring-primary/10 scale-[1.02] shadow-2xl"
                      : "border-border/50 bg-card hover:border-primary/30 hover:bg-primary/[0.01]"
                  }`}
                >
                  {plan.isRecommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 gold-pill">
                      Recommandé
                    </div>
                  )}
                  <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">{plan.name}</h3>
                  <div className="flex items-baseline space-x-1 mb-6">
                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className="text-sm font-bold text-muted-foreground uppercase opacity-60">Dhs/An</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-3 text-[13px] font-medium leading-relaxed">
                        <div className="mt-0.5 rounded-full p-0.5 bg-primary/20">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-foreground/80">{perk}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={`w-full py-3.5 rounded-2xl text-center text-sm font-bold transition-all duration-300 ${
                    formData.selectedPlan === plan.id
                      ? "bg-primary text-black shadow-lg shadow-primary/20"
                      : "bg-muted text-muted-foreground border border-border group-hover:border-primary/50 group-hover:text-foreground"
                  }`}>
                    {formData.selectedPlan === plan.id ? "Sélectionné" : "Choisir ce plan"}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleBack}
                className="flex-[0.4] h-14 flex items-center justify-center space-x-2 border-2 border-border/50 rounded-2xl hover:bg-muted font-bold text-sm transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Précédent</span>
              </button>
              <button
                onClick={handleNext}
                className="flex-1 ygo-btn-gold h-14"
              >
                <span>Continuer vers l'étape finale</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        );

      case 3: // Profile Photo
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="text-center mb-10">
              <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6 gold-glow text-white">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground font-heading tracking-tight mb-2">Finalisez votre profil</h2>
              <p className="text-muted-foreground">Une photo professionnelle augmente votre visibilité de 400%</p>
            </div>

            <div className="relative group mx-auto max-w-sm">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-amber-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-card border border-border/50 rounded-[2.5rem] p-12 flex flex-col items-center">
                <ProfileImageUpload 
                  initialValue={formData.avatarUrl}
                  onUploadComplete={(url) => setFormData(prev => ({ ...prev, avatarUrl: url }))}
                />
                
                <div className="mt-10 space-y-4 w-full">
                  <div className="flex items-center gap-4 p-4 bg-primary/[0.03] border border-primary/10 rounded-2xl transition-all hover:bg-primary/[0.05]">
                    <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                    <span className="text-xs font-bold text-foreground/70 uppercase tracking-tight leading-none">Vérification Premium Inclus</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-primary/[0.03] border border-primary/10 rounded-2xl transition-all hover:bg-primary/[0.05]">
                    <Zap className="h-6 w-6 text-primary shrink-0" />
                    <span className="text-xs font-bold text-foreground/70 uppercase tracking-tight leading-none">Activation Instantanée</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleBack}
                className="flex-[0.4] h-14 flex items-center justify-center space-x-2 border-2 border-border/50 rounded-2xl hover:bg-muted font-bold text-sm transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Précédent</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 ygo-btn-gold h-14 group"
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <span>Rejoindre The Communium</span>
                    <CheckCircle2 className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-16 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl">
        <div className="mb-12 flex items-center justify-center space-x-12 relative">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center relative z-10">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step >= s ? "bg-primary border-primary text-black" : "border-border bg-muted text-muted-foreground shadow-sm"
              }`}>
                {step > s ? <CheckCircle2 className="h-6 w-6" /> : <span className="text-lg font-bold">{s}</span>}
              </div>
              <span className={`text-[10px] font-bold uppercase mt-3 tracking-widest ${
                step >= s ? "text-primary" : "text-muted-foreground/50"
              }`}>
                {s === 1 ? "Identité" : s === 2 ? "Offre" : "Photo"}
              </span>
            </div>
          ))}
          {/* Progress bar background */}
          <div className="absolute top-6 left-1/4 right-1/4 h-0.5 bg-border -z-0" />
          {/* Progress bar active */}
          <div 
            className="absolute top-6 left-1/4 h-0.5 bg-primary transition-all duration-500 -z-0" 
            style={{ width: `${(step - 1) * 25}%` }}
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive font-medium animate-in zoom-in-95 duration-300">
            {error}
          </div>
        )}

        <div className="ygo-card relative bg-background border border-border/50 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="bg-background rounded-[2.4rem] p-10 md:p-14">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}
