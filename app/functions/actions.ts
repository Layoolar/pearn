import config from "@app/configs/config";
import { joinRaidButtonMarkup, userButtonsMarkup } from "@app/functions/button";
import {
	Post,
	dataDB,
	getAdmin,
	getChatData,
	getCommentSize,
	getPost,
	getPosts,
	writeChatData,
} from "@app/functions/databases";
import { helpMessage, raidEnd, raidMessage } from "@app/functions/messages";
import {
	hasSubmittedTwitterMiddleware,
	isAdminMiddleware,
	isRaidOnMiddleware,
	isValidUserMiddleware,
	updateAdminMiddleware,
} from "@app/functions/middlewares";
import { bot } from "@app/functions/wizards";
import { AnalyzeComment } from "@app/functions/analyzeComment";
import { generateComment } from "@app/functions/gpt";

// Button actions
bot.action("set_post", isValidUserMiddleware, isAdminMiddleware, async (ctx) => {
	await ctx.scene.enter("post-wizard");
});

bot.action("submit_wallet", async (ctx) => {
	await ctx.reply("This feature is not yet available");
});

bot.action("submit_comment", isValidUserMiddleware, isRaidOnMiddleware, hasSubmittedTwitterMiddleware, async (ctx) => {
	await ctx.scene.enter("submit-wizard");
});

bot.action("submit_twitter", isValidUserMiddleware, async (ctx) => {
	await ctx.scene.enter("username-wizard");
});

bot.action("generate_comment", isValidUserMiddleware, isRaidOnMiddleware, async (ctx) => {
	const chat_data = getChatData(config.group_info.chat_id);
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
			console.log(error);
			ctx.replyWithHTML(`<i>An error occured while generating comment, try again</i>`);
		}
	}
});

bot.action("list_raids", isValidUserMiddleware, async (ctx) => {
	const chatData = getChatData(config.group_info.chat_id);
	if (chatData && chatData.latestRaidPostId) {
		const post = getPost(chatData.latestRaidPostId);
		if (post) {
			ctx.replyWithHTML(`<b>Current campaign\n${post.post_link}</b>`, joinRaidButtonMarkup);
		} else {
			ctx.replyWithHTML("<i>An error occured, please inform an admin about this error</i>");
		}
	} else {
		ctx.replyWithHTML("<b>There is no ongoing campaign</b>");
	}
});

bot.action("posts", isValidUserMiddleware, isAdminMiddleware, async (ctx) => {
	const posts = getPosts();
	if (!posts.length) {
		ctx.reply("There are no posts");
	} else {
		posts.forEach(async (post: Post) => {
			const postHTML = `
				<b>Post ID ${post.post_id} ${post.post_link}</b>\n<i>${post.full_text}</i>
				`;
			if (ctx.from) {
				await ctx.telegram.sendMessage(ctx.from.id, postHTML, { parse_mode: "HTML" });
			}
		});
	}
});

bot.action("points", isValidUserMiddleware, (ctx) => {
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
	if (ctx.chat) {
		// const points = getTop10Points();
		// const topUsers = points.map((point) => {
		// 	const user = getUser(point.user_id);
		// 	return {
		// 		username: user?.username || user?.first_name || user?.twitter_username || "Anonymous user",
		// 		points: point.points,
		// 	};
		// });
		interface User {
			username: string;
			points: number;
		}

		const topUsers: User[] = [
			{ username: "Alice", points: 250 },
			{ username: "Bob", points: 220 },
			{ username: "Charlie", points: 200 },
			{ username: "David", points: 180 },
			{ username: "Eva", points: 170 },
			{ username: "Frank", points: 160 },
			{ username: "Grace", points: 150 },
			{ username: "Henry", points: 140 },
			{ username: "Ivy", points: 130 },
			{ username: "Jack", points: 120 },
			{ username: "Kelly", points: 110 },
			{ username: "Liam", points: 100 },
			{ username: "Mia", points: 90 },
			{ username: "Nora", points: 80 },
			{ username: "Olivia", points: 70 },
			{ username: "Peter", points: 60 },
			{ username: "Quinn", points: 50 },
			{ username: "Rose", points: 40 },
			{ username: "Sam", points: 30 },
			{ username: "Tom", points: 20 },
		];
		let leaderBoardText = "<b>Top 10 Users with the Highest Points:</b>\n\n";
		topUsers.forEach((user, index) => {
			leaderBoardText += `<b>${index + 1}.</b> <i>${user.username}</i> - <b>${user.points}</b> points\n`;
		});

		ctx.telegram.sendMessage(ctx.chat.id, leaderBoardText, {
			parse_mode: "HTML",
		});
	}
});

bot.action("update_admins", isAdminMiddleware, updateAdminMiddleware, (ctx) => {
	ctx.replyWithHTML("<b>The admins have been updated successfully ✅.</b>");
});

bot.action("start_raid", isAdminMiddleware, async (ctx) => {
	if (ctx.chat && ctx.chat.type !== "private") {
		ctx.reply("You need to use this command privately");
		return;
	}
	if (ctx.chat && ctx.from) {
		const chat_data = getChatData(config.group_info.chat_id);
		const admin = getAdmin(ctx.from.id);
		if (!chat_data || !admin) {
			ctx.reply("You're not an admin in group {group_title}");
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

		const duration = 80 * 1000;
		const raidTimeout = setTimeout(() => {
			if (post) {
				ctx.telegram.sendMessage(config.group_info.chat_id, raidEnd(getCommentSize(post.post_id)), {
					parse_mode: "HTML",
				});
				writeChatData({ chat_id: config.group_info.chat_id, isRaidOn: false });
				if (chat_data.latestRaidPostId) {
					const startCheck = new AnalyzeComment(chat_data.latestRaidPostId);
					startCheck.start();
				}
			}
		}, duration);

		// Starting the timeout
		raidTimeout;
		const post = getPost(chat_data.latestRaidPostId);
		if (!post) {
			ctx.reply(`No post set`);
			return;
		}
		writeChatData({ ...chat_data, isRaidOn: true });
		ctx.telegram.sendMessage(config.group_info.chat_id, raidMessage(post.post_link), {
			parse_mode: "HTML",
		});
	}
});

export { bot };
