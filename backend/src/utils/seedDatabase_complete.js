import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import connectDB from '../config/database.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const users = [
  {
    name: 'Admin User',
          email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  },
  {
      name: 'Test User 2',
  email: 'testuser2@example.com',
    password: 'password123',
    role: 'user',
    phone: '+60123456789',
    address: {
      street: '123 Jalan Bukit Bintang',
      city: 'Kuala Lumpur',
      state: 'Wilayah Persekutuan',
      zipCode: '50000',
      country: 'Malaysia',
    },
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
  },
];

const products = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'Latest Apple iPhone with A17 Pro chip, titanium design, and advanced camera system. Experience the ultimate smartphone with groundbreaking features.',
    price: 1299.99,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
      'https://images.unsplash.com/photo-1695048133082-c2cc4e095a2c?w=800',
    ],
    category: 'Electronics',
    stock: 50,
    rating: 4.8,
    numReviews: 124,
    featured: true,
    brand: 'Apple',
    tags: ['smartphone', 'flagship', '5G', 'iOS'],
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Powerful Android flagship with S Pen, 200MP camera, and AI features. The ultimate productivity and creativity device.',
    price: 1199.99,
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
    category: 'Electronics',
    stock: 45,
    rating: 4.7,
    numReviews: 98,
    featured: true,
    brand: 'Samsung',
    tags: ['smartphone', 'android', '5G', 'S Pen'],
  },
  {
    name: 'MacBook Pro 16" M3 Max',
    description: 'Professional laptop with M3 Max chip, stunning Liquid Retina XDR display. Perfect for creators and developers.',
    price: 2499.99,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
    category: 'Electronics',
    stock: 30,
    rating: 4.9,
    numReviews: 156,
    featured: true,
    brand: 'Apple',
    tags: ['laptop', 'macbook', 'M3', 'professional'],
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise cancelling headphones with premium sound quality. Experience music like never before.',
    price: 399.99,
    image: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=800',
    category: 'Electronics',
    stock: 80,
    rating: 4.8,
    numReviews: 234,
    featured: false,
    brand: 'Sony',
    tags: ['headphones', 'wireless', 'noise-cancelling', 'premium'],
  },
  {
    name: 'Nike Air Jordan 1 Retro',
    description: 'Classic basketball sneakers with iconic design. A must-have for sneaker enthusiasts and collectors.',
    price: 179.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    category: 'Fashion',
    stock: 100,
    rating: 4.6,
    numReviews: 189,
    featured: true,
    brand: 'Nike',
    tags: ['sneakers', 'jordan', 'basketball', 'streetwear'],
  },
  {
    name: 'Adidas Ultraboost 23',
    description: 'Premium running shoes with responsive cushioning and energy return. Perfect for runners of all levels.',
    price: 189.99,
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800',
    category: 'Sports',
    stock: 75,
    rating: 4.7,
    numReviews: 167,
    featured: false,
    brand: 'Adidas',
    tags: ['running', 'sports', 'comfortable', 'performance'],
  },
  {
    name: 'Minimalist Watch Classic',
    description: 'Elegant minimalist watch with leather strap. Perfect accessory for any occasion, combines style and functionality.',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    category: 'Fashion',
    stock: 60,
    rating: 4.5,
    numReviews: 92,
    featured: false,
    brand: 'Daniel Wellington',
    tags: ['watch', 'minimalist', 'fashion', 'accessories'],
  },
  {
    name: 'Smart LED Desk Lamp',
    description: 'Modern desk lamp with adjustable brightness and color temperature. Eye-caring design for work and study.',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
    category: 'Home',
    stock: 120,
    rating: 4.4,
    numReviews: 78,
    featured: false,
    brand: 'Xiaomi',
    tags: ['lamp', 'smart', 'LED', 'desk'],
  },
  {
    name: 'Wireless Gaming Mouse',
    description: 'High-performance gaming mouse with RGB lighting and customizable buttons. Precision and speed for gamers.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',
    category: 'Electronics',
    stock: 95,
    rating: 4.6,
    numReviews: 145,
    featured: false,
    brand: 'Logitech',
    tags: ['gaming', 'mouse', 'wireless', 'RGB'],
  },
  {
    name: 'Premium Leather Backpack',
    description: 'Stylish leather backpack with laptop compartment. Perfect for work, travel, and everyday use.',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    category: 'Fashion',
    stock: 55,
    rating: 4.7,
    numReviews: 112,
    featured: false,
    brand: 'Herschel',
    tags: ['backpack', 'leather', 'travel', 'laptop'],
  },
  {
    name: 'Yoga Mat Pro',
    description: 'Non-slip yoga mat with extra cushioning. Perfect for yoga, pilates, and fitness exercises.',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800',
    category: 'Sports',
    stock: 150,
    rating: 4.5,
    numReviews: 203,
    featured: false,
    brand: 'Lululemon',
    tags: ['yoga', 'fitness', 'mat', 'exercise'],
  },
  {
    name: '4K Smart TV 55"',
    description: 'Ultra HD Smart TV with HDR and streaming apps. Cinema-quality entertainment at home.',
    price: 699.99,
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800',
    category: 'Electronics',
    stock: 25,
    rating: 4.6,
    numReviews: 87,
    featured: true,
    brand: 'Samsung',
    tags: ['TV', '4K', 'smart', 'entertainment'],
  },
];

const importData = async () => {
  try {
    // Clear existing data
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log('✅ Database cleared'.red.inverse);

    // Insert users
    const createdUsers = await User.create(users);
    console.log(`✅ ${createdUsers.length} users created`.green.inverse);

    // Insert products
    const createdProducts = await Product.create(products);
    console.log(`✅ ${createdProducts.length} products created`.green.inverse);

    console.log('\n🎉 Database seeded successfully!'.green.inverse.bold);
    console.log('\n📋 Test Accounts:'.cyan.bold);
          console.log('   Admin: admin@example.com / admin123'.yellow);
      console.log('   User:  testuser2@example.com / password123'.yellow);
    console.log('\n');
    
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log('✅ Data Destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}