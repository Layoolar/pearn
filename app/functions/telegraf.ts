/**
 * Telegraf
 * =====================
 *
 * @contributors: Patryk Rzucidło [@ptkdev] <support@ptkdev.io> (https://ptk.dev)
 *
 * @license: MIT License
 *
 */
import { Context, Scenes, Telegraf } from "telegraf";
import configs from "@configs/config";

interface MyWizardSession extends Scenes.WizardSessionData {
	store: {
		post: {
			link: string;
			hashtags: string[];
			keywords: string[];
			sample_comment: string;
		};
		comment: {
			[k: number]: string;
		};
		twitter: {
			[k: number]: string;
		};
	};
}

interface WizardContext extends Context {
	scene: Scenes.SceneContextScene<WizardContext, MyWizardSession>;
	wizard: Scenes.WizardContextWizard<WizardContext>;
}

const bot = new Telegraf<WizardContext>(configs.telegram.token);

export { WizardContext };
export default bot;
