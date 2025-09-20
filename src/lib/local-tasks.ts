const STORAGE_KEY = "age-task-ids";

export type StoredTask = {
  id: string;
  role: "client" | "worker";
  address: string;
  chainId: number;
  createdAt: number;
};

type TaskStore = {
  tasks: StoredTask[];
};

function readStore(): TaskStore {
  if (typeof window === "undefined") return { tasks: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tasks: [] };
    const parsed = JSON.parse(raw) as TaskStore;
    if (!Array.isArray(parsed.tasks)) return { tasks: [] };
    return { tasks: parsed.tasks };
  } catch (error) {
    console.warn("Failed to parse AGE task store", error);
    return { tasks: [] };
  }
}

function writeStore(next: TaskStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function recordTask(task: StoredTask) {
  if (typeof window === "undefined") return;
  const store = readStore();
  const exists = store.tasks.some((entry) => entry.id === task.id && entry.address === task.address && entry.role === task.role);
  if (exists) return;
  store.tasks.push(task);
  writeStore(store);
}

export function listTasksFor(address: string, role: StoredTask["role"], chainId: number) {
  const store = readStore();
  return store.tasks.filter((entry) => entry.address === address && entry.role === role && entry.chainId === chainId);
}

export function clearTasks() {
  if (typeof window === "undefined") return;
  writeStore({ tasks: [] });
}
