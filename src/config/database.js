// src/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

class DatabaseConnection {
    constructor() {
        if (DatabaseConnection._instance) return DatabaseConnection._instance;
        
        this._pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'loja_simplificada',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            charset: 'utf8mb4',
        });
        
        DatabaseConnection._instance = this;
    }
    
    get pool() { return this._pool; }
}

DatabaseConnection._instance = null;

const db = new DatabaseConnection().pool;
module.exports = db; // Exporta a conexão pronta para uso