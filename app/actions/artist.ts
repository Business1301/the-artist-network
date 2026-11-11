"use server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface ArtistProfileData {
  id: string;
  stage_name: string;
  slug: string;
  category: string;
  country: string;
  state: string | null;
  city: string;
  bio: string | null;
  experience_years: number;
  genres: string[];
  specialities: string[];
  languages: string[];
  performance_types: string[];
  technical_requirements?: string[];
  starting_price: number | null;
  pricing_unit: "per hour" | "per performance" | "per event";
  profile_image_url: string | null;
  cover_image_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  profile_status: "draft" | "pending_review" | "published" | "rejected";
  rejection_reason: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItemData {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  media_type: "image" | "youtube" | "audio" | "link";
  media_url: string;
  thumbnail_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ArtistProfileResponse {
  success: boolean;
  message?: string;
  profile?: ArtistProfileData | null;
  portfolio?: PortfolioItemData[];
}

/**
 * Fetch the current authenticated artist's private profile & portfolio
 */
export async function getArtistProfile(): Promise<ArtistProfileResponse> {
  if (!isSupabaseConfigured()) {
    return { success: false, message: "Database not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Authentication required." };
  }

  const { data: profile, error } = await supabase
    .from("artist_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return { success: false, message: error.message };
  }

  let portfolio: PortfolioItemData[] = [];
  if (profile) {
    const { data: items } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("artist_id", user.id)
      .order("display_order", { ascending: true });

    portfolio = (items as PortfolioItemData[]) || [];
  }

  return {
    success: true,
    profile: (profile as ArtistProfileData) || null,
    portfolio,
  };
}

/**
 * Save / Update artist profile draft
 */
export async function saveArtistProfile(
  formData: Partial<ArtistProfileData>
): Promise<ArtistProfileResponse> {
  if (!isSupabaseConfigured()) {
    return { success: false, message: "Database not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized. Please log in." };
  }

  // Validate required minimums for saving draft
  if (!formData.stage_name?.trim()) {
    return { success: false, message: "Artist or stage name is required." };
  }
  if (!formData.category?.trim()) {
    return { success: false, message: "Please select an artist category." };
  }
  if (!formData.city?.trim()) {
    return { success: false, message: "City location is required." };
  }

  // Sanitize data: Never permit passing is_verified or changing status to published/rejected
  const payload = {
    id: user.id,
    stage_name: formData.stage_name.trim(),
    category: formData.category.trim(),
    country: formData.country?.trim() || "India",
    state: formData.state?.trim() || null,
    city: formData.city.trim(),
    bio: formData.bio?.trim() || null,
    experience_years: Math.max(0, Number(formData.experience_years) || 0),
    genres: formData.genres || [],
    specialities: formData.specialities || [],
    languages: formData.languages || [],
    performance_types: formData.performance_types || [],
    technical_requirements: formData.technical_requirements || [],
    starting_price: formData.starting_price ? Number(formData.starting_price) : null,
    pricing_unit: formData.pricing_unit || "per performance",
    profile_image_url: formData.profile_image_url || null,
    cover_image_url: formData.cover_image_url || null,
    instagram_url: formData.instagram_url?.trim() || null,
    youtube_url: formData.youtube_url?.trim() || null,
    facebook_url: formData.facebook_url?.trim() || null,
    website_url: formData.website_url?.trim() || null,
    // Status stays draft unless already submitted
    profile_status: formData.profile_status === "pending_review" ? "pending_review" : "draft",
  };

  let { data: updated, error } = await supabase
    .from("artist_profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  // Graceful fallback if technical_requirements column has not been added to Supabase yet
  if (error && error.message?.includes("technical_requirements")) {
    const fallbackPayload = { ...payload };
    delete (fallbackPayload as { technical_requirements?: unknown }).technical_requirements;
    const retry = await supabase
      .from("artist_profiles")
      .upsert(fallbackPayload, { onConflict: "id" })
      .select()
      .single();
    updated = retry.data;
    error = retry.error;
  }

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: "Profile draft saved successfully.",
    profile: updated as ArtistProfileData,
  };
}

/**
 * Submit profile for administrator review
 */
export async function submitProfileForReview(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, message: "Database not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized. Please log in." };
  }

  // 1. Fetch current profile to validate completeness
  const { data: profile, error: fetchErr } = await supabase
    .from("artist_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (fetchErr || !profile) {
    return {
      success: false,
      message: "Please complete and save your profile details before submitting.",
    };
  }

  // 2. Validate required fields for submission
  if (!profile.stage_name || !profile.category || !profile.city) {
    return {
      success: false,
      message: "Stage name, category, and city are required before submission.",
    };
  }
  if (!profile.bio || profile.bio.length < 30) {
    return {
      success: false,
      message: "Please provide a biography of at least 30 characters describing your talent.",
    };
  }
  if (!profile.starting_price || profile.starting_price <= 0) {
    return {
      success: false,
      message: "Please set your starting performance fee before submitting.",
    };
  }

  // 3. Update status to pending_review
  const { error: updateErr } = await supabase
    .from("artist_profiles")
    .update({ profile_status: "pending_review" })
    .eq("id", user.id);

  if (updateErr) {
    return { success: false, message: updateErr.message };
  }

  return {
    success: true,
    message: "Your profile has been submitted for review! Our curation team will review it shortly.",
  };
}

/**
 * Fetch a public artist profile by slug with preview support for the owner
 */
export async function getPublicArtistBySlug(slug: string): Promise<{
  profile: ArtistProfileData | null;
  portfolio: PortfolioItemData[];
  isOwnerPreview: boolean;
}> {
  if (!isSupabaseConfigured() || !slug) {
    return { profile: null, portfolio: [], isOwnerPreview: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Try to find the artist profile
  const { data: profile } = await supabase
    .from("artist_profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!profile) {
    return { profile: null, portfolio: [], isOwnerPreview: false };
  }

  const isOwner = Boolean(user && user.id === profile.id);

  // If not published and not the owner, hide it completely (404 / null)
  if (profile.profile_status !== "published" && !isOwner) {
    return { profile: null, portfolio: [], isOwnerPreview: false };
  }

  // Fetch portfolio items
  const { data: items } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("artist_id", profile.id)
    .order("display_order", { ascending: true });

  return {
    profile: profile as ArtistProfileData,
    portfolio: (items as PortfolioItemData[]) || [],
    isOwnerPreview: isOwner && profile.profile_status !== "published",
  };
}

/**
 * Add a new portfolio item (image, youtube, audio, or link)
 */
export async function addPortfolioItem(item: {
  title: string;
  description?: string;
  media_type: "image" | "youtube" | "audio" | "link";
  media_url: string;
  thumbnail_url?: string;
}): Promise<{ success: boolean; message?: string; item?: PortfolioItemData }> {
  if (!isSupabaseConfigured()) {
    return { success: false, message: "Database not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized." };
  }

  if (!item.title?.trim() || !item.media_url?.trim()) {
    return { success: false, message: "Title and media URL are required." };
  }

  // Count existing items to set display_order
  const { count } = await supabase
    .from("portfolio_items")
    .select("*", { count: "exact", head: true })
    .eq("artist_id", user.id);

  const { data, error } = await supabase
    .from("portfolio_items")
    .insert({
      artist_id: user.id,
      title: item.title.trim(),
      description: item.description?.trim() || null,
      media_type: item.media_type,
      media_url: item.media_url.trim(),
      thumbnail_url: item.thumbnail_url?.trim() || null,
      display_order: (count || 0) + 1,
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: "Portfolio item added successfully.",
    item: data as PortfolioItemData,
  };
}

/**
 * Delete a portfolio item owned by the current artist
 */
export async function deletePortfolioItem(
  itemId: string
): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, message: "Database not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized." };
  }

  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", itemId)
    .eq("artist_id", user.id);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Portfolio item removed." };
}

/**
 * Reorder portfolio items
 */
export async function reorderPortfolioItems(
  orderedIds: string[]
): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured() || orderedIds.length === 0) {
    return { success: false, message: "Invalid request." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized." };
  }

  // Update display_order for each item
  for (let index = 0; index < orderedIds.length; index++) {
    await supabase
      .from("portfolio_items")
      .update({ display_order: index + 1 })
      .eq("id", orderedIds[index])
      .eq("artist_id", user.id);
  }

  return { success: true, message: "Portfolio order updated." };
}

