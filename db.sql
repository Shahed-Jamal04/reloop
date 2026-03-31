
--create database reloop;
USE Reloop;
GO

------------------------------------------------------------
-- ROLES
------------------------------------------------------------
CREATE TABLE roles (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(20) UNIQUE NOT NULL
);
INSERT INTO roles (name) VALUES ('buyer'), ('seller'), ('admin');

------------------------------------------------------------
-- USERS
------------------------------------------------------------
CREATE TABLE users (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20),
    role_id INT NOT NULL,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (role_id) REFERENCES roles(id)
);

------------------------------------------------------------
-- PROFILES
------------------------------------------------------------
CREATE TABLE profiles (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT UNIQUE NOT NULL,
    location NVARCHAR(255),
    bio NVARCHAR(MAX),
    rating DECIMAL(2,1) DEFAULT 0,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (user_id) REFERENCES users(id)
);

------------------------------------------------------------
-- CATEGORIES
------------------------------------------------------------
CREATE TABLE categories (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) UNIQUE NOT NULL,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

------------------------------------------------------------
-- MATERIAL STATUS
------------------------------------------------------------
CREATE TABLE material_status (
    id INT PRIMARY KEY IDENTITY(1,1),
    status NVARCHAR(20) UNIQUE NOT NULL
);
INSERT INTO material_status (status) VALUES ('available'), ('sold'), ('removed');

------------------------------------------------------------
-- MATERIALS
------------------------------------------------------------
CREATE TABLE materials (
    id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    price DECIMAL(10,2),
    quantity INT,
    image NVARCHAR(255),
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    status_id INT NOT NULL,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (status_id) REFERENCES material_status(id)
);

------------------------------------------------------------
-- REQUEST STATUS
------------------------------------------------------------
CREATE TABLE request_status (
    id INT PRIMARY KEY IDENTITY(1,1),
    status NVARCHAR(20) UNIQUE NOT NULL
);
INSERT INTO request_status (status) VALUES ('pending'), ('accepted'), ('rejected');

------------------------------------------------------------
-- REQUESTS
------------------------------------------------------------
CREATE TABLE requests (
    id INT PRIMARY KEY IDENTITY(1,1),
    material_id INT NOT NULL,
    buyer_id INT NOT NULL,
    message NVARCHAR(MAX),
    status_id INT NOT NULL,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (status_id) REFERENCES request_status(id)
);

------------------------------------------------------------
-- ORDER STATUS
------------------------------------------------------------
CREATE TABLE order_status (
    id INT PRIMARY KEY IDENTITY(1,1),
    status NVARCHAR(20) UNIQUE NOT NULL
);
INSERT INTO order_status (status) VALUES ('pending'), ('confirmed'), ('completed'), ('cancelled');

------------------------------------------------------------
-- ORDERS
------------------------------------------------------------
CREATE TABLE orders (
    id INT PRIMARY KEY IDENTITY(1,1),
    buyer_id INT NOT NULL,
    status_id INT NOT NULL,
    total_price DECIMAL(10,2),
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (status_id) REFERENCES order_status(id)
);

------------------------------------------------------------
-- ORDER ITEMS
------------------------------------------------------------
CREATE TABLE order_items (
    id INT PRIMARY KEY IDENTITY(1,1),
    order_id INT NOT NULL,
    material_id INT NOT NULL,
    quantity INT,
    price DECIMAL(10,2),
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

------------------------------------------------------------
-- PAYMENT STATUS
------------------------------------------------------------
CREATE TABLE payment_status (
    id INT PRIMARY KEY IDENTITY(1,1),
    status NVARCHAR(20) UNIQUE NOT NULL
);
INSERT INTO payment_status (status) VALUES ('pending'), ('paid'), ('failed');

------------------------------------------------------------
-- PAYMENTS
------------------------------------------------------------
CREATE TABLE payments (
    id INT PRIMARY KEY IDENTITY(1,1),
    order_id INT NOT NULL,
    amount DECIMAL(10,2),
    payment_method NVARCHAR(20),
    status_id INT NOT NULL,
    transaction_id NVARCHAR(255),
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (status_id) REFERENCES payment_status(id)
);

------------------------------------------------------------
-- MESSAGES
------------------------------------------------------------
CREATE TABLE messages (
    id INT PRIMARY KEY IDENTITY(1,1),
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    request_id INT NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (request_id) REFERENCES requests(id)
);

------------------------------------------------------------
-- NOTIFICATIONS
------------------------------------------------------------
CREATE TABLE notifications (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    type NVARCHAR(50),
    content NVARCHAR(255),
    is_read BIT DEFAULT 0,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (user_id) REFERENCES users(id)
);

------------------------------------------------------------
-- CART
------------------------------------------------------------
CREATE TABLE cart (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT UNIQUE NOT NULL,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (user_id) REFERENCES users(id)
);

------------------------------------------------------------
-- CART ITEMS
------------------------------------------------------------
CREATE TABLE cart_items (
    id INT PRIMARY KEY IDENTITY(1,1),
    cart_id INT NOT NULL,
    material_id INT NOT NULL,
    quantity INT,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (cart_id) REFERENCES cart(id),
    FOREIGN KEY (material_id) REFERENCES materials(id),
    UNIQUE (cart_id, material_id)
);

------------------------------------------------------------
-- TESTIMONIALS (for /api/stats/testimonials)
------------------------------------------------------------
CREATE TABLE testimonials (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT,
    author_name NVARCHAR(100),
    author_role NVARCHAR(100),
    quote NVARCHAR(MAX),
    rating DECIMAL(2,1),
    is_active BIT DEFAULT 1,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

------------------------------------------------------------
-- EXTRA COLUMN ON MESSAGES (unread count support)
------------------------------------------------------------
ALTER TABLE messages ADD is_read BIT DEFAULT 0;

------------------------------------------------------------
-- SAMPLE TESTIMONIALS
------------------------------------------------------------
INSERT INTO testimonials (user_id, author_name, author_role, quote, rating, is_active)
VALUES 
(NULL, 'Ahmed Hassan', 'Production Manager', 'Reloop made it easy to find quality waste materials for our production. The process is transparent and reliable.', 5.0, 1),
(NULL, 'Fatima Al-Mansouri', 'Factory Owner', 'As a seller, Reloop has opened new revenue streams from our waste. Great platform and responsive team.', 5.0, 1),
(NULL, 'Mohammed Noor', 'Buyer', 'Love knowing that I am contributing to a sustainable future while getting quality materials at great prices.', 4.5, 1);

------------------------------------------------------------
-- DATA QUALITY CONSTRAINTS (ENHANCEMENTS)
------------------------------------------------------------
-- Non-negative / positive constraints
ALTER TABLE materials
  ADD CONSTRAINT CK_materials_price_nonneg CHECK (price IS NULL OR price >= 0),
      CONSTRAINT CK_materials_quantity_pos CHECK (quantity IS NULL OR quantity > 0);

ALTER TABLE cart_items
  ADD CONSTRAINT CK_cart_items_quantity_pos CHECK (quantity IS NULL OR quantity > 0);

ALTER TABLE order_items
  ADD CONSTRAINT CK_order_items_quantity_pos CHECK (quantity IS NULL OR quantity > 0);

ALTER TABLE payments
  ADD CONSTRAINT CK_payments_amount_nonneg CHECK (amount IS NULL OR amount >= 0);

-- Rating ranges
ALTER TABLE profiles
  ADD CONSTRAINT CK_profiles_rating_range CHECK (rating >= 0 AND rating <= 5);

ALTER TABLE testimonials
  ADD CONSTRAINT CK_testimonials_rating_range CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

------------------------------------------------------------
-- INDEXES (PERFORMANCE ENHANCEMENTS)
------------------------------------------------------------

-- Users
CREATE INDEX IX_users_role_id ON users(role_id);
CREATE INDEX IX_users_is_deleted ON users(is_deleted);

-- Materials
CREATE INDEX IX_materials_user_id ON materials(user_id);
CREATE INDEX IX_materials_category_id ON materials(category_id);
CREATE INDEX IX_materials_status_id ON materials(status_id);
CREATE INDEX IX_materials_is_deleted ON materials(is_deleted);
CREATE INDEX IX_materials_created_at ON materials(created_at);

-- Requests / orders
CREATE INDEX IX_requests_buyer_id ON requests(buyer_id);
CREATE INDEX IX_requests_material_id ON requests(material_id);

CREATE INDEX IX_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IX_order_items_order_id ON order_items(order_id);

-- Messages / notifications
CREATE INDEX IX_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IX_notifications_user_id_is_read ON notifications(user_id, is_read);

GO


INSERT INTO material_status (status) VALUES ('pending');
--
INSERT INTO categories (name)
VALUES 
  ('Food Overproduction'),
  ('Clothing Overruns'),
  ('Packaging Surplus'),
  ('Household Goods'),
  ('Industrial Materials');


  -- Assume roles: 1=buyer, 2=seller, 3=admin (from your roles insert order)

INSERT INTO users (name, email, password, phone, role_id)
VALUES
  ('Demo Buyer',  'buyer@reloop.local',  'demo_hash', NULL, 1),
  ('Demo Seller', 'seller@reloop.local', 'demo_hash', NULL, 2),
  ('Demo Admin',  'admin@reloop.local',  'demo_hash', NULL, 3);


  -- Profiles
INSERT INTO profiles (user_id, location, bio, rating)
VALUES
  (1, 'Amman, Jordan', 'Sourcing sustainable surplus materials.', 4.5),
  (2, 'Ajloun, Jordan', 'Factory selling overproduction stock.', 5.0),
  (3, 'Irbid, Jordan',  'Platform administrator.', 0);

-- Cart (one per user, matches app)
INSERT INTO cart (user_id)
VALUES (1), (2), (3);


-- Get IDs you’ll need (if unsure):
-- SELECT id, name FROM categories;
-- SELECT id, status FROM material_status;
-- SELECT id, email FROM users;

INSERT INTO materials (
  title,
  description,
  price,
  quantity,
  image,
  user_id,
  category_id,
  status_id,
  is_deleted
)
VALUES
  (
    'Surplus Tomato Sauce (Pallets)',
    'Export overproduction, near best-before but safe. Palletized, shrink-wrapped.',
    1500.00,
    10,
    'images/tomato-sauce-pallet.jpg',
    2,   -- Demo Seller
    1,   -- Food Overproduction
    1,   -- available
    0
  ),
  (
    'Overrun Cotton T-Shirts (Boxes)',
    'Brand overrun, mixed sizes, new in boxes.',
    800.00,
    25,
    'images/cotton-tshirts-boxes.jpg',
    2,   -- Demo Seller
    2,   -- Clothing Overruns
    1,   -- available
    0
  );