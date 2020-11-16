const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tq3lb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const app = express();

app.use(cors({
  origin: 'http://ec2-15-237-13-78.eu-west-3.compute.amazonaws.com',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

const usersRouter = require('./api/users/index');
const postsRouter = require('./api/posts/index');

app.use('/users', usersRouter);
app.use('/posts', postsRouter);

app.listen(3000);