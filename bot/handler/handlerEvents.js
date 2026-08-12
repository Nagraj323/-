async function onStart() {
	// —————————————— CHECK USE BOT —————————————— //
	if (!body) return;

	// ══════════ ADMIN NO PREFIX SYSTEM ══════════
	const isAdminBot = (global.GoatBot.config.adminBot || []).includes(senderID);

	let usedPrefix = prefix;
	let bodyToParse = body;

	if (body.startsWith(prefix)) {
		// সবাই প্রিফিক্স দিয়ে ব্যবহার করতে পারবে
		bodyToParse = body;
		usedPrefix = prefix;
	} else if (isAdminBot) {
		// শুধুমাত্র Bot Admin প্রিফিক্স ছাড়া ব্যবহার করতে পারবে
		const possibleCmd = body.trim().split(/ +/)[0].toLowerCase();
		const cmdExists = GoatBot.commands.has(possibleCmd) || GoatBot.commands.has(GoatBot.aliases.get(possibleCmd));
		
		if (!cmdExists) return; // কমান্ড না থাকলে নরমাল মেসেজ হিসেবে যাবে
		
		usedPrefix = "";
		bodyToParse = body;
	} else {
		// সাধারণ ইউজার প্রিফিক্স ছাড়া লিখলে কিছু হবে না
		return;
	}
	// ═══════════════════════════════════════════

	const dateNow = Date.now();
	const args = bodyToParse.slice(usedPrefix.length).trim().split(/ +/);
	// ————————————  CHECK HAS COMMAND ——————————— //
	let commandName = args.shift().toLowerCase();
	let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));
	// ———————— CHECK ALIASES SET BY GROUP ———————— //
	const aliasesData = threadData.data.aliases || {};
	for (const cmdName in aliasesData) {
		if (aliasesData[cmdName].includes(commandName)) {
			command = GoatBot.commands.get(cmdName);
			break;
		}
	}
	// ————————————— SET COMMAND NAME ————————————— //
	if (command)
		commandName = command.config.name;
	// ——————— FUNCTION REMOVE COMMAND NAME ———————— //
	function removeCommandNameFromBody(body_, prefix_, commandName_) {
		if (arguments.length) {
			if (typeof body_ != "string")
				throw new Error(`The first argument (body) must be a string, but got "${getType(body_)}"`);
			if (typeof prefix_ != "string")
				throw new Error(`The second argument (prefix) must be a string, but got "${getType(prefix_)}"`);
			if (typeof commandName_ != "string")
				throw new Error(`The third argument (commandName) must be a string, but got "${getType(commandName_)}"`);

			return body_.replace(new RegExp(`^\( {prefix_}(\\s+|) \){commandName_}`, "i"), "").trim();
		}
		else {
			return body.replace(new RegExp(`^\( {usedPrefix}(\\s+|) \){commandName}`, "i"), "").trim();
		}
	}
	// —————  CHECK BANNED OR ONLY ADMIN BOX  ————— //
	if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
		return;
		if (!command) {
		if (!hideNotiMessage.commandNotFound && (!commandName || commandName.trim() === ""))
			return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "prefixOnly", prefix));
		if (!hideNotiMessage.commandNotFound && commandName) {
			const input = commandName.toLowerCase();
			const allCommands = Array.from(GoatBot.commands.keys());
			function levenDist(a, b) {
				const m = a.length, n = b.length;
				const dp = Array.from({length: m+1}, (_, i) => Array.from({length: n+1}, (_, j) => i||j));
				for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
					dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
				return dp[m][n];
			}
			const scored = allCommands.map(cmd => {
				const c = cmd.toLowerCase();
				const substringBonus = input.includes(c) || c.includes(input) ? -100 : 0;
				return { cmd, score: levenDist(input, c) + substringBonus };
			});
			scored.sort((a, b) => a.score - b.score);
			const bestScore = scored[0].score;
			const top = scored.filter(s => s.score <= bestScore + 1).slice(0, 3).map(s => `› \( {prefix} \){s.cmd}`);
			return await message.reply(
				utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFoundSuggestion", top.join("\n"), prefix)
			);
		} else return true;
	}
	// ————————————— CHECK PERMISSION ———————————— //
	const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
	const needRole = roleConfig.onStart;

	if (needRole > role) {
		if (!hideNotiMessage.needRoleToUseCmd) {
			if (needRole == 1)
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdmin", commandName));
			else if (needRole == 2)
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2", commandName));
		}
		else {
			return true;
		}
	}
	// ———————————————— countDown ———————————————— //
	if (!client.countDown[commandName])
		client.countDown[commandName] = {};
	const timestamps = client.countDown[commandName];
	let getCoolDown = command.config.countDown;
	if (!getCoolDown && getCoolDown != 0 || isNaN(getCoolDown))
		getCoolDown = 1;
	const cooldownCommand = getCoolDown * 1000;
	if (timestamps[senderID]) {
		const expirationTime = timestamps[senderID] + cooldownCommand;
		if (dateNow < expirationTime)
			return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "waitingForCommand", ((expirationTime - dateNow) / 1000).toString().slice(0, 3)));
	}
	// ——————————————— RUN COMMAND ——————————————— //
	const time = getTime("DD/MM/YYYY HH:mm:ss");
	isUserCallCommand = true;
	try {
		// analytics command call
		(async () => {
			const analytics = await globalData.get("analytics", "data", {});
			if (!analytics[commandName])
				analytics[commandName] = 0;
			analytics[commandName]++;
			await globalData.set("analytics", analytics, "data");
		})();

		createMessageSyntaxError(commandName);
		const getText2 = createGetText2(langCode, `\( {process.cwd()}/languages/cmds/ \){langCode}.js`, prefix, command);
		await command.onStart({
			...parameters,
			args,
			commandName,
			getLang: getText2,
			removeCommandNameFromBody
		});
		timestamps[senderID] = dateNow;
		log.info("CALL COMMAND", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
	}
	catch (err) {
		log.err("CALL COMMAND", `An error occurred when calling the command ${commandName}`, err);
		return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
	}
}
