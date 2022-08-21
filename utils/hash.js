const bcrypt = require("bcrypt");

async function compare(password) {
  const result = await bcrypt.compare(
    password,
    "$2b$10$j.g3XgjIECNEW/.IEvmndO44AgYKXOe7ffdvw0SwX/tGUg7KXzixO"
  );
  console.log(result);
}
