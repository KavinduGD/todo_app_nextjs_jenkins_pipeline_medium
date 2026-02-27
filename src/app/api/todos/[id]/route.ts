import { NextRequest, NextResponse } from 'next/server';
import { updateTodo, deleteTodo } from '@/lib/store';

// In Next.js App Router, params are resolved asynchronously.
// While { params: { id: string } } works sometimes, treating it as a Promise is safer.
type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const { id } = params;
    
    const body = await req.json();

    const todo = updateTodo(id, body);

    if (!todo) {
      return NextResponse.json({ success: false, error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: todo }, { status: 200 });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ success: false, error: 'Failed to update todo' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const { id } = params;

    const deletedTodo = deleteTodo(id);

    if (!deletedTodo) {
      return NextResponse.json({ success: false, error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete todo' }, { status: 500 });
  }
}
