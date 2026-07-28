const fs = require("fs");
const path = require("path");
const axios = require("axios");

// =====================================================
// ⚙️ CONFIG
// =====================================================

const OWNER_ID = "61567875354215";

const cacheDir = path.join(__dirname, "cache");
const dataPath = path.join(cacheDir, "Islamic_bot.json");
const backupPath = path.join(cacheDir, "Islamic_bot.backup.json");

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// =====================================================
// 💾 DATA MANAGEMENT
// =====================================================

let protectData = {};

function loadProtectData() {
  try {
    if (!fs.existsSync(dataPath)) {
      protectData = {};
      return;
    }

    const raw = fs.readFileSync(dataPath, "utf8").trim();

    if (!raw) {
      protectData = {};
      return;
    }

    protectData = JSON.parse(raw);

    if (
      typeof protectData !== "object" ||
      Array.isArray(protectData)
    ) {
      protectData = {};
    }
  } catch (error) {
    console.error("❌ Failed to load lock data:", error);

    // Try backup
    try {
      if (fs.existsSync(backupPath)) {
        const backup = fs.readFileSync(
          backupPath,
          "utf8"
        );

        protectData = JSON.parse(backup);

        console.log(
          "✅ Backup protection data restored."
        );
      }
    } catch (backupError) {
      console.error(
        "❌ Backup recovery failed:",
        backupError
      );

      protectData = {};
    }
  }
}

function saveProtectData() {
  try {
    if (fs.existsSync(dataPath)) {
      try {
        fs.copyFileSync(
          dataPath,
          backupPath
        );
      } catch (error) {
        console.error(
          "⚠️ Failed to create backup:",
          error.message
        );
      }
    }

    fs.writeFileSync(
      dataPath,
      JSON.stringify(
        protectData,
        null,
        2
      ),
      "utf8"
    );

    return true;
  } catch (error) {
    console.error(
      "❌ Failed to save lock data:",
      error
    );

    return false;
  }
}

loadProtectData();

// =====================================================
// 🧠 RUNTIME CONTROL
// =====================================================

const restoreCooldown = new Map();
const restoringGroups = new Set();

function isLocked(threadID) {
  return (
    protectData[threadID] &&
    protectData[threadID].protect === true
  );
}

function getLockData(threadID) {
  return protectData[threadID] || null;
}

function isOwner(uid) {
  return String(uid) === String(OWNER_ID);
}

function isAdmin(threadInfo, uid) {
  if (!threadInfo || !threadInfo.adminIDs) {
    return false;
  }

  return threadInfo.adminIDs.some(
    admin =>
      String(admin.id) === String(uid)
  );
}

function canManage(threadInfo, uid) {
  return (
    isOwner(uid) ||
    isAdmin(threadInfo, uid)
  );
}

function cooldownActive(threadID) {
  const last =
    restoreCooldown.get(threadID) || 0;

  return (
    Date.now() - last < 1500
  );
}

function setCooldown(threadID) {
  restoreCooldown.set(
    threadID,
    Date.now()
  );
}

// =====================================================
// 🖼️ DOWNLOAD GROUP IMAGE
// =====================================================

async function downloadImage(
  url,
  filePath
) {
  try {
    const response =
      await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 15000
      });

    fs.writeFileSync(
      filePath,
      Buffer.from(response.data)
    );

    return true;
  } catch (error) {
    console.error(
      "❌ Image download failed:",
      error.message
    );

    return false;
  }
}

// =====================================================
// 📩 OWNER ALERT
// =====================================================

async function sendOwnerAlert(
  api,
  data
) {
  try {
    const message =
      "🚨 GROUP LOCK ALERT\n\n" +
      `👥 Group: ${data.groupName || "Unknown"}\n` +
      `🆔 Group ID: ${data.threadID}\n` +
      `👤 User ID: ${data.userID || "Unknown"}\n` +
      `📌 Action: ${data.action || "Unknown"}\n` +
      `🔄 Status: ${data.status || "Unknown"}\n\n` +
      "🔒 Protection: ACTIVE";

    await api.sendMessage(
      message,
      OWNER_ID
    );
  } catch (error) {
    console.error(
      "❌ Owner alert failed:",
      error.message
    );
  }
}

// =====================================================
// 🔄 RESTORE GROUP PROTECTION
// =====================================================

async function restoreProtection(
  api,
  threadID,
  reason = "Change Detected",
  userID = "Unknown"
) {
  if (!isLocked(threadID)) {
    return;
  }

  if (restoringGroups.has(threadID)) {
    return;
  }

  if (cooldownActive(threadID)) {
    return;
  }

  restoringGroups.add(threadID);
  setCooldown(threadID);

  try {
    const saved =
      getLockData(threadID);

    if (!saved) {
      return;
    }

    const current =
      await api.getThreadInfo(
        threadID
      );

    const changed = [];

    // =================================================
    // 👥 NAME
    // =================================================

    if (
      saved.locks &&
      saved.locks.name &&
      saved.name !== undefined &&
      current.threadName !== saved.name
    ) {
      try {
        await api.setTitle(
          saved.name,
          threadID
        );

        changed.push(
          "Group Name"
        );
      } catch (error) {
        console.error(
          "❌ Name restore failed:",
          error.message
        );
      }
    }

    // =================================================
    // 😀 EMOJI
    // =================================================

    if (
      saved.locks &&
      saved.locks.emoji &&
      saved.emoji !== undefined &&
      current.emoji !== saved.emoji
    ) {
      try {
        await api.changeThreadEmoji(
          saved.emoji,
          threadID
        );

        changed.push(
          "Group Emoji"
        );
      } catch (error) {
        console.error(
          "❌ Emoji restore failed:",
          error.message
        );
      }
    }

    // =================================================
    // 🖼️ IMAGE
    // =================================================

    if (
      saved.locks &&
      saved.locks.image &&
      saved.image &&
      fs.existsSync(saved.image)
    ) {
      // Image restoration is handled
      // when Facebook sends thread-icon event.
    }

    // =================================================
    // 📩 ALERT
    // =================================================

    if (changed.length) {
      await sendOwnerAlert(
        api,
        {
          groupName:
            current.threadName,
          threadID,
          userID,
          action:
            changed.join(", "),
          status:
            "Automatically Restored"
        }
      );
    }
  } catch (error) {
    console.error(
      "❌ Restore protection error:",
      error
    );
  } finally {
    restoringGroups.delete(
      threadID
    );
  }
}

// =====================================================
// 📦 MODULE CONFIG
// =====================================================

module.exports.config = {
  name: "lock",
  version: "3.0.0",
  hasPermssion: 0,
  credits:
    "🔰 RAHAT ISLAM - Upgraded",
  description:
    "Advanced group name, emoji and image protection",
  commandCategory: "Box",
  usages:
    "!lock on\n" +
    "!lock off\n" +
    "!lock name <name>\n" +
    "!lock emoji <emoji>\n" +
    "!lock image\n" +
    "!lock status\n" +
    "!lock list",
  cooldowns: 0,
  dependencies: {
    axios: ""
  }
};

// =====================================================
// 🔒 MAIN COMMAND
// =====================================================

module.exports.run = async ({
  api,
  event,
  args
}) => {
  const threadID =
    event.threadID;

  const senderID =
    event.senderID;

  const command =
    args[0]
      ? args[0].toLowerCase()
      : null;

  if (!command) {
    return api.sendMessage(
      "🔒 GROUP LOCK SYSTEM\n\n" +
      "📌 Available Commands:\n\n" +
      "🔐 !lock on\n" +
      "🔓 !lock off\n" +
      "✏️ !lock name <name>\n" +
      "😀 !lock emoji <emoji>\n" +
      "🖼️ Reply to photo + !lock image\n" +
      "📊 !lock status\n" +
      "📋 !lock list",
      threadID,
      event.messageID
    );
  }

  // ===================================================
  // 📋 LIST
  // ===================================================

  if (command === "list") {
    const groups =
      Object.keys(protectData)
        .filter(
          id => isLocked(id)
        );

    return api.sendMessage(
      "🔒 PROTECTED GROUPS\n\n" +
      (
        groups.length
          ? groups
              .map(
                (id, index) =>
                  `${index + 1}. ${id}`
              )
              .join("\n")
          : "No protected groups."
      ),
      threadID,
      event.messageID
    );
  }

  // ===================================================
  // 📊 STATUS
  // ===================================================

  if (command === "status") {
    const saved =
      getLockData(threadID);

    if (!saved || !saved.protect) {
      return api.sendMessage(
        "🔓 GROUP LOCK STATUS\n\n" +
        "❌ Protection: OFF",
        threadID,
        event.messageID
      );
    }

    return api.sendMessage(
      "🔒 GROUP LOCK STATUS\n\n" +
      `👥 Name: ${
        saved.locks.name
          ? "LOCKED"
          : "UNLOCKED"
      }\n` +
      `😀 Emoji: ${
        saved.locks.emoji
          ? "LOCKED"
          : "UNLOCKED"
      }\n` +
      `🖼️ Image: ${
        saved.locks.image
          ? "LOCKED"
          : "UNLOCKED"
      }\n\n` +
      "🛡️ Protection: ACTIVE",
      threadID,
      event.messageID
    );
  }

  // ===================================================
  // 👮 ADMIN CHECK
  // ===================================================

  let threadInfo;

  try {
    threadInfo =
      await api.getThreadInfo(
        threadID
      );
  } catch (error) {
    return api.sendMessage(
      "❌ Unable to get group information.",
      threadID,
      event.messageID
    );
  }

  if (
    !canManage(
      threadInfo,
      senderID
    )
  ) {
    return api.sendMessage(
      "🚫 ACCESS DENIED\n\n" +
      "Only group admins or bot owner can use this command.",
      threadID,
      event.messageID
    );
  }

  // ===================================================
  // 🔒 LOCK ON
  // ===================================================

  if (command === "on") {
    try {
      const name =
        threadInfo.threadName ||
        "";

      const emoji =
        threadInfo.emoji ||
        "";

      const imageURL =
        threadInfo.imageSrc ||
        "";

      const imagePath =
        path.join(
          cacheDir,
          `protect_${threadID}.png`
        );

      let imageSaved = false;

      if (imageURL) {
        imageSaved =
          await downloadImage(
            imageURL,
            imagePath
          );
      }

      protectData[threadID] = {
        name,
        emoji,
        image:
          imageSaved
            ? imagePath
            : null,
        protect: true,
        locks: {
          name: true,
          emoji: true,
          image: imageSaved
        },
        enabledAt:
          Date.now(),
        enabledBy:
          senderID
      };

      saveProtectData();

      return api.sendMessage(
        "🔒 GROUP PROTECTION ENABLED\n\n" +
        "✅ Group Name: LOCKED\n" +
        "✅ Group Emoji: LOCKED\n" +
        `✅ Group Image: ${
          imageSaved
            ? "LOCKED"
            : "NOT AVAILABLE"
        }\n\n` +
        "♻️ Protection survives bot restart.\n" +
        "📩 Changes will be reported to owner.",
        threadID,
        event.messageID
      );
    } catch (error) {
      console.error(
        "❌ Lock ON Error:",
        error
      );

      return api.sendMessage(
        "❌ Failed to enable protection.",
        threadID,
        event.messageID
      );
    }
  }

  // ===================================================
  // 🔓 LOCK OFF
  // ===================================================

  if (command === "off") {
    if (!isLocked(threadID)) {
      return api.sendMessage(
        "⚠️ Protection is already OFF.",
        threadID,
        event.messageID
      );
    }

    protectData[threadID].protect =
      false;

    saveProtectData();

    return api.sendMessage(
      "🔓 GROUP PROTECTION DISABLED\n\n" +
      "Name, Emoji and Image protection is now OFF.",
      threadID,
      event.messageID
    );
  }

  // ===================================================
  // ✏️ NAME
  // ===================================================

  if (command === "name") {
    const name =
      args
        .slice(1)
        .join(" ")
        .trim();

    if (!name) {
      return api.sendMessage(
        "❌ Example:\n" +
        "!lock name My Group",
        threadID,
        event.messageID
      );
    }

    try {
      await api.setTitle(
        name,
        threadID
      );

      return api.sendMessage(
        `✅ Group name changed to:\n\n${name}`,
        threadID,
        event.messageID
      );
    } catch (error) {
      return api.sendMessage(
        "❌ Failed to change group name.",
        threadID,
        event.messageID
      );
    }
  }

  // ===================================================
  // 😀 EMOJI
  // ===================================================

  if (command === "emoji") {
    const emoji =
      args
        .slice(1)
        .join(" ")
        .trim();

    if (!emoji) {
      return api.sendMessage(
        "❌ Example:\n" +
        "!lock emoji ❤️",
        threadID,
        event.messageID
      );
    }

    try {
      await api.changeThreadEmoji(
        emoji,
        threadID
      );

      return api.sendMessage(
        `✅ Group emoji changed to ${emoji}`,
        threadID,
        event.messageID
      );
    } catch (error) {
      return api.sendMessage(
        "❌ Failed to change group emoji.",
        threadID,
        event.messageID
      );
    }
  }

  // ===================================================
  // 🖼️ IMAGE
  // ===================================================

  if (command === "image") {
    if (
      event.type !==
        "message_reply" ||
      !event.messageReply ||
      !event.messageReply.attachments ||
      !event.messageReply.attachments.length
    ) {
      return api.sendMessage(
        "❌ Reply to one photo and type:\n" +
        "!lock image",
        threadID,
        event.messageID
      );
    }

    const attachment =
      event.messageReply
        .attachments[0];

    if (
      !attachment.url
    ) {
      return api.sendMessage(
        "❌ Invalid image attachment.",
        threadID,
        event.messageID
      );
    }

    const imagePath =
      path.join(
        cacheDir,
        `group_${threadID}_${Date.now()}.png`
      );

    try {
      await downloadImage(
        attachment.url,
        imagePath
      );

      await api.changeGroupImage(
        fs.createReadStream(
          imagePath
        ),
        threadID
      );

      // If protection is active,
      // update saved protected image
      if (isLocked(threadID)) {
        const saved =
          protectData[threadID];

        const permanentPath =
          path.join(
            cacheDir,
            `protect_${threadID}.png`
          );

        fs.copyFileSync(
          imagePath,
          permanentPath
        );

        saved.image =
          permanentPath;

        saved.locks.image =
          true;

        saveProtectData();
      }

      if (
        fs.existsSync(imagePath)
      ) {
        fs.unlinkSync(
          imagePath
        );
      }

      return api.sendMessage(
        "✅ Group image changed successfully.",
        threadID,
        event.messageID
      );
    } catch (error) {
      console.error(
        "❌ Image Error:",
        error
      );

      if (
        fs.existsSync(imagePath)
      ) {
        fs.unlinkSync(
          imagePath
        );
      }

      return api.sendMessage(
        "❌ Failed to change group image.",
        threadID,
        event.messageID
      );
    }
  }

  return api.sendMessage(
    "❌ Unknown lock command.\n\n" +
    "Use !lock for help.",
    threadID,
    event.messageID
  );
};

// =====================================================
// 📡 EVENT HANDLER
// =====================================================

module.exports.handleEvent =
  async ({
    api,
    event
  }) => {
    const threadID =
      event.threadID;

    if (
      !threadID ||
      !isLocked(threadID)
    ) {
      return;
    }

    // Ignore bot's own restoration
    if (
      restoringGroups.has(
        threadID
      )
    ) {
      return;
    }

    try {
      const threadInfo =
        await api.getThreadInfo(
          threadID
        );

      const senderID =
        event.senderID;

      // Admin changes are ignored
      if (
        isAdmin(
          threadInfo,
          senderID
        ) ||
        isOwner(senderID)
      ) {
        return;
      }

      const saved =
        getLockData(threadID);

      // =================================================
      // 👥 NAME CHANGE
      // =================================================

      if (
        event.logMessageType ===
          "log:thread-name" &&
        saved.locks.name
      ) {
        await api.setTitle(
          saved.name,
          threadID
        );

        await sendOwnerAlert(
          api,
          {
            groupName:
              threadInfo.threadName,
            threadID,
            userID: senderID,
            action:
              "Group Name Changed",
            status:
              "Restored"
          }
        );

        return;
      }

      // =================================================
      // 😀 EMOJI CHANGE
      // =================================================

      if (
        event.logMessageType ===
          "log:thread-emoji" &&
        saved.locks.emoji
      ) {
        await api.changeThreadEmoji(
          saved.emoji,
          threadID
        );

        await sendOwnerAlert(
          api,
          {
            groupName:
              threadInfo.threadName,
            threadID,
            userID: senderID,
            action:
              "Group Emoji Changed",
            status:
              "Restored"
          }
        );

        return;
      }

      // =================================================
      // 🖼️ IMAGE CHANGE
      // =================================================

      if (
        event.logMessageType ===
          "log:thread-icon" &&
        saved.locks.image &&
        saved.image &&
        fs.existsSync(
          saved.image
        )
      ) {
        await api.changeGroupImage(
          fs.createReadStream(
            saved.image
          ),
          threadID
        );

        await sendOwnerAlert(
          api,
          {
            groupName:
              threadInfo.threadName,
            threadID,
            userID: senderID,
            action:
              "Group Image Changed",
            status:
              "Restored"
          }
        );
      }
    } catch (error) {
      console.error(
        "❌ Lock event error:",
        error
      );
    }
  };

// =====================================================
// 🔄 BOT STARTUP
// =====================================================

module.exports.onLoad =
  async ({
    api
  }) => {
    console.log(
      "🔒 Loading Advanced Group Lock..."
    );

    loadProtectData();

    const lockedGroups =
      Object.keys(protectData)
        .filter(
          threadID =>
            isLocked(threadID)
        );

    console.log(
      `🛡️ ${lockedGroups.length} protected group(s) loaded.`
    );

    for (
      const threadID of lockedGroups
    ) {
      try {
        await restoreProtection(
          api,
          threadID,
          "Bot Restart"
        );
      } catch (error) {
        console.error(
          `❌ Startup check failed: ${threadID}`,
          error.message
        );
      }
    }

    console.log(
      "✅ Group Lock system ready."
    );
  };
