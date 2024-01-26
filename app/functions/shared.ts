import config from "@configs/config";
import { Context } from "telegraf";
import { writeAdmins } from "./databases";

/**
 * @param ctx
 */
const updateAdminFn = async (ctx: Context): Promise<void> => {
	const chat_id = config.group_info.chat_id;
	const admins = await ctx.telegram.getChatAdministrators(chat_id);
	const admins_data = admins.map((admin) => {
		return { chat_id, user_id: admin.user.id, status: admin.status };
	});
	writeAdmins(admins_data);
};

export { updateAdminFn };
