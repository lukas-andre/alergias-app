# Test Image Fixtures

## Purpose

These images validate OpenAI Vision API confidence scoring based on image quality.

## Directory Structure

### `high-quality/`
**Expected confidence: 0.85-1.0**

Images should have:
- Sharp, clear text
- Good lighting and contrast
- Complete ingredient list visible
- No blur or motion artifacts

Example naming: `product-brand-high-1.jpg`

### `medium-quality/`
**Expected confidence: 0.60-0.84**

Images should have:
- Slight blur or angle
- Acceptable lighting
- Most text readable
- Minor shadows or reflections

Example naming: `product-brand-medium-1.jpg`

### `low-quality/`
**Expected confidence: 0.0-0.59**

Images should have:
- Significant blur or motion
- Poor lighting (dark/overexposed)
- Partial text visibility
- Heavy shadows or glare

Example naming: `product-brand-low-1.jpg`

## Adding Test Images

1. **Source**: Use real Chilean product labels
2. **Size**: Keep under 2MB per image
3. **Format**: JPEG or PNG
4. **Privacy**: Ensure no personal information visible
5. **Diversity**: Include various product types (dairy, snacks, beverages, etc.)

## Minimum Test Set

To validate confidence distribution, include at least:
- 3 high-quality images
- 3 medium-quality images
- 3 low-quality images

## Usage in Tests

```typescript
import path from "path";
import fs from "fs";

const highQualityImage = fs.readFileSync(
  path.join(__dirname, "../fixtures/images/high-quality/product-1.jpg")
);

const base64 = highQualityImage.toString("base64");
```

## Maintenance

- Review and update images periodically
- Remove any outdated product labels
- Add edge cases as discovered in production
