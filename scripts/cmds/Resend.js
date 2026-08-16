const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const cache = new Map();

// ensure cache folder
fs.ensureDirSync(path.join(__dirname, "cache"));

module.exports = {
  config: {
    name: "resend",
    version: "4.2",
    author: "〲MAMUNツ࿐ T.T　o.O X fixed by Sk Habibulla",
    role: 0,
    category: "events",
    description: "Resend deleted messages (On/Off system)"
  },

  onStart: async () => {},

  onChat: async ({ api, event, usersData, threadsData, role }) => {
    const { threadID, messageID, body, senderID } = event;

    // ========== TOGGLE SYSTEM ==========
    if (body && typeof body === "string") {
      const prefix = global.utils.getPrefix(threadID);
      const args = body.slice(prefix.length).trim().split(/\s+/);
      const commandName = args[0]?.toLowerCase();

      if (commandName === "resend") {
        // শুধু Admin toggle করতে পারবে
        if (role < 1) {
          return api.sendMessage("❌ শুধুমাত্র গ্রুপ অ্যাডমিন এই কমান্ড ব্যবহার করতে পারবে।", threadID, messageID);
        }

        const option = args[1]?.toLowerCase();
        const currentStatus = await threadsData.get(threadID, "data.resend", false);

        if (option === "on") {
          if (currentStatus) {
            return api.sendMessage("✅ Resend সিস্টেম ইতিমধ্যেই **চালু** আছে।", threadID, messageID);
          }
          await threadsData.set(threadID, true, "data.resend");
          return api.sendMessage("✅ Resend সিস্টেম **চালু** করা হয়েছে।\nএখন কেউ মেসেজ ডিলিট করলে আবার পাঠানো হবে।", threadID, messageID);
        }

        if (option === "off") {
          if (!currentStatus) {
            return api.sendMessage("❌ Resend সিস্টেম ইতিমধ্যেই **বন্ধ** আছে।", threadID, messageID);
          }
          await threadsData.set(threadID, false, "data.resend");
          return api.sendMessage("❌ Resend সিস্টেম **বন্ধ** করা হয়েছে।", threadID, messageID);
        }

        // Status check
        return api.sendMessage(
          `📌 Resend Status: ${currentStatus ? "✅ চালু" : "❌ বন্ধ"}\n\n` +
          `ব্যবহার:\n` +
          `${prefix}resend on  → চালু করবে\n` +
          `${prefix}resend off → বন্ধ করবে`,
          threadID,
          messageID
        );
      }
    }

    // ========== RESEND LOGIC ==========
    // Check if enabled for this thread
    const isEnabled = await threadsData.get(threadID, "data.resend", false);
    if (!isEnabled) return;

    // Save message
    if (event.type === "message" || event.type === "message_reply") {
      cache.set(event.messageID, {
        body: event.body,
        senderID: event.senderID,
        attachments: event.attachments || []
      });
    }

    // Detect unsend
    if (event.type === "message_unsend") {
      const msg = cache.get(event.messageID);
      if (!msg) return;

      let name = "Unknown User";
      try {
        const user = await usersData.get(msg.senderID);
        name = user.name || "Unknown User";
      } catch (e) {}

      let text = `😏 ভাবছস ডিলিট দিলে বাঁচবি?

আমি থাকতে তোর msg গায়েব হবে না! ${name}


${msg.body || "No text"}`;

      // Attachment handle
      if (msg.attachments && msg.attachments.length > 0) {
        const streams = [];

        for (let file of msg.attachments) {
          try {
            if (!file.url) continue;
            const filePath = path.join(__dirname, "cache", file.filename || `\( {Date.now()}_ \){Math.random().toString(36).slice(2)}`);

            const res = await axios.get(file.url, { responseType: "arraybuffer", timeout: 15000 });
            fs.writeFileSync(filePath, Buffer.from(res.data));

            streams.push(fs.createReadStream(filePath));
          } catch (e) {}
        }

        if (streams.length > 0) {
          return api.sendMessage(
            { body: text, attachment: streams },
            event.threadID,
            () => {
              streams.forEach(s => {
                try { fs.unlinkSync(s.path); } catch {}
              });
            }
          );
        }
      }

      api.sendMessage(text, event.threadID);
    }
  }
};
