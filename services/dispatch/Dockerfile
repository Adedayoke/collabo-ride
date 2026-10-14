# Go: static binary on a distroless image, non root (spec 0009, Containers).
FROM golang:1.27 AS build
WORKDIR /src
COPY services/dispatch/go.mod services/dispatch/go.sum ./
RUN go mod download
COPY services/dispatch/ .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/dispatch ./cmd/dispatch

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/dispatch /dispatch
USER nonroot:nonroot
EXPOSE 8083
ENTRYPOINT ["/dispatch"]
