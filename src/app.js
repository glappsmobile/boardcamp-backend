import express from 'express';
import connection from './database/database.js';

const app = express();
app.use(express.json());

app.get('/teste', async (req, res) => {

  try {
    const products = await connection.query(
      `SELECT * FROM categories;`
    );

    res.send(products.rows);
  } catch (err) {
    console.error(err);
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