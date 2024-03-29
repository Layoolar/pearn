const commands = `
<b>Available commands</b>
- <b>/start</b> 🚀
  - <i>Description:</i> Start your journey with TAU DGX-1 and receive a warm welcome message.
- <b>/menu</b>
  - <i>Description:</i> Display all TAU DGX-1 menu buttons.
- <b>/leaderboard</b>
  - <i>Description:</i> Display the leaderboard.

<b>Button description</b>
  🔹 <b>Help:</b> Get assistance on how to use the bot.
  🔹 <b>Points:</b> Diplays your points.
  🔹 <b>Submit Comment:</b> Submits a comment for a specific action.
  🔹 <b>Generate Comment:</b> Generates a comment for a specific campaign.
  🔹 <b>Leaderboard:</b> Displays the leaderboard of users.
  🔹 <b>Change Twitter username:</b> Submits or updates your Twitter username.
  🔹 <b>List Campaigns:</b> Lists ongoing campaigns.
  🔹 <b>Submit Wallet:</b> Submits your Ethereum wallet address.
  🔹 <b>Show My Twitter Username:</b> Displays your Twitter username.
`;

const adminCommand = `
<b>Admin guide</b>
- <b>/admin</b>
  - <i>Description:</i> Display admin commands
- <b>/configure</b>
  - <i>Description:</i> Creator only command to setup bot in a group or supergroup
- <b>/add_admin [token]</b>
  - <i>Description:</i> New admins use this to get authenticated by the bot
- <b>/reset_points [token]</b>
  - <i>Description:</i> Resets all user points.

<b>Button description</b>
  🔹 <b>Set Post:</b> Sets a new post for the campaign.
  🔹 <b>Start Campaign:</b> Starts the campaign with the current set post.
  🔹 <b>Generate Token:</b> Generates tokens for new admins to get recognized by the bot.
  🔹 <b>Posts:</b> Displays the list of previous campaign posts.
  🔹 <b>Set Campaign Duration:</b> Sets the duration for campaigns.
`;

const helpMessage = `
${commands}
`;

const initialWelcomeMessage = `
<b>Welcome to TAU DGX-1 🤖</b>

Hello there! 👋 Welcome to <b>TAU DGX-1</b>, your friendly companion in the world of awesomeness. We're thrilled to have you on board! Before you proceed, you need to provide your Twitter username. To do this, use the button below
`;

const welcomeMessage = `
<b>Your Twitter username has been updated successfully ✅.</b>
<b>Explore the commands below to unleash the full potential of TAU DGX-1</b>

${commands}

Feel free to explore and enjoy your time with TAU DGX-1! If you have any questions, use the <b>Help</b> button or reach out to our support. Have a fantastic day! 🌟
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

const raidMessage = (twitter_link: string, duration: number): string => {
	return `🚀 <b>Campaign Announcement</b> 🚀

Attention all campaigners! 📢

A new campaign has been initiated by the admin. Your mission, should you choose to accept it, is to spread positivity and promote the tweet linked below with your uplifting comments! 💬

➡️ <a href="${twitter_link}">POST LINK</a>

To participate:
1. Click on the Twitter link above to view the tweet.
2. Head over to <a href="tg://resolve?domain=TauDGX1_bot&start=/menu">TAU DGX-1</a> in your private messages and use the list campaigns.
3. Click on the "Generate Comment" button to generate your uplifting comment.
4. Post your comment under the tweet within the next <b>${duration} minute${duration === 1 ? "" : "s"}</b>.
5. Return to <a href="tg://resolve?domain=TauDGX1_bot&start=/menu">TAU DGX-1</a> and submit the link to your comment.

Let's make a difference together! 🌟
`;
};

const raidEnd = (no_raiders: number): string => {
	return `🛑 <b>Campaign Ended</b> 🛑

	Attention all campaigners! 📢

	${no_raiders} people joined the campaign

	The campaign has ended. Thank you to everyone who participated and contributed their comments! 🌟

	Stay tuned for more campaigns 🎉💬
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
