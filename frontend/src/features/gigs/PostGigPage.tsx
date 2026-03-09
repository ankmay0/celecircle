import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  MapPin,
  Calendar,
  IndianRupee,
  Globe,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { gigsApi } from '@/api/gigs'

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
  'Other',
]

export function PostGigPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    event_date: '',
    budget_min: '',
    budget_max: '',
    required_languages: '',
    required_experience: 0,
  })

  const update = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await gigsApi.createGig({
        ...form,
        budget_min: Number(form.budget_min),
        budget_max: Number(form.budget_max),
        event_date: new Date(form.event_date).toISOString(),
      })
      navigate(`/gigs/${data.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gig')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-text-primary mb-6">Post a New Gig</h1>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Briefcase className="h-4 w-4" /> Gig Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="input-field"
              placeholder="e.g. Singer needed for Wedding Reception"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <FileText className="h-4 w-4" /> Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="input-field min-h-[120px] resize-none"
              placeholder="Describe the event, requirements, and what you're looking for..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
                <MapPin className="h-4 w-4" /> Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                className="input-field"
                placeholder="e.g. Mumbai"
                required
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Calendar className="h-4 w-4" /> Event Date
            </label>
            <input
              type="datetime-local"
              value={form.event_date}
              onChange={(e) => update('event_date', e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <IndianRupee className="h-4 w-4" /> Budget Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={form.budget_min}
                onChange={(e) => update('budget_min', e.target.value)}
                className="input-field"
                placeholder="Min budget"
                min={0}
                required
              />
              <input
                type="number"
                value={form.budget_max}
                onChange={(e) => update('budget_max', e.target.value)}
                className="input-field"
                placeholder="Max budget"
                min={0}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
                <Globe className="h-4 w-4" /> Required Languages
              </label>
              <input
                type="text"
                value={form.required_languages}
                onChange={(e) => update('required_languages', e.target.value)}
                className="input-field"
                placeholder="e.g. Hindi, English"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">
                Min Experience (years)
              </label>
              <input
                type="number"
                value={form.required_experience}
                onChange={(e) => update('required_experience', Number(e.target.value))}
                className="input-field"
                min={0}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-ghost border border-border flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {loading ? 'Publishing...' : 'Publish Gig'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
