export interface ITodo {
  _id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

// Extend global to hold the store persistently across Next.js reloads during development
const globalStore = global as unknown as { __todosStore: ITodo[] };

if (!globalStore.__todosStore) {
  globalStore.__todosStore = [];
}

const getStore = () => globalStore.__todosStore;

const EXPIRATION_TIME_MS = 5 * 60 * 1000; // 5 minutes

export const cleanupExpiredTodos = () => {
  const now = new Date().getTime();
  globalStore.__todosStore = globalStore.__todosStore.filter(
    (todo) => now - new Date(todo.createdAt).getTime() < EXPIRATION_TIME_MS
  );
};

export const getTodos = (): ITodo[] => {
  cleanupExpiredTodos();
  return [...getStore()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getTodoById = (id: string): ITodo | undefined => {
  cleanupExpiredTodos();
  return getStore().find((todo) => todo._id === id);
};

export const addTodo = (todoData: Omit<ITodo, '_id' | 'createdAt' | 'completed'> & Partial<ITodo>): ITodo => {
  cleanupExpiredTodos();
  const newTodo: ITodo = {
    _id: Math.random().toString(36).substring(2, 15),
    title: todoData.title,
    completed: todoData.completed || false,
    createdAt: todoData.createdAt ? new Date(todoData.createdAt) : new Date(),
  };
  getStore().push(newTodo);
  return newTodo;
};

export const updateTodo = (id: string, updates: Partial<Omit<ITodo, '_id'>>): ITodo | null => {
  cleanupExpiredTodos();
  const index = getStore().findIndex((todo) => todo._id === id);
  if (index === -1) {
    return null;
  }
  
  const updatedTodo = { ...getStore()[index], ...updates };
  getStore()[index] = updatedTodo;
  return updatedTodo;
};

export const deleteTodo = (id: string): ITodo | null => {
  cleanupExpiredTodos();
  const index = getStore().findIndex((todo) => todo._id === id);
  if (index === -1) {
    return null;
  }
  
  const deletedTodo = getStore()[index];
  getStore().splice(index, 1);
  return deletedTodo;
};

// For testing purposes
export const clearStore = () => {
  globalStore.__todosStore = [];
};
