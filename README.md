# galley-calls

<p align="center">
  <h1 align="center">☎️Galley Calls☎️</h1>
</p>

<p align="center">
   <img src="https://img.shields.io/badge/language-JavaScript-yellow"/>
   <img src="https://img.shields.io/github/license/ajmeese7/galley-calls"/>
   <img src="https://img.shields.io/github/stars/ajmeese7/galley-calls"/>
   <img src="https://img.shields.io/github/forks/ajmeese7/galley-calls"/>
   <img src="https://img.shields.io/static/v1?label=%F0%9F%8C%9F&message=If%20Useful&style=style=flat&color=BC4E99" alt="Star Badge"/>
</p>

<p align="center">Call the galley menu line and send the recording in Discord.</p>
<p align="center">
<img alt="Discord message example" title="Discord message example" src="https://user-images.githubusercontent.com/17814535/91178907-6f572680-e6ab-11ea-9d56-3ca7e98ec928.png" />
</p>

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
filling in your server's information where appropriate.

### Wishlist
- It would be ideal if the audio file was transcribed and sent as text,
instead of as a `.wav` file like the current implementation.
- Figure out the job of scheduling, and how I want to handle it.
- Look into using an embed with the files, so I can have a hyperlink asking
for any generous donations and stars for the repository.
    - Try to combine the [embed](https://stackoverflow.com/questions/45622168/sending-attachments-in-embed-field)
    and the [hyperlink](https://stackoverflow.com/questions/54753005/is-there-any-way-to-embed-a-hyperlink-in-a-richembed).