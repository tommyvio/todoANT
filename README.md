# Todo List (MVC)

A Todo List app built with **Vanilla JavaScript, HTML, and CSS** following the **Model–View–Controller (MVC)** pattern, integrated with the [dummyjson.com](https://dummyjson.com) Todos API.

## Requirements coverage

| Requirement | How it is met |
|---|---|
| MVC pattern | `TodoModel`, `TodoView`, `TodoController` — no frameworks used |
| Two lists | Pending and Completed columns; arrow buttons move tasks between them |
| Add | Type in the input and press **Enter** or click **Submit** |
| Delete | Trash button on each task |
| Mark as pending / complete | Arrow button (→ / ←) on each task |
| Edit | Pencil button opens inline edit; save with 💾 or **Enter**, cancel with ✖ or **Escape** |
| Event delegation | One click listener per list container, not one per button |
| 5 HTTP requests | `GET /todos`, `POST /todos/add`, `PUT /todos/:id` (edit text), `PUT /todos/:id` (toggle), `DELETE /todos/:id` |
| Bonus – localStorage | All changes are persisted; deleted items are remembered so they never reappear after reload |
| Duplicate ID handling | DummyJSON always returns the same fake ID when creating todos. If the API returns an ID that already exists in the local list, the model detects the collision and assigns a unique local ID instead |

## File structure

```
index.html                        ← HTML skeleton and list containers
css/styles.css                    ← Layout and button styles
js/main.js                        ← Entry point — wires Model, View, Controller
js/services/apiClient.js          ← Fetch wrappers for all 5 API endpoints
js/models/TodoModel.js            ← In-memory state, API calls, localStorage
js/views/TodoView.js              ← DOM rendering and event delegation
js/controllers/TodoController.js  ← Connects view events to model actions
```
