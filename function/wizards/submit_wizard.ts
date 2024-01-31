import { Composer, Markup, Scenes } from "telegraf";
import { SceneContext } from "@app/functions/telegraf";
import { extractId, extractUsername } from "../utils";
import { writeLink } from "../databases";

const PostData = {
	link: "",
	hashtags: [],
	keywords: [],
};

const stepHandler = new Composer<SceneContext>();
stepHandler.action("confirm", async (ctx) => {
	if (ctx.from) {
		const commentLink = ctx.scene.session.store.comment[ctx.from.id];
		const commentId = extractId(commentLink);
		const username = extractUsername(commentLink);
		if (commentId) {
			await ctx.reply(`You've confirmed the Twitter link: ${commentLink}`);
			// TODO fetch post id
			const linkData = {
				link_id: commentId,
				post_id: 0,
				user_id: ctx.from.id,
				url: commentLink,
			};
			writeLink(linkData);
		} else {
			await ctx.reply("Invalid comment link. Check the link and try again.");
		}
	} else {
		await ctx.reply("Link was not saved");
	}
	return await ctx.scene.leave();
});
stepHandler.action("cancel", async (ctx) => {
	await ctx.reply("You've cancelled the operation");
	return await ctx.scene.leave();
});

export const submitWizard = new Scenes.WizardScene<SceneContext>(
	"submit-wizard",
	async (ctx) => {
		if (!ctx.from) {
			return await ctx.scene.leave();
		}
		await ctx.reply("Please submit your comment link");
		ctx.scene.session.store = { post: PostData, comment: {} };
		return ctx.wizard.next();
	},
	async (ctx) => {
		if (ctx.from) {
			if (ctx.message && "text" in ctx.message) {
				ctx.scene.session.store.comment[ctx.from.id] = ctx.message.text;
			}
			ctx.replyWithMarkdown(
				`Please confirm the Twitter link: ${ctx.scene.session.store.comment[ctx.from.id]}`,
				Markup.inlineKeyboard([
					Markup.button.callback("Confirm", "confirm"),
					Markup.button.callback("Cancel", "cancel"),
				]),
			);
			return ctx.wizard.next();
		}
		await ctx.reply("This operation has been cancelled");
		ctx.scene.leave();
	},
	stepHandler,
);
