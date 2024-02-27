import { AnalyzeComment } from "@app/functions/analyzeComment";
import { joinRaidButtonMarkup, userButtonsMarkup } from "@app/functions/button";
import {
	Post,
	dataDB,
	getAdmin,
	getChatData,
	getCommentSize,
	getConfig,
	getPost,
	getPosts,
	getTop10Points,
	getUser,
	storeToken,
	writeChatData,
} from "@app/functions/databases";
import { generateComment } from "@app/functions/gpt";
import { helpMessage, raidEnd, raidMessage } from "@app/functions/messages";
import {
	hasSubmittedTwitterMiddleware,
	isAdminMiddleware,
	isPrivateChatMiddleware,
	isRaidOnMiddleware,
	isValidUserMiddleware,
} from "@app/functions/middlewares";
import { bot } from "@app/functions/wizards";
import writeLog from "./logger";
import makeTerminalRequest from "./terminal";
import { getLeaderBoard } from "./shared";

// Button actions
bot.action("set_post", isValidUserMiddleware, isAdminMiddleware, async (ctx) => {
	await ctx.scene.enter("post-wizard");
});

bot.action(
	"submit_comment",
	isValidUserMiddleware,
	isRaidOnMiddleware,
	hasSubmittedTwitterMiddleware,
	isPrivateChatMiddleware,
	async (ctx) => {
		await ctx.scene.enter("submit-wizard");
	},
);

bot.action("submit_twitter", isValidUserMiddleware, isPrivateChatMiddleware, async (ctx) => {
	await ctx.scene.enter("username-wizard");
});

bot.action("submit_wallet", isValidUserMiddleware, isPrivateChatMiddleware, async (ctx) => {
	await ctx.scene.enter("wallet-wizard");
});

bot.action("generate_comment", isValidUserMiddleware, isPrivateChatMiddleware, isRaidOnMiddleware, async (ctx) => {
	const config = getConfig();
	const chat_data = getChatData(config.chat_id);
	if (!chat_data || !chat_data.latestRaidPostId) {
		return;
	}
	const post = getPost(chat_data.latestRaidPostId);
	if (!post) {
		ctx.reply(`No post set`);
		return;
	}
	const kw = post.entities.keywords;
	const ht = post.entities.hashtags;
	const st = post.entities.comment_sample;
	if (ctx.from) {
		try {
			const comment = await generateComment(st, kw, ht);
			ctx.replyWithHTML(`<i>${comment}</i>`);
		} catch (error) {
			ctx.replyWithHTML(`<i>An error occured while generating comment, try again</i>`);
		}
	}
});

bot.action("generate_token", isAdminMiddleware, isPrivateChatMiddleware, async (ctx) => {
	const command = "openssl rand -base64 32";
	const config = getConfig();
	let output = "";
	try {
		output = await makeTerminalRequest(command);
	} catch (error) {
		writeLog("keygen_error.log", `${new Date().toLocaleString()}: ${error}\n`);
		ctx.replyWithHTML("<i>An error occured while generating key, please try again</i>");
		return;
	}
	const expiryTimeout = setTimeout(() => {
		storeToken(null);
	}, config.token_lifetime);
	expiryTimeout;
	ctx.replyWithHTML(`<b>${output}</b>`);
	storeToken({ date: new Date().toISOString(), token: output });
});

bot.action("list_raids", isValidUserMiddleware, isPrivateChatMiddleware, async (ctx) => {
	const config = getConfig();
	const chatData = getChatData(config.chat_id);
	if (chatData && chatData.latestRaidPostId) {
		const post = getPost(chatData.latestRaidPostId);
		if (post) {
			ctx.replyWithHTML(
				`<b>Current campaign\n${post.post_link}\nKeywords: ${post.entities.keywords}\nHashtags: ${post.entities.hashtags}</b>`,
				joinRaidButtonMarkup,
			);
		} else {
			ctx.replyWithHTML("<i>An error occured, please inform an admin about this error</i>");
		}
	} else {
		ctx.replyWithHTML("<b>There is no active campaign</b>");
	}
});

bot.action("posts", isValidUserMiddleware, isAdminMiddleware, async (ctx) => {
	const posts = getPosts();
	if (!posts.length) {
		ctx.reply("There are no posts");
	} else {
		posts.forEach(async (post: Post) => {
			const postHTML = `
				<b>Post ID ${post.post_id} ${post.post_link}</b>\n<i>${post.full_text}</i>`;
			if (ctx.from) {
				await ctx.telegram.sendMessage(ctx.from.id, postHTML, { parse_mode: "HTML" });
			}
		});
	}
});

bot.action("points", isValidUserMiddleware, isPrivateChatMiddleware, (ctx) => {
	const user = ctx.from;
	if (user) {
		const user_name = user.username || user.first_name || user.last_name || "";
		const userPoints = dataDB.get("points").find({ user_id: user.id }).value();
		ctx.telegram.sendMessage(
			user.id,
			`<b>${user_name}, you currently have ${userPoints.points} point${userPoints.points === 1 ? "" : "s"}</b>`,
			{ parse_mode: "HTML" },
		);
	}
});

bot.action("help", isValidUserMiddleware, (ctx) => {
	if (ctx.chat) {
		ctx.telegram.sendMessage(ctx.chat.id, helpMessage, {
			reply_markup: userButtonsMarkup.reply_markup,
			parse_mode: "HTML",
		});
	}
});

bot.action("leaderboard", isValidUserMiddleware, (ctx) => {
	getLeaderBoard(ctx);
});

bot.action("start_raid", isAdminMiddleware, isPrivateChatMiddleware, async (ctx) => {
	if (ctx.chat && ctx.chat.type !== "private") {
		ctx.reply("You need to use this command privately");
		return;
	}
	if (ctx.chat && ctx.from) {
		const config = getConfig();
		const chat_data = getChatData(config.chat_id);
		const admin = getAdmin(ctx.from.id);
		if (!chat_data || !admin) {
			ctx.reply(`You're not an admin in group ${config.chat_title}`);
			return;
		}
		if (chat_data.isRaidOn) {
			ctx.reply(
				`A campaign is on at the moment, please wait for the current campaign to end before starting another one`,
			);
			return;
		}
		if (!chat_data.latestRaidPostId) {
			ctx.reply(`There are no post yet. Use Set post button to add`);
			return;
		}

		const raidTimeout = setTimeout(() => {
			if (post) {
				ctx.telegram.sendMessage(config.chat_id, raidEnd(getCommentSize(post.post_id)), {
					parse_mode: "HTML",
				});
				const post_id = chat_data.latestRaidPostId;
				if (post_id) {
					writeChatData({ chat_id: config.chat_id, isRaidOn: false, latestRaidPostId: null });
					const startCheck = new AnalyzeComment(post_id);
					startCheck.start().then(() => {
						ctx.telegram.sendMessage(
							config.chat_id,
							`<b>Point allocation completed. New Leaderboard 📢</b>`,
							{
								parse_mode: "HTML",
							},
						);
						getLeaderBoard(ctx);
					});
				}
			}
		}, config.campaign_duration);

		// Starting the timeout
		raidTimeout;
		const post = getPost(chat_data.latestRaidPostId);
		if (!post) {
			ctx.reply(`No post set`);
			return;
		}
		writeChatData({ ...chat_data, isRaidOn: true });
		ctx.telegram.sendMessage(config.chat_id, raidMessage(post.post_link), {
			parse_mode: "HTML",
		});
	}
});

export { bot };
