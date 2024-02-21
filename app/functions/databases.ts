/**
 * Database: lowdb
 * =====================
 *
 * @contributors: Patryk Rzucidło [@ptkdev] <support@ptkdev.io> (https://ptk.dev)
 *
 * @license: MIT License
 *
 */
import type {
	Admin,
	ChatData,
	CommentDBData,
	ConfigData,
	DatabaseSchema,
	Point,
	Post,
	TelegramUserInterface,
	TokenData,
} from "@app/types/databases.type";
import configs from "@configs/config";
import lowdb from "lowdb";
import lowdbFileSync from "lowdb/adapters/FileSync";

const usersAdapter = new lowdbFileSync<DatabaseSchema>(configs.databases.users);
const dataAdapter = new lowdbFileSync<DatabaseSchema>(configs.databases.data);
const configAdapter = new lowdbFileSync<DatabaseSchema>(configs.databases.config);

const usersDB = lowdb(usersAdapter);
const dataDB = lowdb(dataAdapter);
const configDB = lowdb(configAdapter);

usersDB.defaults({ users: [] }).write();
dataDB.defaults({ chat_data: [], admins: [], points: [], posts: [], comments: [], token: null }).write();
configDB
	.defaults({
		config: {
			chat_id: 0,
			chat_title: "",
			creator_id: 0,
			campaign_duration: 15 * 60 * 1000,
			token_lifetime: 60 * 1000,
		},
	})
	.write();

const clearDB = (): void => {
	usersDB.get("users").remove().write();
	dataDB.get("chat_data").remove().write();
	dataDB.get("admins").remove().write();
	dataDB.get("points").remove().write();
	dataDB.get("posts").remove().write();
	dataDB.get("comments").remove().write();
	configDB
		.assign({
			config: {
				chat_id: 0,
				chat_tite: "",
				creator_id: 0,
				campaign_duration: 900000,
				token_lifetime: 60000,
			},
		})
		.write();
};

/**
 * setConfig()
 * =====================
 * stores app config to db
 *
 * @param {ConfigData} config_data - token object
 */
const setConfig = (config_data: ConfigData): void => {
	configDB.assign({ config: config_data }).write();
};

/**
 * getConfig()
 * =====================
 * Get the config from the database
 *
 * @return {ConfigData} - The config object if found, or null if not found.
 */
const getConfig = (): ConfigData => {
	return configDB.get("config").value();
};

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
 * writeAdmin()
 * =====================
 * Write admin information from telegram context to user database
 *
 * @param { Admin } admin_data - Telegram admin object
 *
 * @return {Promise<void>} - A Promise that resolves when the operation is complete.
 */
const writeAdmin = async (admin_data: Admin): Promise<void> => {
	const exists = dataDB.get("admins").find({ user_id: admin_data.user_id }).value();
	if (exists) {
		dataDB.get("admins").find({ user_id: admin_data.user_id }).assign(admin_data).write();
	} else {
		dataDB.get("admins").push(admin_data).write();
	}
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
	const config = getConfig();
	return dataDB.get("admins").find({ user_id, chat_id: config.chat_id }).value();
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
	return dataDB.get("points").sortBy("points").take(10).reverse().value();
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
const writeComment = async (commentData: CommentDBData): Promise<void | -1> => {
	const link = dataDB.get("comments").find({ post_id: commentData.post_id, user_id: commentData.user_id }).value();

	if (!link) {
		dataDB.get("comments").push(commentData).write();
		return;
	}
	return -1;
};

/**
 * getComment()
 * ======================
 * Gets a link from database
 * @param { CommentData } commentData - The link object to be found
 *
 * @return { Promise<CommentData | null> } -
 */
const getComment = (commentData: CommentDBData): CommentDBData | null => {
	return dataDB.get("comments").find({ post_id: commentData.post_id, user_id: commentData.user_id }).value();
};

/**
 * getComments()
 * ======================
 * Gets a link from database
 * @param { string } post_id - The replied post
 * @return { Promise<CommentData[]> } - Array of comments
 */
const getComments = (post_id: string): CommentDBData[] => {
	return dataDB.get("comments").filter({ post_id }).value();
};

/**
 * getCommentSize()
 * =============================
 * Gets the size of people who joined raid
 * @param {string} post_id - The current raid post
 * @return {number} - The number of raid comments submitted
 */
const getCommentSize = (post_id: string): number => {
	return dataDB.get("comments").filter({ post_id }).size().value();
};

/**
 * deleteComments()
 * ======================
 * Removes commenst from DB
 * @param { string } post_id - The replied post
 */
const deleteComments = (post_id: string): void => {
	dataDB.get("comments").remove({ post_id }).write();
};

/**
 * storeToken()
 * =====================
 * stores a token to the database
 *
 * @param {TokenData | null} token_data - token object
 */
const storeToken = (token_data: TokenData | null): void => {
	dataDB.set("token", token_data).write();
};

/**
 * getToken()
 * =====================
 * Get the token from the database
 *
 * @return { TokenData | null } - The token object if found, or null if not found.
 */
const getToken = (): TokenData | null => {
	return dataDB.get("token").value();
};

export {
	clearDB,
	setConfig,
	getConfig,
	usersDB,
	dataDB,
	Admin,
	writeChatData,
	getChatData,
	writeUser,
	getUser,
	writeAdmin,
	getAdmin,
	writePoint,
	getTop10Points,
	Post,
	writePost,
	getPosts,
	getPost,
	writeComment,
	getComment,
	getComments,
	getCommentSize,
	deleteComments,
	storeToken,
	getToken,
};
