/**
 * File overview:
 * The TodoController class wires the view and model together.
 * It:
 *   - Subscribes to model changes so that the view can render the
 *     latest list of todos whenever data changes.
 *   - Subscribes to view events (add, toggle, delete, edit) and calls
 *     the appropriate model functions.
 *   - Handles basic validation and user-facing feedback messages.
 */

export class TodoController {
  /**
   * @param {import("../models/TodoModel.js").TodoModel} model
   * @param {import("../views/TodoView.js").TodoView} view
   */
  constructor(model, view) {
    this.model = model;
    this.view = view;

    /**
     * Tracks whether the lists are currently sorted A→Z.
     * This is display-only — the model's stored order is never changed.
     */
    this.isSorted = false;

    // Every time the model's todo list changes, re-render respecting the
    // current sort state so the order stays consistent after add/delete/edit.
    this.model.subscribe((todos) => {
      this.view.renderTodos(this.applySortOrder(todos));
    });

    // If local data already exists, render it immediately.
    // Otherwise keep the initial "Loading..." placeholder in index.html
    // until the model notifies after API load succeeds or fails.
    const initialTodos = this.model.getTodos();
    if (initialTodos.length > 0) {
      this.view.renderTodos(this.applySortOrder(initialTodos));
    }

    // Wire view events to controller methods.
    this.view.bindAddTodo(this.handleAddTodo.bind(this));
    this.view.bindToggleTodo(this.handleToggleTodo.bind(this));
    this.view.bindDeleteTodo(this.handleDeleteTodo.bind(this));
    this.view.bindEditTodo(this.handleEditTodo.bind(this));
    this.view.bindSortTodos(this.handleSortTodos.bind(this));
  }

  /**
   * Returns a copy of the todos array sorted alphabetically if isSorted
   * is true, or in the original model order if false.
   *
   * @param {Array} todos
   * @returns {Array}
   */
  applySortOrder(todos) {
    if (!this.isSorted) return todos;
    return [...todos].sort((a, b) => a.todo.localeCompare(b.todo));
  }

  /**
   * Toggles alphabetical sort on/off and re-renders both lists.
   * The model's stored order is never modified.
   */
  handleSortTodos() {
    this.isSorted = !this.isSorted;
    this.view.updateSortButton(this.isSorted);
    this.view.renderTodos(this.applySortOrder(this.model.getTodos()));
  }

  /**
   * Handles the "add" flow:
   *   - Validates input.
   *   - Asks the model to add the new todo.
   *   - Clears the form and shows success or error feedback.
   *
   * @param {string} text
   */
  async handleAddTodo(text) {
    if (!text.trim()) {
      this.view.showMessage("Please enter a task description.", "error");
      return;
    }

    try {
      await this.model.addTodo(text.trim());
      this.view.clearInput();
      this.view.showMessage("Task added successfully.", "success");
    } catch (error) {
      this.view.showMessage(
        "Unable to add task. Please try again.",
        "error"
      );
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  /**
   * Handles moving a todo between "pending" and "completed".
   *
   * @param {number} id
   */
  async handleToggleTodo(id) {
    // Model updates local state optimistically and fires the API in the
    // background, so this call will not throw under normal circumstances.
    await this.model.toggleTodoCompletion(id);
  }

  /**
   * Handles removal of a todo from the list.
   *
   * @param {number} id
   */
  async handleDeleteTodo(id) {
    await this.model.deleteTodo(id);
    this.view.showMessage("Task deleted.", "success");
  }

  /**
   * Handles persisting edited task text.
   *
   * @param {number} id
   * @param {string} newText
   */
  async handleEditTodo(id, newText) {
    await this.model.editTodo(id, newText);
    this.view.showMessage("Task updated.", "success");
  }
}
