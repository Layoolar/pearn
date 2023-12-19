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
interface Post {
	post_id: number;
	admin_id: number;
	full_text: string;
	entities: {
		hashtags: string[];
		keywords: string[];
	};
}

interface Link {
	link_id: string;
	post_id: number;
	user_id: number;
	url: string;
}
interface DatabaseSchema {
	users: TelegramUserInterface[];
	points: { user_id: number; points: number }[];
	posts: Post[];
	links: Link[];
}

const usersAdapter = new lowdbFileSync<DatabaseSchema>(configs.databases.users);
const dataAdapter = new lowdbFileSync<DatabaseSchema>(configs.databases.data);

const usersDB = lowdb(usersAdapter);
const dataDB = lowdb(dataAdapter);

usersDB.defaults({ users: [] }).write();
dataDB.defaults({ points: [], posts: [], links: [] }).write();

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

const writePost = async (post: Post): Promise<void> => {
	const postExists = dataDB.get("posts").find({ post_id: post.post_id }).value();

	if (postExists) {
		dataDB
			.get("posts")
			.find({ post_id: postExists.post_id })
			.assign({ ...post })
			.write();
	} else {
		dataDB.get("posts").push(post).write();
	}
};

const getPosts = (): Post[] => {
	const posts = dataDB.get("posts").value();
	return posts;
};

const getPost = (post_id: number): Post | null => {
	return dataDB.get("posts").find({ post_id }).value();
};

const writeLink = async (newLink: Link): Promise<void | -1> => {
	const postLink = dataDB.get("links").find({ link_id: newLink.link_id }).value();

	if (postLink) {
		return -1;
	} else {
		dataDB.get("links").push(newLink).write();
	}
};

const writePoint = async (userId: number, points: number): Promise<void> => {
	const userPoints = dataDB.get("points").find({ user_id: userId }).value();

	if (userPoints) {
		dataDB
			.get("points")
			.find({ user_id: userId })
			.assign({ points: userPoints.points + points })
			.write();
	} else {
		dataDB.get("points").push({ user_id: userId, points }).write();
	}
};

export { usersDB, dataDB, writeUser, writePoint, writePost, getPost, getPosts, Post, writeLink };
