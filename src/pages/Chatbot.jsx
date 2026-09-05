import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./Chatbot.css";

function getTimestamp() {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

export default function Chatbot() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState("qwen2.5");
  const [responseTime, setResponseTime] = useState(null);
  const [tokenSpeed, setTokenSpeed] = useState(null);
  const chatEndRef = useRef(null);
  const greetedRef = useRef(false);
  const messagesRef = useRef([]);
  const csrfToken = useRef("");

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  async function getCsrfToken() {
    if (csrfToken.current) return csrfToken.current;
    try {
      const r = await fetch("http://localhost:3001/csrf-token");
      const d = await r.json();
      csrfToken.current = d.csrfToken;
      return csrfToken.current;
    } catch { return ""; }
  }
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    setMessages([{ role: "assistant", content: "Hello. I am your AI assistant. System initialized and ready.", time: getTimestamp() }]);
  }, []);

  function speak(text) {
    if (typeof text !== "string" || !text.trim()) return;
    const speech = new SpeechSynthesisUtterance(text.trim());
    speech.lang = "en-US";
    speech.rate = 1;
    window.speechSynthesis.speak(speech);
  }

  async function launchApp(appName) {
    try {
      const token = await getCsrfToken();
      const res = await fetch("http://localhost:3001/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ app: appName })
      });
      const data = await res.json();
      return data.message || data.error;
    } catch {
      return "⚠ Launcher server not running. Start it with: cd server && node Server.js";
    }
  }

  async function generateImage(prompt) {
    try {
      const token = await getCsrfToken();
      const response = await fetch("http://localhost:3001/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ prompt })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.image ?? null;
    } catch (err) {
      console.error("Image generation failed:", err);
      return null;
    }
  }

  async function handleSystemCommand(text) {
    const cmd = text.toLowerCase().trim();

    const desktopApps = [
      ["chrome"], ["vscode", "vs code"], ["edge"], ["brave"], ["firefox"],
      ["spotify"], ["terminal"], ["cmd"], ["powershell"], ["discord"],
      ["slack"], ["zoom"], ["teams"], ["whatsapp"], ["telegram"], ["signal"],
      ["word"], ["excel"], ["powerpoint"], ["notepad"], ["notepad++"],
      ["calculator"], ["task manager"], ["file manager"], ["settings"],
      ["paint"], ["vlc"], ["obs"], ["figma"], ["blender"], ["gimp"],
      ["photoshop"], ["docker"], ["postman"], ["steam"], ["epic games"],
      ["github desktop"], ["sublime"], ["pycharm"], ["intellij"],
      ["android studio"], ["cursor"], ["obsidian"], ["notion"],
    ];
    for (const aliases of desktopApps) {
      if (aliases.some(alias => cmd.includes(`open ${alias}`))) return await launchApp(aliases[0]);
    }

    const webApps = [
      ["youtube", "https://youtube.com"], ["google", "https://google.com"],
      ["github", "https://github.com"], ["gmail", "https://mail.google.com"],
      ["chatgpt", "https://chat.openai.com"], ["claude", "https://claude.ai"],
      ["instagram", "https://instagram.com"], ["twitter", "https://x.com"],
      ["reddit", "https://reddit.com"], ["linkedin", "https://linkedin.com"],
      ["netflix", "https://netflix.com"], ["whatsapp", "https://web.whatsapp.com"],
      ["google drive", "https://drive.google.com"], ["google docs", "https://docs.google.com"],
      ["google maps", "https://maps.google.com"], ["stackoverflow", "https://stackoverflow.com"],
      ["trello", "https://trello.com"], ["notion", "https://notion.so"],
      ["vercel", "https://vercel.com"], ["figma", "https://figma.com"],
    ];
    for (const [name, url] of webApps) {
      if (cmd.includes(`open ${name}`)) {
        window.open(url, "_blank");
        return `Opening ${name.charAt(0).toUpperCase() + name.slice(1)}.`;
      }
    }

    if (cmd.startsWith("search ")) {
      const query = cmd.replace("search ", "").trim();
      window.open(`https://google.com/search?q=${encodeURIComponent(query)}`, "_blank");
      return `Searching Google for "${query}".`;
    }

    if (cmd.includes("time")) return `The current time is ${new Date().toLocaleTimeString()}.`;
    if (cmd.includes("date")) return `Today is ${new Date().toDateString()}.`;
    if (cmd.includes("what day")) return `Today is ${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()]}.`;
    if (cmd.startsWith("generate image")) return { type: "image", prompt: cmd.replace("generate image", "").trim() };
    if (cmd.includes("clear chat") || cmd.includes("clear history")) return "__CLEAR__";
    return null;
  }

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition not supported in this browser."); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      sendMessage(voiceText, true);
    };

    recognition.onerror = (e) => {
      if (e.error === "audio-capture") {
        alert("No microphone found.\n\nMake sure a microphone is connected and not in use by another app.");
      } else if (e.error === "not-allowed") {
        alert("Microphone access denied.\n\nClick the lock icon in the address bar → set Microphone to Allow → refresh.");
      } else if (e.error === "network") {
        alert("Network error during speech recognition. Check your internet connection.");
      } else {
        console.error("Speech error:", e.error);
      }
    };

    recognition.start();
  };

  const sendMessage = useCallback(async (voiceInput = null, fromVoice = false) => {
    const msg = (voiceInput || message).trim();
    if (!msg || isStreaming) return;
    setMessage("");

    const systemResponse = await handleSystemCommand(msg);

    if (systemResponse === "__CLEAR__") { setMessages([]); return; }

    if (systemResponse && typeof systemResponse === "object" && systemResponse.type === "image") {
      setMessages(prev => [...prev,
        { role: "user", content: msg, time: getTimestamp() },
        { role: "assistant", content: "🎨 Generating image...", time: getTimestamp() }
      ]);
      const base64 = await generateImage(systemResponse.prompt);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: base64 ? "" : "⚠ Image generation failed. Is the server running? Check your HF token in server/Server.js.",
          image: base64 ?? null,
          time: getTimestamp()
        };
        return updated;
      });
      return;
    }

    if (systemResponse && typeof systemResponse === "string") {
      setMessages(prev => [...prev,
        { role: "user", content: msg, time: getTimestamp() },
        { role: "assistant", content: systemResponse, time: getTimestamp() }
      ]);
      speak(systemResponse);
      return;
    }

    const startTime = Date.now();
    const userMsg = { role: "user", content: msg, time: getTimestamp() };
    const newMessages = [...messagesRef.current, userMsg];
    setMessages(newMessages);
    setIsStreaming(true);

    try {
      const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "Always respond in the same language as the user's message." },
            ...newMessages.map(({ role, content }) => ({ role, content }))
          ],
          stream: true
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiText = "", buffer = "", tokenCount = 0, speakBuffer = "";

      setMessages(prev => [...prev, { role: "assistant", content: "", time: getTimestamp() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            const chunk = parsed.message?.content || "";
            aiText += chunk;
            speakBuffer += chunk;
            tokenCount += chunk.split(" ").length;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], content: aiText };
              return updated;
            });
            if (fromVoice) {
              const sentenceMatch = speakBuffer.match(/^(.+[.!?])\s*/);
              if (sentenceMatch) {
                speak(sentenceMatch[1]);
                speakBuffer = speakBuffer.slice(sentenceMatch[0].length);
              }
            }
          } catch (err) { console.error("Stream parse error:", err); }
        }
      }

      if (fromVoice && speakBuffer.trim()) speak(speakBuffer.trim());

      const seconds = (Date.now() - startTime) / 1000;
      setResponseTime(seconds.toFixed(2));
      setTokenSpeed((tokenCount / seconds).toFixed(2));

    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `[ERROR] ${err.message}`, time: getTimestamp(), error: true }]);
    } finally {
      setIsStreaming(false);
    }
  }, [message, isStreaming, model]);

  return (
    <div className="terminal-root">
      <div className="terminal-window">
        <div className="title-bar">
          <div className="title-bar-left">
            <div className="title-bar-dots">
              <div className="dot active" /><div className="dot" /><div className="dot" />
            </div>
            <span className="title-text">GYANI TERMINAL</span>
          </div>
          <div className="model-selector">
            <label>Model:</label>
            <select value={model} onChange={e => setModel(e.target.value)}>
              <option value="qwen2.5">Qwen2.5</option>
              <option value="llama3">Llama3</option>
              <option value="mistral">Mistral</option>
              <option value="gemma:2b">Gemma 2B</option>
              <option value="deepseek-coder:1.3b">DeepSeek Coder (Code)</option>
            </select>
          </div>
          <div className="status-indicator">
            <div className="status-led" />
            <span className="title-bar-status">Online</span>
          </div>
        </div>

        <div className="performance-bar">
          <span>⏱ Response: {responseTime ? `${responseTime}s` : "—"}</span>
          <span>⚡ Speed: {tokenSpeed ? `${tokenSpeed} tokens/sec` : "—"}</span>
        </div>

        <div className="messages-area">
          {messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.role}`}>
              <div className="message-meta">{msg.role === "user" ? "▶ USER" : "◀ AI"} — {msg.time}</div>
              <div className={["message-bubble", msg.error ? "error" : "", isStreaming && i === messages.length - 1 && msg.role === "assistant" ? "cursor-blink" : ""].filter(Boolean).join(" ")}>
                {msg.content && <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>}
                {msg.image && <img src={msg.image} alt="generated" style={{ maxWidth: "300px", borderRadius: "8px", marginTop: "8px" }} />}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="input-section">
          <div className="input-row">
            <span className="input-prompt">&gt;_</span>
            <input
              className="chat-input"
              value={message}
              placeholder="Ask something..."
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
              disabled={isStreaming}
              autoFocus
            />
            <button className="mic-btn" onClick={startListening} disabled={isStreaming} title="Voice input">🎤</button>
            <button className="send-btn" onClick={() => sendMessage(null, false)} disabled={isStreaming || !message.trim()}>
              {isStreaming ? "Generating..." : "Send"}
            </button>
          </div>
          <div className="footer-bar">
            <span>OLLAMA LOCAL</span>
            <span>{model.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}