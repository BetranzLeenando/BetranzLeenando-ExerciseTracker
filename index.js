const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let users = [];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Get all users
app.get("/api/users", (req, res) => {
  res.json(users);
});

// Add a new user
app.post("/api/users", (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const userId =
    Date.now().toString(36) + Math.random().toString(36).substring(2);
  const newUser = { username, _id: userId };
  users.push(newUser);

  res.json(newUser);
});

// Add exercise to a user
app.post("/api/users/:_id/exercises", (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  // Find the user by _id
  const user = users.find((user) => user._id === _id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Validate required fields
  if (!description || !duration) {
    return res
      .status(400)
      .json({ error: "Description and duration are required" });
  }

  const exerciseDate = date ? new Date(date) : new Date();
  if (isNaN(exerciseDate)) {
    return res.status(400).json({ error: "Invalid date" });
  }

  const exercise = {
    description,
    duration: Number(duration), // Ensure duration is a number
    date: exerciseDate.toDateString(),
  };

  // Update user data
  user.exercises = user.exercises || [];
  user.exercises.push(exercise);

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: user._id,
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { _id } = req.params; // Mendapatkan _id dari parameter URL
  const { from, to, limit } = req.query; // Mendapatkan query parameters
  const user = users.find((user) => user._id === _id); // Mencari user berdasarkan _id

  if (!user) {
    return res.status(404).json({ error: "User not found" }); // Jika user tidak ditemukan, kembalikan error
  }

  // Siapkan log latihan (exercises)
  let logs = user.exercises || [];

  // Filter berdasarkan tanggal "from" dan "to"
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate)) {
      logs = logs.filter((log) => new Date(log.date) >= fromDate);
    } else {
      return res.status(400).json({ error: "Invalid 'from' date format" });
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate)) {
      logs = logs.filter((log) => new Date(log.date) <= toDate);
    } else {
      return res.status(400).json({ error: "Invalid 'to' date format" });
    }
  }

  // Batasi jumlah log dengan "limit"
  if (limit) {
    const limitNumber = parseInt(limit);
    if (!isNaN(limitNumber) && limitNumber > 0) {
      logs = logs.slice(0, limitNumber);
    } else {
      return res.status(400).json({ error: "Invalid 'limit' parameter" });
    }
  }

  // Buat response JSON
  res.json({
    _id: user._id,
    username: user.username,
    count: logs.length, // Jumlah log yang dikembalikan
    log: logs.map((log) => ({
      description: log.description,
      duration: log.duration,
      date: log.date,
    })),
  });
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(
    "Your app is listening on http://localhost:" + listener.address().port
  );
});
