# SmartShift Part‑Timer Certificate (A4 PDF Template)

This produces a clean, print‑friendly **A4** certificate PDF from JSON data.

## Quick start (VS Code)

1) Install Node.js 18+  
2) In this folder:

```bash
npm install
npm run build:pdf
```

This will generate:
- `output.html` (preview in browser)
- `output.pdf` (print‑ready)

## Put your SmartShift data

Edit `sample-data.json` or pass another JSON file:

```bash
node render.js my-data.json my-certificate.pdf
```

## Add logo / photo / QR

Use **data URIs** (base64). Example:

```json
"logoDataUri": "data:image/png;base64,iVBORw0K..."
```

## Notes
- All sizing is in **mm** so it matches printing.
- Footer is fixed at the bottom with the reference number.
