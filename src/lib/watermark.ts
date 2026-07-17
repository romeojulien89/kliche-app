import sharp from "sharp";

const PREVIEW_MAX_WIDTH = 1600;
const HD_MAX_WIDTH = 3000;
const BAR_RATIO = 0.07; // hauteur du cadre sponsor en bas, en % de la largeur

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );
}

function overlaySvg(width: number, height: number, sponsorName: string | null): string {
  const barHeight = Math.round(width * BAR_RATIO);
  const tile = Math.round(width / 6);
  const diag = Array.from({ length: 10 })
    .map((_, row) =>
      Array.from({ length: 10 }).map(
        (_, col) =>
          `<text x="${col * tile}" y="${row * tile}" transform="rotate(-30 ${col * tile} ${row * tile})" font-family="Georgia, serif" font-size="${Math.round(tile * 0.22)}" fill="#F7F1E6" fill-opacity="0.1" font-weight="700">KLICHÉ</text>`,
      ),
    )
    .join("");

  const sponsorText = sponsorName
    ? `<text x="${width - 24}" y="${height - barHeight / 2 + 7}" text-anchor="end" font-family="Arial, sans-serif" font-size="${Math.round(barHeight * 0.32)}" fill="#F7F1E6" fill-opacity="0.85">${escapeXml(sponsorName)}</text>`
    : "";

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${diag}
      <rect x="0" y="${height - barHeight}" width="${width}" height="${barHeight}" fill="#161013" fill-opacity="0.55" />
      <text x="24" y="${height - barHeight / 2 + 8}" font-family="Georgia, serif" font-weight="700" letter-spacing="2" font-size="${Math.round(barHeight * 0.4)}" fill="#E9C87E">KLICHÉ</text>
      ${sponsorText}
    </svg>
  `;
}

export async function processPhoto(
  input: Buffer,
  sponsorName: string | null,
): Promise<{ hd: Buffer; preview: Buffer }> {
  const meta = await sharp(input).metadata();
  const orientationSwapped = (meta.orientation ?? 1) >= 5;
  const rawWidth = meta.width ?? PREVIEW_MAX_WIDTH;
  const rawHeight = meta.height ?? Math.round((PREVIEW_MAX_WIDTH * 2) / 3);
  const origW = orientationSwapped ? rawHeight : rawWidth;
  const origH = orientationSwapped ? rawWidth : rawHeight;

  const scale = Math.min(1, PREVIEW_MAX_WIDTH / origW);
  const w = Math.round(origW * scale);
  const h = Math.round(origH * scale);

  const hd = await sharp(input)
    .rotate()
    .resize({ width: HD_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toBuffer();

  const preview = await sharp(input)
    .rotate()
    .resize({ width: w, height: h, fit: "fill" })
    .composite([{ input: Buffer.from(overlaySvg(w, h, sponsorName)) }])
    .jpeg({ quality: 82 })
    .toBuffer();

  return { hd, preview };
}
