import { bot } from "@app/functions/actions";
import { adminButtonsMarkup, submitTwitterButtonMarkup, userButtonsMarkup } from "@app/functions/button";
import {
	clearDB,
	getConfig,
	getToken,
	getUser,
	setConfig,
	writeAdmin,
	writeChatData,
	writePoint,
	writeUser,
} from "@app/functions/databases";
import { launchPolling, launchWebhook } from "@app/functions/launcher";
import { adminCommand, helpMessage, initialWelcomeMessage } from "@app/functions/messages";
import { isAdminMiddleware, isCreatorMiddleware, isValidUserMiddleware } from "@app/functions/middlewares";
import config from "@configs/config";
import writeLog from "./logger";

/**
 * command: /start
 * =====================
 * Send welcome message
 *
 */
const start = async (): Promise<void> => {
	bot.start(async (ctx) => {
		if (ctx.chat.type === "private") {
			const token = ctx.message.text.split(" ")[1];
			const valid = token === config.owner_secret_key;
			const prevConfig = getConfig();
			if (valid) {
				setConfig({ ...prevConfig, creator_id: ctx.from.id });
				writeUser({ ...ctx.update.message.from, twitter_username: "" });
				writePoint(ctx.update.message.from.id, 0);
				ctx.replyWithHTML(
					"<b>Authentication successful. You can use /configure to configure the bot after it is added to your group.</b>",
				);
				return;
			}
			if (prevConfig.creator_id === 0 || prevConfig.chat_id === 0) {
				ctx.reply("Bot not configured yet");
				return;
			}
			const chatMember = await ctx.telegram.getChatMember(prevConfig.chat_id, ctx.from.id);
			if (chatMember) {
				if (getUser(ctx.from.id)) {
					ctx.replyWithHTML(helpMessage, userButtonsMarkup);
				} else {
					writeUser(ctx.update.message.from);
					writePoint(ctx.update.message.from.id, 0);
					ctx.replyWithHTML(initialWelcomeMessage, submitTwitterButtonMarkup);
				}
			} else {
				ctx.replyWithHTML(
					`<b>You need to be a member of the group\n<a href="tg://join?invite=${prevConfig.chat_id}">Join Group</a><b>`,
				);
			}
		} else {
			ctx.replyWithHTML(
				"<b>You need to use /start in a private message to TAU DGX-1 before you can use commands</b>",
			);
		}
	});
};

/**
 *
 */
const configure = async (): Promise<void> => {
	bot.command("configure", async (ctx) => {
		if (ctx.chat.type === "private") {
			ctx.replyWithHTML("<i>This command can only be used in a group or supergroup</i>");
		} else {
			const prevConfig = getConfig();
			if (ctx.from.id === prevConfig.creator_id) {
				setConfig({ ...prevConfig, chat_id: ctx.chat.id, chat_title: ctx.chat.title });
				writeChatData({ chat_id: ctx.chat.id, isRaidOn: false });
				writeAdmin({ chat_id: ctx.chat.id, user_id: ctx.from.id, status: "creator" });
				ctx.telegram.sendMessage(
					ctx.from.id,
					"<b>Configuration successful 🎉🎉🎉. TAU DGX-1 is all setup and ready to go ✅. You can use /admin to get admin guide or /menu to see user commands and buttons</b>",
					{
						reply_markup: adminButtonsMarkup.reply_markup,
						parse_mode: "HTML",
					},
				);
			}
		}
	});
};

const addAdmin = async (): Promise<void> => {
	bot.command("add_admin", isValidUserMiddleware, (ctx) => {
		if (ctx.chat.type !== "private") {
			ctx.replyWithHTML("<i>This command can only be used in private chat</i>");
		} else {
			const token = ctx.message.text.split(" ")[1];
			const storedToken = getToken();
			if (!storedToken) {
				ctx.replyWithHTML("<i>Your token has expired, request for another one from an admin</i>");
			} else {
				if (token === storedToken.token) {
					const prevConfig = getConfig();
					writeAdmin({ chat_id: prevConfig.chat_id, user_id: ctx.from.id, status: "administrator" });
				} else {
					ctx.replyWithHTML("<i>Your token is invalid</i>");
				}
			}
		}
	});
};

const eraseDB = async (): Promise<void> => {
	bot.command("erase_db", isCreatorMiddleware, async (ctx) => {
		if (ctx.chat.type === "private") {
			const token = ctx.message.text.split(" ")[1];
			const storedToken = getToken();
			if (!storedToken) {
				ctx.replyWithHTML("<i>Your token has expired, you need to generate another one</i>");
			} else {
				if (token === storedToken.token) {
					clearDB();
					ctx.replyWithHTML(`<i>Databases cleared successfully.</i>`);
				} else {
					ctx.replyWithHTML("<i>Your token is invalid</i>");
				}
			}
		}
	});
};

/**
 *
 */
const quit = async (): Promise<void> => {
	bot.command("quit", isCreatorMiddleware, async (ctx) => {
		const config = getConfig();
		ctx.telegram.leaveChat(config.chat_id);
	});
};

/**
 *
 */
const adminMenu = async (): Promise<void> => {
	bot.command("/admin", isAdminMiddleware, async (ctx) => {
		ctx.telegram.sendMessage(ctx.from.id, adminCommand, {
			reply_markup: adminButtonsMarkup.reply_markup,
			parse_mode: "HTML",
		});
	});
};

/**
 *
 */
const menu = async (): Promise<void> => {
	bot.command("/menu", isValidUserMiddleware, async (ctx) => {
		ctx.telegram.sendMessage(ctx.from.id, "<b>Menu</b>", {
			reply_markup: userButtonsMarkup.reply_markup,
			parse_mode: "HTML",
		});
	});
};

const error = async (): Promise<void> => {
	bot.catch((err, ctx) => {
		writeLog("error.log", `${new Date().toLocaleString()}: Error in ${ctx.updateType} ${err}\n`);
		ctx.reply("An error occured. Please try again later. If error persists, please contact the admin");
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

export { addAdmin, adminMenu, configure, eraseDB, error, launch, menu, quit, start };
