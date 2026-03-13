/**
 * File overview:
 * This module contains a very small wrapper around the dummyjson.com
 * Todos HTTP API. The goal is to centralize all network requests here
 * so the rest of the application (model, controller, view) does not
 * need to know URL strings or HTTP methods directly.
 *
 * Each exported function returns a Promise that resolves to plain
 * JavaScript objects shaped like the API's todo representation:
 * { id, todo, completed, userId }.
 */

const BASE_URL = "https://dummyjson.com";

/**
 * Helper used by all request functions to build full URLs.
 * @param {string} path - Path segment that is appended to the base URL.
 * @returns {string} complete URL string
 */
function buildUrl(path) {
  return `${BASE_URL}${path}`;
}

/**
 * Helper that performs a fetch call and throws a descriptive error
 * if the HTTP response is not in the 200–299 range.
 *
 * @param {string} url - Full endpoint URL.
 * @param {RequestInit} options - Configuration such as method and body.
 * @returns {Promise<any>} parsed JSON body on success.
 */
async function performJsonRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `API request failed with status ${response.status}: ${text}`
    );
  }

  return response.json();
}

/**
 * Fetches a list of todos from the dummyjson API.
 * The assignment only requires that we demonstrate the HTTP call, so
 * we keep the interface simple and let the model decide how many
 * todos to use.
 *
 * @returns {Promise<Array<{id:number,todo:string,completed:boolean,userId:number}>>}
 */
export async function fetchTodos() {
  const data = await performJsonRequest(buildUrl("/todos?limit=10"), {
    method: "GET",
  });
  // The API responds with an object shaped like { todos: [...] }.
  return data.todos ?? [];
}

/**
 * Creates a new todo using POST /todos/add.
 * Even though the remote service does not persist data, we still send
 * the request so that all CRUD operations are exercised.
 *
 * ⚠️ Known dummyjson limitation: this endpoint always returns the same
 * fake id (251) regardless of how many todos you create. The model's
 * addTodo method handles this by replacing the id with a unique local
 * one when a collision is detected.
 *
 * @param {string} todoText - Human-readable description of the todo item.
 * @returns {Promise<{id:number,todo:string,completed:boolean,userId:number}>}
 */
export async function createTodo(todoText) {
  const body = JSON.stringify({
    todo: todoText,
    completed: false,
    userId: 1,
  });

  const created = await performJsonRequest(buildUrl("/todos/add"), {
    method: "POST",
    body,
  });

  return created;
}

/**
 * Updates an existing todo using PUT /todos/:id.
 * The assignment mentions PUT for updates, so this helper uses PUT
 * while still allowing the caller to send only the fields it needs.
 *
 * @param {number} id - Identifier of the todo that should be updated.
 * @param {Partial<{todo:string,completed:boolean}>} updatedFields - Fields to change.
 * @returns {Promise<{id:number,todo:string,completed:boolean,userId:number}>}
 */
export async function updateTodo(id, updatedFields) {
  const body = JSON.stringify(updatedFields);

  const updated = await performJsonRequest(buildUrl(`/todos/${id}`), {
    method: "PUT",
    body,
  });

  return updated;
}

/**
 * Deletes an existing todo using DELETE /todos/:id.
 * The remote API responds with a minimal payload acknowledging the
 * simulated deletion.
 *
 * @param {number} id - Identifier of the todo that should be removed.
 * @returns {Promise<void>} resolves when the delete request completes.
 */
export async function deleteTodo(id) {
  await performJsonRequest(buildUrl(`/todos/${id}`), {
    method: "DELETE",
  });
}
