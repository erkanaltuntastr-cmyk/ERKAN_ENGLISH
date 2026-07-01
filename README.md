# ERKAN_ENGLISH

Private English learning repository for tracking sources, study plans, generated learning materials, and progress notes.

PDF books are kept locally under `Sources/books/` but are ignored by Git. The repository should contain only source catalogues, plans, original notes, exercises, corrections, tests, and progress tracking.

Start here:

- `index.html`
- `Sources/source-index.md`
- `Sources/books/README.md`
- `Egitim Plani/03-just-enough-grammar-sprint.md`
- `Gelisim notlari/just-enough-grammar-progress.md`

## Local App

The learning interface is a small static app built from the reusable Ece Assessments player infrastructure.

Run it locally from this folder:

```powershell
python -m http.server 8123 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8123/index.html
```

App content lives under:

- `data/erkan/packs/`
- `data/erkan/assignments/erkan.json`
- `players/`
- `js/`
