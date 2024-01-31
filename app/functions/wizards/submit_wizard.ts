import { Composer, Markup, Scenes } from "telegraf";
import { WizardContext } from "@app/functions/telegraf";
import { extractId, extractUsername } from "@app/functions/utils";
import { getChatData, writeComment } from "@app/functions/databases";
import config from "@configs/config";

const PostData = {
	link: "",
	hashtags: [],
	keywords: [],
};

const stepHandler = new Composer<WizardContext>();
stepHandler.action("confirm", async (ctx) => {
	if (ctx.from) {
		const commentLink = ctx.scene.session.store.comment[ctx.from.id];
		const commentId = extractId(commentLink);
		const username = extractUsername(commentLink);
		// TODO Crosscheck username with stored twitter username
		if (commentId) {
			const chatData = getChatData(config.group_info.chat_id);
			if (chatData?.latestRaidPostId) {
				if (!chatData.isRaidOn) {
					await ctx.replyWithHTML("<b>Too slow, the raid has ended, look out for the next one</b>");
				} else {
					await ctx.replyWithHTML(`<b>Your comment link has been submitted: ${commentLink}</b>`);
					// TODO fetch post id
					const commentData = {
						link_id: commentId,
						post_id: chatData.latestRaidPostId,
						user_id: ctx.from.id,
						url: commentLink,
					};
					writeComment(commentData);
				}
			} else {
				await ctx.replyWithHTML("<b>An error occured, please inform an Admin about this error</b>");
			}
		} else {
			await ctx.replyWithHTML("<b>Invalid comment link. Check the link and try again.</b>");
		}
	} else {
		await ctx.replyWithHTML("<b>Link was not saved</b>");
	}
	return await ctx.scene.leave();
});
stepHandler.action("cancel", async (ctx) => {
	await ctx.reply("You've cancelled the operation");
	return await ctx.scene.leave();
});

export const submitWizard = new Scenes.WizardScene<WizardContext>(
	"submit-wizard",
	async (ctx) => {
		if (!ctx.from) {
			return await ctx.scene.leave();
		}
		await ctx.replyWithHTML("<b>Please submit your comment link</b>");
		ctx.scene.session.store = { post: PostData, comment: {} };
		return ctx.wizard.next();
	},
	async (ctx) => {
		if (ctx.from) {
			if (ctx.message && "text" in ctx.message) {
				ctx.scene.session.store.comment[ctx.from.id] = ctx.message.text;
			} else {
				ctx.replyWithHTML("<i>No comment link was submitted, this operation has been cancelled</i>");
				return ctx.scene.leave();
			}
			ctx.replyWithHTML(
				`<i>Please confirm the Twitter link: ${ctx.scene.session.store.comment[ctx.from.id]}</i>`,
				Markup.inlineKeyboard([
					Markup.button.callback("Confirm", "confirm"),
					Markup.button.callback("Cancel", "cancel"),
				]),
			);
			return ctx.wizard.next();
		}
		await ctx.replyWithHTML("<b>This operation has been cancelled</b>");
		return ctx.scene.leave();
	},
	stepHandler,
);
