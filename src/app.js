import express from 'express';
import connection from './database/database.js';
import cors from 'cors';
import Joi from "joi";
import dayjs from "dayjs";

const app = express();
app.use(express.json());
app.use(cors());

app.get('/categories', async (req, res) => {
  try {
    const categories = await connection.query(`
    SELECT 
      * 
    FROM 
      categories;`
    );

    res.status(200).send(categories.rows);
  } catch {
    res.sendStatus(500);
  }
});


app.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.sendStatus(400);
      
    }

    const categories = await connection.query(
      `SELECT * FROM categories WHERE name = $1`, [name]
    );

    if (categories.rows[0]) {
      res.sendStatus(409);
    } else {
      await connection.query(
        `INSERT INTO categories (name) VALUES ($1)`, [name]
      );
      res.sendStatus(201);
    }

  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/games', async (req, res) => {
  try {
    const { name } = req.query;

    let query;
    console.log(name);

    if (name) {
      query = await connection.query(
        `SELECT 
          games.*, 
          categories.name AS "categoryName"
        FROM games  
          JOIN categories
            ON games."categoryId" = categories.id
        WHERE games.name ILIKE $1;`, ['%' + name + '%']);
    } else {
      query = await connection.query(
        `SELECT 
          games.*, 
          categories.name AS "categoryName"
        FROM games  
          JOIN categories
            ON games."categoryId" = categories.id;`
      );
    }

    if (query.rowCount === 0) {
      return res.send("Nenhum jogo encontrado.");
    }

    res.status(200).send(query.rows);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});


app.post("/games", async (req, res) => {
  try {
    const { name, image, stockTotal, categoryId, pricePerDay } = req.body;

     const schema = Joi.object({
       name: Joi.string().required(),
       image: Joi.string().uri().required(),
       stockTotal: Joi.number().integer().min(1).required(),
       categoryId: Joi.number().integer().min(1).required(),
       pricePerDay: Joi.number().integer().min(1).required()
    });

    if (schema.validate({...req.body}).error) {
      return res.sendStatus(400);
    }

    const category = await connection.query('SELECT * FROM categories WHERE id = $1;', [categoryId]);

    if (!category.rows[0]) {
      return res.status(400).send('Categoria não existe');
    }

    const game = await connection.query('SELECT * FROM games WHERE name = $1', [name.trim()]);

    if (game.rows[0]) {
      return res.sendStatus(409);
    }

    await connection.query(`
      INSERT INTO 
      games (name, image, "stockTotal", "categoryId", "pricePerDay") 
      VALUES 
      ($1,$2,$3,$4,$5);`,
      [name.trim(), image, stockTotal, categoryId, pricePerDay]);

    res.sendStatus(201);

  } catch (error) {
    res.sendStatus(500);
  }
});

app.get('/customers', async (req, res) => {
  try {
    const { cpf } = req.query;
    let result;

    if (cpf) {
      result = await connection.query(
        `SELECT * FROM customers WHERE cpf ILIKE $1`, [cpf + '%']);
    } else {
      result = await connection.query("SELECT * FROM customers;");
    }

    if (result.rowCount === 0) {
      return res.send("Nenhum cliente encontrado.");
    }

    res.status(200).send(result.rows);

  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/customers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await connection.query(`SELECT * FROM customers WHERE id = $1`, [id]);

    if (result.rowCount > 0) {
      res.send(result.rows[0]);
    } else {
      res.sendStatus(404);
    }

  } catch (error) {
    res.sendStatus(500);
  }
});

app.post('/customers', async (req, res) => {
  try {
    const { name, phone, cpf, birthday } = req.body;

    const schema = Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().min(10).max(11).pattern(/^[0-9]+$/).required(),
      cpf: Joi.string().length(11).required(),
      birthday: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/).required()
    });

    if (schema.validate(req.body).error) {
      return res.sendStatus(400);
    }

    const hasCPF = await connection.query("SELECT * FROM customers WHERE cpf = $1", [cpf]);

    if (hasCPF.rowCount > 0) {
      return res.sendStatus(409);
    }

    await connection.query(`
			INSERT INTO 
			customers (name, phone, cpf, birthday) 
			VALUES ($1, $2, $3, $4)`,
      [name, phone, cpf, birthday]
    );
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.put('/customers/:id', async (req, res) => {
  try {
    const { name, phone, cpf, birthday } = req.body;
    const { id } = req.params;
    const schema = Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().min(10).max(11).pattern(/^[0-9]+$/).required(),
      cpf: Joi.string().length(11).required(),
      birthday: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/).required()
    });

    const cpfQuery = await connection.query(
      "SELECT * FROM customers WHERE cpf = $1", [cpf]
    );

    if (schema.validate(req.body).error) {
      return res.status(400).send(validation.error.details[0].message);
    }

    if (cpfQuery.rows[0]) {
      return res.sendStatus(409);
    }

    await connection.query(
      "UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5", 
      [name, phone, cpf, birthday, id]
    );
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/rentals', async (req, res) => {
  try {
    const { customerId, gameId } = req.query;
    let result;

    let query = `
			SELECT rentals.*, 
				customers.name AS "customerName", 
				games.name AS "gameName", 
				categories.id AS "categoryId", 
				categories.name AS "categoryName" 
			FROM rentals 
			JOIN customers 
        ON rentals."customerId" = customers.id 
			JOIN games 
        ON rentals."gameId" = games.id 
			JOIN categories 
        ON games."categoryId" = categories.id 
		`;
    
    if (customerId) {
      query += ` WHERE "customerId" = $1`;
      result = await connection.query(query, [customerId]);
    } else if (gameId) {
      query += ` WHERE "gameId" = $1`;
      result = await connection.query(query, [gameId]);
    } else {
      result = await connection.query(query);
    }

    if (result.rowCount === 0) {
      return res.send("Nenhum aluguel encontrado");
    }

    result.rows.forEach((row) => {
      row.customer = {
        id: row.customerId,
        name: row.customerName
      }

      row.game = {
        id: row.gameId,
        name: row.gameName,
        categoryId: row.categoryId,
        categoryName: row.categoryName
      }

      delete row.categoryId;
      delete row.categoryName;
      delete row.customerName;
      delete row.gameName;
    });

    res.send(result.rows);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/rentals", async (req, res) => {
  const { customerId, gameId, daysRented } = req.body;

  try {
    const customers = await connection.query(`SELECT * FROM customers;`);
    const customer = customers.rows.find((customers) => customers.id === customerId);
    const games = await connection.query(`SELECT * FROM games;`);
    const game = games.rows.find((games) => games.id === gameId);
    const rentals = await connection.query(`SELECT * FROM rentals;`);
    const gamesRented = rentals.rows.filter((rental) => rental.gameId === gameId);

    if (!customer  || !game || daysRented <= 0 || gamesRented.length >= game.stockTotal) {
      return res.sendStatus(400);
    }

    const rentDate = dayjs().format("YYYY-MM-DD");
    const returnDate = null;
    const originalPrice = game.pricePerDay * daysRented;
    const delayFee = null;

    await connection.query(
      `INSERT INTO rentals
      ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee")
      VALUES 
      ($1,$2,$3,$4,$5,$6,$7);`, 
      [customerId, gameId, rentDate, daysRented, returnDate, originalPrice, delayFee]);

    res.sendStatus(201);
  } catch {
    res.sendStatus(500);
  }
});

app.post('/rentals/:id/return', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const result = await connection.query(`
            SELECT rentals."rentDate", rentals."daysRented", games."pricePerDay"
            FROM rentals
            JOIN games ON games.id = rentals."gameId"
            WHERE rentals.id = $1;`,
            [id]
    );

    if (result.rowCount === 0) {
      return res.sendStatus(404);
    }

    const isReturned = await connection.query(`
			SELECT * FROM rentals
			WHERE id = $1
			AND "returnDate" IS NOT NULL`,
      [id]
    );

    if (isReturned.rowCount > 0) {
      return res.sendStatus(400);
    }

    const { rentDate, daysRented, pricePerDay } = result.rows[0];
    const rentPeriod = dayjs().diff(rentDate, "day");
    let delayFee = null;

    if (rentPeriod > daysRented) {
      delayFee = (rentPeriod - daysRented) * pricePerDay;
    }

    await connection.query(
      `UPDATE rentals
      SET "returnDate" = NOW(), "delayFee" = $1
      WHERE id = $2`,
      [delayFee, id]
    );

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.delete("/rentals/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const rentals = await connection.query(
      `SELECT * FROM rentals WHERE rentals.id = $1;`, [id]
    );

    if (rentals.rowCount === 0) {
      return res.sendStatus(404);
    }

    const isReturned = await connection.query(`
			SELECT * FROM rentals 
			WHERE id = $1 
			AND "returnDate" IS NOT NULL`,
      [id]
    );

    if (isReturned.rowCount > 0) {
      return res.sendStatus(400);
    }

    await connection.query(`
			DELETE FROM rentals WHERE id = $1`, [id]
    );

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.listen(4000, () => {
  console.log('Server is listening on port 4000.');
});
