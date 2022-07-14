const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
let hasPriorityAndStatus = (requestedQuery) => {
  return (
    requestedQuery.status !== undefined && requestedQuery.priority !== undefined
  );
};

let hasOnlypriority = (requestedQuery) => {
  return requestedQuery.priority !== undefined;
};
let hasOnlyStatus = (requestedQuery) => {
  return requestedQuery.status !== undefined;
};
app.get("/todos/:todoId/", async (request, response) => {
  let getTodoQuery = "";
  let { search_q = "", priority, status } = request.query;
  let data = null;
  let { todoId } = request.params;

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodoQuery = `
            SELECT
            *
            FROM  todo
            WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND priority ='${priority}';
            
            `;
      break;

    case hasOnlyStatus(request.query):
      getTodoQuery = `
            SELECT
            *
            FROM todo
            WHERE todo LIKE '%${search_q}%'  AND  status ='${status}'
            
            `;
      break;

    case hasOnlypriority(request.query):
      getTodoQuery = `SELECT
            *
            FROM todo 
            WHERE todo LIKE '%${search_q}%' AND priority = '${priority}' AND id=2
            
            `;
      break;

    default:
      getTodoQuery = `SELECT
            *
            FROM todo 
            WHERE todo LIKE '%${search_q}%' `;
      console.log(hasOnlyStatus(request.query));
      break;
  }
  data = await database.all(getTodoQuery);
  response.send(data);
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let a = request.body;
  let updated = "";
  switch (true) {
    case a.todo !== undefined:
      updated = "Todo";
      break;
    case a.priority !== undefined:
      updated = "Priority";
      break;

    default:
      updated = "Status";
      break;
  }

  let previewsQuery = `
    SELECT
    *
    FROM todo
    WHERE id=${todoId}
    `;
  let getPreviews = await database.get(previewsQuery);
  let {
    todo = getPreviews.todo,
    priority = getPreviews.priority,
    status = getPreviews.status,
  } = request.body;

  const b = `
    UPDATE todo 
    SET 
    todo='${todo}',
    priority='${priority}',
    status='${status}'
    WHERE id=${todoId}
    `;
  const result = await database.run(b);
  response.send(`${updateColumn} Updated`);
});
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

module.exports = app;
