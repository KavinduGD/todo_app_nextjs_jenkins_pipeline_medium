import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { getTodos, addTodo } from '@/lib/store';

// Mock the store functions
jest.mock('@/lib/store');

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

      (getTodos as jest.Mock).mockReturnValue(mockTodos);

      const response = await GET();
      const data = await response.json();

      expect(getTodos).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, data: mockTodos });
    });

    it('should handle errors', async () => {
      // Mock store throwing an error
      (getTodos as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Store Error');
      });

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

      (addTodo as jest.Mock).mockReturnValue(mockTodo);

      const response = await POST(req);
      const data = await response.json();

      expect(addTodo).toHaveBeenCalledWith({ title: 'New Todo' });
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
      expect(addTodo).not.toHaveBeenCalled();
    });

    it('should handle errors during creation', async () => {
      const req = new NextRequest('http://localhost:3000/api/todos', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Todo' })
      });

      (addTodo as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ success: false, error: 'Failed to create todo' });
    });
  });
});
