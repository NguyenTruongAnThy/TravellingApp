import QRCode from 'qrcode';

// Code 128B pattern table for standard alphanumeric strings
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

/**
 * Generates an SVG string representation of a standard Code-128B barcode.
 * Completely offline, zero canvas/DOM dependencies, razor-sharp vector output.
 */
export function generateBarcodeSvg(rawText: string, barHeight: number = 44): string {
  const sanitized = rawText.replace(/[^A-Za-z0-9\-#_]/g, '');
  let checksum = 104; // Start code B
  let pattern = CODE128_PATTERNS[104];

  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) {
      checksum += code * (i + 1);
      pattern += CODE128_PATTERNS[code];
    }
  }

  pattern += CODE128_PATTERNS[checksum % 103];
  pattern += CODE128_PATTERNS[106]; // Stop code

  const barMultiplier = 1.6;
  let x = 12;
  const rects: string[] = [];

  for (let i = 0; i < pattern.length; i++) {
    const width = parseInt(pattern[i], 10) * barMultiplier;
    if (i % 2 === 0) {
      // Black bar
      rects.push(`<rect x="${x.toFixed(1)}" y="0" width="${width.toFixed(1)}" height="${barHeight}" fill="#131B2E" />`);
    }
    x += width;
  }

  const svgWidth = Math.ceil(x + 12);
  const svgHeight = barHeight + 16;

  return `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
    ${rects.join('\n')}
    <text x="${(svgWidth / 2).toFixed(1)}" y="${barHeight + 12}" font-family="monospace" font-size="11" font-weight="700" fill="#5A6478" text-anchor="middle" letter-spacing="2">${sanitized}</text>
  </svg>`;
}

/**
 * Generates an offline Base64 PNG Data URL for a 2D QR Code.
 */
export async function generateQRCodeDataUrl(
  text: string,
  width: number = 160
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width,
      margin: 1,
      color: {
        dark: '#131B2E',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.warn('Failed to generate offline QR Code:', err);
    return '';
  }
}
