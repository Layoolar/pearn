import { Composer, Markup, Scenes } from "telegraf";
import { SceneContext } from "@app/functions/telegraf";
import { Post, writePost } from "@app/functions/databases";

const PostData = {
	link: "",
	hashtags: [],
	keywords: [],
};

function collectWords(input: string) {
	const wordsArray = input.split(",").map((word) => word.trim());
	return wordsArray;
}

const stepHandler = new Composer<SceneContext>();
stepHandler.action("confirm", async (ctx) => {
	if (ctx.from) {
		const post: Post = {
			post_id: 0,
			admin_id: ctx.from.id,
			post_link: ctx.scene.session.store.post.link,
			full_text: "",
			post_points: 0,
			entities: {
				hashtags: ctx.scene.session.store.post.hashtags,
				keywords: ctx.scene.session.store.post.keywords,
			},
		};
		writePost(post);
		ctx.reply("New post set");
	} else {
		await ctx.reply("Link was not saved");
	}
	return await ctx.scene.leave();
});
stepHandler.action("cancel", async (ctx) => {
	await ctx.reply("You've cancelled the operation");
	return await ctx.scene.leave();
});

export const postWizard = new Scenes.WizardScene<SceneContext>(
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
