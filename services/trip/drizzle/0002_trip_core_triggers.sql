-- What drizzle-kit cannot express for the trip core (spec 0010.2): the
-- updated_at triggers and the column comments that mark ids owned by another
-- service (never a foreign key across schemas).

CREATE TRIGGER ride_requests_set_updated_at BEFORE UPDATE ON trip.ride_requests
  FOR EACH ROW EXECUTE FUNCTION trip.set_updated_at();
CREATE TRIGGER offers_set_updated_at BEFORE UPDATE ON trip.offers
  FOR EACH ROW EXECUTE FUNCTION trip.set_updated_at();
CREATE TRIGGER trips_set_updated_at BEFORE UPDATE ON trip.trips
  FOR EACH ROW EXECUTE FUNCTION trip.set_updated_at();
CREATE TRIGGER trip_riders_set_updated_at BEFORE UPDATE ON trip.trip_riders
  FOR EACH ROW EXECUTE FUNCTION trip.set_updated_at();

COMMENT ON COLUMN trip.ride_requests.rider_id IS 'ref accounts.users';
COMMENT ON COLUMN trip.ride_requests.payment_method_id IS 'ref payments.payment_methods';
COMMENT ON COLUMN trip.offers.driver_id IS 'ref accounts.users';
COMMENT ON COLUMN trip.offers.vehicle_id IS 'ref accounts.vehicles';
COMMENT ON COLUMN trip.trips.driver_id IS 'ref accounts.users';
COMMENT ON COLUMN trip.trips.vehicle_id IS 'ref accounts.vehicles';
COMMENT ON COLUMN trip.trip_riders.rider_id IS 'ref accounts.users';
COMMENT ON COLUMN trip.trip_riders.pin IS 'readable only through the rider''s own view (src/db/views.ts)';
