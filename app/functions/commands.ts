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
import { dataDB, writeUser, writePoint, writePost, writeLink, getPost, getPosts } from "@app/functions/databases";
import config from "@configs/config";
import { launchPolling, launchWebhook } from "./launcher";
import { checkLinkandExtractId, checkTweet, fetchTweet } from "@app/functions/twit";
import { parseSetPostCommand } from "@app/functions/utils";

const commands = `
<b>Available Commands:</b>

- <b>/start</b> 🚀
  - <i>Description:</i> Start your journey with Eddy and receive a warm welcome message.

- <b>/help</b> ℹ️
  - <i>Description:</i> Get assistance and discover all the amazing features of Eddy.

- <b>/todays_post</b> 📢
  - <i>Description:</i> Get the latest post of the day. Admins can set it using the <b>/set_post</b> command.

- <b>/set_post [Your Message]</b> 🖋️ (Admin Only)
  - <i>Description:</i> Admins can use this command to set the post that will be shared with users using /todays_post. See /format for more info.

- <b>/format</b>
  - <i>Description:</i> Check this format for your today's post.

- <b>/submit [Your twitter post link]</b> 🖋️
  - <i>Description:</i> Post your tweet link here and receive points after Eddy has checked and verified it.

- <b>/points</b> 🖋️
  - <i>Description:</i> Check your total post points here.

- <b>/quit</b> 🚪 (Admin Only)
  - <i>Description:</i> Admins can use this command to make Eddy leave a group or channel.
`;

const helpMessage = `
${commands}
`;

const welcomeMessage = `
<b>Welcome to Eddy 🤖</b>

Hello there! 👋 Welcome to <b>Eddy</b>, your friendly companion in the world of awesomeness. We're thrilled to have you on board! Explore the commands below to unleash the full potential of Eddy.

${commands}

Feel free to explore and enjoy your time with Eddy! If you have any questions, use the <b>/help</b> command or reach out to our support. Have a fantastic day! 🌟
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

/**
 *
 */
const setPost = async (): Promise<void | never> => {
	bot.command("set_post", async (ctx) => {
		if (ctx.chat.type !== "private") {
			const admins = await ctx.getChatAdministrators();
			const user = admins.find((e) => {
				if (e.user.id == ctx.update.message.from.id) {
					return e;
				}
			});
			if (user && (user.status === "creator" || user.status === "administrator")) {
				try {
					const { tweet, keywords, hashtags } = parseSetPostCommand(ctx.message.text);
					const newPost = {
						post_id: ctx.message.message_id,
						admin_id: user.user.id,
						full_text: tweet,
						entities: { keywords, hashtags },
					};
					writePost(newPost);
					ctx.reply("<b>The new post has been set successfully ✅</b>", { parse_mode: "HTML" });
				} catch (error: unknown) {
					ctx.reply((error as Error).message);
				}
			}
		} else {
			ctx.reply("This command can only be used in a group or supergroup by an admin");
		}
	});
};

/**
 *
 */
const listPosts = async (): Promise<void> => {
	bot.command("/todays_post", (ctx) => {
		const posts = getPosts();
		if (!posts.length) {
			ctx.reply("There are no posts");
		} else {
			ctx.reply(`<b>Ensure you reply the post with your link using the /submit command</b>`, {
				parse_mode: "HTML",
			});
			posts.forEach((post, index) => {
				const postHTML = `
				<b>Post ${index + 1}</b>
				${post.full_text}
				`;
				ctx.reply(postHTML, { parse_mode: "HTML" });
			});
		}
	});
};

/**
 * command: /submit
 * ======================
 * For users to submit twitter links
 */
const submit = async (): Promise<void> => {
	bot.command("submit", async (ctx) => {
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
		const postData = getPost(repliedMessage.message_id);
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
					post_id: repliedMessage.message_id,
					user_id: ctx.from.id,
					url: link,
				})) === -1
			) {
				ctx.reply("This link has already been submitted previously");
				return;
			}
			writePoint(ctx.update.message.from.id, points);
			const msg = `<b>Your tweet has been submitted and checked!</b>

					🌟 <i>You've been assigned ${points} points for your post.</i>

					<b>Here is a breakdown of your tweet</b>
					<i>${hashtags_found} of ${total_hashtags} given hashtag${total_hashtags === 1 ? "" : "s"} were found in your tweet</i>
					<i>${keywords_found} of ${total_keywords} given keyword${total_keywords === 1 ? "" : "s"} were found in your tweet</i>

					To check your total points, use the command: <b>/points</b>`;

			ctx.telegram.sendMessage(ctx.message.chat.id, msg, { parse_mode: "HTML" });
		}
	});
};

/**
 * command: /points
 * ======================
 * For users to check their points
 */
const points = async (): Promise<void> => {
	bot.command("points", (ctx) => {
		const user = ctx.from;
		const userPoints = dataDB.get("points").find({ user_id: user.id }).value();
		ctx.reply(
			`User ${user.username}, you currently have ${userPoints.points} point${userPoints.points === 1 ? "" : "s"}`,
		);
	});
};

/**
 * command: /format
 * ===========================
 * For users and admins to check tweet format
 */
const format = async (): Promise<void> => {
	bot.command("format", (ctx) => {
		ctx.replyWithHTML(formatMessage);
	});
};

/**
 * command: /help
 * ===========================
 * For users and admins to see commands
 */
const help = async (): Promise<void> => {
	bot.command("help", (ctx) => {
		ctx.replyWithHTML(helpMessage);
	});
};

/**
 * command: /test
 * ============================
 * Test command
 */
const test = async (): Promise<void> => {
	bot.command("test", async (ctx) => {
		// console.log(ctx.message);
		ctx.reply("You clicked the test command");
	});
};

/**
 * command: /quit
 * =====================
 * If user exit from bot
 *
 */
const quit = async (): Promise<void> => {
	bot.command("quit", async (ctx) => {
		if (ctx.chat.type !== "private") {
			const admins = await ctx.getChatAdministrators();
			const user = admins.find((e) => {
				if (e.user.id == ctx.update.message.from.id) {
					return e;
				}
			});
			if (user && user.status == "creator") {
				ctx.telegram.leaveChat(ctx.message.chat.id);
				// ctx.leaveChat();
			}
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
		writeUser(ctx.update.message.from);
		writePoint(ctx.update.message.from.id, 0);

		ctx.telegram.sendMessage(ctx.message.chat.id, welcomeMessage, { parse_mode: "HTML" });
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

export { launch, quit, points, submit, format, start, help, test, setPost, listPosts };
export default launch;
