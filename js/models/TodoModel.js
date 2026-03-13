/**
 * File overview:
 * The TodoModel class owns all todo data used by the application.
 * It knows how to:
 *   - Load initial todos from dummyjson.com.
 *   - Apply changes to the in-memory list when the controller asks.
 *   - Call the API client so that GET/POST/PUT/DELETE requests are
 *     actually performed.
 *   - Persist the current list into localStorage as an optional bonus.
 *
 * The model does NOT know anything about how todos are displayed.
 */

import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "../services/apiClient.js";

// Key used to store serialized todos inside localStorage.
const LOCAL_STORAGE_KEY = "mvc-todo-evaluation-list";

export class TodoModel {
  constructor() {
    /**
     * Internal state:
     * This array only stores objects in the same shape as the API:
     * { id, todo, completed, userId }.
     */
    this.todos = [];

    /**
     * Change subscribers:
     * Any function pushed into this array will be called whenever the
     * todo list changes so external layers (primarily the controller)
     * can trigger a re-render.
     */
    this.subscribers = [];

    /**
     * Immediately attempt to hydrate local state when the model is
     * constructed so the user sees existing items after a refresh.
     */
    this.loadFromLocalStorage();

    /**
     * Load a fresh snapshot from the remote API. We do this even when
     * localStorage is present because the assignment expects that the
     * GET request is executed.
     */
    this.loadInitialFromApi().catch((error) => {
      // In a real app we might push this to a logger; here we simply
      // expose the failure via a custom callback that the controller
      // can read.
      // eslint-disable-next-line no-console
      console.error("Failed to load todos from API:", error);
      // Let subscribers leave the loading state even when API fails.
      this.notify();
    });
  }

  /**
   * read-only accessor that exposes the current todo list.
   * The controller or view should treat the returned array as immutable.
   */
  getTodos() {
    return [...this.todos];
  }

  /**
   * Adds a subscriber that will be notified whenever the todo list is
   * mutated. The callback receives the new array of todos.
   *
   * @param {(todos:Array) => void} handler
   */
  subscribe(handler) {
    this.subscribers.push(handler);
  }

  /**
   * Utility that calls all subscriber callbacks with the latest state
   * and mirrors the state into localStorage for the bonus requirement.
   */
  notify() {
    const snapshot = this.getTodos();
    this.subscribers.forEach((handler) => handler(snapshot));
    this.saveToLocalStorage(snapshot);
  }

  /**
   * Loads initial todos from the remote API and merges them with local
   * state without duplicating entries that share the same id.
   * Local values win for matching ids so user edits survive refresh.
   */
  async loadInitialFromApi() {
    const remoteTodos = await fetchTodos();
    // Keep local todos in their current order (preserves user-defined order
    // and keeps newly added items at the top). Append any remote todos whose
    // id is not already present locally so we don't lose API data.
    const localIds = new Set(this.todos.map((t) => t.id));
    const newFromRemote = remoteTodos.filter((t) => !localIds.has(t.id));
    this.todos = [...this.todos, ...newFromRemote];
    this.notify();
  }

  /**
   * Creates a new todo both locally and via POST /todos/add.
   *
   * @param {string} text - Human-readable description of the task.
   * @returns {Promise<void>}
   */
  async addTodo(text) {
    const created = await createTodo(text);
    // Because the remote API does not persist, we treat this response
    // as the canonical representation and push it into our array.
    this.todos = [created, ...this.todos];
    this.notify();
  }

  /**
   * Toggles the "completed" flag on a todo and mirrors that change to
   * the PUT /todos/:id endpoint.
   *
   * @param {number} id - Identifier of the todo to toggle.
   * @returns {Promise<void>}
   */
  async toggleTodoCompletion(id) {
    const current = this.todos.find((t) => t.id === id);
    if (!current) return;

    const updatedCompleted = !current.completed;

    // Update local state immediately so the UI responds regardless of
    // whether the remote call succeeds. dummyjson is static and does not
    // persist, so local state is always the source of truth.
    this.todos = this.todos.map((t) =>
      t.id === id ? { ...t, completed: updatedCompleted } : t
    );
    this.notify();

    // Fire-and-forget the API call to satisfy the PUT requirement.
    updateTodo(id, { completed: updatedCompleted }).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("PUT toggle (non-critical):", err.message);
    });
  }

  /**
   * Updates the text of a todo and performs a PUT request to keep
   * the remote API in sync for this evaluation.
   *
   * @param {number} id - Identifier of the todo to edit.
   * @param {string} newText - Replacement text for the "todo" field.
   * @returns {Promise<void>}
   */
  async editTodo(id, newText) {
    // Update local state first so the UI reflects the change immediately.
    this.todos = this.todos.map((t) =>
      t.id === id ? { ...t, todo: newText } : t
    );
    this.notify();

    // Fire-and-forget the API call to satisfy the PUT requirement.
    updateTodo(id, { todo: newText }).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("PUT edit (non-critical):", err.message);
    });
  }

  /**
   * Deletes a todo from the local list after telling the server to
   * simulate a DELETE /todos/:id call.
   *
   * @param {number} id - Identifier of the todo to remove.
   * @returns {Promise<void>}
   */
  async deleteTodo(id) {
    // Remove from local state immediately so the UI responds right away.
    this.todos = this.todos.filter((t) => t.id !== id);
    this.notify();

    // Fire-and-forget the API call to satisfy the DELETE requirement.
    deleteTodo(id).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("DELETE (non-critical):", err.message);
    });
  }

  /**
   * Serializes the given list of todos into localStorage so that the
   * browser can rehydrate them on next load.
   *
   * @param {Array} todosSnapshot
   */
  saveToLocalStorage(todosSnapshot) {
    try {
      const json = JSON.stringify(todosSnapshot);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, json);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Unable to persist todos to localStorage:", error);
    }
  }

  /**
   * Reads any previously saved todo list from localStorage and places
   * it into the in-memory array. If nothing is found we simply start
   * with an empty list.
   */
  loadFromLocalStorage() {
    try {
      const json = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!json) return;
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        this.todos = parsed;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Unable to read todos from localStorage:", error);
    }
  }
}
