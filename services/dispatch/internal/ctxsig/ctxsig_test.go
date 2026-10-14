package ctxsig

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"
)

type vector struct {
	Name          string `json:"name"`
	UID           string `json:"uid"`
	Role          string `json:"role"`
	PhoneVerified bool   `json:"phoneVerified"`
	ReqID         string `json:"reqId"`
	TS            int64  `json:"ts"`
	Sig           string `json:"sig"`
	Key           string `json:"key"`
}

type vectors struct {
	Key     string   `json:"key"`
	Valid   []vector `json:"valid"`
	Invalid []vector `json:"invalid"`
}

func load(t *testing.T) vectors {
	t.Helper()
	raw, err := os.ReadFile("../../../../packages/contracts/test-vectors/context-signature.json")
	if err != nil {
		t.Fatal(err)
	}
	var v vectors
	if err := json.Unmarshal(raw, &v); err != nil {
		t.Fatal(err)
	}
	return v
}

func headers(v vector, sig string) http.Header {
	h := http.Header{}
	h.Set(HeaderUserID, v.UID)
	h.Set(HeaderRole, v.Role)
	h.Set(HeaderPhoneVerified, strconv.FormatBool(v.PhoneVerified))
	h.Set(HeaderRequestID, v.ReqID)
	h.Set(HeaderTimestamp, strconv.FormatInt(v.TS, 10))
	h.Set(HeaderSignature, sig)
	return h
}

func TestSignMatchesVectors(t *testing.T) {
	v := load(t)
	for _, c := range v.Valid {
		got := Sign(Context{c.UID, c.Role, c.PhoneVerified, c.ReqID, c.TS}, v.Key)
		if got != c.Sig {
			t.Errorf("%s: got %s want %s", c.UID, got, c.Sig)
		}
		if _, err := Verify(headers(c, c.Sig), v.Key, time.Unix(c.TS, 0)); err != nil {
			t.Errorf("%s: verify failed: %v", c.UID, err)
		}
	}
}

func TestRejectsInvalidVectors(t *testing.T) {
	v := load(t)
	for _, c := range v.Invalid {
		key := v.Key
		if c.Key != "" {
			key = c.Key
		}
		if _, err := Verify(headers(c, c.Sig), key, time.Unix(c.TS, 0)); err == nil {
			t.Errorf("%s: expected rejection", c.Name)
		}
	}
}

func TestRejectsStaleTimestamp(t *testing.T) {
	v := load(t)
	c := v.Valid[0]
	if _, err := Verify(headers(c, c.Sig), v.Key, time.Unix(c.TS+31, 0)); err == nil {
		t.Error("expected stale timestamp rejection")
	}
	if _, err := Verify(headers(c, c.Sig), v.Key, time.Unix(c.TS-30, 0)); err != nil {
		t.Errorf("30 seconds of skew should pass: %v", err)
	}
}

func TestVerify_MalformedHeaders(t *testing.T) {
	v := load(t)
	c := v.Valid[0]
	cases := []struct {
		name, header, value, want string
	}{
		{"missing user id", HeaderUserID, "", "missing context headers"},
		{"missing signature", HeaderSignature, "", "missing context headers"},
		{"unknown role", HeaderRole, "admin", "unknown role"},
		{"upper case flag", HeaderPhoneVerified, "TRUE", "bad phone verified flag"},
		{"numeric flag", HeaderPhoneVerified, "1", "bad phone verified flag"},
		{"negative timestamp", HeaderTimestamp, "-1760400000", "bad timestamp"},
		{"fractional timestamp", HeaderTimestamp, "1760400000.5", "bad timestamp"},
		{"overflowing timestamp", HeaderTimestamp, "99999999999999999999", "bad timestamp"},
		{"non hex signature", HeaderSignature, strings.Repeat("z", 64), "bad signature"},
		{"trailing non hex", HeaderSignature, c.Sig + "zz", "bad signature"},
		{"odd nibble", HeaderSignature, c.Sig + "0", "bad signature"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			h := headers(c, c.Sig)
			if tc.value == "" {
				h.Del(tc.header)
			} else {
				h.Set(tc.header, tc.value)
			}

			_, err := Verify(h, v.Key, time.Unix(c.TS, 0))
			if err == nil || err.Error() != tc.want {
				t.Errorf("got %v want %q", err, tc.want)
			}
		})
	}
}

func TestVerify_AcceptsUpperCaseHex(t *testing.T) {
	v := load(t)
	c := v.Valid[0]

	if _, err := Verify(headers(c, strings.ToUpper(c.Sig)), v.Key, time.Unix(c.TS, 0)); err != nil {
		t.Errorf("upper case hex should verify, as in TS and Python: %v", err)
	}
}

func TestVerify_ReturnsTheSignedContext(t *testing.T) {
	v := load(t)
	c := v.Valid[1]

	got, err := Verify(headers(c, c.Sig), v.Key, time.Unix(c.TS, 0))
	if err != nil {
		t.Fatal(err)
	}
	want := Context{UserID: c.UID, Role: c.Role, PhoneVerified: c.PhoneVerified, RequestID: c.ReqID, Timestamp: c.TS}
	if got != want {
		t.Errorf("got %+v want %+v", got, want)
	}
}
