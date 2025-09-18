import {
  Client,
  Account,
  Storage,
  Databases,
  Query,
  Functions,
} from "appwrite";

const client = new Client();
const account = new Account(client);
const storage = new Storage(client);
const databases = new Databases(client);

client
  .setEndpoint("https://cloud.appwrite.io/v1") // Replace with your Appwrite server endpoint
  .setProject("67bc93bc0004228cf938"); // Replace with your project ID

export { client, account, storage, databases, Query, Functions };
