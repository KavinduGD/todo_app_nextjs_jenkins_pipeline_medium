import { NextRequest, NextResponse } from 'next/server';
import { getTodos, addTodo } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const todos = getTodos();
    return NextResponse.json({ success: true, data: todos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch todos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const todo = addTodo(body);
    return NextResponse.json({ success: true, data: todo }, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ success: false, error: 'Failed to create todo' }, { status: 500 });
  }
}
