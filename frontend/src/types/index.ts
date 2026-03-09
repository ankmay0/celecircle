export type UserRole = 'artist' | 'organizer' | 'admin'

export type GigStatus = 'draft' | 'open' | 'closed' | 'completed' | 'cancelled'

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export interface User {
  id: number
  email: string
  role: UserRole
  is_verified: boolean
  verification_type: string | null
  verification_payment_status: string | null
  verification_expiry: string | null
  is_active: boolean
  created_at: string
  first_name: string | null
  last_name: string | null
  username: string | null
  profile_photo_url: string | null
}

export interface Profile {
  id: number
  user_id: number
  name: string
  category: string
  location: string | null
  languages: string | null
  bio: string | null
  phone: string | null
  profile_photo_url: string | null
  portfolio_videos: string | null
  portfolio_images: string | null
  portfolio_links: string | null
  min_price: number
  max_price: number
  experience_years: number
  ai_score: number
  response_time_avg: number
  total_hires: number
  total_reviews: number
  average_rating: number
  verification_type: string | null
  verification_expiry: string | null
  created_at: string
  updated_at: string
}

export interface ProfileCreate {
  name: string
  category: string
  location?: string
  languages?: string
  bio?: string
  phone?: string
  min_price?: number
  max_price?: number
  experience_years?: number
}

export interface ProfileUpdate extends Partial<ProfileCreate> {
  portfolio_videos?: string[]
  portfolio_images?: string[]
  portfolio_links?: string[]
  past_events?: Record<string, unknown>[]
  availability_calendar?: Record<string, unknown>
}

export interface PostAuthorProfile {
  name: string | null
  category: string | null
}

export interface PostAuthor {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  verification_type: string | null
  profile: PostAuthorProfile | null
  profile_photo_url?: string | null
}

export interface Post {
  id: number
  author_id: number
  content: string
  media_type: string
  media_urls: string | null
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  updated_at: string
  author: PostAuthor | null
  is_liked?: boolean
}

export interface Comment {
  id: number
  author_id: number
  post_id: number
  parent_id: number | null
  content: string
  likes_count: number
  created_at: string
  updated_at: string
  author?: PostAuthor
}

export interface Gig {
  id: number
  organizer_id: number
  title: string
  description: string
  category: string
  location: string
  event_date: string
  budget_min: number
  budget_max: number
  status: GigStatus
  required_languages: string | null
  required_experience: number
  created_at: string
  updated_at: string
  organizer?: PostAuthor
}

export interface GigCreate {
  title: string
  description: string
  category: string
  location: string
  event_date: string
  budget_min: number
  budget_max: number
  required_languages?: string
  required_experience?: number
}

export interface Application {
  id: number
  gig_id: number
  artist_id: number
  proposal: string
  quote: number
  status: ApplicationStatus
  created_at: string
  updated_at: string
  artist?: PostAuthor
}

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: string
  is_read: boolean
  link: string | null
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface SearchResult {
  id: number
  user_id: number
  type: string
  name: string
  category: string | null
  location: string | null
  email: string
  is_verified: boolean
  verification_type: string | null
  profile_photo_url: string | null
  ai_score: number
}
