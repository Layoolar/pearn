import { WizardContext } from "@app/functions/telegraf";
import { Composer, Markup, Scenes } from "telegraf";
import { userButtonsMarkup } from "../button";
import { writeUser } from "../databases";
import { isAddress } from "web3-validator";
import { initialData } from "./shared";

const stepHandler = new Composer<WizardContext>();
stepHandler.on("text", async (ctx) => {
	const { text } = ctx.message;
	if (isAddress(text, true)) {
		ctx.scene.session.store.wallet[ctx.from.id] = text;
		await ctx.reply(
			`Your Ethereum wallet address is: ${text}\n\nPlease confirm your wallet address.`,
			Markup.inlineKeyboard([
				Markup.button.callback("Save", "confirm"),
				Markup.button.callback("Try again", "enter_again"),
				Markup.button.callback("Cancel", "cancel"),
			]),
		);
	} else {
		await ctx.reply(`${text} is not a valid Ethereum wallet address`);
	}
});
stepHandler.action("confirm", async (ctx) => {
	if (ctx.from) {
		const eth_wallet_address = ctx.scene.session.store.wallet[ctx.from.id];
		writeUser({ id: ctx.from.id, eth_wallet_address });
		await ctx.replyWithHTML(`Your wallet address <i><b>${eth_wallet_address}</b></i> has been saved`);
	} else {
		await ctx.replyWithHTML("<b>Wallet address was not saved</b>");
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

export const walletWizard = new Scenes.WizardScene<WizardContext>(
	"wallet-wizard",
	async (ctx) => {
		if (!ctx.from) {
			return await ctx.scene.leave();
		}
		await ctx.replyWithHTML("<b>Submit your Ethereum wallet address: </b>");
		ctx.scene.session.store = initialData;
		return ctx.wizard.next();
	},
	stepHandler,
);
