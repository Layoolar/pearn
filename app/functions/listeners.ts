import bot from "@app/functions/telegraf";
import { updateAdminMiddleware } from "./middlewares";

//
bot.on("new_chat_members", updateAdminMiddleware, () => {
	return;
});

bot.on("chat_member", updateAdminMiddleware, () => {
	return;
});
//
