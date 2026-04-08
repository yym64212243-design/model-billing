FROM golang:1.21-bookworm AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/gateway ./cmd/server

FROM debian:bookworm-slim AS runner
WORKDIR /app
COPY --from=builder /out/gateway /app/gateway
RUN mkdir -p /data
EXPOSE 8080
CMD ["/app/gateway"]
