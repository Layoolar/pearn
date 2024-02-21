import * as fs from "fs";

declare const __dirname: string;

const writeLog = (
	filename: number | fs.PathLike,
	data: string | Uint8Array,
	options?: fs.WriteFileOptions | undefined,
): void => {
	if (!fs.existsSync(`${__dirname}/../../errors`)) {
		fs.mkdirSync(`${__dirname}/../../errors`);
	}
	const full_path = `${__dirname}/../../errors/${filename}`;
	fs.appendFileSync(full_path, data, options);
};

export default writeLog;
