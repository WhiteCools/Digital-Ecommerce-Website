import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import DigitalOrder from '../models/DigitalOrder.js';
import DigitalProduct from '../models/DigitalProduct.js';
import connectDB from '../config/database.js';

// Load env vars
dotenv.config();

const fixBrokenOrders = async () => {
  try {
    await connectDB();

    console.log('🔍 Checking for broken orders...'.yellow);

    const orders = await DigitalOrder.find({});
    let fixedCount = 0;
    let deletedCount = 0;

    for (const order of orders) {
      let needsDelete = false;

      // Check if order has items with missing deliveredItems
      for (const orderItem of order.orderItems) {
        if (!orderItem.deliveredItems || orderItem.deliveredItems.length === 0) {
          console.log(`❌ Order ${order._id} has no delivered items`.red);
          needsDelete = true;
          break;
        }

        // Check if product exists
        const product = await DigitalProduct.findById(orderItem.product);
        if (!product) {
          console.log(`❌ Order ${order._id} references deleted product ${orderItem.product}`.red);
          needsDelete = true;
          break;
        }

        // Check if inventory items are valid
        for (const deliveredItem of orderItem.deliveredItems) {
          const inventoryItem = product.inventory.id(deliveredItem.inventoryItemId);
          if (!inventoryItem) {
            console.log(`❌ Order ${order._id} references missing inventory item`.red);
            needsDelete = true;
            break;
          }
        }
      }

      if (needsDelete) {
        // Release any reserved items back to available
        for (const orderItem of order.orderItems) {
          const product = await DigitalProduct.findById(orderItem.product);
          if (product) {
            for (const deliveredItem of orderItem.deliveredItems) {
              const inventoryItem = product.inventory.id(deliveredItem.inventoryItemId);
              if (inventoryItem && inventoryItem.orderId && inventoryItem.orderId.toString() === order._id.toString()) {
                inventoryItem.status = 'available';
                inventoryItem.soldTo = undefined;
                inventoryItem.orderId = undefined;
                inventoryItem.soldAt = undefined;
                await product.save();
                await product.updateStock();
                console.log(`✅ Released inventory item back to available`.green);
              }
            }
          }
        }

        // Delete the broken order
        await DigitalOrder.findByIdAndDelete(order._id);
        console.log(`🗑️  Deleted broken order ${order._id}`.yellow);
        deletedCount++;
      }
    }

    console.log(`\n📊 Summary:`.cyan.bold);
    console.log(`   Broken orders deleted: ${deletedCount}`.yellow);
    console.log(`   Healthy orders: ${orders.length - deletedCount}`.green);

    if (deletedCount === 0) {
      console.log('\n✅ All orders are healthy!'.green.bold);
    } else {
      console.log('\n✅ Database cleanup complete!'.green.bold);
      console.log('💡 You can now try placing a new order.'.cyan);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:'.red, error.message);
    process.exit(1);
  }
};

fixBrokenOrders();
