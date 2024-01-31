import { Markup } from "telegraf";

// Admin buttons
export const setPostButton = Markup.button.callback("Set post", "set_post");
export const startRaidButton = Markup.button.callback("Start raid", "start_raid");
export const updateAdminButton = Markup.button.callback("Update admin", "update_admin");
export const adminButtonsMarkup = Markup.inlineKeyboard([[setPostButton, updateAdminButton]]);
export const startRaidButtonMarkup = Markup.inlineKeyboard([startRaidButton]);
// User buttons
export const helpButton = Markup.button.callback("Help", "help");
export const pointsButton = Markup.button.callback("Points", "points");
export const submitCommentButton = Markup.button.callback("Submit comment", "submit_comment");
export const leaderboardButton = Markup.button.callback("Leaderboard", "leaderboard");
export const postsButton = Markup.button.callback("Posts", "posts");
export const submitWalletButton = Markup.button.callback("Submit wallet", "submit_wallet");
export const listRaidButton = Markup.button.callback("List raids", "list_raids");
export const addTwitter = Markup.button.callback("Add twitter username", "add_twitter");
export const userButtonsMarkup = Markup.inlineKeyboard([
	[listRaidButton, helpButton],
	[submitWalletButton],
	[postsButton, leaderboardButton],
]);
export const joinRaidButtonMarkup = Markup.inlineKeyboard([submitCommentButton]);
