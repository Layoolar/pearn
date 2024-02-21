import { exec } from "child_process";

const makeTerminalRequest = (command: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				return reject(error);
			}
			if (stderr) {
				return reject(new Error(stderr));
			}
			resolve(stdout.trim());
		});
	});
};

export default makeTerminalRequest;
