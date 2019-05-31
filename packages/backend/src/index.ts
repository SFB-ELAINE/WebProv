
// import make from './app';

// // MAKE actual APP //
// const app = make();

// // CONFIG //
// const port = process.env.PORT || 3000;

// app.listen(port, () => {
//   // tslint:disable-next-line:no-console
//   console.info(`BACKEND running on http://max:${port}!`);
// });

import { GraphQLServer } from "graphql-yoga";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import ProjectResolver from "./resolvers/project";
import TaskResolver from "./resolvers/task";

async function bootstrap() {
  console.log('schemasdfsdfsdfsdf sdf');

  const schema = await buildSchema({
    resolvers: [ProjectResolver, TaskResolver],
    emitSchemaFile: true,
  });

  console.log(schema);

  const server = new GraphQLServer({
    schema,
  });

  server.start(() => console.log("Server is running on http://max:4000"));
}

bootstrap();