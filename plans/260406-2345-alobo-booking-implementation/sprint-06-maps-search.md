---
title: "Sprint 6: Maps & Search"
description: "Map integration with Leaflet/OpenStreetMap, geospatial search, and location-based venue discovery"
status: pending
priority: P2
effort: 10h
tags: [maps, leaflet, openstreetmap, geospatial]
created: 2026-04-06
---

# Sprint 6: Maps & Search

## Overview

Implement map-based venue discovery using Leaflet and OpenStreetMap, with advanced search filters and location-based queries.

**Priority:** P2 (Medium - enhances UX but core features work without it)
**Current Status:** Pending

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 3.1: Maps & Data)
- Sprint 1: `./sprint-01-database-models.md` (PostGIS setup)
- Sprint 3: `./sprint-03-venue-management.md` (Venue endpoints)

## Key Insights

1. **OpenStreetMap**: Free, no API key needed for basic usage
2. **PostGIS**: Already enables efficient geospatial queries
3. **Client-Side Map**: Leaflet renders on React Native WebView
4. **Clustering**: Group nearby venues for better UX
5. **Offline**: Cache map tiles for better performance

## Requirements

### Functional Requirements

1. **Map Display**: Interactive map showing venue markers
2. **Venue Markers**: Custom markers with venue info
3. **Cluster Markers**: Group nearby venues
4. **Map Controls**: Zoom, pan, locate user
5. **Search on Map**: Filter by radius, type, price
6. **Venue Details**: Tap marker to see info
7. **Route Display**: Show directions to venue (optional)
8. **District Overlay**: Highlight Hanoi districts

### Non-Functional Requirements

1. **Performance**: Smooth map panning/zooming
2. **Data Usage**: Efficient tile loading
3. **Battery**: Optimize location updates

## Architecture

### Tech Stack

```
┌─────────────────────────────────────────────┐
│         React Native App (Frontend)          │
├─────────────────────────────────────────────┤
│  WebView Component                           │
│  ┌──────────────────────────────────────┐   │
│  │  Leaflet.js + OpenStreetMap Tiles    │   │
│  │  - Venue markers                      │   │
│  │  - Clustering                         │   │
│  │  - Custom popups                      │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  API Layer                                  │
│  ┌──────────────────────────────────────┐   │
│  │  GET /api/v1/venues/nearby           │   │
│  │  GET /api/v1/venues/search           │   │
│  │  GET /api/v1/districts               │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Backend Endpoints

```
GET /api/v1/venues/nearby
    ?lat=21.0285
    &lng=105.8542
    &radius=5000
    &type=Football+5
    &min_price=200000
    &max_price=500000

GET /api/v1/venues/bounds
    &south=20.9
    &north=21.1
    &west=105.7
    &east=106.0

GET /api/v1/districts/geo
    # Returns GeoJSON of Hanoi districts

GET /api/v1/map/venue-clusters
    &zoom=12
    &bounds=...
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `backend/app/schemas/map.py` | Map-related Pydantic schemas |
| `backend/app/services/map.py` | Map/geospatial services |
| `backend/app/api/v1/map.py` | Map-specific endpoints |
| `frontend/src/screens/map-screen.tsx` | Map screen component |
| `frontend/src/components/map-webview.tsx` | Leaflet WebView wrapper |
| `frontend/src/services/map-service.ts` | Map API client |
| `frontend/public/map.html` | Leaflet map HTML template |
| `tests/test_map.py` | Map API tests |

### Files to Modify

| Path | Changes |
|------|---------|
| `backend/app/models/venue.py` | Add to_geojson() method |
| `backend/app/api/v1/api.py` | Register map router |

## Implementation Steps

### Step 1: Backend Map Schemas (1h)

1. Create `backend/app/schemas/map.py`:

**Schemas:**
- `NearbyVenuesRequest`: lat, lng, radius, filters
- `VenueCluster`: lat, lng, count, venues (preview)
- `BoundsRequest`: south, north, west, east
- `DistrictGeoResponse`: name, geojson
- `VenueMarkerResponse`: id, name, lat, lng, type, price

### Step 2: Backend Map Service (2.5h)

1. Create `backend/app/services/map.py`:

**Functions:**
- `get_venues_by_bounds(bounds, filters)`: Get venues in map bounds
- `get_venues_nearby(lat, lng, radius, filters)`: Radius search
- `create_venue_clusters(venues, zoom)`: Cluster venues by zoom level
- `get_district_geojson(district_name)`: Return district boundary
- `get_hanoi_districts_geo()`: All Hanoi districts GeoJSON
- `venue_to_geojson(venue)`: Convert venue to GeoJSON feature

**Clustering Logic:**
```python
def create_venue_clusters(venues, zoom, grid_size=0.01):
    # Grid-based clustering
    clusters = {}
    for venue in venues:
        grid_x = int(venue.lng / grid_size)
        grid_y = int(venue.lat / grid_size)
        key = f"{grid_x}_{grid_y}"

        if key not in clusters:
            clusters[key] = {
                "lat": venue.lat,
                "lng": venue.lng,
                "count": 0,
                "venues": []
            }

        clusters[key]["count"] += 1
        if clusters[key]["count"] <= 10:  # Preview limit
            clusters[key]["venues"].append(venue)

    return list(clusters.values())
```

### Step 3: Backend Map Endpoints (2h)

1. Create `backend/app/api/v1/map.py`:

**GET /api/v1/map/nearby**
- Query params: lat, lng, radius, type, price_range
- Return: List of venue markers

**GET /api/v1/map/bounds**
- Query params: south, north, west, east
- Return: Venues within bounds

**GET /api/v1/map/clusters**
- Query params: bounds, zoom
- Return: Clustered venue markers

**GET /api/v1/map/districts**
- Return: GeoJSON of Hanoi districts

**GET /api/v1/map/districts/:name**
- Return: Single district GeoJSON

### Step 4: Frontend Map HTML Template (1.5h)

1. Create `frontend/public/map.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        #map { height: 100%; width: 100%; }
        .custom-marker { /* ... */ }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Leaflet initialization
        // Venue markers
        // Clustering
        // Bridge to React Native via postMessage
    </script>
</body>
</html>
```

### Step 5: React Native Map Component (2h)

1. Create `frontend/src/components/map-webview.tsx`:

```typescript
interface MapWebViewProps {
    initialCenter: { lat: number; lng: number };
    initialZoom: number;
    venues: VenueMarker[];
    onVenuePress: (venueId: string) => void;
    onRegionChange: (region: MapRegion) => void;
}

export const MapWebView: React.FC<MapWebViewProps> = ({
    initialCenter,
    venues,
    onVenuePress,
    onRegionChange
}) => {
    const webViewRef = useRef<WebView>(null);

    const handleMapMessage = (event: any) => {
        const data = JSON.parse(event.nativeEvent.data);
        switch (data.type) {
            case 'venuePress':
                onVenuePress(data.venueId);
                break;
            case 'regionChange':
                onRegionChange(data.region);
                break;
        }
    };

    return (
        <WebView
            ref={webViewRef}
            source={{ uri: 'file:///android_asset/map.html' }}
            onMessage={handleMapMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
        />
    );
};
```

### Step 6: Map Screen (1h)

1. Create `frontend/src/screens/map-screen.tsx`:

- Display map with user location
- Fetch venues in visible area
- Show venue markers/clusters
- Handle marker tap
- Show venue bottom sheet
- Filter controls

### Step 7: Write Tests (30m)

1. Create `tests/test_map.py`:
   - Test nearby venues endpoint
   - Test bounds query
   - Test clustering logic
   - Test district GeoJSON

## Todo List

- [ ] Create map Pydantic schemas
- [ ] Implement venue clustering logic
- [ ] Create nearby venues endpoint
- [ ] Create bounds query endpoint
- [ ] Create clusters endpoint
- [ ] Add district GeoJSON support
- [ ] Create Leaflet map HTML template
- [ ] Implement WebView communication bridge
- [ ] Create MapWebView component
- [ ] Create MapScreen with venue fetching
- [ ] Add venue marker tap handling
- [ ] Add filter controls
- [ ] Write map API tests

## Success Criteria

1. **Map Display**: Leaflet map renders in WebView
2. **Venue Markers**: Venues display as markers on map
3. **Clustering**: Nearby venues grouped by zoom level
4. **Region Change**: Loading venues as user pans
5. **Marker Tap**: Tapping marker shows venue info
6. **Filters**: Type and price filters work
7. **Performance**: Smooth scrolling and zooming

## Test Scenarios

### Backend API
```bash
# Test 1: Nearby venues
GET /api/v1/map/nearby?lat=21.0285&lng=105.8542&radius=5000
# Expected: 200 OK, venues within 5km

# Test 2: Bounds query
GET /api/v1/map/bounds?south=20.9&north=21.1&west=105.7&east=106.0
# Expected: 200 OK, venues in bounds

# Test 3: Clustering
GET /api/v1/map/clusters?bounds=...&zoom=12
# Expected: 200 OK, clustered markers

# Test 4: District GeoJSON
GET /api/v1/map/districts/Hai+Ba+Trung
# Expected: 200 OK, GeoJSON polygon

# Test 5: Type filter
GET /api/v1/map/nearby?type=Football+5
# Expected: 200 OK, only 5-a-side venues
```

### Frontend
```bash
# Test 6: Map loads
# Map screen opens, displays OSM tiles

# Test 7: Markers display
# Venue markers appear on map

# Test 8: Clustering works
# Zooming out groups markers

# Test 9: Marker tap
# Tapping marker opens venue details

# Test 10: Region change
# Panning map loads new venues
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebView performance | Medium | Optimize marker count, use canvas |
| OSM tile loading | Low | Cache tiles, handle offline |
| Clustering accuracy | Low | Test with real venue density |
| Bridge communication | Medium | Robust message parsing |

## Security Considerations

1. **Input Validation**: Validate lat/lng bounds
2. **Rate Limiting**: Prevent map API abuse
3. **Data Caching**: Cache district GeoJSON

## Next Steps

1. Sprint 7: Newsfeed and community features
2. Sprint 11: Frontend integration

## Dependencies

- Requires: Sprint 1 (Database Models)
- Requires: Sprint 3 (Venue Management)
- Blocks: Sprint 11 (RN User Features)

## Hanoi Districts (Static Data)

```python
HANOI_DISTRICTS = [
    "Ba Dinh", "Cau Giay", "Dong Da", "Hai Ba Trung",
    "Hoan Kiem", "Hoang Mai", "Long Bien", "Tay Ho",
    "Thanh Xuan", "Ha Dong", "Bac Tu Liem", "Nam Tu Liem",
    # Add remaining districts...
]
```
