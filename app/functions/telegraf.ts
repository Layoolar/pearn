/**
 * Telegraf
 * =====================
 *
 * @contributors: Patryk Rzucidło [@ptkdev] <support@ptkdev.io> (https://ptk.dev)
 *
 * @license: MIT License
 *
 */
import { Context, Telegraf } from "telegraf";
import configs from "@configs/config";

interface CustomContext extends Context {
	chat_id?: string;
}
const bot = new Telegraf(configs.telegram.token);

export { bot, CustomContext };
export default bot;
