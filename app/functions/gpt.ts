import OpenAI from "openai";
import config from "@configs/config";

const generateComment = async (
	sampleComment: string,
	keywords: string[],
	hashtags: string[],
): Promise<string | null> => {
	const prompt = `Ignore previous instructions
		Generate a Twitter comment using a similar context from the sample comment provided below\n${sampleComment}\nThe generated comment must contain the following words\n${keywords}\nIt must also contain the following hashtags\n${hashtags}\nNo negative comments`;
	try {
		const openAI = new OpenAI({ apiKey: config.openAI.apiKey });
		const response = await openAI.chat.completions.create({
			messages: [
				{
					role: "user",
					content: prompt,
				},
			],
			model: "gpt-3.5-turbo",
		});
		const generatedText = response.choices[0].message.content?.trim();
		if (generatedText) {
			return generatedText;
		} else {
			throw new Error("Unable to generate comment");
		}
	} catch (error) {
		console.log((error as Error).message);
		throw new Error("Unable to generate comment");
	}
};

export { generateComment };
