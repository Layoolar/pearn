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
import { pointsDB, writeUser, writePoint } from "@app/functions/databases";
import config from "@configs/config";
import { launchPolling, launchWebhook } from "./launcher";
import { checkLinkandExtractId, checkTweet } from "@app/functions/twit";

const welcomeMessage = `
<b>Welcome to Eddy 🤖</b>

Hello there! 👋 Welcome to <b>Eddy</b>, your friendly companion in the world of awesomeness. We're thrilled to have you on board! Explore the commands below to unleash the full potential of Eddy.

<b>Available Commands:</b>

- <b>/start</b> 🚀
  - <i>Description:</i> Start your journey with Eddy and receive a warm welcome message.

- <b>/help</b> ℹ️
  - <i>Description:</i> Get assistance and discover all the amazing features of AwesomeBot.

- <b>/photo</b> 📸
  - <i>Description:</i> Receive a cool photo from the vast universe of the internet. Try it out!

- <b>/todays_post</b> 📢
  - <i>Description:</i> Get the latest post of the day. Admins can set it using the <code>/set_todays_post</code> command.

- <b>/set_todays_post [Your Message]</b> 🖋️ (Admin Only)
  - <i>Description:</i> Admins can use this command to set the post that will be shared with users using <code>/todays_post</code>.

- <b>/submit [Your twitter post link]</b> 🖋️
  - <i>Description:</i> Post your tweet link here and receive points after Eddy has checked and verified it.

- <b>/points</b> 🖋️
  - <i>Description:</i> Check your total post points here.

- <b>/quit</b> 🚪 (Admin Only)
  - <i>Description:</i> Admins can use this command to make Eddy leave a group or channel.

Feel free to explore and enjoy your time with Eddy! If you have any questions, use the <code>/help</code> command or reach out to our support. Have a fantastic day! 🌟
`;

const data = {
	id_str: "1234567890123456789",
	full_text: "Excited to work on a project using #nodejs, #react, and #typescript! 🚀",
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
const setPost = async (): Promise<void> => {
	bot.command("set_post", async (ctx) => {
		const user = ctx.update.message.from;
		console.log(user);
	});
};

/**
 * command: /submit
 * ======================
 * For users to submit twitter links
 */
const submit = async (): Promise<void> => {
	bot.command("submit", async (ctx) => {
		const link = ctx.update.message.text.split(" ")[1];
		if (!link) {
			ctx.reply("Please provide a valid twitter link using /submit [your_link]");
			return;
		}
		const tweetId = checkLinkandExtractId(link);
		if (!tweetId) {
			ctx.reply("This is not a valid twitter link, please provide a valid twitter link");
		} else {
			// const tweet = await fetchTweet(tweetId);
			if (data) {
				const { tweet_found, total_hashtags, total_keywords, hashtags_found, keywords_found, points } =
					checkTweet(data);
				if (!tweet_found) {
					const msg = `<b>We could not find the tweet with the link you posted</b>`;
					ctx.telegram.sendMessage(ctx.message.chat.id, msg, { parse_mode: "HTML" });
				} else {
					writePoint(ctx.update.message.from.id, points);
					const msg = `<b>Your tweet has been submitted and checked!</b>

					🌟 <i>You've been assigned ${points} points for your post.</i>

					<b>Here is a breakdown of your tweet</b>
					<i>${hashtags_found} of ${total_hashtags} given hashtag${total_hashtags === 1 ? "" : "s"} were found in your tweet</i>
					<i>${keywords_found} of ${total_keywords} given keyword${total_keywords === 1 ? "" : "s"} were found in your tweet</i>

					To check your total points, use the command: <b>/points</b>`;

					ctx.telegram.sendMessage(ctx.message.chat.id, msg, { parse_mode: "HTML" });
				}
			}
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
		const user_id = ctx.update.message.from.id;
		const userPoints = pointsDB.get("points").find({ user_id }).value();
		ctx.reply(
			`User ${ctx.update.message.from.username}, you currently have ${userPoints.points} point${
				userPoints.points === 1 ? "" : "s"
			}`,
		);
	});
};

const test = async (): Promise<void> => {
	bot.command("test", async (ctx) => {
		ctx.reply("This is a text command");
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

export { launch, quit, points, submit, start, test, setPost };
export default launch;
