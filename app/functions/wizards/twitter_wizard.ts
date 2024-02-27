import { WizardContext } from "@app/functions/telegraf";
import { isValidTwitterUsername } from "@app/functions/utils";
import { Composer, Markup, Scenes } from "telegraf";
import { userButtonsMarkup } from "../button";
import { writeUser } from "../databases";
import { initialData } from "./shared";

const stepHandler = new Composer<WizardContext>();
stepHandler.on("text", async (ctx) => {
	const { text } = ctx.message;
	if (isValidTwitterUsername(text)) {
		ctx.scene.session.store.twitter[ctx.from.id] = text;
		await ctx.reply(
			`Your Twitter username is: <a href="https://x.com/${text.substring(
				1,
			)}">${text}</a>\n\nPlease confirm if it's correct. It is important to ensure you don't lose points`,
			Markup.inlineKeyboard([
				Markup.button.callback("Yes", "confirm"),
				Markup.button.callback("No, enter again", "enter_again"),
				Markup.button.callback("Cancel", "cancel"),
			]),
		);
	} else {
		await ctx.reply("Please enter a valid Twitter username.");
	}
});
stepHandler.action("confirm", async (ctx) => {
	if (ctx.from) {
		const twitterUsername = ctx.scene.session.store.twitter[ctx.from.id];
		writeUser({ id: ctx.from.id, twitter_username: twitterUsername });
		await ctx.replyWithHTML(`<b>Your twitter username ${twitterUsername} has been saved</b>`, userButtonsMarkup);
	} else {
		await ctx.replyWithHTML("<b>Link was not saved</b>");
	}
	return await ctx.scene.leave();
});
stepHandler.action("enter_again", async (ctx) => {
	return ctx.scene.reenter();
});
stepHandler.action("cancel", async (ctx) => {
	await ctx.reply("You've cancelled the operation");
	return await ctx.scene.leave();
});

export const usernameWizard = new Scenes.WizardScene<WizardContext>(
	"username-wizard",
	async (ctx) => {
		if (!ctx.from) {
			return await ctx.scene.leave();
		}
		await ctx.replyWithHTML("<b>Please enter your Twitter username.</b>");
		ctx.scene.session.store = initialData;
		return ctx.wizard.next();
	},
	stepHandler,
);
