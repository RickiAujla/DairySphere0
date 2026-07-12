# DairySphere Enterprise Frontend Architecture & Design System Specification

**Status:** FROZEN  
**Target Quality:** Linear / Stripe / Shopify Dashboard Grade  
**Core Technologies:** Next.js App Router (TypeScript), Tailwind CSS v4, shadcn/ui (Radix Primitives), Zustand (Global Sync), TanStack Query v5 (Server State Sync), React Hook Form + Zod, Recharts, and motion (React Animations).

---

## 1. Frontend Folder Structure
To support clean modular boundaries and scalable multi-team development:
```
/frontend
├── public/                 # Static assets, fonts, vector branding
├── src/
│   ├── app/                # Next.js App Router directory structure
│   │   ├── (auth)/         # Unauthenticated layouts (Login, Reset)
│   │   ├── (dashboard)/    # Authenticated multi-tenant view boundaries
│   │   │   ├── herd/       # Cattle & Pedigree interfaces
│   │   │   ├── milk/       # Production yields & quality logs
│   │   │   ├── health/     # Veterinary records & withholding rules
│   │   │   ├── feed/       # Silo level inventories & reorders
│   │   │   └── layout.tsx  # Persisted layout with navigation and header
│   │   ├── api/            # Local developer proxy endpoints
│   │   ├── layout.tsx      # Global HTML wrapper (providers, fonts)
│   │   └── page.tsx        # Dynamic landing or route redirector
│   ├── components/         # Reusable presentation and layout components
│   │   ├── ui/             # Radix-derived shadcn base elements
│   │   ├── feedback/       # Skeletons, alerts, state indicators
│   │   └── forms/          # Standardized form structures and inputs
│   ├── hooks/              # Custom composable React hooks
│   ├── lib/                # Configured instances (api client, utils, themes)
│   ├── providers/          # Global Context wrappers (Query, Toast, Auth)
│   ├── store/              # Zustand global client-side state engines
│   └── types/              # Module-specific strictly typed interfaces
├── package.json
├── tsconfig.json
└── vite.config.ts / next.config.js
```

---

## 2. Layout Architecture
DairySphere uses nested structural layouts to optimize rendering and avoid costly component re-initializations:
*   **Root Layout (`/src/app/layout.tsx`):** Embeds global typography definitions, injects the Tailwind base style wrapper, and registers global provider instances (Zustand Hydration, TanStack Query, Toast Providers).
*   **Dashboard Layout (`/src/app/(dashboard)/layout.tsx`):**
    *   Constructs the full multi-tier grid panel: Persistent Navigation Sidebar (left) and Consolidated Content Stage (right).
    *   Includes a fixed height, high-density dashboard header.
    *   Employs client-side context tracking to block view access while verifying token authentication states.

---

## 3. Route Structure
The URL naming structure maps precisely to logical business sub-modules:
*   `/(auth)/login` - Enterprise gateway authentication interface.
*   `/herd` - Master registry cattle explorer (paginated list, multi-filter).
*   `/herd/[id]` - Deep cattle profiles (pedigree, yield histories, veterinary records).
*   `/milk/yields` - Historical milk logging sessions and food-safety reviews.
*   `/health/treatments` - Veterinary medical history and isolation logs.
*   `/feed/inventory` - Bulk nutrition stock levels and pricing records.
*   `/settings` - User settings and Tenant configurations.

---

## 4. Authentication Flow (Frontend Execution)
Stateless token management is governed client-side with zero exposure to script-injection vectors:
1.  **Storage:** Access tokens are strictly stored in-memory inside application runtime memory (React Context / Zustand). Refresh tokens reside on secure, `HttpOnly`, `SameSite=Strict`, `Secure` cookies managed directly by the browser.
2.  **Request Lifecycle:** Every client API invocation includes an Axios / Fetch interceptor that appends the `Authorization: Bearer <token>` and `X-Tenant-ID: <uuid>` request headers.
3.  **Expiry & Rotation:** On a `401 Unauthorized` token expiry response with code `AUTH_EXPIRED_TOKEN`, the request interceptor pauses active queries, triggers `POST /auth/refresh` to secure a fresh access token, and retries the original failed query seamlessly.
4.  **Route Protection:** Next.js Middleware parses user cookies to redirect unauthenticated calls instantly to `/(auth)/login`.

---

## 5. State Management
State is cleanly decoupled across two dedicated managers to ensure single sources of truth:
*   **Server State (TanStack Query):** Governs all remote database cache lifecycles, background updates, optimistic updates, and automatic invalidation states (e.g., calling `queryClient.invalidateQueries({ queryKey: ['cattle'] })` on new logs).
*   **Client State (Zustand):** Manages local UI transient configurations including drawer open/close indicators, selected tenant identifiers, user personalization states, and sidebar collapsibility.

---

## 6. API Layer (Service Wrapper)
*   **Base Axios Instance:** Initialized with base URLs, connection timeouts (`15000ms`), and credential options.
*   **Request Interceptors:** Standardizes headers to inject `X-Tenant-ID` and token keys.
*   **Response Interceptors:** Captures errors globally to translate standard JSON-API failure objects into user-facing action alerts.
*   **Service Modules:** Highly isolated API wrappers return fully typed responses:
    ```typescript
    export const HerdService = {
      getCattle: (params: GetCattleParams): Promise<PaginatedResponse<Cattle>> => 
        apiClient.get('/herd/cattle', { params }),
      createCattle: (data: CreateCattleInput): Promise<Cattle> => 
        apiClient.post('/herd/cattle', data),
    };
    ```

---

## 7. Design System Foundations
Our visual foundations reflect Swiss modernist guidelines: low noise, sharp boundaries, high-density information layouts, and high typographic contrast.

---

## 8. Theme System
*   **Default Light Theme:** The primary skin of the application. Dominated by pure warm off-whites, neutral gray borders, and bold charcoal text to avoid reading strain.
*   **Dark Theme:** Accessible purely as an infrastructure preference under strict high-contrast compliance guidelines.

---

## 9. Typography
DairySphere uses two highly readable typeface pairings:
*   **Primary Sans-Serif:** **Inter** for all interface labels, body text, form elements, and structured metadata. Optimized for screen legibility at small sizes.
*   **Display / Metric:** **Space Grotesk** or **Outfit** for primary headers, summary statistic cards, and numbers requiring high visual weight.
*   **Monospace:** **JetBrains Mono** for serial ID listings, tags, RFID codes, timestamps, and status labels.

---

## 10. Color System
We restrict colors to clean functional ranges to maintain professional sobriety:
*   **Neutral Canvas:** Base Background `#FAFAFA`, Card Background `#FFFFFF`.
*   **Neutral Text:** Primaries `#111111`, Secondaries `#4B5563`, Disabled `#9CA3AF`.
*   **Borders & Separators:** `#E5E7EB` (Gray 200) and `#F3F4F6` (Gray 100).
*   **Brand / Accent Primary:** Dark Charcoal `#0F172A` (Slate 900) and Slate `#475569` (Slate 600).
*   **Success Indicator:** Emerald Green (Text `#047857`, Fill `#ECFDF5`, Border `#A7F3D0`).
*   **Warning Indicator:** Amber Yellow (Text `#B45309`, Fill `#FFFBEB`, Border `#FDE68A`).
*   **Error / Danger Alert:** Crimson Red (Text `#B91C1C`, Fill `#FEF2F2`, Border `#FEE2E2`).

---

## 11. Spacing System
Built strictly on an 8px modular scale to ensure uniform, scannable layouts:
*   `4px` (xs) - Tiny labels, internal status dot offsets.
*   `8px` (sm) - Button padding, small list row spacing.
*   `12px` (md) - Element gaps, menu list row spacing.
*   `16px` (lg) - Standard grid padding, card interior margins.
*   `24px` (xl) - Main view borders, page section gaps.
*   `32px` (2xl) - Core hero offset gaps.

---

## 12. Icon System
*   **Core Toolkit:** `lucide-react` is the sole authorized icon package. Custom vector wrappers are prohibited.
*   **Size Standards:**
    *   *Inline Actions / Labels:* `14px` (strokeWidth `2.0`).
    *   *Buttons / Standard UI:* `16px` (strokeWidth `2.0`).
    *   *Card Headers / Sidebar Icons:* `18px` to `20px` (strokeWidth `1.75`).
    *   *Hero Indicators:* `24px` (strokeWidth `1.5`).

---

## 13. Navigation System
Unified three-tier navigation architecture to prevent user disorientation:
*   **Primary Rails:** Vertical sidebar for global context exploration.
*   **Secondary Context:** Tabs located on detail dashboards (e.g., switching between "Production Logs" and "Veterinary Charts" within a cow's view).
*   **Breadcrumbs:** Global header path tracker (e.g., `Herd / Bessie (DS-4091) / Medical Record`).

---

## 14. Sidebar Design
*   **Width:** `240px` fixed, collapsible to `64px` via a clean slide animation.
*   **Visual Structure:** `#FFFFFF` background, right-side border `#E5E7EB`.
*   **Interior Details:** Includes a clean dropdown selector to shift multi-tenant farm locations, a categorized list of navigation links with hover states (`#F9FAFB`), and user status pills at the footer.

---

## 15. Header Design
*   **Height:** `64px` fixed height, sticky layout with background blur (`backdrop-blur-md bg-white/80`).
*   **Elements:** Left side hosts breadcrumbs and search triggers. Right side displays global synchronization indicators, notifications, and profile details.

---

## 16. Page Layout Standards
All primary dashboard layout structures are arranged on a uniform grid layout:
```
+-------------------------------------------------------------+
| Header: Breadcrumbs & System Sync Indicators                |
+-------------------------------------------------------------+
| KPI Stats Grid: 3 or 4 high-contrast metric banners         |
+-------------------------------------------------------------+
| Actions Strip: Filter controls, search input, "Add Asset"   |
+-------------------------------------------------------------+
| Main Content: Paginated TanStack data tables                |
+-------------------------------------------------------------+
```

---

## 17. Form Standards
*   **Layout:** Single-column layout for simplified input. Two-column is restricted to short inputs (e.g., First Name, Last Name).
*   **Validation:** Managed via React Hook Form using a Zod schema wrapper. Errors appear inline beneath inputs with red labels.
*   **Feedback:** Inputs highlight with custom neutral borders (`focus:border-slate-800 focus:ring-1 focus:ring-slate-800`). Save triggers show a clean spinner when processing.

---

## 18. Table Standards
Data tables use TanStack Table to maximize responsiveness and density:
*   **Typography:** Small, compact font alignments with `font-mono` on numbers.
*   **Density:** Spacing is kept tight with `12px` vertical cell padding.
*   **Interactions:** Hover effects highlight selected rows (`hover:bg-neutral-50`). Clicking rows navigates directly to sub-views.

---

## 19. Card Standards
*   **Layout:** Flat structures with minimal offsets (`shadow-[0_1px_3px_rgba(0,0,0,0.05)]`).
*   **Borders:** Fixed neutral borders `#E5E7EB`. Rounded corners use `rounded-lg` (`8px`).
*   **Composition:** Consistent padding at `24px` for internal content to maintain visual balance.

---

## 20. Modal Standards
*   **Execution:** Root wrapper built via Radix Dialog primitives.
*   **Layout:** Fixed position overlay with dark blur background. Dialog slides up smoothly from the bottom center on entrance.
*   **Width Limits:** Standard forms: `512px` (max-w-lg); large configuration steps: `768px` (max-w-3xl).

---

## 21. Drawer Standards
*   **Usage:** Best suited for high-density side-panel updates (e.g., logging a quick milking session).
*   **Movement:** Slides out smoothly from the right side (`width: 440px`), with a clear backdrop trigger.

---

## 22. Dialog Standards
*   **Usage:** Reserved for immediate confirmation actions (e.g., delete confirmations, isolation status updates).
*   **Actions:** Destructive triggers are highlighted in bright red to prevent accidental clicks.

---

## 23. Toast Standards
*   **Implementation:** Triggered via Sonner or Hot Toast packages in the lower-right corner.
*   **Layout:** Small panels, dark background with small icons reflecting completion states (Success, Warning, Error).

---

## 24. Chart Standards
*   **Library:** Recharts is the sole authorized data visualization engine.
*   **Colors:** Chart lines use brand slate tones (`#334155`), and success highlights use `#10B981`.
*   **Interactions:** Custom SVG tooltips with dark slate backings display exact hover values clearly.

---

## 25. Loading States
To avoid sudden screen jumps, views use localized skeletons while queries load. Shifting views shows a top-border line progression.

---

## 26. Skeleton Standards
*   **Form:** Gray rectangular pulses match the exact width of page text nodes.
*   **Animations:** Smooth, low-intensity pulse animations to avoid visual clutter (`animate-pulse bg-neutral-100`).

---

## 27. Empty States
Empty pages avoid blank canvases by displaying a clean icon, a clear heading, an explanatory description of the action, and a primary button to create a record.

---

## 28. Error Pages
*   **Visual Design:** Centered, elegant layout presenting clear, user-friendly error codes (`SYS_SERVER_ERROR`).
*   **Actions:** Simple buttons allow users to return to safety or try reloading the action.

---

## 29. 404 Pages
*   **Visual Design:** Simple typographical display "404 - Resource Not Found", paired with a button to return to the dashboard.

---

## 30. Responsive Strategy
*   **Sidebar:** Automatically collapses on tablets (`md`) and hides on mobile screens (`sm`), replaced by a top navigation drawer.
*   **Grids:** Grid panels shift responsively from single-column on mobile to three-column layouts on desktops.

---

## 31. Accessibility Standards (a11y)
*   **Contrast:** Contrast ratios exceed WCAG AA requirements.
*   **Focus States:** Clear focus ring highlights assist keyboard-only users.
*   **Labels:** Interactive icons include descriptive labels (`aria-label`) for screen readers.

---

## 32. Animation Standards
*   **Transitions:** Component animations use soft, organic spring curves:
    *   *Standard Slide/Fade:* `duration: 0.2`, `ease: "easeInOut"`.
    *   *Spring Dialogs:* `type: "spring"`, `stiffness: 300`, `damping: 30`.
*   **Performance:** Animation properties are restricted to `opacity`, `transform`, and `scale` to prevent rendering lag.

---

## 33. Component Naming Standards
*   **Files:** PascalCase (e.g., `CattleDetailCard.tsx`, `MilkYieldForm.tsx`).
*   **Sub-components:** Extracted into separate files inside their respective modules instead of nesting within a single parent.

---

## 34. File Naming Standards
*   **Folders:** lower_snake_case or dash-case (e.g., `veterinary-history/`, `milk-yields/`).
*   **Assets:** all_lowercase_with_underscores (e.g., `dairysphere_logo.png`).

---

## 35. Reusability Standards
*   **DRY UI:** Shared components reside inside `components/ui` or `components/shared`.
*   **Modular Isolation:** UI elements avoid coupling with backend logic. All data-fetching layers are contained in custom hooks.

---

## 36. Performance Standards
*   **Bundles:** Dynamically import heavy UI modules (e.g., Recharts) to optimize page loading times.
*   **Memoization:** Optimize expensive computations and rendering states using standard React memoization patterns (`useMemo`, `useCallback`).

---

## 37. Component Inventory

To ensure modularity and prevent file bloat, the frontend layout is broken down into a structured registry of core reusable components:

### 37.1 Core Layout Components
*   `SidebarNav`: Collapsible left vertical navigation rail with high-contrast active states.
*   `TenantSwitcher`: Dropdown workspace selector loaded in the sidebar to switch context.
*   `DashboardHeader`: Glassmorphic top utility bar featuring search, notifications, and profile details.
*   `BreadcrumbPath`: Dynamic trail parsing route keys (e.g. `Herd / Bessie / Medical Log`).
*   `SyncIndicator`: Small status pill indicating real-time WebSocket / query syncing status.

### 37.2 Module-Specific Business Components
*   **Herd Management:**
    *   `CattleDataGrid`: TanStack-powered paginated grid with columns for Ear Tag, RFID, Breed, Lactation status, and last session yields.
    *   `CattleFilterPanel`: Collapsible drawer containing multi-select filters for Breed, Age, Status, and Health profiles.
    *   `PedigreeFlowDiagram`: Visual tree structure rendering parents, offspring, and breeding history.
*   **Milk Production:**
    *   `YieldAnalyticsChart`: Multi-line Recharts visualization correlating individual and herd yield trends with feed intake.
    *   `MilkingLogForm`: Compact side drawer to rapidly log session milk quantities and lab sample metrics (fat/protein %).
    *   `FoodSafetyIsolationCard`: Floating alert indicator showing animals under withholding with live countdowns.
*   **Health & Feed:**
    *   `TreatmentLedgerTable`: Tabular history listing diagnoses, medicines given, and withholding clearance stamps.
    *   `SiloCapacityProgress`: Visual progress bars mimicking physical silos representing feed inventory levels.

---

## 38. Comprehensive Layout & Routing Specifications

### 38.1 Layout Tree Mapping
Each directory level defines its structural grid layer to optimize page painting performance:
1.  **Level 1 (`RootLayout`):** Global HTML, tailwind viewport reset, Sonner Toast container, and Zustand hydration handlers.
2.  **Level 2 (`AuthLayout`):** Centered card interface against a light subtle gradient background, fully decoupled from the dashboard core.
3.  **Level 3 (`DashboardLayout`):** Two-column viewport grid: `[Sidebar (240px)]` + `[Scrollable Stage (1fr)]`. 

---

## 39. UI & UX Craftsmanship Standards

To maintain a "Stripe-grade" professional presentation, the following design guidelines are frozen:

*   **Zero-Jitter Navigation:** Sidebar actions utilize `framer-motion` layout animations to smoothly reposition active backgrounds.
*   **Micro-Feedback States:** Clicking active submit actions immediately replaces button content with an elegant loading spinner, disabling double-submissions.
*   **Graceful Skeletons:** Skeleton screens mimic the exact shape of incoming text lines to minimize layout shifts when data returns.
*   **Keyboard Safety:** Dialog containers are bound to the `Escape` key, and inputs include visible, distinct focus rings (`focus-visible:ring-1`).

