// services/skiaFloodFillService.ts
import { Skia, type SkImage } from '@shopify/react-native-skia';

export interface FloodFillResult {
  success: boolean;
  image: SkImage;
  filledPixels: number;
}

export const skiaFloodFillService = {
  async floodFillImage(
    image: SkImage,
    point: { x: number; y: number },
    fillColor: string
  ): Promise<FloodFillResult> {
    try {
      console.log('🎨 Starting Skia flood fill at:', point, 'color:', fillColor);

      // Get image dimensions
      const width = image.width();
      const height = image.height();

      // Read pixels from image
      const pixels = image.readPixels();
      
      if (!pixels) {
        throw new Error('Could not read image pixels');
      }

      // Convert to Uint8Array for manipulation
      const pixelData = new Uint8Array(pixels);
      
      // Perform flood fill
      const targetColor = this.getPixelColor(pixelData, point.x, point.y, width);
      const fillRGB = this.hexToRgb(fillColor);
      
      console.log('🔍 Target color:', targetColor, 'Fill color:', fillRGB);
      
      const filledPixels = this.floodFill(
        pixelData,
        point.x,
        point.y,
        targetColor,
        fillRGB,
        width,
        height
      );

      console.log('✅ Flood fill completed, filled pixels:', filledPixels);

      // Create new image with modified pixels
      const data = Skia.Data.fromBytes(pixelData);
      const newImage = Skia.Image.MakeImage(
        {
          width,
          height,
          alphaType: 1,
          colorType: 4,
        },
        data,
        width * 4 // rowBytes
      );

      if (!newImage) {
        throw new Error('Could not create new image');
      }

      return {
        success: true,
        image: newImage,
        filledPixels,
      };
    } catch (error) {
      console.error('❌ Skia flood fill error:', error);
      throw error;
    }
  },

  floodFill(
    pixelData: Uint8Array,
    startX: number,
    startY: number,
    targetColor: number[],
    fillColor: number[],
    width: number,
    height: number
  ): number {
    const stack: [number, number][] = [[startX, startY]];
    let filledPixels = 0;

    console.log('📐 Image dimensions:', width, 'x', height);

    // Boundary check
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
      console.warn('⚠️ Click outside image bounds');
      return 0;
    }

    // Check if we're clicking on a line
    const startIndex = (startY * width + startX) * 4;
    const startPixel = [
      pixelData[startIndex],
      pixelData[startIndex + 1],
      pixelData[startIndex + 2],
      pixelData[startIndex + 3],
    ];

    console.log('🎯 Start pixel color:', startPixel);

    const isClickingOnLine = this.isDarkColor(startPixel);
    if (isClickingOnLine) {
      console.warn('⚠️ Clicked on line art, not fill area');
      return 0;
    }

    while (stack.length > 0 && filledPixels < 10000) {
      const [x, y] = stack.pop()!;
      const pixelIndex = (y * width + x) * 4;

      // Check if pixel matches target color and hasn't been filled
      if (
        pixelData[pixelIndex] === targetColor[0] &&
        pixelData[pixelIndex + 1] === targetColor[1] &&
        pixelData[pixelIndex + 2] === targetColor[2] &&
        pixelData[pixelIndex + 3] === targetColor[3]
      ) {
        // Fill the pixel
        pixelData[pixelIndex] = fillColor[0]; // R
        pixelData[pixelIndex + 1] = fillColor[1]; // G
        pixelData[pixelIndex + 2] = fillColor[2]; // B
        pixelData[pixelIndex + 3] = 255; // A

        filledPixels++;

        // Add neighboring pixels to stack
        if (x > 0) stack.push([x - 1, y]);
        if (x < width - 1) stack.push([x + 1, y]);
        if (y > 0) stack.push([x, y - 1]);
        if (y < height - 1) stack.push([x, y + 1]);
      }
    }

    return filledPixels;
  },

  getPixelColor(pixelData: Uint8Array, x: number, y: number, width: number): number[] {
    const index = (y * width + x) * 4;
    return [
      pixelData[index], // R
      pixelData[index + 1], // G
      pixelData[index + 2], // B
      pixelData[index + 3], // A
    ];
  },

  hexToRgb(hex: string): number[] {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return [r, g, b, 255];
  },

  isDarkColor(rgba: number[]): boolean {
    const brightness = (rgba[0] * 299 + rgba[1] * 587 + rgba[2] * 114) / 1000;
    return brightness < 128;
  },
};