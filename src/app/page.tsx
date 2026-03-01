"use client";

import { useState, useEffect, FormEvent } from "react";

interface Todo {
  _id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/todos");
      const data = await res.json();
      if (data.success) {
        setTodos(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      const data = await res.json();
      if (data.success) {
        setTodos([data.data, ...todos]);
        setTitle("");
      }
    } catch (error) {
      console.error("Failed to add todo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTodo = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setTodos(
        todos.map((todo) =>
          todo._id === id ? { ...todo, completed: !currentStatus } : todo,
        ),
      );

      const res = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: !currentStatus }),
      });

      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        fetchTodos();
      }
    } catch (error) {
      console.error("Failed to toggle todo:", error);
      fetchTodos();
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      // Optimistic update
      setTodos(todos.filter((todo) => todo._id !== id));

      const res = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        fetchTodos();
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
      fetchTodos();
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Task Master By Kavindu Gihan</h1>
        <p>Organize your work with elegance</p>
      </header>

      <form className="todo-form" onSubmit={addTodo}>
        <input
          type="text"
          className="todo-input"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          autoFocus
        />
        <button
          type="submit"
          className="add-btn"
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting ? "Adding..." : "Add Task"}
        </button>
      </form>

      <div className="todo-wrapper">
        {loading ? (
          <div className="loader"></div>
        ) : todos.length === 0 ? (
          <div className="empty-state">No tasks yet. Enjoy your day! ✨</div>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li
                key={todo._id}
                className={`todo-item ${todo.completed ? "completed" : ""}`}
              >
                <div className="todo-content">
                  <input
                    type="checkbox"
                    className="todo-checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo._id, todo.completed)}
                  />
                  <span className="todo-text" title={todo.title}>
                    {todo.title}
                  </span>
                </div>
                <div className="todo-actions">
                  <button
                    className="delete-btn"
                    onClick={() => deleteTodo(todo._id)}
                    aria-label="Delete task"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
