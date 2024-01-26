import { getAdmin, getChatData, getUser } from "@app/functions/databases";
import bot, { CustomContext } from "@app/functions/telegraf";
import config from "@configs/config";
import { Context, MiddlewareFn } from "telegraf";
import { updateAdminFn } from "@app/functions/shared";

// Middlewares

// Logging middleware
const loggingMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	const start = Date.now();
	const timestamp = () => new Date().toLocaleTimeString();
	const userId = ctx.from?.id;
	const chatId = ctx.chat?.id;
	const username = ctx.from?.username;
	const ut = ctx.updateType;
	const { log } = console;

	// Check if the context is an Update with a message
	if ("message" in ctx.update && "text" in ctx.update.message) {
		const command = ctx.update.message?.text;

		// Log incoming requests
		log(
			"\u001b[38:5:45m",
			`[${timestamp()}] UT-[${ut}] Request from ${username || "UnknownUser"} (ID: ${userId}) in chat ${chatId}: ${
				command || "No command"
			}`,
			"\u001b[0m",
		);
	} else {
		// Handle other types of updates if needed
		log("\u001b[48:5:202m", `Received an update UT-[${ut}]`, "\u001b[0m");
		log(
			"\u001b[38:5:45m",
			`[${timestamp()}] UT-[${ut}] Request from ${username || "UnknownUser"} (ID: ${userId}) in chat ${chatId}`,
			"\u001b[0m",
		);
	}
	next().then(() => {
		const ms = Date.now() - start;
		log("\u001b[48:5:57m", `Request processed in ${ms}ms`, "\u001b[0m");
	});
};

// Middleware to check if the message is from the authorized group
const isFromAuthorizedGroupMiddleware: MiddlewareFn<CustomContext> = (ctx, next) => {
	if (ctx.chat && ctx.chat.type !== "private" && ctx.chat.id === config.group_info.chat_id) {
		next();
	} else {
		ctx.reply("This command can only be used in the authorized group");
		// if (ctx.chat && ctx.chat.type !== "private") {
		// 	await ctx.telegram.leaveChat(ctx.chat.id);
		// }
	}
};

// Middleware to check if the user is authorized
const isValidUserMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (ctx.from && getUser(ctx.from.id)) {
		next();
	} else {
		ctx.reply("<b>You need to use /start in a private message to Eddy before you can use commands</b>", {
			parse_mode: "HTML",
		});
	}
};

// Middleware to update admin status
const updateAdminMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	updateAdminFn(ctx);
	next();
};

// Middleware to check if user is creator
const isCreatorMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (ctx.from && ctx.from.id === config.group_info.creator_id) {
		next();
	} else {
		ctx.reply("Requires creator permission");
	}
};

// Middleware to check if user is admin
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

// Error to check if user has provided their twitter info
const useSubmittedTwitterMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (!ctx.from) {
		return;
	}
	const submittedTwitter = getUser(ctx.from.id);
	const isAdmin = getAdmin(ctx.from.id);

	if (submittedTwitter?.twitter_username || isAdmin) {
		next();
	} else {
		ctx.replyWithHTML(
			`<b>You have not provided your twitter username. To do this, use <i>/add_twitter [Your twitter username]</i></b>`,
		);
	}
};

// Allow users to use submit command when raid is on
const isRaidOnMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	const allowed = getChatData(config.group_info.chat_id)?.isRaidOn;
	if (allowed) {
		next();
	} else {
		ctx.replyWithHTML("<b>Raid has ended, lookout for the next one</b>");
	}
};

bot.use(loggingMiddleware, isValidUserMiddleware);

export {
	isFromAuthorizedGroupMiddleware,
	isValidUserMiddleware,
	updateAdminMiddleware,
	useAdminMiddleware,
	isCreatorMiddleware,
	useSubmittedTwitterMiddleware,
	isRaidOnMiddleware,
};
