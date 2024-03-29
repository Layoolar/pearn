import { Markup } from "telegraf";

// Admin buttons
export const setPostButton = Markup.button.callback("Set Post", "set_post");
export const startRaidButton = Markup.button.callback("Start Campaign", "start_raid");
export const postsButton = Markup.button.callback("Posts", "posts");
export const generateTokenButton = Markup.button.callback("Generate Token", "generate_token");
export const adminLeaderBoardButton = Markup.button.callback("All User Points", "all_user_points");
export const startRaidButtonMarkup = Markup.inlineKeyboard([startRaidButton]);
export const setPostButtonMarkup = Markup.inlineKeyboard([setPostButton]);
export const setDurationButtonMarkup = Markup.button.callback("Set Campaign Duration", "set_duration");
export const adminButtonsMarkup = Markup.inlineKeyboard([
	[setPostButton, postsButton],
	[generateTokenButton],
	[setDurationButtonMarkup],
	[adminLeaderBoardButton],
]);
// User buttons
export const helpButton = Markup.button.callback("Help", "help");
export const pointsButton = Markup.button.callback("Points", "points");
export const submitCommentButton = Markup.button.callback("Submit Comment", "submit_comment");
export const generateCommentButton = Markup.button.callback("Generate Comment", "generate_comment");
export const leaderboardButton = Markup.button.callback("Leaderboard", "leaderboard");
export const submitWalletButton = Markup.button.callback("Submit Wallet", "submit_wallet");
export const listRaidButton = Markup.button.callback("List Campaigns", "list_raids");
export const submitTwitter = Markup.button.callback("Change Twitter Username", "submit_twitter");
export const showMyTwitterUsername = Markup.button.callback("Show My Twitter Username", "show_my_twitter");
export const userButtonsMarkup = Markup.inlineKeyboard([
	[listRaidButton, helpButton],
	[postsButton, leaderboardButton],
	[submitTwitter, pointsButton],
	[submitWalletButton],
	[showMyTwitterUsername],
]);
export const joinRaidButtonMarkup = Markup.inlineKeyboard([submitCommentButton, generateCommentButton]);
export const submitTwitterButtonMarkup = Markup.inlineKeyboard([submitTwitter]);
