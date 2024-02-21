import * as command from "@app/functions/commands";

// path of bot instance
// telegraf -> middlewares -> wizard -> actions -> commands -> bot.ts

/**
 * Start bot
 * =====================
 *
 * @contributors: Patryk Rzucidło [@ptkdev] <support@ptkdev.io> (https://ptk.dev)
 *
 * @license: MIT License
 *
 */
(async () => {
	await command.start();
	await command.configure();
	await command.eraseDB();
	await command.adminMenu();
	await command.addAdmin();
	await command.menu();
	await command.quit();
	await command.launch();
	await command.error();
})();
