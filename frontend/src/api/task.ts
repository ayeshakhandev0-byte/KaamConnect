import { Task } from "../types";

export async function fetchTasks(): Promise<Task[]> {
  return []; // return empty list for MVP
}

export async function createTask(task: Task): Promise<Task> {
  return task; // mock
}
