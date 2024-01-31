import { Composer, Markup, Scenes } from "telegraf";
import { WizardContext } from "@app/functions/telegraf";
import { Post, writeChatData, writePost } from "@app/functions/databases";
import { collectWords, extractId } from "@app/functions/utils";
import config from "@configs/config";
import { startRaidButtonMarkup } from "@app/functions/button";

const PostData = {
	link: "",
	hashtags: [],
	keywords: [],
};

const stepHandler = new Composer<WizardContext>();
stepHandler.action("confirm", async (ctx) => {
	if (ctx.from) {
		const post_id = extractId(ctx.scene.session.store.post.link);
		if (post_id) {
			const post: Post = {
				post_id: post_id,
				admin_id: ctx.from.id,
				post_link: ctx.scene.session.store.post.link,
				full_text: "",
				entities: {
					hashtags: ctx.scene.session.store.post.hashtags,
					keywords: ctx.scene.session.store.post.keywords,
				},
			};
			writePost(post);
			writeChatData({ chat_id: config.group_info.chat_id, latestRaidPostId: post_id });
			ctx.replyWithHTML("New post set, use the button below to start the raid", startRaidButtonMarkup);
		} else {
			await ctx.reply("Post link is invalid");
			// TODO return set post button here
		}
	} else {
		await ctx.reply("Link was not saved");
		// TODO return set post button here
		// TODO create a button markup to make it dynamic
	}
	return await ctx.scene.leave();
});
stepHandler.action("cancel", async (ctx) => {
	await ctx.reply("You've cancelled the operation");
	return await ctx.scene.leave();
});

export const postWizard = new Scenes.WizardScene<WizardContext>(
	"post-wizard",
	async (ctx) => {
		if (!ctx.from) {
			return await ctx.scene.leave();
		}
		await ctx.reply("Step 1\nPlease submit the post link");
		ctx.scene.session.store = { post: PostData, comment: {} };
		return ctx.wizard.next();
	},
	async (ctx) => {
		if (!ctx.from) {
			return await ctx.scene.leave();
		}
		await ctx.reply("Step 2\nPlease submit the hashtags. Make sure they start with a '#' and are comma separated");
		if (ctx.message && "text" in ctx.message) {
			ctx.scene.session.store.post.link = ctx.message?.text || "";
		}
		return ctx.wizard.next();
	},
	async (ctx) => {
		if (!ctx.from) {
			return await ctx.scene.leave();
		}
		await ctx.reply("Step 3\nPlease submit the keywords. Make sure they are comma separated");
		if (ctx.message && "text" in ctx.message) {
			ctx.scene.session.store.post.hashtags = collectWords(ctx.message.text);
		}
		return ctx.wizard.next();
	},
	async (ctx) => {
		if (ctx.from) {
			if (ctx.message && "text" in ctx.message) {
				ctx.scene.session.store.post.keywords = collectWords(ctx.message.text);
			}
			ctx.replyWithMarkdown(
				`Almost done`,
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
