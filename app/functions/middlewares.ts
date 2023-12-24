import bot from "@app/functions/telegraf";
import { writeAdmins, getUser, getAdmin, getUserData } from "@app/functions/databases";
import { MiddlewareFn, Context } from "telegraf";

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

const useSubmittedTwitterMiddleware: MiddlewareFn<Context> = (ctx, next) => {
	if (!ctx.from) {
		return;
	}
	const submittedTwitter = getUserData(ctx.from.id);
	const isAdmin = getAdmin(ctx.from.id);

	if (!submittedTwitter || !isAdmin) {
		ctx.replyWithHTML(
			`<b>You have not provided your twitter username. To do this, use <i>/add_twitter [Your twitter username]</i></b>`,
		);
	} else {
		next();
	}
};

export { isValidUserMiddleware, updateAdminMiddleware, useAdminMiddleware, useSubmittedTwitterMiddleware };
