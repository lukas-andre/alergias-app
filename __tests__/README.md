# AlergiasCL Test Suite

## Structure

```
__tests__/
├── unit/               # Unit tests for individual functions
├── integration/        # Integration tests for API endpoints
└── fixtures/
    └── images/         # Test images for vision API testing
        ├── high-quality/    # Clear, well-lit labels
        ├── medium-quality/  # Average quality
        └── low-quality/     # Blurry, dark, or partial labels
```

## Test Coverage Goals

### Unit Tests (`unit/`)
- [ ] Token normalization (`lib/openai/post-process.ts`)
- [ ] Allergen key matching (`lib/risk/evaluate.ts`)
- [ ] Synonym expansion (`lib/synonyms/expand.ts`)
- [ ] E-number decision logic
- [ ] RPC adapters

### Integration Tests (`integration/`)
- [ ] `/api/analyze` with real DB connection
- [ ] Profile payload fetching
- [ ] Risk evaluation end-to-end

### Confidence Distribution Tests

These tests validate that OpenAI's confidence scores align with image quality:

#### High Quality Images (Expected confidence: 0.85-1.0)
- Clear, well-lit product labels
- Sharp text, no blur
- Complete ingredient list visible
- Good contrast

#### Medium Quality Images (Expected confidence: 0.60-0.84)
- Slightly blurry or angled shots
- Partial shadows
- Some text may be small but readable

#### Low Quality Images (Expected confidence: 0.0-0.59)
- Blurry, motion blur, or out of focus
- Dark or over-exposed
- Text cut off or partially visible
- Heavy shadows or glare

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- __tests__/unit/post-process.test.ts

# Run with coverage
npm test -- --coverage
```

## Adding Test Images

1. Place images in appropriate quality directory
2. Name descriptively: `producto-marca-quality.jpg`
3. Keep file sizes reasonable (<2MB)
4. Include diverse Chilean products

## Test Framework

- **Unit/Integration**: Jest + @testing-library
- **E2E**: Playwright (configured separately)
- **Mocking**: MSW (Mock Service Worker) for API tests

## Setup Required

Before running tests, install dependencies:

```bash
npm install --save-dev @types/jest @types/node jest ts-jest @testing-library/react @testing-library/jest-dom
```

Configure `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
```

**Note:** Test files currently have TypeScript errors because Jest types are not installed. This is expected and will resolve after setup.
