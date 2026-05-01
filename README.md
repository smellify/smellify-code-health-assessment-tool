<p align="center">
  <img src="https://img.shields.io/badge/MERN-Stack-brightgreen?style=for-the-badge&logo=mongodb&logoColor=white" alt="MERN Stack" />
  <img src="https://img.shields.io/badge/AI%20Powered-Gemini%202.5-blue?style=for-the-badge&logo=google&logoColor=white" alt="AI Powered" />
  <img src="https://img.shields.io/badge/Static%20Analysis-AST%20Based-orange?style=for-the-badge&logo=javascript&logoColor=white" alt="Static Analysis" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
</p>

<h1 align="center">🧪 Smellify</h1>

<h3 align="center">
  <em>GitHub-Integrated, AI-Driven Code Health Assessment Tool for MERN Stack Using Static & LLM Analysis</em>
</h3>

<p align="center">
  <strong>Final Year Project (FYP)</strong><br/>
  A full-stack SaaS platform that automatically detects code smells, architectural anti-patterns, and quality issues in MERN (MongoDB, Express, React, Node.js) projects — powered by AST-based static analysis and Google Gemini AI.
</p>

---

## 📋 Table of Contents

- [What is Smellify?](#-what-is-smellify)
- [What are Code Smells?](#-what-are-code-smells)
- [Why Smellify Matters](#-why-smellify-matters)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Code Smell Detection Engines](#-code-smell-detection-engines)
- [How It Works](#-how-it-works)
- [Project Structure](#-project-structure)
- [Database Design](#-database-design)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Screenshots & UI](#-screenshots--ui)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧠 What is Smellify?

**Smellify** is a web-based SaaS (Software as a Service) platform built as a Final Year Project. It helps developers write cleaner, more maintainable code by automatically scanning their MERN stack projects and identifying **code smells** — patterns in source code that indicate deeper problems.

Think of Smellify as a **doctor for your code**. Just like a doctor examines you and finds health issues you didn't know about, Smellify examines your source code and finds hidden problems that could cause bugs, slow performance, or make the code hard to maintain in the future.

### 🎯 In Simple Terms

> You upload your MERN project (via ZIP or GitHub), Smellify scans every file using advanced techniques (AST parsing + AI), and shows you a detailed report of what's wrong, how bad it is, and exactly how to fix it.

---

## 🐛 What are Code Smells?

**Code smells** are NOT bugs — your code might work perfectly fine. But code smells are **warning signs** that something in the code's design or structure could lead to problems later. They are like early symptoms of a disease: _your body works, but something isn't right._

### Real-World Analogy

| Code Smell | Real-World Analogy |
|---|---|
| **Code Duplication** | Writing the same essay twice in different notebooks — if you need to update, you have to change it in BOTH places |
| **Prop Drilling** | Passing a message through 5 people to reach someone who's sitting 3 rooms away — why not just call them directly? |
| **Bad React Hooks** | Using the wrong kitchen tool for a job — it might work, but it's inefficient and messy |
| **Deeply Nested Routes** | A recipe with 10 sub-steps inside sub-steps inside sub-steps — impossible to follow |
| **Unoptimized DB Queries** | Asking a librarian to bring you ALL 10,000 books when you only need 3 specific ones |

### Types of Code Smells Smellify Detects

Smellify can detect **8+ categories** of code smells across both frontend and backend:

| # | Category | Description | Example |
|---|---|---|---|
| 1 | 🔁 **Code Duplication** | Same or similar code blocks repeated in multiple files | Two functions with identical logic in different files |
| 2 | ⚛️ **React Hooks Violations** | Improper usage of React Hooks (useState, useEffect, etc.) | Calling `useEffect` inside a condition or loop |
| 3 | 📥 **Prop Drilling** | Props passed through 3+ component levels unnecessarily | Parent → Child → GrandChild → GreatGrandChild just to pass a user name |
| 4 | 🔗 **Deep Nesting in Routes** | Express route handlers with excessive nesting depth | A route handler with 5+ levels of if/else/try/catch nesting |
| 5 | 🐢 **Unoptimized Mongoose Queries** | Database queries fetching entire documents without field selection | `User.findById(id)` instead of `User.findById(id).select('name email')` |
| 6 | 🔄 **Redundant Database Queries** | Same database query executed multiple times in one function | Calling `User.findById(id)` three times in the same route handler |
| 7 | ⚡ **Excessive Async Operations** | Too many `await` calls in a single route handler | A single API endpoint with 8+ sequential database operations |
| 8 | 🤖 **LLM-Detected Smells** | AI-detected issues including security, performance & architecture problems | Hardcoded secrets, N+1 queries, god components, memory leaks |

---

## 💡 Why Smellify Matters

| Problem | How Smellify Helps |
|---|---|
| 👶 Junior developers don't know best practices | Automatically teaches them through detailed suggestions |
| 📝 Code reviews are time-consuming | Automates the detection of common issues before review |
| 🐞 Hidden bugs accumulate over time | Catches potential issues before they become actual bugs |
| 🏗️ Architecture degrades as projects grow | Identifies structural problems like prop drilling and tight coupling |
| 🎓 Students building FYPs lack code quality tools | Provides a free, easy-to-use tool specifically for MERN stack |

---

## ✨ Key Features

### 🔍 Dual Analysis Engine
- **Static Analysis (AST-Based)**: Uses Babel parser to build Abstract Syntax Trees and traverses them to find code patterns that indicate smells. No AI needed — pure algorithmic detection.
- **LLM Analysis (AI-Based)**: Sends code to Google Gemini 2.5 Flash AI model for intelligent, context-aware analysis that catches issues static analysis might miss.

### 🔐 Complete Authentication System
- Email/Password registration with email verification (OTP)
- **GitHub OAuth 2.0** login — connect your GitHub account directly
- **Two-Factor Authentication (2FA)** with QR code & authenticator apps
- Session-based authentication with JWT tokens
- Secure password reset via email
- Account linking (GitHub + Email)

### 📁 Flexible Project Upload
- **ZIP Upload**: Drag & drop or browse to upload your project as a ZIP file
- **GitHub Import**: Connect your GitHub account and select any repository to import directly
- Automatic project type detection (Full-Stack MERN, Frontend React, Backend Node, etc.)

### 📊 Rich Analysis Dashboard
- **Code Health Score**: Overall health rating of your project
- **Severity Classification**: Issues ranked as Critical, High, Medium, or Low
- **File-by-file Breakdown**: See which files have the most problems
- **Interactive Charts**: Visual representation of smell distribution
- **Comparison Panel**: Compare static analysis vs LLM analysis side-by-side

### 🤖 AI-Powered Fix Suggestions
- Powered by **Google Gemini 2.5 Flash**
- Provides actionable, specific suggestions for each detected smell
- Estimates the impact of fixing each issue
- Prioritizes fixes by severity

### 💳 Billing & Subscription System
- **Stripe Integration** for secure payments
- Credit-based system (Starter & Premium packages)
- Transaction history and billing management
- Pay-per-scan model

### 👥 Referral System
- Generate unique referral codes
- Earn bonus scan credits when referred users complete onboarding
- Track referral statistics and rewards

### 🔔 Real-Time Notifications
- **Socket.io** powered real-time notification system
- Bell icon with unread count badge
- Dashboard notifications for analysis completion, security alerts, and more

### 🛡️ Admin Panel
- Complete user management (view, block, unblock, delete users)
- Platform-wide analytics and statistics
- Monitor analysis usage across all users
- Admin-only routes with role-based access

### 🌙 Additional Features
- Dark/Light theme support
- User onboarding flow
- Profile management & settings
- Session management (view and revoke active sessions)
- Responsive, mobile-friendly design

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React.js)                      │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐│
│  │  Pages   │ │Components│ │ Context │ │ Services │ │  Router  ││
│  │(19 pages)│ │(11 comps)│ │(Theme,  │ │ (Axios   │ │(Role-   ││
│  │Dashboard,│ │Navbar,   │ │ User)   │ │  API)    │ │ based)  ││
│  │Analysis, │ │Footer,   │ │         │ │          │ │         ││
│  │Admin,etc │ │2FA,Pay.. │ │         │ │          │ │         ││
│  └────┬─────┘ └────┬─────┘ └────┬────┘ └────┬─────┘ └────┬────┘│
│       │            │            │           │            │      │
│       └────────────┴────────────┴───────────┴────────────┘      │
│                              │ HTTP/WebSocket                    │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      API Routes (14 route files)              │ │
│  │  auth · users · projects · analysis · llmAnalysis · admin    │ │
│  │  billing · github · 2FA · notifications · referral · AI      │ │
│  └──────────────────────┬───────────────────────────────────────┘ │
│                         │                                          │
│  ┌──────────────────────▼───────────────────────────────────────┐ │
│  │                    ANALYSIS ENGINES                           │ │
│  │                                                               │ │
│  │  ┌─────────────── STATIC ANALYSIS ──────────────────┐        │ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │        │ │
│  │  │  │ Hooks    │  │  Code    │  │   Prop       │   │        │ │
│  │  │  │ Detector │  │Duplication│  │  Drilling    │   │        │ │
│  │  │  │          │  │ Analyzer │  │  Detector    │   │        │ │
│  │  │  └──────────┘  └──────────┘  └──────────────┘   │        │ │
│  │  │  ┌──────────────────────────────────────────┐   │        │ │
│  │  │  │        Code Quality Analyzer             │   │        │ │
│  │  │  │  (Routes · Mongoose · Redundant Queries) │   │        │ │
│  │  │  └──────────────────────────────────────────┘   │        │ │
│  │  └──────────────────────────────────────────────────┘        │ │
│  │                                                               │ │
│  │  ┌─────────────── LLM ANALYSIS (AI) ───────────────┐        │ │
│  │  │  ┌──────────────────────────────────────────┐   │        │ │
│  │  │  │         Unified LLM Analyzer             │   │        │ │
│  │  │  │  (Gemini 2.5 Flash · Single API Call)    │   │        │ │
│  │  │  │  Detects: Hooks, Middleware, Prop        │   │        │ │
│  │  │  │  Drilling, Code Duplication              │   │        │ │
│  │  │  └──────────────────────────────────────────┘   │        │ │
│  │  └──────────────────────────────────────────────────┘        │ │
│  │                                                               │ │
│  │  ┌─────────── SHARED SERVICES ──────────────────────┐        │ │
│  │  │  AST Provider (Parse Once, Use Everywhere)       │        │ │
│  │  │  AI Suggestion Service (Gemini-powered fixes)    │        │ │
│  │  └──────────────────────────────────────────────────┘        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                         │                                          │
│  ┌──────────────────────▼───────────────────────────────────────┐ │
│  │                 MIDDLEWARE & UTILITIES                         │ │
│  │  JWT Auth · Session Mgmt · GitHub Clone · Email Service       │ │
│  │  Multer (File Upload) · Stripe (Payments) · Socket.io        │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    DATABASE (MongoDB Atlas)                        │
│                                                                    │
│  ┌────────┐ ┌────────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐ │
│  │  User  │ │ Repository │ │ Session │ │Billing │ │ Referral │ │
│  │ Model  │ │  (Project) │ │  Model  │ │ Model  │ │  Model   │ │
│  └────────┘ └────────────┘ └─────────┘ └────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────┐            │
│  │ GitHub   │ │ Notification │ │ Deleted Accounts │            │
│  │ Auth     │ │    Model     │ │     Model        │            │
│  └──────────┘ └──────────────┘ └──────────────────┘            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI library for building the single-page application |
| **React Router v7** | Client-side routing with role-based protected routes |
| **Tailwind CSS 3** | Utility-first CSS framework for responsive styling |
| **Axios** | HTTP client for API communication |
| **Lucide React** | Beautiful, consistent icon library |
| **Socket.io Client** | Real-time notifications via WebSocket |
| **Stripe React** | Secure payment integration on frontend |

### Backend

| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime for server-side logic |
| **Express 5** | Web framework for building RESTful APIs |
| **MongoDB + Mongoose** | NoSQL database with elegant ODM modeling |
| **Babel Parser** | Parses JavaScript/TypeScript/JSX/TSX into AST for analysis |
| **Babel Traverse** | Walks the AST to detect code smell patterns |
| **Google Generative AI (Gemini 2.5 Flash)** | LLM for intelligent code analysis |
| **LangChain** | Framework for LLM orchestration |
| **JWT (jsonwebtoken)** | Secure token-based authentication |
| **Passport.js + GitHub Strategy** | OAuth 2.0 integration with GitHub |
| **Stripe** | Payment processing for subscription plans |
| **Nodemailer** | Email service for verification, OTP, and notifications |
| **Socket.io** | Real-time bidirectional communication |
| **Multer** | File upload handling (ZIP projects) |
| **ADM-ZIP** | Programmatic ZIP file extraction |
| **Speakeasy + QRCode** | Two-factor authentication (TOTP) |
| **bcryptjs** | Password hashing |
| **Zod** | Schema validation |
| **UA-Parser-JS** | User agent parsing for session tracking |

---

## 🔬 Code Smell Detection Engines

Smellify uses **two powerful engines** working together:

### Engine 1: Static Analysis (AST-Based)

This engine uses **Abstract Syntax Tree (AST)** parsing — a technique where source code is converted into a tree structure that represents the code's grammar. This tree is then traversed (walked through) to find patterns that indicate code smells.

#### How AST Parsing Works (Simple Explanation)

```
Your Code:                         AST (Tree Representation):
                                   
function greet(name) {             FunctionDeclaration
  return "Hello " + name;            ├── Identifier: "greet"
}                                     ├── Params: [Identifier: "name"]
                                      └── ReturnStatement
                                           └── BinaryExpression (+)
                                                ├── StringLiteral: "Hello "
                                                └── Identifier: "name"
```

By analyzing this tree structure, Smellify can detect:

| Analyzer | What It Does | How It Works |
|---|---|---|
| **Hooks Detector** | Finds React hooks misuse | Checks if `useState`, `useEffect`, etc. are called inside conditions, loops, or nested functions |
| **Duplication Analyzer** | Finds copy-pasted code | Canonicalizes AST nodes (normalizes variable names and literals), hashes them, and compares hashes. Uses SHA-256 for exact matches and Jaccard similarity for near-duplicates (≥80% threshold) |
| **Prop Drilling Detector** | Finds deeply passed props | Maps component hierarchy, traces each prop's path from source to destination, flags props passing through 3+ levels |
| **Code Quality Analyzer** | Finds backend quality issues | Detects deeply nested route handlers (>2 levels), unoptimized Mongoose queries (missing `.select()`), redundant database calls, and excessive async operations (>4 per handler) |

### Engine 2: LLM Analysis (AI-Based)

This engine sends your actual source code to **Google Gemini 2.5 Flash** — one of the most advanced AI models — for intelligent analysis.

#### Key Design Decisions

- **Single API Call**: All files are analyzed in ONE API call (Gemini supports ~4 million characters per request), making it compatible with free-tier API limits
- **File Prioritization**: Files are scored and ranked by importance (routes, auth, controllers get highest priority)
- **Shared AST Cache**: Parse each file once and share the result between both analysis engines for efficiency
- **Truncated JSON Recovery**: If Gemini's response is cut off, a recovery algorithm extracts valid findings from incomplete JSON

#### What the AI Analyzes

| Category | Specific Issues Detected |
|---|---|
| **React Hooks** | Missing dependencies in useEffect, hooks inside conditions/loops, missing cleanup functions |
| **Express Middleware** | Callback hell, missing error handling, missing `next()` calls, incorrect middleware ordering |
| **Prop Drilling** | Props passed through 3+ levels, components receiving unused props |
| **Code Duplication** | Similar logic across files, copy-pasted functions with minor differences |

---

## ⚙️ How It Works

### For End Users (Step-by-Step)

```
 Step 1: SIGN UP                    Step 2: UPLOAD                    Step 3: ANALYZE
 ┌──────────────┐                   ┌──────────────┐                  ┌──────────────┐
 │  Create your │                   │ Upload ZIP   │                  │  Static +    │
 │  account via │         →         │   — OR —     │        →         │  AI analysis │
 │  email or    │                   │ Import from  │                  │  runs auto-  │
 │  GitHub OAuth│                   │ GitHub repo  │                  │  matically   │
 └──────────────┘                   └──────────────┘                  └──────────────┘
                                                                             │
                                                                             ▼
 Step 6: IMPROVE                    Step 5: FIX                       Step 4: REPORT
 ┌──────────────┐                   ┌──────────────┐                  ┌──────────────┐
 │ Re-scan to   │                   │ Follow AI    │                  │ View detailed│
 │ verify your  │         ←         │ suggestions  │        ←         │ report with  │
 │ code health  │                   │ to fix each  │                  │ severity,    │
 │ improved     │                   │ issue        │                  │ file, line # │
 └──────────────┘                   └──────────────┘                  └──────────────┘
```

### Under The Hood (Technical Flow)

1. **Upload/Import** → ZIP is extracted OR GitHub repo is cloned to server
2. **File Discovery** → Recursively finds all `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs` files (skips `node_modules`, `.git`, `dist`)
3. **AST Parsing** → Babel parser converts each file to an Abstract Syntax Tree with caching
4. **Static Analysis** → Four specialized analyzers traverse each AST:
   - React Hooks Detector → Checks hook placement and dependency arrays
   - Code Duplication Analyzer → Canonicalizes + hashes code units, finds exact & near clones
   - Prop Drilling Detector → Maps component hierarchy and traces prop chains
   - Code Quality Analyzer → Analyzes route handlers, Mongoose queries, and async patterns
5. **LLM Analysis** → All files are bundled and sent to Gemini 2.5 Flash in one API call
6. **AI Suggestions** → Combined results are sent to Gemini for actionable fix recommendations
7. **Report Generation** → Results are stored in MongoDB and presented on the dashboard

---

## 📂 Project Structure

```
smellify/
├── backend/                          # Node.js + Express Server
│   ├── server.js                     # App entry point — configures Express, MongoDB, routes
│   ├── package.json                  # Backend dependencies
│   ├── .env                          # Environment variables (API keys, DB URI, secrets)
│   │
│   ├── middleware/
│   │   └── auth.js                   # JWT + Session-based authentication middleware
│   │
│   ├── models/                       # Mongoose schemas (database models)
│   │   ├── User.js                   # User schema (auth, profile, settings, GitHub link)
│   │   ├── repository.js             # Project schema (analysis results, all smell data)
│   │   ├── Session.js                # Active session tracking for security
│   │   ├── billing.js                # Billing & transaction history (Stripe)
│   │   ├── Referral.js               # Referral code tracking & rewards
│   │   ├── Notification.js           # User notification records
│   │   ├── GitHubAuth.js             # GitHub OAuth connection data
│   │   ├── UserProfile.js            # Extended user profile information
│   │   ├── DeletedAccounts.js        # Soft-deleted account records
│   │   └── twoFA.js                  # Two-factor authentication secrets
│   │
│   ├── routes/                       # API endpoint definitions (14 route files)
│   │   ├── auth.js                   # Login, register, verify email, reset password
│   │   ├── users.js                  # User profile CRUD operations
│   │   ├── projects.js               # Project upload, import, manage, analyze (largest file)
│   │   ├── analysis.js               # Static analysis trigger & results retrieval
│   │   ├── llmAnalysis.js            # LLM-based AI analysis trigger & results
│   │   ├── aisuggestions.js          # AI-generated fix suggestions
│   │   ├── githubAuth.js             # GitHub OAuth flow (link/unlink accounts)
│   │   ├── admin.js                  # Admin panel operations
│   │   ├── billing.js                # Stripe payments, credit purchases
│   │   ├── twoFA.js                  # 2FA setup, verify, disable
│   │   ├── notification.js           # Notification management
│   │   ├── referral.js               # Referral code generation & tracking
│   │   ├── profile.js                # Profile completion & updates
│   │   └── authService.js            # Auth helper utilities
│   │
│   ├── services/                     # Core business logic
│   │   ├── aiSuggestionService.js    # Gemini-powered fix suggestions generator
│   │   ├── referralService.js        # Referral system business logic
│   │   │
│   │   ├── shared/                   # Shared utilities across analyzers
│   │   │   └── astProvider.js        # Unified AST parsing + caching module
│   │   │
│   │   ├── smells/                   # Static analysis detectors
│   │   │   ├── codeQualityAnalysis.js   # Route nesting, Mongoose queries, redundant DB calls
│   │   │   ├── duplication.js           # Exact & near-clone detection via AST canonicalization
│   │   │   ├── hooks/                   # React Hooks violation detector
│   │   │   │   ├── index.js             # Main analyzer orchestrator
│   │   │   │   ├── core/                # Core analysis infrastructure
│   │   │   │   └── hooks/               # Hook-specific detection rules
│   │   │   └── propDrilling/            # Prop drilling detector
│   │   │       ├── astParser.js         # Component & prop extraction from AST
│   │   │       ├── componentMapper.js   # Component hierarchy mapping
│   │   │       ├── chainBuilder.js      # Prop chain construction
│   │   │       ├── drillingDetector.js  # Drilling depth analysis & severity scoring
│   │   │       └── propDrillingController.js  # Orchestrates the full detection pipeline
│   │   │
│   │   └── llmSmells/               # AI-based analysis module
│   │       ├── index.js              # Entry point — initializes LLM analysis
│   │       ├── config.js             # LLM model config, agent definitions, severity levels
│   │       └── unifiedAnalyzer.js    # Core analyzer — builds prompt, calls Gemini, parses results
│   │
│   ├── utils/                       # Utility functions
│   │   ├── githubCloneService.js    # Clones GitHub repos to server for analysis
│   │   ├── githubUtils.js           # GitHub API communication helpers
│   │   ├── sendEmail.js             # Email templates (verification, OTP, alerts)
│   │   └── sendWelcomeEmail.js      # Onboarding welcome email template
│   │
│   └── uploads/                     # Uploaded ZIP files (temporary storage)
│
├── frontend/                        # React.js Single Page Application
│   ├── package.json                 # Frontend dependencies
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   │
│   ├── public/                      # Static assets
│   │
│   └── src/
│       ├── App.js                   # Main app — routing, layout, role-based protection
│       ├── App.css                  # Global styles
│       ├── index.js                 # React DOM entry point
│       ├── index.css                # Base CSS styles
│       │
│       ├── components/              # Reusable UI components
│       │   ├── Navbar.js            # Top navigation bar
│       │   ├── Footer.js            # Site footer
│       │   ├── NotificationBell.js  # Real-time notification bell icon
│       │   ├── NotificationPopup.js # Notification dropdown with provider context
│       │   ├── ComparisonPanel.js   # Side-by-side static vs LLM comparison
│       │   ├── LLMAnalysisPanel.js  # AI analysis results display
│       │   ├── Paymentmodal.js      # Stripe payment modal with card input
│       │   ├── SessionManagement.js # Active session viewer & revoke
│       │   ├── TwoFactorAuth.js     # 2FA setup/manage component
│       │   ├── UserOnboarding.js    # New user onboarding wizard
│       │   └── aisuggestions.js     # AI suggestion cards display
│       │
│       ├── pages/                   # Full page Components (19 pages)
│       │   ├── home.js              # Landing page with hero section & features
│       │   ├── Login.js             # Login with email/password & GitHub OAuth
│       │   ├── Signup.js            # Registration with email verification
│       │   ├── dashboard.js         # Main user dashboard
│       │   ├── projects.js          # Project listing & management
│       │   ├── analysis.js          # Detailed analysis results page
│       │   ├── admin.js             # Admin dashboard & user management
│       │   ├── settings.js          # User settings & preferences
│       │   ├── billing.js           # Billing history & credit purchase
│       │   ├── plans.js             # Pricing plans display
│       │   ├── referral.js          # Referral program page
│       │   ├── faq.js               # Frequently asked questions
│       │   ├── forgot-password.js   # Password recovery flow
│       │   ├── profilecomplete.js   # Profile completion form
│       │   ├── Onboarding.js        # User onboarding flow
│       │   ├── OAuthSuccess.js      # OAuth callback handler
│       │   ├── OAuth2FA.js          # 2FA verification during OAuth login
│       │   ├── project.js           # Individual project detail view
│       │   └── error404page.js      # 404 Not Found page
│       │
│       ├── context/                 # React Context providers
│       │   ├── ThemeContext.js       # Dark/Light theme state
│       │   └── UserContext.js        # Global user state management
│       │
│       └── services/
│           └── api.js               # Axios instance with base URL & auth interceptor
│
└── README.md                        # This file
```

---

## 🗄️ Database Design

Smellify uses **MongoDB Atlas** (cloud-hosted MongoDB) with **Mongoose ODM**. Here are the main collections:

### User Model
Stores user authentication, profile, and settings data including:
- Authentication credentials (email, hashed password)
- GitHub OAuth linking (current + history of all linked GitHub accounts)
- Verification & password reset tokens
- Notification preferences
- Scan credits balance
- 2FA configuration

### Repository (Project) Model
The most comprehensive model — stores everything about an uploaded project:
- **Project metadata** (name, source, type, upload path)
- **Duplication analysis results** (exact clones, near clones, statistics)
- **Hooks analysis results** (violations sorted by severity)
- **Prop drilling analysis** (chains, depths, affected components)
- **Code quality analysis** (route issues, query issues, redundant queries)
- **LLM analysis report** (AI findings with severity, category, file, line)
- **AI suggestions** (actionable fixes grouped by category)

### Other Models
| Model | Purpose |
|---|---|
| **Session** | Tracks active login sessions for security |
| **Billing** | Transaction history, credit balance, Stripe records |
| **Referral** | Referral codes, referred users, reward tracking |
| **Notification** | User notification storage |
| **GitHubAuth** | OAuth connection data |
| **TwoFA** | TOTP secrets for 2FA |
| **DeletedAccounts** | Soft-deleted account records |

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user with email verification |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/verify-email` | Verify email with OTP code |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### GitHub OAuth
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/github/auth` | Initiate GitHub OAuth flow |
| GET | `/api/github/callback` | GitHub OAuth callback |
| POST | `/api/github/link` | Link GitHub to existing account |
| POST | `/api/github/unlink` | Unlink GitHub from account |
| GET | `/api/github/repos` | List user's GitHub repositories |

### Projects & Analysis
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/projects/upload` | Upload project via ZIP |
| POST | `/api/projects/import-github` | Import project from GitHub |
| GET | `/api/projects` | List all user projects |
| GET | `/api/projects/:id` | Get project details & analysis |
| POST | `/api/analysis/:id/run` | Trigger static analysis |
| POST | `/api/llm-analysis/:id/run` | Trigger LLM analysis |
| GET | `/api/ai/suggestions/:id` | Get AI fix suggestions |

### User Management
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/profile` | Get current user profile |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/settings` | Update user settings |
| DELETE | `/api/users/account` | Delete account |

### Billing & Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/billing/create-payment-intent` | Create Stripe payment |
| GET | `/api/billing/history` | Get transaction history |
| GET | `/api/billing/credits` | Get current credit balance |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/stats` | Platform statistics |
| PUT | `/api/admin/users/:id/block` | Block/unblock user |
| DELETE | `/api/admin/users/:id` | Delete user |

---

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have the following installed on your computer:

| Software | Version | Download Link |
|---|---|---|
| **Node.js** | v18 or higher | [nodejs.org](https://nodejs.org/) |
| **npm** | v9 or higher | Comes with Node.js |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |
| **MongoDB Atlas Account** | Free tier | [mongodb.com/atlas](https://www.mongodb.com/atlas) |

### Installation

**1. Clone the Repository**
```bash
git clone https://github.com/your-username/Smellify-Code-health-Assessment-Tool.git
cd Smellify-Code-health-Assessment-Tool/smellify
```

**2. Install Backend Dependencies**
```bash
cd backend
npm install
```

**3. Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

**4. Configure Environment Variables**

Create a `.env` file in the `backend/` directory with the required variables (see [Environment Variables](#-environment-variables) section below).

**5. Start the Backend Server**
```bash
cd backend
npm start
```
The backend will start on `http://localhost:5000`

**6. Start the Frontend Development Server**
```bash
cd frontend
npm start
```
The frontend will start on `http://localhost:3000`

**7. Open in Browser**

Navigate to `http://localhost:3000` to use Smellify!

---

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=5000

# MongoDB Connection (get from MongoDB Atlas)
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# JWT Secret (use a long random string)
JWT_SECRET=your_secure_random_secret_key

# Email Service (Gmail App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# GitHub OAuth (get from GitHub Developer Settings)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google Gemini API Key (get from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key

# Stripe (Payment Processing)
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### How to Get These Keys

| Variable | Where to Get It |
|---|---|
| `MONGO_URI` | [MongoDB Atlas](https://mongodb.com/atlas) → Create Cluster → Connect → Copy URI |
| `GITHUB_CLIENT_ID/SECRET` | [GitHub Developer Settings](https://github.com/settings/developers) → OAuth Apps → New |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) → Create API Key |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) → Developers → API Keys |
| `EMAIL_PASS` | Gmail → Account Settings → Security → App Passwords → Generate |

---

## 🖼️ Screenshots & UI

### Landing Page
Smellify features a modern, clean landing page with:
- Hero section introducing the platform
- Key features showcase (Code Smell Detection, Real-time Alerts, Comprehensive Reports)
- How it works (3-step process: Upload → Analysis → Reports)
- Call-to-action for registration

### User Dashboard
- Project listing with analysis status indicators
- Quick stats cards showing total scans, credits, and project count
- Recent activity feed

### Analysis Results Page
- **Tab-based interface** for different smell categories
- Severity badges (Critical 🔴, High 🟠, Medium 🟡, Low 🟢)
- File path with clickable line numbers
- Expandable issue details with code evidence
- Side-by-side comparison of Static vs LLM analysis
- AI-powered fix suggestions panel

### Admin Panel
- User management table with search and filters
- Platform-wide analytics charts
- User blocking/deletion capabilities

---

## 🔮 Future Enhancements

| Enhancement | Description |
|---|---|
| 🔄 **CI/CD Integration** | GitHub Actions webhook to auto-analyze on every push |
| 📱 **Mobile App** | React Native companion app for on-the-go code reviews |
| 🌐 **Multi-Language Support** | Extend beyond MERN to Python (Django/Flask), Java (Spring), etc. |
| 📈 **Historical Trends** | Track code health score over time with charts |
| 👥 **Team Collaboration** | Shared workspaces, code review assignments, team analytics |
| 🔧 **Auto-Fix** | AI generates actual code patches, not just suggestions |
| 📊 **Complexity Metrics** | Cyclomatic complexity, cognitive complexity scoring |
| 🏆 **Gamification** | Code health leaderboards, achievement badges |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can contribute:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Write meaningful commit messages
- Test your changes thoroughly before submitting PR
- Update documentation for any new features

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Babel](https://babeljs.io/) — JavaScript compiler and AST parser
- [Google Gemini](https://ai.google.dev/) — AI model powering intelligent analysis
- [MongoDB Atlas](https://www.mongodb.com/atlas) — Cloud database service
- [Stripe](https://stripe.com/) — Payment processing platform
- [Socket.io](https://socket.io/) — Real-time communication library
- [Lucide](https://lucide.dev/) — Beautiful icon library

---

<p align="center">
  <strong>Built with ❤️ as a Final Year Project</strong><br/>
  <em>Smellify — Making MERN Code Healthier, One Scan at a Time</em>
</p>
