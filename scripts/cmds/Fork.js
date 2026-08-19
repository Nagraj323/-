module.exports = {
 config: {
 name: "fork",
 version: "1.6",
 author: "〲MAMUNツ࿐",
 countDown: 2,
 role: 0,
 shortDescription: "Official GitHub Fork",
 category: "utils",
 guide: {
 en: "{pn} | fork"
 }
 },

 langs: {
 en: {
 current: `
 ✦━━━━━━━━━✦
👑 𝗣𝗥𝗜𝗩𝗔𝗧𝗘 𝗙𝗢𝗥𝗞 👑
 ✦━━━━━━━━━✦
👑 𝗢𝗪𝗡𝗘𝗥 ➜ 𝐀𝐑𝐈𝐘𝐀𝐍
🤖 𝗕𝗢𝗧 ➜ 𝗚𝗢𝗔𝗧 𝗕𝗢𝗧 𝗩𝟮
  ✦━━━━━━━━━✦
 𝐀𝐑𝐈𝐘𝐀𝐍 𝗚𝗢𝗔𝗧 𝗕𝗢𝗧 𝗩𝟮
  ✦━━━━━━━━━✦
`
 }
 },

 onStart: async function ({ message, getLang }) {
 const link = "";
 return message.reply(getLang("current", link));
 },

 onChat: async function ({ message, event, getLang }) {
 const body = event.body?.trim().toLowerCase();

 if (body === "fork") {
 const link = "";
 return message.reply(getLang("current", link));
 }
 }
};
