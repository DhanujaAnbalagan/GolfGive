import { SupabaseClient } from '@supabase/supabase-js';

export interface Charity {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  website_url: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCharity {
  id: string;
  user_id: string;
  charity_id: string;
  contribution_percentage: number;
  created_at: string;
  updated_at: string;
  charities?: Charity; // Joined charity details
}

// Simple helper to generate slug from name
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

export const charityService = {
  /**
   * Fetch all charities with optional search and featured filters.
   */
  async getCharities(supabase: SupabaseClient, query?: string, featuredOnly?: boolean) {
    let builder = supabase.from('charities').select('*');

    if (featuredOnly) {
      builder = builder.eq('featured', true);
    }

    if (query) {
      builder = builder.ilike('name', `%${query}%`);
    }

    const { data, error } = await builder.order('name', { ascending: true });
    return { data: data as Charity[] | null, error };
  },

  /**
   * Retrieve a single charity by slug (for routing /charities/[slug]).
   */
  async getCharityBySlug(supabase: SupabaseClient, slug: string) {
    const { data, error } = await supabase
      .from('charities')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    return { data: data as Charity | null, error };
  },

  /**
   * Retrieve a single charity by ID (for routing /api/charities/[id]).
   */
  async getCharityById(supabase: SupabaseClient, id: string) {
    const { data, error } = await supabase
      .from('charities')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { data: data as Charity | null, error };
  },

  /**
   * Create a new charity (Admin only). Slug is auto-generated.
   */
  async createCharity(
    supabase: SupabaseClient, 
    charityData: { name: string; description: string; image_url: string; website_url?: string; featured?: boolean }
  ) {
    const slug = slugify(charityData.name);
    const { data, error } = await supabase
      .from('charities')
      .insert({
        name: charityData.name,
        slug,
        description: charityData.description,
        image_url: charityData.image_url,
        website_url: charityData.website_url || null,
        featured: charityData.featured || false,
      })
      .select()
      .single();

    return { data: data as Charity | null, error };
  },

  /**
   * Update an existing charity (Admin only).
   */
  async updateCharity(
    supabase: SupabaseClient, 
    id: string, 
    charityData: { name?: string; description?: string; image_url?: string; website_url?: string; featured?: boolean }
  ) {
    const updates: { name?: string; description?: string; image_url?: string; website_url?: string; featured?: boolean; slug?: string; updated_at?: string } = { ...charityData };
    if (charityData.name) {
      updates.slug = slugify(charityData.name);
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('charities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data: data as Charity | null, error };
  },

  /**
   * Delete a charity (Admin only).
   */
  async deleteCharity(supabase: SupabaseClient, id: string) {
    const { error } = await supabase
      .from('charities')
      .delete()
      .eq('id', id);

    return { error };
  },

  /**
   * Fetch currently selected charity details for a player.
   */
  async getUserCharitySelection(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('user_charities')
      .select('*, charities(*)')
      .eq('user_id', userId)
      .maybeSingle();

    // Map custom structure since Supabase returns nested object under charities field
    if (data) {
      const selection = {
        ...data,
        charity: data.charities
      };
      delete selection.charities;
      return { data: selection, error };
    }

    return { data: null, error };
  },

  /**
   * Select a charity (or update existing selection) for a user.
   * Default contribution percentage is 10%.
   */
  async setUserCharitySelection(
    supabase: SupabaseClient, 
    userId: string, 
    charityId: string, 
    percentage: number = 10
  ) {
    // Check if a selection already exists
    const { data: existingSelection, error: fetchError } = await supabase
      .from('user_charities')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) return { data: null, error: fetchError };

    let result;
    if (existingSelection) {
      // Update existing selection
      result = await supabase
        .from('user_charities')
        .update({
          charity_id: charityId,
          contribution_percentage: percentage,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select('*, charities(*)')
        .single();
    } else {
      // Insert new selection
      result = await supabase
        .from('user_charities')
        .insert({
          user_id: userId,
          charity_id: charityId,
          contribution_percentage: percentage,
        })
        .select('*, charities(*)')
        .single();
    }

    if (result.data) {
      const selection = {
        ...result.data,
        charity: result.data.charities
      };
      delete selection.charities;
      return { data: selection, error: null };
    }

    return { data: null, error: result.error };
  },

  /**
   * Update contribution percentage only.
   */
  async updateUserCharityPercentage(supabase: SupabaseClient, userId: string, percentage: number) {
    const { data, error } = await supabase
      .from('user_charities')
      .update({
        contribution_percentage: percentage,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('*, charities(*)')
      .single();

    if (data) {
      const selection = {
        ...data,
        charity: data.charities
      };
      delete selection.charities;
      return { data: selection, error: null };
    }

    return { data: null, error };
  }
};
