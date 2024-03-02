import { getPoints, getUser } from "./databases";

export const getLeaderBoard = (): string => {
	const points = getPoints();
	const top10 = points.sort((a, b) => b.points - a.points);
	const topUsers = top10.map((point) => {
		const user = getUser(point.user_id);
		let twitterLink = null;
		if (user?.twitter_username) {
			twitterLink = `<a href="https://x.com/${user.twitter_username.substring(1)}">${user.twitter_username}</a>`;
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
	return leaderBoardText;
};
