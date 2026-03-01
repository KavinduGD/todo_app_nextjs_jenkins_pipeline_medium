import { PUT, DELETE } from './route';
import { NextRequest } from 'next/server';
import { updateTodo, deleteTodo } from '@/lib/store';

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

describe('Todo [id] API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/todos/[id]', () => {
    it('should update a todo successfully', async () => {
      const mockTodo = { _id: '1', title: 'Updated Todo', completed: true };
      
      const req = new NextRequest('http://localhost:3000/api/todos/1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Todo', completed: true })
      });

      (updateTodo as jest.Mock).mockReturnValue(mockTodo);

      const response = await PUT(req, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(updateTodo).toHaveBeenCalledWith('1', { title: 'Updated Todo', completed: true });
      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, data: mockTodo });
    });

    it('should return 404 if todo not found', async () => {
      const req = new NextRequest('http://localhost:3000/api/todos/1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Todo' })
      });

      (updateTodo as jest.Mock).mockReturnValue(null);

      const response = await PUT(req, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ success: false, error: 'Todo not found' });
    });

    it('should handle errors during update', async () => {
      const req = new NextRequest('http://localhost:3000/api/todos/1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Todo' })
      });

      (updateTodo as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Database Error');
      });

      const response = await PUT(req, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ success: false, error: 'Failed to update todo' });
    });
  });

  describe('DELETE /api/todos/[id]', () => {
    it('should delete a todo successfully', async () => {
      const mockTodo = { _id: '1', title: 'Todo to delete', completed: false };
      
      const req = new NextRequest('http://localhost:3000/api/todos/1', {
        method: 'DELETE'
      });

      (deleteTodo as jest.Mock).mockReturnValue(mockTodo);

      const response = await DELETE(req, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(deleteTodo).toHaveBeenCalledWith('1');
      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, data: {} });
    });

    it('should return 404 if todo not found', async () => {
      const req = new NextRequest('http://localhost:3000/api/todos/1', {
        method: 'DELETE'
      });

      (deleteTodo as jest.Mock).mockReturnValue(null);

      const response = await DELETE(req, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ success: false, error: 'Todo not found' });
    });

    it('should handle errors during delete', async () => {
      const req = new NextRequest('http://localhost:3000/api/todos/1', {
        method: 'DELETE'
      });

      (deleteTodo as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Database Error');
      });

      const response = await DELETE(req, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ success: false, error: 'Failed to delete todo' });
    });
  });
});
