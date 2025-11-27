
import { supabase } from '../lib/supabase';

export const imageService = {
  async uploadArtworkImage(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('artworks')
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('artworks')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },
};