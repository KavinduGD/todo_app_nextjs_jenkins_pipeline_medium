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
});
