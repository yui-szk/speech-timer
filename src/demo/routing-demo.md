# Routing and App Shell Demo

This document demonstrates that Task 5 has been successfully implemented.

## ✅ Implemented Features

### 1. App Shell Structure
- **Header**: Contains navigation with title and settings/back buttons
- **Main Content**: Responsive container with max-width for mobile-first design
- **Footer**: Simple footer with copyright information
- **Layout**: Flexbox layout with proper semantic HTML elements

### 2. React Router Setup
- **BrowserRouter**: Main router wrapping the entire app
- **Nested Routes**: AppShell as layout route with child routes
- **Route Structure**:
  - `/` → MainTimer page
  - `/settings` → Settings page

### 3. Mobile-First Responsive Design
- **Container**: `max-w-md` for mobile optimization (384px max width)
- **Padding**: Consistent `px-4 py-6` spacing
- **Tap Targets**: `w-tap h-tap` (44x44px minimum) for accessibility
- **Responsive Classes**: Uses Tailwind's mobile-first approach

### 4. Theme System (Mint/Yellow Colors)
- **Mint Colors**: Used for primary elements (buttons, focus rings, text)
  - `text-mint-600` for timer display
  - `bg-mint-500` for primary buttons
  - `focus:ring-mint-500` for focus states
- **Accent Colors**: Used for bell-related elements
  - `bg-accent-400` for bell button
  - Yellow color scheme for bell notifications

### 5. Navigation System
- **Conditional Navigation**: Different buttons based on current route
- **Accessibility**: Proper ARIA labels and focus management
- **Icons**: SVG icons for settings gear and back arrow
- **Hover States**: Interactive feedback with `hover:bg-gray-50`

## 🧪 Test Coverage

All components have comprehensive tests:
- **AppShell.test.tsx**: Layout structure and responsive classes
- **Header.test.tsx**: Navigation behavior and accessibility
- **App.test.tsx**: Routing functionality

## 📱 Mobile-First Design Verification

The layout uses:
- `container mx-auto` for centering
- `max-w-md` for mobile-optimized width
- `px-4 py-6` for consistent spacing
- `w-tap h-tap` for proper touch targets
- Semantic HTML with proper roles

## 🎨 Theme Token Usage

Colors are properly implemented:
- **Mint**: Primary brand color for main UI elements
- **Accent**: Yellow for bell-related features
- **Gray**: Neutral colors for text and backgrounds
- **Focus**: Mint-colored focus rings for accessibility

## 🔗 Navigation Flow

1. **Main Page** (`/`):
   - Shows "スピーチタイマー" title
   - Settings gear icon (top-right)
   - MainTimer content with placeholders

2. **Settings Page** (`/settings`):
   - Shows "設定" title
   - Back arrow icon (top-left)
   - Settings content with placeholders

The routing structure is ready for the next tasks to implement the actual timer and settings functionality.