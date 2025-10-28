import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import DigitalOrder from '../models/DigitalOrder.js';
import DigitalProduct from '../models/DigitalProduct.js';
import connectDB from '../config/database.js';

// Load env vars
dotenv.config();

const clearDigitalOrders = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing all digital orders...'.yellow);

    // Get all orders to release inventory
    const orders = await DigitalOrder.find({});
    
    console.log(`Found ${orders.length} orders to clear`.cyan);

    // Release all reserved/sold items back to available
    for (const order of orders) {
      for (const orderItem of order.orderItems) {
        const product = await DigitalProduct.findById(orderItem.product);
        if (product) {
          for (const deliveredItem of orderItem.deliveredItems) {
            const inventoryItem = product.inventory.id(deliveredItem.inventoryItemId);
            if (inventoryItem) {
              inventoryItem.status = 'available';
              inventoryItem.soldTo = undefined;
              inventoryItem.orderId = undefined;
              inventoryItem.soldAt = undefined;
              console.log(`  ✅ Released item from ${product.name}`.green);
            }
          }
          await product.save();
          await product.updateStock();
        }
      }
    }

    // Delete all digital orders
    const result = await DigitalOrder.deleteMany({});
    
    console.log(`\n🗑️  Deleted ${result.deletedCount} digital orders`.yellow);
    
    // Show updated inventory
    const products = await DigitalProduct.find({});
    console.log(`\n📦 Updated Inventory:`.cyan.bold);
    products.forEach(p => {
      console.log(`   ${p.name}: ${p.stock} available`.green);
    });

    console.log('\n✅ All digital orders cleared! You can now place new orders.'.green.bold);
    process.exit(0);
  } catch (error) {
    console.error('❌ Clear failed:'.red, error.message);
    process.exit(1);
  }
};

clearDigitalOrders();
