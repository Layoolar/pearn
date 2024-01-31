import config from "@configs/config";
import { Context } from "telegraf";
import { writeAdmins } from "./databases";
import { ChatMember } from "telegraf/typings/core/types/typegram";

/**
 * @param {Context} ctx - context parameter
 *
 * @return {Promise<Chatmember[]>} - an array of chatmembers
 */
const updateAdminFn = async (ctx: Context): Promise<ChatMember[]> => {
	const chat_id = config.group_info.chat_id;
	const admins = await ctx.telegram.getChatAdministrators(chat_id);
	const admins_data = admins.map((admin) => {
		return { chat_id, user_id: admin.user.id, status: admin.status };
	});
	writeAdmins(admins_data);
	return admins;
};

/**
 * @param ctx
 */
const submitFn = async (ctx: Context): Promise<void> => {
	// TODO extract tweetId and commentId from
	// TODO check if tweetId matches mother post id
	// TODO save comment link
};

export { updateAdminFn };
