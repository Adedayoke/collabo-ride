import { sql } from 'drizzle-orm'
import { customType } from 'drizzle-orm/pg-core'
import { AppError } from '../errors'

/** A location on the earth, in WGS 84 degrees. Immutable, checked on construction. */
export interface Point {
  readonly lng: number
  readonly lat: number
}

export function toPoint(lng: number, lat: number): Point {
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new AppError(400, 'invalid_point', 'Longitude must be between -180 and 180')
  }
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new AppError(400, 'invalid_point', 'Latitude must be between -90 and 90')
  }
  return Object.freeze({ lng, lat })
}

const WKB_POINT = 1
const EWKB_SRID_FLAG = 0x20000000

/**
 * Postgres returns geography as hex EWKB. A point is: byte order, type (with
 * the SRID flag), the SRID when flagged, then x and y as doubles.
 */
export function parseEwkbPoint(hex: string): Point {
  const buf = Buffer.from(hex, 'hex')
  const le = buf.readUInt8(0) === 1
  const type = le ? buf.readUInt32LE(1) : buf.readUInt32BE(1)
  if ((type & 0xffff) !== WKB_POINT) throw new Error(`Expected a WKB point, got type ${type}`)
  const offset = type & EWKB_SRID_FLAG ? 9 : 5
  const x = le ? buf.readDoubleLE(offset) : buf.readDoubleBE(offset)
  const y = le ? buf.readDoubleLE(offset + 8) : buf.readDoubleBE(offset + 8)
  return toPoint(x, y)
}

/** `geography(Point,4326)` column (spec 0010, Points). */
export const geographyPoint = customType<{ data: Point; driverData: string }>({
  dataType: () => 'geography(Point,4326)',
  toDriver: (p) => sql`ST_SetSRID(ST_MakePoint(${p.lng}, ${p.lat}), 4326)::geography`,
  fromDriver: parseEwkbPoint,
})
