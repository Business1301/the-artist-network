"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import PortfolioManager from "@/app/components/PortfolioManager";
import { createClient } from "@/lib/supabase/client";
import {
  getArtistProfile,
  saveArtistProfile,
  submitProfileForReview,
  ArtistProfileData,
  PortfolioItemData,
} from "@/app/actions/artist";

const CATEGORIES = [
  "Singers & Vocalists",
  "DJs & Electronic Music",
  "Live Bands & Instrumentalists",
  "Stand-up Comedians",
  "Dancers & Choreographers",
  "Painters & Visual Artists",
  "Magicians & Illusionists",
  "Anchors & Event Hosts",
  "Classical & Folk Artists",
];

const POPULAR_GENRES = [
  "Bollywood",
  "Sufi",
  "Acoustic Pop",
  "EDM & House",
  "Indian Classical",
  "Rock",
  "Indie",
  "Hip-Hop",
  "Ghazal",
  "Jazz & Blues",
];

const POPULAR_SPECIALITIES = [
  "Weddings & Sangeet",
  "Corporate Galas",
  "Club & Lounge Nights",
  "Private Luxury Dinners",
  "College Festivals",
  "Outdoor Concerts",
  "Cocktail Receptions",
];

const POPULAR_LANGUAGES = [
  "Hindi",
  "English",
  "Punjabi",
  "Urdu",
  "Marathi",
  "Gujarati",
  "Tamil",
  "Bengali",
];

const DEFAULT_TECHNICAL_REQUIREMENTS = [
  "PA system: Speakers, amplifiers, and mixers for sound.",
  "Monitors: Stage monitors for band members.",
  "Microphones: For vocals and instruments (with stands).",
  "Instruments: Drums set required on stage.",
  "Power supply: Adequate outlets and extension cords.",
  "Air travel to venue: Flight arrangements for the band and crew.",
];

const COMMON_RIDER_SUGGESTIONS = [
  "PA system (Speakers, amplifiers, mixer)",
  "Stage monitors for band members",
  "Vocal microphones with boom stands",
  "Acoustic drum kit on stage",
  "16A clean power outlets on stage",
  "Dedicated green room with mirror",
  "Flight / travel arrangements for crew",
  "Hotel stay & local airport transfers",
];

export default function ArtistProfileEditorPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Form State
  const [stageName, setStageName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [city, setCity] = useState("Mumbai");
  const [state, setState] = useState("Maharashtra");
  const [country, setCountry] = useState("India");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState(3);
  const [startingPrice, setStartingPrice] = useState<number | "">("");
  const [pricingUnit, setPricingUnit] = useState<"per hour" | "per performance" | "per event">(
    "per performance"
  );
  const [genres, setGenres] = useState<string[]>([]);
  const [specialities, setSpecialities] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["Hindi", "English"]);
  const [technicalRequirements, setTechnicalRequirements] = useState<string[]>(DEFAULT_TECHNICAL_REQUIREMENTS);
  const [customRequirement, setCustomRequirement] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Server Profile State
  const [existingProfile, setExistingProfile] = useState<ArtistProfileData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItemData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<"profile" | "cover" | null>(null);

  // Tag inputs
  const [customGenre, setCustomGenre] = useState("");
  const [customSpeciality, setCustomSpeciality] = useState("");

  // Load existing profile on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirect=/dashboard/artist/edit");
        return;
      }
      setUserId(user.id);

      const res = await getArtistProfile();
      if (res.success && res.profile) {
        const p = res.profile;
        setExistingProfile(p);
        setStageName(p.stage_name || "");
        setCategory(p.category || CATEGORIES[0]);
        setCity(p.city || "Mumbai");
        setState(p.state || "Maharashtra");
        setCountry(p.country || "India");
        setBio(p.bio || "");
        setExperienceYears(p.experience_years || 0);
        setStartingPrice(p.starting_price || "");
        setPricingUnit(p.pricing_unit || "per performance");
        setGenres(p.genres || []);
        setSpecialities(p.specialities || []);
        setLanguages(p.languages || ["Hindi", "English"]);
        if (p.technical_requirements !== undefined && p.technical_requirements !== null) {
          setTechnicalRequirements(p.technical_requirements);
        } else {
          setTechnicalRequirements(DEFAULT_TECHNICAL_REQUIREMENTS);
        }
        setProfileImageUrl(p.profile_image_url || "");
        setCoverImageUrl(p.cover_image_url || "");
        setInstagramUrl(p.instagram_url || "");
        setYoutubeUrl(p.youtube_url || "");
        setFacebookUrl(p.facebook_url || "");
        setWebsiteUrl(p.website_url || "");
        setPortfolio(res.portfolio || []);
      }
      setIsLoading(false);
    }

    loadData();
  }, [router]);

  // Calculate profile completeness score (0 to 100%)
  const calculateCompleteness = () => {
    let score = 0;
    if (stageName.trim()) score += 15;
    if (category) score += 10;
    if (city.trim()) score += 10;
    if (bio.trim().length >= 30) score += 20;
    if (startingPrice && Number(startingPrice) > 0) score += 15;
    if (genres.length > 0) score += 10;
    if (specialities.length > 0) score += 5;
    if (profileImageUrl.trim()) score += 10;
    if (instagramUrl.trim() || youtubeUrl.trim()) score += 5;
    return Math.min(score, 100);
  };

  const completeness = calculateCompleteness();

  // Handle image upload to Supabase Storage bucket 'artist-media'
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        text: "File size exceeds 5MB limit. Please upload a smaller image.",
      });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setStatusMessage({
        type: "error",
        text: "Only JPG, PNG, and WebP images are supported.",
      });
      return;
    }

    setUploadingImage(type);
    setStatusMessage({ type: "info", text: `Uploading ${type} image...` });

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const filePath = `${userId}/${type}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("artist-media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("artist-media")
        .getPublicUrl(filePath);

      if (type === "profile") {
        setProfileImageUrl(publicUrlData.publicUrl);
      } else {
        setCoverImageUrl(publicUrlData.publicUrl);
      }

      setStatusMessage({
        type: "success",
        text: `${type === "profile" ? "Profile" : "Cover"} picture uploaded successfully! Remember to save draft.`,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Upload failed.";
      setStatusMessage({
        type: "error",
        text: `Image upload failed: ${errMsg}. You may also paste a direct image URL.`,
      });
    } finally {
      setUploadingImage(null);
    }
  };

  // Tag helper
  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const addCustomItem = (
    list: string[],
    setList: (v: string[]) => void,
    val: string,
    setVal: (v: string) => void
  ) => {
    const clean = val.trim();
    if (clean && !list.includes(clean)) {
      setList([...list, clean]);
      setVal("");
    }
  };

  const handleAddRequirement = (text?: string) => {
    const val = (text || customRequirement).trim();
    if (val && !technicalRequirements.includes(val)) {
      setTechnicalRequirements([...technicalRequirements, val]);
      if (!text) setCustomRequirement("");
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setTechnicalRequirements(technicalRequirements.filter((_, i) => i !== index));
  };

  const handleClearAllRequirements = () => {
    setTechnicalRequirements([]);
  };

  const handleResetDefaultRequirements = () => {
    setTechnicalRequirements([...DEFAULT_TECHNICAL_REQUIREMENTS]);
  };

  // Save Draft
  const handleSaveDraft = () => {
    setStatusMessage(null);
    startTransition(async () => {
      const res = await saveArtistProfile({
        stage_name: stageName,
        category,
        city,
        state,
        country,
        bio,
        experience_years: Number(experienceYears) || 0,
        starting_price: startingPrice ? Number(startingPrice) : null,
        pricing_unit: pricingUnit,
        genres,
        specialities,
        languages,
        technical_requirements: technicalRequirements,
        profile_image_url: profileImageUrl,
        cover_image_url: coverImageUrl,
        instagram_url: instagramUrl,
        youtube_url: youtubeUrl,
        facebook_url: facebookUrl,
        website_url: websiteUrl,
        profile_status: existingProfile?.profile_status || "draft",
      });

      if (!res.success) {
        setStatusMessage({ type: "error", text: res.message || "Failed to save draft." });
      } else {
        setExistingProfile(res.profile || null);
        setStatusMessage({
          type: "success",
          text: "Changes saved successfully as a draft! You can continue editing or submit for review when ready.",
        });
      }
    });
  };

  // Submit for Review
  const handleSubmitReview = () => {
    setStatusMessage(null);
    startTransition(async () => {
      // First save current fields
      const saveRes = await saveArtistProfile({
        stage_name: stageName,
        category,
        city,
        state,
        country,
        bio,
        experience_years: Number(experienceYears) || 0,
        starting_price: startingPrice ? Number(startingPrice) : null,
        pricing_unit: pricingUnit,
        genres,
        specialities,
        languages,
        technical_requirements: technicalRequirements,
        profile_image_url: profileImageUrl,
        cover_image_url: coverImageUrl,
        instagram_url: instagramUrl,
        youtube_url: youtubeUrl,
        facebook_url: facebookUrl,
        website_url: websiteUrl,
      });

      if (!saveRes.success) {
        setStatusMessage({
          type: "error",
          text: saveRes.message || "Failed to update profile before submission.",
        });
        return;
      }

      // Then trigger status transition to pending_review
      const submitRes = await submitProfileForReview();
      if (!submitRes.success) {
        setStatusMessage({ type: "error", text: submitRes.message });
      } else {
        setStatusMessage({ type: "success", text: submitRes.message });
        setExistingProfile((prev) => (prev ? { ...prev, profile_status: "pending_review" } : null));
      }
    });
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading your artist profile...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isPendingReview = existingProfile?.profile_status === "pending_review";
  const isPublished = existingProfile?.profile_status === "published";
  const isRejected = existingProfile?.profile_status === "rejected";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-950 text-gray-100 pt-24 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header & Navigation Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs text-purple-400 mb-2">
                <Link href="/dashboard/artist" className="hover:underline">
                  Artist Dashboard
                </Link>
                <span>/</span>
                <span className="text-gray-400">Profile Editor</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Artist Profile &amp; Onboarding
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Curate your professional presence to get booked by top venues and clients.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              {existingProfile?.slug && (
                <Link
                  href={`/artists/${existingProfile.slug}`}
                  target="_blank"
                  className="px-4 py-2 rounded-xl border border-gray-700 bg-gray-900/60 hover:bg-gray-800 text-xs font-semibold text-gray-200 transition-colors"
                >
                  👁️ Preview Profile
                </Link>
              )}
              <Link
                href="/dashboard/artist"
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Status Banners */}
          {statusMessage && (
            <div
              className={`mb-6 p-4 rounded-2xl text-xs font-medium flex items-center justify-between shadow-lg ${
                statusMessage.type === "success"
                  ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-200"
                  : statusMessage.type === "error"
                  ? "bg-rose-950/80 border border-rose-500/40 text-rose-200"
                  : "bg-purple-950/80 border border-purple-500/40 text-purple-200"
              }`}
            >
              <span>{statusMessage.text}</span>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-gray-400 hover:text-white ml-4 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Approval State Card */}
          <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-800/40 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {isPublished
                    ? "🌟"
                    : isPendingReview
                    ? "⏳"
                    : isRejected
                    ? "⚠️"
                    : "📝"}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Status:</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        isPublished
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : isPendingReview
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : isRejected
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-gray-700/60 text-gray-300 border border-gray-600"
                      }`}
                    >
                      {isPublished
                        ? "Approved & Published"
                        : isPendingReview
                        ? "Pending Admin Review"
                        : isRejected
                        ? "Changes Requested"
                        : "Draft in Progress"}
                    </span>
                    {existingProfile?.is_verified && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        ✓ Verified Artist
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {isPublished
                      ? "Your profile is live on the public directory."
                      : isPendingReview
                      ? "Our team is reviewing your profile. You can still save updates."
                      : isRejected
                      ? `Review notes: ${existingProfile?.rejection_reason || "Please update your profile details and resubmit."}`
                      : "Fill in your details below and submit for administrator review."}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full sm:w-48 text-right">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Completeness</span>
                  <span className="font-bold text-purple-400">{completeness}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveDraft();
            }}
            className="space-y-8"
          >
            {/* SECTION 1: Basic Information */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <span>1.</span> Basic Stage Identity
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                This is how event planners, restaurants, and clients will recognize you.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Stage Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Artist / Stage Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    placeholder="e.g. DJ Kabir, Aakash Trio, Maya Sen"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                  {existingProfile?.slug && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      Public Slug: <code className="text-purple-400">/artists/{existingProfile.slug}</code>
                    </p>
                  )}
                </div>

                {/* Primary Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Primary Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Profile Image */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Profile Picture (Headshot or Stage Photo)
                  </label>
                  <div className="flex items-center gap-4">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="Profile preview"
                        className="w-14 h-14 rounded-2xl object-cover border border-purple-500/40"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                        Photo
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="inline-block px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 cursor-pointer transition-colors">
                        {uploadingImage === "profile" ? "Uploading..." : "Upload Photo (Max 5MB)"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "profile")}
                          disabled={uploadingImage !== null}
                        />
                      </label>
                      <input
                        type="url"
                        value={profileImageUrl}
                        onChange={(e) => setProfileImageUrl(e.target.value)}
                        placeholder="Or paste direct image URL"
                        className="w-full mt-2 px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Cover Banner Image */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Cover Banner Image (Stage/Atmosphere)
                  </label>
                  <div className="flex items-center gap-4">
                    {coverImageUrl ? (
                      <img
                        src={coverImageUrl}
                        alt="Cover preview"
                        className="w-20 h-14 rounded-xl object-cover border border-purple-500/40"
                      />
                    ) : (
                      <div className="w-20 h-14 rounded-xl bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                        Banner
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="inline-block px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 cursor-pointer transition-colors">
                        {uploadingImage === "cover" ? "Uploading..." : "Upload Banner (Max 5MB)"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "cover")}
                          disabled={uploadingImage !== null}
                        />
                      </label>
                      <input
                        type="url"
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        placeholder="Or paste direct banner URL"
                        className="w-full mt-2 px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Location */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <span>2.</span> Location &amp; Service Radius
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                Tell clients where you are based and available to perform.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    City / Base <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai, Delhi, Bangalore"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra, Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Professional Bio & Talent Tags */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <span>3.</span> Professional Biography &amp; Talent Tags
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                Share your journey, stage experience, and highlight your repertoire.
              </p>

              <div className="space-y-6">
                {/* Biography */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-gray-300">
                      Artist Biography <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[11px] text-gray-500">
                      {bio.length} characters (min 30 for submission)
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your musical style, notable performances, and what makes your live act unique..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Experience */}
                <div className="w-full sm:w-1/3">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Years of Stage Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Genres */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Genres &amp; Styles (Select or add custom)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {POPULAR_GENRES.map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => toggleItem(genres, setGenres, g)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          genres.includes(g)
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-gray-800/80 text-gray-400 hover:text-white"
                        }`}
                      >
                        {genres.includes(g) ? `✓ ${g}` : `+ ${g}`}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      placeholder="Add custom genre..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        addCustomItem(genres, setGenres, customGenre, setCustomGenre)
                      }
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Specialities */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Event Specialities
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {POPULAR_SPECIALITIES.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => toggleItem(specialities, setSpecialities, s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          specialities.includes(s)
                            ? "bg-pink-600 text-white shadow-sm"
                            : "bg-gray-800/80 text-gray-400 hover:text-white"
                        }`}
                      >
                        {specialities.includes(s) ? `✓ ${s}` : `+ ${s}`}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      value={customSpeciality}
                      onChange={(e) => setCustomSpeciality(e.target.value)}
                      placeholder="Add custom speciality..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        addCustomItem(
                          specialities,
                          setSpecialities,
                          customSpeciality,
                          setCustomSpeciality
                        )
                      }
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Performance Languages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_LANGUAGES.map((lang) => (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => toggleItem(languages, setLanguages, lang)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          languages.includes(lang)
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-gray-800/80 text-gray-400 hover:text-white"
                        }`}
                      >
                        {languages.includes(lang) ? `✓ ${lang}` : `+ ${lang}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: Pricing */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <span>4.</span> Performance Fee &amp; Pricing
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                Provide an indicative starting fee so clients understand your price tier.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Starting Fee (₹ INR) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-gray-500 font-bold">₹</span>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={startingPrice}
                      onChange={(e) =>
                        setStartingPrice(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="e.g. 15000"
                      required
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Pricing Unit
                  </label>
                  <select
                    value={pricingUnit}
                    onChange={(e) =>
                      setPricingUnit(
                        e.target.value as "per hour" | "per performance" | "per event"
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="per performance">per performance (Standard set)</option>
                    <option value="per hour">per hour</option>
                    <option value="per event">per event (Full day / Occasion)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 5: Stage Requirements & Terms (Technical Rider) */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>5.</span> Stage Requirements &amp; Terms (Technical Rider)
                </h2>
                <div className="flex items-center gap-2">
                  {technicalRequirements.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleClearAllRequirements}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold underline"
                    >
                      Remove All
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetDefaultRequirements}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold underline"
                    >
                      Restore Standard Defaults
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-6">
                Specify what sound equipment, gear, power, or travel arrangements you require from venues. You can add custom items, remove unwanted items with ✕, or remove all requirements if you have none.
              </p>

              {/* Active Requirements List */}
              <div className="space-y-2 mb-6">
                {technicalRequirements.length === 0 ? (
                  <div className="p-4 rounded-xl bg-gray-950 border border-dashed border-gray-800 text-center text-xs text-gray-500">
                    No technical requirements specified. Your public profile will omit the requirements section.
                  </div>
                ) : (
                  technicalRequirements.map((req, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-950 border border-gray-800/90 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-purple-400 font-bold text-xs mt-0.5">•</span>
                        <span className="text-xs text-gray-200 leading-relaxed break-words">{req}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(idx)}
                        className="shrink-0 w-7 h-7 rounded-lg bg-gray-900 hover:bg-rose-950/60 border border-gray-800 hover:border-rose-800/60 text-gray-400 hover:text-rose-300 text-xs font-bold flex items-center justify-center transition-colors"
                        title="Remove this requirement"
                        aria-label={`Remove requirement: ${req}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Custom Requirement Input */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  Add Custom Requirement
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customRequirement}
                    onChange={(e) => setCustomRequirement(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddRequirement();
                      }
                    }}
                    placeholder="e.g. 2 cordless Shure microphones, keyboard stand, 16A power socket..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddRequirement()}
                    disabled={!customRequirement.trim()}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs font-bold text-white rounded-xl transition-colors shadow-sm"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Quick Add Suggestions */}
              <div>
                <span className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  Quick Add Common Requirements:
                </span>
                <div className="flex flex-wrap gap-2">
                  {COMMON_RIDER_SUGGESTIONS.map((suggestion) => {
                    const isAdded = technicalRequirements.includes(suggestion);
                    return (
                      <button
                        type="button"
                        key={suggestion}
                        onClick={() => {
                          if (isAdded) {
                            setTechnicalRequirements(technicalRequirements.filter((r) => r !== suggestion));
                          } else {
                            handleAddRequirement(suggestion);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isAdded
                            ? "bg-purple-600/30 border border-purple-500/50 text-purple-200"
                            : "bg-gray-950 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                        }`}
                      >
                        {isAdded ? `✓ ${suggestion} (Added)` : `+ ${suggestion}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 6: Social Media & Links */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <span>6.</span> Social Media &amp; Web Links
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                Link your verified social media and streaming accounts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Instagram Profile URL
                  </label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    YouTube Channel / Performance Link
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/@channel or watch link"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Facebook Page URL
                  </label>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Official Website / Electronic Press Kit (EPK)
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourdomain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 7: Portfolio Management */}
            {userId && (
              <PortfolioManager
                userId={userId}
                items={portfolio}
                onItemsChange={(newItems) => setPortfolio(newItems)}
              />
            )}

            {/* Bottom Floating/Sticky Action Bar */}
            <div className="sticky bottom-6 z-20 bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-400 text-center sm:text-left">
                <span>Saving updates your profile draft immediately.</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Draft"}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={isPending || isPendingReview}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all disabled:opacity-50"
                >
                  {isPendingReview ? "Under Review" : "Submit for Review →"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}
