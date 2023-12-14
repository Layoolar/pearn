/**
 * Database: lowdb
 * =====================
 *
 * @contributors: Patryk Rzucidło [@ptkdev] <support@ptkdev.io> (https://ptk.dev)
 *
 * @license: MIT License
 *
 */
import type { TelegramUserInterface } from "@app/types/databases.type";
import configs from "@configs/config";
import lowdb from "lowdb";
import lowdbFileSync from "lowdb/adapters/FileSync";

interface DatabaseSchema {
	users: TelegramUserInterface[];
	points: { user_id: number; points: number }[];
	posts: {
		id: string;
		adminId: number;
		text: string;
		links: string[];
	};
	links: { id: string; postId: string; userId: number; url: string }[];
}

const usersAdapter = new lowdbFileSync<DatabaseSchema>(configs.databases.users);
const pointsAdapter = new lowdbFileSync<DatabaseSchema>(configs.databases.points);
const postsAdapter = new lowdbFileSync<DatabaseSchema>(configs.databases.posts);
const linksAdapter = new lowdbFileSync<DatabaseSchema>(configs.databases.links);

const usersDB = lowdb(usersAdapter);
const pointsDB = lowdb(pointsAdapter);

usersDB.defaults({ users: [] }).write();
pointsDB.defaults({ points: [] }).write();

/**
 * writeUser()
 * =====================
 * Write user information from telegram context to user database
 *
 * @Context: ctx.update.message.from
 *
 * @interface [TelegramUserInterface](https://github.com/ptkdev-boilerplate/node-telegram-bot-boilerplate/blob/main/app/webcomponent/types/databases.type.ts)
 *
 * @param { TelegramUserInterface } json - telegram user object
 *
 */
const writeUser = async (json: TelegramUserInterface): Promise<void> => {
	const user_id = usersDB.get("users").find({ id: json.id }).value();

	if (user_id) {
		usersDB.get("users").find({ id: user_id.id }).assign(json).write();
	} else {
		usersDB.get("users").push(json).write();
	}
};

const writePoint = async (userId: number, points: number): Promise<void> => {
	const userPoints = pointsDB.get("points").find({ user_id: userId }).value();

	if (userPoints) {
		pointsDB
			.get("points")
			.find({ user_id: userId })
			.assign({ points: userPoints.points + points })
			.write();
	} else {
		pointsDB.get("points").push({ user_id: userId, points }).write();
	}
};

export { usersDB, pointsDB, writeUser, writePoint };
