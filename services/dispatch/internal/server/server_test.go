package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strconv"
	"strings"
	"testing"
	"time"

	"collaboride/dispatch/internal/ctxsig"
)

const key = "test-gateway-context-key-0123456789abcdef"

var uuidV4 = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

func newHandler() http.Handler {
	return New("dispatch", key, func(mux *http.ServeMux) {
		mux.HandleFunc("GET /whoami", func(w http.ResponseWriter, r *http.Request) {
			WriteJSON(w, http.StatusOK, map[string]string{"requestId": r.Header.Get(ctxsig.HeaderRequestID)})
		})
	})
}

func signedHeaders(c ctxsig.Context, signKey string) http.Header {
	h := http.Header{}
	h.Set(ctxsig.HeaderUserID, c.UserID)
	h.Set(ctxsig.HeaderRole, c.Role)
	h.Set(ctxsig.HeaderPhoneVerified, strconv.FormatBool(c.PhoneVerified))
	h.Set(ctxsig.HeaderRequestID, c.RequestID)
	h.Set(ctxsig.HeaderTimestamp, strconv.FormatInt(c.Timestamp, 10))
	h.Set(ctxsig.HeaderSignature, ctxsig.Sign(c, signKey))
	return h
}

func freshContext() ctxsig.Context {
	return ctxsig.Context{UserID: "usr_1", Role: "driver", PhoneVerified: true, RequestID: "req-go-1", Timestamp: time.Now().Unix()}
}

func do(t *testing.T, method, path string, h http.Header) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, nil)
	for k, v := range h {
		req.Header[k] = v
	}
	rec := httptest.NewRecorder()
	newHandler().ServeHTTP(rec, req)
	return rec
}

func decode(t *testing.T, rec *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("body is not JSON: %q", rec.Body.String())
	}
	return body
}

func TestHealth_IsOpenAndNamesTheService(t *testing.T) {
	rec := do(t, http.MethodGet, "/health", nil)

	if rec.Code != http.StatusOK {
		t.Fatalf("status: got %d want 200", rec.Code)
	}
	body := decode(t, rec)
	if body["status"] != "ok" || body["service"] != "dispatch" {
		t.Errorf("unexpected body: %v", body)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("content type: got %q", ct)
	}
}

func TestRequestID_GeneratedWhenMissing(t *testing.T) {
	rec := do(t, http.MethodGet, "/health", nil)

	if id := rec.Header().Get(ctxsig.HeaderRequestID); !uuidV4.MatchString(id) {
		t.Errorf("expected a v4 uuid request id, got %q", id)
	}
}

func TestRequestID_EchoedWhenGiven(t *testing.T) {
	h := http.Header{}
	h.Set(ctxsig.HeaderRequestID, "trace-me-123")

	rec := do(t, http.MethodGet, "/health", h)

	if got := rec.Header().Get(ctxsig.HeaderRequestID); got != "trace-me-123" {
		t.Errorf("got %q want trace-me-123", got)
	}
}

func TestRequestID_ReplacedWhenLongerThan128(t *testing.T) {
	h := http.Header{}
	h.Set(ctxsig.HeaderRequestID, strings.Repeat("x", 129))

	rec := do(t, http.MethodGet, "/health", h)

	if id := rec.Header().Get(ctxsig.HeaderRequestID); !uuidV4.MatchString(id) {
		t.Errorf("expected a fresh uuid, got %q", id)
	}
}

func TestProtectedRoute_RejectsMissingContext(t *testing.T) {
	rec := do(t, http.MethodGet, "/anything", nil)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status: got %d want 401", rec.Code)
	}
	body := decode(t, rec)
	if body["code"] != "BAD_CONTEXT" || body["message"] != "missing context headers" {
		t.Errorf("unexpected body: %v", body)
	}
	if rec.Header().Get(ctxsig.HeaderRequestID) == "" {
		t.Error("a rejected request should still carry a request id")
	}
}

func TestProtectedRoute_RejectsForgedContext(t *testing.T) {
	cases := map[string]http.Header{
		"wrong key": signedHeaders(freshContext(), "another-key-that-is-long-enough-000000"),
		"role changed": func() http.Header {
			h := signedHeaders(freshContext(), key)
			h.Set(ctxsig.HeaderRole, "staff")
			return h
		}(),
		"stale": signedHeaders(ctxsig.Context{UserID: "usr_1", Role: "driver", PhoneVerified: true, RequestID: "r",
			Timestamp: time.Now().Add(-2 * time.Minute).Unix()}, key),
	}
	for name, h := range cases {
		t.Run(name, func(t *testing.T) {
			rec := do(t, http.MethodGet, "/whoami", h)

			if rec.Code != http.StatusUnauthorized || decode(t, rec)["code"] != "BAD_CONTEXT" {
				t.Errorf("got %d %s, want 401 BAD_CONTEXT", rec.Code, rec.Body.String())
			}
		})
	}
}

func TestProtectedRoute_AcceptsValidContext(t *testing.T) {
	rec := do(t, http.MethodGet, "/whoami", signedHeaders(freshContext(), key))

	if rec.Code != http.StatusOK {
		t.Fatalf("status: got %d want 200 (%s)", rec.Code, rec.Body.String())
	}
	if decode(t, rec)["requestId"] != "req-go-1" {
		t.Errorf("route should see the caller request id: %s", rec.Body.String())
	}
}

func TestUnknownRoute_NotFoundInErrorShape(t *testing.T) {
	rec := do(t, http.MethodGet, "/nope", signedHeaders(freshContext(), key))

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status: got %d want 404", rec.Code)
	}
	body := decode(t, rec)
	if body["code"] != "NOT_FOUND" || body["message"] != "Route not found" {
		t.Errorf("unexpected body: %v", body)
	}
	if _, ok := body["retryAfter"]; ok {
		t.Error("retryAfter should be omitted when unset")
	}
}

func TestHealth_OnlyGETIsPublic(t *testing.T) {
	rec := do(t, http.MethodPost, "/health", nil)

	if rec.Code != http.StatusUnauthorized || decode(t, rec)["code"] != "BAD_CONTEXT" {
		t.Errorf("POST /health without context: got %d %s, want 401 BAD_CONTEXT", rec.Code, rec.Body.String())
	}
}

func TestWriteError_IncludesRetryAfterOnlyWhenSet(t *testing.T) {
	rec := httptest.NewRecorder()
	secs := 7
	WriteJSON(rec, http.StatusTooManyRequests, ErrorBody{Code: "RATE_LIMITED", Message: "Slow down", RetryAfter: &secs})

	body := decode(t, rec)
	if body["retryAfter"] != float64(7) {
		t.Errorf("retryAfter: got %v want 7", body["retryAfter"])
	}
}
