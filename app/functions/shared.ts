import config from "@configs/config";
import { Context } from "telegraf";
import { writeAdmins } from "@app/functions/databases";
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

export { updateAdminFn };
