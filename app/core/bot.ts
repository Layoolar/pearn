import * as command from "@app/functions/commands";
import * as hears from "@app/functions/hears";

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
	await command.quit();
	await command.start();
	await command.submit();
	await command.format();
	await command.points();
	await command.help();
	await command.test();
	await command.setPost();
	await command.listPosts();
	await hears.text();
	await command.launch();
})();
