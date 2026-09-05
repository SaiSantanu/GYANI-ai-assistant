require("dotenv").config();
const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const fetch = require("node-fetch");
const crypto = require("crypto");

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// ── CSRF token ────────────────────────────────────────────────
const CSRF_TOKEN = crypto.randomBytes(32).toString("hex");

app.get("/csrf-token", (_, res) => res.json({ csrfToken: CSRF_TOKEN }));

function verifyCsrf(req, res, next) {
  if (req.headers["x-csrf-token"] !== CSRF_TOKEN)
    return res.status(403).json({ error: "Invalid CSRF token." });
  next();
}

// ── Detect OS ─────────────────────────────────────────────────
const isWindows = process.platform === "win32";
const isMac     = process.platform === "darwin";
const isLinux   = process.platform === "linux";

// ── App command map ───────────────────────────────────────────
const APP_COMMANDS = {
  // Browsers
  "chrome":         { win: "start chrome",            mac: "open -a 'Google Chrome'",   linux: "google-chrome" },
  "firefox":        { win: "start firefox",            mac: "open -a Firefox",            linux: "firefox" },
  "edge":           { win: "start msedge",             mac: "open -a 'Microsoft Edge'",   linux: "microsoft-edge" },
  "brave":          { win: "start brave",              mac: "open -a Brave",              linux: "brave-browser" },
  "opera":          { win: "start opera",              mac: "open -a Opera",              linux: "opera" },
  "safari":         { win: null,                       mac: "open -a Safari",             linux: null },
  "tor":            { win: "start tor browser",        mac: "open -a 'Tor Browser'",      linux: "tor-browser" },

  // Code editors & IDEs
  "vs code":        { win: "code",                     mac: "code",                       linux: "code" },
  "vscode":         { win: "code",                     mac: "code",                       linux: "code" },
  "visual studio":  { win: "start devenv",             mac: null,                         linux: null },
  "notepad++":      { win: "start notepadqq",          mac: null,                         linux: "notepadqq" },
  "notepad":        { win: "start notepad",            mac: "open -a TextEdit",           linux: "gedit" },
  "sublime":        { win: "start subl",               mac: "open -a 'Sublime Text'",     linux: "subl" },
  "webstorm":       { win: "start webstorm",           mac: "open -a WebStorm",           linux: "webstorm" },
  "pycharm":        { win: "start pycharm",            mac: "open -a PyCharm",            linux: "pycharm" },
  "intellij":       { win: "start idea",               mac: "open -a 'IntelliJ IDEA'",    linux: "idea" },
  "android studio": { win: "start 'Android Studio'",   mac: "open -a 'Android Studio'",   linux: "android-studio" },
  "cursor":         { win: "start cursor",             mac: "open -a Cursor",             linux: "cursor" },
  "vim":            { win: "start vim",                mac: "open -a MacVim",             linux: "vim" },

  // Terminals
  "terminal":       { win: "start cmd",                mac: "open -a Terminal",           linux: "gnome-terminal" },
  "cmd":            { win: "start cmd",                mac: "open -a Terminal",           linux: "gnome-terminal" },
  "powershell":     { win: "start powershell",         mac: null,                         linux: null },
  "git bash":       { win: "start 'Git Bash'",         mac: null,                         linux: null },
  "iterm":          { win: null,                       mac: "open -a iTerm",              linux: null },
  "wsl":            { win: "wsl",                      mac: null,                         linux: null },

  // Communication
  "discord":        { win: "start discord",            mac: "open -a Discord",            linux: "discord" },
  "slack":          { win: "start slack",              mac: "open -a Slack",              linux: "slack" },
  "telegram":       { win: "start telegram",           mac: "open -a Telegram",           linux: "telegram-desktop" },
  "whatsapp":       { win: "start whatsapp",           mac: "open -a WhatsApp",           linux: "whatsapp-desktop" },
  "skype":          { win: "start skype",              mac: "open -a Skype",              linux: "skype" },
  "zoom":           { win: "start zoom",               mac: "open -a zoom.us",            linux: "zoom" },
  "teams":          { win: "start teams",              mac: "open -a 'Microsoft Teams'",  linux: "teams" },
  "signal":         { win: "start signal",             mac: "open -a Signal",             linux: "signal-desktop" },

  // Office & productivity
  "word":           { win: "start winword",            mac: "open -a 'Microsoft Word'",   linux: "libreoffice --writer" },
  "excel":          { win: "start excel",              mac: "open -a 'Microsoft Excel'",  linux: "libreoffice --calc" },
  "powerpoint":     { win: "start powerpnt",           mac: "open -a 'Microsoft PowerPoint'", linux: "libreoffice --impress" },
  "onenote":        { win: "start onenote",            mac: "open -a OneNote",            linux: null },
  "outlook":        { win: "start outlook",            mac: "open -a 'Microsoft Outlook'",linux: null },
  "libreoffice":    { win: "start soffice",            mac: "open -a LibreOffice",        linux: "libreoffice" },
  "notion":         { win: "start notion",             mac: "open -a Notion",             linux: "notion-app" },
  "obsidian":       { win: "start obsidian",           mac: "open -a Obsidian",           linux: "obsidian" },

  // Media & creative
  "vlc":            { win: "start vlc",                mac: "open -a VLC",                linux: "vlc" },
  "spotify":        { win: "start spotify",            mac: "open -a Spotify",            linux: "spotify" },
  "photoshop":      { win: "start photoshop",          mac: "open -a 'Adobe Photoshop'",  linux: null },
  "figma":          { win: "start figma",              mac: "open -a Figma",              linux: "figma-linux" },
  "blender":        { win: "start blender",            mac: "open -a Blender",            linux: "blender" },
  "gimp":           { win: "start gimp",               mac: "open -a GIMP",               linux: "gimp" },
  "audacity":       { win: "start audacity",           mac: "open -a Audacity",           linux: "audacity" },
  "obs":            { win: "start obs64",              mac: "open -a OBS",                linux: "obs" },
  "davinci":        { win: "start resolve",            mac: "open -a 'DaVinci Resolve'",  linux: "davinci-resolve" },

  // System tools
  "task manager":   { win: "start taskmgr",            mac: "open -a 'Activity Monitor'", linux: "gnome-system-monitor" },
  "file manager":   { win: "start explorer",           mac: "open -a Finder",             linux: "nautilus" },
  "calculator":     { win: "start calc",               mac: "open -a Calculator",         linux: "gnome-calculator" },
  "paint":          { win: "start mspaint",            mac: null,                         linux: null },
  "settings":       { win: "start ms-settings:",       mac: "open -a 'System Preferences'", linux: "gnome-control-center" },
  "control panel":  { win: "start control",            mac: "open -a 'System Preferences'", linux: "gnome-control-center" },
  "snipping tool":  { win: "start snippingtool",       mac: null,                         linux: null },

  // Dev & data tools
  "docker":         { win: "start 'Docker Desktop'",   mac: "open -a Docker",             linux: "docker-desktop" },
  "postman":        { win: "start postman",            mac: "open -a Postman",            linux: "postman" },
  "insomnia":       { win: "start insomnia",           mac: "open -a Insomnia",           linux: "insomnia" },
  "dbeaver":        { win: "start dbeaver",            mac: "open -a DBeaver",            linux: "dbeaver" },
  "mongodb compass":{ win: "start 'MongoDB Compass'",  mac: "open -a 'MongoDB Compass'",  linux: "mongodb-compass" },
  "tableplus":      { win: "start tableplus",          mac: "open -a TablePlus",          linux: "tableplus" },
  "github desktop": { win: "start 'GitHub Desktop'",   mac: "open -a 'GitHub Desktop'",   linux: "github-desktop" },

  // Games & misc
  "steam":          { win: "start steam",              mac: "open -a Steam",              linux: "steam" },
  "epic games":     { win: "start 'Epic Games Launcher'", mac: "open -a 'Epic Games Launcher'", linux: null },
};

// ── Launch endpoint ───────────────────────────────────────────
app.post("/launch", verifyCsrf, (req, res) => {
  const { app: appName } = req.body;

  if (!appName) {
    return res.status(400).json({ error: "No app name provided." });
  }

  const key = appName.toLowerCase().trim();
  const entry = APP_COMMANDS[key];

  if (!entry) {
    return res.status(404).json({ error: `Unknown app: "${appName}"` });
  }

  const command = isWindows ? entry.win : isMac ? entry.mac : entry.linux;

  if (!command) {
    return res.status(400).json({
      error: `"${appName}" is not supported on this OS (${process.platform}).`
    });
  }

  exec(command, (err) => {
    if (err) {
      return res.status(500).json({ error: `Failed to launch: ${err.message}` });
    }
    res.json({ success: true, message: `Launched ${appName}` });
  });
});

// ── Image generation endpoint ─────────────────────────────────
app.post("/generate-image", verifyCsrf, async (req, res) => {
  const prompt = String(req.body?.prompt || "").trim().slice(0, 500);

  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided." });
  }

  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error || "HF API error" });
    }

    const buffer = await response.buffer();
    const base64 = buffer.toString("base64");
    res.json({ image: `data:image/png;base64,${base64}` });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────
app.get("/ping", (_, res) => res.json({ status: "ok" }));

app.listen(3001, () => {
  console.log("🚀 Gyani launcher server running on http://localhost:3001");
});