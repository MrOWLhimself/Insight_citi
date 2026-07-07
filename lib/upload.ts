import { supabaseBrowser } from "@/lib/supabase/client";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export class UploadError extends Error {}

/**
 * Uploads an image to the real, already-live `place-images` bucket (public
 * read), under an `insight/<user_id>/...` path — no `media` bucket exists in
 * this project. Ownership for delete/update is enforced by the storage
 * `owner` column (set automatically to the uploader's auth uid), independent
 * of the folder path.
 */
export async function uploadImage(file: File, folder: "covers" | "inline"): Promise<string> {
  const { data: sessionData } = await supabaseBrowser.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new UploadError("Sign in before uploading images.");

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError("Please upload a JPG, PNG, WEBP or GIF image.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadError("Images must be under 8MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `insight/${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error } = await supabaseBrowser.storage.from("place-images").upload(path, file, {
    cacheControl: "31536000",
    upsert: false
  });

  if (error) throw new UploadError(error.message);

  const { data } = supabaseBrowser.storage.from("place-images").getPublicUrl(path);
  return data.publicUrl;
}
