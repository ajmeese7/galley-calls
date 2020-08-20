# galley-calls
Call the galley menu line and send the transcribed menu in Discord.

## Developing
You can replicate the PostgreSQL table structure by running the following query
on your local Postgres server:

```sql
CREATE TABLE menus (
    id SERIAL PRIMARY KEY,
    menu text,
    date TIMESTAMP default CURRENT_TIMESTAMP
);
```

To start up the Express server, run `npm run start`. This will start it with
Nodemon, so the server will automatically restart whenever you make changes to
important files. You can view it at `localhost:5000`.