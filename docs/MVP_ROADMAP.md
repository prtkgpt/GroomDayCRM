# GroomDay CRM - MVP Roadmap

This document outlines the Phase 2 features planned after MVP launch.

## Current MVP Features (Phase 1) ✅

- [x] Authentication & Organization
- [x] Client & Pet CRM
- [x] Booking & Calendar
- [x] Services & Pricing
- [x] Payment Recording (manual)
- [x] Email Confirmations & Reminders
- [x] Dashboard
- [x] Settings

---

## Phase 2 Features

### 1. SMS Reminders
**Priority: High**

- Twilio integration for SMS messaging
- SMS templates (similar to email)
- "On my way" SMS button
- Two-way SMS (receive replies)
- SMS opt-in management
- Feature flag to enable/disable

**Implementation Notes:**
- Already scaffolded with feature flag `NEXT_PUBLIC_ENABLE_SMS`
- Need to add Twilio SDK integration
- Add SMS consent tracking to clients

### 2. Stripe Payments & Deposits
**Priority: High**

- Stripe Connect onboarding
- Online payment links
- Deposit collection for bookings
- Automatic payment reminders
- Refund handling
- Tip collection online
- Receipt generation

**Implementation Notes:**
- Add Stripe webhook handling
- Payment intent creation per appointment
- Customer portal for saved cards

### 3. Route Optimization
**Priority: Medium**

- Daily route view with map
- Optimize appointment order
- Travel time estimates
- Google Maps integration
- One-click navigation

**Implementation Notes:**
- Use Google Maps Directions API
- Calculate optimal visit order
- Show ETA updates

### 4. Staff Accounts & Permissions
**Priority: Medium**

- Multiple user accounts per organization
- Role-based permissions (Owner, Admin, Staff)
- Staff availability/schedules
- Appointment assignment
- Staff performance tracking

**Implementation Notes:**
- Already have User model with roles
- Add permission checks to server actions
- Staff calendar view

### 5. Packages & Memberships
**Priority: Medium**

- Create service packages (e.g., 5-groom bundle)
- Track package redemptions
- Membership tiers with discounts
- Automatic recurring bookings
- Package expiration handling

**Implementation Notes:**
- New Package and Membership models
- Discount application at checkout
- Reminder for package usage

### 6. Review Request Automation
**Priority: Low**

- Post-appointment review requests
- Google Reviews integration
- Custom review request timing
- Review tracking dashboard

**Implementation Notes:**
- Send email/SMS after COMPLETED status
- Include direct Google review link
- Track which appointments got reviews

### 7. Client Portal
**Priority: Low**

- Client self-service portal
- View upcoming appointments
- Cancel/reschedule online
- Update contact info
- View pet profiles
- Payment history

**Implementation Notes:**
- Separate auth flow for clients
- Limited access scope
- Mobile-optimized view

---

## Phase 3 Ideas (Future)

- **Multi-location support** - For growing businesses
- **Inventory management** - Track shampoos, tools, etc.
- **Advanced reporting** - Revenue trends, client retention
- **Photo gallery** - Before/after photos per pet
- **Waiting list** - Automated fill-ins for cancellations
- **Gift cards** - Digital gift card sales
- **Referral program** - Track client referrals
- **API access** - For third-party integrations

---

## Technical Improvements

### Performance
- [ ] Add caching layer (Redis)
- [ ] Optimize database queries
- [ ] Add pagination to lists
- [ ] Image optimization for pet photos

### Developer Experience
- [ ] Add unit tests
- [ ] Add E2E tests (Playwright)
- [ ] Add Storybook for components
- [ ] API documentation

### Infrastructure
- [ ] Background job processing
- [ ] Error monitoring (Sentry)
- [ ] Analytics (Posthog/Mixpanel)
- [ ] Backup automation

---

## Feedback & Prioritization

Features will be prioritized based on:
1. User feedback and requests
2. Impact on daily operations
3. Implementation complexity
4. Revenue potential

Submit feature requests through the app or GitHub issues.
