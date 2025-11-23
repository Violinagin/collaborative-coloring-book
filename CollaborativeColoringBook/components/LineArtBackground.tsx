import React from 'react';
import { Image } from 'react-native';
import { Canvas, Image as SkiaImage, useImage } from '@shopify/react-native-skia';

interface LineArtBackgroundProps {
  lineArtUrl: string;
  width: number;
  height: number;
}

const LineArtBackground = ({ lineArtUrl, width, height }: LineArtBackgroundProps) => {
  const image = useImage(lineArtUrl);

  if (!image) {
    return null; // or a loading indicator
  }

  return (
    <Canvas style={{ width, height }}>
      <SkiaImage
        image={image}
        x={0}
        y={0}
        width={width}
        height={height}
        fit="contain"
      />
    </Canvas>
  );
};

export default LineArtBackground;