# CollegeGuide AI

A React and Vite prototype for exploring engineering colleges, comparing sample records, creating a local student profile, and saving colleges.

## Run locally

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Vite prints the local development URL. To verify a production build or lint the project:

```sh
npm run build
npm run lint
```

To serve the built app locally:

```sh
npm run preview
```

## Prototype limitations

- College records, fees, placements, ranks, and related metrics are sample or illustrative data, not verified current facts. Check with each institution before relying on any information.
- Some photos are linked to Wikimedia Commons; other images are illustrative. The app displays a local fallback when an image cannot load.
- Sign-up and login are frontend-only demo flows. Account records and profile changes stay in this browser's local storage; password values are salted and hashed in the browser, but this is **not production authentication or secure storage**. Do not enter sensitive information. Clearing this site's browser storage removes demo accounts and saved profile data.
- The assistant is a local search over the sample college list, not an AI service. Recommendations are simple preference filters; the app does not calculate admission eligibility, cutoffs, or admission probabilities.
- There is no backend, live college-data integration, or configured AI service.

Before using this as a real service, connect a trusted authentication provider and backend, replace the sample records with verified data and sources, and review the privacy and security model.
