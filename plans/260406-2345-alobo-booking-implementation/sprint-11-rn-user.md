---
title: "Sprint 11: React Native - User Features"
description: "User-facing screens for venue browsing, booking flow, newsfeed, and profile management"
status: pending
priority: P1
effort: 14h
tags: [react-native, user-screens, booking, newsfeed]
created: 2026-04-06
---

# Sprint 11: React Native - User Features

## Overview

Implement user-facing screens including venue browsing with maps, booking creation and management, newsfeed, and user profile.

**Priority:** P1 (High - core user experience)
**Current Status:** Pending

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 3.2: User features)
- Sprint 3: `./sprint-03-venue-management.md` (Venue APIs)
- Sprint 4: `./sprint-04-booking-pricing.md` (Booking APIs)
- Sprint 7: `./sprint-07-newsfeed.md` (Newsfeed APIs)
- Sprint 10: `./sprint-10-rn-core.md` (Core setup)

## Key Insights

1. **Booking Flow**: Multi-step process (venue → slot → services → payment)
2. **Map Integration**: WebView with Leaflet for venue discovery
3. **Newsfeed**: Social features for finding opponents
4. **Booking Timeline**: Visual representation of availability

## Requirements

### Functional Requirements

1. **Home Screen**: Quick actions, nearby venues, upcoming bookings
2. **Venue Search**: List view with filters, map view
3. **Venue Details**: Images, info, pricing, reviews
4. **Booking Flow**: Date/time selection, services, payment
5. **My Bookings**: List with status, details, cancellation
6. **Newsfeed**: Post list, create post, comments
7. **Profile**: View/edit profile, settings
8. **Notifications**: Booking updates (future)

### Non-Functional Requirements

1. **Performance**: Smooth scrolling, fast image loading
2. **Offline**: Cache venue data for offline browsing
3. **Accessibility**: Screen reader support

## Architecture

### Screen Structure

```
User Tab Navigator:
├── Home Tab
│   ├── HomeScreen
│   │   ├── Quick Actions (Book, Find Opponent)
│   │   ├── Nearby Venues (horizontal scroll)
│   │   └── Upcoming Bookings
│   │
├── Venues Tab
│   ├── VenueListScreen (with filters)
│   ├── VenueMapScreen (Leaflet WebView)
│   ├── VenueDetailScreen
│   │   ├── Venue Info
│   │   ├── Pricing Info
│   │   └── Book Button
│   │
├── Bookings Tab
│   ├── BookingListScreen
│   ├── BookingDetailScreen
│   ├── BookingFlowScreen (multi-step)
│   │   ├── Step 1: Select Venue
│   │   ├── Step 2: Select Date/Time (Timeline)
│   │   ├── Step 3: Select Services
│   │   └── Step 4: Payment
│   │
├── Newsfeed Tab
│   ├── PostListScreen (with filters)
│   ├── PostDetailScreen
│   ├── CreatePostScreen
│   │
└── Profile Tab
    ├── ProfileScreen
    ├── EditProfileScreen
    └── SettingsScreen
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `frontend/src/screens/home/home-screen.tsx` | Home dashboard |
| `frontend/src/screens/venues/venue-list-screen.tsx` | Venue listing |
| `frontend/src/screens/venues/venue-map-screen.tsx` | Map view |
| `frontend/src/screens/venues/venue-detail-screen.tsx` | Venue details |
| `frontend/src/screens/bookings/booking-list-screen.tsx` | My bookings |
| `frontend/src/screens/bookings/booking-detail-screen.tsx` | Booking details |
| `frontend/src/screens/bookings/booking-flow-screen.tsx` | Booking wizard |
| `frontend/src/screens/bookings/booking-timeline-selector.tsx` | Time slot picker |
| `frontend/src/screens/newsfeed/post-list-screen.tsx` | Newsfeed |
| `frontend/src/screens/newsfeed/post-detail-screen.tsx` | Post with comments |
| `frontend/src/screens/newsfeed/create-post-screen.tsx` | Create post |
| `frontend/src/screens/profile/profile-screen.tsx` | User profile |
| `frontend/src/screens/profile/edit-profile-screen.tsx` | Edit profile |
| `frontend/src/components/venue-card/venue-card.tsx` | Venue card |
| `frontend/src/components/booking-card/booking-card.tsx` | Booking card |
| `frontend/src/components/post-card/post-card.tsx` | Post card |
| `frontend/src/components/booking-timeline/booking-timeline.tsx` | Timeline view |
| `frontend/src/components/venue-map-view/venue-map-view.tsx` | Map WebView wrapper |
| `frontend/src/services/venue-service.ts` | Venue API calls |
| `frontend/src/services/booking-service.ts` | Booking API calls |
| `frontend/src/services/post-service.ts` | Post API calls |

### Files to Modify

| Path | Changes |
|------|---------|
| `frontend/src/navigation/user-tab-navigator.tsx` | Add all screens |

## Implementation Steps

### Step 1: Create Service Layer (1.5h)

1. Create `frontend/src/services/venue-service.ts`:

```typescript
import { apiClient } from './api-client';

export const venueService = {
  getVenues: (params: VenueSearchParams) =>
    apiClient.get()('/venues', { params }),

  getVenueById: (id: string) =>
    apiClient.get()(`/venues/${id}`),

  getVenueServices: (id: string) =>
    apiClient.get()(`/venues/${id}/services`),

  getAvailability: (id: string, date: string) =>
    apiClient.get()(`/venues/${id}/availability`, { params: { date } }),

  getPricePreview: (data: PricePreviewRequest) =>
    apiClient.post()('/bookings/price-calculation', data),

  getDistricts: () =>
    apiClient.get()('/districts'),

  searchNearby: (lat: number, lng: number, radius: number) =>
    apiClient.get()('/map/nearby', { params: { lat, lng, radius } }),
};
```

2. Create `booking-service.ts` and `post-service.ts`

### Step 2: Create Home Screen (1.5h)

1. Create `frontend/src/screens/home/home-screen.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, VenueCard, BookingCard } from '@/components';

export function HomeScreen({ navigation }: any) {
  const [nearbyVenues, setNearbyVenues] = useState<Venue[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    // Get user location and nearby venues
    // Get upcoming bookings
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">Xin chào, {user?.full_name}!</Text>
        <Text variant="body">Bạn muốn đặt sân hôm nay?</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button title="Đặt sân ngay" onPress={() => navigation.navigate('VenueList')} />
        <Button title="Tìm đối thủ" variant="outline" onPress={() => navigation.navigate('Newsfeed')} />
      </View>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <View style={styles.section}>
          <Text variant="h3">Sắp tới</Text>
          {upcomingBookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </View>
      )}

      {/* Nearby Venues */}
      <View style={styles.section}>
        <Text variant="h3">Gần bạn</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {nearbyVenues.map(venue => (
            <VenueCard key={venue.id} venue={venue} compact />
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}
```

### Step 3: Create Venue Screens (3h)

1. **Venue List Screen**: List with filters (district, type, price)
2. **Venue Map Screen**: WebView with Leaflet map
3. **Venue Detail Screen**: Full venue info with booking button

**Venue Detail:**
- Images carousel
- Name, address, district
- Venue type, amenities
- Operating hours
- Pricing tiers (peak/off-peak)
- Services list
- Book button

### Step 4: Create Booking Flow (3h)

1. **Booking Timeline Selector**:

```typescript
// Timeline component showing available slots
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface BookingTimelineProps {
  venueId: string;
  date: Date;
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
}

export function BookingTimeline({ venueId, date, selectedSlot, onSlotSelect }: BookingTimelineProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    loadAvailability();
  }, [venueId, date]);

  const loadAvailability = async () => {
    const availability = await venueService.getAvailability(venueId, formatDate(date));
    setSlots(availability.slots);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {slots.map(slot => (
        <TouchableOpacity
          key={slot.time}
          onPress={() => slot.available && onSlotSelect(slot)}
          style={[
            styles.slot,
            !slot.available && styles.unavailable,
            selectedSlot?.time === slot.time && styles.selected,
          ]}
          disabled={!slot.available}
        >
          <Text variant="body">{slot.time}</Text>
          <Text variant="caption">{slot.price}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
```

2. **Booking Flow Screen**: Multi-step wizard

```typescript
// Steps: Venue → Date/Time → Services → Confirm
type BookingStep = 'venue' | 'datetime' | 'services' | 'confirm';

export function BookingFlowScreen({ navigation, route }: any) {
  const [step, setStep] = useState<BookingStep>('venue');
  const [bookingData, setBookingData] = useState({});

  const nextStep = () => {
    const steps: BookingStep[] = ['venue', 'datetime', 'services', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'venue': return <VenueSelectionStep onSelect={setVenue} />;
      case 'datetime': return <DateTimeSelectionStep venue={venue} onSelect={setDateTime} />;
      case 'services': return <ServicesSelectionStep venue={venue} onSelect={setServices} />;
      case 'confirm': return <ConfirmStep bookingData={bookingData} onConfirm={handleBooking} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderStep()}
      <View style={styles.footer}>
        {step !== 'venue' && <Button title="Quay lại" variant="outline" onPress={prevStep} />}
        <Button title="Tiếp tục" onPress={nextStep} />
      </View>
    </View>
  );
}
```

### Step 5: Create Booking List & Detail (1.5h)

1. **Booking List Screen**: Filter by status (upcoming, past, cancelled)
2. **Booking Detail Screen**: Full info, actions (cancel, get directions)

### Step 6: Create Newsfeed Screens (2h)

1. **Post List Screen**: Feed with filters (sport, district)
2. **Post Detail Screen**: Post with comments
3. **Create Post Screen**: Form for new post

```typescript
export function CreatePostScreen({ navigation }: any) {
  const [postType, setPostType] = useState<PostType>('RECRUITING');
  const [sportType, setSportType] = useState<SportType>('Football');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    await postService.createPost({
      post_type: postType,
      sport_type: sportType,
      title,
      content,
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="h3">Đăng bài mới</Text>

      <Picker selectedValue={postType} onValueChange={setPostType}>
        <Picker.Item label="Tuyển đối" value="RECRUITING" />
        <Picker.Item label="Tìm đội" value="LOOKING_FOR_TEAM" />
        <Picker.Item label="Kinh doanh xã hội" value="SOCIAL" />
      </Picker>

      <Input label="Môn thể thao" value={sportType} onValueChange={setSportType} />
      <Input label="Tiêu đề" value={title} onChangeText={setTitle} />
      <Input label="Nội dung" value={content} onChangeText={setContent} multiline />

      <Button title="Đăng bài" onPress={handleSubmit} />
    </ScrollView>
  );
}
```

### Step 7: Create Profile Screens (1.5h)

1. **Profile Screen**: User info, stats, menu options
2. **Edit Profile Screen**: Update user info
3. **Settings Screen**: App settings (notifications, language)

## Todo List

- [ ] Create venue service layer
- [ ] Create booking service layer
- [ ] Create post service layer
- [ ] Create Home screen
- [ ] Create Venue List screen with filters
- [ ] Create Venue Map screen with WebView
- [ ] Create Venue Detail screen
- [ ] Create Booking Timeline component
- [ ] Create Booking Flow multi-step wizard
- [ ] Create Booking List screen
- [ ] Create Booking Detail screen
- [ ] Create Post List screen with filters
- [ ] Create Post Detail with comments
- [ ] Create Create Post screen
- [ ] Create Profile screen
- [ ] Create Edit Profile screen
- [ ] Create reusable cards (Venue, Booking, Post)

## Success Criteria

1. **Home**: Loads with nearby venues and upcoming bookings
2. **Venue Browse**: List and map views work
3. **Venue Detail**: Shows all info, book button works
4. **Booking Flow**: Complete flow from venue to payment
5. **Timeline**: Shows available slots correctly
6. **Newsfeed**: Can browse and create posts
7. **Profile**: Can view and edit profile
8. **Navigation**: All screens navigate correctly

## Test Scenarios

### Venue Discovery
```typescript
// Test 1: Venue list loads
// Expected: Shows venues with filters

// Test 2: Filter by district
// Expected: Shows venues in selected district

// Test 3: Map view displays
// Expected: WebView loads with venue markers

// Test 4: Tap venue marker
// Expected: Opens venue detail

// Test 5: Venue detail loads
// Expected: Shows all venue info
```

### Booking Flow
```typescript
// Test 6: Start booking from venue detail
// Expected: Opens booking flow with venue pre-selected

// Test 7: Select date
// Expected: Shows available slots for date

// Test 8: Select time slot
// Expected: Slot becomes selected, price updates

// Test 9: Add services
// Expected: Services added, total price updated

// Test 10: Confirm booking
// Expected: Creates booking, navigates to payment
```

### Newsfeed
```typescript
// Test 11: Post list loads
// Expected: Shows posts with filters

// Test 12: Create post
// Expected: Post created, appears in feed

// Test 13: Comment on post
// Expected: Comment added

// Test 14: Filter by sport
// Expected: Shows only selected sport posts
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebView performance | Medium | Optimize map interactions |
| Booking state loss | Medium | Persist booking draft |
| Image loading | Low | Lazy loading, caching |
| Timeline complexity | Medium | Simplify UI |

## Security Considerations

1. **Input Validation**: Validate all user inputs
2. **Permissions**: Request location permissions appropriately
3. **Data Caching**: Clear sensitive data on logout

## Next Steps

1. Sprint 12: Merchant features
2. Sprint 14: Integration testing

## Dependencies

- Requires: Sprint 3 (Venue APIs)
- Requires: Sprint 4 (Booking APIs)
- Requires: Sprint 7 (Newsfeed APIs)
- Requires: Sprint 10 (RN Core)
- Blocks: Sprint 14 (Integration Testing)
