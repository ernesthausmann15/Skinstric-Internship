/**
 * The portrait is the only input to the reader. A gallery file or a camera
 * frame is posted as base64, and the reply is turned into the three confidence
 * lists the demographics screens already know how to draw.
 * Scores arrive as fractions between 0 and 1. They are stored as percentages
 * and drawn to two decimal places. The lists stay sorted from highest to lowest.
 * The service classifies the pixels it receives. A PNG crop is forwarded as
 * those bytes. RGB stays in canvas order, with no equalize, invert, or
 * brightness lift, and no JPEG pass on the way out.
 * The service can call the same face female on one request and male on the
 * next. Several reads run together. The lists on screen are one of those
 * responses, the middle one among the reads that share the majority sex.
 * The percentages are not averaged.
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

const READS = 5;

export async function analyzePortrait(dataUrl: string): Promise<PortraitAnalysis> {
  const image = await readerPayload(dataUrl);
  const settled = await Promise.all(
    Array.from({ length: READS }, () => readOnce(image).catch(() => null)),
  );
  const reads = settled.filter((item): item is RawGroups => {
    if (!item?.race || !item.age) return false;
    return Boolean(item.gender ?? item.sex);
  });
  if (!reads.length) {
    throw new Error("The portrait could not be read.");
  }
  const chosen = agreeOnSex(reads);
  const gender = chosen.gender ?? chosen.sex;
  return {
    race: toScores(chosen.race ?? {}),
    age: toScores(chosen.age ?? {}),
    sex: toScores(gender ?? {}),
  };
}

function sexShares(item: RawGroups) {
  const group = item.gender ?? item.sex ?? {};
  const male = typeof group.male === "number" ? group.male : Number(group.male ?? 0);
  const female = typeof group.female === "number" ? group.female : Number(group.female ?? 0);
  return {
    male: Number.isFinite(male) ? male : 0,
    female: Number.isFinite(female) ? female : 0,
  };
}

function agreeOnSex(reads: RawGroups[]) {
  const males = reads.filter((item) => sexShares(item).male >= sexShares(item).female);
  const females = reads.filter((item) => sexShares(item).female > sexShares(item).male);
  let pool = males.length >= females.length ? males : females;
  if (males.length === females.length) {
    // The median ignores one 98% flip. A single female call cannot drag a
    // tied set across 50% when the other calls sit on the male side.
    pool = medianMale(reads) >= 0.5 ? males : females;
  }
  if (!pool.length) pool = reads;
  const ranked = [...pool].sort((left, right) => sexShares(left).male - sexShares(right).male);
  return ranked[Math.floor(ranked.length / 2)] ?? reads[0];
}

function medianMale(reads: RawGroups[]) {
  const shares = reads.map((item) => sexShares(item).male).sort((left, right) => left - right);
  const mid = Math.floor(shares.length / 2);
  if (shares.length % 2 === 1) return shares[mid] ?? 0;
  return ((shares[mid - 1] ?? 0) + (shares[mid] ?? 0)) / 2;
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
      const value = Number.isFinite(numeric) ? (numeric <= 1 ? numeric * 100 : numeric) : 0;
      const display = key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
      return { name: display, display, value };
    })
    .sort((left, right) => right.value - left.value);
}

/** The list, the ring, and the sidebar share this two-decimal percentage. */
export function formatScore(value: number) {
  return value.toFixed(2);
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
