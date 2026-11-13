# Deployment Guide

## Environment Variables

This application requires the following environment variables to be set in your deployment environment (e.g., Vercel, Netlify, GitHub Pages, etc.).

| Variable Name | Description |
|---|---|
| `VITE_SUPABASE_URL` | The URL of your Supabase project. |
| `VITE_SUPABASE_ANON_KEY` | The anonymous public API key for your Supabase project. |

> [!IMPORTANT]
> The application will fail to start if these variables are missing.

## Platform Specific Instructions

### Netlify

1.  Go to your **Netlify Dashboard**.
2.  Select your site.
3.  Go to **Site configuration** > **Environment variables**.
4.  Click **Add a variable**.
5.  Add `VITE_SUPABASE_URL` with your Supabase URL.
6.  Add `VITE_SUPABASE_ANON_KEY` with your Supabase Anon Key.
7.  **Trigger a new deploy** (or clear cache and deploy) for the changes to take effect.

### Vercel

1.  Go to your **Vercel Dashboard**.
2.  Select your project.
3.  Go to **Settings** > **Environment Variables**.
4.  Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5.  Redeploy your application.

## Google Authentication Setup

To make Google Auth work with your Netlify deployment, you need to configure the Redirect URLs in Supabase.

1.  **Get your Netlify URL**:
    *   This will look like `https://your-site-name.netlify.app`.

2.  **Update Supabase Auth Settings**:
    *   Go to your [Supabase Dashboard](https://supabase.com/dashboard).
    *   Select your project.
    *   Go to **Authentication** > **URL Configuration**.
    *   Add your Netlify URL (e.g., `https://your-site-name.netlify.app`) to **Site URL**.
    *   Add `https://your-site-name.netlify.app/**` to **Redirect URLs**.

3.  **Google Cloud Console Configuration** (if not already done):
    *   Ensure your **Authorized redirect URIs** in Google Cloud Console includes your Supabase callback URL:
        *   `https://<your-project-ref>.supabase.co/auth/v1/callback`

> [!NOTE]
> If you are using a custom domain on Netlify, make sure to add that URL as well.

## How to find these values

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Go to **Settings** > **API**.
4. Copy the `Project URL` and `anon` `public` key.

## Local Development

For local development, create a `.env` file in the root directory with the following content:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
