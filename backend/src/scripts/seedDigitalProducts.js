// Load env vars FIRST
import dotenv from 'dotenv';
dotenv.config();

// Now import everything else
import mongoose from 'mongoose';
import colors from 'colors';
import DigitalProduct from '../models/DigitalProduct.js';
import connectDB from '../config/database.js';

// Sample Digital Products
const digitalProducts = [
  {
    name: 'Discord Nitro Gift - 1 Month',
    description: 'Premium Discord Nitro subscription for 1 month. Unlock exclusive features, custom emojis, HD video, and more!',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800',
    category: 'Discord Nitro',
    productType: 'code',
    featured: true,
    deliveryInstructions: 'Copy the code and redeem it at discord.com/gifts',
    warranty: 7,
    region: 'Global',
    tags: ['discord', 'nitro', 'gaming', 'chat'],
  },
  {
    name: 'Steam Random Game Key',
    description: 'Surprise! Get a random Steam game key. Could be indie gems or popular titles. Instant delivery after payment.',
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800',
    category: 'Steam Keys',
    productType: 'key',
    featured: true,
    deliveryInstructions: 'Activate on Steam by going to Games > Activate a Product on Steam',
    warranty: 3,
    region: 'Global',
    tags: ['steam', 'game', 'pc', 'random'],
  },
  {
    name: 'Netflix Premium Account - 1 Month',
    description: 'Premium Netflix account with 4K Ultra HD access. Watch on up to 4 devices simultaneously.',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800',
    category: 'Netflix',
    productType: 'account',
    featured: true,
    deliveryInstructions: 'Login using the provided email and password. DO NOT change password.',
    warranty: 30,
    region: 'Global',
    tags: ['netflix', 'streaming', 'movies', 'tv'],
  },
  {
    name: 'Spotify Premium - 3 Months',
    description: 'Premium Spotify subscription. Ad-free music, offline downloads, and unlimited skips.',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1614680376408-81e91ffe3db7?w=800',
    category: 'Spotify',
    productType: 'account',
    featured: false,
    deliveryInstructions: 'Login with provided credentials. You can use on mobile and desktop.',
    warranty: 90,
    region: 'Global',
    tags: ['spotify', 'music', 'streaming', 'premium'],
  },
  {
    name: 'YouTube Premium - 1 Month',
    description: 'YouTube Premium with ad-free videos, background play, and YouTube Music access.',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800',
    category: 'YouTube Premium',
    productType: 'account',
    featured: false,
    deliveryInstructions: 'Use the account to access YouTube Premium features. DO NOT logout other devices.',
    warranty: 30,
    region: 'Global',
    tags: ['youtube', 'video', 'music', 'premium'],
  },
  {
    name: 'Epic Games Account - Random Games',
    description: 'Epic Games account loaded with random free games. Instant access to your game library.',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
    category: 'Game Accounts',
    productType: 'account',
    featured: false,
    deliveryInstructions: 'Login to Epic Games Launcher. Full access email provided.',
    warranty: 7,
    region: 'Global',
    tags: ['epic', 'games', 'pc', 'account'],
  },
  {
    name: 'Xbox Game Pass Ultimate - 1 Month',
    description: 'Access to 100+ high-quality games on console, PC, and cloud. Includes Xbox Live Gold.',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800',
    category: 'Xbox Game Pass',
    productType: 'code',
    featured: true,
    deliveryInstructions: 'Redeem code on Xbox.com or Xbox console',
    warranty: 7,
    region: 'Global',
    tags: ['xbox', 'gamepass', 'microsoft', 'gaming'],
  },
  {
    name: 'PlayStation Plus - 1 Month',
    description: 'Online multiplayer, monthly games, and exclusive discounts for PlayStation.',
    price: 11.99,
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800',
    category: 'PlayStation Plus',
    productType: 'code',
    featured: false,
    deliveryInstructions: 'Redeem on PlayStation Store',
    warranty: 7,
    region: 'Global',
    tags: ['playstation', 'ps', 'gaming', 'online'],
  },
  {
    name: 'Steam Wallet Gift Card - $10',
    description: 'Add $10 to your Steam Wallet. Buy games, DLC, and in-game items.',
    price: 10.99,
    image: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800',
    category: 'Gift Cards',
    productType: 'code',
    featured: false,
    deliveryInstructions: 'Redeem code in Steam Wallet section',
    warranty: 3,
    region: 'Global',
    tags: ['steam', 'wallet', 'giftcard', 'money'],
  },
  {
    name: 'NordVPN Premium - 1 Month',
    description: 'Secure VPN with 5400+ servers worldwide. Protect your privacy and bypass restrictions.',
    price: 7.99,
    image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800',
    category: 'VPN',
    productType: 'account',
    featured: false,
    deliveryInstructions: 'Login to NordVPN app with provided credentials',
    warranty: 30,
    region: 'Global',
    tags: ['vpn', 'security', 'privacy', 'nord'],
  },
];

// Sample inventory items (keys/accounts) - THESE WILL BE ENCRYPTED
const sampleInventory = {
  'Discord Nitro Gift - 1 Month': [
    'DISCORD-NITRO-XXXX-YYYY-ZZZZ-1111',
    'DISCORD-NITRO-AAAA-BBBB-CCCC-2222',
    'DISCORD-NITRO-DDDD-EEEE-FFFF-3333',
  ],
  'Steam Random Game Key': [
    'STEAM-KEY-XXXXX-YYYYY-ZZZZZ',
    'STEAM-KEY-AAAAA-BBBBB-CCCCC',
    'STEAM-KEY-DDDDD-EEEEE-FFFFF',
    'STEAM-KEY-GGGGG-HHHHH-IIIII',
  ],
  'Netflix Premium Account - 1 Month': [
    'netflix.user1@example.com:SecurePass123!',
    'netflix.user2@example.com:SecurePass456!',
  ],
  'Spotify Premium - 3 Months': [
    'spotify.user1@example.com:SpotifyPass789!',
    'spotify.user2@example.com:SpotifyPass012!',
  ],
  'YouTube Premium - 1 Month': [
    'youtube.user1@example.com:YouTubePass345!',
  ],
  'Epic Games Account - Random Games': [
    'epicgamer1@example.com:EpicPass678!',
  ],
  'Xbox Game Pass Ultimate - 1 Month': [
    'XBOX-GAMEPASS-XXXXX-YYYYY-ZZZZZ',
    'XBOX-GAMEPASS-AAAAA-BBBBB-CCCCC',
  ],
  'PlayStation Plus - 1 Month': [
    'PS-PLUS-XXXXX-YYYYY-ZZZZZ',
  ],
  'Steam Wallet Gift Card - $10': [
    'STEAM-WALLET-XXXXX-YYYYY',
    'STEAM-WALLET-AAAAA-BBBBB',
    'STEAM-WALLET-CCCCC-DDDDD',
  ],
  'NordVPN Premium - 1 Month': [
    'nordvpn.user1@example.com:NordPass999!',
  ],
};

const seedDigitalProducts = async () => {
  try {
    await connectDB();

    console.log('🗑️  Deleting existing digital products...'.yellow);
    await DigitalProduct.deleteMany();

    console.log('📦 Creating digital products...'.cyan);

    // Create admin user ID (you need to replace this with actual admin ID)
    const adminId = new mongoose.Types.ObjectId();

    for (const productData of digitalProducts) {
      // Create product
      const product = await DigitalProduct.create(productData);
      console.log(`✅ Created: ${product.name}`.green);

      // Add inventory items (will be encrypted automatically)
      if (sampleInventory[product.name]) {
        const items = sampleInventory[product.name];
        for (const item of items) {
          await DigitalProduct.addInventoryItem(product._id, item, adminId);
        }
        console.log(`   📦 Added ${items.length} encrypted items`.gray);
      }
    }

    // Display summary
    const allProducts = await DigitalProduct.find();
    console.log('\n📊 Summary:'.cyan.bold);
    console.log(`   Total Products: ${allProducts.length}`.green);
    
    let totalStock = 0;
    allProducts.forEach((p) => {
      totalStock += p.stock;
      console.log(`   - ${p.name}: ${p.stock} items`.gray);
    });
    console.log(`   Total Stock: ${totalStock} encrypted items`.green.bold);

    console.log('\n✅ Digital products seeded successfully!'.green.bold);
    console.log('🔒 All keys/accounts are encrypted in database!'.yellow.bold);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:'.red, error.message);
    process.exit(1);
  }
};

seedDigitalProducts();