---
name: log-reading
description: Log a reading session or add a book for a kid in the jammies-stories tracker. Trigger this when the user describes reading time, duration, or book progress in natural language (e.g., "today Preston read 20 mins of Bluey", "Blaire finished book A").
---

# Instructions

When the user describes a reading session in natural language (e.g., "Preston is reading Bluey: More 5-Minute Stories today. 20 mins reading"), follow these steps to log the session:

1. **Extract details**:
   - **Kid**: Detect if it is "Preston" or "Blaire" (default to "Preston" if not specified).
   - **Book**: Extract the book title or search term (e.g., "Bluey: More 5-Minute Stories"). If a link is provided, use it to aid search.
   - **Minutes**: Extract the duration in minutes (e.g., 20).
   - **Progress Percentage/Fraction**: Check if they specify progress like "1/2 the book", "half", "quarter", "50%", or specific page numbers. Convert fractions/percentages to a percentage value between 0 and 100 (e.g., "1/2" or "half" = 50, "quarter" = 25).
   - **Words Per Page (Density)**: Check if they mention word count or page density. If not specified, estimate based on the book's total pages:
     - Very sparse picture books (<50 pages): default to 20 or 25 words/page.
     - Story collections (50-150 pages): default to 30 to 100 words/page (e.g. 30 words/page for Bluey 5-minute stories).
     - Chapter books (>150 pages): default to 150 or 200 words/page.
   - **Date**: Use the current date (`YYYY-MM-DD`) unless a different day is specified.

2. **Check if book exists**:
   - Run `python3 scripts/log_reading.py list -k <Kid>` to view the kid's current list of books.
   - Match the target book against the books listed.

3. **Search for details (if book is new)**:
   - If the book is not found in the kid's current list, **always search the web** (using `search_web` or reading any provided URLs) to automatically find the book's:
     - Exact **Title**
     - **Author**
     - **Page count** (crucial for accurate percentage calculations)
     - **Cover URL** (if available)

4. **Log the session**:
   - Run the CLI script `scripts/log_reading.py` to record the session.
   - If a percentage was parsed, pass it using the `--percentage <float>` flag.
   - If a page number was parsed, pass it using the `-p <int>` flag.
   - Pass the words-per-page value using the `-w <int>` flag if setting or updating it.
   - If the book already existed:
     ```bash
     python3 scripts/log_reading.py log -k "<Kid>" -b "<Book Title>" -m <Minutes> [--percentage <percent> | -p <page>] [-w <words_per_page>]
     ```
   - If the book is new (create on the fly using retrieved web metadata):
     ```bash
     python3 scripts/log_reading.py log -k "<Kid>" -b "<Book Title>" -m <Minutes> --create-if-missing --author "<Author>" --total-pages <Total Pages> [-w <words_per_page>] [--percentage <percent> | -p <page>]
     ```
     *(Add `--cover "<Cover URL>"` if a cover was found).*
   
5. **Confirm with the user**:
   - Present a concise summary of the action taken (e.g., book title, author, minutes logged, updated page progress, and estimated word count progress).
   - When displaying reading lists, logs, or stats to the user:
     - **DO NOT include rating information** (e.g., average rating or stars), as the user does not care about it.
     - **DO include approximated word count progress** (e.g., `~2,400 words read`).
   - Mention that the website has been updated (or local server).
