require("dotenv").config();

const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DATABASE_ID;

async function main() {
  if (!databaseId) {
    throw new Error("NOTION_DATABASE_ID não configurado.");
  }

  const response = await notion.databases.retrieve({
    database_id: databaseId,
  });

  console.log(JSON.stringify(response, null, 2));
}

main().catch((error) => {
  console.error(error.body ?? error);
  process.exit(1);
});