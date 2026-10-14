// Package server is the HTTP shell every route mounts on: request id,
// health, the error shape, and the signed context check.
package server

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"collaboride/dispatch/internal/ctxsig"
)

type ErrorBody struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	RetryAfter *int   `json:"retryAfter,omitempty"`
}

func WriteJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func WriteError(w http.ResponseWriter, status int, code, message string) {
	WriteJSON(w, status, ErrorBody{Code: code, Message: message})
}

func newRequestID() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

// New builds the service handler. routes registers the service's own routes,
// which all require a valid gateway signed context.
func New(serviceName, contextKey string, routes func(mux *http.ServeMux)) http.Handler {
	protected := http.NewServeMux()
	if routes != nil {
		routes(protected)
	}
	protected.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		WriteError(w, http.StatusNotFound, "NOT_FOUND", "Route not found")
	})

	root := http.NewServeMux()
	root.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		WriteJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": serviceName})
	})
	root.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, err := ctxsig.Verify(r.Header, contextKey, time.Now()); err != nil {
			WriteError(w, http.StatusUnauthorized, "BAD_CONTEXT", err.Error())
			return
		}
		protected.ServeHTTP(w, r)
	}))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get(ctxsig.HeaderRequestID)
		if id == "" || len(id) > 128 {
			id = newRequestID()
			r.Header.Set(ctxsig.HeaderRequestID, id)
		}
		w.Header().Set(ctxsig.HeaderRequestID, id)
		root.ServeHTTP(w, r)
	})
}
