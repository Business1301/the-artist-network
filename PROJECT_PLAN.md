# THE ARTIST NETWORK
## Complete Product Vision, Features, Technical Architecture and Development Roadmap

**Project name:** The Artist Network
**Product type:** Artist discovery, hiring, portfolio and creative community marketplace
**Initial market:** India
**Primary goal:** Help artists get discovered, find paid opportunities, build their professional presence and grow their careers. Help businesses, venues, event organizers and customers discover and hire the right artists.

---

# 1. THE VISION

The Artist Network is a platform that connects talented artists with people and organizations looking for creative talent.

Many talented artists struggle to find clients, promote their work professionally, discover opportunities and build a reliable income. At the same time, businesses and event organizers often struggle to find suitable performers and creative professionals.

The Artist Network should bring both sides together in one place.

The platform should help:
- Artists showcase their talent.
- Businesses discover and hire artists.
- Event organizers find performers for events.
- Venues discover artists for recurring performances.
- Customers find creative professionals for private events.
- Emerging artists gain visibility and experience.
- Established artists build stronger professional networks.
- Artists discover auditions, competitions, exhibitions and other opportunities.

The long-term vision is to become a trusted destination for discovering, hiring and supporting creative talent.

The platform should feel professional, modern, inclusive, creative and trustworthy.

---

# 2. THE PEOPLE WHO WILL USE THE PLATFORM

Design the system around the following user groups.

## 2.1 Artists

Artists are the people whose talent is showcased on the platform.

Artist types may include:

### Performing artists
- Singers and vocalists
- DJs
- Solo musicians
- Instrumentalists
- Bands and musical groups
- Dancers
- Dance groups
- Comedians
- Hosts and emcees
- Actors and theatre performers
- Magicians
- Other live entertainers

### Visual and creative artists
- Painters
- Mural artists
- Sketch artists
- Portrait artists
- Illustrators
- Sculptors
- Digital artists
- Photographers
- Other creative professionals

Artists should be able to create a professional profile, upload portfolio content, describe their services, receive enquiries and manage opportunities.

## 2.2 Businesses

Examples include:
- Restaurants and cafés
- Hotels and resorts
- Bars and lounges
- Corporate offices
- Retail stores
- Shopping malls
- Advertising agencies
- Event production companies
- Wedding planners
- Brands seeking creative collaborations

Businesses should be able to search for suitable artists, compare portfolios, shortlist candidates and send hiring enquiries.

## 2.3 Event organizers

Event organizers may arrange:
- Weddings
- Corporate events
- Private parties
- Festivals
- College festivals
- Concerts
- Exhibitions
- Cultural programs
- Brand activations
- Community events

They should be able to discover talent based on event type, date, location, budget and artistic category.

## 2.4 Venues

Venues include restaurants, hotels, cafés, bars, event spaces and performance venues.

They may need artists for:
- Daily or weekly performances
- Weekend entertainment
- Special events
- Seasonal programs
- Recurring contracts

Venue accounts should eventually support venue profiles and recurring opportunities.

## 2.5 General customers

Customers may be individuals looking to hire artists for private occasions, celebrations, parties, weddings and other events.

## 2.6 Administrators

Administrators manage the platform, moderate content, review artist applications, handle reports, maintain categories and protect the marketplace.

An administrator must have explicit permissions that normal users cannot grant themselves.

---

# 3. PRODUCT PRINCIPLES

The following principles should guide every feature.

1. Artist discovery must be simple.
2. Artist profiles should focus on actual work and talent.
3. The platform should work well on mobile phones.
4. Registration should be straightforward.
5. Artists should be able to create a profile before completing every optional detail.
6. Important account and contact information must remain private.
7. Public profiles must display only information the artist has chosen to make public.
8. Search results should be useful, relevant and easy to filter.
9. Businesses should be able to contact artists without unnecessary friction.
10. The platform must clearly distinguish sample content from real users.
11. Booking requests must have a real, persistent status rather than being simulated.
12. Administrative and security features must be built into the data model from the beginning.
13. The initial version should avoid unnecessary subscriptions and expensive infrastructure.
14. Future features should fit into the architecture without requiring a complete rewrite.

---

# 4. WEBSITE DESIGN AND BRAND DIRECTION

Create a polished, professional marketplace for creative talent.

## Visual direction

The design should feel like a modern creative industry platform rather than a generic corporate dashboard.

Use:
- A clean, spacious layout.
- Strong typography and clear visual hierarchy.
- Large, high-quality artist imagery.
- Attractive portfolio cards.
- Subtle gradients and restrained animation.
- Consistent spacing and rounded components.
- Clear calls to action.
- Accessible contrast and readable text.
- Responsive layouts for phones, tablets and desktops.

Choose a distinctive color palette and document it in reusable design tokens. Keep the design consistent across the homepage, search pages, artist profiles and dashboards.

Do not overload the interface with animations, gradients or decorative elements.

Use genuine artist photography only when properly licensed. During development, use clearly labelled sample content or suitable placeholders. Never present fictional people, ratings, testimonials or bookings as real platform users.

## Global navigation

The main navigation should include:
- Logo and homepage link
- Discover Artists
- Categories
- Opportunities
- How It Works
- For Businesses
- Log In
- Join as an Artist

After authentication, display the appropriate account menu and dashboard link.

On mobile, provide a clean navigation menu that works with touch interactions.

---

# 5. HOMEPAGE

The homepage should immediately explain the platform and guide visitors toward discovering artists or joining the marketplace.

## Section 1: Navigation bar

Include the brand, discovery links, business information and authentication actions.

Primary actions:
- Discover Artists
- Join as an Artist
- Hire an Artist

## Section 2: Hero

Use a strong headline explaining the value of the platform.

Suggested headline: "Where Talent Meets Opportunity."

Suggested supporting copy: "Discover incredible artists, connect with creative talent and turn artistic passion into real opportunities."

Primary button: Discover Artists
Secondary button: Join as an Artist

The hero should have an attractive, artistic visual treatment.

## Section 3: Search artists

Include a prominent search interface with:
- Artist name or keyword
- Category
- Location
- Optional event date
- Search button

Do not imply that date availability is verified until an availability feature exists.

## Section 4: Browse categories

Display attractive category cards for:
- Singers
- DJs
- Bands
- Musicians
- Dancers
- Comedians
- Hosts and emcees
- Painters
- Mural artists
- Sketch artists
- Photographers
- Other creative professionals

Selecting a category should open a working results page filtered to that category.

## Section 5: Featured artists

Display approved, published artist profiles.

Artist cards may include:
- Profile photo
- Display name
- Primary category
- City
- Short description
- Portfolio preview
- Starting price, only when supplied and appropriate
- Verification badge, only when genuinely verified
- View Profile button

Never invent ratings, reviews or verification statuses.

Until real artists exist, show a small number of clearly labelled demonstration profiles.

## Section 6: How it works

Explain the process for both sides.

For clients:
1. Discover artists.
2. Explore portfolios.
3. Send an enquiry.

For artists:
1. Create a profile.
2. Showcase your talent.
3. Connect with potential clients.

## Section 7: Opportunities

Eventually display:
- Auditions
- Competitions
- Artist calls
- Exhibitions
- Festivals
- Creative collaborations

Only show real opportunities once this feature is implemented.

## Section 8: For businesses

Explain how businesses and event organizers can find appropriate talent.

Include a button to explore the business hiring process.

## Section 9: Artist call to action

Encourage artists to create their profiles and showcase their work.

## Section 10: Footer

Include:
- About
- Discover Artists
- For Businesses
- How It Works
- Contact
- Privacy Policy
- Terms of Service
- Community Guidelines
- Social media links, once official accounts exist

---

# 6. ARTIST REGISTRATION AND ONBOARDING

Create a real artist registration and profile management flow.

## Registration

Support email and password authentication initially.

Email verification should be configured before production launch.

Social login can be considered later.

## Initial onboarding fields

Ask for:
- Display name
- Email address
- Artist category
- City
- Short introduction

Collect optional details progressively rather than overwhelming new users with a long form.

## Artist application workflow

Use a clear status model:
- Draft
- Submitted
- Under review
- Approved
- Rejected
- Suspended

An artist should be able to save a draft, edit it and submit it for review.

Administrators should be able to approve or reject applications with an internal reason.

Rejected artists should be able to correct issues and resubmit when permitted.

Suspended accounts must not appear in public search.

Only approved, active and published artists should appear in public discovery.

Artists must not be able to approve themselves or change their own role to administrator.

---

# 7. ARTIST PROFILES

Each artist should have a public profile page with a unique, readable URL.

Example URL pattern: `/artists/artist-display-name`

## Profile information

Include:
- Profile image
- Display name
- Artist category
- City or service area
- Short biography
- Full biography
- Years of experience, if supplied
- Skills and specialties
- Languages
- Performance or service formats
- Portfolio
- Services offered
- Starting price or price range, if supplied
- Availability information, if implemented
- Professional social links, if supplied
- Enquiry button

Artists should be able to preview their profiles before publishing.

## Profile editing

Artists should be able to:
- Edit their biography.
- Update their location.
- Add or remove skills.
- Change their profile image.
- Manage portfolio items.
- Manage service descriptions.
- Update pricing information.
- Control permitted public details.
- Preview their profile.

Do not expose private account information or internal moderation notes.

## Verification

Verification should be a controlled administrative process.

A verification badge must only be displayed after an authorized administrator has completed the relevant checks.

Do not treat email verification as proof of professional identity.

---

# 8. ARTIST PORTFOLIOS

Portfolios are one of the most important features of the marketplace.

## Portfolio item types

Support:
- Images
- Videos through approved external links
- Audio through approved external links
- Project descriptions
- Event or project highlights

For the first version, prioritize image uploads and external media links rather than building a complex media streaming system.

## Portfolio item fields

Each item may contain:
- Title
- Description
- Media type
- Media URL or storage reference
- Thumbnail
- Creation date, if relevant
- Display order
- Publication status

Artists should be able to add, edit, reorder and remove their own portfolio items.

Enforce upload size and file-type restrictions.

Use secure storage permissions. Private drafts must not become public accidentally.

Do not allow uploaded files to execute as code.

Use optimized image sizes and thumbnails to reduce storage and bandwidth costs.

---

# 9. ARTIST DISCOVERY AND SEARCH

Build a functional artist directory.

## Search fields

Allow searching by:
- Artist name
- Category
- Subcategory
- City
- Keyword
- Service or performance type

## Filters

Potential filters include:
- Location
- Artist category
- Service type
- Budget range
- Languages
- Solo artist or group
- Remote or in-person service
- Availability, once implemented
- Verified status, based on genuine verification

## Sorting

Support:
- Recently published
- Alphabetical
- Relevant matches

Do not claim that a ranking is based on popularity, ratings or quality unless those metrics are genuinely calculated from reliable data.

## Search behavior

- Provide clear empty states.
- Preserve filter selections when navigating results.
- Use pagination or another efficient loading strategy.
- Keep search fast on mobile devices.
- Only include approved, active and published profiles.
- Avoid exposing private artist information through search APIs.

Initially, implement reliable category and location filtering before attempting advanced recommendations.

---

# 10. BUSINESS AND CLIENT ACCOUNTS

Businesses and other clients should have accounts separate from artist accounts.

## Business registration

Collect:
- Business or organization name
- Contact person's name
- Business email
- City
- Business type

Additional information should be optional initially.

## Business profile

Include:
- Business name
- Logo
- Description
- Location
- Industry
- Website or public social links
- Relevant event or hiring information

Allow businesses to update their own information.

Private contact details should not automatically become publicly visible.

## Client dashboard

Provide sections for:
- Saved artists
- Sent enquiries
- Enquiry statuses
- Upcoming confirmed bookings, once implemented
- Business profile settings

A client should only see enquiries and bookings they are authorized to access.

---

# 11. SAVED ARTISTS AND SHORTLISTS

Allow authenticated clients to save artists they may want to hire later.

Features:
- Save an artist.
- Remove an artist from saved items.
- View saved artists in a dashboard.
- Open a saved artist's profile.
- Organize artists into named lists in a later release.

Each saved item must belong to the correct client account.

Prevent duplicate saved entries for the same user and artist.

---

# 12. BOOKING ENQUIRIES

The first version should support enquiries before attempting a complicated payment or booking system.

## Enquiry form

Clients should be able to submit:
- Selected artist
- Event or project type
- Event date, if applicable
- Location
- Expected duration
- Budget range, if applicable
- Message
- Contact preferences

Make it clear that submitting an enquiry does not confirm a booking.

## Enquiry status

Use statuses such as:
- New
- Viewed
- Responded
- Negotiating
- Accepted
- Declined
- Cancelled
- Completed

Implement only the transitions that make sense for the actual workflow.

## Artist enquiry dashboard

Artists should be able to:
- View incoming enquiries.
- Read the event or project details.
- Respond or decline.
- Update permitted statuses.
- View their enquiry history.

## Client enquiry dashboard

Clients should be able to:
- View sent enquiries.
- Check status.
- Review artist responses.
- Cancel an enquiry when permitted.

## Notifications

Initially, provide in-app status indicators.

Email notifications can be added after the core workflow is stable and an appropriate email provider is configured.

Never show a successful submission message unless the enquiry has actually been saved.

---

# 13. OPPORTUNITIES, AUDITIONS AND COMPETITIONS

This is an important future expansion of the platform.

The system should eventually support opportunities such as:
- Auditions
- Singing competitions
- Dance competitions
- Art exhibitions
- Mural commissions
- Artist residencies
- Festivals
- Paid performance opportunities
- Brand collaborations
- Open calls for creative work

## Opportunity information

Each opportunity should have:
- Title
- Description
- Organizer
- Category
- Location or remote status
- Application deadline
- Event date, where relevant
- Compensation information, where applicable
- Eligibility requirements
- Application instructions
- Publication status

## Opportunity lifecycle

Potential statuses:
- Draft
- Pending review
- Published
- Closed
- Cancelled

Artists should be able to discover opportunities and apply when applications are supported.

Organizers should manage only opportunities they are authorized to manage.

Administrators should be able to moderate reported or misleading opportunities.

For the initial launch, consider publishing administrator-managed opportunities before allowing every user to create public listings.

---

# 14. ARTIST COMMUNITY AND GROWTH

The long-term goal is not only to help artists get hired but also to help them grow.

Future features may include:

## Educational resources
- Portfolio-building guidance
- Pricing guidance
- Audition preparation
- Business and contract basics
- Marketing tips
- Professional development resources

## Artist announcements
- New opportunities
- Community events
- Platform updates
- Workshops

## Artist stories
- Interviews
- Success stories
- Behind-the-scenes features

## Community interaction
- Artist collaborations
- Professional connections
- Community groups

Build these features only after the marketplace's core discovery and enquiry flows work well.

Avoid launching an unrestricted public feed before moderation, reporting and privacy controls are ready.

---

# 15. REVIEWS AND RATINGS

Reviews can help clients make informed decisions, but they require careful design.

Do not implement fake reviews or sample ratings that appear authentic.

When the feature is introduced:
- Only eligible clients should be able to submit reviews.
- Reviews should be associated with legitimate completed engagements where possible.
- Prevent duplicate reviews for the same engagement.
- Allow users to report abusive or fraudulent reviews.
- Provide a moderation process.
- Make the review policy clear.
- Do not let artists edit their own ratings.

Do not launch reviews until the platform has a reliable method for determining which engagements qualify.

---

# 16. ADMINISTRATION DASHBOARD

The platform requires a secure administrative area.

## Administrator capabilities

Administrators should be able to:
- Review artist applications.
- Approve or reject profiles.
- Manage verification.
- Suspend accounts when justified.
- Manage categories and subcategories.
- Moderate portfolio content.
- Review reported users and content.
- Manage opportunities.
- View marketplace enquiries for legitimate support purposes.
- Review basic platform activity.
- Manage public site content where appropriate.

## Security requirements

- Administrator access must be assigned securely.
- Users must not be able to promote themselves to administrator.
- Administrative actions should be recorded in an audit log.
- Internal moderation notes must remain private.
- Support staff should receive only the permissions they need.
- Destructive actions should require confirmation.

Create the initial administrator account through a secure, documented process. Never hardcode an administrator password into the source code.

---

# 17. DATABASE AND DATA MODEL

Use Supabase with PostgreSQL for the initial implementation.

Design the schema around clear relationships.

## Suggested tables

### User and account tables
- `profiles`
- `user_roles`

### Artist tables
- `artist_profiles`
- `artist_categories`
- `artist_category_assignments`
- `artist_portfolio`
- `artist_services`
- `artist_applications`

### Client tables
- `businesses`
- `venues`

### Marketplace tables
- `saved_artists`
- `enquiries`
- `bookings` — when the booking workflow is implemented

### Future tables
- `opportunities`
- `opportunity_applications`
- `reviews`
- `reports`
- `notifications`
- `audit_logs`

Avoid creating every future table immediately. Add tables through version-controlled database migrations as each feature is built.

Use foreign keys, appropriate indexes, unique constraints and validation rules.

Use UUID identifiers where appropriate.

Store timestamps in a consistent format and handle display in the user's local timezone.

Design the data model so one account can eventually have more than one legitimate capability, if required, without weakening authorization.

---

# 18. AUTHENTICATION AND SECURITY

Use Supabase Auth for user authentication.

Implement:
- Registration
- Email verification
- Login
- Logout
- Password reset
- Protected dashboard routes
- Secure role checks
- Session-aware navigation

## Row Level Security

Enable and test Row Level Security (RLS) on all tables containing private or user-managed data.

Examples:
- Artists may edit their own profile, subject to moderation rules.
- Artists may manage their own portfolio items.
- Clients may edit their own business profile.
- Clients may see only their own enquiries.
- Artists may see only enquiries directed to them.
- Only authorized administrators may approve profiles or access moderation controls.
- Public visitors may read only approved and published artist information.

Do not rely on hiding buttons in the frontend for security.

Keep secret keys on the server. Never expose Supabase service-role credentials in browser code or variables beginning with `NEXT_PUBLIC_`.

Validate sensitive operations on the server.

Apply rate limits or abuse protections where appropriate.

Do not expose private emails, phone numbers or internal account information through public APIs.

---

# 19. TECHNOLOGY STACK

Use the following stack unless a real compatibility issue requires a documented change.

## Frontend
- Next.js
- TypeScript
- Tailwind CSS
- App Router
- Reusable React components

## Backend and database
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage for portfolio images

## Development tools
- Google Antigravity for AI-assisted development
- Git for version control
- GitHub for code hosting

## Deployment
- Vercel or another compatible hosting provider

Start with free tiers where available.

Before enabling a paid feature, explain:
1. Why it is needed.
2. Whether a free alternative exists.
3. What might cause charges.
4. Whether a spending limit or alert can be configured.

Never promise that a platform will remain free at every scale.

---

# 20. PERFORMANCE, ACCESSIBILITY AND SEARCH ENGINE VISIBILITY

The website should be designed for real users, not just a visual demo.

## Performance
- Optimize image sizes.
- Use thumbnails for portfolio previews.
- Avoid loading large media unnecessarily.
- Minimize unnecessary database queries.
- Add pagination to long result lists.
- Avoid expensive background jobs in the first version.

## Accessibility
- Use semantic HTML.
- Ensure buttons and forms have labels.
- Support keyboard navigation.
- Maintain readable contrast.
- Provide useful image alternative text.
- Make validation errors understandable.

## Search engine visibility
- Use meaningful page titles and descriptions.
- Give public artist pages readable URLs.
- Generate appropriate metadata.
- Make public profiles crawlable when intended.
- Keep private dashboards and account pages out of public indexing.
- Add a sitemap for appropriate public pages when the site is ready.

Do not expose private user information through metadata or structured data.

---

# 21. TRUST, PRIVACY AND MODERATION

Trust is essential for a marketplace.

Include:
- Privacy Policy
- Terms of Service
- Community Guidelines
- Contact or support route
- Content reporting
- Account suspension and appeal processes
- Secure password reset
- Clear enquiry expectations

Collect only the information necessary for the product.

Provide a process for users to request account deletion and understand what happens to their data.

Do not claim that artists are background-checked or professionally verified unless the platform actually performs those checks.

Do not publicly expose precise home addresses.

Use appropriate safeguards for minors, sensitive content and potentially fraudulent listings before enabling features that could expose users to risk.

Before launch, review applicable Indian privacy, consumer protection, taxation and other relevant legal requirements with qualified guidance.

---

# 22. MONETIZATION — FUTURE PLAN

Do not build payments into the initial MVP.

First establish that artists can create useful profiles and clients can discover and contact them.

Potential future revenue models include:

## Featured profiles
Artists may pay for clearly labelled promotional placement.

## Business subscriptions
Businesses may pay for additional hiring tools, team accounts or advanced filters.

## Opportunity promotion
Organizers may pay to promote legitimate opportunities.

## Booking commission
The platform may eventually earn a fee on bookings completed through a supported payment flow.

## Premium artist tools
Advanced portfolio features or professional tools could be offered in a paid plan.

Any paid placement must be labelled transparently. Payment must not be represented as proof of quality or verification.

Before introducing monetization, validate user demand, operating costs, payment-provider fees and applicable legal requirements.

---

# 23. PHASED DEVELOPMENT ROADMAP

Do not try to build the entire product in one AI request.

Build and test one milestone at a time.

## PHASE 1 — Foundation and visual prototype ✅ COMPLETE

Build:
- Project structure
- Design system
- Responsive homepage
- Navigation
- Category cards
- Clearly labelled sample artist cards
- How It Works
- Footer
- Reusable UI components

Acceptance criteria:
- The application starts locally. ✅
- The homepage loads without errors. ✅
- Layout works on mobile and desktop. ✅
- Navigation and category interactions work where implemented. ✅
- No buttons falsely claim to complete unimplemented actions. ✅

## PHASE 2 — Database and authentication ✅ COMPLETE

Build:
- Supabase project configuration ✅
- Database migrations ✅
- User profiles ✅
- Registration and login ✅
- Email verification ✅
- Logout ✅
- Password reset ✅
- Role and permission model ✅
- RLS policies ✅

Acceptance criteria:
- Users can register and sign in. ✅
- Protected routes require authentication. ✅
- Users cannot edit other users' private information. ✅
- Administrator privileges cannot be assigned by normal users. ✅
- Security policies are tested. ✅

## PHASE 3 — Artist onboarding and profiles ✅ COMPLETE

Build:
- Artist application / onboarding flow ✅
- Profile editor (personal, location, genres, rates, social links) ✅
- Profile preview (`/artists/[slug]`) ✅
- Draft and submission workflow (`draft` -> `pending_review`) ✅
- Approval and rejection database safeguards ✅
- Public artist profile pages with Next.js 16 Partial Prerendering ✅
- Profile publishing controls & anti-tampering triggers ✅
- Portfolio media manager (photos & YouTube embeds) ✅

Acceptance criteria:
- Artists can create and edit their own profiles. ✅
- Unapproved profiles do not appear in public search. ✅
- Approved published profiles are visible. ✅
- Private details remain private. ✅
- Security triggers block unauthorized self-publishing/self-verification. ✅

## PHASE 4 — Portfolio and discovery

Build:
- Portfolio uploads
- Image validation
- Portfolio management
- Artist directory
- Search by name and keyword
- Category filtering
- Location filtering
- Pagination
- Artist profile navigation

Acceptance criteria:
- Portfolio items persist after refreshing.
- Users can manage only their own portfolio.
- Search returns appropriate profiles.
- Private or unapproved profiles are excluded.

## PHASE 5 — Business accounts, verified artists, and enquiries

### Phase 5.1 — Non-Binding Business Enquiry System (Completed & Deployed)
Build:
- Business registration and profiles
- Artist shortlists
- Non-binding enquiry form
- Enquiry persistence and audit event logging
- Business enquiry dashboard
- Artist enquiry inbox and clarification flow
- Non-binding expression of interest / decline / withdrawal

Acceptance criteria:
- A verified business can send a non-binding enquiry.
- Exactly one enquiry is saved in the database with an audit event log.
- The selected artist can view it and respond.
- Unrelated users cannot read or modify it (strict RLS).
- Zero automated bookings, zero binding contracts, zero payments/escrow.

### Phase 5.2 — Verified Artist Visibility & Individual Booking Support (Current)
Part A (Implemented Locally):
- Prominent "Verified Artist" badge for officially verified profiles (`is_verified === true`).
- Distinct, neutral "Not Verified" indicator for unverified community profiles (`is_verified === false`).
- Sample profile badge for demonstration cards (`is_verified: false` enforced across demo data).
- Directory filter "Verified Only" toggle and drawer option.
- Artist detail page verification status header, hero overlay, and platform verification disclaimer.
- Artist workspace badges reflecting public verification status.

Part B (Architectural Design & Review):
- Expand platform user roles to include `individual` alongside `artist`, `business`, and `admin`.
- Individual user registration and authentication flow (`/signup?role=individual`).
- Dedicated Individual client dashboard (`/dashboard/client`).
- Unified non-binding booking enquiry model (`client_id`, `requester_type`, `event_category`).
- Strict RLS and RPC authorization ensuring 100% backward compatibility for existing business accounts.
- Preserving non-binding terms: no payments, no contracts, no escrow, no automated booking.

## PHASE 6 — Opportunities

Build:
- Opportunity listing
- Category and location filters
- Opportunity details
- Administrator moderation
- Applications, if the application workflow is ready

Acceptance criteria:
- Published opportunities are visible.
- Draft and closed opportunities are handled correctly.
- Unauthorized users cannot manage other organizers' listings.

## PHASE 7 — Quality, trust and launch

Build or complete:
- Error handling
- Loading states
- Empty states
- Accessibility improvements
- Privacy and legal pages
- Reporting workflow
- Basic monitoring
- Search metadata
- Production environment configuration
- Deployment
- Backup and recovery plan

Acceptance criteria:
- Core flows have been tested.
- Secrets are not committed to source control.
- Authorization has been tested.
- The deployed site works on mobile and desktop.
- Costs and service limits are understood.

## PHASE 8 — Growth and monetization

Consider only after the marketplace has real usage:
- Reviews
- Notifications
- Recurring venue opportunities
- Advanced search
- Recommendation features
- Community tools
- Premium accounts
- Payment integration
- Booking management

---

# 24. TESTING REQUIREMENTS

Test important workflows rather than only checking whether pages look attractive.

Include tests for:
- Registration
- Login and logout
- Password reset
- Artist application
- Profile editing
- Profile approval
- Portfolio upload
- Public search
- Saved artists
- Enquiry submission
- Enquiry access restrictions
- Business profile editing
- Unauthorized administrative access
- Mobile layouts
- Invalid form submissions
- Database errors
- File upload restrictions

Use test accounts and test data.

Do not use real customers' personal information for development testing.

---

# 25. AI DEVELOPMENT WORKFLOW

Antigravity should work as a careful development assistant.

For each milestone:

1. Inspect the current project.
2. Explain the proposed changes.
3. List the files that will be created or changed.
4. Identify required dependencies.
5. Explain any commands that modify the project or environment.
6. Ask before destructive or consequential operations.
7. Implement only the agreed milestone.
8. Run available checks and tests.
9. Explain what was completed.
10. Explain what remains unfinished.
11. Report errors honestly.
12. Recommend the next small step.

Do not rewrite the entire application for a small change.

Do not replace working functionality without a clear reason.

Do not invent API credentials or claim that an external service is connected when it is not.

Do not silently change the agreed technology stack.

Prefer maintainable, typed code and reusable components.

Use database migrations rather than relying on undocumented manual changes.

Do not commit secrets or credentials to GitHub.

---

# 26. FIRST IMPLEMENTATION TASK

The immediate task is only Phase 1.

Inspect the current project folder and development environment.

If the folder is empty, propose the appropriate Next.js setup.

Then build the responsive homepage and reusable visual components.

Do not connect Supabase yet.

Do not implement fake authentication, fake booking confirmation, fake reviews, fake ratings or fake payments.

Use clearly labelled demonstration data only where needed for the visual prototype.

Do not build future phases prematurely.

After completing the homepage:
- Run the available development checks.
- Tell the user how to run the application.
- Explain how to open it in a browser.
- List any known limitations.
- Ask before proceeding to Phase 2.

---

# 27. PRODUCT SUCCESS CRITERIA

The initial marketplace should be considered successful when:

1. Artists can register and create professional profiles.
2. Artists can submit profiles for review.
3. Administrators can review and approve applications.
4. Approved artists can publish portfolios.
5. Clients can discover artists by category and location.
6. Clients can save artists.
7. Clients can send genuine hiring enquiries.
8. Artists can manage incoming enquiries.
9. Users cannot access other users' private information.
10. The website is responsive and usable on mobile.
11. Core functionality works without unnecessary paid services.
12. The platform can be improved incrementally without a major rewrite.

The most important initial outcome is a trustworthy artist discovery and enquiry marketplace. Community features, reviews, advanced recommendations and monetization should come after that foundation works reliably.

---

*Last updated: October 2026*
*Current phase: Phase 1 complete — ready for Phase 2*

