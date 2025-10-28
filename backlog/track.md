Nutrition for Allergies — Web App Spec (MVP → v1)
Vision (one line)

Take a photo of a Chilean product label → extract the Ingredients line in-browser → (later) match to allergy profiles and knowledge rules.

Tech Stack

Frontend: Next.js (App Router, React) for a SPA-like UX and easy routing/data fetching. 
nextjs.org
+1

OCR (in browser): Tesseract.js (WASM) with createWorker, loaded via CDN or ESM. 
GitHub

Image capture (mobile web): <input type="file" accept="image/*" capture="environment"> (or getUserMedia flow for live capture). 
developer.mozilla.org
+2
developer.mozilla.org
+2

Pre-processing (optional, client): OpenCV.js (adaptive threshold / binarization / deskew) for tough photos. 
docs.opencv.org

Backend (when needed ≥ MVP1): Supabase (Postgres + Auth + RLS policies). 
Supabase
+1

Future data sources: Open Food Facts (ingredients/allergens via API) and MapLibre GL JS for maps. 
Open Food Facts
+2
wiki.openfoodfacts.org
+2

MVP Roadmap (feature buckets)
MVP 0 — OCR only

Upload or capture a label photo (mobile/desktop).

Run on-device OCR with Tesseract.js.

Parse and display the Ingredients list (plain text & chips).

No backend, no login, no storage.

Success criteria

From a typical Chilean label, extract the “INGREDIENTES” block and split into items with ≥ one delimiter strategy (, ; parentheses).

In normal lighting and focus, ≥80% of trials show a non-empty ingredients list.

MVP 1 — Allergen dictionary (client-side)

Local (JSON) allergen → synonyms map (gluten, milk, egg, soy, peanuts, tree nuts, fish, crustaceans, sulfites).

Simple traffic light: green (none), yellow (“puede contener”/“trazas”), red (contains).

Optional: extra OCR pre-processing via OpenCV.js for hard images. 
docs.opencv.org

MVP 2 — Profiles (Supabase)

Auth (email/OTP) + user allergy profile (which allergens, strictness level).

Store past scans and results under RLS-protected tables. 
Supabase

MVP 3 — Aditives / E-numbers knowledge

Knowledge base for E-numbers (e.g., E322, E471): possible origins, whether end product is likely allergenic; categorise as precaution/uncertain vs likely safe. Source data via curated JSON + (optionally) Open Food Facts fields (allergens, traces). 
wiki.openfoodfacts.org
+1

MVP 4 — Organic/shops map

Map view of stores with organic/allergy-friendly products (community or curated list).

Render with MapLibre GL JS to keep costs down. 
maplibre.org

Repo Layout (Next.js App Router)
/app
  /scan        -> MVP 0 page (camera/upload + OCR results)
  /about
  layout.tsx
  globals.css
/lib
  ocr.ts       -> Tesseract worker bootstrap + helpers
  parse.ts     -> Extract "INGREDIENTES:" block + split rules
  preprocess.ts-> (optional) OpenCV.js ops
/data
  allergens.json   -> MVP1 dictionary (ES-CL synonyms)
/components
  ImagePicker.tsx  -> <input type=file> or getUserMedia capture
  OcrResult.tsx    -> list/chips + copy/share
  TrafficLight.tsx -> MVP1 visualization

Implementation Playbook — MVP 0 (no backend)
1) Capture UI (mobile-first)

Use <input type="file" accept="image/*" capture="environment"> for quick mobile capture; keep a “Pick from gallery” fallback. 
developer.mozilla.org
+1

Optionally offer a Camera tab using navigator.mediaDevices.getUserMedia() + canvas “Take photo” button. 
developer.mozilla.org
+1

Acceptance

On iOS/Android, tapping “Scan label” opens camera; photo appears in preview within ≤ 1.5s.

2) OCR (Tesseract.js)

Load Tesseract via CDN or ESM. Use Tesseract.createWorker({ logger }), set lang: 'spa+eng'. 
GitHub

Resize to max 2000px on the long edge before OCR to keep latency reasonable.

Show progress (0→100%) and a skeleton.

Acceptance

Typical label returns text in ≤ 2.5–4.0s on mid-range phone.

3) Ingredient extraction (client)

Heuristic: find the first header token matching /^ingrediente(s)?[:\- ]/i and collect until the next section header (/^(alerg|nutric|contenido|lote|fecha|conserv)/i) or line break gap.

Normalize: uppercase, trim, remove diacritics and duplicate spaces.

Split by , ; and parentheses content where appropriate.

Render as a list of chips + copy to clipboard.

Acceptance

For test labels with obvious “INGREDIENTES: …”, list contains ≥ 8/10 expected tokens.

4) Optional pre-processing (hard images)

If confidence/length below threshold, apply adaptive thresholding / grayscale / denoise / sharpen, then retry OCR. (OpenCV.js has cv.adaptiveThreshold, cv.threshold etc.). 
docs.opencv.org

Acceptance

On 5 “difficult” photos (low contrast), pre-processing improves token count vs raw OCR in ≥ 3/5.

5) UX polish

One-tap copy and share (Web Share API).

Disclaimer: “This tool does not replace medical advice.”

Implementation Notes (snippets Codex should infer)

Tesseract load (CDN)
“Include <script src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'> and call Tesseract.createWorker(); for ESM use the .../tesseract.esm.min.js build.” 
GitHub

Camera input
“Use <input type='file' accept='image/*' capture='environment'> to prefer the back camera on mobile.” 
developer.mozilla.org
+1

Live capture (optional)
“Use navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }}) → draw to <canvas> and extract a blob.” 
developer.mozilla.org

Pre-process
“With OpenCV.js, run grayscale + cv.adaptiveThreshold before OCR on low-confidence runs.” 
docs.opencv.org

MVP 1 — Allergy matching (still client-only)

Features

Local JSON allergens.json with ES-CL synonyms (e.g., gluten → trigo, cebada, centeno, avena, espelta; milk → leche, suero, caseína; soy → soja/soya, lecitina E322; etc.).

Rule engine (lite):

contains → 🔴

puede contener / trazas → 🟡

else → 🟢

Acceptance

Given a canned test list, algorithm colors correctly per rules above.

MVP 2 — Profiles + history (Supabase)

Features

Supabase Auth (email/OTP).

Tables: profiles (user_id, allergens[], strictness), scans (user_id, ts, ocr_text, ingredients[]).

RLS policies so each user only sees their data. 
Supabase

Acceptance

Create two test users; each only sees their own scans and profile.

MVP 3 — Aditives knowledge (E-numbers)

Features

Add enumbers.json with fields: code, names, possible_origins, allergenicity_outcome, notes, sources.

When an ingredient matches an E-code, show “precaution” banner with context and allow user strictness override.

Optionally enrich matches using Open Food Facts fields (ingredients, allergens, traces). 
wiki.openfoodfacts.org
+1

Acceptance

For labels containing E322/E471, UI surfaces “possible origin varies; may be safe for X if no proteins remain” style note.

MVP 4 — Stores map

Features

Map page using MapLibre GL JS + your tiles/provider; markers for organic/allergy-friendly stores. 
maplibre.org

Filter by city/category.

Acceptance

Given seed data for 20 stores, map clusters and filters in < 200 ms interactions.

Non-functional & Ops

Privacy by design: MVP 0 does not upload images or text; all OCR is on-device via Tesseract WebAssembly. 
GitHub

PWA basics (later): web app manifest + offline shell for /scan. (Use Next.js guide + standard Web App Manifest docs.) 
nextjs.org

Accessibility: color + icon semantics (don’t rely on color only), keyboard navigable.

Stretch (later, optional)

Barcode lookup via Open Food Facts to bypass OCR when product is known. 
world.openfoodfacts.org

Map data via community submissions (then move to Supabase Edge Functions with RLS). 
Supabase

“Definition of Done” checklists (per MVP)

MVP 0

 Works on iOS Safari/Chrome Android + desktop Chrome/Firefox.

 Can capture from camera OR gallery.

 Produces a non-empty ingredients list for 5 common Chilean products.

 Performance: ≤ 4s OCR on mid-range Android for a 1200–1600px image.

MVP 1

 Dictionary covers base allergens + common ES-CL synonyms.

 Traffic light reflects contains/trazas/none.

 Clear disclaimer and “report a mistake” button.

MVP 2

 Supabase Auth integrated; RLS policies validated. 
Supabase

MVP 3

 E-numbers table exists with citations; UI shows “precaution” notes. 
wiki.openfoodfacts.org

MVP 4

 Map renders stores; basic filters and clustering. 
maplibre.org

If you want, I can also drop a starter ocr.ts and a /scan/page.tsx skeleton tailored to Next.js App Router with the <input capture> approach and a Tesseract worker bootstrap.