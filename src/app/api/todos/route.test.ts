import { GET, POST } from './route';
import { NextRequest } from 'next/server';

// Deeply mock mongoose to block all internal instantiation attempts in tests
jest.mock('mongoose', () => ({
  Schema: class {},
  model: jest.fn(),
  models: { Todo: {} },
  connect: jest.fn(),
  Error: { ValidationError: class extends Error { errors: any; constructor(errs: any) { super(); this.errors = errs; } } }
}));

import dbConnect from '@/lib/db';
import { Todo } from '@/models/Todo';

// Mock the db connection and Todo model
jest.mock('@/lib/db', () => jest.fn());
jest.mock('@/models/Todo');

// Mock NextRequest to avoid global.Request node issues
jest.mock('next/server', () => {
  return {
    NextRequest: jest.fn().mockImplementation((url, init) => {
      return {
        url,
        method: init?.method || 'GET',
        json: jest.fn().mockResolvedValue(JSON.parse(init?.body || '{}'))
      };
    }),
    NextResponse: {
      json: jest.fn().mockImplementation((body, init) => ({
        status: init?.status || 200,
        json: jest.fn().mockResolvedValue(body)
      }))
    }
  };
});
jest.mock('@/lib/db', () => jest.fn());
jest.mock('@/models/Todo', () => ({
  Todo: {
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
  }
}));

describe('Todos API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/todos', () => {
    it('should return todos successfully', async () => {
      const mockTodos = [
        { _id: '1', title: 'Test 1', completed: false },
        { _id: '2', title: 'Test 2', completed: true }
      ];

      // Mock the find().sort() chain
      const mockSort = jest.fn().mockResolvedValue(mockTodos);
      (Todo.find as jest.Mock).mockReturnValue({ sort: mockSort });

      const response = await GET();
      const data = await response.json();

      expect(dbConnect).toHaveBeenCalled();
      expect(Todo.find).toHaveBeenCalledWith({});
      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, data: mockTodos });
    });

    it('should handle errors', async () => {
      // Mock db connection failure
      (dbConnect as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ success: false, error: 'Failed to fetch todos' });
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new todo successfully', async () => {
      const mockTodo = { _id: '1', title: 'New Todo', completed: false };
      
      const req = new NextRequest('http://localhost:3000/api/todos', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Todo' })
      });

      (Todo.create as jest.Mock).mockResolvedValue(mockTodo);

      const response = await POST(req);
      const data = await response.json();

      expect(dbConnect).toHaveBeenCalled();
      expect(Todo.create).toHaveBeenCalledWith({ title: 'New Todo' });
      expect(response.status).toBe(201);
      expect(data).toEqual({ success: true, data: mockTodo });
    });

    it('should return 400 if title is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/todos', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ success: false, error: 'Title is required' });
      expect(Todo.create).not.toHaveBeenCalled();
    });
  });
});
