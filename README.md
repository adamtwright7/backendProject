# Tasha's Trinkets

For more information on this project, check out its [Medium article.](https://medium.com/@adamtwright7/tashas-trinkets-34fb7a04b056)

## Get it running.

To get this project up and running on your own machine, you'll need any application that allows you to start and view a server (such as Nodemon) and npm. Next, fork the project's GitHub repo and clone a copy onto your local files. Once inside the project's directory, you'll need to run the following command in your terminal:

`npm i`

This will download all dependencies. Next, you'll need to set up a database and configure your connection to that database. In the file sequelize/config/config.json, you'll need to paste something of the form:

```
{
  "production": {
    "username": "root",
    "password": null,
    "database": "database_production",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

We used ElephantSQL as our online database using the dialect postgres. The values for the keys username, password, database, and host will vary based on which service you use, but for ElephantSQL, you can find these details in the 'Details' section as 'User & Default database', 'Password', 'User & Default database', and 'Server', respectively. 

Next, you'll need to migrate the database's tables. This will set up the necessary tables in your database with the information in this project's 'models' file. Navigate your terminal into the 'sequelize' file, then run this command:

`npx sequelize db:migrate`

Now that your database is populated, you're ready to start the server and view the live site! Simply type 'nodemon' in your terminal at the root of the project and open 'http://localhost:3010/' in the browser of your choice.