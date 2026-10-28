# Student Management System (Full Stack)

Responsive full-stack mini-project: HTML/CSS/JavaScript frontend, Node.js + Express REST API, MongoDB/Mongoose, JWT authentication, bcrypt password hashing, role-based authorization, search/filter/pagination, dashboard stats, CSV export and Postman collection.

## Run locally
Requirements: Node.js 20+ and MongoDB local or Atlas.

```bash
npm install
cp .env.example .env
```
Edit `.env`; set a random `JWT_SECRET` of 32+ characters and `MONGODB_URI`. Then create the admin account and start the server:

```bash
npm run seed:admin
npm run dev
```
Open `http://localhost:5000`. Admin credentials come from `.env`. Public sign-up always creates a student account. Students can view the directory; only admins can create/update/delete records or export CSV.

## REST API
All `/api/students` endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Register student account |
| POST | `/api/auth/login` | Public | Sign in |
| GET | `/api/auth/me` | Signed in | Current user |
| GET | `/api/students` | Signed in | List/search/filter/paginate |
| GET | `/api/students/stats` | Signed in | Dashboard stats |
| GET | `/api/students/:id` | Signed in | Get one student |
| POST | `/api/students` | Admin | Create student |
| PUT | `/api/students/:id` | Admin | Update student |
| DELETE | `/api/students/:id` | Admin | Delete student |
| GET | `/api/students/export.csv` | Admin | Download CSV |

Query examples: `?page=1&limit=8`, `?search=Rahul`, `?department=CSE&semester=1&status=Active`.

## Postman
Import `postman/Student Management-API.postman_collection.json`. Use your seeded admin credentials in the Login request. It saves the token automatically; run Create student before update/delete. Change sample USN/email before repeating creates because these fields are unique.

## Deploy on Vercel with a custom domain
1. Create a MongoDB Atlas cluster, database user, and database. Configure Atlas Network Access so Vercel can connect; `0.0.0.0/0` is the easy demo setting but less restrictive than ideal.
2. Push the repository to GitHub. Never commit `.env` or credentials.
3. Import the repository in Vercel. Keep the project root at the repository root. `vercel.json` routes `/api/*` to `api/index.js` and serves `public/` as static files.
4. Add Vercel environment variables: `NODE_ENV=production`, `MONGODB_URI=<Atlas URI>`, `JWT_SECRET=<random 32+ char secret>`, `JWT_EXPIRES_IN=1d`, `CLIENT_ORIGIN=https://your-project.vercel.app`, `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (at least 12 characters).
5. Deploy. Seed the admin once from a trusted local environment configured with the same production Atlas URI and admin variables: `npm run seed:admin`. Do not run seeding on every deployment.
6. Verify `https://your-project.vercel.app/api/health` and sign in.
7. For a custom domain: Vercel project → Settings → Domains → add domain. Apply the exact DNS records Vercel provides at your registrar. After verification and HTTPS provisioning, update `CLIENT_ORIGIN` to the final origin(s), comma-separated if using both apex and `www`, then redeploy.

## Notes
This is an academic/demo baseline, not a security-audited production service. It includes basic Helmet/CORS/rate-limits, validation and role checks. For real student data, add privacy review, backups, monitoring, account recovery, stronger operational controls and consider secure HttpOnly cookie authentication instead of localStorage JWTs. Vercel serverless functions are not persistent servers; the DB connection is cached.
