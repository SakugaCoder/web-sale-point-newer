//Incluye librerias necesarias

let express = require('express');
let app = express();
let sqlite3 = require('sqlite3');
var cors = require('cors');
const jsPDF = require("jspdf");
const child_process = require("child_process");

// Configura variables del archivo .env
require('dotenv').config()

// console.log(process.env.FRONTEND_PAT);

// Constante  para acceder a la ruta del frontend
const frontendPath = process.env.FRONTEND_PAT;
// Objeto exec para ejecutar comandos en terminarl
const exec = child_process.exec;

// Constantes para manejar el puerto serial
const { SerialPort } = require('serialport');
const serial_port = new SerialPort({ path: 'COM' + process.env.COM_PORT, baudRate: 115200 });

let current_kg = 1;
// let current_kg = 0; // Kg que se envian al frontend
let data_available = false; // Variable para saber si hay disponible informacion

// Middleware para acceder a la informacion enviada en las peticiones
var bodyParser = require('body-parser');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });

// create application/json parser
var jsonParser = bodyParser.json();

// Puerto de la aplicacion
let port = 3002;

// Variables para definir si se perdio la comunicacion
let seconds_without_data = 0;
let comunication_lost = false;

// Agrega middleware a la aplicacion
app.use(cors());
app.use(express.static('uploads'));


// Funcion para detectar error en puerto serie
serial_port.on('error', function(err) {
    console.log('Error 2 de lectura de bascula. Por favor cerrar programa, volver a conectar bascula y ejecutar el programa');
    // current_kg = -100;
});


// Funcion para establecer comunicacion con la bascula
setInterval( () => {
    serial_port.write('P');
}, 800);


// // Funcion de intervalo de 1s para detectar si se perdio comunicacion
// setInterval( () => {
//     // Revisa si la comunicacion no se ha perdido
//     if(!comunication_lost){
//         // Aumenta segundos sin comunicacion
//         seconds_without_data++;
//         console.log('Segundos sin comunicacion', seconds_without_data);
//         // Valida si los segundos transcuridos sin comunicacion 
//         // son mayores a una variable definda en el archivo .env
//         if(seconds_without_data >  process.env.MS_COMMUNICATION_ERROR){
//             console.log('Se perdio la comunicacion');   
//             comunication_lost = true;
//             current_kg = -100;
//         }
//     }
// }, 1000);

// Funcion que se ejecuta cuando hay datos en el puerto serie
serial_port.on('data', function (data) {
    let kg_str = data.toString();
    console.log('Data:', kg_str);
    console.log(kg_str.length);

    // Establece que hay comunicacion y que los segundos sin comunicacion son 0
    data_available = true;
    comunication_lost = false;
    seconds_without_data = 0;

    // Valida si la longitud de la informacion es igual a 10 caracteres
    // Si lo es establece el peso actual de la bascula
    if(kg_str.length ===  10){
        current_kg = 0;
        console.log('DATA AVAILABLE');
        current_kg = kg_str.replace(/\s/g, '');
        current_kg = Number(kg_str.split('kg')[0]);
        console.log(current_kg)
    }
}); 

// Funcion que retorna un objeto en el cual se pueden ejecutar consultas a la BD
function getDBConnection(){
    let db = new sqlite3.Database('./db/main.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          console.error(err.message);
        }
        console.log('Connected to the main database.');
    });
    
    return db;
}

// Funcion que retorna un objeto con un error
function returnError(msg){
    return { error: true, msg };
}

// Funcion para insertar cualquier elemento en la BD
// devuelve una variable booleana que representa
// la existencia de un error
function insertItem(query, values){
    let db = getDBConnection();
    let err = false;

    // insert one row into the langs table
    db.run(query, values, function(err) {
    if (err) {
        err = true;
        console.log(err.message);
        return err;
    }
    // get the last insert id
    console.log(`A row has been inserted with rowid ${this.lastID}`);
    });

    // close the database connection
    db.close();
    return err;
}

// Funcion para actualizar cualquier elemento en la BD
// devuelve una variable booleana que representa
// la existencia de un error
function updateItem(query, values){
    let db = getDBConnection();

    let err = false;
    // insert one row into the langs table
    db.run(query, values, function(err) {
        if (err) {
            console.log(err.message);
            err = true
        }
        // get the last insert id
        console.log(`Row(s) updated: ${this.changes}`);
    });
    
    // close the database connection
    db.close();
    return err;
}

// Funcion para eliminar elementos de la BD
// devuelve una variable booleana que representa
// la existencia de un error
function deleteItem(query, values){
    let db = getDBConnection();

    let err = false;
    // insert one row into the langs table
    db.run(query, values, function(err) {
        if (err) {
            console.log(err.message);
            err = true
        }
        // get the last insert id
        console.log(`Row(s) updated: ${this.changes}`);
    });
    
    // close the database connection
    db.close();
    return err;
}

// Funcion que obtiene el adeudo de un usuario total o de un pedido
// retorna un objeto con la llave deuda_cliente si no existe error
// de lo contrario retorna null a una callback function
function obtenerAdeudo(callback, id_usuario, id_pedido){
    let db = getDBConnection();
    let query = '';
    let params = null;

    if(id_pedido){
        console.log("ID pedido",id_pedido);
        query = 'SELECT SUM(adeudo) as deuda_cliente FROM Pedidos WHERE id_cliente = ? AND id != ?';
        params = [id_usuario, id_pedido];
    }

    else{
        query = 'SELECT SUM(adeudo) as deuda_cliente FROM Pedidos WHERE id_cliente = ?';
        params = [id_usuario]
    }

    db.all(query, params, (err, rows) => {
        
        if(err){
            // res.json(returnError('Error in DB query'));
            callback(null);
            db.close();
            // throw(err);            
        }


        if(rows.length > 0){
            obtenerTotalAbonado(null, function(total_abonado){
                callback(roundNumber(rows[0].deuda_cliente), roundNumber(total_abonado));
            }, id_usuario);
            
        }
        else{
            callback(null);
        }
        
        // res.json(rows);
    });
    db.close();
}

// Funcion que obtiene el id de un usuario apartir del nombre
// retorna un objeto con la llave id si no existe error
// de lo contrario retorna null a una callback function
function obtenerIdUsuario(nombre, callback){
    let db = getDBConnection();
    
    db.all('SELECT id from usuarios WHERE nombre=?', [nombre],(err, rows) => {
        if(err){
            db.close();
            callback({error: true, id: null});
            return null;
            // throw(err);            
        }
        
        if(rows.length > 0){
            callback({error: false, id: rows[0].id});
        }
        else{
            callback({error: false, id: null});
        }
        
        db.close();
    });
    
}

// Ruta para obtener el id de un usuario apartir del nombre
app.post('/id-usuario/', jsonParser, async (req, res) => {
    obtenerIdUsuario(req.body.username, function(result){
        res.json(result);
    });
});

// Ruta para obtener el aduedo de un usuario apartir del id
app.get('/obtener-adeudo/:id_usuario', async (req, res) => {
    obtenerAdeudo(function(adeudo, abonado){
        console.log(adeudo, abonado);
        res.json({adeudo, abonado});
    }, req.params.id_usuario, req.params.id_pedido);
}); 

// Ruta principal
app.get('/', (req, res) => {
    res.send('Sale Point API');
});

// Ruta pra obtener el datetime actual
app.get('/date', (req,res) => {
    res.json({date: getCurrentDatetime()});
});

// Ruta para obtener todos los usuarios ordenados de forma ascendente
app.get('/usuarios', (req, res) => {
    let db = getDBConnection();
    
    db.all('SELECT * FROM Usuarios ORDER BY nombre ASC', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB query'));
            db.close();
            // throw(err);            
        }
        res.json(rows);
    });
    db.close();
});

// Ruta para crear un nuevo usuario
app.post('/nuevo-usuario', jsonParser, (req, res) => {
    // Crea una variable con el SQL a ejecutar
    let query = `INSERT INTO Usuarios VALUES(null, ?, ?, ?)`;
    // Crea una variable de tipo array con los valores 
    // de los parametros de la consulta
    let values = [req.body.nombre, req.body.rol, req.body.pswd];
    // Ejecuta query con parametros
    let err = insertItem(query, values);
    // Retorna resultado
    res.json({err});
});

// Ruta para editar un usuario
app.post('/editar-usuario', jsonParser, (req, res) => {
    let query = `UPDATE Usuarios set rol=? WHERE id=?`;
    let params = [req.body.rol, req.body.user_id];
    let err = updateItem(query, params);
    res.json({err});
});

// Ruta para cambiar el pswd de un usuario
app.post('/cambiar-password-usuario', jsonParser, (req, res) => {
    let query = `UPDATE Usuarios set pswd=? WHERE id=?`;
    let params = [req.body.pass, req.body.user_id];
    let err = updateItem(query, params);
    res.json({err});
});

// Ruta para eliminar un nuevo usuario
app.delete('/eliminar-usuario/:user_id', (req, res) => {
    let query = `DELETE FROM Usuarios WHERE id=?`;
    let params = [req.params.user_id];
    let err = deleteItem(query, params);
    res.json({err});
});

// Ruta para obtener la deuda de un usuario 
// apartir del id_cliente
app.get('/deuda-usuario/:id_client', (req, res) => {
    let db = getDBConnection();
    db.all('SELECT SUM(adeudo) as deuda_cliente FROM Pedidos WHERE id_cliente = ?', [req.params.id_client] , (err, rows) => {
        
        if(err){
            res.json(returnError('Error in DB query'));
            db.close();
            // throw(err);            
        }
        
        obtenerTotalAbonado(null, function(abonado){
            rows.push({total_abonado: abonado});
            res.json(rows);    
        }, req.params.id_client);
        
    });
    db.close();
});

// Ruta para obtener todos los productos 
// en orden ascendente
app.get('/productos', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Productos ORDER BY name ASC', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        res.json(rows);
    });

    db.close();
});

// Ruta para crear un nuevo producto, usa el middleware upload.sinlge
// que guarda la foto del producto y almacena en req.file 
// los datos del archivo
app.post('/nuevo-producto', upload.single('foto'), (req, res) => {
    // console.log(req.body);
    // console.log(req.file);
    let query = `INSERT INTO Productos VALUES(null, ?, ?, ?, ?)`;
    let values =  null;
    if(req.file){
    	values = [req.body.nombre, req.body.precio, 'http://localhost:3002/' + req.file.filename, req.body.venta_por ];	
    }
    else{
		values = [req.body.nombre, req.body.precio, 'http://localhost:3002/default.jpg', req.body.venta_por ];	
    }
    
    insertItem(query, values);
    res.redirect('http://localhost:3000/productos');
});

// Ruta para editar un producto
app.post('/editar-producto', jsonParser, (req, res) => {
    let query = `UPDATE Productos set price=? WHERE id=?`;
    let params = [req.body.price, req.body.product_id];
    console.log(params);
    let err = updateItem(query, params);
    console.log(err);
    res.json({err});    
});

// Ruta para eliminar un producto apartir de su id
app.delete('/eliminar-producto/:product_id', jsonParser, (req, res) => {
    let query = `DELETE FROM Productos WHERE id=?`;
    let params = [req.params.product_id];
    let err = deleteItem(query, params);
    console.log(err);
    res.json({err});
});

// Ruta para obtener todos los clientes en orden ascendente
app.get('/clientes', (req, res) => {
    let db = getDBConnection();
    db.all('SELECT * FROM clientes ORDER BY nombre ASC', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        console.log(rows);
        res.json(rows);
    });

    db.close();
});

// Ruta para crear un nuevo cliente
app.post('/nuevo-cliente', jsonParser, (req, res) => {
    let query = `INSERT INTO Clientes VALUES(null, ?, ?, null)`;
    let values = [req.body.nombre, req.body.telefono] ;
    console.log(values);
    let err = insertItem(query, values);
    res.json({error: err});   

});

// Ruta para editar un cliente
app.post('/editar-cliente', jsonParser, (req, res) => {
    let query = `UPDATE Clientes set nombre=?, telefono=? WHERE id=?`;
    let params = [req.body.nombre, req.body.telefono, req.body.client_id];
    let err = updateItem(query, params);
    res.json({err});
});

// Ruta para eliminar un cliente apartir de su id
app.delete('/eliminar-cliente/:client_id', (req, res) => {
    let query = `DELETE FROM Clientes WHERE id=?`;
    let params = [req.params.client_id];
    let err = deleteItem(query, params);
    res.json({err});
});

// Ruta para obtener todos los chalanes por orden ascendente
app.get('/chalanes', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Chalanes ORDER BY nombre ASC', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        res.json(rows);
    });

    db.close();
});

// Ruta para crear un nuevo chalan
app.post('/nuevo-chalan', jsonParser, (req, res) => {
    let query = `INSERT INTO Chalanes VALUES(null, ?, ?)`;
    let values = [req.body.nombre, req.body.telefono];
    let err = insertItem(query, values);
    res.json({err});
});

// Ruta para editar un chalan
app.post('/editar-chalan', jsonParser, (req, res) => {
    let query = `UPDATE Chalanes set nombre=?, telefono=? WHERE id=?`;
    let params = [req.body.nombre, req.body.telefono, req.body.chalan_id];
    let err = updateItem(query, params);
    res.json({err});
});

// Ruta para eliminar un chalan apartir de su id
app.delete('/eliminar-chalan/:chalan_id', (req, res) => {
    let query = `DELETE FROM Chalanes WHERE id=?`;
    let params = [req.params.chalan_id];
    let err = deleteItem(query, params);
    res.json({err});
});

// Ruta para obtener todos los proveedores en orden ascendente
app.get('/proveedores', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Proveedores ORDER BY nombre ASC', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        res.json(rows);
    });

    db.close();
});

// Ruta para crear un nuevo proveedor
app.post('/nuevo-proveedor', jsonParser, (req, res) => {
    let query = `INSERT INTO Proveedores VALUES(null, ?)`;
    let values = [req.body.nombre];
    let err = insertItem(query, values);
    res.json({err});
});

// Ruta para editar un proveedor
app.post('/editar-proveedor', jsonParser, (req, res) => {
    let query = `UPDATE Proveedores set nombre=? WHERE id=?`;
    let params = [req.body.nombre, req.body.supplier_id];
    let err = updateItem(query, params);
    res.json({err});
});

// Ruta para eliminar un proveedor apartir de su id
app.delete('/eliminar-proveedor/:supplier_id', (req, res) => {
    let query = `DELETE FROM Proveedores WHERE id=?`;
    let params = [req.params.supplier_id];
    let err = deleteItem(query, params);
    res.json({err});
});

// Ruta para obtener todos las compras ordenadas por fecha
app.get('/compras', (req, res) => {
    let db = getDBConnection();
    db.all('SELECT * FROM Compras ORDER BY fecha DESC', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        res.json(rows);
    });

    db.close();
});

// Ruta para crear una nueva compra
app.post('/nuevo-compra', jsonParser, (req, res) => {
    let query = `INSERT INTO Compras VALUES(null, ?, ?, ?, ?, ?, ?)`;
    let date = req.body.date;
    if(req.body.supplier_id === 4){
        date = getCurrentDatetime();
    }
    let values = [req.body.product_id, req.body.kg, date, req.body.supplier_id, req.body.costo];
    let err = insertItem(query, values);

    res.json({err});

    // if(req.body.es_retiro){
    //     let retiro_query = 'INSERT INTO Retiros VALUES(null, ?, ?, ?)';
    //     let retiro_values = [date, req.body.costo, `${ req.body.detalle_producto.name } - ${ req.body.detalle_proveedor.nombre}`];
    //     let retiro_err = insertItem(retiro_query, retiro_values);
    //     res.json({err, retiro: retiro_err});
    // }
    // else{
    //     res.json({err});
    // }
});

/*
app.post('/editar-compra', jsonParser, (req, res) => {
    let query = `UPDATE Compras set nombre=?, telefono=? WHERE id=?`;
    let params = [req.body.nombre, req.body.telefono, req.body.chalan_id];
    let err = updateItem(query, params);
    res.json({err});
});
*/

// Ruta para eliminar una compra
app.delete('/eliminar-compra/:shopping_id', (req, res) => {
    let query = `DELETE FROM Compras WHERE id=?`;
    let params = [req.params.shopping_id];
    let err = deleteItem(query, params);
    res.json({err});
});

// Ruta para obtener los abonos de una compra
app.get('/abonos-compra/:id_compra', (req, res) => {
    console.log('obteniedo detalles de abonos de pedido');
    let id_compra = req.params.id_compra;
    let query = `SELECT * FROM Abonos_compras WHERE id_compra = ?`;
    let values = [id_compra];

    let db = getDBConnection();
    let error = false;

    db.all(query, values, function(err, rows) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }
        else{
            db.close();
            obtenerTotalAbonadoCompra(id_compra, function(total_abonado_compra){
                res.json({error, detalle_abonos_compras: rows, total_abonado_compra});
            });
        }
    });
});

// Ruta para crear una nuevo abono de compra
app.post('/nuevo-abono-compra', jsonParser, (req, res) => {
    console.log('Abonando compra');
    let query = `INSERT INTO Abonos_compras VALUES(null, ?, ?, ?) `;
    

    let values = [req.body.purchase_id, req.body.monto_abono, req.body.fecha];
    let err = insertItem(query, values);

    console.log("Error al guardar abono", err);
    if(err === false){
        console.log("si se va a generar ticket");
        generateTicketAbono(req.body);
    }

    let date = getCurrentDatetime();

    if(req.body.es_retiro){
        let retiro_query = 'INSERT INTO Retiros VALUES(null, ?, ?, ?)';
        let retiro_values = [date, req.body.monto_abono, `Abono de la compra con id: ${req.body.purchase_id}`];
        let retiro_err = insertItem(retiro_query, retiro_values);
        res.json({err, retiro: retiro_err});
    }
    else{
        res.json({err});
    }
});




// Ruta para obtener todos las pedidos ordenados por id
app.get('/pedidos', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Pedidos ORDER BY id DESC', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        console.log(rows);
        res.json(rows);
    });
    db.close();
});

// Ruta para obtener todos las pedidos de una sola fecha ordenados por id
app.get('/pedidos/:fecha', (req, res) => {
    let db = getDBConnection();
    let error = false;
    db.all('SELECT * FROM Pedidos WHERE fecha=? AND estado=1 ORDER BY id DESC', [req.params.fecha], (err, rows) => {
        if(err){
            error = true;
            res.json(returnError('Error in DB Query'));
        }
        res.json({ error, pedidos: rows });
    });

    db.close();
});

// Ruta para obtener el detalle de un pedido
app.get('/pedido/:order_id', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Pedidos_detalle WHERE id_pedido = ?',[req.params.order_id] , (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        // console.log(rows);
        res.json(rows);
    });
    db.close();
});


// Ruta para obtener el detalle de un pedido
app.get('/pedido-detalle/:order_id', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Pedidos WHERE id = ?',[req.params.order_id] , (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        // console.log(rows);
        res.json(rows);
    });
    db.close();
});
// Nuevo pedido

// Estados de pedidos
// 1 = Pagado
// 2 = Con adeudo/Fiado
// 3 = Enviado
// 4 = Pago Contra entrega

// Funcion que retorna la fecha actual en formato YYYY-MM-DD
function getCurrentDatetime(){
    let date_ob = new Date();
    // current date
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);

    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current year
    let year = date_ob.getFullYear();

    // current hours
    let hours = date_ob.getHours();

    // current minutes
    let minutes = date_ob.getMinutes();

    // current seconds
    let seconds = date_ob.getSeconds();

    let datetime = year + "-" + month + "-" + date; // + " " + hours + ":" + minutes + ":" + seconds;
    return datetime;
}

// Funcion para obtener el estado de la nota apartir de un numero
function getOrderStatusText(n){
    switch(n){
        case 1:
            return 'Pagado';
        case 2:
            return 'Adeudo';
        case 3:
            return 'Enviado';
        case 4:
            return 'PCE';
        default:
            return '';
    };
}

// Ruta para crear una nuevo pedido
app.post('/nuevo-pedido', jsonParser, async (req, res) => {

    let query = `INSERT INTO Pedidos VALUES(null, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`;

    // Funcion que retorna una cadena de texto con el detalle de los
    // productos comprados separados por coma
    const getItemsList = items => {
        return items.map( item => item.name + ' x ' + item.kg + ' ' +item.venta_por).join(', ');
    }
    // Obtiene fecha de pago
    let fecha_pago = req.body.estado === 1 ? getCurrentDatetime() : null;
    // Parametros de la consulta
    let values = [req.body.client.id, req.body.client.name, req.body.total, req.body.payment, req.body.total - req.body.payment, getCurrentDatetime(), req.body.estado ,getItemsList(req.body.items), req.body.chalan, fecha_pago, req.body.efectivo, req.body.cajero];

    let db = getDBConnection();
    let err = false;

    console.log("Inserting new order")

    // Crea el nuevo pedido
    db.run(query, values, function(error) {
        // Si hay error establece el valor de la variable err como true
        if (error) {
            err = true;
            console.log(err.message);
            console.log(error);
            return null;
        }

        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);

        // Id de la fila insertada
        let order_id = this.lastID;
        // Itera por cada elemento y lo guarda en pedido detalle
        req.body.items.forEach( item => {
            let detail_query = `INSERT INTO Pedidos_detalle VALUES(null, ?, ?, ?, ?, ?)`;
            let detail_params = [order_id, item.id, item.name, item.kg, item.price];
            db.run(detail_query, detail_params, function(detail_error){
                if (detail_error) {
                    err = true;
                    return console.log(err.message);
                }
            });
        });

        // Selecciona los datos del pedido creado
        db.all('SELECT * FROM Pedidos WHERE id = ?', [order_id], function(err, rows){
            // if (err) {
            //     err = true;
            //     return console.log(err.message);
            // }

            // Llama a la funcion obtenerAdeudo para generar
            // la informacion que se imprimira en el ticket
            obtenerAdeudo(function(adeudo, abonado){
                let order_data = rows[0];
                console.log(adeudo, abonado);
                let final_ticket_data = {
                    id_pedido: order_data.id,
                    fecha: order_data.fecha,
                    cajero: req.body.cajero, //req.body.cajero_id, 
                    chalan: order_data.chalan ? order_data.chalan.split(',')[1] : 'NA',
                    cliente: order_data.nombre_cliente,
                    adeudo: Number(adeudo) - Number(abonado),
                    estado_nota: getOrderStatusText(order_data.estado), 
                    efectivo: order_data.efectivo,
                    productos: req.body.items.map( function(item){ 
                        return {
                            nombre_producto: item.name,
                            precio_kg: item.price,
                            cantidad_kg: item.kg
                        }
                    })
                }
                console.log('******************************** Data del ticket', final_ticket_data);

                // Imprime ticket
                generateTicket(final_ticket_data);
            }, req.body.client.id);

          
        });

        // let final_ticket_data = {
        //     id_pedido: ticket_order.id,
        //     fecha: getCurrentDatetime(),
        //     cajero: req.body.cajero,
        //     chalan: req.body.chalan ? req.body.chalan.split(',')[0] : 'NA',
        //     cliente: req.body.client_id,
        //     adeudo: ticket_order.adeudo,
        //     estado_nota: getOrderStatusText(ticket_order.estado),
        //     efectivo: null,
        //     productos: ticket_order.detalle
        // };
        // close the database connection
        db.close();
        res.json({err});
    });
});


app.post('/abono-nota', jsonParser, (req, res) => {
    console.log('pagando pedido');
    let query = `INSERT INTO Abonos_notas VALUES(null, ?, ?, ?, ?, ?, ?, ?)`;
    let values = [req.body.id_pedido, req.body.id_cliente, req.body.adeudo, req.body.abonado, req.body.fecha, req.body.estado, req.body.chalan];

    let db = getDBConnection();
    let error = false;
    let error2 = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }

        
        if(Number(req.body.restante) === 0 && req.body.estado === 0){
            console.log('Se pago el total de la nota');
            db.run('UPDATE Pedidos set estado=1 WHERE id=?', [req.body.id_pedido], function(err2) {
                if (err2) {
                    error2 = true;
                    console.log(err2.message);
                    // return console.log(err.message);
                }
        
                db.close();
                res.json({error, error2});
            });
        }      
        else{
            db.close();
            res.json({error});
        }  
    });
});

app.get('/abonos-nota/:id_pedido', (req, res) => {
    console.log('obteniedo detalles de abonos de pedido');
    let id_pedido = req.params.id_pedido;
    let query = `SELECT * FROM Abonos_notas WHERE id_pedido = ?`;
    let values = [id_pedido];

    let db = getDBConnection();
    let error = false;

    db.all(query, values, function(err, rows) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }
        else{
            db.close();
            obtenerTotalAbonado(id_pedido, function(total_abonado){
                res.json({error, detalle_abonos: rows, total_abonado});
            });
        }
    });
});

app.post('/pagar-abono-nota', jsonParser, (req, res) => {
    console.log('pagando abono nota');
    let query = `UPDATE Abonos_notas SET abonado=?, estado=0, chalan='' WHERE id=?`;
    let values = [req.body.abonado, req.body.id_abono];

    let db = getDBConnection();
    let error = false;
    let error2 = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }
        
        if(Number(req.body.restante) === 0){
            console.log('Se pago el total de la nota');
            db.run('UPDATE Pedidos set estado=1 WHERE id=?', [req.body.id_pedido], function(err2) {
                if (err2) {
                    error2 = true;
                    console.log(err2.message);
                    // return console.log(err.message);
                }
        
                db.close();
                res.json({error, error2});
            });
        }      
        else{
            db.close();
            res.json({error});
        }  
    });
});

function obtenerTotalAbonado(id_pedido, callback, id_cliente){
    let query = `SELECT SUM(abonado) as total_abonado FROM Abonos_notas WHERE id_pedido = ? AND estado = 0`;
    let values = [id_pedido];
    if(id_cliente){
        query = `SELECT SUM(abonado) as total_abonado FROM Abonos_notas WHERE id_cliente = ? AND estado = 0`;
        values = [id_cliente];
    }
    

    let db = getDBConnection();
    let error = false;

    db.all(query, values, function(err, rows) {
        db.close();
        console.log(rows);
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
            callback(null);
        }
        
        else{
            callback(rows[0].total_abonado);
        }
    });
}

function obtenerTotalAbonadoCompra(id_compra, callback, id_cliente){
    let query = `SELECT SUM(monto_abono) as total_abonado_compra FROM Abonos_compras WHERE id_compra = ?`;
    let values = [id_compra];
    

    let db = getDBConnection();
    let error = false;

    db.all(query, values, function(err, rows) {
        db.close();
        console.log(rows);
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
            callback(null);
        }
        
        else{
            callback(rows[0].total_abonado_compra);
        }
    });
}
// Ruta para pagar un pedido
app.post('/pagar-pedido', jsonParser, (req, res) => {  
    console.log('pagando pedido');
    let query = `UPDATE Pedidos set estado = 1, enviado = 0, adeudo=0, abono=?, chalan="", fecha_pago=?, cajero=? WHERE id = ?`;
    let values = [req.body.total, getCurrentDatetime(), req.body.cajero, req.body.order_id];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }
        else{
            
            // // Selecciona los datos del pedido creado
            // db.all('SELECT * FROM Pedidos WHERE id = ?', [req.body.order_id], function(err, rows){
            //     // if (err) {
            //     //     err = true;
            //     //     return console.log(err.message);
            //     // }

            //     // Llama a la funcion obtenerAdeudo para generar
            //     // la informacion que se imprimira en el ticket
            //     obtenerAdeudo(function(adeudo){
            //         let order_data = rows[0];
            //         let final_ticket_data = {
            //             id_pedido: order_data.id,
            //             fecha: order_data.fecha,
            //             cajero: req.body.cajero_id, //req.body.cajero,
            //             chalan: order_data.chalan ? order_data.chalan.split(',')[0] : 'NA',
            //             cliente: order_data.id_cliente,
            //             adeudo: adeudo,
            //             estado_nota: getOrderStatusText(order_data.estado), 
            //             efectivo: order_data.efectivo,
            //             productos: req.body.items.map( function(item){ 
            //                 return {
            //                     nombre_producto: item.nombre_producto,
            //                     precio_kg: item.precio_kg,
            //                     cantidad_kg: item.cantidad_kg
            //                 }
            //             })
            //         }
            //         console.log('******************************** Data del ticket', final_ticket_data);

            //         // Imprime ticket
            //         generateTicket(final_ticket_data);
            // }, rows[0].id_cliente);
            // });
        }

        db.close();
        res.json({error});
    });
    // close the database connection
});

// Ruta para pagar todo el pce de un chalan
app.post('/pagar-pce-chalan', jsonParser, (req, res) => {  
    console.log('pagando pedido');
    let query = `UPDATE Pedidos set estado = 1, enviado = 0, adeudo=0, chalan="", fecha_pago=?, cajero=? WHERE chalan = ?`;
    let values = [getCurrentDatetime(), req.body.cajero, req.body.chalan];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }

        db.close();
        res.json({error});
    });
    // close the database connection
});

// Ruta para establecer como PCE un pedido
app.post('/pce-pedido', jsonParser, (req, res) => {  
    console.log('pagando pedido');
    let query = `UPDATE Pedidos set estado = 4, enviado = 0, abono=0, chalan=?, cajero=? WHERE id = ?`;
    let values = [req.body.chalan, req.body.cajero, req.body.order_id, ];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }

        db.close();
        res.json({error});
    });
    // close the database connection
});

// Ruta para establecer como fiado un pedido
app.post('/fiar-pedido', jsonParser, (req, res) => { 
    console.log('pagando pedido');
    let query = `UPDATE Pedidos set estado = 2, enviado = 0, chalan="", cajero=?, abono=0, adeudo=? WHERE id = ?`;
    let values = [req.body.cajero, req.body.adeudo, req.body.order_id];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }

        db.close();
        res.json({error});
    });
    // close the database connection
});

// Ruta para iniciar sesion
// valida que el usuario y pswd correspondan
app.post('/login', jsonParser, (req, res) => {
    let db = getDBConnection();

    db.all('SELECT rol, id FROM Usuarios WHERE nombre=? AND pswd=?', [req.body.name, req.body.pswd], (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        if(rows.length > 0){
            res.json({rol: rows[0].rol, err: false, id: rows[0].id});
        }
        else{
            res.json({err: true});
        }
    });

    db.close(); 
});

// Ruta para abrir caja
app.post('/abrir-caja', jsonParser, (req, res) => { 
    let query = `INSERT INTO Caja VALUES (?, "abierta", ?, ?, 0, 0, ?)`;
    let current_date = getCurrentDatetime()
    let values = [current_date, req.body.fondo, req.body.fondo, req.body.cajero];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }
        db.close();
        res.json({error});
    });
    // close the database connection
});

// Ruta para obtener todos los cierres de caja
// Obtiene tanto la suma ingresos como suma de retiros
// en la misma consulta
app.get('/cierres-caja', (req, res) => {
    let db = getDBConnection();

    db.all(`
    select 
    Caja.fecha,
    Caja.estado,
    Caja.fondo,
    Caja.total,
    Caja.ingresos,
    Caja.retiros,
    Caja.cajero,
    (SELECT sum(Pedidos.total_pagar) FROM Pedidos WHERE Pedidos.fecha_pago = Caja.fecha AND Pedidos.estado = 1) as SumaIngresos,
    (SELECT sum(Retiros.monto) FROM Retiros WHERE Retiros.fecha_retiro = Caja.fecha) as SumaRetiros
    FROM Caja ORDER by Caja.fecha DESC;`, [], (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        
            res.json({cierres_caja: rows, err: false});
    });

    db.close(); 
});

// Ruta para obtener la sumatoria de los kg de productos vendidos
// en cierta fecha
app.get('/sumatoria-productos/:fecha', jsonParser, (req,res) => {
    let db = getDBConnection();

    db.all(`
    SELECT 
    name as nombre, 
    price as precio,
    venta_por,
        (SELECT SUM(Pedidos_detalle.cantidad_kg) FROM Pedidos_detalle, Pedidos WHERE Pedidos_detalle.id_pedido = Pedidos.id AND Pedidos_detalle.id_producto = Productos.id AND Pedidos.fecha = ?) as Sumatoria
    FROM Productos ORDER BY nombre ASC
    `, [req.params.fecha], (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        
        res.json({sumatorias: rows, error: false});
    });

    db.close(); 

}),

// Ruta para cerrar una caja previa a la fecha actual en una fecha especifica
app.post('/cerrar-caja-previa', jsonParser, (req, res) => {
    let db = getDBConnection();
    let error = false;

    console.log(req.body);  

    db.run('UPDATE Caja SET estado="cerrada", retiros=?, ingresos=?, total=?, cajero=? WHERE fecha = ?', [req.body.retiros, req.body.ingresos, req.body.total, req.body.cajero, req.body.date], (err) => {
        if (err) {
            error = true;
            console.log(err.message);
        }
        db.close();
        console.log(error)
        res.json({error});
    });
});

// Ruta para obtener todos los retiros en orden descendente por id
app.get('/retiros', (req, res) => {
    let db = getDBConnection();

    console.log('retiros');

    db.all('SELECT * FROM Retiros WHERE fecha_retiro = ? ORDER BY id DESC', [getCurrentDatetime()], (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
            return null;
        }
            res.json({retiros: rows, err: false});
    });

    db.close(); 
});

// Ruta pra obtener los retiros en una fecha especifica
app.get('/retiros/:fecha', (req, res) => {
    let db = getDBConnection();
    let error = false;
    console.log('retiros');

    db.all('SELECT * FROM Retiros WHERE fecha_retiro = ? ORDER BY id DESC', [req.params.fecha], (err, rows) => {
        if(err){
            error = true;
            res.json(returnError('Error in DB Query'));
            return null;
        }
            res.json({retiros: rows, error});
    });

    db.close(); 
});

// Ruta para cerrar la caja actual (fecha de hoy)
app.post('/cerrar-caja', jsonParser, (req, res) => { 
    console.log('Cerrando caja');
    let query = `UPDATE Caja SET estado="cerrada", total=?, ingresos=?, retiros=?, cajero=? WHERE fecha=?`;
    let current_date = getCurrentDatetime()
    let values = [req.body.total, req.body.ingresos, req.body.retiros, req.body.cajero, current_date];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err);
            // return console.log(err.message);
        }
        console.log('Error es:', err);
        db.close();
        res.json({error});
    });
    // close the database connection
});

// Ruta para obtener el estado de caja
// Retorna tanto el total de la sumatoria 
// de los ingresos como el total de los retiros
app.get('/estado-caja', jsonParser, async (req, res) => { 
    let current_date = getCurrentDatetime();
    let db = getDBConnection();

    // Obtiene la caja con fecha del dia catual
    db.all('SELECT * FROM Caja WHERE fecha=?', [current_date], (err, rows) => {
        if(err){
            console.log(err);
            res.json(returnError('Error in DB Query'));
        }
        else if(rows){
            // Guarda los datos de la caja en una variable
            let caja = rows[0];
            
            // Selecciona la sumatoria del total a pagar de los ingresos con fecha actual
            db.all('SELECT SUM(total_pagar) as total_ingresos FROM Pedidos WHERE fecha_pago = ? AND estado=1;', [current_date], (err, rows_ti) => {
                if(err){
                    console.log(err);
                    return null;
                }
                else if(rows_ti){
                    // Guarda los ingresos en una variable
                    let ingresos = rows_ti[0].total_ingresos;
                    // Selecciona la sumatoria del monto en retiros con fecha actual
                    return db.all('SELECT SUM(monto) as total_retiros FROM Retiros WHERE fecha_retiro = ?', [current_date], (err, rows_tr) => {
                        if(err){
                            console.log(err);
                            return null;
                        }
                        else if(rows_tr){
                            // Guarda el valor de los retiros en una variable
                            let retiros = rows_tr[0].total_retiros;
                            // Retorna el estado de la caja
                            return res.json({caja, ingresos, retiros, err: false});
                            // return rows[0];
                        }
                        else{
                            return null;
                        }
                    });
                    //return rows[0];
                }
                else{
                    return null;
                }
            });
            // let ingresos = getTotalIncome(current_date);
            // let retiros = getTotalOutcome(current_date);
            // console.log(ingresos);
            // res.json({caja: rows[0], ingresos,retiros, err: false});
        }
        else{
            // Retorna error
            res.json({err: true});
        }
    });
    // close the database connection
});

// Ruta para retirar dinero de la caja
app.post('/retirar-dinero', jsonParser, (req, res) => { 
    let query = `INSERT INTO Retiros VALUES (null, ?, ?, ?)`;
    let current_date = getCurrentDatetime()
    let values = [current_date, req.body.monto, req.body.concepto];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }
        db.close();
        res.json({error});
    });
    // close the database connection
});

// Ruta para realizar merma de un producto
app.post('/merma', jsonParser, (req, res) => {
    // console.log('merma');
    let merma = req.body.merma;
    let producto = req.body.producto;
    let error = false;

    let db = getDBConnection();
    db.run('INSERT INTO Merma VALUES (null, ?, ?)', [producto, merma], (err) => {
        console.log(err);
        if(err){
            console.log(err.message);
            error = true;
        }
        db.close();
        res.json({error});
    });
});

// Ruta para obtener el stock actual de cada producto
app.get('/stock', (req, res) => {
    let db = getDBConnection();

    // Funcion para obtener todos los productos
    getAllProducts(db, function(err, products){
        // console.log(products);
        if(err)
            res.json(returnError('Error'));
        
        // Array para guardar el stock
        let stock = []
        let total_items = products.length;
        let counter = 0;

        // Itera sobre todos los productos
        products.forEach( product => {
            // Obtiene las compras totales de un producto
            getShoppingTotal(db, product.id, function(err_2, total_compras){
                // Obtiene el total de las notas de un producto
                getOrderTotal(db, product.id, function(err_2, total_pedidos){
                    // Obtiene la merma total de un producto
                    getMermaTotal(db, product.id, function(err_3, total_merma){
                        // Agrega el stock total de un producto a un array
                        stock.push({id: product.id, venta_por: product.venta_por, nombre: product.name, total_compras, total_pedidos, total_merma});
                        // console.log(stock);
                        counter++;
                        // Si el contador es mayor o igual al numero de productos enviamos la respuesta
                        if(counter >= total_items)
                            endResponse();
                    });
                });
            });
        });
        function endResponse(){
            res.json(stock);
        }
        // res.json({ok: true});
    });
});

// Ruta para obtener el valor actual de la bascula
app.get('/bascula', (req, res) => {
    console.log('bascula');
    res.json({kg_bascula: current_kg});
});


// Ruta para imprimir tickets envia el valor del body
// a la funcion generateTicket
app.post('/imprimir-ticket', jsonParser ,(req, res) => {
    generateTicket(req.body);
    res.json({ok: true});
});

// Funcion que imprime un ticket de prueba utilizando exec
// que ejecuta comandos en la terminal
function printTicketPrueba(){
    // Funcion exec que ejecuta la impresion del documento de prueba
    exec('PDFtoPrinter.exe ticket_prueba.pdf', (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        // console.log(`stdout: ${stdout}`);
        console.log("Imprimiendo ticket prueba");
    });
}

// Funcion para redondear numeros
function roundNumber(num){
    return Math.round((num + Number.EPSILON) * 100) / 100
}

// Funcion que devuelve la fecha con las horas y minutos
// actuales
function getFullDateTime(){
    let date_ob = new Date();
    // current date
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);

    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current year
    let year = date_ob.getFullYear();

    // current hours
    let hours = ("0" + date_ob.getHours() ).slice(-2);

    // current minutes
    let minutes = ("0" + date_ob.getMinutes() ).slice(-2);

    // current seconds
    let seconds = ("0"+  date_ob.getSeconds()).slice(-2);

    return year + "-" + month + "-" + date + " " + hours + ":" + minutes; //+ ":" + seconds;
}

// Funcion que genera ticket apartir del parametro order
// el cual contiene toda la informacion para la impresion
// del ticket
function generateTicket(order){
    console.log('Generando ticket');

    // Nombre del negocio
    let nombre_negocio = 'Aguacates y papayas cynthia';
    // Obtiene la hora y fecha actual
    let dt = getFullDateTime();

    // Genera el total a pagar en cada producto
    function getTotal(products){
        let total = 0;
        products.forEach( product => total += (product.precio_kg * product.cantidad_kg) );
        return total;
    }

    // Redondea numero y convierta a string el total
    const total = String(roundNumber(getTotal(order.productos)));
    // Variable para guardar el cambio
    let cambio = String(roundNumber(order.efectivo - total));

    // Establece los valores de efectivo y cambio si es que existe un valor
    let efectivo = 0;
    if(order.efectivo){
        efectivo = order.efectivo;
    }
    
    if(cambio < 0)
        cambio = 0;
    
    let paper_height = order.productos.length * 4;
    // Crea un objeto jsPDF para generar el ticket (pdf)
    const doc = new jsPDF.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, (290 - paper_height) + paper_height]
    });

    let min_x = 4;
    
    // Varuable para cambiar el valor de y en el pdf
    let current_y = 0;
    
    // Cambia el tamaño de la tipografia
    doc.setFontSize(10);
    
    // Escribe el nombre del negocio y fecha-hora en el pdf
    doc.text(nombre_negocio, 16, 2);
    doc.text(dt, 23, 6);
    
    // Escribe la fecha de la nota en el pdf
    doc.setFont("helvetica", "normal");
    doc.text('Fecha de compra:', min_x, 14);
    doc.setFont("helvetica", "bold");
    doc.text(order.fecha, 38, 14);
    
    current_y = 18;

    // Escribe el id de la nota en el pdf
    doc.setFont("helvetica", "normal");
    doc.text('ID nota:', 4, current_y);
    doc.setFont("helvetica", "bold");
    doc.text(String(order.id_pedido), 18, current_y);
    
    // Escribe el id de la nota en el pdf
    doc.setFont("helvetica", "normal");
    doc.text('Cajero:', 38, current_y);
    doc.setFont("helvetica", "bold");
    doc.text(String(order.cajero), 50, current_y);
    
    current_y = 22;

    // Escribe el chalan en el pdf
    doc.setFont("helvetica", "normal");
    doc.text('Chalan:', min_x, current_y);
    doc.setFont("helvetica", "bold");
    doc.text(String(order.chalan), 19, current_y);
    

    // Escribe el cliente en el pdf
    doc.setFont("helvetica", "normal");
    doc.text('Cliente:', 38, current_y);
    doc.setFont("helvetica", "bold");
    doc.text(String(order.cliente), 50, current_y);
    
    current_y = 26;

    // Escribe la deuda actual en el pdf
    doc.setFont("helvetica", "normal");
    doc.text('Deuda actual:', min_x, current_y);
    doc.setFont("helvetica", "bold");
    doc.text("$"+String(order.adeudo), 26, current_y);
    

    // Obtiene el texto del estado de la nota
    let en = '';
    if(order.estado_nota === 'Pagado'){
        en = 'Pagada';
    }

    else if(order.estado_nota === 'PCE'){
        en = 'PCE';
    }

    else if(order.estado_nota === 'Adeudo'){
        en = 'Fiada';
    }

    // Escribe el estado de la nota en el pdf
    doc.setFont("helvetica", "normal");
    doc.text('Nota:', 38, current_y);
    doc.setFont("helvetica", "bold");
    doc.text(en, 48, current_y);
    
    current_y = 32;
    
    // Escribe los encabezados de la tabla de los productos en el pdf
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text('Cantidad', min_x, current_y);
    doc.text('Descripcion', 19, current_y);
    doc.text('Precio', 40, current_y);
    doc.text('Importe', 52, current_y);
    
    current_y = 32;
    doc.setFont("helvetica", "normal");

    // Escribe cada producto econ descripcion precio e importe n el PDF
    order.productos.forEach( function(producto) {
        current_y += 4;
        doc.text(''+ String(producto.cantidad_kg), min_x, current_y);
        doc.text(producto.nombre_producto, 19, current_y);
        doc.text('$'+ String(producto.precio_kg.toFixed(2)), 40, current_y);
        doc.text('$'+ String( (producto.precio_kg * producto.cantidad_kg).toFixed(2)), 52, current_y);
    });
    
    
    current_y += 4;
    
    // Escribe un separador en el pdf
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text('--------------------------------------------------', 1, current_y);
    
    current_y += 4;
    
    // Escribe el total en el PDF
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('Total:', min_x, current_y);
    doc.setFont("helvetica", "bold");
    doc.text('$'+total, 21, current_y);
    
    current_y += 3;
    
    // Escribe el chalan en el pdf
    doc.setFont("helvetica", "normal");
    doc.text('Efectivo:', min_x, current_y);
    doc.setFont("helvetica", "bold");
    doc.text('$'+String(efectivo), 21, current_y);
    
    current_y += 3;
    
    // Escribe el cambio en el pdf
    doc.setFont("helvetica", "normal");
    doc.text('Cambio:', min_x, current_y);
    doc.setFont("helvetica", "bold");
    doc.text('$'+cambio, 21, current_y);
    
    current_y += 4;
    
    // Escribe el mensaje de agradecimiento en el pdf
    doc.setFont("helvetica", "bold");
    doc.text('Gracias por su compra', 21, current_y);
    
    // Guarda el ticket
    doc.save("ticket.pdf");
    console.log('Ticket nuevo generado!');
    

    // Ejecuta comando para imprimir el ticket generado
    exec('PDFtoPrinter.exe ticket.pdf', (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

// Funcion que genera ticket apartir del parametro abono
// el cual contiene toda la informacion para la impresion
// del ticket
function generateTicketAbono(abono){
    console.log('Generando ticket abono');

    // Nombre del negocio
    let nombre_negocio = 'Aguacates y papayas cynthia';
    // Obtiene la hora y fecha actual
    let dt = getFullDateTime();


    
    // Crea un objeto jsPDF para generar el ticket (pdf)
    const doc = new jsPDF.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 290]
    });
    
    // Varuable para cambiar el valor de y en el pdf
    let current_y = 0;
    
    // Cambia el tamaño de la tipografia
    doc.setFontSize(10);
    
    // Escribe el nombre del negocio y fecha-hora en el pdf
    doc.text(nombre_negocio, 16, 2);
    doc.text(dt, 23, 6);
    
    // Escribe la fecha de la nota en el pdf
    doc.setFont("helvetica", "normal");
    doc.text('Fecha de abono:', 15, 14);
    doc.setFont("helvetica", "bold");
    doc.text(abono.fecha, 42, 14);
    
    current_y = 24;

    
    // Escribe el estado de la nota en el pdf
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text('ABONO', 24, current_y);
    
    
    current_y += 8;
    
    // Escribe el total en el PDF
    doc.setFont("helvetica", "bold");
    doc.text('$'+abono.monto_abono, 32, current_y);
    
    doc.setFontSize(8);
    current_y += 10;
    
    // Escribe el mensaje de agradecimiento en el pdf
    doc.setFont("helvetica", "bold");
    doc.text('Gracias por su compra', 21, current_y);
    
    // Guarda el ticket
    doc.save("ticket_abono.pdf");
    console.log('Ticket nuevo generado!');
    

    // Ejecuta comando para imprimir el ticket generado
    exec('PDFtoPrinter.exe ticket_abono.pdf', (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

// Funcion para obtener todos los productos
function getAllProducts(db, callback){
    db.all('SELECT * FROM Productos', [], (err, rows) => {
        if(err){
            console.log(err);
            callback(err, null);
        }
        else if(rows){
            callback(null, rows);
        }
    });
}

// Funcion para obtner el total de las compras de un producto
function getShoppingTotal(db, product_id, callback){
        db.all('SELECT sum(kg) as total_compras FROM Compras WHERE id_producto = ?;', [product_id], (err, rows) => {
        if(err){
            console.log(err);
            callback(err, null);
        }

        else if(rows){
            callback(null, rows[0].total_compras);
        }
    });
}

// Funcion para obtener el total de los pedidos de un producto
function getOrderTotal(db, product_id, callback){
    db.all('SELECT sum(cantidad_kg) as total_pedidos FROM Pedidos_detalle WHERE id_producto = ?;', [product_id], (err, rows) => {
        if(err){
            console.log(err);
            callback(err, null);
        }

        else if(rows){
            callback(null, rows[0].total_pedidos);
        }
    });
}

// Funcion para obtener la merma total de un producto
function getMermaTotal(db, product_id, callback){
    db.all('SELECT sum(cantidad_merma) as total_merma FROM Merma WHERE id_producto = ?;', [product_id], (err, rows) => {
        if(err){
            console.log(err);
            callback(err, null);
        }

        else if(rows){
            callback(null, rows[0].total_merma);
        }
    });
}


// Funcion para escuchar en un puerto especifico las peticiones
app.listen(port, () => {
    console.log(`Listening on port ${port}`);

    // Timeout para revisar si existe comunicacion
    // y si existe realizar lo siguiente:
    // - Ejecutar serve para generar acceso a frontend
    // - Llamar funcion para imprimir ticket de prueba
    // - Ejecutar timeout para abrir la pagina del sistema en chrome
    
    setTimeout( () => {
    if(data_available){
        // Inicia servidor
        console.log("Iniciando servidor");

        // Ejecuta serve para crear un servidor de archivos estaticos para el front
        exec('serve -s '+ frontendPath + " -p 3000", (error, stdout, stderr) => {
            console.log('Servidor iniciado');
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            // console.log(`stdout: ${stdout}`);
        });

        // Imprime ticket de prueba
        printTicketPrueba();

        // Crea timeout para abrir pagina principal en chrome
        setTimeout(function(){
            exec('start chrome http://localhost:3000', (error, stdout, stderr) => {
            console.log('Pagina principal abierta');
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return;
                }
                // console.log(`stdout: ${stdout}`);
            });
        }, process.env.MS_FRONTEND * 1000);
    }

    // Si no existe comunicacion se muestra mensaje en consola

    else{
        console.log('Error de lectura de bascula. Por favor cerrar programa, volver a conectar bascula y ejecutar el programa');
    }
}, process.env.MS_VALIDATION * 1000);
});