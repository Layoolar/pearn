import { Scenes, session } from "telegraf";
import { WizardContext } from "@app/functions/telegraf";
import { bot } from "@app/functions/middlewares";
import { postWizard } from "@app/functions/wizards/post_wizard";
import { submitWizard } from "@app/functions/wizards/submit_wizard";
import { usernameWizard } from "@app/functions/wizards/twitter_wizard";
import { walletWizard } from "./wallet_wizard";
import { timeWizard } from "./time_wizard";

const stage = new Scenes.Stage<WizardContext>([postWizard, submitWizard, usernameWizard, walletWizard, timeWizard]);
bot.use(session());
bot.use(stage.middleware());

export { bot };
