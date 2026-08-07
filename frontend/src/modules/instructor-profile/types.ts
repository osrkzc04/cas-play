export interface SocialLinks {
  linkedin?: string | null;
  instagram?: string | null;
  youtube?: string | null;
}

export interface InstructorProfile {
  id: string;
  user_id: string;
  headline: string | null;
  specialty: string | null;
  about_me: string | null;
  social_links: SocialLinks | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateInstructorProfilePayload {
  headline?: string | null;
  specialty?: string | null;
  about_me?: string | null;
  social_links?: SocialLinks | null;
}

// Perfil público mostrado en la página del curso.
export interface InstructorPublic {
  user_id: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  specialty: string | null;
  about_me: string | null;
  social_links: SocialLinks | null;
  photo_url: string | null;
}
