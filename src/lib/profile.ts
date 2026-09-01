import type { SupabaseClient, User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  nickname: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  licence_number: string | null;
  licence_country: string | null;
  licence_expiry: string | null;
  passport_number: string | null;
  passport_country: string | null;
  passport_expiry: string | null;
  theme: string;
  notify_booking_email: boolean;
  notify_price_alerts: boolean;
  notify_marketing: boolean;
};

export type BookingRow = {
  id: string;
  booking_ref: string;
  vehicle_name: string | null;
  pickup_location: string | null;
  pickup_datetime: string | null;
  return_datetime: string | null;
  insurance_name: string | null;
  total_price: number | null;
  currency: string | null;
  cabinet_url: string | null;
  created_at: string;
};

/** Fields shown on the Details tab, used for the completeness indicator. */
export const DETAIL_FIELDS = [
  "full_name",
  "date_of_birth",
  "gender",
  "phone",
  "licence_number",
  "licence_country",
  "licence_expiry",
  "passport_number",
  "passport_country",
  "passport_expiry",
] as const satisfies readonly (keyof Profile)[];

export function profileCompletion(profile: Profile | null): number {
  if (!profile) return 0;
  const filled = DETAIL_FIELDS.filter((f) => {
    const v = profile[f];
    return typeof v === "string" && v.trim().length > 0;
  }).length;
  return Math.round((filled / DETAIL_FIELDS.length) * 100);
}

/** Google puts the profile picture in user_metadata; providers vary on the key. */
export function avatarUrlFor(user: User | null): string | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const url = meta.avatar_url ?? meta.picture;
  return typeof url === "string" && url.length > 0 ? url : null;
}

export function displayNameFor(
  user: User | null,
  profile: Profile | null,
): string {
  const meta = user?.user_metadata ?? {};
  return (
    profile?.nickname ||
    profile?.full_name ||
    (typeof meta.full_name === "string" ? meta.full_name : "") ||
    (typeof meta.name === "string" ? meta.name : "") ||
    user?.email?.split("@")[0] ||
    "Account"
  );
}

export function initialFor(user: User | null, profile: Profile | null): string {
  const name = displayNameFor(user, profile);
  const ch = name.trim()[0];
  return ch ? ch.toUpperCase() : "?";
}

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile:", error.message);
    return null;
  }
  return (data as Profile) ?? null;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<Profile>,
): Promise<{ error: string | null }> {
  // upsert rather than update: the row normally exists (created by trigger),
  // but this keeps things working if the trigger hasn't run for some reason.
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...patch }, { onConflict: "id" });

  return { error: error?.message ?? null };
}

export async function fetchBookings(
  supabase: SupabaseClient,
): Promise<BookingRow[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load bookings:", error.message);
    return [];
  }
  return (data as BookingRow[]) ?? [];
}
