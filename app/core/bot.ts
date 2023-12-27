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
	await command.start();
	await command.menu();
	await command.test();
	await command.format();
	await command.adminGuide();
	await command.quit();
	await command.addTwitter();
	await command.setPost();
	await command.submit();
	await command.updateAdmins();
	await hears.text();
	await command.launch();
})();
