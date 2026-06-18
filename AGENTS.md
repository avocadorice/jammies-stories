# jammies-stories

## Goal
Jammy's Book Tracker — a reading log for Preston and Blaire tracking books from the "Team Unihorn and Woolly" series and beyond.

## Stack
- Backend: Go (stdlib only — `net/http`, `html/template`, `encoding/json`)
- Frontend: HTML5, Vanilla CSS3, Vanilla JS (ES6), FontAwesome icons
- Storage: JSON file at `data/books.json` (persistent volume on Fly.io)
- Deployment: Fly.io (`fly.toml` + `Dockerfile`)

## Running locally
```
go run main.go
# open http://localhost:8080
```

## Deploying to Fly.io
```
fly launch        # first time — creates the app and volume
fly deploy        # subsequent deploys
```

The `fly.toml` mounts a persistent volume at `/app/data` so book data survives redeploys.

## Project structure
```
main.go           — Go HTTP server + REST API
templates/        — HTML template served at /
static/           — CSS + assets served at /static/
  style.css
  assets/
data/             — Runtime JSON storage (gitignored in production)
Dockerfile
fly.toml
```

## API
- `GET  /api/books?kid=Preston` — returns []Book for a kid
- `POST /api/books?kid=Preston` — saves full []Book list for a kid
- `GET  /api/backup`            — downloads full data as JSON
- `POST /api/restore`           — restores full data from JSON upload

## Kids
- **Preston** — born July 20, 2019
- **Blaire**  — born Aug 9, 2024
