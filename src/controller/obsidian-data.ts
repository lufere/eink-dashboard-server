import { Request, Response } from 'express';
import {
	MASTER_TASKLIST_PATH,
	ROUTE_TO_OBSIDIAN,
} from '../constants/constants';
import { DATE_REGEX, HASHTAG_REGEX, RECURS_REGEX } from '../constants/regex';
import { getCurrentQuote } from '../model/quote.model';
import { differenceInDays, isMonday, isWeekend, previousMonday, sub, format } from 'date-fns';

const fs = require('fs').promises;

interface Task {
	title: string;
	tags: string[] | null;
	date: string;
	recurs?: string;
	isExpired: boolean;
	dueToday: boolean;
	isComplete?: boolean;
}

interface ObsidianDataResponse {
	tasksToday: {
		tasks: Task[];
		progress: number;
	};
	tasksDailies: {
		tasks: Task[];
		progress: number;
		fileExists: boolean;
	};
	tasksHabits: {
		tasks: Task[];
		progress: number;
		fileExists: boolean;
	};
	deepWork: {
		completed: number;
		debt: number;
		total: number;
	};
	calendarTasks: {
		message: string;
		start: string;
		end: string;
		tags: string[];
	}[];
	quote: string;
}

const getDailyNotePath = () => {
	const today = new Date();
	const date = today.getHours() <= 2 ? sub(today, { days: 1 }) : today;
	const path = `Daily \Notes/${format(date, 'yyyy/MMM/yyyy-MM-dd')}.md`;
	return ROUTE_TO_OBSIDIAN + path;
};

const parseTask = (task: string) => {
	let recurs: string | undefined;
	let date = '';
	task = task
		.replace(RECURS_REGEX, (_, d) => {
			recurs = d;
			return '';
		})
		.replace(DATE_REGEX, (_, d) => {
			date = d;
			return '';
		});

	const tags = Array.from(task.match(HASHTAG_REGEX) ?? []);
	const title = task.replace(HASHTAG_REGEX, '').trim();

	const today = format(new Date(), 'yyyy-MM-dd');
	const isExpired = today > date;
	const dueToday = today === date;
	const isComplete = task.includes('[x]')
	if (isExpired) tags.push('expired');
	if (recurs) tags.push('recurs');
	return {
		title,
		tags,
		date,
		recurs,
		isExpired,
		dueToday,
		isComplete,
	};
};

const getTasksFromNote = async (notePath: string) => {
	let tasks: string[] = [];
	try {
		const data = await fs.readFile(notePath, 'utf8');
		tasks = data.split('\n');
	} catch (e) {
		console.log('error fetching file', e);
	}

	const taskData = tasks.map((task) => parseTask(task));
	return taskData;
};

const filterTodayTasks = (tasks: Task[]) => {
	const today = new Date();
	// Only look for tomorrow's Daily Note after 2:00 AM
	const date = today.getHours() <= 2 ? sub(today, { days: 1 }) : today;
	const formattedDate = format(date, 'yyyy-MM-dd');
	const dueTodayTasks = tasks
		.filter((task) => task.date && task.date <= formattedDate && !task.title?.includes('[x]'))
	const parsedTasks = dueTodayTasks.map((task) => ({
		...task,
		title: task.title.replace('- [ ]', ''),
	}));
	const todayTasks = tasks.filter((task) => task.date && task.date === formattedDate)
	const completedTasks = todayTasks.filter((task) =>
		task.title.includes(formattedDate),
	);
	return {
		tasks: parsedTasks,
		completedCount: completedTasks.length,
		progress:
			100 * (completedTasks.length / todayTasks.length),
	};
};

const filterDailyTasks = (tasks: Task[], isHabit?: boolean) => {
	const filteredTasks = tasks.filter((task) => {
		const taskConditional = isHabit
			? !task.tags?.includes('#req')
			: task.tags?.includes('#req');
		return task.tags?.includes('#todo') && taskConditional;
	});
	const completeTasks = filteredTasks.filter((task) => task.isComplete);
	const parsedTasks = filteredTasks
		.filter((task) => task.tags?.includes('#daily'))
		.map((task) => {
			let title = task.title.replace('> - [ ]', '').replace('> - [x]', '');
			let tags = task.tags ?? [];
			if (title.includes('🌞')) {
				title = title.replace('🌞', '');
				tags = [...tags, 'morning'];
			}
			if (title.includes('🌙')) {
				title = title.replace('🌙', '');
				tags = [...tags, 'night'];
			}
			if (title.includes('❗')) {
				title = title.replace('❗', '');
				tags = [...tags, 'important'];
			}
			return {
				...task,
				title,
				tags,
			};
		});
	return {
		tasks: parsedTasks.filter(task => !task.isComplete),
		completeTasks: parsedTasks.filter(task => task.isComplete),
		progress: 100 * (completeTasks.length / filteredTasks.length),
		fileExists: !!tasks.length,
	};
};

const getDeepWorkData = async (tasks: Task[]) => {
	const today = new Date();
	let debt = 0;
	if(isWeekend(today)) return {
		completed: 6,
		total: 6,
		debt,
	};
	const deepWorkTasks = tasks.filter((task) => task.tags?.includes('#deepwork'));
	const completed = deepWorkTasks.filter((task) =>
		task.title.includes('[x]'),
	).length;
	if(!isMonday(today)) {
		const lastMonday = previousMonday(today);
		const diffInDays = differenceInDays(today, lastMonday);
		for(let i = 1; i <= diffInDays; i++) {
			const notePath = `${ROUTE_TO_OBSIDIAN}Daily \Notes/${format(sub(today, {days: i}), 'yyyy/MMM/yyyy-MM-dd')}.md`
			try {
				const dayTasks = await getTasksFromNote(notePath);
				const pendingDeepWorkTasks = dayTasks.filter((task) => task.tags?.includes('#work') && !task.title.includes('[x]'));
				debt += pendingDeepWorkTasks.length
			} catch (e) {
				console.log('error fetching file for deep work debt', e);
			}
		}
	}
	return {
		completed,
		debt,
		total: deepWorkTasks.length,
	};
};

const getCalendarTasks = async () => {
	const dailyNotePath = getDailyNotePath();
	let tasks: string[] = [];
	try {
		const data = await fs.readFile(dailyNotePath, 'utf8');
		const calendarTasks = data.split('Day planner')[1];
		tasks = calendarTasks.split('\n');
	} catch (e) {
		console.log('Could not fetch calendar tasks', e);
	}
	const incompleteTasks = tasks.filter((task) => !task.includes('[x]'));
	return incompleteTasks
		.map((task) => {
			const text = task.slice(20);
			const hashtagRegex = /#[a-z0-9_]+/g;
			const message = text.replace(hashtagRegex, '').trim();
			const tags = Array.from(task.match(hashtagRegex) ?? []);
			return {
				message,
				start: task.slice(6, 11),
				end: task.slice(14, 19),
				tags,
			};
		})
		.filter((task) => task.message);
};

const getTagCounts = (tasks: Task[]) => {
	const health = tasks.filter(task => task.tags?.find(tag => tag === '#health')).length;
	return {
		health,
	}
}

export const parseObsidianTasks = async () => {
	const calendarTasks = await getCalendarTasks();

	const dailyNotePath = getDailyNotePath();
	const dailyNoteTasks = await getTasksFromNote(dailyNotePath);
	const tasksDailies = filterDailyTasks(dailyNoteTasks);
	const tasksHabits = filterDailyTasks(dailyNoteTasks, true);

	const allTasksToday = await getTasksFromNote(MASTER_TASKLIST_PATH);
	const tasksToday = filterTodayTasks(allTasksToday);

	const deepWork = await getDeepWorkData(dailyNoteTasks);
	const quote = await getCurrentQuote();

	const completedTasks = [...tasksDailies.completeTasks, ...tasksHabits.completeTasks]
	const tagCounts = getTagCounts(completedTasks);
	return {
		tasksToday,
		tasksDailies,
		tasksHabits,
		deepWork,
		calendarTasks,
		quote,
		tagCounts
	};
};

export const getObsidianData = async (
	_req: Request,
	res: Response<ObsidianDataResponse>,
) => {
	const data = await parseObsidianTasks();

	res.send(data);
};
