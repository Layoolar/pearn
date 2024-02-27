import { getTop10Points, getUser } from "./databases";
import { WizardContext } from "./telegraf";

export const getLeaderBoard = (ctx: WizardContext): void => {
	if (ctx.chat) {
		const points = getTop10Points();
		const topUsers = points.map((point) => {
			const user = getUser(point.user_id);
			let twitterLink = null;
			if (user?.twitter_username) {
				twitterLink = `<a href="https://x.com/${user.twitter_username.substring(1)}">${
					user.twitter_username
				}</a>`;
			}
			return {
				username: twitterLink || user?.first_name || user?.username || "Anonymous user",
				points: point.points,
			};
		});

		let leaderBoardText = "<b>Leaderboard:</b>\n\n";
		topUsers.forEach((user, index) => {
			leaderBoardText += `<b>${index + 1}.</b> <i>${user.username}</i> - <b>${user.points}</b> points\n`;
		});

		ctx.telegram.sendMessage(ctx.chat.id, leaderBoardText, {
			parse_mode: "HTML",
		});
	}
};
