<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1yG2LboAdFPmDJlR49Hp5GMr67jkauOpt

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages ✅

This repository is set up to deploy to GitHub Pages automatically using GitHub Actions. On pushes to the `main` branch the site is built and published using the official Pages actions.

Visit the site after the first deployment at:
`https://yanagi-jabee-28.github.io/Hello-World-Good-bye-Unit/`

If you rename the repository or want to change the base path, update the `base` option in `vite.config.ts` accordingly.
