// Package migrations holds dispatch's goose migrations, embedded in the binary.
package migrations

import "embed"

// FS holds every migration file, applied in name order.
//
//go:embed *.sql
var FS embed.FS
