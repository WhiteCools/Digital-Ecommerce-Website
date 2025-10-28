import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Tag, Zap, Percent, Calendar, Save, Loader } from 'lucide-react';
import api from '../../services/api';
import { useToastContext } from '../../context/ToastContext';

const EditProductModal = ({ isOpen, onClose, product, onSuccess }) => {
  const toast = useToastContext();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    deliveryInstructions: '',
    featured: false,
    
    // Promo fields
    discountType: 'none', // 'none', 'percentage', 'fixed'
    discountValue: '',
    discountStartDate: '',
    discountEndDate: '',
    
    // Flash sale fields
    isFlashSale: false,
    flashSalePrice: '',
    flashSaleStart: '',
    flashSaleEnd: '',
    flashSaleStock: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category || '',
        image: product.image || '',
        deliveryInstructions: product.deliveryInstructions || '',
        featured: product.featured || false,
        
        discountType: product.discount?.type || 'none',
        discountValue: product.discount?.value || '',
        discountStartDate: product.discount?.startDate ? new Date(product.discount.startDate).toISOString().slice(0, 16) : '',
        discountEndDate: product.discount?.endDate ? new Date(product.discount.endDate).toISOString().slice(0, 16) : '',
        
        isFlashSale: product.flashSale?.active || false,
        flashSalePrice: product.flashSale?.price || '',
        flashSaleStart: product.flashSale?.startDate ? new Date(product.flashSale.startDate).toISOString().slice(0, 16) : '',
        flashSaleEnd: product.flashSale?.endDate ? new Date(product.flashSale.endDate).toISOString().slice(0, 16) : '',
        flashSaleStock: product.flashSale?.limitedStock || '',
      });
    }
  }, [product]);

  const categories = [
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
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const calculateDiscountedPrice = () => {
    const price = parseFloat(formData.price);
    if (formData.discountType === 'percentage') {
      return (price - (price * parseFloat(formData.discountValue) / 100)).toFixed(2);
    } else if (formData.discountType === 'fixed') {
      return (price - parseFloat(formData.discountValue)).toFixed(2);
    }
    return price.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate
      if (!formData.name || !formData.price) {
        toast.error('Name and price are required');
        setLoading(false);
        return;
      }

      if (parseFloat(formData.price) <= 0) {
        toast.error('Price must be greater than 0');
        setLoading(false);
        return;
      }

      // Build update payload
      const updateData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image: formData.image,
        deliveryInstructions: formData.deliveryInstructions,
        featured: formData.featured,
      };

      // Add discount if set
      if (formData.discountType !== 'none' && formData.discountValue) {
        updateData.discount = {
          type: formData.discountType,
          value: parseFloat(formData.discountValue),
          startDate: formData.discountStartDate ? new Date(formData.discountStartDate) : null,
          endDate: formData.discountEndDate ? new Date(formData.discountEndDate) : null,
        };
      } else {
        updateData.discount = null;
      }

      // Add flash sale if active
      if (formData.isFlashSale && formData.flashSalePrice) {
        updateData.flashSale = {
          active: true,
          price: parseFloat(formData.flashSalePrice),
          startDate: formData.flashSaleStart ? new Date(formData.flashSaleStart) : new Date(),
          endDate: formData.flashSaleEnd ? new Date(formData.flashSaleEnd) : null,
          limitedStock: formData.flashSaleStock ? parseInt(formData.flashSaleStock) : null,
        };
      } else {
        updateData.flashSale = null;
      }

      await api.put(`/digital-products/${product._id}`, updateData);
      
      toast.success('Product updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit Product
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                    Basic Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Base Price * ($)
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-gray-400"
                    />
                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Featured Product
                    </label>
                  </div>
                </div>

                {/* Discount/Promo Section */}
                <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                      Discount / Promo
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Discount Type
                    </label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="none">No Discount</option>
                      <option value="percentage">Percentage Off (%)</option>
                      <option value="fixed">Fixed Amount Off ($)</option>
                    </select>
                  </div>

                  {formData.discountType !== 'none' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Discount Value {formData.discountType === 'percentage' ? '(%)' : '($)'}
                        </label>
                        <input
                          type="number"
                          name="discountValue"
                          value={formData.discountValue}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          max={formData.discountType === 'percentage' ? '100' : undefined}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {formData.price && formData.discountValue && (
                          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                            Final Price: ${calculateDiscountedPrice()}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Start Date (optional)
                          </label>
                          <input
                            type="datetime-local"
                            name="discountStartDate"
                            value={formData.discountStartDate}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            End Date (optional)
                          </label>
                          <input
                            type="datetime-local"
                            name="discountEndDate"
                            value={formData.discountEndDate}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Flash Sale Section */}
                <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                      Flash Sale
                    </h3>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isFlashSale"
                      checked={formData.isFlashSale}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400"
                    />
                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Enable Flash Sale
                    </label>
                  </div>

                  {formData.isFlashSale && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Flash Sale Price ($)
                        </label>
                        <input
                          type="number"
                          name="flashSalePrice"
                          value={formData.flashSalePrice}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {formData.price && formData.flashSalePrice && (
                          <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                            Savings: ${(parseFloat(formData.price) - parseFloat(formData.flashSalePrice)).toFixed(2)} 
                            ({(((parseFloat(formData.price) - parseFloat(formData.flashSalePrice)) / parseFloat(formData.price)) * 100).toFixed(0)}% off)
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Flash Sale Start
                          </label>
                          <input
                            type="datetime-local"
                            name="flashSaleStart"
                            value={formData.flashSaleStart}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Flash Sale End
                          </label>
                          <input
                            type="datetime-local"
                            name="flashSaleEnd"
                            value={formData.flashSaleEnd}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Limited Stock (optional)
                        </label>
                        <input
                          type="number"
                          name="flashSaleStock"
                          value={formData.flashSaleStock}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="Leave empty for unlimited"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditProductModal;