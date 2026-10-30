// The location value object and the hex EWKB Postgres returns for
// geography(Point,4326) (spec 0010, Points).
import { describe, expect, it } from 'vitest'
import { AppError } from '../errors'
import { parseEwkbPoint, toPoint } from './point'

/** Hex EWKB for a point, in either byte order, with or without the SRID. */
function ewkb(lng: number, lat: number, { le = true, srid = 4326 as number | null } = {}): string {
  const buf = Buffer.alloc(srid === null ? 21 : 25)
  buf.writeUInt8(le ? 1 : 0, 0)
  const type = srid === null ? 1 : 1 | 0x20000000
  let at = 5
  if (le) buf.writeUInt32LE(type, 1)
  else buf.writeUInt32BE(type, 1)
  if (srid !== null) {
    if (le) buf.writeUInt32LE(srid, 5)
    else buf.writeUInt32BE(srid, 5)
    at = 9
  }
  if (le) {
    buf.writeDoubleLE(lng, at)
    buf.writeDoubleLE(lat, at + 8)
  } else {
    buf.writeDoubleBE(lng, at)
    buf.writeDoubleBE(lat, at + 8)
  }
  return buf.toString('hex')
}

describe('toPoint', () => {
  it('builds a frozen point from valid degrees', () => {
    const p = toPoint(3.3792, 6.5244)
    expect(p).toEqual({ lng: 3.3792, lat: 6.5244 })
    expect(Object.isFrozen(p)).toBe(true)
  })

  it('accepts the exact limits', () => {
    expect(toPoint(-180, -90)).toEqual({ lng: -180, lat: -90 })
    expect(toPoint(180, 90)).toEqual({ lng: 180, lat: 90 })
  })

  it.each([
    ['longitude past 180', 180.0001, 0],
    ['longitude below -180', -181, 0],
    ['latitude past 90', 0, 90.5],
    ['latitude below -90', 0, -91],
    ['a NaN longitude', Number.NaN, 0],
    ['an infinite latitude', 0, Number.POSITIVE_INFINITY],
  ])('rejects %s with a 400 invalid_point', (_name, lng, lat) => {
    let caught: unknown
    try {
      toPoint(lng, lat)
    } catch (err) {
      caught = err
    }
    expect(caught).toBeInstanceOf(AppError)
    expect(caught).toMatchObject({ status: 400, code: 'invalid_point' })
  })
})

describe('parseEwkbPoint', () => {
  it('reads little endian EWKB with an SRID, as Postgres returns it', () => {
    expect(parseEwkbPoint(ewkb(3.3792, 6.5244))).toEqual({ lng: 3.3792, lat: 6.5244 })
  })

  it('reads big endian EWKB', () => {
    expect(parseEwkbPoint(ewkb(-0.1276, 51.5072, { le: false }))).toEqual({ lng: -0.1276, lat: 51.5072 })
  })

  it('reads plain WKB without an SRID', () => {
    expect(parseEwkbPoint(ewkb(3.3515, 6.6018, { srid: null }))).toEqual({ lng: 3.3515, lat: 6.6018 })
  })

  it('reads upper case hex', () => {
    expect(parseEwkbPoint(ewkb(3.3792, 6.5244).toUpperCase())).toEqual({ lng: 3.3792, lat: 6.5244 })
  })

  it('rejects geometry that is not a point', () => {
    const line = ewkb(0, 0)
    // type 2 (LineString) with the SRID flag
    const notPoint = `${line.slice(0, 2)}02000020${line.slice(10)}`
    expect(() => parseEwkbPoint(notPoint)).toThrow(/Expected a WKB point/)
  })

  it('rejects coordinates out of range, through the value object', () => {
    expect(() => parseEwkbPoint(ewkb(200, 0))).toThrow(AppError)
  })
})
