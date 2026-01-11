# Trace — App Specification

## Vision

*A quiet record of where you've been.*

Trace draws a single line of your movement through the world. Nothing more.

No social features. No cloud sync. No notifications. Just you, rendered as a path—proof you existed in those places, at those times.

Watch your day unspool as ink flowing across paper. Fade in a map beneath, or let the line float in empty space. Scrub back through time and see your week, your month, your year dissolve into a single continuous thread.

When you stop, the line stops. A small pulse marks the ending—a quiet question: *where did you go?*

Your data never leaves your device. Export it if you want. Or let it live here, just for you.

---

## Aesthetic Direction

The primary inspiration is **Monument Valley**—serene but melancholic, geometric but organic, minimal but deeply atmospheric. The app should feel like a meditation on movement, not a utility.

Key qualities:
- **Solitary**: This is a personal, private experience
- **Contemplative**: Slow transitions, deliberate pacing
- **Quiet**: No interruptions, no notifications, no demands
- **Beautiful emptiness**: Negative space is as important as the line itself

---

## Technical Stack

- **Framework**: Expo (React Native)
- **Location**: `expo-location` with background tracking
- **Storage**: `expo-sqlite` for local coordinate storage
- **Maps**: `react-native-maps` with custom styling (heavily desaturated)
- **Rendering**: React Native SVG for the line in pure mode

---

## Color Palette

### Light Mode (Default)
- **Background**: Warm off-white `#F5F2EB` (not pure white—more like aged paper)
- **Line**: Deep charcoal `#2C2C2C`
- **Controls (when visible)**: Muted gray `#9A9590` at 60% opacity
- **Accent (pulse indicator)**: Soft terracotta `#C4A484` or muted coral `#D4A5A5`

### Dark Mode
- **Background**: Deep navy-black `#1A1B2E` (not pure black—has depth)
- **Line**: Soft cream `#E8E4DC`
- **Controls**: Muted lavender-gray `#6B6B7B` at 60% opacity
- **Accent (pulse indicator)**: Soft amber `#D4B896`

---

## Typography

Use **Inter** with generous letter-spacing (+2-3%) for a clean, geometric feel with warmth. Alternatively, **SF Pro Display** (system font) with increased letter-spacing works well.

- All text should be understated—small point sizes, muted colors
- Settings labels: 13pt, controls labels: 11pt
- Nothing should compete with the line

---

## Core Screens

### 1. Main View (The Line)

The primary experience. Almost the entire screen is the line.

**Default state (no interaction)**:
- Full-screen background color (light or dark mode)
- The line, rendered as a path
- A subtle pulse indicator at the line's current/final position
- No other UI elements visible
- No status bar (immersive mode)

**When user taps anywhere**:
- Controls fade in softly (300ms ease-out):
  - **Time slider**: Horizontal, bottom of screen, 40px from edge
  - **Map opacity slider**: Vertical, right edge, 40px from edge
  - **Settings gear**: Top-right corner, small (24px)
  - **Tracking toggle**: Top-left corner, minimal indicator
- Controls fade out after 3 seconds of no interaction (500ms ease-out)

**The Line**:
- Stroke width: 2px (consistent, no variation)
- Stroke color: Charcoal (light mode) or cream (dark mode)
- Line cap: Round
- Line join: Round
- No shadows, no glow—pure and flat

**The Pulse Indicator** (at line ending):
- Small circle (8px diameter) at the final point of the line
- Subtle breathing animation: scale 1.0 → 1.3 → 1.0, opacity 0.8 → 0.4 → 0.8
- Animation duration: 3 seconds (very slow, meditative)
- Color: Accent color from palette
- This is the "quiet question"—*where did you go?*

**Discontinuities**:
- When tracking stops and resumes later, the line segments do NOT connect
- The gap is simply empty space—no dotted lines, no visual bridges
- The absence speaks for itself
- Each continuous tracking session is a separate path segment

**The Map Layer** (when opacity > 0):
- Standard map tiles, but heavily processed:
  - Desaturate to ~10% color
  - Reduce contrast
  - Apply light sepia/warm tint to match background
- The map should feel like a whisper beneath the line, not a competing element
- Consider Mapbox custom style in future version

---

### 2. Time Slider

Horizontal slider at bottom of screen (when controls visible).

**Behavior**:
- Left edge: 1 hour of data
- Right edge: All available data
- Smooth continuous sliding, but with haptic feedback at detents
- **Detents**: 1h / 6h / 24h / 7d / 30d / All
- Labels appear briefly above thumb when sliding, then fade

**Animation**:
- As user slides, the line redraws smoothly
- Older segments fade in/out with 200ms transitions
- The line should feel like it's "unspooling" as you expand the time range

**Visual design**:
- Track: 2px height, muted color at 30% opacity
- Thumb: 12px circle, same color as line
- No tick marks visible (clean)

---

### 3. Map Opacity Slider

Vertical slider on right edge (when controls visible).

**Behavior**:
- Top: 100% map opacity (fully visible map beneath line)
- Bottom: 0% map opacity (pure background color) ← **Default position**
- Continuous sliding, no detents

**Visual design**:
- Track: 2px width, muted color at 30% opacity
- Thumb: 12px circle, same color as line
- No labels

---

### 4. Settings Drawer

Slides up from bottom when gear icon is tapped.

**Design**:
- Semi-transparent background matching app palette
- Rounded top corners (16px radius)
- Drag handle at top (small pill shape, 40px × 4px)
- Can be dismissed by dragging down or tapping outside

**Settings options**:

**Tracking Interval**
- Label: "Record location every"
- Options: 1 min / 5 min / 15 min / 30 min / 1 hour
- Default: 5 min
- Segmented control or horizontal picker

**Appearance**
- Label: "Appearance"
- Options: Light / Dark / System
- Default: System

**Data**
- "Export Data" → Sub-options:
  - GPX (standard format for GPS data)
  - JSON (raw data with timestamps)
  - SVG (just the line, for printing/art)
- "Clear All Data" → Confirmation dialog:
  - "This will permanently delete all location history. This cannot be undone."
  - [Cancel] [Delete Everything]

**About** (at bottom, subtle)
- "Trace v1.0"
- "Your data never leaves this device."

---

### 5. First Launch / Onboarding

Single screen. Minimal.

**Content**:
- App icon or simple line illustration at top (centered)
- Text: "Trace records your location to draw a line of where you've been."
- Subtext: "Nothing leaves your device. Ever."
- Button: [Start Tracking]

**On button press**:
- Request location permissions (foreground and background)
- If denied, show explanation and option to open settings
- If granted, transition to main view and begin tracking

---

### 6. Tracking States

**Actively tracking**:
- No persistent indicator on main view (the line itself is the indicator)
- When controls visible, show small filled circle (green-ish muted tone) top-left
- Pulse indicator at current location animates continuously

**Paused/Stopped**:
- Pulse indicator at last known location continues to animate (the "where did you go?" moment)
- When controls visible, show small empty circle top-left
- Tapping the indicator toggles tracking state

**No location permission**:
- Main view shows centered text: "Location access needed to draw your path."
- Button: [Open Settings]

---

## Data Model

### SQLite Schema

```sql
CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timestamp INTEGER NOT NULL,  -- Unix timestamp in milliseconds
    accuracy REAL,               -- Horizontal accuracy in meters
    session_id TEXT NOT NULL     -- UUID, groups continuous tracking sessions
);

CREATE INDEX idx_timestamp ON locations(timestamp);
CREATE INDEX idx_session ON locations(session_id);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

### Session Management

- When tracking starts, generate a new `session_id` (UUID)
- All points recorded until tracking stops share that session_id
- When rendering, points within same session connect; different sessions do not
- This creates natural discontinuities without explicit gap markers

---

## Background Location Tracking

### iOS Considerations

iOS is aggressive about killing background processes. To maintain reliable tracking:

1. **Request "Always" permission**: Use `requestBackgroundPermissionsAsync()` from expo-location
2. **Enable background modes**: In app.json, include:
   ```json
   {
     "expo": {
       "ios": {
         "infoPlist": {
           "UIBackgroundModes": ["location"],
           "NSLocationAlwaysAndWhenInUseUsageDescription": "Trace needs location access to record your path, even when the app is in the background.",
           "NSLocationWhenInUseUsageDescription": "Trace needs location access to record your path."
         }
       }
     }
   }
   ```
3. **Use significant location changes** as fallback if continuous background updates fail
4. **Handle app termination gracefully**: Resume tracking on next launch

### Tracking Configuration

```javascript
const trackingOptions = {
  accuracy: Location.Accuracy.Balanced,  // Good accuracy without excessive battery drain
  distanceInterval: 50,                   // Minimum 50m between updates (supplements time)
  deferredUpdatesInterval: intervalMs,   // User-selected interval (1-60 min)
  foregroundService: {
    notificationTitle: "Trace",
    notificationBody: "Recording your path",
  }
};
```

---

## Animations & Transitions

All animations should feel slow, deliberate, organic—like the game Monument Valley.

### Timing Guidelines
- Control fade in/out: 300-500ms
- Slider value changes: 200ms
- Line redraw on time change: 300ms (staggered, like ink flowing)
- Pulse indicator: 3000ms breathing cycle
- Screen transitions: 400ms

### Easing
- Use ease-out for appearances (starts fast, settles gently)
- Use ease-in-out for continuous animations (pulse)
- Never use linear (feels mechanical)

---

## Export Formats

### GPX
Standard GPS exchange format. Include all points with timestamps.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Trace">
  <trk>
    <name>Trace Export</name>
    <trkseg>
      <trkpt lat="34.0522" lon="-118.2437">
        <time>2024-01-15T10:30:00Z</time>
      </trkpt>
      <!-- ... -->
    </trkseg>
  </trk>
</gpx>
```

Note: Each session becomes a separate `<trkseg>` to preserve discontinuities.

### JSON
Raw data export for programmatic use.

```json
{
  "exportedAt": "2024-01-15T10:30:00Z",
  "sessions": [
    {
      "id": "uuid-here",
      "points": [
        {
          "lat": 34.0522,
          "lon": -118.2437,
          "timestamp": 1705315800000,
          "accuracy": 10.5
        }
      ]
    }
  ]
}
```

### SVG
Just the line, suitable for printing or framing.

```svg
<svg viewBox="..." xmlns="http://www.w3.org/2000/svg">
  <path d="M..." stroke="#2C2C2C" stroke-width="2" fill="none" 
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

---

## File Structure

```
trace/
├── app/
│   ├── _layout.tsx           # Root layout with theme provider
│   ├── index.tsx             # Main view (the line)
│   └── onboarding.tsx        # First launch screen
├── components/
│   ├── LineRenderer.tsx      # SVG path rendering
│   ├── MapLayer.tsx          # Optional map underlay
│   ├── PulseIndicator.tsx    # Breathing dot at line end
│   ├── TimeSlider.tsx        # Horizontal time control
│   ├── OpacitySlider.tsx     # Vertical map opacity control
│   ├── SettingsDrawer.tsx    # Bottom sheet with settings
│   └── TrackingIndicator.tsx # Small status dot
├── hooks/
│   ├── useLocation.ts        # Location tracking logic
│   ├── useDatabase.ts        # SQLite operations
│   └── useSettings.ts        # Settings persistence
├── utils/
│   ├── database.ts           # DB initialization and queries
│   ├── export.ts             # GPX/JSON/SVG generation
│   ├── geo.ts                # Coordinate transformations
│   └── theme.ts              # Color palette definitions
├── constants/
│   └── colors.ts             # Theme colors
└── app.json                  # Expo configuration
```

---

## Future Considerations (v2+)

Ideas to potentially explore later, not for initial release:

- **Sound design**: Ambient tones when starting/stopping, subtle audio landscape
- **Custom map styles**: Mapbox integration for hand-drawn or artistic map tiles
- **Year in review**: Annual visualization showing entire year's movement
- **Heatmap mode**: Alternative view showing frequency of visits
- **Widgets**: iOS home screen widget showing recent path
- **Apple Watch**: Companion app for discrete tracking
- **Poster export**: High-resolution PDF formatted for printing and framing

---

## App Store Metadata

**App Name**: Trace

**Subtitle**: A quiet record of where you've been.

**Keywords**: location, tracker, minimal, privacy, GPS, path, movement, journal, map, personal

**Description**:
Trace draws a single line of your movement through the world. Nothing more.

No social features. No cloud sync. No notifications. Just you, rendered as a path—proof you existed in those places, at those times.

Watch your day unspool as ink flowing across paper. Fade in a map beneath, or let the line float in empty space. Scrub back through time and see your week, your month, your year dissolve into a single continuous thread.

When you stop, the line stops. A small pulse marks the ending—a quiet question: where did you go?

Your data never leaves your device. Export it if you want. Or let it live here, just for you.

**Short Description**: Minimal location tracking. A single line. Yours alone.

**Category**: Lifestyle (or Utilities)

**Privacy Label**: Location data collected, stored only on device, never shared.

---

## Implementation Notes for Claude Code

1. **Start with the data layer**: Get SQLite working, location tracking functional, before any UI
2. **Build the line renderer early**: This is the core visual—nail it before controls
3. **Test background tracking thoroughly**: This is the trickiest iOS behavior
4. **Keep the settings drawer simple**: It's not the star of the show
5. **Performance matters**: With months of location data, rendering must stay smooth. Consider downsampling for zoomed-out views.
6. **Respect the aesthetic**: When in doubt, remove rather than add. Empty space is intentional.

---

*Build something quiet and beautiful.*
