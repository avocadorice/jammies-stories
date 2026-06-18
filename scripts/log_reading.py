#!/usr/bin/env python3
import sys
import os
import json
import argparse
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime
import socket

PORT = os.environ.get("PORT", "8080")
API_URL = f"http://localhost:{PORT}/api/books"
DATA_FILE = "data/books.json"

def is_server_running():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.3)
            s.connect(("localhost", int(PORT)))
            return True
    except Exception:
        return False

def get_books(kid):
    if is_server_running():
        try:
            url = f"{API_URL}?kid={urllib.parse.quote(kid)}"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            print(f"Warning: Failed to connect to server API ({e}). Falling back to local file.", file=sys.stderr)
    
    # fallback to file
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                data = json.load(f)
                return data.get("kids", {}).get(kid, [])
        except Exception as e:
            print(f"Error reading local data file: {e}", file=sys.stderr)
    return []

def save_books(kid, books):
    if is_server_running():
        try:
            url = f"{API_URL}?kid={urllib.parse.quote(kid)}"
            data = json.dumps(books).encode('utf-8')
            req = urllib.request.Request(
                url, 
                data=data, 
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req) as response:
                res = json.loads(response.read().decode('utf-8'))
                if res.get("ok"):
                    return True
        except Exception as e:
            print(f"Warning: Failed to save to server API ({e}). Falling back to local file write.", file=sys.stderr)
            
    # fallback/direct save to file
    try:
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        data = {"kids": {}}
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, "r") as f:
                    data = json.load(f)
            except Exception:
                pass
        
        if "kids" not in data:
            data["kids"] = {}
        data["kids"][kid] = books
        
        with open(DATA_FILE, "w") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving to local data file: {e}", file=sys.stderr)
        return False

def find_book(books, book_title):
    # Try exact match first (case-insensitive)
    for b in books:
        if b["title"].lower() == book_title.lower():
            return b
    # Try substring match
    for b in books:
        if book_title.lower() in b["title"].lower():
            return b
    return None

def handle_log(args):
    books = get_books(args.kid)
    book = find_book(books, args.book)
    
    date = args.date
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
        
    if not book:
        if not args.create_if_missing:
            print(f"Error: Book '{args.book}' not found in {args.kid}'s list.", file=sys.stderr)
            print("Use --create-if-missing to add it, or provide --author and --total-pages.", file=sys.stderr)
            sys.exit(1)
        
        # Create new book
        book_id = f"book-{int(datetime.now().timestamp() * 1000)}"
        book = {
            "id": book_id,
            "title": args.book,
            "author": args.author or "Unknown Author",
            "totalPages": args.total_pages,
            "currentPage": args.page or 0,
            "cover": args.cover or "/static/assets/team_unicorn.jpg",
            "status": "reading",
            "startDate": date,
            "sessions": []
        }
        books.append(book)
        print(f"Created new book entry: '{book['title']}' by {book['author']}")
        
    # Update book session
    if "sessions" not in book or book["sessions"] is None:
        book["sessions"] = []
        
    book["sessions"].append({
        "date": date,
        "minutes": args.minutes
    })
    
    # Update page progress
    if args.percentage is not None:
        book["currentPage"] = min(int(book["totalPages"] * (args.percentage / 100.0)), book["totalPages"])
        print(f"Updated page progress to {book['currentPage']} of {book['totalPages']} ({args.percentage}%)")
    elif args.page is not None:
        book["currentPage"] = min(args.page, book["totalPages"])
    else:
        # Estimate: 1 page per minute, capped at total pages
        prev_page = book["currentPage"]
        book["currentPage"] = min(book["currentPage"] + args.minutes, book["totalPages"])
        print(f"Estimated page progress: updated page from {prev_page} to {book['currentPage']} of {book['totalPages']} (based on +1 page/minute)")

    # Mark as finished if requested or if progress is complete
    if args.finish or book["currentPage"] >= book["totalPages"]:
        book["status"] = "finished"
        book["currentPage"] = book["totalPages"]
        book["finishDate"] = date
        book["rating"] = args.rating
        book["review"] = args.review or "Logged via CLI"
        print(f"Book '{book['title']}' completed! Marked as finished.")
    else:
        book["status"] = "reading"
        
    if save_books(args.kid, books):
        print(f"Successfully logged {args.minutes} minutes of reading for {args.kid} on '{book['title']}'!")
    else:
        print("Error: Failed to save changes.", file=sys.stderr)
        sys.exit(1)

def handle_add(args):
    books = get_books(args.kid)
    existing = find_book(books, args.book)
    if existing:
        print(f"Book '{args.book}' already exists in {args.kid}'s list.")
        sys.exit(0)
        
    date = datetime.now().strftime("%Y-%m-%d")
    book_id = f"book-{int(datetime.now().timestamp() * 1000)}"
    
    book = {
        "id": book_id,
        "title": args.book,
        "author": args.author or "Unknown Author",
        "totalPages": args.total_pages,
        "currentPage": 0,
        "cover": args.cover or "/static/assets/team_unicorn.jpg",
        "status": args.status,
        "startDate": date,
        "sessions": []
    }
    
    if args.status == "finished":
        book["currentPage"] = args.total_pages
        book["finishDate"] = date
        book["rating"] = 3
        book["review"] = "Added via CLI"
        
    books.append(book)
    if save_books(args.kid, books):
        print(f"Successfully added '{book['title']}' to {args.kid}'s list!")
    else:
        print("Error: Failed to save changes.", file=sys.stderr)
        sys.exit(1)

def make_progress_bar(current, total, active_char="⭐", inactive_char="🌑"):
    if total <= 0:
        return ""
    pct = current / total
    filled = min(10, int(round(10 * pct)))
    return active_char * filled + inactive_char * (10 - filled)

def handle_list(args):
    books = get_books(args.kid)
    if not books:
        print(f"No books recorded for {args.kid}.")
        return
        
    reading = [b for b in books if b.get("status") == "reading"]
    finished = [b for b in books if b.get("status") == "finished"]
    
    print(f"=== {args.kid.upper()}'S READING LOG ===")
    
    print(f"\n--- Currently Reading ({len(reading)}) ---")
    for b in reading:
        mins = sum(s.get("minutes", 0) for s in b.get("sessions", []))
        curr = b.get("currentPage", 0)
        tot = b.get("totalPages", 1)
        pct = int((curr / tot) * 100)
        bar = make_progress_bar(curr, tot)
        print(f"📖 {b['title']} (by {b.get('author', 'Unknown')})")
        print(f"   [{bar}] {pct}% | Page {curr}/{tot} | Time: {mins} mins")
        
    print(f"\n--- Finished ({len(finished)}) ---")
    for b in finished:
        mins = sum(s.get("minutes", 0) for s in b.get("sessions", []))
        bar = "⭐" * 10
        print(f"✅ {b['title']} (by {b.get('author', 'Unknown')})")
        print(f"   [{bar}] 100% | Finished: {b.get('finishDate')} | Time: {mins} mins")

def main():
    parser = argparse.ArgumentParser(description="CLI tool for Jammy's Book Tracker")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # Log subcommand
    log_parser = subparsers.add_parser("log", help="Log a reading session")
    log_parser.add_argument("-k", "--kid", required=True, choices=["Preston", "Blaire"], help="Kid's name")
    log_parser.add_argument("-b", "--book", required=True, help="Book title")
    log_parser.add_argument("-m", "--minutes", type=int, required=True, help="Minutes spent reading")
    log_parser.add_argument("-p", "--page", type=int, default=None, help="Current page after session")
    log_parser.add_argument("--percentage", type=float, default=None, help="Update page progress to this percentage of total pages (0-100)")
    log_parser.add_argument("-d", "--date", default=None, help="Date of session (YYYY-MM-DD), default is today")
    log_parser.add_argument("--create-if-missing", action="store_true", help="Add book if it doesn't exist")
    log_parser.add_argument("--author", default="Unknown Author", help="Author of the book (only used if creating)")
    log_parser.add_argument("--total-pages", type=int, default=160, help="Total pages of the book (only used if creating)")
    log_parser.add_argument("--cover", default=None, help="Cover image path/URL (only used if creating)")
    log_parser.add_argument("--finish", action="store_true", help="Mark the book as finished")
    log_parser.add_argument("--rating", type=int, default=3, choices=[1,2,3,4,5], help="Rating 1-5 (only used if finishing)")
    log_parser.add_argument("--review", default="", help="Review note (only used if finishing)")
    
    # Add subcommand
    add_parser = subparsers.add_parser("add", help="Add a book to the list without logging a session")
    add_parser.add_argument("-k", "--kid", required=True, choices=["Preston", "Blaire"], help="Kid's name")
    add_parser.add_argument("-b", "--book", required=True, help="Book title")
    add_parser.add_argument("--author", default="Unknown Author", help="Author of the book")
    add_parser.add_argument("--total-pages", type=int, required=True, help="Total pages of the book")
    add_parser.add_argument("--cover", default=None, help="Cover image path/URL")
    add_parser.add_argument("--status", default="reading", choices=["reading", "finished"], help="Initial status")
    
    # List subcommand
    list_parser = subparsers.add_parser("list", help="List books in a kid's log")
    list_parser.add_argument("-k", "--kid", required=True, choices=["Preston", "Blaire"], help="Kid's name")
    
    args = parser.parse_args()
    
    if args.command == "log":
        handle_log(args)
    elif args.command == "add":
        handle_add(args)
    elif args.command == "list":
        handle_list(args)

if __name__ == "__main__":
    main()
