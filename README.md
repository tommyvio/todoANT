# Todo List (MVC)

This repository implements a Todo List app using **Vanilla JavaScript, HTML, and CSS** with a clear **Model–View–Controller (MVC)** structure and the **dummyjson.com** Todos API.

## How the app maps to the requirements

- **MVC pattern**: Code is split into `TodoModel`, `TodoView`, and `TodoController` classes under the `js/` directory, plus a small `apiClient` service and `main.js` bootstrap file.
- **Display two lists**: Pending and Completed tasks are shown in separate columns. Each task can be moved between them using **arrow buttons** (→ mark done / ← move back).
- **Core features**:
  - Add new tasks from the input at the top.
  - Delete tasks using the trash button.
  - Mark tasks as pending/completed via arrow buttons.
  - Edit an existing task using the pencil icon, then save or cancel.
- **HTTP API usage** (dummyjson Todos):
  - `GET /todos` – initial load of sample tasks.
  - `POST /todos/add` – adding a new todo.
  - `PATCH /todos/:id` – updating either `todo` text or `completed` flag.
  - `DELETE /todos/:id` – deleting a todo.
  - All todos keep the original **`completed`** property name from the API.
- **Bonus**:
  - Todos are mirrored into `localStorage`, so tasks remain after a refresh.

## File structure

- `index.html` – HTML skeleton, input section, and the two list containers.
- `css/styles.css` – Layout and styling for the header, input area, lists, and buttons.
- `js/main.js` – Entry point that instantiates the model, view, and controller.
- `js/services/apiClient.js` – Thin wrapper around the dummyjson Todos endpoints.
- `js/models/TodoModel.js` – Holds todo data, calls the API, and syncs with `localStorage`.
- `js/views/TodoView.js` – Renders the lists and raises high-level UI events.
- `js/controllers/TodoController.js` – Connects the view and model, validates input, and shows feedback messages.

 
