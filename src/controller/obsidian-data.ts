import { Request, Response } from "express";
import { MASTER_TASKLIST_PATH, ROUTE_TO_OBSIDIAN } from "../constants/constants";
import { DATE_REGEX, HASHTAG_REGEX, RECURS_REGEX } from "../constants/regex";
import { getCurrentQuote } from "../model/quote.model";

const fs = require('fs').promises;
const format = require('date-fns').format;
const sub = require('date-fns').sub

interface Task {
    title: string
    tags: string[] | null
    date: string
    recurs?: string
    isExpired: boolean
    dueToday: boolean
}

interface ObsidianDataResponse {
    tasksToday: {
        tasks: Task[],
        progress: number
    }
    tasksDailies: {
        tasks: Task[],
        progress: number
        fileExists: boolean
    }
    tasksHabits: {
        tasks: Task[],
        progress: number
        fileExists: boolean
    }
    deepWork: {
        completed: number
        total: number
    },
    calendarTasks: {
        message: string
        start: string
        end: string
        tags: string[]
    }[]
    quote: string
}

const getDailyNotePath = () => {
    const today = new Date();
    const date = today.getHours() <= 2 ? sub(today, { days: 1 }) : today;
    const path = `Daily \Notes/${format(date, 'yyyy/MMM/yyyy-MM-dd')}.md`
    return ROUTE_TO_OBSIDIAN + path
}

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
        })

    const tags = Array.from(task.match(HASHTAG_REGEX) ?? []) 
    const title = task.replace(HASHTAG_REGEX, '').trim();

    const today = format(new Date(), 'yyyy-MM-dd')
    const isExpired = today > date;
    const dueToday = today === date;
    if(isExpired) tags.push('expired')
    if(recurs) tags.push('recurs')
    return {
        title,
        tags,
        date,
        recurs,
        isExpired,
        dueToday,
    }
}

const getTasksFromNote = async (notePath: string) => {
    let tasks: string[] = []
    try {
        const data = await fs.readFile(notePath, 'utf8')
        tasks = data.split('\n')
    } catch(e) {
        console.log('error fetching file', e)
    }

    const taskData = tasks.map(task => parseTask(task))
    return taskData
 }

 const filterTodayTasks = (tasks: Task[]) => {
    const today = new Date();
    // Only look for tomorrow's Daily Note after 2:00 AM
    const date = today.getHours() <= 2 ? sub(today, { days: 1 }) : today;
    const formattedDate = format(date, "yyyy-MM-dd");
    const dueTodayTasks = tasks.filter(task => task.date && task.date <= formattedDate).filter(task => !task.title?.includes('[x]'));
    const parsedTasks = dueTodayTasks.map(task => ({ ...task, title: task.title.replace('- [ ]', '')}));
    const completedTasks = tasks.filter(task => task.title.includes(formattedDate));
    return {
        tasks: parsedTasks,
        progress: 100 * ( completedTasks.length / (dueTodayTasks.length + completedTasks.length))
    }
 }

const filterDailyTasks = (tasks: Task[], isHabit?: boolean) => {
    const filteredTasks = tasks.filter(task => {
        const taskConditional = isHabit ? !task.tags?.includes('#req') : task.tags?.includes('#req')
        return task.tags?.includes('#todo') && taskConditional
    });
    const completeTasks = filteredTasks.filter(task => task.title?.includes('[x]'));
    const incompleteTasks = filteredTasks.filter(task => !task.title?.includes('[x]'));
    const parsedTasks = incompleteTasks.filter(task => task.tags?.includes('#daily'))
        .map(task => {
            let title = task.title.replace('> - [ ]', '')
            let tags = task.tags ?? [];
            if(title.includes('🌞')){
                title = title.replace('🌞', '');
                tags = [...tags, 'morning']
            }
            if(title.includes('🌙')){
                title = title.replace('🌙', '');
                tags = [...tags, 'night']
            }
            if(title.includes('❗')){
                title = title.replace('❗', '');
                tags = [...tags, 'important']
            }
            return {
                ...task,
                title,
                tags,
            }
        })
    return {
        tasks: parsedTasks,
        progress: 100 * (completeTasks.length / filteredTasks.length),
        fileExists: !!tasks.length
    }
}

const getDeepWorkData = (tasks: Task[]) => {
    const deepWorkTasks = tasks.filter(task => task.tags?.includes('#work'));
    const completed = deepWorkTasks.filter(task => task.title.includes('[x]')).length;
    return {
        completed,
        total: deepWorkTasks.length,
    }
}

const getCalendarTasks = async () => {
    const dailyNotePath = getDailyNotePath()
    let tasks: string[] = []
    try {
        const data = await fs.readFile(dailyNotePath, 'utf8')
        const calendarTasks = data.split('Day planner')[1]
        tasks = calendarTasks.split('\n')
    } catch(e) {
        console.log('Could not fetch calendar tasks', e)
    }
    const incompleteTasks = tasks.filter(task => !task.includes('[x]'))
    return incompleteTasks.map(task => {
        const text = task.slice(20)
        const hashtagRegex = /#[a-z0-9_]+/g
        const message = text.replace(hashtagRegex, '').trim();
        const tags = Array.from(task.match(hashtagRegex) ?? []) 
        return {
            message,
            start: task.slice(6, 11),
            end: task.slice(14, 19),
            tags,
        }
    }).filter(task => task.message)
}
 
export const getObsidianData = async(_req: Request, res: Response<ObsidianDataResponse>) => {
    const calendarTasks = await getCalendarTasks()

    const dailyNotePath = getDailyNotePath()
    const dailyNoteTasks = await getTasksFromNote(dailyNotePath);
    const tasksDailies = filterDailyTasks(dailyNoteTasks);
    const tasksHabits = filterDailyTasks(dailyNoteTasks, true);

    const allTasksToday = await getTasksFromNote(MASTER_TASKLIST_PATH);
    const tasksToday = filterTodayTasks(allTasksToday)

    const deepWork = getDeepWorkData(dailyNoteTasks)
    const quote = await getCurrentQuote()

	res.send({
		tasksToday,  
		tasksDailies,
		tasksHabits,
        deepWork,
        calendarTasks,
        quote,
	})
}
