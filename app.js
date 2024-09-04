const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Item = require("./models/Item");
const Chat = require("./models/Chat"); // Import model Chat
const http = require("http");
const cors = require("cors"); // Import CORS
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Mengizinkan semua origin, Anda bisa sesuaikan ini
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors()); // Aktifkan CORS
app.use(bodyParser.json());

// Koneksi ke MongoDB
mongoose.connect("mongodb://root:pass123@103.127.97.52:27017/dhumall?authSource=admin", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Rute untuk membuat chat baru (POST /chats)
function areContactsEqual(contacts1, contacts2) {
  if (contacts1.length !== contacts2.length) return false;

  // Buat map dari kontak untuk mempermudah pencarian
  const contactMap = new Map();

  contacts1.forEach((contact) => {
    contactMap.set(`${contact.user_id}-${contact.type}`, true);
  });

  // Bandingkan kontak2 dengan map
  for (const contact of contacts2) {
    if (!contactMap.has(`${contact.user_id}-${contact.type}`)) {
      return false;
    }
  }

  return true;
}

app.post("/chats/upsert", async (req, res) => {
  try {
    const { contacts, newContent } = req.body;

    // Temukan semua dokumen
    const existingChats = await Chat.find({});

    let chat = null;

    // Periksa apakah ada dokumen yang memiliki kontak yang cocok
    for (const existingChat of existingChats) {
      if (areContactsEqual(existingChat.contacts, contacts)) {
        // Jika dokumen ditemukan dan kontak sama, tambahkan content baru
        chat = await Chat.findOneAndUpdate(
          { _id: existingChat._id },
          { $push: { content: newContent } },
          { new: true, useFindAndModify: false }
        );

        io.emit("chatUpdated", chat);
        return res.status(200).json(chat);
      }
    }

    // Jika tidak ada dokumen dengan kontak yang sama, buat dokumen baru
    chat = new Chat(req.body);
    await chat.save();

    chat = await Chat.findOneAndUpdate(
      { _id: chat._id },
      { $push: { content: newContent } },
      { new: true, useFindAndModify: false }
    );

    io.emit("chatCreated", chat);
    return res.status(201).json(chat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Rute untuk menambahkan konten ke dalam chat (POST /chats/:id/content)
app.post("/chats/:id/content", async (req, res) => {
  const chatId = req.params.id;
  const newContent = req.body;

  try {
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { content: newContent } },
      { new: true, useFindAndModify: false }
    );

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Emit event ketika konten baru ditambahkan
    io.emit("contentAdded", chat);

    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rute untuk menampilkan data sesuai dengan user id pengguna

app.get("/chats/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const chat = await Chat.find({ "contacts.user_id": userId });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/chats/company/:name", async (req, res) => {
  try {
    const userName = req.params.name;
    const chat = await Chat.find({ "contacts.name": userName });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/chats", async (req, res) => {
  try {
    const chat = await Chat.find();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ketika ada koneksi Socket.io
io.on("connection", (socket) => {
  console.log("New client connected");

  // Ketika klien terputus
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Jalankan server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
