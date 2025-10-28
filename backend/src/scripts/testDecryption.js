import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import DigitalProduct from '../models/DigitalProduct.js';
import DigitalOrder from '../models/DigitalOrder.js';
import connectDB from '../config/database.js';

// Load env vars
dotenv.config();

const testDecryption = async () => {
  try {
    await connectDB();

    console.log('🔍 Testing decryption...'.yellow);
    console.log('ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY.length);

    // Get a product with inventory
    const product = await DigitalProduct.findOne({ 'inventory.0': { $exists: true } });
    
    if (!product) {
      console.log('❌ No products with inventory found'.red);
      process.exit(1);
    }

    console.log(`\n✅ Found product: ${product.name}`.green);
    console.log(`   Inventory items: ${product.inventory.length}`);

    // Try to decrypt first item
    const firstItem = product.inventory[0];
    console.log(`\n📦 First inventory item:`);
    console.log(`   ID: ${firstItem._id}`);
    console.log(`   Status: ${firstItem.status}`);
    console.log(`   Content (encrypted): ${firstItem.content.substring(0, 50)}...`);

    try {
      const decrypted = product.getDecryptedContent(firstItem._id);
      console.log(`\n✅ Decryption SUCCESS!`.green.bold);
      console.log(`   Decrypted content: ${decrypted}`);
    } catch (error) {
      console.log(`\n❌ Decryption FAILED!`.red.bold);
      console.log(`   Error: ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
    }

    // Check if there are any orders
    const orders = await DigitalOrder.find({}).limit(1);
    if (orders.length > 0) {
      console.log(`\n📋 Found ${orders.length} order(s)`);
      const order = orders[0];
      console.log(`   Order ID: ${order._id}`);
      console.log(`   Order items: ${order.orderItems.length}`);
      
      if (order.orderItems[0] && order.orderItems[0].deliveredItems.length > 0) {
        const deliveredItem = order.orderItems[0].deliveredItems[0];
        console.log(`   Delivered item ID: ${deliveredItem.inventoryItemId}`);
        
        // Try to find and decrypt this item
        const orderProduct = await DigitalProduct.findById(order.orderItems[0].product);
        if (orderProduct) {
          try {
            const decrypted = orderProduct.getDecryptedContent(deliveredItem.inventoryItemId);
            console.log(`   ✅ Order item decryption SUCCESS: ${decrypted}`);
          } catch (error) {
            console.log(`   ❌ Order item decryption FAILED: ${error.message}`);
          }
        }
      }
    } else {
      console.log(`\n📋 No orders found`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:'.red, error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testDecryption();
