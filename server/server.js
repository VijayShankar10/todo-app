const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import models and routes
const Todo = require('./models/Todo');
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS middleware
app.use(cors({
  origin: [
    'https://todo-app-black-gamma.vercel.app',  // Your Vercel domain
    'http://localhost:3000'  // Keep for local development
  ],
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
app.use('/api/auth', authRoutes);

// Protected Todo Routes
app.get('/api/todos', auth, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/todos', auth, async (req, res) => {
  try {
    const { text, priority, dueDate, category, description } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const todoData = {
      text,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      category: category || 'personal',
      description: description || null,
      userId: req.user._id
    };

    const newTodo = new Todo(todoData);
    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/todos/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findOne({ _id: id, userId: req.user._id });
    
    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    const updatedTodo = await Todo.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/todos/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findOne({ _id: id, userId: req.user._id });
    
    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    await Todo.findByIdAndDelete(id);
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Sunlight Tasks API is running!" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔐 Auth available at http://localhost:${PORT}/api/auth`);
});
