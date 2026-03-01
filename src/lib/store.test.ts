import { getTodos, getTodoById, addTodo, updateTodo, deleteTodo, cleanupExpiredTodos, clearStore } from './store';

describe('In-Memory Store', () => {
  beforeEach(() => {
    clearStore();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start with an empty store', () => {
    const todos = getTodos();
    expect(todos).toHaveLength(0);
  });

  it('should add a new todo', () => {
    const todo = addTodo({ title: 'Test Todo' });
    expect(todo).toHaveProperty('_id');
    expect(todo.title).toBe('Test Todo');
    expect(todo.completed).toBe(false);

    const todos = getTodos();
    expect(todos).toHaveLength(1);
    expect(todos[0]._id).toBe(todo._id);
  });

  it('should update a todo', () => {
    const todo = addTodo({ title: 'To Update' });
    const updated = updateTodo(todo._id, { title: 'Updated Title', completed: true });
    
    expect(updated).not.toBeNull();
    expect(updated?.title).toBe('Updated Title');
    expect(updated?.completed).toBe(true);
    
    const todos = getTodos();
    expect(todos[0].completed).toBe(true);
  });

  it('should delete a todo', () => {
    const todo = addTodo({ title: 'To Delete' });
    expect(getTodos()).toHaveLength(1);

    const deleted = deleteTodo(todo._id);
    expect(deleted).not.toBeNull();
    expect(deleted?._id).toBe(todo._id);

    expect(getTodos()).toHaveLength(0);
  });

  it('should clean up expired todos automatically', () => {
    // Mock system time to a specific point
    jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
    
    const oldTodo = addTodo({ title: 'Old Todo' });
    
    // Add another todo slightly later (3 minutes later)
    jest.setSystemTime(new Date('2024-01-01T12:03:00.000Z'));
    const newTodo = addTodo({ title: 'New Todo' });

    expect(getTodos()).toHaveLength(2);

    // Fast forward to 6 minutes after the first todo (it expires after 5 mins)
    jest.setSystemTime(new Date('2024-01-01T12:06:00.000Z'));
    
    // Accessing the store should trigger cleanup
    const todos = getTodos();
    
    expect(todos).toHaveLength(1);
    expect(todos[0]._id).toBe(newTodo._id);
  });
  it('should get a todo by ID', () => {
    const todo = addTodo({ title: 'To Get' });
    const found = getTodoById(todo._id);
    expect(found).toEqual(todo);

    const notFound = getTodoById('non-existent');
    expect(notFound).toBeUndefined();
  });

  it('should return null when updating a non-existent todo', () => {
    const updated = updateTodo('non-existent', { title: 'Updated Title' });
    expect(updated).toBeNull();
  });

  it('should return null when deleting a non-existent todo', () => {
    const deleted = deleteTodo('non-existent');
    expect(deleted).toBeNull();
  });
});
