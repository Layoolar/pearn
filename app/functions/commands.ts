import { writeUser, writePoint, writeChatData, getUser } from "@app/functions/databases";
import { launchWebhook, launchPolling } from "@app/functions/launcher";
import { adminCommand, helpMessage, initialWelcomeMessage } from "@app/functions/messages";
import { bot } from "@app/functions/actions";
import { updateAdminFn } from "@app/functions/shared";
import config from "@configs/config";
import { adminButtonsMarkup, submitTwitterButtonMarkup, userButtonsMarkup } from "@app/functions/button";
import { isAdminMiddleware, isCreatorMiddleware, isValidUserMiddleware } from "@app/functions/middlewares";

/**
 * command: /start
 * =====================
 * Send welcome message
 *
 */
const start = async (): Promise<void> => {
	bot.start(async (ctx) => {
		if (ctx.chat.type === "private") {
			const chatMember = await ctx.telegram.getChatMember(config.group_info.chat_id, ctx.from.id);
			if (chatMember) {
				if (ctx.from.id === config.group_info.creator_id) {
					writeUser({ ...ctx.update.message.from, twitter_username: "" });
					writePoint(ctx.update.message.from.id, 0);
					writeChatData({ chat_id: config.group_info.chat_id, isRaidOn: false });
					updateAdminFn(ctx);
					ctx.replyWithHTML(
						"<b>Eddy is all setup and ready to go ✅. You can use /admin to get admin guide or /menu to see user commands and buttons</b>",
						adminButtonsMarkup,
					);
				} else if (getUser(ctx.from.id)) {
					ctx.replyWithHTML(helpMessage, userButtonsMarkup);
				} else {
					writeUser(ctx.update.message.from);
					writePoint(ctx.update.message.from.id, 0);
					ctx.replyWithHTML(initialWelcomeMessage, submitTwitterButtonMarkup);
				}
			} else {
				ctx.replyWithHTML(
					`<b>You need to be a member of the group\n<a href="tg://join?invite=${config.group_info.chat_id}">Join Group</a><b>`,
				);
			}
		} else {
			ctx.replyWithHTML("<b>You need to use /start in a private message to Eddy before you can use commands</b>");
		}
	});
};

/**
 *
 */
const info = async (): Promise<void> => {
	bot.command("info", isValidUserMiddleware, async (ctx) => {
		if (ctx.chat.type === "private") {
			ctx.reply(
				`chat type: ${ctx.chat.type}\nchat ID: ${ctx.chat.id}\nfirstname: ${ctx.chat.first_name}\nlastname: ${ctx.chat.last_name}\nusername: ${ctx.chat.username}`,
			);
		} else {
			ctx.telegram.sendMessage(
				ctx.from.id,
				`chat type: ${ctx.chat.type}\nchat ID: ${ctx.chat.id}\ntitle: ${ctx.chat.title}`,
			);
		}
	});
};

/**
 *
 */
const quit = async (): Promise<void> => {
	bot.command("quit", isCreatorMiddleware, async (ctx) => {
		ctx.telegram.leaveChat(config.group_info.chat_id);
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

export { launch, start, quit, adminMenu, menu, info };
