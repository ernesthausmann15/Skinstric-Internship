/**
 * The portrait is the only input to the reader. A gallery file or a camera
 * frame is posted as base64, and the reply is turned into the three confidence
 * lists the demographics screens already know how to draw.
 * Scores arrive as fractions between 0 and 1. They are stored as whole
 * percentages so the ring and the list share one number.
 * The service classifies the pixels it receives. A PNG crop is forwarded as
 * those bytes. RGB stays in canvas order, with no equalize, invert, or
 * brightness lift, and no JPEG pass on the way out.
 * One photo is one request. The race, age, and sex lists are that response,
 * with each fraction turned into a percent. A second call of the same pixels
 * is a different response, so those lists are not mixed together.
 */
export type ConfidenceScore = {
  name: string;
  display: string;
  value: number;
};

export type PortraitAnalysis = {
  race: ConfidenceScore[];
  age: ConfidenceScore[];
  sex: ConfidenceScore[];
};

const READER =
  "https://us-central1-api-skinstric-ai.cloudfunctions.net/skinstricPhaseTwo";

type ScoreMap = Record<string, number>;

type RawGroups = {
  race?: ScoreMap;
  age?: ScoreMap;
  gender?: ScoreMap;
  sex?: ScoreMap;
};

export async function analyzePortrait(dataUrl: string): Promise<PortraitAnalysis> {
  const image = await readerPayload(dataUrl);
  const chosen = await readOnce(image);
  if (!chosen.race || !chosen.age || !(chosen.gender ?? chosen.sex)) {
    throw new Error("The portrait could not be read.");
  }
  const gender = chosen.gender ?? chosen.sex;
  return {
    race: toScores(chosen.race),
    age: toScores(chosen.age),
    sex: toScores(gender ?? {}),
  };
}

async function readOnce(image: string): Promise<RawGroups> {
  const response = await fetch(READER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });
  if (!response.ok) {
    throw new Error("The portrait could not be read.");
  }
  const body = (await response.json()) as { data?: RawGroups } & RawGroups;
  return body.data ?? body;
}

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("The image could not be read."));
    };
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });
}

function toScores(group: ScoreMap): ConfidenceScore[] {
  return Object.entries(group)
    .map(([key, raw]) => {
      const numeric = typeof raw === "number" ? raw : Number(raw);
      const value = Number.isFinite(numeric) ? (numeric <= 1 ? Math.round(numeric * 100) : Math.round(numeric)) : 0;
      const display = key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
      return { name: display, display, value };
    })
    .sort((left, right) => right.value - left.value);
}

function readerPayload(dataUrl: string): Promise<string> {
  const comma = dataUrl.indexOf(",");
  const meta = comma >= 0 ? dataUrl.slice(0, comma) : "";
  const body = comma >= 0 ? dataUrl.slice(comma + 1) : "";
  // The isolate step already wrote a lossless PNG of the original crop.
  // Forward those bytes instead of drawing them again.
  if (meta.includes("image/png") && body.length > 0 && body.length < 4_500_000) {
    return Promise.resolve(body);
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const longest = Math.max(image.width, image.height);
      const scale = Math.min(1, 1600 / longest);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) {
        reject(new Error("The portrait could not be prepared."));
        return;
      }
      context.imageSmoothingEnabled = scale < 1;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve((canvas.toDataURL("image/png").split(",")[1]) ?? "");
    };
    image.onerror = () => reject(new Error("The portrait could not be prepared."));
    image.src = dataUrl;
  });
}
