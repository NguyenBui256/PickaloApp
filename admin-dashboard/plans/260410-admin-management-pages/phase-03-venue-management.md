# Phase 3: Venue Management Page

**Status:** Pending
**Priority:** P1
**Estimated Time:** 3 hours
**Dependencies:** Phase 1 (Foundation Components), Phase 2 (User Management patterns)

## Overview

Build complete venue management page with search, verification workflow, and venue details display.

## Features

| Feature | Description |
|---------|-------------|
| List Venues | Paginated table with venue data |
| Search | By venue name, location, address |
| Filter | By verification status |
| Verify/Unverify | With reason input |
| View Details | Modal with full venue info + images |
| Merchant Info | Show owner details |
| Image Gallery | Display venue images |

---

## Files to Create

### 1. `src/lib/hooks/use-venues.ts`

Custom hooks for venue queries and mutations.

```typescript
// Queries
export function useVenues(params: VenueListParams)
export function useVenueDetails(id: string)

// Mutations
export function useVerifyVenue()
export function useUnverifyVenue()
```

**Query Parameters:**
```typescript
interface VenueListParams {
  page?: number
  limit?: number
  search?: string      // search in name, address
  is_verified?: boolean
}
```

---

### 2. `src/pages/Venues.tsx`

Main venue management page.

**Structure:**
```tsx
<PageHeader title="Venues" subtitle="Manage and verify sports facilities" />
<FilterBar>
  <SearchInput value={search} onChange={setSearch} placeholder="Search venues..." />
  <Select value={status} onChange={setStatus} options={statusOptions} />
</FilterBar>
<DataTable data={venues} columns={venueColumns} loading={isLoading} />
<Pagination ... />
```

---

### 3. `src/components/admin/venue-table-columns.tsx`

Table column definitions for venues.

**Columns:**
| Column | Description |
|--------|-------------|
| Venue Name | Name with link |
| Address | Location text |
| Merchant | Owner name with link |
| Status | Verification badge (Verified/Pending) |
| Active | Active/Inactive badge |
| Bookings | Count |
| Created | Registration date |
| Actions | Verify/unverify, view buttons |

---

### 4. `src/components/admin/venue-actions.tsx`

Action buttons for venue row.

**Actions:**
- View Details (opens modal)
- Verify (if unverified)
- Unverify (if verified)

---

### 5. `src/components/admin/venue-details-dialog.tsx`

Modal showing full venue information.

**Display:**
- Venue name
- Address with map link
- Merchant info (name, phone, email)
- Verification status
- Active status
- Description (if available)
- Sport types (if available)
- Image gallery
- Booking count
- Created date
- Last updated

---

### 6. `src/components/admin/venue-image-gallery.tsx`

Image gallery component for venue photos.

**Features:**
- Grid layout for thumbnails
- Click to enlarge
- Previous/next navigation
- Image counter
- Download option

---

### 7. `src/components/admin/verify-venue-dialog.tsx`

Dialog for verifying a venue.

**Fields:**
- Venue info preview
- Images display
- Reason textarea (optional - for notes)
- Confirmation checkbox

---

## Implementation Steps

### Step 1: Create Hooks (30min)
1. Create `use-venues.ts` with list query
2. Add verify mutation
3. Add unverify mutation
4. Add query invalidation

### Step 2: Create Table Columns (30min)
1. Define column structure
2. Add verification status badges
3. Add merchant info display
4. Add action buttons

### Step 3: Build Page Layout (45min)
1. Create Venues.tsx
2. Add filter bar with search
3. Integrate data table
4. Add pagination

### Step 4: Create Dialogs (45min)
1. Venue details dialog
2. Image gallery component
3. Verify venue dialog
4. Wire up mutations

### Step 5: Integrate and Test (30min)
1. Connect all components
2. Test search by name/location
3. Test verification filter
4. Test verify/unverify actions
5. Test image gallery

---

## API Integration

### GET /admin/venues
```typescript
interface VenueListResponse {
  venues: Venue[]
  total: number
  page: number
  limit: number
}

interface Venue {
  id: string
  name: string
  merchant_id: string
  merchant_name: string
  merchant_phone: string
  address: string
  district: string
  city: string
  is_verified: boolean
  is_active: boolean
  description: string | null
  sport_types: string[]
  images: string[]
  bookings_count: number
  created_at: string
  updated_at: string
}
```

### PATCH /admin/venues/{id}/verify
```typescript
interface VerifyVenueRequest {
  reason?: string  // Optional notes
}
```

### GET /admin/venues/{id}
```typescript
interface VenueDetailsResponse extends Venue {
  merchant: {
    id: string
    name: string
    phone: string
    email: string | null
  }
  operating_hours: Record<string, { open: string; close: string }>
  amenities: string[]
  price_range: string
}
```

---

## Badge Variants

```typescript
// Verification Status
const verificationBadge = (isVerified: boolean) => ({
  variant: isVerified ? 'success' : 'warning',
  label: isVerified ? 'Verified' : 'Pending'
})

// Active Status
const activeBadge = (isActive: boolean) => ({
  variant: isActive ? 'success' : 'neutral',
  label: isActive ? 'Active' : 'Inactive'
})
```

---

## Image Gallery Implementation

```typescript
interface VenueImageGalleryProps {
  images: string[]
  venueName: string
}

export function VenueImageGallery({ images, venueName }: VenueImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  if (images.length === 0) {
    return <div className="text-muted-foreground">No images available</div>
  }

  return (
    <div className="space-y-4">
      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => { setSelectedIndex(index); setIsLightboxOpen(true) }}
            className="aspect-video overflow-hidden rounded-lg border"
          >
            <img src={image} alt={`${venueName} image ${index + 1}`} />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <Lightbox
          images={images}
          selectedIndex={selectedIndex}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </div>
  )
}
```

---

## Success Criteria

- [ ] Venues load and display in table
- [ ] Search filters by name/address
- [ ] Verification status filter works
- [ ] Verify action works with confirmation
- [ ] Unverify action works
- [ ] Venue details modal shows all info
- [ ] Image gallery displays correctly
- [ ] Lightbox navigation works
- [ ] Merchant info displays correctly
- [ ] Pagination works
- [ ] Loading and error states work

---

## Next Steps

After completing this phase:
1. Move to Phase 4: Booking Oversight Page
2. Continue reusing established patterns
