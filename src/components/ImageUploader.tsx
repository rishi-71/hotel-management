"use client";

import React, { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  folder: "hotels" | "rooms";
  entityName: string;
}

export default function ImageUploader({ onUploadComplete, folder, entityName }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  };

  const handleUpload = async (file: File) => {
    if (!file) return;

    // Validate it's an image
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const slug = slugify(entityName || "image");
      const ext = file.name.split(".").pop();
      const fileName = `${folder}/${slug}-${Date.now()}.${ext}`;

      // Upload image to the Supabase Storage Bucket 'hotel-images'
      const { error: uploadError } = await supabase.storage
        .from("hotel-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(
          "Upload failed. Please ensure you have created a public bucket named 'hotel-images' in your Supabase Storage dashboard."
        );
      }

      // Get public URL of the uploaded image
      const { data } = supabase.storage.from("hotel-images").getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={previewUrl ? undefined : onButtonClick}
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 text-center flex flex-col items-center justify-center cursor-pointer min-h-44 ${
          dragActive
            ? "border-primary bg-primary/5 scale-[0.99]"
            : previewUrl
            ? "border-border bg-card/30"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-medium">Uploading image to bucket...</p>
          </div>
        ) : previewUrl ? (
          <div className="relative group w-full h-full flex flex-col items-center gap-3">
            <div className="relative w-full max-h-36 overflow-hidden rounded-lg border border-border">
              <img src={previewUrl} alt="Uploaded preview" className="object-cover w-full h-36" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewUrl(null);
                    onUploadComplete("");
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow transition-all active:scale-95"
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="text-[10px] text-success font-semibold flex items-center gap-1">
              ✓ Uploaded successfully!
            </p>
          </div>
        ) : (
          <div className="space-y-2 select-none">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <p className="text-xs font-semibold text-foreground">
              Drag & Drop files here, or <span className="text-primary hover:underline">browse</span>
            </p>
            <p className="text-[10px] text-muted-foreground">Supports PNG, JPG, JPEG (Max 5MB)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[11px] p-3 rounded-lg flex items-start gap-2 leading-relaxed">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
