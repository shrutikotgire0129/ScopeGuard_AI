# ScopeGuard AI

**Protect your work. Keep scope in check.**

ScopeGuard AI is an AI-powered scope analysis tool designed for freelancers. It compares a client’s new request against an existing project agreement, identifies potentially out-of-scope work, and helps freelancers communicate scope changes professionally.

## Live Demo

- **Primary Demo (Vercel):** https://scope-guard-ai-wine.vercel.app/
- **Render Deployment:** https://scopeguard-ai.onrender.com/

## Problem Statement

Freelancers often face scope creep when clients request additional features that were not included in the original agreement. Tracking these changes and communicating additional costs can be difficult.

ScopeGuard AI helps freelancers review requests, understand scope boundaries, and prepare clear responses before agreeing to extra work.

## Key Features

- **AI Scope Analysis:** Compare a project agreement with a client's new request.
- **Evidence-Based Results:** Show supporting agreement excerpts for scope decisions.
- **Three Scope Outcomes:** Included, potentially out of scope, or needs clarification.
- **Client Reply Generator:** Generate professional responses to clients.
- **Change-Order Generator:** Prepare change-order text and calculate proposed fees from estimated hours and hourly rates.
- **Cloud History:** Save and retrieve analyses for signed-in users.
- **Authentication:** Secure sign-in and user-specific history.
- **Demo Workflow:** Explore the application using sample scenarios.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Groq API with `openai/gpt-oss-20b`
- MongoDB Atlas
- Clerk Authentication
- Vercel and Render

## Getting Started

### Prerequisites

- Node.js and npm
- A Groq API key
- A MongoDB Atlas connection string
- Clerk application keys

### Installation

1. Clone the repository:

   `git clone https://github.com/shrutikotgire0129/ScopeGuard_AI.git`

2. Open the project directory:

   `cd ScopeGuard_AI`

3. Install dependencies:

   `npm install`

4. Create a `.env.local` file in the project root and configure the required environment variables. Use `.env.example` if provided; otherwise, refer to the variable names documented in the project setup instructions. Never commit secret values.

5. Start the development server:

   `npm run dev`

6. Open http://localhost:3000.

## Environment Variables

Configure the following variables in `.env.local`:

- `GROQ_API_KEY`
- `MONGODB_URI`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

## Security

Keep API keys, database credentials, and authentication secrets in environment variables. Never commit `.env.local` or expose secret values in source code.

## Challenge

Built for the DEV Hacktoberfest Week 2 2026 challenge.
