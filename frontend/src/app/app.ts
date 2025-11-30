import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TodoService } from './services/todo.service';
import { Todo } from './models/todo.model';
import { MatButtonModule } from '@angular/material/button';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, CdkDropList, CdkDrag],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  todos = signal<Todo[]>([]);
  isLoading = signal(true);
  isDark = signal(window.matchMedia('(prefers-color-scheme: dark)').matches);

  constructor(private todoService: TodoService) {
    this.loadTodos();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', e => this.isDark.set(e.matches));
    effect(() => document.documentElement.dataset['theme'] = this.isDark() ? 'dark' : 'light');
  }

  loadTodos() {
    this.todoService.getTodos().subscribe({
      next: (data) => {
        const validatedData = data.map(todo => ({
          ...todo,
          status: this.validateStatus(todo.status)
        }));
        this.todos.set(validatedData);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  addTodo(title: string) {
    if (!title.trim()) return;
    const newTodo: Omit<Todo, 'id'> = { 
      title: title.trim(), 
      completed: false,
      status: 'todo'
    };
    this.todoService.addTodo(newTodo).subscribe(todo => {
      this.todos.update(t => [...t, todo]);
    });
  }

  toggle(todo: Todo) {
    const updatedTodo: Todo = { 
      ...todo, 
      completed: !todo.completed,
      status: !todo.completed ? 'done' : 'todo'
    };
    this.todoService.updateTodo(updatedTodo).subscribe(() => {
      this.todos.update(t => t.map(x => x.id === todo.id ? updatedTodo : x));
    });
  }

  delete(id?: number) {
    if (!id) return;
    this.todoService.deleteTodo(id).subscribe(() => {
      this.todos.update(t => t.filter(x => x.id !== id));
    });
  }

  toggleTheme() {
    this.isDark.set(!this.isDark());
  }

  getTodosByStatus(status: 'todo' | 'working' | 'done'): Todo[] {
    return this.todos().filter(todo => todo.status === status);
  }

  // CORRECTION : Méthode drop avec transferArrayItem
  drop(event: CdkDragDrop<Todo[]>) {
    const todo: Todo = event.item.data;
    const targetStatus = (event.container.element.nativeElement as HTMLElement).getAttribute('data-status') as 'todo' | 'working' | 'done';

    if (event.previousContainer === event.container) {
      // Même liste - réorganisation
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Liste différente - changement de statut
      const updatedTodo: Todo = { 
        ...todo, 
        status: targetStatus,
        completed: targetStatus === 'done' ? true : false
      };
      
      // Mettre à jour les données localement d'abord
      this.todos.update(todos => 
        todos.map(t => t.id === todo.id ? updatedTodo : t)
      );
      
      // Puis sauvegarder sur le serveur
      this.todoService.updateTodo(updatedTodo).subscribe();
    }
  }

  private validateStatus(status: any): 'todo' | 'working' | 'done' {
    if (status === 'todo' || status === 'working' || status === 'done') {
      return status;
    }
    return 'todo';
  }
}