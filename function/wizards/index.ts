import { Scenes, session } from "telegraf";
import bot, { SceneContext } from "@app/functions/telegraf";
import { postWizard } from "@app/functions/wizards/post_wizard";
import { submitWizard } from "@app/functions/wizards/submit_wizard";

const stage = new Scenes.Stage<SceneContext>([submitWizard, postWizard]);
bot.use(session());
bot.use(stage.middleware());

const set_post = async (): Promise<void> => {
	bot.command("set_post", async (ctx) => {
		await ctx.scene.enter("post-wizard");
	});
};

const submit_comment = async (): Promise<void> => {
	bot.command("submit_comment", async (ctx) => {
		await ctx.scene.enter("submit-wizard");
	});
};

export { set_post, submit_comment };
