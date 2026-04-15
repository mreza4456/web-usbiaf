import { supabase } from '@/config/supabase';

export const uploadImageToBucket = async (file: File) => {
  const ext = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `uploads/${fileName}`;

  const { error } = await supabase.storage
    .from("images")
    .upload(filePath, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("images").getPublicUrl(filePath);

  // Return both public URL and file path for reliable deletion and storage
  return { publicUrl: data.publicUrl, filePath };
};

