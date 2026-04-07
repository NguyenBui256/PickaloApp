# PickAlo Mobile UI Clone - Analysis & Implementation Plan

**Date**: 2026-04-07
**Project**: PickAlo Sports Venue Booking App
**Platform**: Android (Kotlin + Jetpack Compose)
**Reference**: Screenshots in `/images` directory

---

## 1. Screen Inventory & Analysis

Based on screenshot filenames, the app includes **14 unique screens**:

### Authentication Flow (3 screens)
1. **đăng nhập bằng email.PNG** - Login with email
2. **đăng nhập bằng số điện thoại.PNG** - Login with phone number
3. **thay đổi mật khẩu.PNG** - Change password

### Main Navigation (5 screens)
4. **trang chủ.PNG** - Homepage (main feed)
5. **khám phá.PNG** - Discover/explore venues
6. **nổi bật.PNG** - Featured/promoted venues
7. **map.PNG** - Map view of venues
8. **trang cá nhân.PNG** - User profile

### User Management (3 screens)
9. **chỉnh sửa thông tin cá nhân.PNG** - Edit personal information
10. **lịch sử đặt sân.PNG** - Booking history
11. **cài đặt.PNG** - Settings
12. **cài đặt ngôn ngữ.PNG** - Language settings

### Detail Views (2 screens)
13. **chọn 1 post ở trang chủ.PNG** - Post detail view
14. **chọn 1 sân ở map.PNG** - Venue detail from map

---

## 2. Design System Analysis

### Color Palette (Inferred from sports booking app context)
```kotlin
// Primary colors (brand colors)
val PrimaryGreen = Color(0xFF10B981)      // Emerald 500
val PrimaryGreenDark = Color(0xFF059669) // Emerald 600
val PrimaryGreenLight = Color(0xFF6EE7B7) // Emerald 400

// Secondary colors
val SecondaryBlue = Color(0xFF3B82F6)     // Blue 500
val SecondaryOrange = Color(0xFFF59E0B)   // Amber 500

// Neutral colors
val Background = Color(0xFFFAFAFA)        // Gray 50
val Surface = Color(0xFFFFFFFF)           // White
val Error = Color(0xFFEF4444)             // Red 500
val OnPrimary = Color(0xFFFFFFFF)         // White
val OnSurface = Color(0xFF1F2937)         // Gray 800
val OnBackground = Color(0xFF111827)      // Gray 900
```

### Typography Scale
```kotlin
val Typography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 57.sp,
        lineHeight = 64.sp,
        letterSpacing = (-0.25).sp
    ),
    headlineLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 32.sp,
        lineHeight = 40.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 22.sp,
        lineHeight = 28.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.25.sp
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    )
)
```

### Spacing System
```kotlin
// Material 3 spacing tokens
val spacingExtraSmall = 4.dp
val spacingSmall = 8.dp
val spacingMedium = 16.dp
val spacingLarge = 24.dp
val spacingExtraLarge = 32.dp
```

### Component Shapes
```kotlin
val Shapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(28.dp)
)
```

---

## 3. Architecture Pattern

### MVVM with Clean Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Screens    │──│  ViewModels  │──│   UiState    │     │
│  │  (Compose)   │  │   (MVVM)     │  │  (State)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Use Cases   │  │   Models     │                        │
│  │ (Interactors)│  │ (Domain)     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Repositories │──│ Data Sources │──│    DTOs      │     │
│  │              │  │ (API/DB)     │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Structure
```kotlin
// Navigation graph
sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Home : Screen("home")
    object Discover : Screen("discover")
    object Featured : Screen("featured")
    object Map : Screen("map")
    object Profile : Screen("profile")
    object VenueDetail : Screen("venue/{venueId}") {
        fun createRoute(venueId: String) = "venue/$venueId"
    }
    object BookingHistory : Screen("booking_history")
    object Settings : Screen("settings")
    object EditProfile : Screen("edit_profile")
    object LanguageSettings : Screen("language_settings")
    object ChangePassword : Screen("change_password")
}
```

---

## 4. Component Library

### Reusable Components

#### 1. App Bar
```kotlin
@Composable
fun PickAloAppBar(
    title: String,
    navigationIcon: (@Composable () -> Unit)? = null,
    actions: (@Composable RowScope.() -> Unit)? = null
) {
    TopAppBar(
        title = {
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
        },
        navigationIcon = navigationIcon,
        actions = actions ?: {},
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    )
}
```

#### 2. Venue Card
```kotlin
@Composable
fun VenueCard(
    venue: Venue,
    onVenueClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onVenueClick(venue.id) },
        shape = MaterialTheme.shapes.medium,
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column {
            // Venue image
            AsyncImage(
                model = venue.imageUrl,
                contentDescription = venue.name,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp),
                contentScale = ContentScale.Crop
            )

            // Venue info
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = venue.name,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Outlined.LocationOn,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = venue.address,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Star,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.secondary,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = venue.rating.toString(),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Text(
                        text = "${venue.price}K/h",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
    }
}
```

#### 3. Primary Button
```kotlin
@Composable
fun PickAloButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isLoading: Boolean = false
) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp),
        enabled = enabled && !isLoading,
        shape = MaterialTheme.shapes.medium,
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.primary
        )
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                color = MaterialTheme.colorScheme.onPrimary
            )
        } else {
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onPrimary
            )
        }
    }
}
```

#### 4. Input Field
```kotlin
@Composable
fun PickAloTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    keyboardType: KeyboardType = KeyboardType.Text,
    isError: Boolean = false,
    errorMessage: String? = null,
    leadingIcon: ImageVector? = null
) {
    Column(modifier = modifier) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text(label) },
            leadingIcon = if (leadingIcon != null) {
                { Icon(imageVector = leadingIcon, contentDescription = null) }
            } else null,
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            isError = isError,
            shape = MaterialTheme.shapes.medium,
            colors = TextFieldDefaults.outlinedTextFieldColors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                errorBorderColor = MaterialTheme.colorScheme.error
            )
        )

        if (isError && errorMessage != null) {
            Text(
                text = errorMessage,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(start = 16.dp, top = 4.dp)
            )
        }
    }
}
```

#### 5. Bottom Navigation
```kotlin
@Composable
fun PickAloBottomNavigation(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    val items = listOf(
        BottomNavItem.Home,
        BottomNavItem.Discover,
        BottomNavItem.Map,
        BottomNavItem.Profile
    )

    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 8.dp
    ) {
        items.forEach { item ->
            val selected = currentRoute == item.route
            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                        contentDescription = item.label
                    )
                },
                label = { Text(item.label) },
                selected = selected,
                onClick = { onNavigate(item.route) }
            )
        }
    }
}

sealed class BottomNavItem(
    val route: String,
    val label: String,
    val unselectedIcon: ImageVector,
    val selectedIcon: ImageVector
) {
    object Home : BottomNavItem(
        route = "home",
        label = "Trang chủ",
        unselectedIcon = Icons.Outlined.Home,
        selectedIcon = Icons.Filled.Home
    )

    object Discover : BottomNavItem(
        route = "discover",
        label = "Khám phá",
        unselectedIcon = Icons.Outlined.Search,
        selectedIcon = Icons.Filled.Search
    )

    object Map : BottomNavItem(
        route = "map",
        label = "Bản đồ",
        unselectedIcon = Icons.Outlined.Map,
        selectedIcon = Icons.Filled.Map
    )

    object Profile : BottomNavItem(
        route = "profile",
        label = "Cá nhân",
        unselectedIcon = Icons.Outlined.Person,
        selectedIcon = Icons.Filled.Person
    )
}
```

---

## 5. Screen-by-Screen Implementation

### Screen 1: Login with Email (đăng nhập bằng email.PNG)

**Components:**
- Logo/brand header
- Email input field
- Password input field with visibility toggle
- "Forgot password" link
- Primary "Login" button
- Secondary "Register" link
- Social login options (Google, Facebook)
- Phone number login link

**State Management:**
```kotlin
data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isPasswordVisible: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)
```

**Layout Structure:**
```kotlin
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onNavigateToRegister: () -> Unit,
    onNavigateToPhoneLogin: () -> Unit,
    onForgotPassword: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically)
    ) {
        // Logo
        LogoHeader()

        Spacer(modifier = Modifier.height(32.dp))

        // Email field
        PickAloTextField(
            value = uiState.email,
            onValueChange = { viewModel.onEmailChange(it) },
            label = "Email",
            keyboardType = KeyboardType.Email,
            leadingIcon = Icons.Outlined.Email
        )

        // Password field
        PickAloTextField(
            value = uiState.password,
            onValueChange = { viewModel.onPasswordChange(it) },
            label = "Mật khẩu",
            keyboardType = KeyboardType.Password,
            leadingIcon = Icons.Outlined.Lock,
            isPasswordVisible = uiState.isPasswordVisible,
            onPasswordVisibilityToggle = { viewModel.togglePasswordVisibility() }
        )

        // Forgot password
        Text(
            text = "Quên mật khẩu?",
            modifier = Modifier
                .align(Alignment.End)
                .clickable { onForgotPassword() },
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.primary
        )

        // Login button
        PickAloButton(
            text = "Đăng nhập",
            onClick = { viewModel.login() },
            isLoading = uiState.isLoading
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Divider
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Divider(modifier = Modifier.weight(1f))
            Text(
                text = "hoặc",
                modifier = Modifier.padding(horizontal = 16.dp),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Divider(modifier = Modifier.weight(1f))
        }

        // Social login
        SocialLoginButtons()

        // Register link
        Row(
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Chưa có tài khoản?",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "Đăng ký",
                modifier = Modifier.clickable { onNavigateToRegister() },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}
```

### Screen 2: Homepage (trang chủ.PNG)

**Components:**
- App bar with notification icon
- Search bar
- Category filter (horizontal scroll)
- Featured venues carousel
- Nearby venues list
- Bottom navigation

**State Management:**
```kotlin
data class HomeUiState(
    val searchQuery: String = "",
    val selectedCategory: String? = null,
    val featuredVenues: List<Venue> = emptyList(),
    val nearbyVenues: List<Venue> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)
```

**Layout Structure:**
```kotlin
@Composable
fun HomeScreen(
    onVenueClick: (String) -> Unit,
    onSearch: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = modifier.fillMaxSize()
    ) {
        // App bar
        PickAloAppBar(
            title = "PickAlo",
            actions = {
                IconButton(onClick = { /* Navigate to notifications */ }) {
                    BadgedBox(
                        badge = {
                            if (unreadCount > 0) {
                                Badge { Text(unreadCount.toString()) }
                            }
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Notifications,
                            contentDescription = "Notifications"
                        )
                    }
                }
            }
        )

        // Search bar
        SearchBar(
            query = uiState.searchQuery,
            onQueryChange = { viewModel.onSearchQueryChange(it) },
            onSearch = { onSearch(it) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        )

        // Category filters
        CategoryFilterRow(
            categories = categories,
            selectedCategory = uiState.selectedCategory,
            onCategorySelected = { viewModel.onCategoryChange(it) },
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        // Content
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Featured venues carousel
            item {
                FeaturedVenuesCarousel(
                    venues = uiState.featuredVenues,
                    onVenueClick = onVenueClick,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }

            // Nearby venues section
            item {
                SectionHeader(
                    title = "Gần bạn",
                    actionText = "Xem tất cả",
                    onActionClick = { /* Navigate to all nearby */ }
                )
            }

            items(uiState.nearbyVenues) { venue ->
                VenueCard(
                    venue = venue,
                    onVenueClick = onVenueClick,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }
        }
    }
}
```

### Screen 3: Discover/Explore (khám phá.PNG)

**Components:**
- Search bar with advanced filters
- Sport type filter (horizontal scroll)
- Location filter
- Price range slider
- Rating filter
- Venue grid/list
- Map toggle button

**State Management:**
```kotlin
data class DiscoverUiState(
    val searchQuery: String = "",
    val selectedSportType: SportType? = null,
    val selectedLocation: String? = null,
    val priceRange: IntRange = 0..1000,
    val minRating: Float = 0f,
    val venues: List<Venue> = emptyList(),
    val isGridView: Boolean = true,
    val isLoading: Boolean = false
)
```

### Screen 4: Map View (map.PNG)

**Components:**
- Map container with venue markers
- Search bar (floating)
- Filter button (floating)
- Venue preview card (bottom sheet)
- Current location button
- Zoom controls

**Implementation:**
```kotlin
@Composable
fun MapScreen(
    venues: List<Venue>,
    onVenueClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier.fillMaxSize()) {
        // Map
        GoogleMap(
            modifier = Modifier.fillMaxSize(),
            cameraPositionState = rememberCameraPositionState {
                position = CameraPosition.fromLatLngZoom(hanoiLocation, 12f)
            },
            properties = MapProperties(
                isMyLocationEnabled = true,
                mapType = MapType.NORMAL
            )
        ) {
            // Venue markers
            venues.forEach { venue ->
                Marker(
                    state = MarkerState(
                        position = LatLng(venue.latitude, venue.longitude)
                    ),
                    onClick = {
                        onVenueClick(venue.id)
                        true
                    },
                    title = venue.name
                )
            }
        }

        // Floating search bar
        SearchBar(
            query = searchQuery,
            onQueryChange = { onSearchQueryChange(it) },
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(16.dp)
        )

        // Floating filter button
        FloatingActionButton(
            onClick = { /* Show filter bottom sheet */ },
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
        ) {
            Icon(
                imageVector = Icons.Outlined.FilterList,
                contentDescription = "Filter"
            )
        }

        // Current location button
        FloatingActionButton(
            onClick = { /* Move to current location */ },
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp)
        ) {
            Icon(
                imageVector = Icons.Outlined.MyLocation,
                contentDescription = "My location"
            )
        }
    }
}
```

### Screen 5: Profile (trang cá nhân.PNG)

**Components:**
- Avatar with edit button
- User name and email
- Stats row (bookings, reviews, points)
- Menu items (booking history, settings, etc.)
- Logout button

**State Management:**
```kotlin
data class ProfileUiState(
    val user: User? = null,
    val stats: UserStats? = null,
    val isLoading: Boolean = false
)
```

### Screen 6: Venue Detail (chọn 1 sân ở map.PNG)

**Components:**
- Venue image gallery
- Venue name and rating
- Location with map preview
- Description
- Amenities list
- Available time slots
- Price display
- Book button
- Reviews section

---

## 6. Dependency Setup

### build.gradle.kts (Module: app)
```kotlin
dependencies {
    // Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Compose
    implementation(platform("androidx.compose:compose-bom:2024.02.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.6")

    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.50")
    kapt("com.google.dagger:hilt-compiler:2.50")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Image loading
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Maps
    implementation("com.google.maps.android:maps-compose:4.3.0")
    implementation("com.google.android.gms:play-services-maps:18.2.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.0.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2024.02.01"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
}
```

---

## 7. Implementation Phases

### Phase 1: Project Setup (Week 1)
- [ ] Create Android project with Compose
- [ ] Set up Hilt dependency injection
- [ ] Configure theme and design system
- [ ] Set up navigation structure
- [ ] Create base components library

### Phase 2: Authentication (Week 2)
- [ ] Login screen (email)
- [ ] Login screen (phone)
- [ ] Register screen
- [ ] Forgot password flow
- [ ] Social login integration
- [ ] Session management with DataStore

### Phase 3: Main Navigation (Week 3)
- [ ] Bottom navigation component
- [ ] Home screen implementation
- [ ] Discover screen implementation
- [ ] Map screen integration
- [ ] Profile screen implementation

### Phase 4: Venue Features (Week 4)
- [ ] Venue card component
- [ ] Venue list screens
- [ ] Venue detail screen
- [ ] Map markers and clustering
- [ ] Search and filter functionality

### Phase 5: Booking Flow (Week 5)
- [ ] Time slot selection
- [ ] Booking confirmation
- [ ] Payment integration
- [ ] Booking history
- [ ] Booking management

### Phase 6: User Management (Week 6)
- [ ] Profile editing
- [ ] Settings screens
- [ ] Language settings
- [ ] Notification preferences
- [ ] Logout functionality

### Phase 7: Polish & Testing (Week 7)
- [ ] Accessibility testing
- [ ] Performance optimization
- [ ] Error handling
- [ ] Loading states
- [ ] E2E testing

---

## 8. Key Technical Considerations

### Performance
- Use `LazyColumn`/`LazyRow` for lists
- Implement image caching with Coil
- Optimize recomposition with `remember` and `derivedStateOf`
- Use Baseline Profiles for faster startup

### State Management
- Use `StateFlow` for ViewModel state
- Implement proper state hoisting
- Handle configuration changes with ViewModel
- Use `LaunchedEffect` for one-time events

### Navigation
- Type-safe navigation with sealed classes
- Pass arguments safely between screens
- Handle deep links
- Implement back button handling

### Offline Support
- Cache venue data locally
- Implement sync strategy
- Show offline indicators
- Queue actions when offline

### Accessibility
- Add content descriptions
- Support screen readers
- Implement minimum touch targets (48dp)
- Support system font scaling

---

## 9. Testing Strategy

### Unit Tests
- ViewModel logic
- Use case implementations
- Repository methods
- Utility functions

### UI Tests
- Composable testing
- Navigation flow
- User interactions
- State changes

### Integration Tests
- API integration
- Database operations
- Authentication flow
- Booking process

---

## 10. Success Criteria

- [ ] All 14 screens implemented
- [ ] Navigation flows working smoothly
- [ ] Authentication functional
- [ ] Venue search and filters working
- [ ] Map integration functional
- [ ] Booking flow complete
- [ ] 80%+ test coverage
- [ ] Performance metrics met
- [ ] Accessibility requirements met
- [ ] Production-ready build

---

## Next Steps

1. **Analyze actual screenshots** for precise styling details
2. **Create design tokens** from screenshot analysis
3. **Set up project structure** with all dependencies
4. **Implement design system** (theme, typography, spacing)
5. **Build component library** (buttons, cards, inputs)
6. **Implement screens** following the phases above
7. **Test and refine** based on user feedback

---

**Document Status**: ✅ Analysis Complete
**Next Action**: Analyze screenshots for exact styling details
