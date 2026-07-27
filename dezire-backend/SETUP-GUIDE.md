# SETUP GUIDE — Read this top to bottom, do it once, done forever.

---

## PART 1 — Free accounts you need (takes 10 minutes)

### 1A. MongoDB Atlas (free database)
1. Go to https://cloud.mongodb.com
2. Sign up → Create a free account
3. Click "Build a Database" → choose FREE (M0 Sandbox)
4. Pick any region → click Create
5. Username: make one up e.g. `dezireAdmin`  Password: make a strong one — SAVE THESE
6. Click "Add my current IP address" → Finish
7. Click "Connect" → "Drivers" → copy the connection string
   It looks like: `mongodb+srv://dezireAdmin:PASSWORD@cluster0.xxxxx.mongodb.net/`
   Change `PASSWORD` to your actual password and add `dezire-more` at the end:
   `mongodb+srv://dezireAdmin:PASSWORD@cluster0.xxxxx.mongodb.net/dezire-more`

### 1B. Cloudinary (free image hosting)
1. Go to https://cloudinary.com → Sign up free
2. After login, go to Dashboard
3. You'll see: Cloud Name, API Key, API Secret
4. Copy all three — you need them next

---

## PART 2 — Set up the backend folder

### Step 1: Create the folder
On your computer, wherever your DEZIRE MORE-WEBSITE folder is, create a NEW folder called:
```
dezire-more-api
```

### Step 2: Copy backend files into it
From the zip you downloaded, copy these into `dezire-more-api/`:
```
dezire-more-api/
├── server.js
├── package.json
├── .env.example
├── models/
│   └── Product.js
├── routes/
│   ├── products.js
│   └── admin.js
└── middleware/
    ├── cloudinary.js
    └── auth.js
```

### Step 3: Create your .env file
Copy `.env.example` and rename it to `.env`
Open it and fill in your values:

```
MONGODB_URI=mongodb+srv://dezireAdmin:yourPassword@cluster0.xxxxx.mongodb.net/dezire-more
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
ADMIN_EMAIL=admin@deziremore.com
ADMIN_PASSWORD=PickAStrongPassword123!
JWT_SECRET=any-long-random-string-here-change-this
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Step 4: Install and run
Open a terminal, go into the folder:
```bash
cd dezire-more-api
npm install
npm run dev
```

You should see:
```
✅  MongoDB connected
✅  Dezire More API → http://localhost:5000
```

If you see this — the backend is running. ✅

---

## PART 3 — Set up the frontend

### Step 1: Copy frontend files
From the zip, copy the `frontend/` folder contents into your existing project:

| File from zip                          | Goes into your project              |
|----------------------------------------|-------------------------------------|
| frontend/hooks/useProducts.js          | src/hooks/useProducts.js            |
| frontend/components/ProductCard.jsx    | src/components/ProductCard.jsx      |
| frontend/components/ProductSkeleton.jsx| src/components/ProductSkeleton.jsx  |
| frontend/components/Home.jsx           | src/components/Home.jsx             |
| frontend/components/Hero.jsx           | src/components/Hero.jsx             |
| frontend/components/CategoryPage.jsx   | src/components/CategoryPage.jsx     |
| frontend/components/Navbar.jsx         | src/components/Navbar.jsx           |
| frontend/main.jsx                      | src/main.jsx                        |

### Step 2: Create .env in your website folder
```bash
cd "DEZIRE MORE-WEBSITE"
```
Create a file called `.env` with this one line:
```
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Install react-router-dom
```bash
npm install react-router-dom
```

### Step 4: Paste extra CSS
Open `frontend/additions-to-index.css` and copy everything into the bottom of your `src/index.css`

### Step 5: Delete the old data file
Find and delete:  `src/data/products.js`
Remove all lines like:  `import { sarees } from '../data/products'`

### Step 6: Run the website
```bash
npm run dev
```

---

## PART 4 — Open the Admin Panel

The admin panel is a single file: `admin-panel.html`

Just open it in your browser — no installation needed:
- Double-click it, OR
- Right-click → Open with → Chrome/Edge/Firefox

Login with whatever you put in your .env:
```
Email:    admin@deziremore.com   (whatever you set as ADMIN_EMAIL)
Password: PickAStrongPassword123!  (whatever you set as ADMIN_PASSWORD)
```

---

## PART 5 — Adding your first product (e.g. a saree)

1. Open admin panel
2. Click "Add Product"
3. Drag and drop your saree photos into the upload box
4. Fill in: Name, Category (sarees), Price, Original Price, fabric, colors
5. Tick tags: e.g. "New Arrival" or "Bestseller"
6. Click "Save Product"
7. Refresh your website — saree appears instantly ✅

That's it. No code. No terminal. Just fill the form.

---

## PART 6 — The remaining components

These components in your project still use the old local data.
Update them the same way — just swap the import:

BEFORE:  `import { kurtas } from '../data/products'`
AFTER:   `const { products } = useCategory('kurtas', filters)`

Components to update:
- Kurtas.jsx          → useCategory('kurtas')
- Lehengas.jsx        → useCategory('lehengas')
- CoOrds.jsx          → useCategory('coords')
- DressMaterials.jsx  → useCategory('dress-materials')
- ReadyToWear.jsx     → useCategory('ready-to-wear')
- WesternApparels.jsx → useCategory('western')
- WeddingBanner.jsx   → useCategory('lehengas', { occasion: 'Wedding' })
- Bestsellers.jsx     → useTag('bestseller')
- ProductSlider.jsx   → pass products as prop from parent

They all follow the exact same pattern as CategoryPage.jsx.

---

## Two terminals, always open

When developing, keep two terminals open:

Terminal 1 (backend):
```bash
cd dezire-more-api
npm run dev
```

Terminal 2 (frontend):
```bash
cd "DEZIRE MORE-WEBSITE"
npm run dev
```

---

## Something went wrong?

| Problem                        | Fix                                                              |
|-------------------------------|------------------------------------------------------------------|
| MongoDB connection failed      | Check your MONGODB_URI in .env — password might have special chars, wrap it in quotes |
| Images not uploading           | Check CLOUDINARY_* values in .env                               |
| CORS error in browser          | Check FRONTEND_URL in .env matches your Vite port (5173 or 5174)|
| Admin login fails              | Check ADMIN_EMAIL and ADMIN_PASSWORD in .env                    |
| Products not showing on site   | Make sure backend is running on port 5000                       |
