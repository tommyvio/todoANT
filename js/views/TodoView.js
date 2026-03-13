/**
 * File overview:
 * The TodoView class is responsible for interacting with the DOM.
 * It:
 *   - Locates static elements declared in index.html (input, lists, etc.).
 *   - Renders given todos into the "Pending" and "Completed" columns.
 *   - Exposes high-level callbacks that the controller can subscribe
 *     to for user actions such as add, edit, delete, and toggle.
 *   - Uses event delegation on the list containers so that we attach
 *     only one listener per list instead of one per button.
 */

export class TodoView {
  constructor() {
    // Cache static DOM elements that never change.
    this.input = document.getElementById("new-todo-input");
    this.addButton = document.getElementById("add-todo-button");
    this.feedback = document.getElementById("feedback-message");
    this.pendingList = document.getElementById("pending-list");
    this.completedList = document.getElementById("completed-list");

    /**
     * These callback references are set by the controller using the
     * bindX methods defined below. Until then they are no-ops so that
     * accidental clicks do not throw errors.
     */
    this.handleAdd = () => {};
    this.handleToggle = () => {};
    this.handleDelete = () => {};
    this.handleEdit = () => {};

    this.attachStaticListeners();
  }

  /**
   * Attaches DOM event listeners that exist for the lifetime of the
   * page, including:
   *   - Adding a todo via button click or pressing Enter.
   *   - Delegated clicks within each list container.
   */
  attachStaticListeners() {
    this.addButton.addEventListener("click", () => {
      const value = this.input.value.trim();
      if (!value) return;
      this.handleAdd(value);
    });

    this.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const value = this.input.value.trim();
        if (!value) return;
        this.handleAdd(value);
      }
    });

    // Event delegation on the pending list.
    this.pendingList.addEventListener("click", (event) => {
      const { action, id } = this.extractActionFromEvent(event);
      if (!action || id == null) return;
      this.routeAction(action, id);
    });

    // Event delegation on the completed list.
    this.completedList.addEventListener("click", (event) => {
      const { action, id } = this.extractActionFromEvent(event);
      if (!action || id == null) return;
      this.routeAction(action, id);
    });
  }

  /**
   * Allows the controller to supply a function that will be called
   * whenever the user attempts to add a new todo.
   *
   * @param {(text:string) => void} handler
   */
  bindAddTodo(handler) {
    this.handleAdd = handler;
  }

  /**
   * Allows the controller to subscribe to completion toggles.
   *
   * @param {(id:number) => void} handler
   */
  bindToggleTodo(handler) {
    this.handleToggle = handler;
  }

  /**
   * Allows the controller to subscribe to delete events.
   *
   * @param {(id:number) => void} handler
   */
  bindDeleteTodo(handler) {
    this.handleDelete = handler;
  }

  /**
   * Allows the controller to subscribe to edit-save events.
   *
   * @param {(id:number,newText:string) => void} handler
   */
  bindEditTodo(handler) {
    this.handleEdit = handler;
  }

  /**
   * Renders the entire list of todos into the pending and completed
   * containers, completely replacing existing DOM nodes.
   *
   * @param {Array<{id:number,todo:string,completed:boolean,userId:number}>} todos
   */
  renderTodos(todos) {
    this.pendingList.innerHTML = "";
    this.completedList.innerHTML = "";

    if (!todos.length) {
      this.pendingList.innerHTML =
        '<li class="text-muted">No tasks yet. Add your first one above.</li>';
      return;
    }

    todos.forEach((todo) => {
      const listElement = this.createTodoListItem(todo);
      if (todo.completed) {
        this.completedList.appendChild(listElement);
      } else {
        this.pendingList.appendChild(listElement);
      }
    });
  }

  /**
   * Creates a single <li> element that visually represents a todo.
   * The arrow buttons (→ and ←) satisfy the requirement that clicking
   * an arrow moves an item between lists.
   *
   * @param {{id:number,todo:string,completed:boolean}} todo
   * @returns {HTMLLIElement}
   */
  createTodoListItem(todo) {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.id = String(todo.id);

    const textSpan = document.createElement("span");
    textSpan.className = "todo-text";
    if (todo.completed) {
      textSpan.classList.add("todo-text--completed");
    }
    textSpan.textContent = todo.todo;

    const actions = document.createElement("div");
    actions.className = "todo-actions";

    const arrowButton = document.createElement("button");
    arrowButton.className = `btn btn-icon ${
      todo.completed ? "arrow-pending" : "arrow-complete"
    }`;
    arrowButton.dataset.action = "toggle";
    arrowButton.innerText = todo.completed ? "←" : "→";
    arrowButton.title = todo.completed
      ? "Move back to pending"
      : "Mark as completed";

    const editButton = document.createElement("button");
    editButton.className = "btn btn-secondary btn-icon";
    editButton.dataset.action = "edit";
    editButton.innerText = "✎";
    editButton.title = "Edit this task";

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger btn-icon";
    deleteButton.dataset.action = "delete";
    deleteButton.innerText = "🗑";
    deleteButton.title = "Delete this task";

    actions.appendChild(arrowButton);
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    li.appendChild(textSpan);
    li.appendChild(actions);

    return li;
  }

  /**
   * Converts a DOM click event inside a list into a higher-level
   * action description that the controller can process.
   *
   * @param {MouseEvent} event
   * @returns {{action:string|null,id:number|null}}
   */
  extractActionFromEvent(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return { action: null, id: null };
    }

    const button = target.closest("button[data-action]");
    if (!button) return { action: null, id: null };

    const listItem = button.closest(".todo-item");
    if (!listItem) return { action: null, id: null };

    const id = Number(listItem.dataset.id);
    const action = button.dataset.action ?? null;

    return { action, id: Number.isNaN(id) ? null : id };
  }

  /**
   * Maps a high-level action identifier to the appropriate bound
   * handler. Editing uses a small inline form inside the list item.
   *
   * @param {string} action
   * @param {number} id
   */
  routeAction(action, id) {
    if (action === "toggle") {
      this.handleToggle(id);
      return;
    }

    if (action === "delete") {
      this.handleDelete(id);
      return;
    }

    if (action === "edit") {
      this.enterEditMode(id);
    }
  }

  /**
   * Switches the visual representation of a todo into "edit mode" by
   * temporarily replacing the text label with an input and Save/Cancel
   * controls. Once the user saves, the external edit handler is called.
   *
   * @param {number} id
   */
  enterEditMode(id) {
    const listItem = this.findListItemById(id);
    if (!listItem) return;

    const textSpan = listItem.querySelector(".todo-text");
    const actions = listItem.querySelector(".todo-actions");
    if (!textSpan || !actions) return;

    const currentText = textSpan.textContent ?? "";

    const input = document.createElement("input");
    input.className = "todo-edit-input";
    input.value = currentText;

    const saveButton = document.createElement("button");
    saveButton.className = "btn btn-primary btn-icon";
    saveButton.innerText = "💾";
    saveButton.title = "Save changes";

    const cancelButton = document.createElement("button");
    cancelButton.className = "btn btn-secondary btn-icon";
    cancelButton.innerText = "✖";
    cancelButton.title = "Cancel editing";

    // Clear existing content and insert the editing controls.
    textSpan.replaceWith(input);
    actions.replaceChildren(saveButton, cancelButton);

    // Save handler uses the bound edit callback.
    const commitEdit = () => {
      const newText = input.value.trim();
      if (!newText || newText === currentText) {
        this.exitEditMode(id, currentText, listItem);
        return;
      }
      this.handleEdit(id, newText);
    };

    saveButton.addEventListener("click", commitEdit);
    cancelButton.addEventListener("click", () => {
      this.exitEditMode(id, currentText, listItem);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        commitEdit();
      }
      if (event.key === "Escape") {
        this.exitEditMode(id, currentText, listItem);
      }
    });

    input.focus();
    input.select();
  }

  /**
   * Restores the normal view mode representation for a todo item
   * after the user either saves or cancels editing.
   *
   * @param {number} id
   * @param {string} text
   * @param {HTMLLIElement} listItem
   */
  exitEditMode(id, text, listItem) {
    const newTodo = {
      id,
      todo: text,
      completed: listItem
        .closest("#completed-list") !== null,
    };
    const replacement = this.createTodoListItem(newTodo);
    listItem.replaceWith(replacement);
  }

  /**
   * Utility that finds a list item in either column by id.
   *
   * @param {number} id
   * @returns {HTMLLIElement | null}
   */
  findListItemById(id) {
    return (
      this.pendingList.querySelector(`.todo-item[data-id="${id}"]`) ||
      this.completedList.querySelector(`.todo-item[data-id="${id}"]`)
    );
  }

  /**
   * Shows a short status message near the input box. The controller
   * can choose whether the message should be styled as success or
   * error by toggling a CSS class.
   *
   * @param {string} message
   * @param {"success"|"error"} type
   */
  showMessage(message, type = "error") {
    this.feedback.textContent = message;
    this.feedback.classList.toggle(
      "feedback-message--success",
      type === "success"
    );
  }

  /**
   * Clears the text box after a successful add operation so the user
   * can immediately type the next task.
   */
  clearInput() {
    this.input.value = "";
  }
}
