import { getPoints, getUser } from "./databases";

const getLeaderBoard = (start?: number, end?: number): string => {
	const points = getPoints();
	const slicedPoints = points.sort((a, b) => b.points - a.points).slice(start, end);
	const topUsers = slicedPoints.map((point) => {
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

async function* getLeaderBoardInChunks(number_of_items = 10, size = 10): AsyncGenerator<string> {
	const points = getPoints();
	const slicedPoints = points.sort((a, b) => b.points - a.points).slice(0, number_of_items);
	const loopTimes = Math.ceil(slicedPoints.length / size);
	for (let i = 0, j = 0; i < loopTimes; i++, j += size) {
		const chunk = slicedPoints.slice(j, j + size);
		const cpy = chunk.map((point) => {
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

		let leaderBoardText = "";
		if (i === 0) {
			leaderBoardText = "<b>User Points</b>\n\n";
		}
		cpy.forEach((user, index) => {
			leaderBoardText += `<b>${i * size + index + 1}.</b> <i>${user.username}</i> - <b>${
				user.points
			}</b> points\n`;
		});
		yield leaderBoardText;
	}
}

export { getLeaderBoard, getLeaderBoardInChunks };
