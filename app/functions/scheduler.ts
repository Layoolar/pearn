import schedule, { Job } from "node-schedule";

interface UserJob {
	userId: number;
	userJobs: Job[];
}

const jobs: UserJob[] = [];

const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

/**
 * scheduleNewJob()
 * ===========================
 *
 * @description schedules a new job to be executed later for a specific user using the node-schedule library.
 *
 * @param {number} userId - The unique identifier for the user.
 * @param {() => void} callback - The function to be executed when the job triggers.
 * @param {Date} [time=scheduledTime] - The date and time to schedule the job. Defaults to 24 hours from the current time.
 * @returns {void}
 *
 * @example
 * scheduleNewJob(123, () => {
 *   console.log("Job executed!");
 * });
 */
const scheduleNewJob = (userId: number, callback: () => void, time: Date = scheduledTime): void => {
	let userJob = jobs.find((user) => user.userId === userId);

	if (!userJob) {
		userJob = { userId, userJobs: [] };
		jobs.push(userJob);
	}

	const job = schedule.scheduleJob(time, async () => {
		await callback();

		if (userJob) {
			userJob.userJobs = userJob.userJobs.filter((j: schedule.Job) => j !== job);
		}
	});

	userJob.userJobs.push(job);
};

export default scheduleNewJob;
