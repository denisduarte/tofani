const express = require("express");
const cors = require('cors');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

var env = dotenv.config();
dotenvExpand(env);

var routes = null;

if (process.env.DB === "mongodb") {

  const mongoose = require("mongoose");
  routes = require("./src/mongodb/routes");

  mongoose.connect(process.env.DB_URL, { useNewUrlParser: true,
                                         useUnifiedTopology: true,
                                         useCreateIndex: true
                                       })
           /*.then(() => {
             console.log(routes);
                const app = express();
                var corsOptions = {
                      origin: '*',
                      optionsSuccessStatus: 200
                };
                app.use(cors(corsOptions));
                app.use(express.json());
                app.use("/api", routes);
                app.listen(process.env.APP_PORT, () => {
                  console.log("The backend app is listening at port", process.env.APP_PORT)
                });
            });*/
} else if (process.env.DB === "mariadb") {
    routes = require("./src/mariadb/routes");

} else {
    console.log("Unsuported database. Try 'mongodb' or 'mariadb'");
}

const app = express();


var corsOptions = {
      origin: process.env.CORS_DOMAIN,
      optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use("/api", routes);
app.listen(process.env.PORT, () => {
  console.log("The backend app is listening at port", process.env.PORT)
});
