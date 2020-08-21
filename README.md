# galley-calls
Call the galley menu line and send the transcribed menu in Discord.

## Developing
You can replicate the PostgreSQL table structure by running the following query
on your local Postgres server:

```sql
CREATE TABLE menus (
    id SERIAL PRIMARY KEY,
    menu_recording text,
    date TIMESTAMP default CURRENT_TIMESTAMP
);
```

To start up the Express server, run `npm run devstart`. This will start it with
Nodemon, so the server will automatically restart whenever you make changes to
important files. You can view it at `localhost:5000`.

To start a local Postgres server, run `psql postgresql://[user[:password]@][netloc][:port][/dbname]`,
filling in your server's information where appropriate. If you want to 

### Wishlist
- It would be ideal if the audio file was transcribed and sent as text,
instead of as a `.wav` file like the current implementation.