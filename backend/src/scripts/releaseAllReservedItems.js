// Load env vars FIRST
import dotenv from 'dotenv';
dotenv.config();

// Now import everything else
import mongoose from 'mongoose';
import colors from 'colors';
import DigitalProduct from '../models/DigitalProduct.js';
import connectDB from '../config/database.js';

const releaseAllReservedItems = async () => {
  try {
    await connectDB();

    console.log('🔓 Releasing all reserved/sold items...'.yellow);

    // Get all products
    const products = await DigitalProduct.find({});
    
    let totalReleased = 0;

    for (const product of products) {
      let productReleased = 0;
      
      for (const item of product.inventory) {
        if (item.status === 'reserved' || item.status === 'sold') {
          item.status = 'available';
          item.soldTo = undefined;
          item.orderId = undefined;
          item.soldAt = undefined;
          productReleased++;
          totalReleased++;
        }
      }
      
      if (productReleased > 0) {
        await product.save();
        await product.updateStock();
        console.log(`✅ ${product.name}: Released ${productReleased} items, Stock now: ${product.stock}`.green);
      }
    }

    console.log(`\n✅ Total items released: ${totalReleased}`.green.bold);
    console.log('✅ All stock refreshed!'.green.bold);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:'.red, error.message);
    process.exit(1);
  }
};

releaseAllReservedItems();