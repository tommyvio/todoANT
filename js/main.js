/**
 * File overview:
 * This module is the single entry point for the Todo List application.
 * It imports the Model, View, and Controller classes and creates one
 * instance of each so that the MVC graph is fully wired when the page
 * finishes loading.
 */

import { TodoModel } from "./models/TodoModel.js";
import { TodoView } from "./views/TodoView.js";
import { TodoController } from "./controllers/TodoController.js";

// Wait until the DOM structure described in index.html is available.
window.addEventListener("DOMContentLoaded", () => {
  /**
   * Model instance:
   * The model owns the in-memory collection of todos and is also
   * responsible for talking to the remote dummyjson.com API as well
   * as localStorage (for the bonus persistence requirement).
   */
  const model = new TodoModel();

  /**
   * View instance:
   * The view knows how to locate key DOM nodes, render pending and
   * completed lists, and raise high-level events (such as "user wants
   * to add a todo") which the controller will subscribe to.
   */
  const view = new TodoView();

  /**
   * Controller instance:
   * The controller sits between the view and the model. It subscribes
   * to user interactions that the view exposes and then calls model
   * methods to update data, after which it asks the view to re-render.
   * Simply creating this object is enough to start the app.
   */
  // eslint-disable-next-line no-new
  new TodoController(model, view);
});
