# 🎯 ORA Jewellery — Marketing & Tracking Tools Guide

> **For:** Marketing team, agency partners, and founder
> **Last Updated:** March 2026
> **Website:** orashop.in

---

## 📋 Table of Contents

1. [Meta (Facebook/Instagram) Tracking](#1-meta-facebookinstagram-tracking)
2. [Google Analytics (GA4)](#2-google-analytics-ga4)
3. [Google Ads](#3-google-ads)
4. [Meta Ads Manager](#4-meta-ads-manager)
5. [Influencer Tracking (UTM Links)](#5-influencer-tracking-utm-links)
6. [Reporting & KPIs](#6-reporting--kpis)
7. [Access Checklist for Agency/Marketing Partner](#7-access-checklist-for-agencymarketing-partner)
8. [Implementation Status in ORA Project](#8-implementation-status-in-ora-project)

---

## 1. Meta (Facebook/Instagram) Tracking

### What is Meta Pixel?
A small piece of JavaScript code you place on your website. It tracks:
- **Page Views** — who visited which page
- **Add to Cart** — who added products to cart
- **Initiate Checkout** — who started checkout
- **Purchase** — who completed a purchase (with value)
- **View Content** — who viewed a specific product

Meta uses this data to:
- Show your ads to people most likely to buy (optimization)
- Track how many sales came from your ads (attribution)
- Build "lookalike audiences" of your best customers

### How to Get Your Meta Pixel ID
1. Go to [business.facebook.com](https://business.facebook.com)
2. Navigate to **Events Manager** → **Data Sources**
3. Click **Connect Data** → **Web** → **Meta Pixel**
4. Name it "ORA Jewellery Pixel"
5. Copy the **Pixel ID** (looks like: `123456789012345`)
6. Share this ID with your developer

### Browser Pixel vs Conversions API (CAPI)

| Feature | Browser Pixel | Conversions API (CAPI) |
|---------|--------------|----------------------|
| **How it works** | JavaScript in the browser | Server-to-server from your backend |
| **Blocked by ad blockers?** | Yes (30-40% of users) | No — runs on your server |
| **Data accuracy** | ~60-70% | ~95%+ |
| **Setup difficulty** | Easy (copy-paste) | Medium (needs backend code) |
| **Recommendation** | Must have (baseline) | Strongly recommended for D2C |

**ORA Recommendation:** Use **BOTH**. Browser pixel for basic tracking + CAPI for purchase/checkout events from the backend. This gives you the best ad optimization.

### Events to Track (Standard E-commerce)

| Event | When it fires | Why it matters |
|-------|--------------|----------------|
| `PageView` | Every page load | Base tracking |
| `ViewContent` | Product detail page | Know what's popular |
| `AddToCart` | Click "Add to Bag" | Retarget cart visitors |
| `InitiateCheckout` | Checkout page loads | Find drop-off points |
| `Purchase` | Order confirmed | Track ROI on ads |
| `Search` | Search query made | Know what people want |
| `CompleteRegistration` | User signs up | Build audiences |

---

## 2. Google Analytics (GA4)

### What is GA4?
Google's free analytics platform. Tracks everything about your website visitors:
- Where they came from (Google, Instagram, direct, etc.)
- What pages they visit and for how long
- What products they view, add to cart, purchase
- Demographics (age, gender, city, device)
- Funnel analysis (where customers drop off)

### How to Set Up GA4
1. Go to [analytics.google.com](https://analytics.google.com)
2. Create an account → Create a property (name: "ORA Jewellery")
3. Select "Web" as platform
4. Enter your website URL: `orashop.in`
5. Copy the **Measurement ID** (looks like: `G-XXXXXXXXXX`)
6. Share this with your developer

### Key GA4 E-commerce Events

| Event | Description |
|-------|-------------|
| `view_item` | Product page viewed |
| `add_to_cart` | Item added to cart |
| `begin_checkout` | Checkout started |
| `purchase` | Order completed |
| `view_item_list` | Collection/category page viewed |
| `select_item` | Product clicked from a list |

### GA4 Reports You'll Use Daily
- **Realtime** — who's on the site right now
- **Acquisition** — where traffic comes from
- **Engagement** — most viewed pages, time on site
- **Monetization** — revenue, transactions, AOV
- **Funnel exploration** — where exactly do people drop off

---

## 3. Google Ads

### What is Google Ads?
Paid advertising on Google Search, YouTube, Gmail, and the Display Network.

### Types of Google Ads Campaigns for D2C Jewellery

| Campaign Type | Best For | Budget Range |
|---------------|----------|-------------|
| **Performance Max (PMax)** | Automated across all Google surfaces | ₹500-2000/day |
| **Search Ads** | People searching "buy necklace online" | ₹300-1000/day |
| **Shopping Ads** | Product images shown in Google search | ₹500-1500/day |
| **YouTube Ads** | Brand awareness, influencer amplification | ₹200-800/day |
| **Remarketing Display** | Retarget website visitors | ₹200-500/day |

### Key Metrics

| Metric | What it means | Good benchmark for jewellery |
|--------|--------------|------------------------------|
| **CPC** (Cost per Click) | What you pay per click | ₹5-25 |
| **CTR** (Click-through Rate) | % of people who click your ad | 2-5% |
| **CPA** (Cost per Acquisition) | Cost to get one order | ₹150-500 |
| **ROAS** (Return on Ad Spend) | Revenue per ₹1 spent | 3x-8x |
| **Conversion Rate** | % of visitors who buy | 1.5-4% |

### Google Ads Conversion Tracking
- Needs a **Google Ads Conversion ID** and **Conversion Label**
- Fires when a purchase is completed
- Links to GA4 for full-funnel data

---

## 4. Meta Ads Manager

### Campaign Structure

```
Campaign (Objective: Sales)
  └── Ad Set 1 (Audience: Women 18-35, Interest: Jewellery)
       └── Ad 1 (Necklace carousel)
       └── Ad 2 (Reel: Unboxing video)
  └── Ad Set 2 (Lookalike of purchasers)
       └── Ad 3 (Bestseller static image)
       └── Ad 4 (Story: Limited-time offer)
```

### Recommended Audiences for ORA

| Audience | Type | Description |
|----------|------|-------------|
| Interest-based | Cold | Women 18-35 interested in fashion jewellery, online shopping |
| Lookalike 1% | Warm | People similar to your purchasers |
| Website visitors (7d) | Hot | Retarget recent visitors |
| Add-to-cart (no purchase) | Hot | Cart abandoners |
| Purchasers (exclude) | Exclusion | Don't waste money re-targeting buyers |

### Ad Creative Best Practices for Jewellery D2C
1. **Reels/Short videos** — unboxing, try-on, styling
2. **Carousel ads** — 3-5 products in one ad
3. **UGC (User Generated Content)** — customer selfies wearing ORA
4. **Before/After styling** — plain outfit → with ORA jewellery
5. **Gift-focused** — "Gift her something special"

---

## 5. Influencer Tracking (UTM Links)

### What are UTM Links?
Special tracking parameters added to your URL so you know exactly which influencer/campaign drove traffic and sales.

### UTM Structure

```
https://orashop.in/collections?
  utm_source=instagram
  &utm_medium=influencer
  &utm_campaign=march2026_launch
  &utm_content=priya_sharma_reel1
```

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `utm_source` | Where the traffic comes from | instagram, youtube, email |
| `utm_medium` | Type of marketing | influencer, paid, organic, email |
| `utm_campaign` | Campaign name | march2026_launch, womens_day |
| `utm_content` | Specific creative/influencer | priya_sharma_reel1 |
| `utm_term` | (Optional) Keyword or product | gold_necklace |

### UTM Link Generator
Use: [https://ga-dev-tools.google/ga4/campaign-url-builder/](https://ga-dev-tools.google/ga4/campaign-url-builder/)

### Influencer Tracking Workflow
1. **Create unique UTM link** for each influencer
2. **Shorten the link** using Bitly or short.io (so it's clean for stories/bio)
3. **Give the link** to the influencer for their bio/story/reel
4. **Track in GA4** → Acquisition → Traffic Acquisition → filter by `utm_content`
5. **Track in Meta** → Events Manager → filter by URL parameter

### Influencer Tracking Spreadsheet Template

| Influencer | Platform | Followers | UTM Link | Posts | Clicks | Orders | Revenue | CPO |
|-----------|----------|-----------|----------|-------|--------|--------|---------|-----|
| @priya_style | Instagram | 50K | bit.ly/ora-priya | 3 | 450 | 12 | ₹8,400 | ₹250 |
| @meera_glow | Instagram | 25K | bit.ly/ora-meera | 2 | 200 | 5 | ₹3,500 | ₹200 |

---

## 6. Reporting & KPIs

### Daily Metrics (Quick Check)

| Metric | Source | Why |
|--------|--------|-----|
| Website sessions | GA4 | Is traffic growing? |
| Add to carts | GA4 / Meta Pixel | Are people interested? |
| Orders & revenue | Admin Dashboard | Are we making money? |
| Ad spend | Meta/Google Ads | Are we on budget? |
| ROAS | Meta/Google Ads | Is spend profitable? |

### Weekly Metrics (Deep Review)

| Metric | Source | Why |
|--------|--------|-----|
| Top traffic sources | GA4 | Where are buyers coming from? |
| Best-selling products | Admin Dashboard | What to promote more? |
| Cart abandonment rate | GA4 Funnel | Where do people drop off? |
| Influencer performance | UTM tracking | Who drives the most sales? |
| Email open/click rates | Newsletter tool | Is email marketing working? |
| Customer acquisition cost | Meta + Google Ads | Are we acquiring profitably? |

### Monthly Metrics (Strategic)

| Metric | Source | Target |
|--------|--------|--------|
| Total Revenue | Admin | Growth MoM |
| AOV (Average Order Value) | Admin | ₹600-900 |
| Repeat purchase rate | Admin | > 15% |
| Customer lifetime value | Calculated | > ₹1,500 |
| Social media followers | Instagram | Growth MoM |
| Review/rating average | Site | > 4.5 stars |

### Recommended Reporting Frequency

| Recipient | Frequency | What to include |
|-----------|-----------|-----------------|
| Founder (you) | Daily dashboard | Revenue, orders, spend, ROAS |
| Marketing team | Weekly | Full metrics + insights + action items |
| Agency | Bi-weekly | Campaign performance, creative review, budget adjustment |
| Full review | Monthly | P&L, channel performance, strategy adjustments |

---

## 7. Access Checklist for Agency/Marketing Partner

Give your agency/marketing partner access to these:

### ✅ Must Have (Day 1)

| Tool | What to share | How to add them |
|------|--------------|-----------------|
| **Meta Business Manager** | Add as Admin | Business Settings → People → Add → Admin role |
| **Facebook Page** | Admin access | Page Settings → Page Roles → Add Admin |
| **Instagram Account** | Admin via Meta Business | Business Settings → Instagram Accounts → Add |
| **Meta Ad Account** | Advertiser access | Business Settings → Ad Accounts → Add People |
| **Meta Pixel ID** | Share the Pixel ID number | Events Manager → Settings → Copy Pixel ID |
| **GA4 Property** | Editor access | GA4 Admin → Property Access → Add user with Editor role |
| **Google Ads Account** | Standard access | Google Ads → Admin → Access → Invite |

### ✅ Need to Decide

| Decision | Options | Recommendation |
|----------|---------|---------------|
| Conversions API? | Yes (server-side) or No (browser only) | **Yes** — implement CAPI for purchases |
| Target CPA | ₹150 / ₹300 / ₹500 per order | Start at **₹300**, optimize down |
| Expected ROAS | 3x / 5x / 8x | Target **4x** minimum |
| Total monthly ad budget | ₹15K / ₹30K / ₹50K+ | Start **₹30K/month** |
| Daily testing budget | ₹500 / ₹1000 | **₹800-1000/day** for testing |
| Reporting frequency | Daily / Weekly | **Daily** snapshot + **Weekly** deep dive |

### ✅ Influencer Specifics to Share

| Item | Description |
|------|-------------|
| Influencer list | Names, handles, follower count, content type |
| Posting schedule | When each influencer posts (date + time) |
| UTM links | Unique link per influencer (you create these) |
| Content guidelines | Brand voice, do's and don'ts, hashtags |
| Coupon codes | Unique per influencer for tracking (e.g., `PRIYA10`) |

---

## 8. Implementation Status in ORA Project

### What's Already Built ✅

| Feature | Status | Location |
|---------|--------|----------|
| Order confirmation email (with tracking) | ✅ Done | Backend: email.service.ts |
| Admin dashboard (revenue, orders, AOV) | ✅ Done | /admin/v2/dashboard |
| Product analytics | ✅ Done | /admin/v2 |
| Cart abandonment tracking | ✅ Done | Backend: analytics.service.ts |
| Customer data collection | ✅ Done | Backend: Prisma/PostgreSQL |
| Newsletter subscription | ✅ Done | Frontend + Backend: /api/contact/subscribe |
| UTM parameter support | ✅ Ready | URLs work with UTM params automatically |

### What Needs to Be Added 🔧

| Feature | Priority | What's needed |
|---------|----------|---------------|
| **Meta Pixel (Browser)** | 🔴 Critical | Pixel ID → Add script to `_document` or layout |
| **Meta Conversions API** | 🔴 Critical | Server-side Purchase event from order controller |
| **GA4 Tracking** | 🔴 Critical | Measurement ID → Add gtag.js to layout |
| **GA4 E-commerce Events** | 🟡 High | Fire view_item, add_to_cart, purchase events |
| **Google Ads Conversion** | 🟡 High | Conversion ID + Label → Fire on purchase |
| **Facebook Login (Social Login)** | 🟢 Nice to have | OAuth integration |
| **Coupon tracking per influencer** | 🟡 High | Already have coupon system, just assign unique codes |
| **Email marketing (Klaviyo/Mailchimp)** | 🟡 High | Currently basic newsletter, upgrade to full flows |

### What You Need to Provide to Your Developer

Once you have these IDs from your marketing setup:

```
META_PIXEL_ID=123456789012345
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXX
GOOGLE_ADS_CONVERSION_LABEL=xxxxxxxx
META_CAPI_ACCESS_TOKEN=EAAxxxxxx (for Conversions API)
```

Your developer will add these to the `.env` file and implement the tracking code.

---

## 🚀 Quick Start Action Plan

### Week 1: Foundation
1. ☐ Create Meta Business Manager account
2. ☐ Create Meta Pixel → share ID with developer
3. ☐ Set up GA4 → share Measurement ID with developer
4. ☐ Developer implements Pixel + GA4 + CAPI
5. ☐ Verify events are firing (use Meta Pixel Helper Chrome extension)

### Week 2: Ads Setup
1. ☐ Create Meta Ad Account
2. ☐ Create Google Ads account
3. ☐ Set up conversion tracking in both platforms
4. ☐ Create first test campaign (₹500/day)
5. ☐ Set up retargeting audiences

### Week 3: Optimization
1. ☐ Review first week data
2. ☐ Kill underperforming ads
3. ☐ Scale winning creatives
4. ☐ Launch influencer partnerships with UTM links
5. ☐ Set up weekly reporting cadence

---

*This document is your complete guide to marketing tracking for ORA. Share it with any agency or marketing partner so they know exactly what's available and what they need.*
