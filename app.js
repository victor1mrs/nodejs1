const express = require('express');
const {PrismaClient} = require('@prisma/client')

const prisma = new PrismaClient()
const app = express();

const port = 3001;

//seteo urlenconde para capturar los datos del formulario
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//invoco a dotenv
const dotenv = require('dotenv');
const bcryptjs = require('bcryptjs');
dotenv.config({path:'./.env'});

//el directorio public
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

//establezco el motor de plantillas
app.set('view engine', 'ejs');

//invoco a bcryptjs
const bcriptjs = require('bcryptjs');

//variables de session
const session = require('express-session')
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

//establezco las rutas
app.get('/', (req, res)=>{
  res.render('index', {msg:'Esto es un mensaje de NODE'})
})
app.get('/login', (req, res)=>{
  res.render('login')
})
app.get('/register', (req, res)=>{
  res.render('register')
})

//registro de usuarios
app.post('/register', async(req, res)=>{
  const user = req.body.user;
  const name = req.body.name;
  const roll = req.body.rol;
  const pass = req.body.pass;
  let passwordHash = await bcriptjs.hash(pass, 8);
  try{
    const result = await prisma.users.create({
      data: {
        user, name, roll, pass: passwordHash
      }
    })
    res.render('register', {
      alert: true,
      alertTitle: 'Registration',
      alertMessage: 'Successful Registration!',
      alertIcon: 'success',
      showConfirmButton: false,
      timer: 1500,
      ruta: ''
    })
  } catch(e){
    if (e instanceof prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (e.code === 'P2002') {
        console.log(
          'There is a unique constraint violation, a new user cannot be created with this email'
        )
      }
    }
    throw e
  }
})

//Mostrar todos los registros
app.get('/posts', async(req, res)=>{
  const posts = await prisma.post.findMany()
  res.json(posts)
})

//Actualizar un registro
app.put('/post/:id', async(req, res)=>{
  const {id} = req.params
  const {title, content} = req.body
  const post = await prisma.post.update({
    where: {id: Number(id)},
    data: {title, content}
  })
  res.json(post)
})

app.delete('/post/:id', async(req, res) => {
  const {id} = req.params
  const post = await prisma.post.delete({
    where: {id: Number(id)}
  })
  res.json('Eliminado')
})

//prototipo borrar usuario
app.delete('/delete/:id', async(req, res) => {
  const {id} = req.params
  const user = await prisma.users.delete({
    where: {id: Number(id)}
  })
  res.json('Eliminado')
})

app.post('/post', async(req, res)=>{
  const {title, content} = req.body
  const result = await prisma.post.create({
    data: {
      title, content
    }
  })
  res.json(result)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})