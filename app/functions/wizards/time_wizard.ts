import { WizardContext } from "@app/functions/telegraf";
import { Composer, Markup, Scenes } from "telegraf";
import { getConfig, setConfig } from "../databases";
import { initialData } from "./shared";

const stepHandler = new Composer<WizardContext>();
stepHandler.on("text", async (ctx) => {
	const { text } = ctx.message;
	const newTime = text.match(/\d+/);
	if (newTime && Number(newTime[0]) && Number(newTime[0]) > 0) {
		ctx.scene.session.store.time = Number(newTime[0]);
		await ctx.reply(
			`Your new campaign duration is: ${newTime[0]}mins\n\nPlease confirm this time.`,
			Markup.inlineKeyboard([
				Markup.button.callback("Save", "confirm"),
				Markup.button.callback("Try again", "enter_again"),
				Markup.button.callback("Cancel", "cancel"),
			]),
		);
	} else {
		ctx.reply(`Please submit a valid number greater than 0 i.e 10 or 10mins`);
	}
});
stepHandler.action("confirm", async (ctx) => {
	const newTime = Number(ctx.scene.session.store.time);
	const prevConfig = getConfig();
	setConfig({ ...prevConfig, campaign_duration: newTime * 60 * 1000 });
	await ctx.replyWithHTML(`New campaign duration of <i><b>${newTime} minutes</b></i> has been set`);
	return await ctx.scene.leave();
});
stepHandler.action("enter_again", async (ctx) => {
	return ctx.scene.reenter();
});
stepHandler.action("cancel", async (ctx) => {
	await ctx.reply("You've cancelled the operation");
	return await ctx.scene.leave();
});

export const timeWizard = new Scenes.WizardScene<WizardContext>(
	"time-wizard",
	async (ctx) => {
		if (!ctx.from) {
			return await ctx.scene.leave();
		}
		await ctx.replyWithHTML("<b>Set campaign duration in minutes i.e 15 or 20mins or 20 mins: </b>");
		ctx.scene.session.store = initialData;
		return ctx.wizard.next();
	},
	stepHandler,
);
