// Map markers, drawn from the color tokens into PNG bitmaps at 1x, 2x, and 3x (custom SVG
// markers are slow on Android). `pnpm --filter @collabo/ui ui:markers` redraws them after a
// token change. Sizes come from the icon tokens and never scale with text.

import { colorModes, size, type ColorMode, type ColorToken } from '../tokens/index.ts'

export const markerShapes = ['pickup', 'dropoff', 'car', 'collaboStop'] as const
export type MarkerShape = (typeof markerShapes)[number]

/** A Collabo trip has two riders, so up to two pickups and two drop offs, numbered in route order. */
export const collaboStopNumbers = [1, 2, 3, 4] as const
export type CollaboStopNumber = (typeof collaboStopNumbers)[number]

export const markerScales = [1, 2, 3] as const

export type MarkerSpec = {
  /** In points; the bitmap is this times the scale. */
  readonly width: number
  readonly height: number
  /** The point of the image that sits on the coordinate, as fractions of width and height. */
  readonly anchor: { readonly x: number; readonly y: number }
  /** The marker's main fill: the color that must reach 3:1 against every map color (AC-9). */
  readonly body: ColorToken
  /** Inner detail (the pin's centre, the car's windows, the stop number). */
  readonly detail: ColorToken
  /** The ring or edge that keeps the marker apart from whatever map feature is under it. */
  readonly outline: ColorToken
}

export const markerSpecs: Readonly<Record<MarkerShape, MarkerSpec>> = {
  /** A forest green dot with a ring, centred on the pickup point. */
  pickup: {
    width: size.icon.lg,
    height: size.icon.lg,
    anchor: { x: 0.5, y: 0.5 },
    body: 'primary',
    detail: 'surface',
    outline: 'surface',
  },
  /** A square pin whose tip sits on the drop off point. */
  dropoff: {
    width: size.icon.lg,
    height: size.icon.xl,
    anchor: { x: 0.5, y: 1 },
    body: 'text',
    detail: 'surface',
    outline: 'surface',
  },
  /** A top view car, centred and rotated by heading. */
  car: {
    width: size.icon.sm,
    height: size.icon.xl,
    anchor: { x: 0.5, y: 0.5 },
    body: 'text',
    detail: 'surface',
    outline: 'surface',
  },
  /** An amber pin carrying the stop's number. */
  collaboStop: {
    width: size.icon.lg,
    height: size.icon.xl,
    anchor: { x: 0.5, y: 1 },
    body: 'collabo',
    detail: 'onCollabo',
    outline: 'surface',
  },
}

/** The file name (without the `@2x` scale suffix Metro resolves) of one marker bitmap. */
export function markerFileName(shape: MarkerShape, mode: ColorMode, stop?: CollaboStopNumber): string {
  const base = shape === 'collaboStop' ? `collabo-stop-${stop ?? 1}` : shape
  return `${base}-${mode}.png`
}

export type MarkerFile = {
  readonly file: string
  readonly shape: MarkerShape
  readonly mode: ColorMode
  readonly stop?: CollaboStopNumber
}

/** Every bitmap the generator writes, named at scale 1. */
export function markerFiles(): readonly MarkerFile[] {
  return colorModes.flatMap((mode) =>
    markerShapes.flatMap<MarkerFile>((shape) =>
      shape === 'collaboStop'
        ? collaboStopNumbers.map((stop) => ({ file: markerFileName(shape, mode, stop), shape, mode, stop }))
        : [{ file: markerFileName(shape, mode), shape, mode }],
    ),
  )
}

/** `pickup-light.png` at scale 2 is `pickup-light@2x.png`. */
export function scaledFileName(file: string, scale: (typeof markerScales)[number]): string {
  return scale === 1 ? file : file.replace(/\.png$/, `@${scale}x.png`)
}
