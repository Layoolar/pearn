import { Scenes, session } from "telegraf";
import { WizardContext } from "@app/functions/telegraf";
import { bot } from "@app/functions/middlewares";
import { postWizard } from "@app/functions/wizards/post_wizard";
import { submitWizard } from "@app/functions/wizards/submit_wizard";

const stage = new Scenes.Stage<WizardContext>([postWizard, submitWizard]);
bot.use(session());
bot.use(stage.middleware());

export { bot };
