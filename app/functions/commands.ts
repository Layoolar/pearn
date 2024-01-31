import { writeUser, writePoint, writeChatData, getUser } from "@app/functions/databases";
import { launchWebhook, launchPolling } from "@app/functions/launcher";
import { helpMessage, initialWelcomeMessage } from "@app/functions/messages";
import { bot } from "@app/functions/actions";
import { updateAdminFn } from "@app/functions/shared";
import config from "@configs/config";
import { adminButtonsMarkup, userButtonsMarkup } from "@app/functions/button";
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
					ctx.replyWithHTML("<b>Eddy is all setup and ready to go ✅</b>", adminButtonsMarkup);
				} else if (getUser(ctx.from.id)) {
					ctx.replyWithHTML(helpMessage, userButtonsMarkup);
				} else {
					writeUser(ctx.update.message.from);
					writePoint(ctx.update.message.from.id, 0);
					ctx.replyWithHTML(initialWelcomeMessage, userButtonsMarkup);
				}
			} else {
				// TODO add chat_title property to chat object in DB
				ctx.replyWithHTML("<b>You need to be a member of group {chat_title}<b>");
			}
		} else {
			ctx.replyWithHTML("<b>You need to use /start in a private message to Eddy before you can use commands</b>");
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
		ctx.telegram.sendMessage(ctx.from.id, "<b>Admin menu</b>", {
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

export { launch, start, quit, adminMenu, menu };
