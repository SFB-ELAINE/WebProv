import dotenv from 'dotenv';
import neo4j from 'neo4j-driver';

dotenv.config();

const uri = process.env.DB_URI;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

if (!uri) {
  throw Error('DB_URI is required.');
}

if (!user) {
  throw Error('DB_USER is required.');
}

if (!password) {
  throw Error('DB_PASSWORD is required.');
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();

const personName = 'Alice';
const resultPromise = session.run(
  'CREATE (a:Person {name: $name}) RETURN a',
  {name: personName},
);

resultPromise.then((result) => {
  session.close();

  const singleRecord = result.records[0];
  const node = singleRecord.get(0);

  console.log(node.properties.name);

  // on application exit:
  driver.close();
});
