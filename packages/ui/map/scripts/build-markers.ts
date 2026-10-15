// Draws every map marker bitmap from `map/markers.ts` and the color tokens, at 1x, 2x, and 3x,
// into `map/markers/`. Run after a token or marker change: `pnpm --filter @collabo/ui ui:markers`.
// Uses CanvasKit (Skia compiled to WebAssembly) so edges are antialiased and the stop numbers are
// set in DM Sans Bold, the same face the apps use.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import CanvasKitInit, { type Canvas, type CanvasKit, type Font, type Paint } from 'canvaskit-wasm'

import { color, fontFamilies, type, type ColorMode } from '../../tokens/index.ts'
import {
  markerFiles,
  markerScales,
  markerSpecs,
  scaledFileName,
  type CollaboStopNumber,
  type MarkerShape,
} from '../markers.ts'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'markers')
const fontFile = join(here, '..', '..', 'fonts', `${fontFamilies.DMSans[700].token}.ttf`)
const require = createRequire(import.meta.url)
const wasmDir = dirname(require.resolve('canvaskit-wasm/bin/canvaskit.wasm'))

/** The ring or outline that keeps a marker apart from the map under it, in points. */
const outline = 2

type Draw = {
  readonly ck: CanvasKit
  readonly canvas: Canvas
  readonly fill: (hex: string) => Paint
  readonly font: Font
  readonly mode: ColorMode
  readonly stop: CollaboStopNumber | undefined
}

/** A closed polygon through the given points, as an immutable path. */
function polygon(ck: CanvasKit, points: readonly (readonly [number, number])[]) {
  const builder = new ck.PathBuilder()
  points.forEach(([x, y], index) => (index === 0 ? builder.moveTo(x, y) : builder.lineTo(x, y)))
  builder.close()
  const path = builder.detach()
  builder.delete()
  return path
}

function drawPickup({ canvas, fill, mode }: Draw) {
  const spec = markerSpecs.pickup
  const centre = spec.width / 2
  canvas.drawCircle(centre, centre, centre, fill(color[mode][spec.outline]))
  canvas.drawCircle(centre, centre, centre - outline - 1, fill(color[mode][spec.body]))
}

function drawDropoff({ ck, canvas, fill, mode }: Draw) {
  const spec = markerSpecs.dropoff
  const head = spec.width
  const centre = head / 2
  const tipOutline = polygon(ck, [
    [centre - 6, head - 3],
    [centre, spec.height],
    [centre + 6, head - 3],
  ])
  const tip = polygon(ck, [
    [centre - 4, head - 3],
    [centre, spec.height - outline],
    [centre + 4, head - 3],
  ])
  canvas.drawPath(tipOutline, fill(color[mode][spec.outline]))
  canvas.drawRRect(ck.RRectXY(ck.LTRBRect(0, 0, head, head), 6, 6), fill(color[mode][spec.outline]))
  canvas.drawPath(tip, fill(color[mode][spec.body]))
  canvas.drawRRect(
    ck.RRectXY(ck.LTRBRect(outline, outline, head - outline, head - outline), 4, 4),
    fill(color[mode][spec.body]),
  )
  const inner = centre - 4
  canvas.drawRect(ck.LTRBRect(inner, inner, head - inner, head - inner), fill(color[mode][spec.detail]))
  tipOutline.delete()
  tip.delete()
}

function drawCar({ ck, canvas, fill, mode }: Draw) {
  const spec = markerSpecs.car
  const { width: w, height: h } = spec
  canvas.drawRRect(ck.RRectXY(ck.LTRBRect(0, 0, w, h), 6, 6), fill(color[mode][spec.outline]))
  canvas.drawRRect(ck.RRectXY(ck.LTRBRect(1.5, 1.5, w - 1.5, h - 1.5), 5, 5), fill(color[mode][spec.body]))
  const windows = fill(color[mode][spec.detail])
  // Windscreen at the front (top of the bitmap, so heading 0 points north), rear window behind.
  canvas.drawRRect(ck.RRectXY(ck.LTRBRect(3.5, 7, w - 3.5, 12), 1.5, 1.5), windows)
  canvas.drawRRect(ck.RRectXY(ck.LTRBRect(3.5, h - 9, w - 3.5, h - 5.5), 1.5, 1.5), windows)
}

function drawCollaboStop({ ck, canvas, fill, font, mode, stop }: Draw) {
  const spec = markerSpecs.collaboStop
  const head = spec.width
  const centre = head / 2
  const tipOutline = polygon(ck, [
    [centre - 7, head - 4],
    [centre, spec.height],
    [centre + 7, head - 4],
  ])
  const tip = polygon(ck, [
    [centre - 5, head - 5],
    [centre, spec.height - outline - 0.5],
    [centre + 5, head - 5],
  ])
  canvas.drawPath(tipOutline, fill(color[mode][spec.outline]))
  canvas.drawCircle(centre, centre, centre, fill(color[mode][spec.outline]))
  canvas.drawPath(tip, fill(color[mode][spec.body]))
  canvas.drawCircle(centre, centre, centre - outline, fill(color[mode][spec.body]))
  const label = String(stop ?? 1)
  const glyphs = font.getGlyphIDs(label)
  const width = font.getGlyphWidths(glyphs).reduce((sum, value) => sum + value, 0)
  const bounds = font.getGlyphBounds(glyphs)
  const top = bounds[1] ?? 0
  const bottom = bounds[3] ?? 0
  canvas.drawText(label, centre - width / 2, centre - (top + bottom) / 2, fill(color[mode][spec.detail]), font)
  tipOutline.delete()
  tip.delete()
}

const painters: Readonly<Record<MarkerShape, (draw: Draw) => void>> = {
  pickup: drawPickup,
  dropoff: drawDropoff,
  car: drawCar,
  collaboStop: drawCollaboStop,
}

async function main() {
  const ck = await CanvasKitInit({ locateFile: (file) => join(wasmDir, file) })
  const fontData = await readFile(fontFile)
  const typeface = ck.Typeface.MakeTypefaceFromData(
    fontData.buffer.slice(fontData.byteOffset, fontData.byteOffset + fontData.byteLength),
  )
  if (!typeface) throw new Error(`Could not read ${fontFile}`)
  const font = new ck.Font(typeface, type.footnote.size)
  await mkdir(outDir, { recursive: true })

  const paints: Paint[] = []
  const fill = (hex: string) => {
    const paint = new ck.Paint()
    paint.setAntiAlias(true)
    paint.setStyle(ck.PaintStyle.Fill)
    paint.setColor(ck.parseColorString(hex))
    paints.push(paint)
    return paint
  }

  let written = 0
  for (const { file, shape, mode, stop } of markerFiles()) {
    const spec = markerSpecs[shape]
    for (const scale of markerScales) {
      const surface = ck.MakeSurface(spec.width * scale, spec.height * scale)
      if (!surface) throw new Error(`Could not make a ${spec.width * scale} by ${spec.height * scale} surface`)
      const canvas = surface.getCanvas()
      canvas.clear(ck.TRANSPARENT)
      canvas.scale(scale, scale)
      painters[shape]({ ck, canvas, fill, font, mode, stop })
      const image = surface.makeImageSnapshot()
      const png = image.encodeToBytes()
      if (!png) throw new Error(`Could not encode ${file}`)
      await writeFile(join(outDir, scaledFileName(file, scale)), png)
      image.delete()
      surface.delete()
      written += 1
    }
  }
  for (const paint of paints) paint.delete()
  font.delete()
  typeface.delete()
  console.log(`Wrote ${written} marker bitmaps to ${outDir}`)
}

await main()
