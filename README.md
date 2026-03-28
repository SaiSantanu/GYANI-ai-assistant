# 🤖 GYANI AI Assistant (JARVIS Style)

![React](https://img.shields.io/badge/Frontend-React-blue)
![Node](https://img.shields.io/badge/Backend-Node.js-green)
![Ollama](https://img.shields.io/badge/AI-Ollama-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

A **fully local AI assistant** built using React and Ollama that provides real-time chat, voice interaction, system automation, and image generation — all running on your machine without relying on external cloud APIs.

---

## 🚀 Features

* 🧠 Local AI Chat using Ollama
* ⚡ Real-time streaming responses
* 🎤 Voice input (Speech-to-Text)
* 🔊 Voice output (Text-to-Speech)
* 🖥️ System commands (open apps like Chrome, VS Code, Excel)
* 🖼️ AI Image Generation
* 📊 Performance monitoring (response time, token speed)
* 💻 Terminal-style futuristic UI

---

## 🧠 Architecture

React Frontend
⬇
Command Handler
⬇
├── Ollama (Local LLM)
└── Node Server (System Commands + Image Generation)

---

## 📸 Demo

*Add screenshots here*

```
screenshots/chat.png
screenshots/image.png
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/SaiSantanu/GYANI-ai-assistant.git
cd GYANI-ai-assistant
```

---

### 2️⃣ Install dependencies

```bash
npm install
cd server
npm install
```

---

### 3️⃣ Setup environment variables

Create a `.env` file inside `server/`:

```env
HF_TOKEN=your_token_here
PORT=3001
```

---

### 4️⃣ Run Ollama

```bash
ollama run llama3.2:1b
```

---

### 5️⃣ Start backend

```bash
cd server
node Server.js
```

---

### 6️⃣ Start frontend

```bash
npm run dev
```

---

## 🧪 Example Commands

```
open chrome
open vscode
open excel
generate image of robot
what is the time
```

---

## 🔐 Privacy First

* Runs completely locally
* No external API required (except optional image generation)
* No data leaves your system

---

## 🚀 Future Improvements

* Wake word detection ("Hey Jarvis")
* Smart model switching
* Offline speech recognition
* Performance optimization modes

---

## 👨‍💻 Author

**Sai Santanu**

---

⭐ If you like this project, consider giving it a star!
