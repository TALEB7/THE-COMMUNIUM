"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Briefcase, ArrowRight, Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;

    try {
      // 1. Register the user in the NestJS Backend
      const regRes = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          accountType,
          phone,
        }),
      });

      if (!regRes.ok) {
        const data = await regRes.json().catch(() => ({}));
        throw new Error(data.message || "Erreur lors de la création du compte.");
      }

      // 2. Sign in with NextAuth
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        throw new Error("Erreur de connexion après inscription.");
      } else {
        router.push("/onboarding");
        router.refresh();
      }
    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        setError("Impossible de contacter le serveur (Backend API hors ligne). Veuillez démarrer le serveur NestJS.");
      } else {
        setError(err.message || "Une erreur est survenue");
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground font-heading tracking-tight mb-2">
          Rejoindre The Communium
        </h1>
        <p className="text-muted-foreground">
          Créez votre compte et commencez à développer votre réseau professionnel
        </p>
      </div>

      <div className="ygo-card w-full rounded-2xl p-8 relative overflow-hidden bg-background">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-gold to-primary opacity-80" />
        
        {/* Account Type Selector */}
        <div className="flex p-1 bg-muted/50 rounded-xl mb-8 border border-border/50">
          <button
            type="button"
            onClick={() => setAccountType("personal")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all ${
              accountType === "personal"
                ? "bg-card text-primary shadow-sm ring-1 ring-primary/20"
                : "text-muted-foreground hover:bg-card/50"
            }`}
          >
            <User className="h-4 w-4" />
            <span className="font-medium text-sm">Personnel</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("business")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all ${
              accountType === "business"
                ? "bg-card text-primary shadow-sm ring-1 ring-primary/20"
                : "text-muted-foreground hover:bg-card/50"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span className="font-medium text-sm">Business</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Prénom</label>
              <div className="relative">
                <User className="absolute z-10 left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <input 
                  name="firstName"
                  type="text" 
                  required
                  className="form-input pl-10 h-11"
                  placeholder="Jean"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nom</label>
              <div className="relative">
                <User className="absolute z-10 left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <input 
                  name="lastName"
                  type="text" 
                  required
                  className="form-input pl-10 h-11"
                  placeholder="Dupont"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Adresse Email</label>
            <div className="relative">
              <Mail className="absolute z-10 left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <input 
                name="email"
                type="email" 
                required
                className="form-input pl-10 h-11"
                placeholder="vous@exemple.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Numéro de Téléphone</label>
            <div className="relative">
              <div className="absolute z-10 left-3 top-2.5 text-muted-foreground font-medium text-sm">+212</div>
              <input 
                name="phone"
                type="tel" 
                required
                className="form-input pl-12 h-11"
                placeholder="6 00 00 00 00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Mot de Passe</label>
            <div className="relative">
              <Lock className="absolute z-10 left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <input 
                name="password"
                type="password" 
                required
                className="form-input pl-10 h-11"
                placeholder="8+ caractères"
              />
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="ygo-btn-gold w-full h-12 flex items-center justify-center space-x-2 text-[15px]"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-black" />
              ) : (
                <>
                  <span>Continuer</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground mt-4">
            En continuant, vous acceptez nos <Link href="/terms" className="text-primary hover:underline">Conditions d'utilisation</Link>.
          </p>
        </form>

        <div className="mt-8 pt-6 border-t border-border flex flex-col items-center">
          <p className="text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link href="/sign-in" className="text-primary font-semibold hover:text-gold transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
