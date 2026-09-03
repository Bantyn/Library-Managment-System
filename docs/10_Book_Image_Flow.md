# 🖼️ Book Image Flow Documentation — Library Management System

Architecture and workflow specification for **Book Cover Image Uploads**, storage, and multi-client thumbnail presentation.

---

## 1. Architectural Pipeline

```text
Admin Portal
   │
   ├─ 1. Selects image (JPEG, PNG, WebP)
   ├─ 2. Instant client preview via URL.createObjectURL()
   │
   ▼
Multipart Form Submission
   │
   ▼
Express Backend
   │
   ├─ 1. Multer Middleware: limits to 5MB, validates image MIME types
   ├─ 2. Unique disk filename hashing: book-<timestamp>-<random>.<ext>
   ├─ 3. Saves binary to /uploads/books/
   │
   ▼
MongoDB Persistence
   │
   └─ Saves relative path: "/uploads/books/book-172535...png" in Book.image
   │
   ▼
Client Presentation
   │
   ├─ Express static middleware serves from "http://localhost:5000/uploads/..."
   ├─ Admin BookTable renders 38x50px rounded thumbnail with fallback icon
   ├─ Student BookCard renders 170px responsive cover header
   └─ Student BookDetails renders full 180x240px cover showcase
```

---

## 2. Multer Configuration

Located at `Backend/src/middleware/uploadMiddleware.js`:

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `book-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, and WebP images allowed'), false);
  },
});
```

---

## 3. Fallback Mechanism

If a book has no image uploaded (`image: ""` or broken link):
- The frontend gracefully falls back to an academic Bootstrap book icon (`bi-book`) inside a rounded background.
- UI layouts never break due to missing images.
