import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { color, colorModes, contrastMinimum, contrastRatio } from '../tokens/index.ts'
import { markerFiles, markerScales, markerShapes, markerSpecs, scaledFileName } from './markers.ts'
import { mapStyles, mapSurfaceColors } from './styles.ts'

const markersDir = join(dirname(fileURLToPath(import.meta.url)), 'markers')

describe('map markers reach 3:1 on their style (AC-9)', () => {
  for (const mode of colorModes) {
    const surfaces = mapSurfaceColors(mapStyles[mode])

    it(`${mode}: the style paints land, roads, and water`, () => {
      const kinds = new Set(surfaces.map(({ surface }) => surface))
      expect([...kinds].toSorted()).toEqual(['land', 'road', 'water'])
    })

    for (const shape of markerShapes) {
      const body = color[mode][markerSpecs[shape].body]
      for (const { surface, color: mapColor } of surfaces) {
        it(`${mode}: ${shape} (${body}) on ${surface} ${mapColor}`, () => {
          expect(contrastRatio(body, mapColor)).toBeGreaterThanOrEqual(contrastMinimum.nonText)
        })
      }
    }
  }

  it('fails a marker drawn in a color too close to the land', () => {
    expect(contrastRatio('#D6D6CF', color.light.surfaceSunken)).toBeLessThan(contrastMinimum.nonText)
  })
})

describe('map styles', () => {
  for (const mode of colorModes) {
    it(`${mode}: business labels are off`, () => {
      const rule = mapStyles[mode].find((entry) => entry.featureType === 'poi.business')
      expect(rule?.stylers).toContainEqual({ visibility: 'off' })
    })
  }
})

describe('marker bitmaps', () => {
  for (const { file } of markerFiles()) {
    for (const scale of markerScales) {
      const name = scaledFileName(file, scale)
      it(`${name} exists (run ui:markers after a token change)`, () => {
        expect(existsSync(join(markersDir, name))).toBe(true)
      })
    }
  }
})
