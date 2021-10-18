import express from 'express';
import connection from './database/database.js';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

app.get('/categories', async (req, res) => {
  try {
    const categories = await connection.query('SELECT * FROM categories;');

    res.status(200).send(categories.rows);
  } catch {
    res.sendStatus(500);
  }
});


app.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    console.log(req);
    if (!name) {
      res.sendStatus(400);
      return;
    }

    const categories = await connection.query(
      "SELECT * FROM categories WHERE name = $1", [name]
    );

    if (categories.rows[0]) {
      res.sendStatus(409);
    } else {
      await connection.query(
        "INSERT INTO categories (name) VALUES ($1)",
        [name]
      );
      res.sendStatus(201);
    }

  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(4000, () => {
  console.log('Server is listening on port 4000.');
});









/* 
app.get('/products', async (req, res) => {
  try {
    // buscando todos os produtos
    const products = await connection.query(
      `SELECT products.*, categories.name AS categoryName FROM products JOIN categories ON products."categoryId" = categories.id`
    );

    res.send(products.rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});
*/