"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const port = 3000;
//seteo urlenconde para capturar los datos del formulario
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.json());
//invoco a dotenv
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: './.env' });
//el directorio public
app.use('/resources', express_1.default.static('public'));
app.use('/resources', express_1.default.static(__dirname + '/public'));
//establezco el motor de plantillas
app.set('view engine', 'ejs');
//invoco a bcryptjs
const bcryptjs_1 = __importDefault(require("bcryptjs"));
//variables de session
const express_session_1 = __importDefault(require("express-session"));
app.use((0, express_session_1.default)({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
//establezco las rutas
app.get('/login', (_req, res) => {
    res.render('login');
});
app.get('/register', (_req, res) => {
    res.render('register');
});
//registro de usuarios
app.post('/register', async (req, res) => {
    const user = req.body.user;
    const name = req.body.name;
    const roll = req.body.rol;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs_1.default.hash(pass, 8);
    const result = await prisma.user.create({
        data: {
            user, name, roll, pass: passwordHash
        }
    });
    res.render('register', {
        alert: true,
        alertTitle: 'Registration',
        alertMessage: 'Successful Registration!',
        alertIcon: 'success',
        showConfirmButton: false,
        timer: 1500,
        ruta: ''
    });
});
// adquirir un nuevo producto
app.post('/addprod', async (req, res) => {
    if (req.session.loggedin) {
        const name = req.body.name;
        const owneruser = req.session.user;
        const owner = await prisma.user.findUnique({
            where: {
                user: owneruser,
            },
        });
        if (owner) {
            const result = await prisma.product.create({
                data: {
                    name, ownerId: owner.id
                }
            });
            const productsObj = await prisma.product.findMany({
                where: {
                    ownerId: owner.id
                }
            });
            let objs = [];
            for (let i = 0; i < productsObj.length; i++) {
                objs.push(productsObj[i].name);
            }
            ;
            res.render('index', {
                login: true,
                name: req.session.name,
                products: objs,
                alert: true,
                alertTitle: 'Product',
                alertMessage: 'Producto Agregado con exito!',
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: ''
            });
        }
        // ELSE USUARIO NO ENCONTRADO
    }
    else {
        res.render('index', {
            login: false,
            name: 'Debe iniciar sesion'
        });
    }
});
//autenticacion
app.post('/auth', async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs_1.default.hash(pass, 8);
    if (user && pass) {
        const check = await prisma.user.findMany({
            where: {
                user: user
            }
        });
        if (check && (await bcryptjs_1.default.compare(pass, check[0].pass)) && check[0].user) {
            req.session.loggedin = true;
            req.session.name = check[0].name;
            req.session.user = check[0].user;
            res.render('login', {
                alert: true,
                alertTitle: 'Conexion exitosa',
                alertMessage: 'Login correcto!',
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: ''
            });
        }
        else {
            res.render('login', {
                alert: true,
                alertTitle: 'Error',
                alertMessage: 'Usuario y/o Password incorrectas',
                alertIcon: 'error',
                showConfirmButton: false,
                timer: 1500,
                ruta: 'login'
            });
        }
    }
    else {
        res.send('Por favor ingrese un usario y/o una password');
    }
});
//autenticación en páginas
app.get('/', async (req, res) => {
    if (req.session.loggedin) {
        const username = req.session.user;
        const user = await prisma.user.findUnique({
            where: {
                user: username,
            },
        });
        if (user) {
            const userId = user.id;
            const productsObj = await prisma.product.findMany({
                where: {
                    ownerId: userId
                }
            });
            let objs = [];
            for (let i = 0; i < productsObj.length; i++) {
                objs.push(productsObj[i].name);
            }
            ;
            res.render('index', {
                login: true,
                name: req.session.name,
                products: objs
            });
        }
        //ELSE USUARIO NO ENCONTRADO
    }
    else {
        res.render('index', {
            login: false,
            name: 'Debe iniciar sesion'
        });
    }
});
//logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});
//editar nombre 
app.post('/edit', async (req, res) => {
    if (req.session.loggedin) {
        const username = req.session.user;
        const edituser = await prisma.user.update({
            where: { user: username },
            data: { name: req.body.editname }
        });
        const userId = edituser.id;
        const productsObj = await prisma.product.findMany({
            where: {
                ownerId: userId
            }
        });
        req.session.name = edituser.name;
        let objs = [];
        for (let i = 0; i < productsObj.length; i++) {
            objs.push(productsObj[i].name);
        }
        ;
        res.render('index', {
            login: true,
            name: req.session.name,
            products: objs
        });
    }
    else {
        res.render('index', {
            login: false,
            name: 'Debe iniciar sesion'
        });
    }
});
//prototipo borrar usuario
app.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.delete({
        where: { id: Number(id) }
    });
    res.json('Eliminado');
});
//borrar un producto
app.post('/deleteprod', async (req, res) => {
    if (req.session.loggedin) {
        const username = req.session.user;
        const user = await prisma.user.findUnique({
            where: {
                user: username,
            },
        });
        const prodName = req.body.name;
        if (user) {
            const userId = user.id;
            const productsObj = await prisma.product.findMany({
                where: {
                    ownerId: userId,
                    name: prodName
                }
            });
            //delete
            const idprod = productsObj[0].id;
            const prodelete = await prisma.product.delete({
                where: { id: idprod }
            });
            const productsObjNew = await prisma.product.findMany({
                where: {
                    ownerId: userId
                }
            });
            let objs = [];
            for (let i = 0; i < productsObjNew.length; i++) {
                objs.push(productsObjNew[i].name);
            }
            ;
            res.render('index', {
                login: true,
                name: req.session.name,
                products: objs
            });
        }
        //ELSE USUARIO NO ENCONTRADO
    }
    else {
        res.render('index', {
            login: false,
            name: 'Debe iniciar sesion'
        });
    }
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
