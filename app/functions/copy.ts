import {
	getAdmin,
	getAdminForChat,
	getChatData,
	getLink,
	getPost,
	getUser,
	writeChatData,
	writeLink,
	writePoint,
	writePost,
	writeUser,
} from "@app/functions/databases";
import bot from "@app/functions/telegraf";
import { checkTweet, fetchTweet } from "@app/functions/twit";
import { extractId, extractUsername, getPostIdentifier, parseSetPostCommand } from "@app/functions/utils";
import config from "@configs/config";
import { buttons } from "./actions";
import { launchPolling, launchWebhook } from "./launcher";
import {
	adminCommand,
	breakdownMessage,
	formatMessage,
	helpMessage,
	initialWelcomeMessage,
	welcomeMessage,
} from "./messages";
import {
	isFromAuthorizedGroupMiddleware,
	isValidUserMiddleware,
	updateAdminMiddleware,
	useAdminMiddleware,
	useSubmittedTwitterMiddleware,
} from "./middlewares";
import scheduleNewJob from "./scheduler";
import { updateAdminFn } from "@app/functions/shared";

let data = {
	id_str: "1234567890123456789",
	full_text: "Excited to work on a NEw project using #nodejs, #react, and #typescript! 🚀",
	user: {
		screen_name: "example_user",
		name: "Example User",
	},
	entities: {
		hashtags: [{ text: "nodejs" }, { text: "react" }, { text: "typescript" }],
	},
};

// Updates
bot.on("new_chat_members", updateAdminMiddleware);

// Commands

const getChatInfo = async (): Promise<void> => {
	bot.command("info", async (ctx) => {
		if (ctx.chat.type !== "private") {
			const admins = await ctx.getChatAdministrators();
			const user = admins.find((e) => {
				if (ctx.from && e.user.id == ctx.from.id) {
					return e;
				}
			});
			if (user && user.status == "creator") {
				const data = {
					title: ctx.chat.title,
					id: ctx.chat.id,
					type: ctx.chat.type,
				};
				// TODO send better formatted text no stringified JSON
				ctx.telegram.sendMessage(ctx.from.id, JSON.stringify(data));
			} else {
				ctx.reply("You are not the creator of this group/supergroup");
			}
		} else {
			const data = {
				firstname: ctx.from.first_name,
				username: ctx.from.username,
				id: ctx.chat.id,
				type: ctx.chat.type,
			};
			ctx.reply(JSON.stringify(data));
		}
	});
};

const test = async (): Promise<void> => {
	bot.command("test", isFromAuthorizedGroupMiddleware, useAdminMiddleware, async (ctx) => {
		ctx.reply("You found the test command");
	});
};

const format = async (): Promise<void> => {
	bot.command("format", useAdminMiddleware, (ctx) => {
		ctx.replyWithHTML(formatMessage);
	});
};

const adminGuide = async (): Promise<void> => {
	bot.command("guide", useAdminMiddleware, (ctx) => {
		if (ctx.chat.type === "private") {
			ctx.replyWithHTML(adminCommand);
		} else {
			ctx.replyWithHTML("<b>You need to send this command privately to Eddy</b>");
		}
	});
};

const quit = async (): Promise<void> => {
	bot.command("quit", useAdminMiddleware, async (ctx) => {
		if (ctx.chat && ctx.chat.type !== "private") {
			const admins = await ctx.getChatAdministrators();
			const user = admins.find((e) => {
				if (ctx.from && e.user.id == ctx.from.id) {
					return e;
				}
			});
			if (user && user.status == "creator") {
				ctx.leaveChat();
			}
		}
	});
};

/**
 *
 */
const addTwitter = async (): Promise<void> => {
	bot.command("add_twitter", (ctx) => {
		const exists = getUser(ctx.from.id);
		if (exists) {
			const username = ctx.message.text.split(" ")[1].trim();
			writeUser({ ...exists, twitter_username: username });
			ctx.replyWithHTML(`<b>Your Twitter username has been updated successfully ✅.</b>`);
		} else {
			ctx.telegram.sendMessage(ctx.message.chat.id, welcomeMessage, {
				reply_markup: buttons.reply_markup,
				parse_mode: "HTML",
			});
		}
	});
};

/**
 *
 */
const updateAdmins = async (): Promise<void> => {
	bot.command("update_admins", useAdminMiddleware, updateAdminMiddleware, (ctx) => {
		ctx.replyWithHTML("<b>The admins have been updated successfully ✅.</b>");
	});
};

/**
 *
 */
const menu = async (): Promise<void> => {
	bot.command("menu", isValidUserMiddleware, (ctx) => {
		ctx.telegram.sendMessage(ctx.message.chat.id, "<b>Eddy Bot Menu</b>", {
			reply_markup: buttons.reply_markup,
			parse_mode: "HTML",
		});
	});
};

const startRaid = async (): Promise<void | never> => {
	bot.command("start_raid", isValidUserMiddleware, useAdminMiddleware, async (ctx) => {
		if (ctx.chat.type !== "private") {
			ctx.reply("You need to use this command privately");
			return;
		}
		const chat_data = getChatData(config.group_info.chat_id);
		const admin = getAdminForChat({ chat_id: config.group_info.chat_id, user_id: ctx.from.id });
		if (!chat_data || !admin) {
			// TODO make robust group object
			ctx.reply("You're not an admin in group {group_title}");
			return;
		}
		// TODO Get mother post
		// TODO Set counter
		const duration = 15 * 60 * 1000;
		setTimeout((ctx) => {
			ctx.reply("Raid Ended");
			writeChatData({ ...chat_data, isRaidOn: false });
		}, duration);
		// TODO Recieve link to mother post with this command
		writeChatData({ ...chat_data, isRaidOn: true });
		ctx.reply("Raid Started");
	});
};

/**
 *
 */
const setPost = async (): Promise<void | never> => {
	bot.command("set_post", isValidUserMiddleware, useAdminMiddleware, async (ctx) => {
		if (ctx.chat.type === "private") {
			const admin = getAdmin(ctx.from.id);
			if (admin) {
				try {
					const { tweet, keywords, hashtags, points } = parseSetPostCommand(ctx.message.text);
					const post_link = "";
					// TODO Ensure postlink comes from chat
					const newPost = {
						post_id: Math.floor(Date.now() / 1000),
						post_link,
						admin_id: admin.user_id,
						full_text: tweet,
						post_points: (keywords.length + hashtags.length) * points,
						entities: { keywords, hashtags },
					};
					writePost(newPost);
					ctx.telegram.sendMessage(
						admin.chat_id,
						"<b>The new post has been set successfully ✅. Use <i>Todays post</i> button in menu to see all posts</b>",
						{
							parse_mode: "HTML",
						},
					);
				} catch (error: unknown) {
					ctx.reply((error as Error).message);
				}
			}
		} else {
			ctx.reply("This command can only be used in a private chat by an admin");
		}
	});
};

/**
 * command: /submit
 * ======================
 * For users to submit twitter links
 */
const submit = async (): Promise<void> => {
	bot.command("submit", isValidUserMiddleware, useSubmittedTwitterMiddleware, async (ctx) => {
		const allowedToSubmit = getChatData(ctx.from.id);
		if (!allowedToSubmit) {
			ctx.reply("There is no ongoing raid for this chat");
			return;
		}
		const link = ctx.update.message.text.split(" ")[1];
		if (!link) {
			ctx.reply("Please provide a valid twitter link using /submit [your_link]");
			return;
		}
		const tweetId = extractId(link);
		if (!tweetId) {
			ctx.reply("This is not a valid twitter link, please provide a valid twitter link");
			return;
		}
		const repliedMessage = ctx.message.reply_to_message;
		if (!repliedMessage) {
			ctx.reply("You need to reply to the post with the /submit [Your twitter post link] command");
			return;
		}
		const repliedMessageText = (repliedMessage as { text: string }).text;
		const repliedMessageId = getPostIdentifier(repliedMessageText);
		if (!repliedMessageId) {
			ctx.reply("Unable to extract post identifier");
			return;
		}
		const postData = getPost(repliedMessageId);
		if (!postData) {
			ctx.reply("Post does not exist or has been deleted or has expired");
			return;
		}
		const userData = getUser(ctx.from.id);
		if (!userData) {
			ctx.reply("You need to provide your twitter username to Eddy");
			return;
		}
		if (userData.twitter_username !== extractUsername(link)) {
			ctx.reply("You can only submit your own links.");
			return;
		}
		const linkPostedPreviously = getLink({
			link_id: tweetId,
			post_id: repliedMessageId,
			user_id: ctx.from.id,
			url: link,
		});

		if (linkPostedPreviously) {
			ctx.reply("This link has been submitted previously");
			return;
		}

		ctx.replyWithHTML(
			`<b>Your link has been submitted, your tweet would be awareded points at the end of the raid</b>`,
		);

		scheduleNewJob(
			ctx.from.id,
			async () => {
				let tweet;
				// TODO: Verify the validity of the post here
				try {
					tweet = await fetchTweet(tweetId);
					// console.log("Tweet Data:", tweet);
					// Continue with the logic for successful tweet retrieval
				} catch (error) {
					// TODO: Take care of response and send to the user
					// console.error("Error fetching tweet:", error);
					// return;
				}
				if (tweet) {
					data = tweet;
				}

				const {
					tweet_found,
					total_hashtags,
					total_keywords,
					hashtags_found,
					keywords_found,
					points,
					total_points,
				} = checkTweet(data, postData);
				if (!tweet_found) {
					const msg = `<b>We could not find the tweet with the link you posted</b>`;
					ctx.telegram.sendMessage(ctx.message.chat.id, msg, { parse_mode: "HTML" });
				} else {
					writeLink({
						link_id: tweetId,
						post_id: repliedMessageId,
						user_id: ctx.from.id,
						url: link,
					});
					writePoint(ctx.update.message.from.id, points);

					ctx.telegram.sendMessage(
						ctx.message.chat.id,
						breakdownMessage({
							total_hashtags,
							total_keywords,
							hashtags_found,
							keywords_found,
							points,
							total_points,
						}),
						{ parse_mode: "HTML" },
					);
				}
			},
			new Date(Date.now() + 60 * 1000),
		);
	});
};

/**
 * command: /start
 * =====================
 * Send welcome message
 *
 */
const start = async (): Promise<void> => {
	bot.start(async (ctx) => {
		if (ctx.chat.type === "private") {
			let chatMember;
			try {
				chatMember = await ctx.telegram.getChatMember(config.group_info.chat_id, ctx.from.id);
			} catch (error) {
				// TODO unable to get chat member
				return;
			}
			console.log(chatMember);
			if (chatMember) {
				if (ctx.from.id == config.group_info.creator_id) {
					// TODO Call update group info and current admins
					writeUser(ctx.update.message.from);
					writePoint(ctx.update.message.from.id, 0);
					writeChatData({ chat_id: config.group_info.chat_id, isRaidOn: false });
					updateAdminFn(ctx);
					ctx.replyWithHTML("<b>Eddy is all setup and ready to go ✅</b>");
				} else if (getUser(ctx.from.id)) {
					ctx.replyWithHTML(helpMessage);
				} else {
					writeUser(ctx.update.message.from);
					writePoint(ctx.update.message.from.id, 0);
					ctx.replyWithHTML(initialWelcomeMessage);
				}
			} else {
				// TODO add chat_title property to chat object in DB
				ctx.replyWithHTML("<b>You need to be a member of group {chat_title}<b>");
			}
		} else {
			if (ctx.chat.id == config.group_info.chat_id) {
				ctx.replyWithHTML(helpMessage);
			} else {
				ctx.replyWithHTML("<b>You need to start Eddy privately</b>");
			}
		}
	});
};

/**
 * Run bot
 * =====================
 * Send welcome message
 *
 */
const launch = async (): Promise<void> => {
	const mode = config.mode;
	if (mode === "webhook") {
		launchWebhook();
	} else {
		launchPolling();
	}
};

export { addTwitter, adminGuide, format, getChatInfo, launch, menu, quit, setPost, start, submit, test, updateAdmins };
export default launch;
