const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tq3lb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const corsOptions = {
  origin: 'localhost:4200'
}

const app = express();

app.use(cors());
app.use(express.json());

const usersRouter = require('./api/users/index');
const postsRouter = require('./api/posts/index');

app.use('/users', usersRouter);
app.use('/posts', postsRouter);

app.listen(3000);