import { dataDB, getPosts } from "@app/functions/databases";
import { isValidUserMiddleware, useAdminMiddleware } from "./middlewares";
import bot from "@app/functions/telegraf";
import { helpMessage } from "./messages";
import { Markup } from "telegraf";

export const buttons = Markup.inlineKeyboard([
	[Markup.button.callback("Today's posts", "todays_post"), Markup.button.callback("My points", "points")],
	[Markup.button.callback("Submit wallet", "wallet"), Markup.button.callback("Help", "help")],
]);
// Button actions

// bot.action("set_wallet", isValidUserMiddleware, (ctx) => { });

bot.action("todays_post", isValidUserMiddleware, async (ctx) => {
	const posts = getPosts();
	if (!posts.length) {
		ctx.reply("There are no posts");
	} else {
		if (ctx.from) {
			await ctx.telegram.sendMessage(
				ctx.from.id,
				`<b>Ensure you reply the post with your link using the /submit command</b>`,
				{ parse_mode: "HTML" },
			);
		}
		posts.forEach(async (post) => {
			const postHTML = `
				<b>Post ID ${post.post_id} - ${post.post_points} point${post.post_points === 1 ? "" : "s"}</b>\n<i>${post.full_text}</i>
				`;
			if (ctx.from) {
				await ctx.telegram.sendMessage(ctx.from.id, postHTML, { parse_mode: "HTML" });
			}
		});
	}
});

bot.action("points", isValidUserMiddleware, (ctx) => {
	const user = ctx.from;
	if (user) {
		const userPoints = dataDB.get("points").find({ user_id: user.id }).value();
		ctx.telegram.sendMessage(
			user.id,
			`<b>${user.username}, you currently have ${userPoints.points} point${
				userPoints.points === 1 ? "" : "s"
			}</b>`,
			{ parse_mode: "HTML" },
		);
	}
});

bot.action("help", isValidUserMiddleware, (ctx) => {
	if (ctx.chat) {
		ctx.telegram.sendMessage(ctx.chat.id, helpMessage, {
			reply_markup: buttons.reply_markup,
			parse_mode: "HTML",
		});
	}
});
