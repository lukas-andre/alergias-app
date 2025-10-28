Here’s a compact, **in-app mini-doc** you can drop into your project. It’s written for a **Chile** context (Spanish labels) and **Tesseract.js in the browser**.

# Tesseract.js — Mini Guide (Browser, ES-CL)

## What is Tesseract.js?

Tesseract.js is a pure JavaScript/WebAssembly port of the Tesseract OCR engine that runs **entirely in the browser** (or Node). It supports 100+ languages and an OpenAI-style worker API. ([tesseract.projectnaptha.com][1])

---

## Quick Start

### Option A — CDN (one line)

```html
<script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
<script>
(async () => {
  const worker = Tesseract.createWorker({ logger: m => console.log(m) });
  await worker.load();
  await worker.loadLanguage('spa');      // Spanish for Chilean labels
  await worker.initialize('spa');
  const { data: { text } } = await worker.recognize(document.getElementById('img'));
  console.log(text);
  await worker.terminate();
})();
</script>
```

CDN usage and `createWorker` pattern are documented in the official repo. ([GitHub][2])

### Option B — ESM (Next.js/modern bundlers)

```js
import Tesseract from "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js";

export async function ocr(fileOrUrl) {
  const worker = Tesseract.createWorker({ logger: m => console.log(m) });
  await worker.load();
  await worker.loadLanguage('spa');      // or 'spa+eng' for mixed packs
  await worker.initialize('spa');
  const { data } = await worker.recognize(fileOrUrl);
  await worker.terminate();
  return data.text;
}
```

Official ESM build is provided alongside the CDN bundle. ([GitHub][2])

---

## Language: Spanish (Chile)

* Use the **ISO code `spa`** for Spanish: `loadLanguage('spa')` then `initialize('spa')`. ([GitHub][3])
* Tesseract language packs (“traineddata”) are maintained in the canonical **tessdata** repo (includes `spa.traineddata`). You don’t need to host them yourself for Tesseract.js defaults, but this is the authoritative source. ([GitHub][4])
* You can combine languages for mixed labels, e.g. **`'spa+eng'`**. ([Stack Overflow][5])

---

## Minimal UI pattern (mobile web)

Use the device camera via `<input>`:

```html
<input type="file" accept="image/*" capture="environment" id="pick">
```

Then pass the selected file (or a blob URL) into `worker.recognize(...)`. This pattern is common for browser-side OCR flows. ([Transloadit][6])

---

## Accuracy Levers

### 1) Page Segmentation Mode (PSM)

Tesseract’s **PSM** affects how the engine segments the image (single block vs. single line, etc.). Tweaking it often improves results for labels. In Tesseract.js you can set parameters on the worker (e.g., `tessedit_pageseg_mode`). See PSM overview for when to try modes like 6 (single uniform block) or 7 (single text line). ([PyImageSearch][7])

> Reference list of PSMs and CLI flags (background reading). ([muthu.co][8])

### 2) Character constraints (whitelist/blacklist)

For special cases (e.g., **numeric lots, %**, etc.), you can pass config like **`tessedit_char_whitelist`** to bias recognition. (Use sparingly for ingredients.) ([Stack Overflow][9])

### 3) Image pre-processing (browser)

Hard photos (baja luz, curvatura) benefit from **grayscale + adaptive threshold + deskew** before OCR. Implement with **OpenCV.js** on the client. ([Stack Overflow][10])

---

## Example: parameters (concept)

```js
// Example: switch PSM / set whitelist (use only if you really need it)
await worker.setParameters({
  // 6 = Assume a single uniform block of text
  tessedit_pageseg_mode: '6',
  // Example whitelist (digits + common punctuation) – useful for lot numbers, not for ingredients
  // tessedit_char_whitelist: '0123456789%.,-'
});
```

Parameter patterns and PSM tweaking are common practices in Tesseract/Tesseract.js usage. ([yvonnickfrin.dev][11])

---

## Multiple languages (mixed ES/EN labels)

```js
await worker.loadLanguage('spa+eng');
await worker.initialize('spa+eng');
```

Using a `+` concatenation is the standard way to enable multilingual OCR. ([Stack Overflow][5])

---

## Performance Tips (mobile)

* **Resize** the long edge to ~1200–2000 px before OCR to cut latency without hurting accuracy much.
* **Show progress** using the worker’s `logger`.
* Consider the lighter **v5 changes** (smaller files) when upgrading; v5 reduced bundle size for mobile use. ([GitHub][12])

---

## Gotchas (labels in Chile)

* “**INGREDIENTES:**” lines sometimes include **paréntesis**, **%**, o **“puede contener/trazas”**: parse after OCR (no dependas de saltos de línea).
* Acentos y mayúsculas: **normaliza** (upper, quita diacríticos) antes de buscar sinónimos (etapa app, no OCR).

---

## Useful references

* **Homepage / demo / basics** (Tesseract.js): getting started, browser usage. ([tesseract.projectnaptha.com][1])
* **CDN/ESM usage & `createWorker`**: official repo readme. ([GitHub][2])
* **Spanish traineddata (tessdata)**: language packs repo (includes `spa`). ([GitHub][4])
* **PSM modes explained**: when/how PSM affects accuracy. ([PyImageSearch][7])
* **OpenCV preprocessing ideas**: adaptive threshold/deskew guidance. ([Stack Overflow][10])

---

### “Working baseline” snippet (drop-in)

```js
import Tesseract from "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js";

export async function extractIngredients(fileOrUrl) {
  const worker = Tesseract.createWorker({ logger: m => console.log(m) });
  await worker.load();
  await worker.loadLanguage('spa');              // 'spa+eng' if needed
  await worker.initialize('spa');
  const { data } = await worker.recognize(fileOrUrl);  // File, Blob, or URL
  await worker.terminate();
  return data.text; // You parse "INGREDIENTES:" downstream in your app
}
```

CDN/ESM build + `createWorker` pattern are directly supported. ([GitHub][2])

---

If quieres, te preparo también un **parser** de “INGREDIENTES:” (split por `,`/`;` y manejo de “trazas/puede contener”) para pegarlo al lado de esta doc.

[1]: https://tesseract.projectnaptha.com/?utm_source=chatgpt.com "Tesseract.js | Pure Javascript OCR for 100 Languages!"
[2]: https://github.com/naptha/tesseract.js?utm_source=chatgpt.com "naptha/tesseract.js: Pure Javascript OCR for more than 100 ..."
[3]: https://github.com/tesseract-ocr/tessdata/issues/141?utm_source=chatgpt.com "Spanish traineddata name #141 - tesseract-ocr/tessdata"
[4]: https://github.com/tesseract-ocr/tessdata?utm_source=chatgpt.com "tesseract-ocr/tessdata: Trained models with fast variant of ..."
[5]: https://stackoverflow.com/questions/72615606/i-do-not-know-how-to-translate-two-languages-with-tesseract-js?utm_source=chatgpt.com "I do not know how to translate two languages ​with ..."
[6]: https://transloadit.com/devtips/integrating-ocr-in-the-browser-with-tesseract-js/?utm_source=chatgpt.com "Integrating OCR in the browser with tesseract.js"
[7]: https://pyimagesearch.com/2021/11/15/tesseract-page-segmentation-modes-psms-explained-how-to-improve-your-ocr-accuracy/?utm_source=chatgpt.com "Tesseract Page Segmentation Modes (PSMs) Explained"
[8]: https://muthu.co/all-tesseract-ocr-options/?utm_source=chatgpt.com "All Tesseract OCR options - Muthukrishnan"
[9]: https://stackoverflow.com/questions/65687240/how-to-increase-ocr-accuracy-in-node-js-and-tesseract-js?utm_source=chatgpt.com "How to increase OCR accuracy in Node JS and Tesseract.js?"
[10]: https://stackoverflow.com/questions/28935983/preprocessing-image-for-tesseract-ocr-with-opencv?utm_source=chatgpt.com "Preprocessing image for Tesseract OCR with OpenCV"
[11]: https://yvonnickfrin.dev/ocr-in-javascript-with-tesseract/?utm_source=chatgpt.com "How to use ocr in JavaScript with Tesseract.js? - Yvonnick Frin"
[12]: https://github.com/naptha/tesseract.js/issues/820?utm_source=chatgpt.com "Version 5 Changes · Issue #820 · naptha/tesseract.js"
