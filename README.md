# DigitalCommerce
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/mongodb-5.0%2B-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-Commercial-blue.svg)](LICENSE.md)

> Production-ready Node.js backend API for modern e-commerce applications with secure authentication, Stripe payments, digital products, and admin analytics.

---

## 🚀 Key Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Two-Factor Authentication (2FA)
- Role-based access control (Admin/User)
- Password encryption with bcrypt
- XSS & NoSQL injection prevention
- Helmet.js security headers

### 🛒 E-commerce Core
- Product management (CRUD, categories, images, variants)
- Shopping cart & order lifecycle management
- Inventory tracking & stock management
- Advanced search & filtering with pagination

### 💳 Payment Integration
- Stripe payment processing
- Multiple payment methods (cards, wallets, bank transfers)
- Webhook handling & automatic order updates
- Refund system

### 📦 Digital Products
- License key generation & validation
- Automatic delivery after payment
- Key encryption & expiration management

### 👥 User & Admin Features
- User profiles, order history & wishlist
- Address book management
- Admin dashboard, analytics & sales reports

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** MongoDB, Mongoose  
- **Authentication:** JWT, bcrypt  
- **Payments:** Stripe  
- **Security:** Helmet.js, Express Validator, Speakeasy (2FA)  
- **Utilities:** QRCode generation, input validation  

---

## ⚡ Quick Start

### Prerequisites
```bash
Node.js >= 18
MongoDB >= 5
Stripe Account
````

### Installation

```bash
git clone https://github.com/username/digitalcommerce-backend.git
cd digitalcommerce-backend
npm install
cp .env.example .env
# Update .env with your credentials
npm run dev
```

### Environment Variables

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
STRIPE_SECRET_KEY=your_stripe_secret_key
FRONTEND_URL=http://localhost:3000
PORT=5000
```

---

## 📂 Project Structure

```
src/
├── config/          # Database & environment config
├── controllers/     # Route controllers
├── models/          # Mongoose schemas
├── routes/          # API endpoints
├── middleware/      # Authentication & error handling
├── utils/           # Helper functions
└── server.js        # Entry point
```

---

## 📄 API Endpoints

### Authentication

```
POST   /api/auth/register       # Register new user
POST   /api/auth/login          # Login user
GET    /api/auth/me             # Get current user
POST   /api/auth/logout         # Logout user
```

### Products

```
GET    /api/products
GET    /api/products/:id
POST   /api/products       # Admin only
PUT    /api/products/:id   # Admin only
DELETE /api/products/:id   # Admin only
```

### Cart

```
GET    /api/cart
POST   /api/cart
PUT    /api/cart/:id
DELETE /api/cart/:id
```

### Orders

```
POST   /api/orders
GET    /api/orders/myorders
GET    /api/orders/:id
GET    /api/orders         # Admin only
```

---

## 📄 License

This project is released under a **commercial license**. See [LICENSE.md](LICENSE.md) for full details.

---

**Made with ❤️ by DigitalCommerce Team**
© 2025 All rights reserved.


## 💖 Support / Donate

If you find this project helpful, you can support me with cryptocurrency:

| Coin | Address |
|------|---------|
| BTC  | `bc1qm6yycxa7fhvqxanw26h823rd5jm2c9t85ymnhm
` | 
| ETH  | `0xe74620c35f8ac5f77deba0cfc6beae91ad887f1f
` | 
| SOL | `CdHRmNuwMiovqHtANnLAzQd9axgijd1WdHPqh5zUzpoU` | 

> Tip: Copy the address to your crypto wallet to send a donation. Thank you! 🙏

```
