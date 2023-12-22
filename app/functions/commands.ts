/**
 * Telegraf Commands
 * =====================
 *
 * @contributors: Patryk Rzucidło [@ptkdev] <support@ptkdev.io> (https://ptk.dev)
 *
 * @license: MIT License
 *
 */
import bot from "@app/functions/telegraf";
import {
	dataDB,
	writeUser,
	writePoint,
	writePost,
	writeLink,
	getPost,
	getPosts,
	writeAdmins,
	getUser,
	getAdmin,
} from "@app/functions/databases";
import config from "@configs/config";
import { launchPolling, launchWebhook } from "./launcher";
import { checkLinkandExtractId, checkTweet, fetchTweet } from "@app/functions/twit";
import { getPostIdentifier, parseSetPostCommand } from "@app/functions/utils";
import { MiddlewareFn, Context, Markup } from "telegraf";

const commands = `
<b>Available Commands:</b>

- <b>/start</b> 🚀
  - <i>Description:</i> Start your journey with Eddy and receive a warm welcome message.

- <b>/menu</b>
  - <i>Description:</i> Display all Eddy menu buttons.

- <b>/set_post [Your Message]</b> 🖋️ (Admin Only)
  - <i>Description:</i> Admins can use this command to set the post that will be shared with users using /todays_post. Click <b>Post format</b> for more info.

- <b>/submit [Your twitter post link]</b> 🖋️
  - <i>Description:</i> Post your tweet link here and receive points after Eddy has checked and verified it.

- <b>/update_admins</b> 🖋️
  - <i>Description:</i> Inform Eddy that a new administator has been added.

- <b>Help</b> ℹ️
  - <i>Description:</i> Get assistance and discover all the amazing features of Eddy.

- <b>Today's posts</b> 📢
  - <i>Description:</i> Get the latest post of the day. Admins can set it using the <b>/set_post</b> command.

- <b>Format</b>
  - <i>Description:</i> Check this format for your today's post.

- <b>My points</b> 🖋️
  - <i>Description:</i> Check your total post points here.

- <b>Quit</b> 🚪 (Admin Only)
  - <i>Description:</i> Admins can use this command to make Eddy leave a group or channel.
`;

const helpMessage = `
${commands}
`;

const welcomeMessage = `
<b>Welcome to Eddy 🤖</b>

Hello there! 👋 Welcome to <b>Eddy</b>, your friendly companion in the world of awesomeness. We're thrilled to have you on board! Explore the commands below to unleash the full potential of Eddy.

${commands}

Feel free to explore and enjoy your time with Eddy! If you have any questions, use the <b>Help</b> button or reach out to our support. Have a fantastic day! 🌟
`;

const formatMessage = `
<b>Format</b>

\`\`\`
/set_post # SetPost
Tweet: "Hey friends, I am excited to announce a new project 💪🔥💻. I will be using #nodejs #typescript #firebase @firebasehq and #react @react"
Keywords: new, project, announce, friends
Hashtags: #nodejs, #typescript, #react, #firebase, #coding
\`\`\`

<b>Note</b>
- Tweet content must be placed after <b>Tweet:</b> and between ""
- All keywords and hashtags should be listed as seen above
- Hashtags: hashtag1, hashtag2 must contain the # sign.
`;

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

const buttons = Markup.inlineKeyboard([
	[Markup.button.callback("Today's posts", "todays_post"), Markup.button.callback("My points", "points")],
	[Markup.button.callback("Submit wallet", "wallet")],
	[Markup.button.callback("Post format", "format"), Markup.button.callback("Help", "help")],
	[Markup.button.callback("Test", "test"), Markup.button.callback("Quit", "quit")],
]);

// Middlewares
bot.use(async (ctx, next) => {
	next();
});

const isValidUserMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (!ctx.from) {
		return;
	}
	if (!getUser(ctx.from)) {
		ctx.reply("<b>You need to use /start in a private message to Eddy before you can use commands</b>", {
			parse_mode: "HTML",
		});
	} else {
		next();
	}
};

const updateAdminMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
	if (ctx.chat && ctx.chat.type !== "private") {
		const chat_id = ctx.chat.id;
		const admins = await ctx.getChatAdministrators();
		const admins_data = admins.map((admin) => {
			return { chat_id, user_id: admin.user.id, status: admin.status };
		});
		writeAdmins(admins_data);
		next();
	} else {
		ctx.reply("You need to be in a group or supergroup to use this command");
	}
};

const useAdminMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (ctx.from) {
		const admin = getAdmin(ctx.from.id);
		if (admin) {
			next();
		} else {
			ctx.reply("You need administrative permissions to use this command");
		}
	}
};

// Button actions

// bot.action("set_wallet", isValidUserMiddleware, (ctx) => { });

bot.action("todays_post", isValidUserMiddleware, async (ctx) => {
	const posts = getPosts();
	if (!posts.length) {
		ctx.reply("There are no posts");
	} else {
		if (ctx.from) {
			await ctx.telegram.sendMessage(
				ctx.from.id,
				`<b>Ensure you reply the post with your link using the /submit command</b>`,
				{ parse_mode: "HTML" },
			);
		}
		posts.forEach(async (post) => {
			const postHTML = `
				<b>Post ID ${post.post_id} - ${post.post_points} point${post.post_points === 1 ? "" : "s"}</b>\n<i>${post.full_text}</i>
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
		const userPoints = dataDB.get("points").find({ user_id: user.id }).value();
		ctx.telegram.sendMessage(
			user.id,
			`<b>${user.username}, you currently have ${userPoints.points} point${
				userPoints.points === 1 ? "" : "s"
			}</b>`,
			{ parse_mode: "HTML" },
		);
	}
});

bot.action("format", useAdminMiddleware, (ctx) => {
	ctx.replyWithHTML(formatMessage);
});

bot.action("test", useAdminMiddleware, async (ctx) => {
	ctx.reply("You found the test command");
});

bot.action("help", isValidUserMiddleware, (ctx) => {
	if (ctx.chat) {
		ctx.telegram.sendMessage(ctx.chat.id, helpMessage, {
			reply_markup: buttons.reply_markup,
			parse_mode: "HTML",
		});
	}
});

bot.action("quit", useAdminMiddleware, async (ctx) => {
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

//
bot.on("new_chat_members", updateAdminMiddleware, () => {
	return;
});

bot.on("chat_member", updateAdminMiddleware, () => {
	return;
});
//

// Commands

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
					const { tweet, keywords, hashtags } = parseSetPostCommand(ctx.message.text);
					const newPost = {
						post_id: Math.floor(Date.now() / 1000),
						admin_id: admin.user_id,
						full_text: tweet,
						post_points: keywords.length + hashtags.length,
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
	bot.command("submit", isValidUserMiddleware, async (ctx) => {
		let tweet;
		const link = ctx.update.message.text.split(" ")[1];
		if (!link) {
			ctx.reply("Please provide a valid twitter link using /submit [your_link]");
			return;
		}
		const tweetId = checkLinkandExtractId(link);
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

			ctx.telegram.sendMessage(ctx.message.chat.id, welcomeMessage, {
				reply_markup: buttons.reply_markup,
				parse_mode: "HTML",
			});
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

export { launch, start, menu, setPost, submit, updateAdmins };
export default launch;
