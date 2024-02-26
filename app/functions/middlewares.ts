import { getAdmin, getChatData, getConfig, getUser } from "@app/functions/databases";
import bot from "@app/functions/telegraf";
import { Context, MiddlewareFn } from "telegraf";
import { submitTwitterButtonMarkup } from "./button";
import writeLog from "./logger";

// Middlewares
// Logging middleware
const eventLoggingMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	const start = Date.now();
	const timestamp = () => new Date().toLocaleString();
	const userId = ctx.from?.id;
	const chatId = ctx.chat?.id;
	const username = ctx.from?.username || ctx.from?.first_name;
	const ut = ctx.updateType;

	if ("message" in ctx.update && "text" in ctx.update.message) {
		const command = ctx.update.message?.text;
		writeLog(
			"events.log",
			`[${timestamp()}] UT-[${ut}] Request from ${username || "UnknownUser"} (ID: ${userId}) in chat ${chatId}: ${
				command || "No command"
			}\n`,
		);
	} else {
		writeLog(
			"events.log",
			`Received an update UT-[${ut}]\n[${timestamp()}] UT-[${ut}] Request from ${
				username || "UnknownUser"
			} (ID: ${userId}) in chat ${chatId}\n`,
		);
	}
	next().then(() => {
		const ms = Date.now() - start;
		writeLog("events.log", `Request processed ${ut} in ${ms}ms\n`);
	});
};

const errorLoggerMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
	try {
		await next();
	} catch (error) {
		if (error instanceof Error) {
			writeLog("error.log", `${new Date().toLocaleString()}: ${error.stack}\n`);
		} else {
			writeLog("error.log", `${new Date().toLocaleString()}: ${error}\n`);
		}
		ctx.reply("An error occurred. Please try again later. If error persists, please contact an admin");
	}
};

// Middleware to check if the message is from the authorized group
const isFromAuthorizedGroupMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	const config = getConfig();
	if (ctx.chat && ctx.chat.type !== "private" && ctx.chat.id === config.chat_id) {
		next();
	} else {
		ctx.reply("This command can only be used in the authorized group");
	}
};

// Middleware to check if the user is authorized
const isValidUserMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (ctx.from && getUser(ctx.from.id)) {
		next();
	} else {
		ctx.reply(
			"<b>You need to use /start in a private message to <a href='tg://resolve?domain=TauDGX1_bot&start=/start'>TAU DGX-1</a> before you can use commands</b>",
			{
				parse_mode: "HTML",
			},
		);
	}
};

// Middleware to check if user is creator
const isCreatorMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	const config = getConfig();
	if (ctx.from && ctx.from.id === config.creator_id) {
		next();
	} else {
		ctx.reply("Requires creator permission");
	}
};

// Middleware to check if user is admin
const isAdminMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (ctx.from) {
		const config = getConfig();
		const admin = getAdmin(ctx.from.id);
		if (ctx.from.id === config.creator_id || admin) {
			next();
		} else {
			ctx.reply("You need administrative permissions to use this command");
		}
	}
};

// Error to check if user has provided their twitter info
const hasSubmittedTwitterMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (!ctx.from) {
		return;
	}
	const submittedTwitter = getUser(ctx.from.id);
	const isAdmin = getAdmin(ctx.from.id);

	if (submittedTwitter?.twitter_username || isAdmin) {
		next();
	} else {
		ctx.replyWithHTML(
			`<b>You have not provided your twitter username. Use the button below to submit you twitter username. Make sure it starts with an <i>'@'</i></b>`,
			submitTwitterButtonMarkup,
		);
	}
};

// Allow users to use submit command when raid is on
const isRaidOnMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	const config = getConfig();
	const allowed = getChatData(config.chat_id)?.isRaidOn;
	if (allowed) {
		next();
	} else {
		ctx.replyWithHTML("<b>Campaign has ended, lookout for the next one</b>");
	}
};

bot.use(eventLoggingMiddleware, errorLoggerMiddleware);

export {
	bot,
	isFromAuthorizedGroupMiddleware,
	isValidUserMiddleware,
	isAdminMiddleware,
	isCreatorMiddleware,
	hasSubmittedTwitterMiddleware,
	isRaidOnMiddleware,
};
