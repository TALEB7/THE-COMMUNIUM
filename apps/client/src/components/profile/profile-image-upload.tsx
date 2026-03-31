"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import Image from "next/image";

interface ProfileImageUploadProps {
  initialValue?: string;
  onUploadComplete: (url: string) => void;
}

export function ProfileImageUpload({ initialValue, onUploadComplete }: ProfileImageUploadProps) {
  const [image, setImage] = useState<string | null>(initialValue || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop volumineuse (max 5 Mo)");
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image valide");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const res = await fetch(`${apiUrl}/uploads/avatar`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur lors de l'envoi");

      const data = await res.json();
      setImage(data.url);
      onUploadComplete(data.url);
    } catch (err) {
      setError("Impossible d'uploader l'image. Le serveur est peut-être hors ligne.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    onUploadComplete("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <div className={`w-32 h-32 rounded-full border-4 border-muted overflow-hidden bg-muted flex items-center justify-center transition-all ${uploading ? "opacity-50" : "group-hover:border-primary/50"}`}>
          {image ? (
            <Image 
              src={image} 
              alt="Profile" 
              width={128} 
              height={128} 
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className="w-12 h-12 text-muted-foreground" />
          )}
          
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {image && !uploading && (
          <button
            onClick={removeImage}
            className="absolute -top-1 -right-1 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 p-2.5 bg-primary text-black rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100"
        >
          <Upload className="w-4 h-4" />
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {error ? (
        <p className="text-xs text-destructive font-medium">{error}</p>
      ) : image ? (
        <p className="text-xs text-primary flex items-center gap-1 font-medium">
          <CheckCircle2 className="w-3 h-3" /> Photo enregistrée
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">JPG, PNG ou WebP. Max 5 Mo.</p>
      )}
    </div>
  );
}
