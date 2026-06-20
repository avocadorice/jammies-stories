package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const dataFile = "data/books.json"

type ReadingSession struct {
	Date    string `json:"date"`
	Minutes int    `json:"minutes"`
}

type Book struct {
	ID           string           `json:"id"`
	Title        string           `json:"title"`
	Author       string           `json:"author"`
	TotalPages   int              `json:"totalPages"`
	CurrentPage  int              `json:"currentPage"`
	Cover        string           `json:"cover"`
	Status       string           `json:"status"`
	StartDate    string           `json:"startDate"`
	FinishDate   string           `json:"finishDate,omitempty"`
	Rating       int              `json:"rating,omitempty"`
	Review       string           `json:"review,omitempty"`
	Sessions     []ReadingSession `json:"sessions,omitempty"`
	WordsPerPage int              `json:"wordsPerPage,omitempty"`
	TimesRead    int              `json:"timesRead,omitempty"`
}

type AppData struct {
	Kids map[string][]Book `json:"kids"`
}

var (
	mu      sync.RWMutex
	appData AppData
	tmpl    *template.Template
)

func defaultAppData() AppData {
	today := time.Now().Format("2006-01-02")
	return AppData{
		Kids: map[string][]Book{
			"Preston": {
				{
					ID:          "default-unihorn-preston",
					Title:       "Team Unihorn and Woolly",
					Author:      "A. Wakewood",
					TotalPages:  40,
					CurrentPage: 0,
					Cover:       "/static/assets/team_unicorn.jpg",
					Status:      "reading",
					StartDate:   today,
				},
			},
			"Blaire": {
				{
					ID:          "default-unihorn-blaire",
					Title:       "Team Unihorn and Woolly",
					Author:      "A. Wakewood",
					TotalPages:  40,
					CurrentPage: 0,
					Cover:       "/static/assets/team_unicorn.jpg",
					Status:      "reading",
					StartDate:   today,
				},
			},
		},
	}
}

func loadData() {
	b, err := os.ReadFile(dataFile)
	if err != nil {
		appData = defaultAppData()
		if err := saveDataLocked(); err != nil {
			log.Printf("Warning: could not save default data: %v", err)
		}
		return
	}
	if err := json.Unmarshal(b, &appData); err != nil {
		log.Printf("Warning: could not parse data file, resetting to defaults: %v", err)
		appData = defaultAppData()
		return
	}
	// Backfill: a finished book has been read at least once.
	migrated := false
	for kid, books := range appData.Kids {
		for i := range books {
			if books[i].Status == "finished" && books[i].TimesRead == 0 {
				books[i].TimesRead = 1
				migrated = true
			}
		}
		appData.Kids[kid] = books
	}
	if migrated {
		if err := saveDataLocked(); err != nil {
			log.Printf("Warning: could not save migrated data: %v", err)
		}
	}
}

func saveDataLocked() error {
	if err := os.MkdirAll(filepath.Dir(dataFile), 0755); err != nil {
		return err
	}
	b, err := json.MarshalIndent(appData, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(dataFile, b, 0644)
}

func handleBooks(w http.ResponseWriter, r *http.Request) {
	kid := r.URL.Query().Get("kid")
	if kid == "" {
		http.Error(w, `{"error":"kid parameter required"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		mu.RLock()
		books := appData.Kids[kid]
		mu.RUnlock()
		if books == nil {
			books = []Book{}
		}
		json.NewEncoder(w).Encode(books)

	case http.MethodPost:
		body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
		if err != nil {
			http.Error(w, `{"error":"read failed"}`, http.StatusBadRequest)
			return
		}
		var books []Book
		if err := json.Unmarshal(body, &books); err != nil {
			http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
			return
		}

		mu.Lock()
		if appData.Kids == nil {
			appData.Kids = make(map[string][]Book)
		}
		appData.Kids[kid] = books
		err = saveDataLocked()
		mu.Unlock()

		if err != nil {
			http.Error(w, `{"error":"save failed"}`, http.StatusInternalServerError)
			return
		}
		fmt.Fprint(w, `{"ok":true}`)

	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

func handleBackup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	mu.RLock()
	b, err := json.MarshalIndent(appData, "", "  ")
	mu.RUnlock()
	if err != nil {
		http.Error(w, "backup failed", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", `attachment; filename="jammies_backup.json"`)
	w.Write(b)
}

func handleRestore(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	body, err := io.ReadAll(io.LimitReader(r.Body, 5<<20))
	if err != nil {
		http.Error(w, `{"error":"read failed"}`, http.StatusBadRequest)
		return
	}
	var newData AppData
	if err := json.Unmarshal(body, &newData); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	mu.Lock()
	appData = newData
	err = saveDataLocked()
	mu.Unlock()

	if err != nil {
		http.Error(w, `{"error":"save failed"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, `{"ok":true}`)
}

func main() {
	loadData()

	var err error
	tmpl, err = template.ParseFiles("templates/index.html")
	if err != nil {
		log.Fatalf("Failed to parse template: %v", err)
	}

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	http.HandleFunc("/api/books", handleBooks)
	http.HandleFunc("/api/backup", handleBackup)
	http.HandleFunc("/api/restore", handleRestore)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		if err := tmpl.Execute(w, nil); err != nil {
			log.Printf("Template render error: %v", err)
		}
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Jammy's Book Tracker starting on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
