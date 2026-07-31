const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcomecard",
    aliases: ["wcard", "testwelcome"],
    version: "1.0.3",
    author: "SK",
    countDown: 5,
    role: 0,
    category: "tools",
    description: "Generates a premium welcome card for a group member.",
    guide: {
      en:
        "{pn} - Generate welcome card for yourself\n" +
        "{pn} @tag - Generate welcome card for tagged user"
    }
  },

  onStart: async function ({
    api,
    event,
    usersData,
    threadsData
  }) {
    const {
      threadID,
      messageID,
      senderID,
      mentions = {}
    } = event;

    // ==============================
    // TARGET USER
    // ==============================

    let targetID = senderID;

    if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    // ==============================
    // LOAD CANVAS
    // ==============================

    let Canvas;

    try {
      Canvas = require("canvas");
    } catch (error) {
      return api.sendMessage(
        "❌ Canvas library is not installed.\n\n" +
        "Install it using:\n" +
        "npm install canvas",
        threadID,
        messageID
      );
    }

    const {
      createCanvas,
      loadImage,
      registerFont
    } = Canvas;

    try {

      await api.sendMessage(
        "⏳ Creating your Premium Welcome Card...",
        threadID,
        messageID
      );

      // ==============================
      // FONT SETUP
      // ==============================

      const fontDir = path.join(
        process.cwd(),
        "scripts",
        "cmds",
        "assets",
        "font"
      );

      const boldFontPath = path.join(
        fontDir,
        "NotoSans-Bold.ttf"
      );

      const regularFontPath = path.join(
        fontDir,
        "NotoSans-Regular.ttf"
      );

      try {

        if (fs.existsSync(boldFontPath)) {
          registerFont(
            boldFontPath,
            {
              family: "NotoSansCustom",
              weight: "bold"
            }
          );
        }

        if (fs.existsSync(regularFontPath)) {
          registerFont(
            regularFontPath,
            {
              family: "NotoSansCustom",
              weight: "normal"
            }
          );
        }

      } catch (fontError) {
        console.log(
          "Font registration warning:",
          fontError.message
        );
      }

      // ==============================
      // GET USER DATA
      // ==============================

      const userName =
        (await usersData.getName(targetID)) ||
        "New Member";

      const threadInfo =
        (await threadsData.get(threadID)) || {};

      const threadName =
        threadInfo.threadName ||
        "Our Family";

      const memberCount =
        threadInfo.members?.length || 1;

      // ==============================
      // IMAGE URLS
      // ==============================

      const bgUrl =
        "https://i.imgur.com/elLlhRK.jpeg";

      const avatarUrl =
        `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;

      // ==============================
      // IMAGE LOADER
      // ==============================

      async function getImg(url) {

        const response = await axios({
          url: url,
          method: "GET",
          responseType: "arraybuffer",
          timeout: 15000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 10)"
          }
        });

        return await loadImage(
          Buffer.from(response.data)
        );
      }

      // ==============================
      // LOAD BACKGROUND
      // ==============================

      let bgImg;

      try {

        bgImg = await getImg(
          bgUrl
        );

      } catch (error) {

        console.log(
          "Background Error:",
          error.message
        );

        return api.sendMessage(
          "❌ Background image could not be loaded.",
          threadID,
          messageID
        );
      }

      // ==============================
      // LOAD AVATAR
      // ==============================

      let avatarImg;

      try {

        avatarImg = await getImg(
          avatarUrl
        );

      } catch (error) {

        console.log(
          "Avatar Error:",
          error.message
        );

        return api.sendMessage(
          "❌ User profile picture could not be loaded.",
          threadID,
          messageID
        );
      }

      // ==============================
      // CREATE CANVAS
      // ==============================

      const canvas =
        createCanvas(
          1200,
          600
        );

      const ctx =
        canvas.getContext("2d");

      // ==============================
      // DRAW BACKGROUND
      // ==============================

      ctx.drawImage(
        bgImg,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Dark Overlay

      ctx.fillStyle =
        "rgba(0, 0, 0, 0.58)";

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      // ==============================
      // PREMIUM BORDER
      // ==============================

      ctx.save();

      ctx.shadowColor =
        "#22c55e";

      ctx.shadowBlur =
        25;

      ctx.strokeStyle =
        "#22c55e";

      ctx.lineWidth =
        5;

      ctx.strokeRect(
        15,
        15,
        canvas.width - 30,
        canvas.height - 30
      );

      ctx.restore();

      // ==============================
      // AVATAR GLOW
      // ==============================

      ctx.save();

      ctx.shadowColor =
        "#22c55e";

      ctx.shadowBlur =
        35;

      ctx.beginPath();

      ctx.arc(
        600,
        170,
        110,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        "#22c55e";

      ctx.fill();

      ctx.restore();

      // ==============================
      // DRAW AVATAR
      // ==============================

      ctx.save();

      ctx.beginPath();

      ctx.arc(
        600,
        170,
        100,
        0,
        Math.PI * 2
      );

      ctx.closePath();

      ctx.clip();

      ctx.drawImage(
        avatarImg,
        500,
        70,
        200,
        200
      );

      ctx.restore();

      // ==============================
      // AVATAR RING
      // ==============================

      ctx.save();

      ctx.strokeStyle =
        "#ffffff";

      ctx.lineWidth =
        5;

      ctx.beginPath();

      ctx.arc(
        600,
        170,
        100,
        0,
        Math.PI * 2
      );

      ctx.stroke();

      ctx.restore();

      // ==============================
      // TEXT SETTINGS
      // ==============================

      ctx.textAlign =
        "center";

      ctx.textBaseline =
        "alphabetic";

      ctx.shadowColor =
        "rgba(0, 0, 0, 0.95)";

      ctx.shadowBlur =
        15;

      // ==============================
      // PREMIUM WELCOME TEXT
      // ==============================

      ctx.font =
        "bold 30px NotoSansCustom, Arial";

      ctx.fillStyle =
        "#e5e7eb";

      ctx.fillText(
        "✨  WELCOME TO OUR FAMILY  ✨",
        600,
        320
      );

      // ==============================
      // GROUP NAME
      // ==============================

      let groupFontSize =
        46;

      if (threadName.length > 25) {
        groupFontSize =
          38;
      }

      if (threadName.length > 35) {
        groupFontSize =
          30;
      }

      ctx.font =
        `bold ${groupFontSize}px NotoSansCustom, Arial`;

      ctx.fillStyle =
        "#22c55e";

      ctx.shadowColor =
        "#22c55e";

      ctx.shadowBlur =
        20;

      ctx.fillText(
        threadName.toUpperCase(),
        600,
        385
      );

      // ==============================
      // USER NAME
      // ==============================

      let userFontSize =
        52;

      if (userName.length > 20) {
        userFontSize =
          42;
      }

      if (userName.length > 30) {
        userFontSize =
          34;
      }

      ctx.font =
        `bold ${userFontSize}px NotoSansCustom, Arial`;

      ctx.fillStyle =
        "#ffffff";

      ctx.shadowColor =
        "rgba(0, 0, 0, 0.9)";

      ctx.shadowBlur =
        15;

      ctx.fillText(
        `Welcome, ${userName}!`,
        600,
        455
      );

      // ==============================
      // ORDINAL FUNCTION
      // ==============================

      function getOrdinal(number) {

        const mod100 =
          number % 100;

        if (
          mod100 >= 11 &&
          mod100 <= 13
        ) {
          return `${number}th`;
        }

        switch (number % 10) {

          case 1:
            return `${number}st`;

          case 2:
            return `${number}nd`;

          case 3:
            return `${number}rd`;

          default:
            return `${number}th`;
        }
      }

      const ordinal =
        getOrdinal(
          memberCount
        );

      // ==============================
      // MEMBER TEXT
      // ==============================

      ctx.font =
        "bold 25px NotoSansCustom, Arial";

      ctx.fillStyle =
        "#d1d5db";

      ctx.shadowColor =
        "rgba(0, 0, 0, 0.9)";

      ctx.shadowBlur =
        10;

      ctx.fillText(
        `🎉 You are our ${ordinal} family member 🎉`,
        600,
        515
      );

      // ==============================
      // CACHE DIRECTORY
      // ==============================

      const cacheDir =
        path.join(
          __dirname,
          "cache"
        );

      await fs.ensureDir(
        cacheDir
      );

      const outputPath =
        path.join(
          cacheDir,
          `welcomecard_${targetID}_${Date.now()}.png`
        );

      // ==============================
      // SAVE IMAGE
      // ==============================

      fs.writeFileSync(
        outputPath,
        canvas.toBuffer(
          "image/png"
        )
      );

      // ==============================
      // PREMIUM CAPTION
      // ==============================

      const caption =
`╭━━━━━━━━━━━━━━━━━━━━╮
     ✨ 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 ✨
╰━━━━━━━━━━━━━━━━━━━━╯

🌸 𝗛𝗘𝗟𝗟𝗢, ${userName}! 🌸

💚 আমাদের ছোট্ট পরিবারের পক্ষ থেকে
আপনাকে জানাই আন্তরিক স্বাগতম! 🥰

🏡 𝗚𝗥𝗢𝗨𝗣:
『 ${threadName.toUpperCase()} 』

🎉 আপনি আমাদের পরিবারের
${ordinal}তম সদস্য! 🎊

💫 আশা করি আমাদের সাথে
আপনার প্রতিটি মুহূর্ত আনন্দময় হবে।
সবসময় হাসিখুশি থাকুন এবং
আমাদের পরিবারের সাথে থাকুন! ❤️

╭━━━━━━━━━━━━━━━━━━━━╮
   🌟 𝗘𝗡𝗝𝗢𝗬 𝗧𝗛𝗘 𝗙𝗔𝗠𝗜𝗟𝗬 🌟
╰━━━━━━━━━━━━━━━━━━━━╯

🤖 Powered by | GoatBot V2`;

      // ==============================
      // SEND WELCOME CARD
      // ==============================

      return api.sendMessage(
        {
          body: caption,
          attachment:
            fs.createReadStream(
              outputPath
            )
        },
        threadID,
        () => {

          // Delete generated image
          setTimeout(() => {

            try {

              if (
                fs.existsSync(
                  outputPath
                )
              ) {

                fs.unlinkSync(
                  outputPath
                );

              }

            } catch (cleanupError) {

              console.log(
                "Cleanup Error:",
                cleanupError.message
              );

            }

          }, 5000);

        },
        messageID
      );

    } catch (error) {

      console.error(
        "Welcome Card Error:",
        error
      );

      return api.sendMessage(
        `❌ Welcome Card Error:\n${error.message}`,
        threadID,
        messageID
      );

    }
  }
};
