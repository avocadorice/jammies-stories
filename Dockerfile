FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY main.go ./
RUN go build -o jammies-stories .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/jammies-stories .
COPY templates/ templates/
COPY static/ static/
RUN mkdir -p data
EXPOSE 8080
CMD ["./jammies-stories"]
