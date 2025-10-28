// Load env vars FIRST
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import colors from 'colors';
import DigitalProduct from '../models/DigitalProduct.js';
import connectDB from '../config/database.js';

const checkInventory = async () => {
  try {
    await connectDB();
    const products = await DigitalProduct.find({});
    console.log('\n?? INVENTORY STATUS:\n');
    products.forEach(p => {
      console.log(p.name);
      console.log('  Stock field:', p.stock);
      console.log('  Inventory count:', p.inventory.length);
      const statuses = {};
      p.inventory.forEach(i => { statuses[i.status] = (statuses[i.status] || 0) + 1; });
      console.log('  Status:', JSON.stringify(statuses));
      console.log('');
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};
checkInventory();
