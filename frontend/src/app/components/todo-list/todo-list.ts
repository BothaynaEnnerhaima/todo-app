import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Todo } from '../../models/todo.model';
import { TodoService } from '../../services/todo.service';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.html',
  styleUrls: ['./todo-list.scss'],
})
export class TodoList implements OnInit {

  todos: Todo[] = [];
  newTitle = '';

  constructor(private todoService: TodoService) {}

  ngOnInit(): void {
    this.loadTodos();
  }

  loadTodos() {
    this.todoService.getTodos().subscribe(data => this.todos = data);
  }

  addTodo() {
    if (this.newTitle.trim()) {
      const newTodo: Todo = {
        title: this.newTitle.trim(),
        completed: false,
        status: 'todo'  
      };
      
      this.todoService.addTodo(newTodo)
        .subscribe(todo => {
          this.todos.push(todo);
          this.newTitle = '';
        });
    }
  }

  getTodosByStatus(status: 'todo' | 'working' | 'done'): Todo[] {
    return this.todos.filter(todo => todo.status === status);
  }

  
  drop(event: CdkDragDrop<Todo[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.todos, event.previousIndex, event.currentIndex);
    } else {
      const todo = event.item.data;
    
      let newStatus: 'todo' | 'working' | 'done' = 'todo';
      if (event.container.element.nativeElement.classList.contains('working')) {
        newStatus = 'working';
      } else if (event.container.element.nativeElement.classList.contains('done')) {
        newStatus = 'done';
      }

      todo.status = newStatus;
      
      if (newStatus === 'done') {
        todo.completed = true;
      } else if (newStatus === 'todo') {
        todo.completed = false;
      }
      this.todoService.updateTodo(todo).subscribe();
    }
  }

  toggle(todo: Todo) {
    todo.completed = !todo.completed;
    if (todo.completed && todo.status !== 'done') {
      todo.status = 'done';
    } else if (!todo.completed && todo.status === 'done') {
      todo.status = 'todo';
    }
    this.todoService.updateTodo(todo).subscribe();
  }

  delete(todo: Todo) {
    this.todoService.deleteTodo(todo.id!).subscribe(() => {
      this.todos = this.todos.filter(t => t.id !== todo.id);
    });
  }
}