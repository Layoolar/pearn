/**
 * Databases Interfaces
 * =====================
 *
 * Create your telegram bot with this friendly boilerplate. Use this repository as template for your bot
 *
 * @contributors: Patryk Rzucidło [@ptkdev] <support@ptkdev.io> (https://ptk.dev)
 *
 * @license: MIT License
 *
 */

/**
 * Telegram User Interface
 * =====================
 *
 * @Context: ctx.update.message.from
 *
 * @interface [TelegramUserInterface](https://github.com/ptkdev-boilerplate/node-telegram-bot-boilerplate/blob/main/app/webcomponent/types/databases.export type.ts)
 *
 * @param { number } id - telegram
 * @param { boolean } is_bot - is user a bot
 * @param { string } first_name - user name from telegram
 * @param { string } username - user username from telegram
 * @param { string } language_code - user code language from OS
 *
 */
export interface TelegramUserInterface {
	/**
	 * Telegram User Interface
	 * =====================
	 *
	 * @interface [TelegramUserInterface](https://github.com/ptkdev-boilerplate/node-telegram-bot-boilerplate/blob/main/app/webcomponent/types/databases.export type.ts)
	 *
	 * @param { number } id - telegram
	 *
	 */
	id: number;
	/**
	 * User Interface
	 * =====================
	 *
	 * @interface [TelegramUserInterface](https://github.com/ptkdev-boilerplate/node-telegram-bot-boilerplate/blob/main/app/webcomponent/types/databases.export type.ts)
	 *
	 * @param { boolean } is_bot - is user a bot
	 *
	 */
	is_bot?: boolean;
	/**
	 * User Interface
	 * =====================
	 *
	 * @interface [TelegramUserInterface](https://github.com/ptkdev-boilerplate/node-telegram-bot-boilerplate/blob/main/app/webcomponent/types/databases.export type.ts)
	 *
	 * @param { string } first_name - user name from telegram
	 *
	 */
	first_name?: string;
	/**
	 * User Interface
	 * =====================
	 *
	 * @interface [TelegramUserInterface](https://github.com/ptkdev-boilerplate/node-telegram-bot-boilerplate/blob/main/app/webcomponent/types/databases.export type.ts)
	 *
	 * @param { string } username - user username from telegram
	 *
	 */
	username?: string;
	/**
	 * User Interface
	 * =====================
	 *
	 * @interface [TelegramUserInterface](https://github.com/ptkdev-boilerplate/node-telegram-bot-boilerplate/blob/main/app/webcomponent/types/databases.export type.ts)
	 *
	 * @param { string } language_code - user code language from OS
	 *
	 */
	language_code?: string;

	/**
	 * User Interface
	 * =====================
	 *
	 * @interface [TelegramUserInterface](https://github.com/ptkdev-boilerplate/node-telegram-bot-boilerplate/blob/main/app/webcomponent/types/databases.export type.ts)
	 *
	 * @param { string } twitter_username - user code language from OS
	 *
	 */
	twitter_username?: string;
	eth_wallet_address?: string;
}

export type ConfigData = {
	chat_id: number;
	chat_title: string;
	creator_id: number;
	campaign_duration: number;
	token_lifetime: number;
};

export type TokenData = { date: string; token: string };

export type ChatData = {
	chat_id: string | number;
	chat_title?: string;
	isRaidOn?: boolean;
	latestRaidPostId?: string | null;
};

export type Admin = {
	chat_id: string | number;
	user_id: number;
	status?: "creator" | "administrator";
};

export type Post = {
	post_id: string;
	admin_id: number;
	post_link: string;
	full_text: string;
	entities: {
		hashtags: string[];
		keywords: string[];
		comment_sample: string;
	};
};

export type Point = {
	user_id: number;
	points: number;
};

export type CommentDBData = {
	comment_id: string;
	post_id: string;
	user_id: number;
	url: string;
};

export type DatabaseSchema = {
	users: TelegramUserInterface[];
	chat_data: ChatData[];
	admins: Admin[];
	points: Point[];
	posts: Post[];
	comments: CommentDBData[];
	token: TokenData | null;
	config: ConfigData;
};
