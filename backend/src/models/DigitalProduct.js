import mongoose from 'mongoose';
import crypto from 'crypto';

// Encryption key from environment (MUST BE 32 characters)
if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ FATAL ERROR: ENCRYPTION_KEY is not defined in environment variables!');
  console.error('❌ Cannot encrypt/decrypt without a valid key!');
  throw new Error('ENCRYPTION_KEY is required in .env file');
}

if (process.env.ENCRYPTION_KEY.length !== 32) {
  console.error(`❌ FATAL ERROR: ENCRYPTION_KEY must be exactly 32 characters, got ${process.env.ENCRYPTION_KEY.length}`);
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

console.log('🔐 DigitalProduct model loaded with ENCRYPTION_KEY (length: ' + ENCRYPTION_KEY.length + ')');
// NEVER log the actual encryption key in production!

// 🔒 ENCRYPTION FUNCTIONS
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Digital Inventory Item Schema (Keys/Accounts stored here)
const inventoryItemSchema = new mongoose.Schema(
  {
    // 🔒 ENCRYPTED data (key, email:password, atau code)
    content: {
      type: String,
      required: true,
    },
    // Status tracking
    status: {
      type: String,
      enum: ['available', 'sold', 'reserved'],
      default: 'available',
    },
    // Who bought it
    soldTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // When it was sold
    soldAt: {
      type: Date,
    },
    // Associated order
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    // Metadata
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Digital Product Schema
const digitalProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add product name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add product description'],
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please add product price'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      required: [true, 'Please add product image'],
    },
    images: {
      type: [String],
      default: [],
    },
    // 🎮 DIGITAL PRODUCT CATEGORIES
    category: {
      type: String,
      required: [true, 'Please add product category'],
      enum: {
        values: [
          'Discord Nitro',
          'Steam Keys',
          'Epic Games',
          'Netflix',
          'Spotify',
          'YouTube Premium',
          'Game Accounts',
          'Xbox Game Pass',
          'PlayStation Plus',
          'Gift Cards',
          'VPN',
          'Other Digital',
        ],
        message: '{VALUE} is not a valid category',
      },
    },
    // 📦 INVENTORY (stored encrypted keys/accounts)
    inventory: [inventoryItemSchema],
    // Available stock (auto-calculated)
    stock: {
      type: Number,
      default: 0,
    },
    // Total sold count
    totalSold: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // 🎁 PRODUCT TYPE
    productType: {
      type: String,
      enum: ['key', 'account', 'code', 'link'],
      required: true,
      default: 'key',
    },
    // Delivery instructions
    deliveryInstructions: {
      type: String,
      default: 'Your code will be delivered automatically after payment.',
    },
    // Warranty/Guarantee period (in days)
    warranty: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Tags for search
    tags: {
      type: [String],
      default: [],
    },
    // Region/Platform specific
    region: {
      type: String,
      default: 'Global',
    },
    // 💰 DISCOUNT/PROMO
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
      },
      value: {
        type: Number,
        min: 0,
      },
      startDate: Date,
      endDate: Date,
    },
    // ⚡ FLASH SALE
    flashSale: {
      active: {
        type: Boolean,
        default: false,
      },
      price: {
        type: Number,
        min: 0,
      },
      startDate: Date,
      endDate: Date,
      limitedStock: Number,
      soldCount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 VIRTUAL: Get available stock count
digitalProductSchema.virtual('availableStock').get(function () {
  return this.inventory.filter((item) => item.status === 'available').length;
});

// 💰 VIRTUAL: Get effective price (with discounts/flash sale)
digitalProductSchema.virtual('effectivePrice').get(function () {
  const now = new Date();
  
  // Check flash sale first (highest priority)
  if (this.flashSale?.active && this.flashSale?.price) {
    const flashStart = this.flashSale.startDate ? new Date(this.flashSale.startDate) : null;
    const flashEnd = this.flashSale.endDate ? new Date(this.flashSale.endDate) : null;
    
    // Check if flash sale is currently active
    const isFlashActive = (!flashStart || now >= flashStart) && (!flashEnd || now <= flashEnd);
    
    // Check if stock limit reached
    const stockAvailable = !this.flashSale.limitedStock || this.flashSale.soldCount < this.flashSale.limitedStock;
    
    if (isFlashActive && stockAvailable) {
      return this.flashSale.price;
    }
  }
  
  // Check regular discount
  if (this.discount?.type && this.discount?.value) {
    const discountStart = this.discount.startDate ? new Date(this.discount.startDate) : null;
    const discountEnd = this.discount.endDate ? new Date(this.discount.endDate) : null;
    
    // Check if discount is currently active
    const isDiscountActive = (!discountStart || now >= discountStart) && (!discountEnd || now <= discountEnd);
    
    if (isDiscountActive) {
      if (this.discount.type === 'percentage') {
        return this.price - (this.price * this.discount.value / 100);
      } else if (this.discount.type === 'fixed') {
        return Math.max(0, this.price - this.discount.value);
      }
    }
  }
  
  // Return base price if no discounts
  return this.price;
});

// 📊 METHOD: Update stock count
digitalProductSchema.methods.updateStock = function () {
  this.stock = this.inventory.filter((item) => item.status === 'available').length;
  return this.save();
};

// 🎁 METHOD: Get next available item
digitalProductSchema.methods.getNextAvailableItem = function () {
  return this.inventory.find((item) => item.status === 'available');
};

// 🔒 METHOD: Reserve item for order
digitalProductSchema.methods.reserveItem = async function (userId, orderId) {
  const item = this.getNextAvailableItem();
  if (!item) {
    throw new Error('No stock available');
  }

  // Validate orderId - must be ObjectId or null/undefined
  if (orderId !== null && orderId !== undefined) {
    if (typeof orderId === 'string' && !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid orderId: must be a valid ObjectId or null');
    }
  }

  item.status = 'reserved';
  item.soldTo = userId;
  item.orderId = orderId || undefined; // Convert null to undefined for MongoDB
  await this.save();
  await this.updateStock();

  return item;
};

// ✅ METHOD: Mark item as sold
digitalProductSchema.methods.markAsSold = async function (itemId) {
  const item = this.inventory.id(itemId);
  if (!item) {
    throw new Error('Item not found');
  }

  item.status = 'sold';
  item.soldAt = Date.now();
  this.totalSold += 1;
  await this.save();
  await this.updateStock();

  return item;
};

// 🔓 METHOD: Decrypt and get item content
digitalProductSchema.methods.getDecryptedContent = function (itemId) {
  const item = this.inventory.id(itemId);
  if (!item) {
    throw new Error('Item not found');
  }

  try {
    return decrypt(item.content);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt content');
  }
};

// 🔒 STATIC METHOD: Add new inventory item (encrypted)
digitalProductSchema.statics.addInventoryItem = async function (
  productId,
  content,
  addedBy
) {
  const product = await this.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  // Encrypt the content before storing
  const encryptedContent = encrypt(content);

  product.inventory.push({
    content: encryptedContent,
    status: 'available',
    addedBy: addedBy,
  });

  await product.save();
  await product.updateStock();

  console.log(`✅ Added encrypted item to ${product.name}`);
  return product;
};

// Indexes for performance
digitalProductSchema.index({ name: 'text', description: 'text' });
digitalProductSchema.index({ category: 1 });
digitalProductSchema.index({ price: 1 });
digitalProductSchema.index({ stock: 1 });
digitalProductSchema.index({ 'inventory.status': 1 });

const DigitalProduct = mongoose.model('DigitalProduct', digitalProductSchema);

export default DigitalProduct;
export { encrypt, decrypt };