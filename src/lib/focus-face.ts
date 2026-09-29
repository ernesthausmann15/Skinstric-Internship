/**
 * Uploads are rebuilt as a 2:1 frame so the whole file is on the 1920×960
 * stage. The face scan then walks that frame.
 *
 * The sharp region is the face's own silhouette. Skin pixels are grouped
 * into one connected shape, holes such as eyes are filled, and a small pad
 * is added so the forehead, jaw, and cheeks stay inside the clear area.
 * Nothing in that path draws an oval or a rectangle.
 *
 * When the first walk leaves part of the face outside the mask, or the
 * shape touches the frame, a second walk runs around that same face. A
 * larger patch lower in the frame cannot take the mask. The clear region
 * eases toward the new center instead of jumping.
 * The reader receives a padded crop of the original file, copied 1:1 into a
 * PNG. Display JPEG is only for the on-screen scan. Race, age, and sex are
 * read from those source pixels, still in RGB, with no second compression.
 */

export type FaceContour = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  cx: number;
  cy: number;
  mask: Uint8Array;
  maskWidth: number;
  maskHeight: number;
  scale: number;
  coreMinX: number;
  coreMinY: number;
  coreMaxX: number;
  coreMaxY: number;
};

type DetectedFace = {
  boundingBox: { x: number; y: number; width: number; height: number };
};

type FaceDetectorCtor = new (options?: {
  fastMode?: boolean;
  maxDetectedFaces?: number;
}) => {
  detect: (source: CanvasImageSource) => Promise<DetectedFace[]>;
};

type Crop = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  count: number;
};

let sharpLayer: HTMLCanvasElement | null = null;
let maskLayer: HTMLCanvasElement | null = null;
let featherLayer: HTMLCanvasElement | null = null;
let faceLayer: HTMLCanvasElement | null = null;
let detectLayer: HTMLCanvasElement | null = null;
let contourRaster: HTMLCanvasElement | null = null;

const STAGE_WIDTH = 960;
const STAGE_HEIGHT = 480;
const DISPLAY_WIDTH = 1920;
const DISPLAY_HEIGHT = 960;
// 360px on the long side is enough for a silhouette and still walks in one
// short animation. Coordinates divide by `scale` to land back on the photo.
const DETECT_LONG_EDGE = 360;

export type FrameFit = {
  scale: number;
  dx: number;
  dy: number;
};

export type PreparedFrame = {
  image: string;
  source: string;
  fit: FrameFit;
};

export async function findFace(
  source: CanvasImageSource,
  width: number,
  height: number,
): Promise<FaceContour | null> {
  const shot = snapshot(source, width, height);
  if (!shot) return null;
  const context = shot.canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  const { width: detectWidth, height: detectHeight } = shot.canvas;
  const pixels = context.getImageData(0, 0, detectWidth, detectHeight).data;
  // A detector box only chooses which skin blob is the face. The mask itself
  // stays the blob's outline, expanded a little past that box.
  const hint = await detectorBox(shot.canvas);
  const skin = new Uint8Array(detectWidth * detectHeight);
  for (let y = 0; y < detectHeight; y += 1) {
    for (let x = 0; x < detectWidth; x += 1) {
      const index = (y * detectWidth + x) * 4;
      if (!isSkin(pixels[index] ?? 0, pixels[index + 1] ?? 0, pixels[index + 2] ?? 0, true)) continue;
      if (hint && !insideBox(x, y, hint, 0.35)) continue;
      skin[y * detectWidth + x] = 1;
    }
  }
  const sealed = seal(skin, detectWidth, detectHeight, 0.12);
  if (!sealed) return null;
  const bounds = measure(sealed.mask, detectWidth, detectHeight);
  if (bounds.count < skinThreshold(detectWidth, detectHeight)) return null;
  return toContour(sealed.mask, detectWidth, detectHeight, shot.scale, sealed.core);
}

export function prepareFrame(dataUrl: string): Promise<PreparedFrame> {
  return fetch(dataUrl)
    .then((response) => response.blob())
    .then((blob) => createImageBitmap(blob, { imageOrientation: "from-image" }))
    .then(async (bitmap) => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = DISPLAY_WIDTH;
        canvas.height = DISPLAY_HEIGHT;
        const context = canvas.getContext("2d");
        if (!context) return { image: dataUrl, source: dataUrl, fit: { scale: 1, dx: 0, dy: 0 } };
        context.fillStyle = "#CDCDCB";
        context.fillRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
        // Fit the whole file, still sharp. The face scan runs later, on screen,
        // so the first frame the visitor sees is completely unblurred.
        // `fit` maps that display back onto the untouched source for the reader.
        const scale = Math.min(DISPLAY_WIDTH / bitmap.width, DISPLAY_HEIGHT / bitmap.height);
        const dw = bitmap.width * scale;
        const dh = bitmap.height * scale;
        const dx = (DISPLAY_WIDTH - dw) / 2;
        const dy = (DISPLAY_HEIGHT - dh) / 2;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(bitmap, dx, dy, dw, dh);
        return { image: canvas.toDataURL("image/jpeg", 0.92), source: dataUrl, fit: { scale, dx, dy } };
      } finally {
        bitmap.close();
      }
    })
    .catch(() => ({ image: dataUrl, source: dataUrl, fit: { scale: 1, dx: 0, dy: 0 } }));
}

export function isolateFace(sourceUrl: string, face: FaceContour, fit: FrameFit): Promise<string> {
  return fetch(sourceUrl)
    .then((response) => response.blob())
    .then((blob) => createImageBitmap(blob, { imageOrientation: "from-image" }))
    .then((bitmap) => {
      try {
        const scale = fit.scale || 1;
        // The scan lives on the fitted display. These undo that fit so the
        // crop is taken from the original pixels, not the JPEG on screen.
        const toSourceX = (value: number) => (value - fit.dx) / scale;
        const toSourceY = (value: number) => (value - fit.dy) / scale;
        let x0 = toSourceX(face.coreMinX);
        let y0 = toSourceY(face.coreMinY);
        let x1 = toSourceX(face.coreMaxX);
        let y1 = toSourceY(face.coreMaxY);
        const faceWidth = Math.max(1, x1 - x0);
        const faceHeight = Math.max(1, y1 - y0);
        // A square on the head. Extra room around a close-up pulls the wall
        // and the boxes into the reader, and that crop comes back near 1% Black.
        const side = Math.max(faceWidth, faceHeight) * 1.35;
        const centerX = (x0 + x1) / 2;
        x0 = centerX - side / 2;
        y0 = y0 - faceHeight * 0.42;
        x1 = centerX + side / 2;
        y1 = y0 + side;
        const sx = Math.max(0, Math.floor(x0));
        const sy = Math.max(0, Math.floor(y0));
        const sw = Math.max(1, Math.min(bitmap.width - sx, Math.ceil(x1) - sx));
        const sh = Math.max(1, Math.min(bitmap.height - sy, Math.ceil(y1) - sy));
        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("The face could not be isolated.");
        // Same width and height on both sides, so this is a copy. Smoothing
        // stays off and nothing reorders RGB or lifts the brightness.
        context.imageSmoothingEnabled = false;
        context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
        return canvas.toDataURL("image/png");
      } finally {
        bitmap.close();
      }
    });
}

let liveFrame: HTMLCanvasElement | null = null;

/**
 * The live camera is drawn into the same 1920×960 stage as a gallery photo,
 * mirrored, filling the frame. Face detection reads this sharp picture.
 * The visible canvas is painted afterwards with `paintBlurredFrame`, so the
 * blur the visitor sees is the gallery blur and the detector never sees it.
 */
export function frameLiveCamera(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
) {
  const frame = sized(liveFrame, DISPLAY_WIDTH, DISPLAY_HEIGHT);
  liveFrame = frame;
  const context = frame.getContext("2d");
  if (!context || !sourceWidth || !sourceHeight) return frame;
  const crop = coverCrop(sourceWidth, sourceHeight, DISPLAY_WIDTH, DISPLAY_HEIGHT);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = "#CDCDCB";
  context.fillRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
  context.save();
  context.translate(DISPLAY_WIDTH, 0);
  context.scale(-1, 1);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
  context.restore();
  return frame;
}

export function paintBlurredFrame(
  destination: HTMLCanvasElement,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  face: FaceContour | null,
  strength: number,
) {
  const sharp = sized(sharpLayer, destination.width, destination.height);
  sharpLayer = sharp;
  const context = sharp.getContext("2d");
  if (!context) return;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, sharp.width, sharp.height);
  context.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, destination.width, destination.height);
    const output = destination.getContext("2d");
    if (!output) return;
    if (!face || strength < 0.02) {
      output.setTransform(1, 0, 0, 1, 0, 0);
      output.clearRect(0, 0, destination.width, destination.height);
      output.drawImage(sharp, 0, 0);
      return;
    }
    const tuned = tuneBlur(face, destination.width, destination.height);
    blurOutsideContour(destination, sharp, face, strength, tuned.maxBlur, (maskContext, raster) => {
      // The same pad on a close-up covers the room, so that picture stays
      // sharp. tuneBlur keeps the gallery pad, and tightens it when the face
      // already fills the frame.
      maskContext.translate(face.cx, face.cy);
      maskContext.scale(tuned.pad, tuned.pad);
      maskContext.translate(-face.cx, -face.cy);
      maskContext.drawImage(raster, 0, 0, destination.width, destination.height);
    });
}

function tuneBlur(face: FaceContour, width: number, height: number) {
  const boxW = Math.max(1, face.maxX - face.minX);
  const boxH = Math.max(1, face.maxY - face.minY);
  const coverage = Math.max(boxW / width, boxH / height);
  if (coverage < 0.38) return { pad: 1.75, maxBlur: 8 };
  return { pad: Math.max(1.05, Math.min(1.28, 0.5 / coverage)), maxBlur: 20 };
}

export function scanFaceLive(
  source: CanvasImageSource,
  width: number,
  height: number,
  onProgress: (progress: number, face: FaceContour | null) => void,
): { cancel: () => void; finished: Promise<FaceContour | null> } {
  const shot = snapshot(source, width, height);
  if (!shot) {
    onProgress(1, null);
    return { cancel: () => undefined, finished: Promise.resolve(null) };
  }
  const context = shot.canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    onProgress(1, null);
    return { cancel: () => undefined, finished: Promise.resolve(null) };
  }
  const { width: detectWidth, height: detectHeight } = shot.canvas;
  const pixels = context.getImageData(0, 0, detectWidth, detectHeight).data;
  const rowsPerFrame = Math.max(1, Math.ceil(detectHeight / 28));
  const strictSkin = new Uint8Array(detectWidth * detectHeight);
  const looseSkin = new Uint8Array(detectWidth * detectHeight);
  let y = 0;
  let correctY = 0;
  let phase: "scan" | "correct" = "scan";
  let looseCount = 0;
  let frame = 0;
  let stopped = false;
  let shown: FaceContour | null = null;
  // Once a face-shaped region is accepted, later rows may only refine it.
  let anchor: { x: number; y: number; reach: number } | null = null;

  const publish = (sealed: { mask: Uint8Array; core: Bounds } | null, progress: number) => {
    if (!sealed) {
      onProgress(progress, shown);
      return;
    }
    const bounds = measure(sealed.mask, detectWidth, detectHeight);
    if (bounds.count < skinThreshold(detectWidth, detectHeight)) {
      onProgress(progress, shown);
      return;
    }
    const next = toContour(sealed.mask, detectWidth, detectHeight, shot.scale, sealed.core);
    // A door or a wall strip can be the first face-shaped blob because it
    // starts higher in the frame. Locking that strip made later rows keep it
    // and blur the real face. Only a region near the middle of the picture
    // may become the clear area or the anchor.
    const centerX = (bounds.minX + bounds.maxX) / 2 / detectWidth;
    const central = Math.abs(centerX - 0.5) < 0.16;
    if (anchor) {
      shown = holdFace(shown, next);
    } else if (central) {
      shown = next;
    }
    if (shown && !anchor && central && faceIsLockable(bounds, detectWidth, detectHeight)) {
      anchor = {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
        reach: Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.95,
      };
    }
    onProgress(progress, shown);
  };

  const finished = new Promise<FaceContour | null>((resolve) => {
    const tick = () => {
      if (stopped) return;
      if (phase === "scan") {
        const limit = Math.min(detectHeight, y + rowsPerFrame);
        for (; y < limit; y += 1) {
          for (let x = 0; x < detectWidth; x += 1) {
            const index = (y * detectWidth + x) * 4;
            const red = pixels[index] ?? 0;
            const green = pixels[index + 1] ?? 0;
            const blue = pixels[index + 2] ?? 0;
            if (isSkin(red, green, blue, true)) strictSkin[y * detectWidth + x] = 1;
            if (isSkin(red, green, blue, false)) looseCount += 1;
          }
        }
        const progress = Math.min(1, y / detectHeight);
        if (y < detectHeight) {
          // The mask published mid-walk is the silhouette found so far, so the
          // blur and the scan finish on the same frame.
          publish(seal(strictSkin, detectWidth, detectHeight, 0.1, anchor), progress);
          frame = window.requestAnimationFrame(tick);
          return;
        }
        const sealed = seal(strictSkin, detectWidth, detectHeight, 0.1, anchor);
        const bounds = sealed ? measure(sealed.mask, detectWidth, detectHeight) : null;
        const threshold = skinThreshold(detectWidth, detectHeight);
        const found = (bounds?.count ?? 0) >= threshold || looseCount >= threshold;
        if (!found) {
          onProgress(1, null);
          resolve(null);
          return;
        }
        publish(sealed, 1);
        const faceAnchor = anchor;
        const extra = faceAnchor && sealed ? looseAround(pixels, sealed.mask, detectWidth, detectHeight, faceAnchor) : 0;
        const clipped = bounds ? boundsTouchFrame(bounds, detectWidth, detectHeight) : false;
        if (sealed && bounds && extra < 24 && !clipped) {
          resolve(shown);
          return;
        }
        // Skin still sits just outside this face. The second walk stays
        // inside the locked reach, so a patch at the bottom cannot replace it.
        if (faceAnchor && sealed) {
          const reach = faceAnchor.reach;
          for (let row = 0; row < detectHeight; row += 1) {
            for (let column = 0; column < detectWidth; column += 1) {
              if (Math.hypot(column - faceAnchor.x, row - faceAnchor.y) > reach) continue;
              if (strictSkin[row * detectWidth + column]) looseSkin[row * detectWidth + column] = 1;
            }
          }
        }
        phase = "correct";
        frame = window.requestAnimationFrame(tick);
        return;
      }

      const limit = Math.min(detectHeight, correctY + rowsPerFrame);
      for (; correctY < limit; correctY += 1) {
        for (let x = 0; x < detectWidth; x += 1) {
          if (anchor && Math.hypot(x - anchor.x, correctY - anchor.y) > anchor.reach) continue;
          const index = (correctY * detectWidth + x) * 4;
          if (!isSkin(pixels[index] ?? 0, pixels[index + 1] ?? 0, pixels[index + 2] ?? 0, false)) continue;
          looseSkin[correctY * detectWidth + x] = 1;
        }
      }
      publish(seal(looseSkin, detectWidth, detectHeight, 0.16, anchor), 1);
      if (correctY < detectHeight) {
        frame = window.requestAnimationFrame(tick);
        return;
      }
      resolve(shown);
    };
    frame = window.requestAnimationFrame(tick);
  });

  return {
    cancel: () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
    },
    finished,
  };
}

export function formatUpload(dataUrl: string): Promise<string> {
  return fetch(dataUrl)
    .then((response) => response.blob())
    .then((blob) => createImageBitmap(blob, { imageOrientation: "from-image" }))
    .then(async (bitmap) => {
      try {
        const face = await findFace(bitmap, bitmap.width, bitmap.height);
        const framed = framePortrait(bitmap, bitmap.width, bitmap.height, face);
        if (!framed.face) return framed.canvas.toDataURL("image/jpeg", 0.9);
        const blurred = document.createElement("canvas");
        blurred.width = framed.canvas.width;
        blurred.height = framed.canvas.height;
        blurOutsideContour(blurred, framed.canvas, framed.face, 1, 8, (maskContext, raster) => {
          maskContext.drawImage(raster, 0, 0, blurred.width, blurred.height);
        });
        return blurred.toDataURL("image/jpeg", 0.9);
      } finally {
        bitmap.close();
      }
    })
    .catch(() => dataUrl);
}

function isSkin(red: number, green: number, blue: number, strict: boolean) {
  // Beige walls and cardboard sit near gray, with a red lead of only a few
  // levels. Facial skin, including a deep complexion in room light, keeps a
  // clearer red lead. A wall that passes this test fills the mask, so a
  // close-up never blurs and the reader scores the room.
  const y = 0.299 * red + 0.587 * green + 0.114 * blue;
  const cb = 128 - 0.168736 * red - 0.331264 * green + 0.5 * blue;
  const cr = 128 + 0.5 * red - 0.418688 * green - 0.081312 * blue;
  const spread = Math.max(red, green, blue) - Math.min(red, green, blue);
  const redLeads = red >= green + 8 && red + 4 >= blue && spread >= 12 && spread <= 70;
  if (!redLeads || y < (strict ? 18 : 14) || y > (strict ? 155 : 175)) return false;
  if (strict) return cb >= 77 && cb <= 128 && cr >= 133 && cr <= 165;
  return cb >= 70 && cb <= 135 && cr >= 130 && cr <= 180;
}

function skinThreshold(width: number, height: number) {
  return Math.max(12, Math.round(width * height * 0.003));
}

function faceIsLockable(bounds: Bounds, width: number, height: number) {
  const boxWidth = bounds.maxX - bounds.minX + 1;
  const boxHeight = bounds.maxY - bounds.minY + 1;
  const aspect = boxHeight / Math.max(1, boxWidth);
  const cx = (bounds.minX + bounds.maxX) / 2 / width;
  const cy = (bounds.minY + bounds.maxY) / 2 / height;
  // The same shape test used to accept a trimmed door, because that strip
  // begins above the face. The face in these portraits sits near the middle.
  return boxWidth >= 10 && boxHeight >= 12 && aspect >= 0.8 && aspect <= 2.2 && cy < 0.82 && Math.abs(cx - 0.5) < 0.16;
}

function boundsTouchFrame(bounds: Bounds, width: number, height: number) {
  const edge = 2;
  return bounds.minX <= edge || bounds.minY <= edge || bounds.maxX >= width - 1 - edge || bounds.maxY >= height - 1 - edge;
}

function looseAround(
  pixels: Uint8ClampedArray,
  mask: Uint8Array,
  width: number,
  height: number,
  anchor: { x: number; y: number; reach: number },
) {
  let extra = 0;
  const x0 = Math.max(0, Math.floor(anchor.x - anchor.reach));
  const y0 = Math.max(0, Math.floor(anchor.y - anchor.reach));
  const x1 = Math.min(width - 1, Math.ceil(anchor.x + anchor.reach));
  const y1 = Math.min(height - 1, Math.ceil(anchor.y + anchor.reach));
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const index = y * width + x;
      if (mask[index]) continue;
      const pixel = index * 4;
      if (!isSkin(pixels[pixel] ?? 0, pixels[pixel + 1] ?? 0, pixels[pixel + 2] ?? 0, false)) continue;
      extra += 1;
    }
  }
  return extra;
}

function seal(
  skin: Uint8Array,
  width: number,
  height: number,
  dilationRatio: number,
  anchor?: { x: number; y: number; reach: number } | null,
) {
  const mask = selectFace(skin, width, height, anchor);
  if (!mask) return null;
  let bounds = measure(mask, width, height);
  if (bounds.count < 12) return null;
  holeFill(mask, width, height, bounds);
  bounds = measure(mask, width, height);
  const core = { ...bounds };
  const radius = Math.max(3, Math.min(22, Math.round(Math.max(1, bounds.maxX - bounds.minX) * dilationRatio)));
  return { mask: dilate(mask, width, height, radius, bounds), core };
}

function selectFace(
  skin: Uint8Array,
  width: number,
  height: number,
  anchor?: { x: number; y: number; reach: number } | null,
) {
  const seen = new Uint8Array(skin.length);
  const stack: number[] = [];
  let best: Uint8Array | null = null;
  let bestScore = 0;
  for (let index = 0; index < skin.length; index += 1) {
    if (!skin[index] || seen[index]) continue;
    const mask = new Uint8Array(skin.length);
    let count = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    seen[index] = 1;
    stack.push(index);
    while (stack.length) {
      const current = stack.pop() ?? 0;
      mask[current] = 1;
      count += 1;
      const x = current % width;
      const y = (current - x) / width;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const next = ny * width + nx;
        if (seen[next] || !skin[next]) continue;
        seen[next] = 1;
        stack.push(next);
      }
    }
    const componentWidth = Math.max(1, maxX - minX);
    // A full-length figure is one tall blob. Keep the head, and keep a short
    // continuation under it when that strip is still the chin.
    if (maxY - minY > componentWidth * 1.85) {
      let cut = Math.min(height - 1, minY + Math.round(componentWidth * 1.45));
      const allowance = Math.round(componentWidth * 0.2);
      for (let row = cut; row < Math.min(height, cut + allowance); row += 1) {
        let rowCount = 0;
        for (let column = minX; column <= maxX; column += 1) {
          if (mask[row * width + column]) rowCount += 1;
        }
        if (rowCount <= componentWidth * 0.15) break;
        cut = row;
      }
      for (let row = cut + 1; row <= maxY; row += 1) {
        for (let column = 0; column < width; column += 1) {
          if (!mask[row * width + column]) continue;
          mask[row * width + column] = 0;
          count -= 1;
        }
      }
      maxY = cut;
    }
    const boxWidth = Math.max(1, maxX - minX);
    const boxHeight = Math.max(1, maxY - minY);
    const aspect = boxHeight / boxWidth;
    let shape = 1;
    if (aspect < 0.65 || aspect > 2.4) shape = 0.12;
    else if (aspect < 0.85 || aspect > 1.9) shape = 0.5;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    // The head is the upper face-shaped region. Hands, shoes, and the rug
    // sit lower and must not take the clear area or the reader crop.
    const place = centerY / height < 0.5 ? 1.7 - centerY / height : 0.12;
    if (anchor) {
      const distance = Math.hypot(centerX - anchor.x, centerY - anchor.y);
      if (distance > Math.max(anchor.reach, boxHeight)) shape = 0;
    }
    const fill = count / (boxWidth * boxHeight);
    // A blob wider than the head is the wall or the boxes. A tall strip on
    // the door loses to the skin cluster nearest the middle of the frame.
    const widthPenalty = boxWidth / width > 0.62 ? 0.05 : 1;
    const fromCenter = Math.hypot(centerX / width - 0.5, centerY / height - 0.46);
    const centerWeight = fromCenter < 0.22 ? 4 : 0.04;
    const score = count * shape * place * widthPenalty * centerWeight * (0.45 + Math.min(fill, 1));
    if (shape > 0 && score > bestScore) {
      best = mask;
      bestScore = score;
    }
  }
  if (!best || bestScore <= 0) return null;
  return best;
}

function holeFill(mask: Uint8Array, width: number, height: number, bounds: Bounds) {
  // Fill eyes and the mouth only inside this face. Flooding from the frame
  // edge used to paint the whole lower half clear once a blob touched both sides.
  const outside = new Uint8Array(mask.length);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < bounds.minX || y < bounds.minY || x > bounds.maxX || y > bounds.maxY) return;
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (outside[index] || mask[index]) return;
    outside[index] = 1;
    stack.push(index);
  };
  for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
    push(x, bounds.minY);
    push(x, bounds.maxY);
  }
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    push(bounds.minX, y);
    push(bounds.maxX, y);
  }
  while (stack.length) {
    const index = stack.pop() ?? 0;
    const x = index % width;
    const y = (index - x) / width;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const index = y * width + x;
      if (!outside[index]) mask[index] = 1;
    }
  }
}

function dilate(mask: Uint8Array, width: number, height: number, radius: number, bounds: Bounds) {
  const next = new Uint8Array(mask.length);
  const radiusSquared = radius * radius;
  const x0 = Math.max(0, bounds.minX - radius);
  const y0 = Math.max(0, bounds.minY - radius);
  const x1 = Math.min(width - 1, bounds.maxX + radius);
  const y1 = Math.min(height - 1, bounds.maxY + radius);
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      let on = 0;
      for (let dy = -radius; dy <= radius && !on; dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (dx * dx + dy * dy > radiusSquared) continue;
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          if (!mask[yy * width + xx]) continue;
          on = 1;
          break;
        }
      }
      if (on) next[y * width + x] = 1;
    }
  }
  return next;
}

function measure(mask: Uint8Array, width: number, height: number): Bounds {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let count = 0;
  for (let index = 0; index < mask.length; index += 1) {
    if (!mask[index]) continue;
    count += 1;
    const x = index % width;
    const y = (index - x) / width;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, count };
}

function toContour(
  mask: Uint8Array,
  width: number,
  height: number,
  scale: number,
  core: Bounds,
): FaceContour {
  const bounds = measure(mask, width, height);
  return {
    minX: bounds.minX / scale,
    minY: bounds.minY / scale,
    maxX: bounds.maxX / scale,
    maxY: bounds.maxY / scale,
    cx: (bounds.minX + bounds.maxX) / 2 / scale,
    cy: (bounds.minY + bounds.maxY) / 2 / scale,
    mask,
    maskWidth: width,
    maskHeight: height,
    scale,
    coreMinX: core.minX / scale,
    coreMinY: core.minY / scale,
    coreMaxX: core.maxX / scale,
    coreMaxY: core.maxY / scale,
  };
}

export function holdFace(previous: FaceContour | null, next: FaceContour | null): FaceContour | null {
  if (!next) return previous;
  if (!previous) return next;
  const jump = Math.hypot(next.cx - previous.cx, next.cy - previous.cy);
  const span = Math.max(24, Math.min(previous.maxX - previous.minX, previous.maxY - previous.minY));
  // A detection at the bottom of the frame is a different blob. Keep the face
  // that is already locked instead of sliding the clear region down to it.
  if (jump > span * 0.75) return previous;
  const desiredCx = previous.cx + (next.cx - previous.cx) * 0.3;
  const desiredCy = previous.cy + (next.cy - previous.cy) * 0.3;
  return offsetContour(next, desiredCx - next.cx, desiredCy - next.cy);
}

function offsetContour(face: FaceContour, dx: number, dy: number): FaceContour {
  const shiftX = Math.round(dx * face.scale);
  const shiftY = Math.round(dy * face.scale);
  if (shiftX === 0 && shiftY === 0) {
    return {
      ...face,
      minX: face.minX + dx,
      minY: face.minY + dy,
      maxX: face.maxX + dx,
      maxY: face.maxY + dy,
      cx: face.cx + dx,
      cy: face.cy + dy,
      coreMinX: face.coreMinX + dx,
      coreMinY: face.coreMinY + dy,
      coreMaxX: face.coreMaxX + dx,
      coreMaxY: face.coreMaxY + dy,
    };
  }
  const mask = new Uint8Array(face.mask.length);
  for (let y = 0; y < face.maskHeight; y += 1) {
    const nextY = y + shiftY;
    if (nextY < 0 || nextY >= face.maskHeight) continue;
    for (let x = 0; x < face.maskWidth; x += 1) {
      if (!face.mask[y * face.maskWidth + x]) continue;
      const nextX = x + shiftX;
      if (nextX < 0 || nextX >= face.maskWidth) continue;
      mask[nextY * face.maskWidth + nextX] = 1;
    }
  }
  const core = {
    minX: Math.round(face.coreMinX * face.scale) + shiftX,
    minY: Math.round(face.coreMinY * face.scale) + shiftY,
    maxX: Math.round(face.coreMaxX * face.scale) + shiftX,
    maxY: Math.round(face.coreMaxY * face.scale) + shiftY,
    count: 1,
  };
  const moved = toContour(mask, face.maskWidth, face.maskHeight, face.scale, core);
  if (moved.maxX <= moved.minX || moved.maxY <= moved.minY) return face;
  return moved;
}

async function detectorBox(source: HTMLCanvasElement) {
  const Detector = (globalThis as { FaceDetector?: FaceDetectorCtor }).FaceDetector;
  if (!Detector) return null;
  try {
    const detector = new Detector({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(source);
    const box = faces[0]?.boundingBox;
    if (!box || box.width < 8 || box.height < 8) return null;
    return box;
  } catch {
    return null;
  }
}

function insideBox(
  x: number,
  y: number,
  box: { x: number; y: number; width: number; height: number },
  padRatio: number,
) {
  const padX = box.width * padRatio;
  const padY = box.height * padRatio;
  return x >= box.x - padX && y >= box.y - padY && x <= box.x + box.width + padX && y <= box.y + box.height + padY;
}

function snapshot(source: CanvasImageSource, width: number, height: number) {
  const longest = Math.max(width, height);
  const scale = Math.min(1, DETECT_LONG_EDGE / longest);
  const canvas = sized(detectLayer, Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
  detectLayer = canvas;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return { canvas, scale };
}

export function paintCameraFrame(
  destination: HTMLCanvasElement,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  face: FaceContour | null,
  mirror: boolean,
  blurStrength: number,
) {
  const width = destination.width;
  const height = destination.height;
  if (!width || !height) return;
  const crop = coverCrop(sourceWidth, sourceHeight, width, height);
  const sharp = sized(sharpLayer, width, height);
  sharpLayer = sharp;
  const context = sharp.getContext("2d");
  if (!context) return;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width, height);
  context.save();
  if (mirror) {
    // The live preview behaves like a mirror. The saved frame uses that same
    // direction, so the face the visitor lined up is the face that is scored.
    context.translate(width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  context.restore();
  const output = destination.getContext("2d");
  if (!output) return;
  if (!face || blurStrength < 0.02) {
    output.setTransform(1, 0, 0, 1, 0, 0);
    output.clearRect(0, 0, width, height);
    output.drawImage(sharp, 0, 0);
    return;
  }
  blurOutsideContour(destination, sharp, face, blurStrength, 8, (maskContext, raster) => {
    maskContext.save();
    if (mirror) {
      maskContext.translate(width, 0);
      maskContext.scale(-1, 1);
    }
    maskContext.drawImage(
      raster,
      crop.sx * face.scale,
      crop.sy * face.scale,
      Math.max(1, crop.sw * face.scale),
      Math.max(1, crop.sh * face.scale),
      0,
      0,
      width,
      height,
    );
    maskContext.restore();
  });
}

function framePortrait(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  face: FaceContour | null,
) {
  const canvas = document.createElement("canvas");
  canvas.width = STAGE_WIDTH;
  canvas.height = STAGE_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) return { canvas, face: null as FaceContour | null };
  context.fillStyle = "#CDCDCB";
  context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
  if (!face) {
    const crop = topWeightedCrop(srcW, srcH);
    context.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, crop.dy, STAGE_WIDTH, STAGE_HEIGHT);
    return { canvas, face: null };
  }

  const faceHeight = Math.max(face.maxY - face.minY, 1);
  const faceWidth = Math.max(face.maxX - face.minX, 1);
  const scale = Math.min((STAGE_HEIGHT * 0.58) / faceHeight, STAGE_WIDTH / Math.max(faceWidth * 1.2, 1));
  const dx = STAGE_WIDTH * 0.5 - face.cx * scale;
  let dy = STAGE_HEIGHT * 0.68 - face.cy * scale;
  const headTop = dy + face.minY * scale;
  const chin = dy + face.maxY * scale;
  if (headTop < 36) dy += 36 - headTop;
  if (chin > STAGE_HEIGHT - 28) dy -= chin - (STAGE_HEIGHT - 28);
  context.drawImage(source, dx, dy, srcW * scale, srcH * scale);
  return { canvas, face: transformContour(face, dx, dy, scale, STAGE_WIDTH, STAGE_HEIGHT) };
}

function transformContour(
  face: FaceContour,
  dx: number,
  dy: number,
  drawScale: number,
  dstW: number,
  dstH: number,
): FaceContour {
  const scale = Math.min(1, DETECT_LONG_EDGE / Math.max(dstW, dstH));
  const maskWidth = Math.max(1, Math.round(dstW * scale));
  const maskHeight = Math.max(1, Math.round(dstH * scale));
  const mask = new Uint8Array(maskWidth * maskHeight);
  for (let y = 0; y < maskHeight; y += 1) {
    for (let x = 0; x < maskWidth; x += 1) {
      const srcX = (x / scale - dx) / drawScale;
      const srcY = (y / scale - dy) / drawScale;
      const mx = Math.round(srcX * face.scale);
      const my = Math.round(srcY * face.scale);
      if (mx < 0 || my < 0 || mx >= face.maskWidth || my >= face.maskHeight) continue;
      if (face.mask[my * face.maskWidth + mx]) mask[y * maskWidth + x] = 1;
    }
  }
  return toContour(mask, maskWidth, maskHeight, scale, {
    minX: Math.round((dx + face.coreMinX * drawScale) * scale),
    minY: Math.round((dy + face.coreMinY * drawScale) * scale),
    maxX: Math.round((dx + face.coreMaxX * drawScale) * scale),
    maxY: Math.round((dy + face.coreMaxY * drawScale) * scale),
    count: 1,
  });
}

function topWeightedCrop(srcW: number, srcH: number): Crop & { dy: number } {
  const aspect = STAGE_WIDTH / STAGE_HEIGHT;
  let sw = srcW;
  let sh = sw / aspect;
  if (sh > srcH) {
    sh = srcH;
    sw = sh * aspect;
  }
  const sx = Math.max(0, (srcW - sw) / 2);
  const sy = srcH / srcW > 1.15 ? 0 : Math.max(0, (srcH - sh) / 2);
  const dy = srcH / srcW > 1.15 ? Math.round(STAGE_HEIGHT * 0.2) : 0;
  return { sx, sy, sw, sh, dy };
}

function blurOutsideContour(
  destination: HTMLCanvasElement,
  sharp: HTMLCanvasElement,
  face: FaceContour,
  strength: number,
  maxBlur: number,
  project: (maskContext: CanvasRenderingContext2D, raster: HTMLCanvasElement) => void,
) {
  const context = destination.getContext("2d");
  if (!context) return;
  const faceSpan = Math.max(1, Math.min(face.maxX - face.minX, face.maxY - face.minY));
  const ratio = maxBlur > 8 ? 0.16 : 0.03;
  const blur = Math.max(2, Math.round(Math.min(maxBlur, faceSpan * ratio) * strength));
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, destination.width, destination.height);
  context.filter = `blur(${blur}px)`;
  context.drawImage(sharp, 0, 0);
  context.filter = "none";

  const mask = sized(maskLayer, destination.width, destination.height);
  maskLayer = mask;
  const maskContext = mask.getContext("2d");
  if (!maskContext) return;
  maskContext.setTransform(1, 0, 0, 1, 0, 0);
  maskContext.clearRect(0, 0, mask.width, mask.height);
  maskContext.imageSmoothingEnabled = true;
  maskContext.imageSmoothingQuality = "high";
  project(maskContext, rasterize(face));

  const featherPx = 2;
  const feather = sized(featherLayer, destination.width, destination.height);
  featherLayer = feather;
  const featherContext = feather.getContext("2d");
  if (!featherContext) return;
  featherContext.setTransform(1, 0, 0, 1, 0, 0);
  featherContext.clearRect(0, 0, feather.width, feather.height);
  featherContext.filter = `blur(${featherPx}px)`;
  featherContext.drawImage(mask, 0, 0);
  featherContext.filter = "none";

  const faceLayerCanvas = sized(faceLayer, destination.width, destination.height);
  faceLayer = faceLayerCanvas;
  const faceContext = faceLayerCanvas.getContext("2d");
  if (!faceContext) return;
  faceContext.globalCompositeOperation = "source-over";
  faceContext.clearRect(0, 0, faceLayerCanvas.width, faceLayerCanvas.height);
  faceContext.drawImage(sharp, 0, 0);
  // destination-in keeps sharp pixels only where the silhouette is opaque.
  faceContext.globalCompositeOperation = "destination-in";
  faceContext.drawImage(feather, 0, 0);
  faceContext.globalCompositeOperation = "source-over";
  context.drawImage(faceLayerCanvas, 0, 0);
}

function rasterize(face: FaceContour) {
  const canvas = sized(contourRaster, face.maskWidth, face.maskHeight);
  contourRaster = canvas;
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const image = context.createImageData(face.maskWidth, face.maskHeight);
  const data = image.data;
  for (let index = 0; index < face.mask.length; index += 1) {
    const offset = index * 4;
    data[offset] = 255;
    data[offset + 1] = 255;
    data[offset + 2] = 255;
    data[offset + 3] = face.mask[index] ? 255 : 0;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

function coverCrop(srcW: number, srcH: number, dstW: number, dstH: number): Crop {
  const srcAspect = srcW / srcH;
  const dstAspect = dstW / dstH;
  if (srcAspect > dstAspect) {
    const sw = srcH * dstAspect;
    return { sx: (srcW - sw) / 2, sy: 0, sw, sh: srcH };
  }
  const sh = srcW / dstAspect;
  return { sx: 0, sy: (srcH - sh) / 2, sw: srcW, sh };
}

function sized(current: HTMLCanvasElement | null, width: number, height: number) {
  const canvas = current ?? document.createElement("canvas");
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return canvas;
}
