import "dotenv/config";
import app from './app.js';
import { AppDataSource } from "./libs/config/database.js";

const port = process.env.PORT || process.env.port || 3000;

AppDataSource.initialize()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`app is running on port ${port}`);
      console.log("database connected successfully");
    });
  })
  .catch((error) => {
    console.error("database connection failed", error);
    process.exit(1);
  });
