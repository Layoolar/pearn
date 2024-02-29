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
	const username = ctx.from?.username || ctx.from?.first_name || ctx.from?.last_name;
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
			writeLog("error.log", `${new Date().toLocaleString()}: [Middleware] ${error.stack}\n`);
		} else {
			writeLog("error.log", `${new Date().toLocaleString()}: [Middleware] ${error}\n`);
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

// Middleware to see if user is authorized but not submitted twitter username yet
const isUserMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (ctx.from) {
		const user = getUser(ctx.from.id);
		if (user) {
			next();
		} else {
			ctx.reply(
				"<i>You need to use /start in a private message to <a href='tg://resolve?domain=TauDGX1_bot&start=/start'>TAU DGX-1</a> before you can use commands</i>",
				{
					parse_mode: "HTML",
				},
			);
		}
	}
};

// Middleware to check if the user is authorized
const isValidUserMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (ctx.from) {
		const user = getUser(ctx.from.id);
		if (user) {
			if (user.twitter_username?.length) {
				next();
			} else {
				ctx.replyWithHTML(
					`<i>You have not provided your twitter username. Use the button below to submit you twitter username. Make sure it starts with an <b>'@'</b> i.e <b>@your_twitter_username</b></i>`,
					submitTwitterButtonMarkup,
				);
			}
		} else {
			ctx.reply(
				"<i>You need to use /start in a private message to <a href='tg://resolve?domain=TauDGX1_bot&start=/start'>TAU DGX-1</a> before you can use commands</i>",
				{
					parse_mode: "HTML",
				},
			);
		}
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

//
const isPrivateChatMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (ctx.chat?.type === "private") {
		next();
	} else {
		ctx.replyWithHTML(
			`This command can only be used privately <a href="tg://resolve?domain=TauDGX1_bot&start=/menu">TAU DGX-1</a>.`,
		);
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
	isPrivateChatMiddleware,
	isUserMiddleware,
	isValidUserMiddleware,
	isAdminMiddleware,
	isCreatorMiddleware,
	isRaidOnMiddleware,
};
