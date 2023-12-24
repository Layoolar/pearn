import bot from "@app/functions/telegraf";
import {
	writeUser,
	writeUserData,
	writePoint,
	writePost,
	writeLink,
	getPost,
	getUser,
	getAdmin,
	getUserData,
} from "@app/functions/databases";
import config from "@configs/config";
import { launchPolling, launchWebhook } from "./launcher";
import { checkTweet, fetchTweet } from "@app/functions/twit";
import { extractId, getPostIdentifier, parseSetPostCommand } from "@app/functions/utils";
import { buttons } from "./actions";
import { welcomeMessage, initialWelcomeMessage } from "./messages";
import {
	useAdminMiddleware,
	updateAdminMiddleware,
	isValidUserMiddleware,
	useSubmittedTwitterMiddleware,
} from "./middlewares";

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

// Commands

/**
 *
 */
const addTwitter = (): void => {
	bot.command("add_twitter", (ctx) => {
		const exists = getUserData(ctx.from.id);
		const username = ctx.message.text.split(" ")[1].trim();
		writeUserData({ user_id: ctx.from.id, twitter_username: username });
		if (exists) {
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
const updateAdmins = (): void => {
	bot.command("update_admins", useAdminMiddleware, updateAdminMiddleware, (ctx) => {
		ctx.replyWithHTML("<b>The admins have been updated successfully ✅.</b>");
	});
};

/**
 *
 */
const menu = (): void => {
	bot.command("menu", isValidUserMiddleware, (ctx) => {
		ctx.telegram.sendMessage(ctx.message.chat.id, "<b>Eddy Bot Menu</b>", {
			reply_markup: buttons.reply_markup,
			parse_mode: "HTML",
		});
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
					const newPost = {
						post_id: Math.floor(Date.now() / 1000),
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
		let tweet;
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
		const repliedMessageText = (repliedMessage as { text: string }).text;
		const repliedMessageId = getPostIdentifier(repliedMessageText);
		if (!repliedMessageId) {
			ctx.reply("Unable to extract post identifier");
			return;
		}
		const postData = getPost(repliedMessageId);
		if (!postData) {
			ctx.reply("Post does not exist or has been deleted");
			return;
		}
		const { tweet_found, total_hashtags, total_keywords, hashtags_found, keywords_found, points } = checkTweet(
			data,
			postData,
		);
		if (!tweet_found) {
			const msg = `<b>We could not find the tweet with the link you posted</b>`;
			ctx.telegram.sendMessage(ctx.message.chat.id, msg, { parse_mode: "HTML" });
		} else {
			if (
				(await writeLink({
					link_id: tweetId,
					post_id: repliedMessageId,
					user_id: ctx.from.id,
					url: link,
				})) === -1
			) {
				ctx.reply("This link has already been submitted previously");
				return;
			}
			writePoint(ctx.update.message.from.id, points);
			const msg = `<b>Your tweet has been submitted and checked!</b>

					🌟 <i>You've been assigned ${points} out of ${total_keywords + total_hashtags} points for your post.</i>

					<b>Here is a breakdown of your tweet</b>
					<i>${hashtags_found} of ${total_hashtags} given hashtag${total_hashtags === 1 ? "" : "s"} were found in your tweet</i>
					<i>${keywords_found} of ${total_keywords} given keyword${total_keywords === 1 ? "" : "s"} were found in your tweet</i>

					To check your total points, click the <b>My points</b> button`;

			ctx.telegram.sendMessage(ctx.message.chat.id, msg, { parse_mode: "HTML" });
		}
	});
};

/**
 * command: /start
 * =====================
 * Send welcome message
 *
 */
const start = async (): Promise<void> => {
	bot.start((ctx) => {
		if (ctx.chat.type === "private" && !getUser(ctx.from)) {
			writeUser(ctx.update.message.from);
			writePoint(ctx.update.message.from.id, 0);

			ctx.replyWithHTML(initialWelcomeMessage);
		} else if (ctx.chat.type !== "private" && !getUser(ctx.from)) {
			ctx.telegram.sendMessage(
				ctx.message.chat.id,
				"<b>You need to use /start in a private message to Eddy before you can use commands in this group</b>",
				{ parse_mode: "HTML" },
			);
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

export { launch, start, menu, addTwitter, setPost, submit, updateAdmins };
export default launch;
