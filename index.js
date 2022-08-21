const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const PORT = process.env.PORT || 5000;
const TOKEN_SECRET = process.env.TOKEN_SECRET;

const { connectDatabase, closeConnection } = require("./utils/database");
const ResponseError = require("./utils/ResponseError");
const { validProductData, wrapper } = require("./utils/validate");
const { verifyToken } = require("./middleware/auth");

const app = express();

// enable cors
app.use(cors());

// for use json data
app.use(express.json());

// for use form
app.use(express.urlencoded({ extended: true }));

app.post(
  "/api/auth",
  wrapper(async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ResponseError(400, "Bad request.");
    }

    const conn = await connectDatabase();
    let result = await conn.query(
      { sql: "SELECT * FROM user WHERE username = ?" },
      [username]
    );

    if (result.length < 1) {
      throw new ResponseError(404, "Invalid username or password.");
    } else {
      const firstUser = result[0];
      const isSame = await bcrypt.compare(password, firstUser.password);
      delete firstUser?.password;
      if (isSame) {
        const token = jwt.sign(
          {
            user_id: firstUser.id,
            user_nick_name: firstUser.nick_name,
          },
          TOKEN_SECRET,
          { expiresIn: "2h" }
        );

        result = await conn.query(
          { sql: "UPDATE user SET token = ? WHERE id = ?" },
          [token, firstUser.id]
        );
        if (result.affectedRows !== 1) {
          throw new ResponseError(500, "Something wrong on server side!");
        }

        res.json({ ...firstUser, token });
      }
    }

    // close database connection
    closeConnection(conn);
  })
);

// route for get all products
app.get("/api/products", verifyToken, async (req, res) => {
  // send data to client
  const conn = await connectDatabase();
  const result = await conn.query({ sql: "SELECT * FROM product_detail_view" });
  res.json(result);

  // close database connection
  closeConnection(conn);
});

// route for create a new product
app.post(
  "/api/products",
  verifyToken,
  wrapper(async (req, res) => {
    // TODO: validate token

    // get data from req
    const { code_name, brand_id, category_id, price, quantity } = req.body;
    if (!validProductData(code_name, brand_id, category_id, price, quantity)) {
      throw new ResponseError(400, "Bad request data.");
    }
    // check codeName in database
    let conn = await connectDatabase();
    let result = await conn.query(
      { sql: "SELECT code_name FROM product WHERE code_name = ?" },
      [code_name]
    );

    if (result.length > 0) {
      closeConnection(conn);
      throw new ResponseError(400, "Product code name is already exists.");
    }

    // send data to database
    conn = await connectDatabase();
    result = await conn.query(
      {
        sql: "INSERT INTO product (code_name, brand_id, category_id, price, quantity) VALUES (?, ?, ?, ?, ?)",
        insertIdAsNumber: true,
      },
      [code_name, +brand_id, +category_id, +price, +quantity]
    );
    console.log(result);
    res.json(result);

    // close database connection
    closeConnection(conn);
  })
);

// route for update a product
app.put(
  "/api/products",
  verifyToken,
  wrapper(async (req, res) => {
    // TODO: validate token

    // get product data from req
    const { id, code_name, price, quantity, brand_id, category_id } = req.body;

    // validate product data
    if (
      !id ||
      !validProductData(code_name, brand_id, category_id, price, quantity, id)
    ) {
      throw new ResponseError(0, "Bad request data.");
    }

    // check brand and category
    const conn = await connectDatabase();
    const brandResult = await conn.query(
      { sql: "SELECT id from brand WHERE id = ?" },
      [brand_id]
    );
    const categoryResult = await conn.query(
      { sql: "SELECT id from category WHERE id = ?" },
      [category_id]
    );

    if (brandResult.length < 1 || categoryResult.length < 1) {
      throw new ResponseError(0, "Bad request data.");
    }

    // save product data to database
    const result = await conn.query(
      {
        sql: "UPDATE product SET code_name = ?, price = ?, quantity = ?, brand_id = ?, category_id = ? WHERE id = ?",
      },
      [code_name, price, quantity, brand_id, category_id, id]
    );

    // close database connection
    closeConnection(conn);

    console.log(result);

    // if update not success
    if (result.affectedRows !== 1) {
      throw new ResponseError(0, "Update not success.");
    }

    // send response back to client
    res.json({ message: "update success." });
  })
);

app.delete(
  "/api/products",
  verifyToken,
  wrapper(async (req, res) => {
    const { id } = req.body;
    if (!id) {
      throw new ResponseError(400, "Bad request data");
    }
    const conn = await connectDatabase();
    const result = await conn.query(
      { sql: "DELETE FROM product WHERE id = ?" },
      [id]
    );
    console.log(result);
    if (!result.affectedRows === 1) {
      throw new ResponseError(404, "Product id:", id + " not found.");
    }
    res.json({ message: "Delete success." });
  })
);

// route for get all categories
app.get(
  "/api/categories",
  verifyToken,
  wrapper(async (req, res, next) => {
    // TODO: validate token

    // send data to client
    const conn = await connectDatabase();
    const result = await conn.query({ sql: "SELECT * FROM category" });
    res.json(result);

    // close database connection
    closeConnection(conn);
  })
);

// route for get all brands
app.get(
  "/api/brands",
  verifyToken,
  wrapper(async (req, res, next) => {
    // TODO: validate token

    // send data to client
    const conn = await connectDatabase();
    const result = await conn.query({ sql: "SELECT * FROM brand" });
    res.json(result);

    // close database connection
    closeConnection(conn);
  })
);

// route to handle error
app.use((error, req, res, next) => {
  console.log(error);
  res
    .status(error.status)
    .json({ status: error.status, message: error.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
