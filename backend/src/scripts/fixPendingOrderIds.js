import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import DigitalProduct from '../models/DigitalProduct.js';
import connectDB from '../config/database.js';

// Load env vars
dotenv.config();

const fixPendingOrderIds = async () => {
  try {
    await connectDB();

    console.log('🔍 Checking for corrupted orderId fields...'.yellow);

    const products = await DigitalProduct.find({});
    let fixedCount = 0;

    for (const product of products) {
      let needsSave = false;

      for (const item of product.inventory) {
        // Check if orderId is a string 'pending' or any invalid value
        if (item.orderId && typeof item.orderId === 'string') {
          console.log(`❌ Found invalid orderId in ${product.name}: "${item.orderId}"`.red);
          item.orderId = null;
          needsSave = true;
          fixedCount++;
        }
      }

      if (needsSave) {
        // Use validateBeforeSave: false to bypass validation
        await product.save({ validateBeforeSave: false });
        console.log(`✅ Fixed ${product.name}`.green);
      }
    }

    if (fixedCount === 0) {
      console.log('✅ No corrupted data found. Database is clean!'.green.bold);
    } else {
      console.log(`\n✅ Fixed ${fixedCount} corrupted orderId fields!`.green.bold);
    }

    console.log('\n🎉 Database cleanup complete!'.cyan.bold);
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:'.red, error.message);
    process.exit(1);
  }
};

fixPendingOrderIds();
