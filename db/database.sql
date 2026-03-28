CREATE DATABASE IF NOT EXISTS floreria_dulce_luz
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE floreria_dulce_luz;

CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rol ENUM('admin', 'usuario') DEFAULT 'usuario',
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_rol (rol)
);

CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    precio DECIMAL(10,2) NOT NULL,
    cantidad INT DEFAULT 0,
    imagen VARCHAR(500) NULL,
    estado ENUM('disponible', 'no_disponible') DEFAULT 'disponible',
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_estado (estado),
    INDEX idx_activo (activo)
);

CREATE TABLE ordenes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NULL,
    codigo_unico VARCHAR(50) NOT NULL UNIQUE,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_apellido VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(20) NOT NULL,
    cliente_departamento VARCHAR(50) NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'pagado', 'cancelado') DEFAULT 'pendiente',
    qr_id VARCHAR(50) NULL,
    qr_url TEXT NULL,
    qr_expiration DATETIME NULL,
    fecha_pago DATETIME NULL,
    pago_nombre VARCHAR(255) NULL,
    pago_banco VARCHAR(100) NULL,
    pago_monto DECIMAL(10,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_codigo_unico (codigo_unico),
    INDEX idx_estado (estado),
    INDEX idx_qr_id (qr_id),
    INDEX idx_fecha_pago (fecha_pago)
);

CREATE TABLE orden_detalle (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orden_id INT NOT NULL,
    producto_id INT NOT NULL,
    producto_nombre VARCHAR(255) NOT NULL,
    producto_precio DECIMAL(10,2) NOT NULL,
    cantidad INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_orden (orden_id)
);

CREATE TABLE carritos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    qr_id VARCHAR(50) NULL,
    qr_url TEXT NULL,
    qr_image TEXT NULL,
    qr_expiration DATETIME NULL,
    cliente_nombre VARCHAR(100) NULL,
    cliente_apellido VARCHAR(100) NULL,
    cliente_telefono VARCHAR(20) NULL,
    cliente_departamento VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_qr_expiration (qr_expiration)
);

CREATE TABLE carrito_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    carrito_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_carrito_producto (carrito_id, producto_id),
    INDEX idx_carrito (carrito_id)
);

CREATE TABLE refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_expires (expires_at)
);

INSERT INTO usuarios (email, password, nombre, apellido, rol, activo)
VALUES ('admin@gmail.com', '$2b$12$KxdLwyFBBqAG8MmyeXYOFuxUInqnJAP9NJ6dc/.hURgzgrrl5Xyfi', 'Admin', 'Sistema', 'admin', 1);

INSERT INTO productos (nombre, descripcion, precio, cantidad, imagen, estado, activo)
VALUES
('Ramo Clasico Rosas Rojas', 'Ramo de rosas rojas premium con envoltura elegante.', 180.00, 25, NULL, 'disponible', 1),
('Arreglo en Caja Elegance', 'Caja floral con rosas, lirios y follaje natural.', 240.00, 20, NULL, 'disponible', 1),
('Bouquet Cumpleanos Dulce', 'Combinacion colorida para celebraciones especiales.', 150.00, 30, NULL, 'disponible', 1),
('Arreglo Lujo White Gold', 'Arreglo premium para aniversarios y eventos.', 320.00, 12, NULL, 'disponible', 1),
('Canasta Floral Celebracion', 'Canasta floral con chocolates y detalles premium.', 285.00, 18, NULL, 'disponible', 1);
