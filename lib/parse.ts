export interface IngredientParseResult {
  header: string | null;
  rawBlock: string;
  items: string[];
  traces: string[];
  hadHeaderMatch: boolean;
}

const HEADER_REGEX = /^\s*INGREDIENT(?:ES)?[^\w]?/i;
const STOP_REGEX =
  /^\s*(ALERGEN|ALÉRGEN|TRAZAS|PUEDE CONTENER|CONTENIDO|NUTRIC|LOTE|FECHA|CONSERV|PREPARACI|MODO|USO|TABLA|DECLARAC|ADVERT|CONTACTO|FABRIC|ENVASADO)/i;

const TRACE_REGEX = /\b(puede\s+contener|trazas?\s+de[^.;,]*)/gi;

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normaliseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function splitItems(input: string) {
  const items: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of input) {
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    }

    if (depth === 0 && /[,;•·]/.test(char)) {
      const candidate = normaliseWhitespace(current);
      if (candidate) items.push(cleanItem(candidate));
      current = "";
      continue;
    }

    current += char;
  }

  const finalCandidate = normaliseWhitespace(current);
  if (finalCandidate) items.push(cleanItem(finalCandidate));

  return items.length > 0 ? items : [normaliseWhitespace(input)];
}

function cleanItem(value: string) {
  return value
    .replace(/^[·•\-:]+/, "")
    .replace(/\.$/, "")
    .replace(/^\s*y\s+/i, "")
    .trim();
}

export function extractIngredients(text: string): IngredientParseResult {
  if (!text.trim()) {
    return {
      header: null,
      rawBlock: "",
      items: [],
      traces: [],
      hadHeaderMatch: false,
    };
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => ({
      original: line,
      normalised: stripDiacritics(line).toUpperCase(),
    }));

  const headerIndex = lines.findIndex((line) =>
    HEADER_REGEX.test(line.normalised),
  );

  if (headerIndex === -1) {
    const normalised = normaliseWhitespace(text);
    return {
      header: null,
      rawBlock: normalised,
      items: splitItems(normalised),
      traces: collectTraces(normalised),
      hadHeaderMatch: false,
    };
  }

  const block: string[] = [];
  for (let i = headerIndex; i < lines.length; i += 1) {
    const line = lines[i];
    if (i > headerIndex && STOP_REGEX.test(line.normalised)) break;

    block.push(line.original);

    if (i > headerIndex && !line.original.trim()) break;
  }

  const rawBlock = block.join("\n").trim();
  const [first, ...rest] = block;
  const header = first ?? null;
  const withoutHeader = [
    first?.replace(HEADER_REGEX, "").trim() ?? "",
    ...rest.map((line) => line.trim()),
  ]
    .filter(Boolean)
    .join(" ");

  const cleaned = normaliseWhitespace(withoutHeader);

  return {
    header,
    rawBlock,
    items: cleaned ? splitItems(cleaned) : [],
    traces: collectTraces(rawBlock),
    hadHeaderMatch: true,
  };
}

function collectTraces(block: string) {
  const traces: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = TRACE_REGEX.exec(block)) !== null) {
    traces.push(normaliseWhitespace(match[0]));
  }
  return traces;
}
