# E-NAMM Student Management System

A full-stack academic mini-project demonstrating HTML, CSS, JavaScript, Node.js, Express, MongoDB/Mongoose, REST APIs and Postman.

## Features
- Create, list, search, filter, update and delete student records
- REST endpoints for GET, POST, PUT and DELETE
- Student validation and duplicate USN/email handling
- Responsive browser UI
- Health-check endpoint
- Importable Postman collection

## Requirements
- Node.js 18 or newer
- MongoDB running locally, or a MongoDB Atlas connection string
- Postman (for API testing)

## 1. Configure backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `backend/.env` if your MongoDB URI differs. The default URI is:
`mongodb://127.0.0.1:27017/enamm_students`

## 2. Start backend
```bash
npm run dev
```
The API should be available at `http://localhost:5000`.

Useful endpoints:
- `GET http://localhost:5000/`
- `GET http://localhost:5000/api/health`
- `GET http://localhost:5000/api/students`
- `POST http://localhost:5000/api/students`
- `GET http://localhost:5000/api/students/:id`
- `PUT http://localhost:5000/api/students/:id`
- `DELETE http://localhost:5000/api/students/:id`
- `GET http://localhost:5000/api/students?search=Rahul`
- `GET http://localhost:5000/api/students?department=CSE`

## 3. Start the frontend
Keep the backend running. Open `frontend/index.html` in a browser. If the browser blocks local-file requests, serve the frontend with a small static server instead:
```bash
cd frontend
npx serve .
```
Then open the local URL printed by `serve`.

The frontend expects the backend at `http://localhost:5000/api`. For a deployed backend, change `API_BASE` in `frontend/script.js`.

## 4. Test with Postman
Import `postman/E-NAMM-Student-Management.postman_collection.json` into Postman.
Run **Health check**, then **Create student**. The create request saves the returned ID as the `studentId` collection variable. Then run the GET, search, update and delete requests.
The sample USN/email must be unique in your database. Change them before repeating the create request.

## HTTP status codes
- `200 OK`: successful reads, updates and deletes
- `201 Created`: student created
- `400 Bad Request`: invalid ID or invalid input
- `404 Not Found`: student does not exist
- `409 Conflict`: duplicate USN or email
- `500 Internal Server Error`: unexpected server failure

## Notes
- `.env` and `node_modules/` should not be committed.
- This is a learning project, not a production deployment. Add authentication, authorization, rate limiting and stricter production configuration before using real student data.
