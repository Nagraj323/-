 module.exports = {
  config: {
    name: "habib",
    version: "2.0.0",
    author: "Habib X Hridoy",
    countDown: 5,
    role: 0,
    shortDescription: "Multi Mention Detector",
    longDescription: "Habib + Aashik + Mentions",
    category: "fun",
    guide: "Mention users or type habib to trigger detectors"
  },

  habibCount: 0,

  onStart: async function ({ message }) {
    try {
      const info = await message.reply(
        "✅ **All Detectors Active!**\n\n" +
        "• habib / habib vai / habib bhai / habib bro\n" +
        "• @KB Aashik\n" +
        "• 100042200207408\n" +
        "• 61591040218593\n" +
        "• 100079043707149\n\n" +
        "Bot ready 🔥"
      );

      if (info && info.messageID && global.GoatBot && global.GoatBot.onReply) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: message.senderID,
          type: "habib"
        });
      }
    } catch (err) {
      console.error("[habib] onStart error:", err);
    }
  },

  onChat: async function ({ event, message }) {
    try {
      if (!event.body || typeof event.body !== "string") return;

      const threadID = event.threadID;
      const messageID = event.messageID;
      const now = Date.now();

      // ---- Duplicate reply prevention ----
      if (!global.habibProcessed) global.habibProcessed = new Set();
      if (messageID && global.habibProcessed.has(messageID)) return;

      // ---- Thread-based anti-spam (8s) ----
      if (!global.habibThreadCooldown) global.habibThreadCooldown = new Map();
      const lastTime = global.habibThreadCooldown.get(threadID) || 0;
      if (now - lastTime < 8000) return;

      const text = event.body.toLowerCase().trim();
      const mentions = event.mentions || {};

      // Helper: check if a target UID is referenced via FB mention, raw UID in text, or aliases
      const isTargetHit = (uid, aliases = []) => {
        if (mentions[uid]) return true;
        if (event.body.includes(uid)) return true;
        if (aliases.some(alias => text.includes(alias))) return true;
        return false;
      };

      const markHandled = () => {
        global.habibThreadCooldown.set(threadID, now);
        if (messageID) {
          global.habibProcessed.add(messageID);
          // Keep the processed set small
          if (global.habibProcessed.size > 500) {
            const first = global.habibProcessed.values().next().value;
            global.habibProcessed.delete(first);
          }
        }
      };

      // ---- 1. KB Aashik Detector (UID + mention + name) ----
      const aashikUID = "61591040218593";
      if (isTargetHit(aashikUID, ["Masum", "Masum bhaiya"])) {
        markHandled();
        await message.reply("uni akon besto ache 🙂");
        return;
      }

      // ---- 2. Target UID 100042200207408 ----
      const targetID1 = "61592654789914";
      if (isTargetHit(targetID1)) {
        markHandled();
        await message.reply("O akon gf er sate kota bolte besto 😌");
        return;
      }

      // ---- 3. Target UID 100079043707149 (fixed: was checking targetID1) ----
      const targetID2 = "100079043707149";
      if (isTargetHit(targetID2)) {
        markHandled();
        await message.reply("Habib akon besto ache ki bolben amk bolun 😌");
        return;
      }

      // ---- 4. Habib Detector ----
      const habibTriggers = ["habib", "হাবিব", "habib vai", "habib bhai", "habib bro"];
      if (habibTriggers.some(trigger => text.includes(trigger))) {
        markHandled();
        this.habibCount = (this.habibCount || 0) + 1;

        const replies = [
          "bos akon besto ache 😌",
          "habib vai besto re bhai 😂",
          "bos ektu rest nite dao 😤",
          "habib er phone busy 🔥",
          "ar koto bar bolba vai? 😅"
        ];

        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        await message.reply(`${randomReply}\n\n(Count: ${this.habibCount})`);
        return;
      }
    } catch (err) {
      console.error("[habib] onChat error:", err);
    }
  },

  onReply: async function ({ event, Reply, message }) {
    try {
      if (!Reply || !event.body) return;
      if (event.senderID !== Reply.author) return;

      await message.reply(`You replied: ${event.body}`);
    } catch (err) {
      console.error("[habib] onReply error:", err);
    }
  },

  onReaction: async function ({ event, Reaction, message }) {
    try {
      if (!Reaction) return;
      if (event.userID !== Reaction.author) return;

      await message.reply(`You reacted with: ${event.reaction} 👍`);
    } catch (err) {
      console.error("[habib] onReaction error:", err);
    }
  },

  onEvent: async function ({ event, message }) {
    try {
      if (event.logMessageType === "log:subscribe") {
        await message.reply("Welcome to the group! 🎉");
      }
    } catch (err) {
      console.error("[habib] onEvent error:", err);
    }
  }
};
