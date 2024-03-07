import express from 'express';
import fs from 'fs';
import { MongoClient, ServerApiVersion } from 'mongodb';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';

import { registerValidation } from './validations/register.js';
import { loginValidation } from './validations/login.js';
import { postCreateValidation } from './validations/post.js';
import { userController, postController } from './controllers/index.js';
import { checkAuth, handleValidationErrors } from './utils/index.js';

const uri =
  'mongodb+srv://admin:wwwwww@cluster0.ke2b3h6.mongodb.net/blog?retryWrites=true&w=majority&appName=Cluster0';

mongoose
  .connect(uri)
  .then(() => console.log(`Connected to database`))
  .catch((err) => console.log(err));

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

const app = express();

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads');
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => res.json(`Hello!!!!`));
app.post('/auth/login', loginValidation, handleValidationErrors, userController.login);
app.post('/auth/register', registerValidation, handleValidationErrors, userController.register);
app.get('/auth/me', checkAuth, userController.getMe);

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
  res.json({
    url: `/uploads/${req.file.originalname}`,
  });
});

app.get('/posts', postController.getAll);
app.get('/tags', postController.getLastTags);
app.get('/posts/:id', postController.getOne);
app.post('/posts', checkAuth, postCreateValidation, handleValidationErrors, postController.create);
app.delete('/posts/:id', checkAuth, postCreateValidation, postController.remove);
app.patch('/posts/:id', checkAuth, postController.update);

app.listen(4444, (err) => {
  if (err) {
    return console.log(err);
  }

  console.log('Server OK');
});
