# Setting up the wizard

### Setting up in telegraf.ts

-   Extend WizardSession with the data type you want to store in context
    WizardContext

```javascript
import { Context, Scenes, Telegraf } from "telegraf";
import configs from "@configs/config";

// Extend Session with store containing type of data to store
interface MyWizardSession extends Scenes.WizardSessionData {
	store: {
		sol_transaction: {
			wallet_address: string,
			amount_to_send: string,
		},
	};
}

// Create custom context with new Session passed generically
interface WizardContext extends Context {
	scene: Scenes.SceneContextScene<WizardContext, MyWizardSession>;
	wizard: Scenes.WizardContextWizard<WizardContext>;
}

// Pass custom context generically to Telegraf
// This bot will then be passed around your app to either commands or
// actions
const bot = new Telegraf() < WizardContext > configs.telegram.token;

export { WizardContext };
export default bot;
```

## Note

**My bot instance flows in this order**

**telegraf.ts -> middlewares.ts -> wizard -> actions -> commands -> bot.ts**

### Setting up wizard

-   Import new WizardContext into wizard/index.ts
-   Set the stage for all wizards

```javascript
import { Scenes, session } from "telegraf";
import { WizardContext } from "@app/functions/telegraf";
import { bot } from "@app/functions/middlewares";
import { transactionWizard } from "@app/functions/wizards/transaction_wizard";

// Registering wizard in stage
const stage = new Scenes.Stage(<WizardContext>([transactionWizard]);

// Setting up bot to use session. It is deprecated but it still works lol
bot.use(session());

// Registering stage as middleware
bot.use(stage.middleware());

// Exporting bot instance again to be used in action or command
export { bot };
```

-   Handles interaction using wizard

```javascript
import { WizardContext } from "@app/functions/telegraf";
import { Composer, Markup, Scenes } from "telegraf";

const initialData = {
	sol_transaction: {
		wallet_address: "",
		amount_to_send: "",
	},
};

const stepHandler = new Composer<WizardContext>();
stepHandler.action("pre_send", async (ctx) => {
	if (ctx.from) {
		const { wallet_address, amount_to_send } = ctx.scene.session.store.sol_transaction;
		await ctx.replyWithHTML(
			`Are you sure you want to send <b>${amount_to_send} **token_name**</b> to wallet address <b>${wallet_address}</b>?`,
			Markup.inlineKeyboard([
				Markup.button.callback("Yes I am sure", "send"),
				Markup.button.callback("Cancel", "cancel"),
			]),
		);
	} else {
		await ctx.replyWithHTML("<b>Transaction failed</b>");
	}
	return await ctx.scene.leave();
});
stepHandler.action("send", async (ctx) => {
	if (ctx.from) {
		const { wallet_address, amount_to_send } = ctx.scene.session.store.sol_transaction;
		// Use send function here
		await ctx.replyWithHTML(
			`You have sent <b>${amount_to_send} **token_name**</b> to wallet address <b>${wallet_address}</b>`,
		);
	} else {
		await ctx.replyWithHTML("<b>Transaction failed</b>");
	}
	return await ctx.scene.leave();
});
stepHandler.action("cancel", async (ctx) => {
	await ctx.reply("You've cancelled the operation");
	return await ctx.scene.leave();
});

export const transactionWizard = new Scenes.WizardScene<WizardContext>(
	"transaction-wizard",
	async (ctx) => {
		if (!ctx.from) {
			return await ctx.scene.leave();
		}
		await ctx.replyWithHTML("<b>1. Please submit the wallet address: </b>");
		ctx.scene.session.store = initialData;
		return ctx.wizard.next();
	},
	async (ctx) => {
		if (!ctx.from) {
			return await ctx.scene.leave();
		}
		if (ctx.message && "text" in ctx.message) {
			const { text: address } = ctx.message;
			// Checks, validations and edge cases can be handled here for address
			if (address.length) {
				ctx.scene.session.store.sol_transaction.wallet_address = address;
				await ctx.replyWithHTML("<b>2. Please submit token amount: </b>");
				return ctx.wizard.next();
			} else {
				await ctx.replyWithHTML(
					"<i>1. You need to provide a wallet address.\nPlease submit wallet address: </i>",
				);
			}
		}
	},
	async (ctx) => {
		if (ctx.from) {
			if (ctx.message && "text" in ctx.message) {
				const { text: amount } = ctx.message;
				// Checks, validations and edge cases can be handled here for amount
				if (amount.length) {
					ctx.scene.session.store.sol_transaction.amount_to_send = amount;
					const { wallet_address, amount_to_send } = ctx.scene.session.store.sol_transaction;
					ctx.replyWithHTML(
						`<b>Confirm your Transaction</b>\n\n<i>Wallet Address: <b>${wallet_address}</b>\nAmount: <b>${amount_to_send}</b></i>`,
						Markup.inlineKeyboard([
							Markup.button.callback("Send", "pre_send"),
							Markup.button.callback("Cancel", "cancel"),
						]),
					);
					return ctx.wizard.next();
				} else {
					await ctx.replyWithHTML("<i>2. You need to provide an amount.\nPlease submit token amount: </i>");
				}
			}
		}
	},
	stepHandler,
);
```

-   Use wizard in an action

```javascript
import { bot } from "@app/functions/wizards";

bot.action("send_tokens", async (ctx) => {
	await ctx.scene.enter("transaction-wizard");
});
```

-   Use wizard in bot

```javascript
import { bot } from "@app/functions/wizards";

const sendTokens = async (): Promise<void> => {
	bot.command("send_tokens", async (ctx) => {
		await ctx.scene.enter("transaction-wizard");
	});
};

/**
 * ... rest of the code
 */
```
