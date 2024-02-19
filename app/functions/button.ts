import { Markup } from "telegraf";

// Admin buttons
export const setPostButton = Markup.button.callback("Set post", "set_post");
export const startRaidButton = Markup.button.callback("Start campaign", "start_raid");
export const updateAdminButton = Markup.button.callback("Update admin", "update_admin");
export const postsButton = Markup.button.callback("Posts", "posts");
export const adminButtonsMarkup = Markup.inlineKeyboard([[setPostButton, postsButton], [updateAdminButton]]);
export const startRaidButtonMarkup = Markup.inlineKeyboard([startRaidButton]);
export const setPostButtonMarkup = Markup.inlineKeyboard([setPostButton]);
// User buttons
export const helpButton = Markup.button.callback("Help", "help");
export const pointsButton = Markup.button.callback("Points", "points");
export const submitCommentButton = Markup.button.callback("Submit comment", "submit_comment");
export const generateCommentButton = Markup.button.callback("Generate comment", "generate_comment");
export const leaderboardButton = Markup.button.callback("Leaderboard", "leaderboard");
export const submitWalletButton = Markup.button.callback("Submit wallet", "submit_wallet");
export const listRaidButton = Markup.button.callback("List campaigns", "list_raids");
export const submitTwitter = Markup.button.callback("Change twitter username", "submit_twitter");
export const userButtonsMarkup = Markup.inlineKeyboard([
	[listRaidButton, helpButton],
	[postsButton, leaderboardButton],
	[submitTwitter, pointsButton],
]);
export const joinRaidButtonMarkup = Markup.inlineKeyboard([submitCommentButton, generateCommentButton]);
export const submitTwitterButtonMarkup = Markup.inlineKeyboard([submitTwitter]);
