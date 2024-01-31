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

type ChatData = {
	chat_id: string | number;
	chat_title?: string;
	isRaidOn?: boolean;
	latestRaidPostId?: string | null;
};

type Admin = {
	chat_id: string | number;
	user_id: number;
	status?: "creator" | "administrator" | "member" | "restricted" | "left" | "kicked";
};

type Post = {
	post_id: string;
	admin_id: number;
	post_link: string;
	full_text: string;
	entities: {
		hashtags: string[];
		keywords: string[];
	};
};

type Point = {
	user_id: number;
	points: number;
};

type CommentData = {
	link_id: string;
	post_id: string;
	user_id: number;
	url: string;
};

type DatabaseSchema = {
	users: TelegramUserInterface[];
	chat_data: ChatData[];
	admins: Admin[];
	points: Point[];
	posts: Post[];
	links: CommentData[];
};

const usersAdapter = new lowdbFileSync<DatabaseSchema>(configs.databases.users);
const dataAdapter = new lowdbFileSync<DatabaseSchema>(configs.databases.data);

const usersDB = lowdb(usersAdapter);
const dataDB = lowdb(dataAdapter);

usersDB.defaults({ users: [] }).write();
dataDB.defaults({ chat_data: [], admins: [], points: [], posts: [], links: [] }).write();

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

/**
 * @param { number } id - A user object
 *
 * @return { TelegramUserInterface | null } - A user object or null
 */
const getUser = (id: number): TelegramUserInterface | null => {
	return usersDB.get("users").find({ id }).value();
};

/**
 * writeChatData()
 * =====================
 * Writes chat data to database
 *
 * @param { ChatData } chat_data - The data object to be written to the database.
 *
 * @return { Promise<void> } - A Promise that resolves when the operation is complete.
 */
const writeChatData = async (chat_data: ChatData): Promise<void> => {
	const exists = dataDB.get("chat_data").find({ chat_id: chat_data.chat_id }).value();
	if (exists) {
		dataDB.get("chat_data").find({ chat_id: chat_data.chat_id }).assign(chat_data).write();
	} else {
		dataDB.get("chat_data").push(chat_data).write();
	}
};

/**
 * getChatData()
 * ======================
 * Gets chat data from database
 * @param { string | number} chat_id - The chat id
 *
 * @return { Promise<ChatData | null> } -
 */
const getChatData = (chat_id: string | number): ChatData | null => {
	return dataDB.get("chat_data").find({ chat_id }).value();
};

/**
 * writeAdmins()
 * =====================
 * Write admin information from telegram context to user database
 *
 * @param { Admin } admin_data - Telegram admin object
 *
 * @return {Promise<void>} - A Promise that resolves when the operation is complete.
 */
const writeAdmins = async (admin_data: Admin[]): Promise<void> => {
	// TODO - Put logic in-place for a removed admin
	admin_data.forEach((admin) => {
		const exists = dataDB.get("admins").find({ user_id: admin.user_id, chat_id: admin.chat_id }).value();
		if (exists) {
			dataDB.get("admins").find({ user_id: admin.user_id, chat_id: admin.chat_id }).assign(admin).write();
		} else {
			dataDB.get("admins").push(admin).write();
		}
	});
};

/**
 * getAdmin()
 * =====================
 * Get admin information from the database
 *
 * @param {number} user_id - admin id
 *
 * @return {Admin | null} - An admin object or null
 */
const getAdmin = (user_id: number): Admin | null => {
	return dataDB.get("admins").find({ user_id, chat_id: configs.group_info.chat_id }).value();
};

/**
 * writePoint()
 * =====================
 * Write points for a user to the database
 *
 * @param { number } userId - The ID of the user for whom points are being written.
 * @param { number } points - The number of points to be added.
 *
 * @return { Promise<void> } - A Promise that resolves when the operation is complete.
 */
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

/**
 * getPoints()
 * ==================
 * gets top 10 user points
 * @return {Point[]} - top 10 points
 */
const getTop10Points = (): Point[] => {
	return dataDB.get("points").sortBy("points").take(10).value();
};

/**
 * writePost()
 * =====================
 * Write a post to the database
 *
 * @param { Post } post - The post object to be written to the database.
 *
 * @return {Promise<void>} - A Promise that resolves when the operation is complete.
 */
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

/**
 * getPost()
 * =====================
 * Get a specific post from the database by post_id
 *
 * @param { number } post_id - The ID of the post to retrieve.
 *
 * @return { Post | null } - The post object if found, or null if not found.
 */
const getPost = (post_id: string): Post | null => {
	return dataDB.get("posts").find({ post_id }).value();
};

/**
 * getPosts()
 * =====================
 * Get all posts from the database
 *
 * @return { Post[] } - An array of post objects.
 */
const getPosts = (): Post[] => {
	return dataDB.get("posts").value();
};

/**
 * writeLink()
 * =====================
 * Write a link to the database
 *
 * @param { CommentData } commentData - The link object to be written to the database.
 *
 * @return { Promise<void | -1> } - A Promise that resolves when the operation is complete or -1 if the link already exists.
 */
const writeComment = async (commentData: CommentData): Promise<void | -1> => {
	const link = dataDB.get("links").find({ post_id: commentData.post_id, user_id: commentData.user_id }).value();

	if (link) {
		dataDB
			.get("links")
			.find({ post_id: commentData.post_id, user_id: commentData.user_id })
			.assign(commentData)
			.write();
	} else {
		dataDB.get("links").push(commentData).write();
	}
};

/**
 * getLink()
 * ======================
 * Gets a link from database
 * @param { CommentData } commentData - The link object to be found
 *
 * @return { Promise<CommentData | null> } -
 */
const getComment = (commentData: CommentData): CommentData | null => {
	return dataDB.get("links").find({ post_id: commentData.post_id, user_id: commentData.user_id }).value();
};

export {
	usersDB,
	dataDB,
	Admin,
	writeChatData,
	getChatData,
	writeUser,
	getUser,
	writeAdmins,
	getAdmin,
	writePoint,
	getTop10Points,
	Post,
	writePost,
	getPosts,
	getPost,
	writeComment,
	getComment,
};
