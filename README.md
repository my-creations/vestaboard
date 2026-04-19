# Vestaboard

A minimal Vestaboard-style website in the `vestaboard/` folder.

## Current version

This version includes:
- a **6 rows × 22 columns** character grid
- a live **Lisbon clock** using `Europe/Lisbon`
- a black background with white letters
- animated split-flap style updates
- toggleable mechanical click sound
- GitHub Pages deployment workflow

## Project files

```text
vestaboard/
├── .github/workflows/deploy.yml
├── .gitignore
├── .nojekyll
├── index.html
├── styles.css
├── script.js
├── package.json
└── README.md
```

## Run locally

```bash
cd vestaboard
npm run dev
```

Then open:

```text
http://localhost:4173
```

## GitHub Pages deployment

This project is prepared to deploy as a **static GitHub Pages site** using **GitHub Actions**.

### 1. Create a GitHub repository

Create a new repository in your GitHub organization:

```text
my-creations/vestaboard
```

### 2. Initialize git locally

From the `vestaboard/` folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/my-creations/vestaboard.git
git push -u origin main
```

### 3. Enable GitHub Pages

On GitHub:
- open the repository
- go to **Settings** → **Pages**
- under **Build and deployment**, choose **GitHub Actions**

### 4. Deploy

After pushing to `main`, GitHub will run:

```text
.github/workflows/deploy.yml
```

When the workflow finishes, your site will be available at:

```text
https://my-creations.github.io/vestaboard/
```

## Notes

- Asset paths are relative, so the site works on GitHub Pages project URLs.
- `.nojekyll` is included so GitHub Pages serves the static files directly.
- Sound must still be enabled by user interaction because browsers block autoplay audio.
