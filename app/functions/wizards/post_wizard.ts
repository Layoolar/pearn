import { Composer, Markup, Scenes } from "telegraf";
import { WizardContext } from "@app/functions/telegraf";
import { Post, writeChatData, writePost } from "@app/functions/databases";
import { collectWords, extractId, startsWithTag } from "@app/functions/utils";
import config from "@configs/config";
import { setPostButtonMarkup, startRaidButtonMarkup } from "@app/functions/button";

const initialData = {
	post: {
		link: "",
		hashtags: [],
		keywords: [],
		sample_comment: "",
	},
	comment: {},
	twitter: {},
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
					comment_sample: ctx.scene.session.store.post.sample_comment,
				},
			};
			writePost(post);
			writeChatData({ chat_id: config.group_info.chat_id, latestRaidPostId: post_id });
			ctx.replyWithHTML(
				`New post set, use the button below to start the raid\n${ctx.scene.session.store.post.link}`,
				startRaidButtonMarkup,
			);
		} else {
			await ctx.replyWithHTML(
				"<i>Post link is invalid, try again using the button below</i>",
				setPostButtonMarkup,
			);
		}
	} else {
		await ctx.replyWithHTML("<i>Link was not saved</i>", setPostButtonMarkup);
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
		await ctx.replyWithHTML("<b>Step 1</b>\nPlease submit the post link");
		ctx.scene.session.store = initialData;
		return ctx.wizard.next();
	},
	async (ctx) => {
		if (!ctx.from) {
			return await ctx.scene.leave();
		}
		await ctx.replyWithHTML("<b>Step 2</b>\nPlease submit the hashtags. Make sure they start with a '#' and are comma separated");
		if (ctx.message && "text" in ctx.message) {
			ctx.scene.session.store.post.link = ctx.message?.text || "";
		}
		return ctx.wizard.next();
	},
	async (ctx) => {
		if (!ctx.from) {
			return await ctx.scene.leave();
		}
		if (ctx.message && "text" in ctx.message) {
			const tags = collectWords(ctx.message.text);
			if (startsWithTag(tags)) {
				ctx.scene.session.store.post.hashtags = collectWords(ctx.message.text);
				await ctx.replyWithHTML("<b>Step 3</b>\nPlease submit the keywords. Make sure they are comma separated");
				return ctx.wizard.next();
			} else {
				await ctx.replyWithHTML(
					"<b>Step 2</b>\nPlease submit the hashtags. Make sure they start with a '#' and are comma separated",
				);
			}
		}
	},
	async (ctx) => {
		if (!ctx.from) {
			return await ctx.scene.leave();
		}
		await ctx.replyWithHTML("<b>Step 4</b>\nPlease submit the comment sample");
		if (ctx.message && "text" in ctx.message) {
			ctx.scene.session.store.post.keywords = collectWords(ctx.message.text);
		}
		return ctx.wizard.next();
	},
	async (ctx) => {
		if (ctx.from) {
			if (ctx.message && "text" in ctx.message) {
				ctx.scene.session.store.post.sample_comment = ctx.message.text;
			}
			ctx.replyWithHTML(
				`<b>Confirm your Post</b>\n\n<i><b>Post link</b>: ${ctx.scene.session.store.post.link}\n<b>Hashtags</b>: ${ctx.scene.session.store.post.hashtags}\n<b>Keywords</b>: ${ctx.scene.session.store.post.keywords}\n<b>Sample comment</b>: ${ctx.scene.session.store.post.sample_comment}</i>`,
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
