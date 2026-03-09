import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Briefcase,
  MapPin,
  Globe,
  IndianRupee,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { usersApi } from '@/api/users'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

const categories = [
  'Singer',
  'Dancer',
  'Actor',
  'Comedian',
  'Anchor/Host',
  'Musician',
  'DJ',
  'Magician',
  'Band',
  'Model',
  'Photographer',
  'Other',
]

const stepLabels = ['Basic Info', 'Professional', 'Bio & Pricing']

export function SetupProfilePage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [existingProfile, setExistingProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({
    name: '',
    category: '',
    location: '',
    languages: '',
    bio: '',
    phone: '',
    min_price: 0,
    max_price: 0,
    experience_years: 0,
  })

  useEffect(() => {
    async function loadExisting() {
      try {
        const { data } = await usersApi.getMyProfile()
        setExistingProfile(data)
        setForm({
          name: data.name || '',
          category: data.category || '',
          location: data.location || '',
          languages: data.languages || '',
          bio: data.bio || '',
          phone: data.phone || '',
          min_price: data.min_price || 0,
          max_price: data.max_price || 0,
          experience_years: data.experience_years || 0,
        })
      } catch {
        setForm((prev) => ({
          ...prev,
          name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
        }))
      }
    }
    loadExisting()
  }, [user])

  const update = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (existingProfile) {
        await usersApi.updateProfile(form)
      } else {
        await usersApi.createProfile(form)
      }
      navigate('/profile', { replace: true })
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 0) return form.name.trim() && form.category
    if (step === 1) return true
    return true
  }

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            {existingProfile ? 'Edit' : 'Setup'} Your Profile
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Tell us about yourself to get discovered
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  i <= step
                    ? 'bg-primary text-white'
                    : 'bg-bg-tertiary text-text-muted',
                )}
              >
                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="font-bold">{i + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 2 && <ChevronRight className="h-4 w-4 text-text-muted mx-1" />}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
                  <User className="h-4 w-4" /> Display Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="input-field"
                  placeholder="Your full name or stage name"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
                  <Briefcase className="h-4 w-4" /> Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => update('category', cat)}
                      className={cn(
                        'rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all',
                        form.category === cat
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-text-secondary hover:border-text-muted',
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
                  <MapPin className="h-4 w-4" /> Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  className="input-field"
                  placeholder="e.g. Mumbai, Maharashtra"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
                  <Globe className="h-4 w-4" /> Languages
                </label>
                <input
                  type="text"
                  value={form.languages}
                  onChange={(e) => update('languages', e.target.value)}
                  className="input-field"
                  placeholder="e.g. Hindi, English, Tamil"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
                  <Briefcase className="h-4 w-4" /> Experience (years)
                </label>
                <input
                  type="number"
                  value={form.experience_years}
                  onChange={(e) => update('experience_years', Number(e.target.value))}
                  className="input-field"
                  min={0}
                  max={50}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="input-field"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
                  <FileText className="h-4 w-4" /> Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value)}
                  className="input-field min-h-[100px] resize-none"
                  placeholder="Write a brief bio about yourself, your experience, and what makes you unique..."
                  maxLength={1000}
                />
                <p className="text-xs text-text-muted mt-1 text-right">{form.bio.length}/1000</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
                  <IndianRupee className="h-4 w-4" /> Price Range (per event)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={form.min_price || ''}
                    onChange={(e) => update('min_price', Number(e.target.value))}
                    className="input-field"
                    placeholder="Min price"
                    min={0}
                  />
                  <input
                    type="number"
                    value={form.max_price || ''}
                    onChange={(e) => update('max_price', Number(e.target.value))}
                    className="input-field"
                    placeholder="Max price"
                    min={0}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="btn-ghost disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            {step < 2 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="btn-primary"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {loading ? 'Saving...' : existingProfile ? 'Update Profile' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
