"use client";

import { useRef, useState } from "react";
import { uploadImage, UploadError } from "@/lib/upload";

export function CoverImageUploader({
  value,
  onChange
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadImage(file, "covers");
      onChange(url);
    } catch (err) {
      setError(err instanceof UploadError ? err.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`cover-uploader ${dragOver ? "drag-over" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        handleFile(event.dataTransfer.files?.[0]);
      }}
    >
      {value ? (
        <div className="cover-preview">
          {/* Plain img here on purpose: it previews whatever URL is set,
              including ones not yet allow-listed for next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Cover preview" />
          <div className="cover-preview-actions">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : "Replace image"}
            </button>
            <button type="button" onClick={() => onChange("")} disabled={uploading}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="cover-dropzone" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <span>{uploading ? "Uploading…" : "Click or drag a cover image here"}</span>
          <small>JPG, PNG, WEBP or GIF · up to 8MB</small>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {error && <span className="upload-error">{error}</span>}
    </div>
  );
}
