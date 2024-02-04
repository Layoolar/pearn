const commands = `
<b>Available commands</b>
- <b>/start</b> 🚀
  - <i>Description:</i> Start your journey with Eddy and receive a warm welcome message.
- <b>/menu</b>
  - <i>Description:</i> Display all Eddy menu buttons.

<b>Button description</b>
  🔹 <b>Help:</b> Get assistance on how to use the bot.
  🔹 <b>Points:</b> View your points or scores.
  🔹 <b>Submit comment:</b> Submit a comment for a specific action.
  🔹 <b>Generate comment:</b> Generate a comment for a specific action.
  🔹 <b>Leaderboard:</b> View the leaderboard of users.
  🔹 <b>Change twitter username:</b> Submit or update your Twitter username.
  🔹 <b>List raids:</b> List ongoing raids.
`;

const adminCommand = `
<b>Admin guide</b>
- <b>/admin</b>
  - <i>Description:</i> Display admin commands

<b>Button description</b>
  🔹 <b>Set post:</b> Use this button to set a new post for the raid.
  🔹 <b>Start raid:</b> Click here to start the raid with the current set post.
  🔹 <b>Update admin:</b> Inform the bot that a new administator has been added..
  🔹 <b>Posts:</b> View the list of previous raid posts.
`;

const helpMessage = `
${commands}
`;

const initialWelcomeMessage = `
<b>Welcome to Eddy 🤖</b>

Hello there! 👋 Welcome to <b>Eddy</b>, your friendly companion in the world of awesomeness. We're thrilled to have you on board! Before you proceed, you need to provide you twitter username. To do this, use the button below
`;

const welcomeMessage = `
<b>Your Twitter username has been updated successfully ✅.</b>
<b>Explore the commands below to unleash the full potential of Eddy</b>

${commands}

Feel free to explore and enjoy your time with Eddy! If you have any questions, use the <b>Help</b> button or reach out to our support. Have a fantastic day! 🌟
`;

const breakdownMessage = ({
	total_hashtags,
	total_keywords,
	hashtags_found,
	keywords_found,
	points,
	total_points,
}: {
	total_hashtags: number;
	total_keywords: number;
	hashtags_found: number;
	keywords_found: number;
	points: number;
	total_points: number;
}): string => {
	return `<b>Your tweet has been submitted and checked!</b>

					🌟 <i>You've been assigned ${points} out of ${total_points} points for your post.</i>

					<b>Here is a breakdown of your tweet</b>
					<i>${hashtags_found} of ${total_hashtags} given hashtag${total_hashtags === 1 ? "" : "s"} were found in your tweet</i>
					<i>${keywords_found} of ${total_keywords} given keyword${total_keywords === 1 ? "" : "s"} were found in your tweet</i>

					To check your total points, click the <b>My points</b> button`;
};

const raidMessage = (twitter_link: string): string => {
	return `🚀 <b>Raid Announcement</b> 🚀

Attention all raiders! 📢

A new raid has been initiated by the admin. Your mission, should you choose to accept it, is to spread positivity and promote the tweet linked below with your uplifting comments! 💬

➡️ <a href="${twitter_link}">Twitter Link</a>

To participate:
1. Click on the Twitter link above to view the tweet.
2. Head over to <a href="tg://resolve?domain=edd_the_tweet_bot&start=/menu">Eddy Bot</a> in your private messages and use the list raids.
3. Click on the "Generate Comment" button to generate your uplifting comment.
4. Post your comment under the tweet within the next 15 minutes.
5. Return to this group and submit the link to your comment.

Let's make a difference together! 🌟
`;
};

const raidEnd = (no_raiders: number): string => {
	return `🛑 <b>Raid Ended</b> 🛑

	Attention all raiders! 📢

	${no_raiders} people joined the raid

	The raid has ended. Thank you to everyone who participated and contributed their comments! 🌟

	Stay tuned for more raids 🎉💬
	`;
};

export {
	commands,
	helpMessage,
	initialWelcomeMessage,
	welcomeMessage,
	breakdownMessage,
	adminCommand,
	raidMessage,
	raidEnd,
};
