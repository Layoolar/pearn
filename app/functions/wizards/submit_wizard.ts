import { Composer, Markup, Scenes } from "telegraf";
import { WizardContext } from "@app/functions/telegraf";
import { extractId, extractUsername } from "@app/functions/utils";
import { getChatData, getConfig, getUser, writeComment } from "@app/functions/databases";
import { initialData } from "./shared";

const stepHandler = new Composer<WizardContext>();
stepHandler.action("confirm", async (ctx) => {
	if (ctx.from) {
		const commentLink = ctx.scene.session.store.comment[ctx.from.id];
		const commentId = extractId(commentLink);
		const username = extractUsername(commentLink);
		if (!commentId || !username) {
			await ctx.replyWithHTML("<b>Invalid comment link. Please enter a valid twitter comment link.</b>");
			return await ctx.scene.leave();
		}
		const storedTwitterUsername = getUser(ctx.from.id)?.twitter_username;
		if (storedTwitterUsername && storedTwitterUsername.length) {
			if (`@${username}` === storedTwitterUsername) {
				const config = getConfig();
				const chatData = getChatData(config.chat_id);
				if (chatData?.latestRaidPostId) {
					if (!chatData.isRaidOn) {
						await ctx.replyWithHTML("<b>Too slow, the campaign has ended, look out for the next one</b>");
					} else {
						const commentData = {
							comment_id: commentId,
							post_id: chatData.latestRaidPostId,
							user_id: ctx.from.id,
							url: commentLink,
						};
						const saved = writeComment(commentData);
						if (saved) {
							await ctx.replyWithHTML(`<b>Your comment link has been submitted: ${commentLink}</b>`);
						} else {
							await ctx.replyWithHTML(`<b>You are only allowed to submit one link per post</b>`);
						}
					}
				} else {
					await ctx.replyWithHTML("<b>An error occured, please inform an Admin about this error</b>");
					return await ctx.scene.leave();
				}
			} else {
				await ctx.replyWithHTML(
					`<b>There is a mismatch between your saved twitter username @${storedTwitterUsername} and your posted comment username @${username}</b>`,
				);
			}
		} else {
			return await ctx.scene.leave();
		}
	} else {
		await ctx.replyWithHTML("<b>Link was not saved</b>");
		return await ctx.scene.leave();
	}
});
stepHandler.action("enter_again", async (ctx) => {
	return ctx.scene.reenter();
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
		ctx.scene.session.store = initialData;
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
					Markup.button.callback("No, enter again", "enter_again"),
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
