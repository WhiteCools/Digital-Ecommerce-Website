import mongoose from 'mongoose';

// Digital Order Item Schema (with delivered keys/accounts)
const digitalOrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'DigitalProduct',
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  // 🎁 DELIVERED ITEMS (keys/accounts)
  deliveredItems: [
    {
      inventoryItemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      // This is already encrypted in DigitalProduct.inventory
      // We just store the reference here
      deliveredAt: {
        type: Date,
        default: Date.now,
      },
      // Status tracking
      viewed: {
        type: Boolean,
        default: false,
      },
      viewedAt: {
        type: Date,
      },
    },
  ],
});

const digitalOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [digitalOrderItemSchema],
    // Contact info (no shipping needed for digital products)
    contactEmail: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Card', 'PayPal', 'Crypto'],
      default: 'Card',
    },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    // No shipping for digital products
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    // 🎁 Digital delivery status
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    // Auto-delivery status
    autoDeliveryStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    autoDeliveryError: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    // Notes from admin
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// 📊 VIRTUAL: Total items delivered
digitalOrderSchema.virtual('totalItemsDelivered').get(function () {
  let total = 0;
  this.orderItems.forEach((item) => {
    total += item.deliveredItems.length;
  });
  return total;
});

// ✅ METHOD: Mark order as delivered
digitalOrderSchema.methods.markAsDelivered = function () {
  this.isDelivered = true;
  this.deliveredAt = Date.now();
  this.status = 'Completed';
  this.autoDeliveryStatus = 'completed';
  return this.save();
};

// 📧 METHOD: Mark item as viewed by customer
digitalOrderSchema.methods.markItemViewed = function (orderItemId, deliveredItemId) {
  const orderItem = this.orderItems.id(orderItemId);
  if (!orderItem) {
    throw new Error('Order item not found');
  }

  const deliveredItem = orderItem.deliveredItems.id(deliveredItemId);
  if (!deliveredItem) {
    throw new Error('Delivered item not found');
  }

  deliveredItem.viewed = true;
  deliveredItem.viewedAt = Date.now();
  return this.save();
};

// Indexes
digitalOrderSchema.index({ user: 1, createdAt: -1 });
digitalOrderSchema.index({ isPaid: 1 });
digitalOrderSchema.index({ status: 1 });
digitalOrderSchema.index({ 'paymentResult.id': 1 }, { unique: true, sparse: true }); // Prevent payment reuse

const DigitalOrder = mongoose.model('DigitalOrder', digitalOrderSchema);

export default DigitalOrder;