# Elanorra Living - Luxury Home Decor E-commerce Website

A complete, modern e-commerce website for premium home decor and lifestyle products. Built with Next.js 15, TypeScript, and Tailwind CSS with full WooCommerce-like functionality.

## 🌟 Features

### Core Functionality
- **Modern React Architecture**: Built with Next.js 15 App Router and TypeScript
- **Responsive Design**: Fully responsive across all devices (mobile, tablet, desktop)
- **Smooth Animations**: Beautiful interactions powered by Framer Motion
- **Shopping Cart**: Full cart functionality with persistent state using Zustand
- **Product Catalog**: Browse products with filtering and sorting options
- **Image Optimization**: Next.js Image component for optimal performance

### Design & UX
- **Hero Carousel**: Auto-playing image slider with manual controls
- **Product Cards**: Interactive cards with hover effects and quick actions
- **Navigation**: Multi-level dropdown navigation with search functionality
- **Toast Notifications**: User feedback for cart actions and interactions
- **Loading States**: Elegant loading animations and skeleton screens

### E-commerce Features
- **Product Management**: Categories, collections, and individual product pages
- **Cart Management**: Add, remove, update quantities with real-time totals
- **Wishlist**: Save favorite items (frontend implementation)
- **Search**: Product search functionality
- **Filtering**: Filter products by category and sort by various criteria

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS v4, Custom CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Icons**: Heroicons
- **Image Handling**: Next.js Image component with Unsplash placeholders
- **Development**: ESLint, TypeScript compiler

## 📦 Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Environment Setup**
   ```bash
   # Configure your environment variables in .env file
   # Make sure to set all required variables for your environment
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with header/footer
│   ├── page.tsx           # Homepage
│   ├── shop/              # Shop pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── layout/           # Layout components (Header, Footer, Cart)
│   ├── sections/         # Page sections (Hero, Featured Products)
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities and data
│   ├── data/            # Mock data and constants
│   ├── store/           # Zustand state management
│   └── utils/           # Helper functions
└── types/               # TypeScript type definitions
```

## 🎨 Design System

### Colors
- **Primary**: Rose (rose-500, rose-600, rose-700)
- **Neutral**: Gray scale (gray-50 to gray-900)
- **Background**: White (#ffffff)
- **Text**: Gray-900 for headings, Gray-600 for body text

### Typography
- **Font**: Instrument Sans (Google Fonts)
- **Headings**: Bold weights (font-bold)
- **Body**: Regular and medium weights

## 🛍 E-commerce Features Implementation

### Product Data Structure
```typescript
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  category: string;
  collection?: string;
  inStock: boolean;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
}
```

### Cart Management
- Persistent cart state using Zustand and localStorage
- Add/remove items with quantity management
- Real-time price calculations
- Cart sidebar with smooth animations

### Navigation Structure
- Home
- Shop (with subcategories)
  - Tableware (Dining, Cups & Mugs, etc.)
  - Collections (Vasant, Anaar, Sundarbans, etc.)
  - Stationery
  - Gifting
- Our Story
- Services
- Contact

## 📱 Responsive Design

- **Mobile First**: Designed for mobile devices first
- **Breakpoints**: sm: 640px, md: 768px, lg: 1024px, xl: 1280px
- **Touch Friendly**: Appropriate touch targets and gestures
- **Cross-browser**: Compatible with modern browsers

## 🚀 Deployment

This Next.js application can be deployed on various platforms including Vercel, Railway, or any hosting service that supports Node.js applications.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🎨 Inspiration

This project draws inspiration from modern lifestyle and tableware e-commerce experiences. All branding in this repository is intentionally generic to avoid referring to any specific company.

## 📈 Future Enhancements

- [ ] User authentication and accounts
- [ ] Real payment integration
- [ ] Product reviews and ratings
- [ ] Advanced search with filters
- [ ] Email newsletters
- [ ] Order tracking
- [ ] Admin dashboard

---

**Made with ❤️ using Next.js and modern web technologies**
