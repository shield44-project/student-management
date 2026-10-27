require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const studentRoutes = require("./routes/studentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({
    name: "E-NAMM Student Management API",
    status: "running",
    endpoints: {
      students: "/api/students",
      health: "/api/health"
    }
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    server: "running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.use("/api/students", studentRoutes);

// Handle invalid JSON bodies.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ success: false, message: "Invalid JSON request body" });
  }
  next(err);
});

async function startServer() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Copy .env.example to .env and configure it.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();
