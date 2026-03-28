const mysql = require('mysql2/promise');
const dbConfig = require('./database');

const pool = mysql.createPool(dbConfig);

pool.getConnection()
    .then(connection => {
        console.log('Conexion a la base de datos establecida');
        connection.release();
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos:', err.message);
    });

module.exports = pool;
