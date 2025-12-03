// path: src/lib/containerBackground.ts
import type { CSSProperties } from 'react';
import type { NodeProps } from './editorTypes';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const DEFAULT_BASE_COLOR = '#020617';

export const buildContainerBackgroundStyle = (props?: NodeProps, fallback?: string): CSSProperties => {
  const style: CSSProperties = {};
  if (!props) {
    if (fallback) {
      style.background = fallback;
    }
    return style;
  }

  const customBackground = typeof props.bg === 'string' && props.bg.trim() ? props.bg.trim() : null;
  const color = typeof props.containerBgColor === 'string' && props.containerBgColor.trim()
    ? props.containerBgColor.trim()
    : null;
  const image = typeof props.containerBgImageUrl === 'string' && props.containerBgImageUrl.trim()
    ? props.containerBgImageUrl.trim()
    : null;

  if (image) {
    const posX = typeof props.containerBgImagePosX === 'number' ? clamp(props.containerBgImagePosX, 0, 100) : 50;
    const posY = typeof props.containerBgImagePosY === 'number' ? clamp(props.containerBgImagePosY, 0, 100) : 50;
    const size = typeof props.containerBgImageSize === 'number' ? clamp(props.containerBgImageSize, 20, 300) : 100;
    style.backgroundColor = color ?? DEFAULT_BASE_COLOR;
    style.backgroundImage = `url(${image})`;
    style.backgroundSize = `${Math.round(size)}%`;
    style.backgroundPosition = `${Math.round(posX)}% ${Math.round(posY)}%`;
    style.backgroundRepeat = 'no-repeat';
    return style;
  }

  if (customBackground) {
    style.background = customBackground;
    return style;
  }

  if (color) {
    style.background = color;
    return style;
  }

  if (fallback) {
    style.background = fallback;
  }

  return style;
};
