import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '@/app/page';

// Mock the global fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true, data: [] }),
  })
) as jest.Mock;

describe('Home Component', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders a heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { level: 1, name: /Task Master/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the initial loading state initially', () => {
    // Override fetch to hang slightly so we can observe loading state
    global.fetch = jest.fn(() => new Promise(() => {}));
    
    render(<Home />);
    
    // Test for loading state presence
    const submitBtn = screen.getByRole('button', { name: /Add Task/i });
    expect(submitBtn).toBeDisabled(); 
  });
  
  it('displays empty state when no todos are returned', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: [] }),
      })
    );

    await act(async () => {
      render(<Home />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('No tasks yet. Enjoy your day! ✨')).toBeInTheDocument();
    });
  });

  it('fetches and displays todos', async () => {
    const mockTodos = [
      { _id: '1', title: 'Test Todo 1', completed: false },
      { _id: '2', title: 'Test Todo 2', completed: true },
    ];

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: mockTodos }),
      })
    );

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
    });
    
    // Check if the completed class is applied correctly based on state
    const firstCheckbox = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
    expect(firstCheckbox.checked).toBe(false);
    
    const secondCheckbox = screen.getAllByRole('checkbox')[1] as HTMLInputElement;
    expect(secondCheckbox.checked).toBe(true);
  });

  it('allows user to add a new todo', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: [] }),
      })
    );

    await act(async () => {
      render(<Home />);
    });
    
    // Wait for initial load
    await waitFor(() => {
        expect(screen.getByText('No tasks yet. Enjoy your day! ✨')).toBeInTheDocument();
    });

    // Mock the POST request
    const newTodo = { _id: '3', title: 'New task created', completed: false };
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: newTodo }),
      })
    );

    const input = screen.getByPlaceholderText('What needs to be done?');
    const button = screen.getByRole('button', { name: /Add Task/i });

    await act(async () => {
      fireEvent.change(input, { target: { value: 'New task created' } });
    });
    expect((input as HTMLInputElement).value).toBe('New task created');
    
    // Button should be enabled since input has text
    expect(button).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(button);
    });

    // After success, it should appear on screen
    await waitFor(() => {
      expect(screen.getByText('New task created')).toBeInTheDocument();
    });
  });

  it('allows user to toggle a todo status', async () => {
    const mockTodos = [
      { _id: '1', title: 'Test Todo 1', completed: false },
    ];

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: mockTodos }),
      })
    );

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    // Mock the PUT request
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { ...mockTodos[0], completed: true } }),
      })
    );

    await act(async () => {
      fireEvent.click(checkbox);
    });

    // Optimistic update should immediately check it
    expect(checkbox).toBeChecked();
  });

  it('reverts toggle on API failure', async () => {
    // Suppress console.error for this specific test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mockTodos = [
      { _id: '1', title: 'Test Todo 1', completed: false },
    ];

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: mockTodos }),
      })
    );

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');

    // Mock the PUT request to fail, and the subsequent GET fetchTodos to return original state
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.reject(new Error('Network Error'))) // PUT fails
      .mockImplementationOnce(() => Promise.resolve({ // GET succeeds and returns original
        json: () => Promise.resolve({ success: true, data: mockTodos }),
      }));

    await act(async () => {
      fireEvent.click(checkbox);
    });

    // Checkbox should revert to unchecked because fetchTodos was called
    await waitFor(() => {
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    consoleSpy.mockRestore();
  });

  it('allows user to delete a todo', async () => {
    const mockTodos = [
      { _id: '1', title: 'Test Todo 1', completed: false },
    ];

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: mockTodos }),
      })
    );

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /Delete task/i });

    // Mock the DELETE request
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: {} }),
      })
    );

    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    // Optimistic update should immediately remove it
    expect(screen.queryByText('Test Todo 1')).not.toBeInTheDocument();
  });

  it('reverts delete on API failure', async () => {
    // Suppress console.error for this specific test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mockTodos = [
      { _id: '1', title: 'Test Todo 1', completed: false },
    ];

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: mockTodos }),
      })
    );

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /Delete task/i });

    // Mock the DELETE request to fail, and the subsequent GET fetchTodos to return original state
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.reject(new Error('Network Error'))) // DELETE fails
      .mockImplementationOnce(() => Promise.resolve({ // GET succeeds and returns original
        json: () => Promise.resolve({ success: true, data: mockTodos }),
      }));

    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    // It should reappear because fetchTodos was called after failure
    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
