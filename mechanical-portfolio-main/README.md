# LinkUs

LinkUs is a Next.js prototype for international students reviewing a rental contract in Korea.

## Run locally

From `mechanical-portfolio-main` in the repository:

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Use `npm run typecheck` and `npm run build` to check changes. Run `npm start` to serve the production build locally.

## Demo walkthrough

1. Choose English, 中文, or 한국어 in the header or My page.
2. From Home or My contracts, choose a sample or select a PDF, JPG, or PNG up to 10 MB.
3. Start the demo and review the sample clauses, risk levels, explanations, and actions. Save the run and reopen it from My contracts.
4. Open the signing checklist and check off the items you have reviewed.
5. Create, edit, complete, reopen, or delete a reminder. The reminder setting controls the pending indicator in the navigation.
6. Edit your name and city in My page.

The app checks the selected file's size and format signature in the browser. The demo displays predefined clauses rather than analyzing the contents. It sends no files or device notifications. The browser stores language, checklist, saved run metadata (including filenames), reminders, and profile settings locally. To reset the demo, clear this site's browser data.

## Deployment configuration

The Git repository is `xzy666-xzy/linkus`. The repository-root `netlify.toml` sets the base directory to `mechanical-portfolio-main`, runs `npm run build`, and publishes `.next` from that directory with Node 22 and the Next.js adapter. The app-directory configuration also supports projects with their base directory already set to `mechanical-portfolio-main`. Use the same base directory in the Netlify dashboard and leave the package directory unset. For Vercel, set the root directory to `mechanical-portfolio-main`. The app requires no environment variables.

For a local Netlify Runtime preview, run `netlify serve --offline --context production` from `mechanical-portfolio-main`. The CLI preview expects the current directory to contain the Next.js build output.

The home route is `/`. The other views use URL fragments (for example `/#contracts`). Their corresponding plain paths (for example `/contracts`) redirect to these views. The older portfolio `index.html` is retained for reference.
