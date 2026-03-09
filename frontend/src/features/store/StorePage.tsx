import { useState } from 'react'
import {
  ShoppingBag,
  Star,
  Heart,
  Search,
  Truck,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Category = 'all' | 'clothing' | 'posters' | 'collectibles' | 'digital'

interface Product {
  id: number
  name: string
  celebrity: string
  price: number
  originalPrice?: number
  rating: number
  reviews: number
  category: Category
  tag?: string
  gradient: string
  isSoldOut: boolean
}

const demoProducts: Product[] = [
  { id: 1, name: 'Signature Edition T-Shirt', celebrity: 'Priya Sharma', price: 1499, originalPrice: 1999, rating: 4.8, reviews: 234, category: 'clothing', tag: 'Bestseller', gradient: 'from-rose-400/30 to-pink-600/10', isSoldOut: false },
  { id: 2, name: 'Signed Concert Poster', celebrity: 'Rahul Mehta', price: 2999, rating: 4.9, reviews: 89, category: 'posters', tag: 'Limited', gradient: 'from-blue-400/30 to-indigo-600/10', isSoldOut: false },
  { id: 3, name: 'Limited Edition Hoodie', celebrity: 'Ananya Roy', price: 2499, originalPrice: 3499, rating: 4.7, reviews: 156, category: 'clothing', gradient: 'from-violet-400/30 to-purple-600/10', isSoldOut: false },
  { id: 4, name: 'Collectible Figurine', celebrity: 'Vikram Singh', price: 4999, rating: 5.0, reviews: 45, category: 'collectibles', tag: 'Rare', gradient: 'from-amber-400/30 to-orange-600/10', isSoldOut: true },
  { id: 5, name: 'Digital Art Collection (NFT)', celebrity: 'Neha Kapoor', price: 999, rating: 4.5, reviews: 312, category: 'digital', gradient: 'from-emerald-400/30 to-teal-600/10', isSoldOut: false },
  { id: 6, name: 'Event Crew Cap', celebrity: 'Amit Patel', price: 799, originalPrice: 1199, rating: 4.6, reviews: 178, category: 'clothing', tag: 'Sale', gradient: 'from-cyan-400/30 to-blue-600/10', isSoldOut: false },
  { id: 7, name: 'Autographed Photo Frame', celebrity: 'Priya Sharma', price: 3499, rating: 4.9, reviews: 67, category: 'collectibles', tag: 'Exclusive', gradient: 'from-rose-400/30 to-amber-600/10', isSoldOut: false },
  { id: 8, name: 'Fan Art Print Set', celebrity: 'Ananya Roy', price: 1299, rating: 4.4, reviews: 203, category: 'posters', gradient: 'from-indigo-400/30 to-violet-600/10', isSoldOut: false },
]

const categories: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'posters', label: 'Posters' },
  { value: 'collectibles', label: 'Collectibles' },
  { value: 'digital', label: 'Digital' },
]

export function StorePage() {
  const [category, setCategory] = useState<Category>('all')
  const [search, setSearch] = useState('')
  const [wishlist, setWishlist] = useState<Set<number>>(new Set())

  const filtered = demoProducts.filter((p) => {
    if (category !== 'all' && p.category !== category) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.celebrity.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggleWishlist = (id: number) => {
    setWishlist((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-text-primary">Merchandise Store</h1>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Official merch, signed posters, and limited edition collectibles
            </p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input-field !pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border',
                category === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-text-secondary hover:bg-bg-secondary',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Promo banner */}
      <div className="card overflow-hidden bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-text-primary">Free Shipping on orders above ₹2000</p>
            <p className="text-xs text-text-secondary mt-0.5">Use code CELEFAN at checkout</p>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-primary" />
            <Shield className="h-5 w-5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <div key={product.id} className="card overflow-hidden hover:shadow-md transition-shadow animate-fade-in group">
            <div className={cn('relative h-44 bg-gradient-to-br flex items-center justify-center', product.gradient)}>
              <ShoppingBag className="h-12 w-12 text-text-muted/20 group-hover:scale-110 transition-transform" />
              {product.tag && (
                <span className={cn(
                  'absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                  product.tag === 'Bestseller' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  product.tag === 'Limited' || product.tag === 'Rare' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                  product.tag === 'Sale' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
                )}>
                  {product.tag}
                </span>
              )}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={cn(
                  'absolute top-3 right-3 rounded-full p-1.5 transition-colors',
                  wishlist.has(product.id)
                    ? 'bg-rose-100 text-rose-500'
                    : 'bg-white/80 text-text-muted hover:text-rose-500',
                )}
              >
                <Heart className={cn('h-4 w-4', wishlist.has(product.id) && 'fill-current')} />
              </button>
              {product.isSoldOut && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-text-primary">Sold Out</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-[11px] text-text-muted">{product.celebrity}</p>
              <h3 className="text-sm font-semibold text-text-primary mt-0.5 truncate">{product.name}</h3>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-medium text-text-primary">{product.rating}</span>
                </div>
                <span className="text-[10px] text-text-muted">({product.reviews} reviews)</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-text-primary">₹{product.price.toLocaleString()}</span>
                  {product.originalPrice && (
                    <span className="text-xs text-text-muted line-through">₹{product.originalPrice.toLocaleString()}</span>
                  )}
                </div>
                <button
                  disabled={product.isSoldOut}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                    product.isSoldOut
                      ? 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-hover',
                  )}
                >
                  {product.isSoldOut ? 'Sold Out' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
