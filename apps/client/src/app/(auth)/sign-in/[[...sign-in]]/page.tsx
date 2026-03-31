"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Email ou mot de passe incorrect");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground font-heading tracking-tight mb-2">
          Bon retour
        </h1>
        <p className="text-muted-foreground">
          Connectez-vous pour accéder à votre espace The Communium
        </p>
      </div>

      <div className="ygo-card w-full rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-gold to-primary opacity-80" />
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}
          
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
                defaultValue="demo@thecommunium.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Mot de Passe</label>
              <Link href="#" className="text-xs text-primary hover:text-gold transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute z-10 left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <input 
                name="password"
                type="password" 
                required
                className="form-input pl-10 h-11"
                placeholder="••••••••"
                defaultValue="password123"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="ygo-btn-gold w-full h-12 mt-4 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-black" />
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border flex flex-col items-center">
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas de compte ?{" "}
            <Link href="/sign-up" className="text-primary font-semibold hover:text-gold transition-colors">
              Postulez pour rejoindre
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
