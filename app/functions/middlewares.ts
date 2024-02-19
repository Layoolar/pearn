import { getAdmin, getChatData, getUser } from "@app/functions/databases";
import config from "@configs/config";
import bot from "@app/functions/telegraf";
import { Context, MiddlewareFn } from "telegraf";
import { updateAdminFn } from "@app/functions/shared";
import { submitTwitterButtonMarkup } from "./button";
import fs from "fs";

// Middlewares
const errorLoggerMiddleware = async (ctx: Context, next: () => Promise<unknown>) => {
	try {
		await next();
	} catch (error) {
		if (error instanceof Error) {
			fs.appendFileSync("error.log", `${new Date().toISOString()}: ${error.stack}\n`);
			ctx.reply("An error occurred. Please try again later.");
		}
	}
};

// Middleware to check if the message is from the authorized group
const isFromAuthorizedGroupMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (ctx.chat && ctx.chat.type !== "private" && ctx.chat.id === config.group_info.chat_id) {
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
			"<b>You need to use /start in a private message to <a href='tg://resolve?domain=edd_the_tweet_bot&start=/start'>TAU DGX-1</a> before you can use commands</b>",
			{
				parse_mode: "HTML",
			},
		);
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
const isAdminMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (ctx.from) {
		const admin = getAdmin(ctx.from.id);
		if (admin || ctx.from.id === config.group_info.creator_id) {
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
	const allowed = getChatData(config.group_info.chat_id)?.isRaidOn;
	if (allowed) {
		next();
	} else {
		ctx.replyWithHTML("<b>Campaign has ended, lookout for the next one</b>");
	}
};

bot.use(errorLoggerMiddleware);

export {
	bot,
	isFromAuthorizedGroupMiddleware,
	isValidUserMiddleware,
	updateAdminMiddleware,
	isAdminMiddleware,
	isCreatorMiddleware,
	hasSubmittedTwitterMiddleware,
	isRaidOnMiddleware,
};
