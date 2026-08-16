const fs = require("fs-extra");
const { utils } = global;

module.exports = {
	config: {
		name: "prefix",
		version: "3.0",
		author: "BaYjid Fixed by Sk Habibulla",
		countDown: 5,
		role: 0,
		noPrefix: true, // ✅ prefix ছাড়াই "prefix" লিখলে চলবে
		description: "🛠️ 𝐂𝐡𝐚𝐧𝐠𝐞 𝐭𝐡𝐞 𝐛𝐨𝐭 𝐩𝐫𝐞𝐟𝐢𝐱 𝐢𝐧 𝐲𝐨𝐮𝐫 𝐜𝐡𝐚𝐭 𝐛𝐨𝐱 𝐨𝐫 𝐭𝐡𝐞 𝐞𝐧𝐭𝐢𝐫𝐞 𝐬𝐲𝐬𝐭𝐞𝐦 (𝐨𝐧𝐥𝐲 𝐛𝐨𝐭 𝐚𝐝𝐦𝐢𝐧)",
		category: "⚙️ 𝐂𝐨𝐧𝐟𝐢𝐠𝐮𝐫𝐚𝐭𝐢𝐨𝐧",
		guide: {
			en:
				"╭───〔 🔧 𝗣𝗥𝗘𝗙𝗜𝗫 𝗚𝗨𝗜𝗗𝗘 〕───╮\n"
				+ "│\n"
				+ "│ 📌 prefix\n"
				+ "│    ↳ Show current prefix (no prefix needed)\n"
				+ "│\n"
				+ "│ 📌 {pn} <new prefix>\n"
				+ "│    ↳ Change prefix in this chat only\n"
				+ "│    ↳ e.g. {pn} #\n"
				+ "│\n"
				+ "│ 📌 {pn} <new prefix> -g\n"
				+ "│    ↳ Change prefix system-wide (bot admin)\n"
				+ "│    ↳ e.g. {pn} # -g\n"
				+ "│\n"
				+ "│ 🔄 {pn} reset\n"
				+ "│    ↳ Reset this chat's prefix to default\n"
				+ "│\n"
				+ "╰──────────────────────╯"
		}
	},

	langs: {
		en: {
			reset:
				"╭─── ✅ 𝗥𝗘𝗦𝗘𝗧 ───╮\n"
				+ "│ Prefix reset to default\n"
				+ "│ ➜ %1\n"
				+ "╰────────────────╯",
			alreadyDefault:
				"╭─── ℹ️ 𝗜𝗡𝗙𝗢 ───╮\n"
				+ "│ No custom prefix set\n"
				+ "│ Already using default: %1\n"
				+ "╰────────────────╯",
			onlyAdmin:
				"╭─── ⚠️ 𝗗𝗘𝗡𝗜𝗘𝗗 ───╮\n"
				+ "│ Only bot admin can change\n"
				+ "│ the system-wide prefix!\n"
				+ "╰────────────────────╯",
			invalidPrefix:
				"╭─── ⚠️ 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 ───╮\n"
				+ "│ Prefix must be 1-5 characters\n"
				+ "│ and shouldn't contain letters\n"
				+ "│ or numbers.\n"
				+ "│ ➜ Use symbols like ! . # $\n"
				+ "╰──────────────────────╯",
			samePrefix:
				"╭─── ℹ️ 𝗜𝗡𝗙𝗢 ───╮\n"
				+ "│ Prefix is already set to:\n"
				+ "│ ➜ %1\n"
				+ "╰────────────────╯",
			confirmGlobal:
				"╭─ 🔄 𝗖𝗢𝗡𝗙𝗜𝗥𝗠 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗 ─╮\n"
				+ "│\n"
				+ "│ React ✅ below to confirm\n"
				+ "│ changing the SYSTEM-WIDE\n"
				+ "│ prefix to: \"%1\"\n"
				+ "│\n"
				+ "│ ⏳ Expires in 30 seconds\n"
				+ "│\n"
				+ "╰──────────────────────────╯",
			confirmThisThread:
				"╭─ 🔄 𝗖𝗢𝗡𝗙𝗜𝗥𝗠 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗 ─╮\n"
				+ "│\n"
				+ "│ React ✅ below to confirm\n"
				+ "│ changing this group's\n"
				+ "│ prefix to: \"%1\"\n"
				+ "│\n"
				+ "│ ⏳ Expires in 30 seconds\n"
				+ "│\n"
				+ "╰──────────────────────────╯",
			expired:
				"╭─── ⌛ 𝗘𝗫𝗣𝗜𝗥𝗘𝗗 ───╮\n"
				+ "│ Confirmation timed out.\n"
				+ "│ Please run the command\n"
				+ "│ again.\n"
				+ "╰──────────────────────╯",
			successGlobal:
				"╭─── ✅ 𝗨𝗣𝗗𝗔𝗧𝗘𝗗 ───╮\n"
				+ "│ System-wide prefix\n"
				+ "│ changed to: %1\n"
				+ "╰──────────────────────╯",
			successThisThread:
				"╭─── ✅ 𝗨𝗣𝗗𝗔𝗧𝗘𝗗 ───╮\n"
				+ "│ This group's prefix\n"
				+ "│ changed to: %1\n"
				+ "╰──────────────────────╯",
			myPrefix:
				"╭───〔 🔧 𝗣𝗥𝗘𝗙𝗜𝗫 𝗜𝗡𝗙𝗢 〕───╮\n"
				+ "│\n"
				+ "│ 👥  Group      : %1\n"
				+ "│ 🌍  System     : %2\n"
				+ "│ 💬  This Group : %3\n"
				+ "│ 🏷️  Type       : %4\n"
				+ "│ ⏰  Server Time: %5\n"
				+ "│\n"
				+ "│ ─────────────────────\n"
				+ "│ 💡 Type ➜ %3help\n"
				+ "│    to see all commands\n"
				+ "│\n"
				+ "╰──────────────────────────╯"
		}
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
		// শুধু "prefix" লিখলে (কোনো args ছাড়া) — বর্তমান prefix দেখাবে
		if (!args[0]) {
			return showCurrentPrefix({ message, event, threadsData, getLang });
		}

		// ═══════ RESET ═══════
		if (args[0].toLowerCase() === "reset") {
			const threadData = await threadsData.get(event.threadID);
			if (!threadData?.data?.prefix) {
				return message.reply(getLang("alreadyDefault", global.GoatBot.config.prefix));
			}
			await threadsData.set(event.threadID, null, "data.prefix");
			return message.reply(getLang("reset", global.GoatBot.config.prefix));
		}

		// ═══════ SET NEW PREFIX ═══════
		const newPrefix = args[0];

		// ✅ Validation
		if (newPrefix.length > 5 || /[a-zA-Z0-9]/.test(newPrefix)) {
			return message.reply(getLang("invalidPrefix"));
		}

		const formSet = {
			commandName,
			author: event.senderID,
			newPrefix,
			setGlobal: args[1] === "-g",
			createdAt: Date.now()
		};

		if (formSet.setGlobal && role < 2) {
			return message.reply(getLang("onlyAdmin"));
		}

		// ✅ একই prefix হলে confirm করার দরকার নেই
		const currentPrefix = formSet.setGlobal
			? global.GoatBot.config.prefix
			: utils.getPrefix(event.threadID);
		if (newPrefix === currentPrefix) {
			return message.reply(getLang("samePrefix", currentPrefix));
		}

		const confirmMessage = formSet.setGlobal
			? getLang("confirmGlobal", newPrefix)
			: getLang("confirmThisThread", newPrefix);

		return message.reply(confirmMessage, (err, info) => {
			if (err) return;
			formSet.messageID = info.messageID;
			global.GoatBot.onReaction.set(info.messageID, formSet);

			// ✅ ৩০ সেকেন্ড পর confirm না করলে auto-expire
			setTimeout(() => {
				const stillPending = global.GoatBot.onReaction.get(info.messageID);
				if (stillPending && stillPending.createdAt === formSet.createdAt) {
					global.GoatBot.onReaction.delete(info.messageID);
					message.reply(getLang("expired")).catch(() => {});
				}
			}, 30000);
		});
	},

	onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
		const { author, newPrefix, setGlobal } = Reaction;

		// শুধু যিনি command দিয়েছেন তিনিই react করতে পারবেন
		if (event.userID !== author) return;

		// শুধু ✅ react accept করবে
		if (event.reaction !== "✅") return;

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			return message.reply(getLang("successGlobal", newPrefix));
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			return message.reply(getLang("successThisThread", newPrefix));
		}
	},

	onChat: async function ({ event, message, getLang }) {
		if (event.body && event.body.toLowerCase() === "prefix") {
			return showCurrentPrefix({ message, event, getLang });
		}
	}
};

// ───────────────────────────────
// Helper function
async function showCurrentPrefix({ message, event, threadsData, getLang }) {
	const systemPrefix = global.GoatBot.config.prefix;
	const groupPrefix = utils.getPrefix(event.threadID);

	const threadData = threadsData ? await threadsData.get(event.threadID) : null;
	const isCustom = threadData?.data?.prefix ? "Custom" : "Default";

	const time = new Date().toLocaleString("en-US", {
		timeZone: "Asia/Dhaka",
		hour12: true
	});

	return message.reply(
		getLang(
			"myPrefix",
			event.isGroup ? "Yes" : "No",
			systemPrefix,
			groupPrefix,
			isCustom,
			time
		)
	);
								 }
