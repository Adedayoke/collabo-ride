// Package ctxsig checks the gateway signed request context (spec 0009,
// Identity and trust). It must match the TS and Python implementations,
// which all test against packages/contracts/test-vectors/context-signature.json.
package ctxsig

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

const MaxSkew = 30 * time.Second

const (
	HeaderUserID        = "X-User-Id"
	HeaderRole          = "X-User-Role"
	HeaderPhoneVerified = "X-Phone-Verified"
	HeaderRequestID     = "X-Request-Id"
	HeaderTimestamp     = "X-Ctx-Ts"
	HeaderSignature     = "X-Ctx-Sig"
)

var roles = map[string]bool{"rider": true, "driver": true, "staff": true, "system": true}

var digits = regexp.MustCompile(`^\d+$`)

type Context struct {
	UserID        string
	Role          string
	PhoneVerified bool
	RequestID     string
	Timestamp     int64
}

func Payload(c Context) string {
	return strings.Join([]string{c.UserID, c.Role, strconv.FormatBool(c.PhoneVerified), c.RequestID, strconv.FormatInt(c.Timestamp, 10)}, "|")
}

// Sign returns the hex HMAC SHA256 of uid|role|phoneVerified|reqId|ts.
func Sign(c Context, key string) string {
	m := hmac.New(sha256.New, []byte(key))
	m.Write([]byte(Payload(c)))
	return hex.EncodeToString(m.Sum(nil))
}

// Verify checks the context headers. now is the current time.
func Verify(h http.Header, key string, now time.Time) (Context, error) {
	uid, role, pv := h.Get(HeaderUserID), h.Get(HeaderRole), h.Get(HeaderPhoneVerified)
	reqID, ts, sig := h.Get(HeaderRequestID), h.Get(HeaderTimestamp), h.Get(HeaderSignature)
	if uid == "" || role == "" || pv == "" || reqID == "" || ts == "" || sig == "" {
		return Context{}, errors.New("missing context headers")
	}
	if !roles[role] {
		return Context{}, errors.New("unknown role")
	}
	if pv != "true" && pv != "false" {
		return Context{}, errors.New("bad phone verified flag")
	}
	if !digits.MatchString(ts) {
		return Context{}, errors.New("bad timestamp")
	}
	t, err := strconv.ParseInt(ts, 10, 64)
	if err != nil {
		return Context{}, errors.New("bad timestamp")
	}
	c := Context{UserID: uid, Role: role, PhoneVerified: pv == "true", RequestID: reqID, Timestamp: t}
	skew := now.Unix() - t
	if skew < 0 {
		skew = -skew
	}
	if skew > int64(MaxSkew/time.Second) {
		return Context{}, errors.New("stale timestamp")
	}
	given, err := hex.DecodeString(sig)
	if err != nil {
		return Context{}, errors.New("bad signature")
	}
	expected, _ := hex.DecodeString(Sign(c, key))
	if !hmac.Equal(given, expected) {
		return Context{}, errors.New("bad signature")
	}
	return c, nil
}
