import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Plus, Trash2, AlertCircle, Loader } from 'lucide-react';
import api from '../../services/api';
import { useToastContext } from '../../context/ToastContext';

const AddDigitalProductModal = ({ isOpen, onClose, onSuccess }) => {
  const toast = useToastContext();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Product Info, 2: Add Inventory
  const [productId, setProductId] = useState(null);
  const [inventoryItems, setInventoryItems] = useState(['']);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Game Keys',
    image: '',
    deliveryInstructions: '',
    featured: false,
  });

  const categories = [
    'Game Keys',
    'Software Licenses',
    'Premium Accounts',
    'Gift Cards',
    'Music/Movies',
    'eBooks',
    'Courses',
    'Other',
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleInventoryChange = (index, value) => {
    const newItems = [...inventoryItems];
    newItems[index] = value;
    setInventoryItems(newItems);
  };

  const addInventoryField = () => {
    setInventoryItems([...inventoryItems, '']);
  };

  const removeInventoryField = (index) => {
    const newItems = inventoryItems.filter((_, i) => i !== index);
    setInventoryItems(newItems);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔒 Validate inputs
      if (!formData.name || !formData.description || !formData.price) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (parseFloat(formData.price) <= 0) {
        toast.error('Price must be greater than 0');
        setLoading(false);
        return;
      }

      const { data } = await api.post('/digital-products', {
        ...formData,
        price: parseFloat(formData.price),
      });

      setProductId(data.data._id);
      setStep(2);
      toast.success('Product created! Now add inventory items.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty items
      const validItems = inventoryItems.filter(item => item.trim() !== '');

      if (validItems.length === 0) {
        toast.error('Please add at least one inventory item');
        setLoading(false);
        return;
      }

      await api.post(`/digital-products/${productId}/inventory`, {
        items: validItems,
      });

      toast.success(`Successfully added ${validItems.length} items!`);
      resetAndClose();
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add inventory');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Game Keys',
      image: '',
      deliveryInstructions: '',
      featured: false,
    });
    setInventoryItems(['']);
    setStep(1);
    setProductId(null);
    onClose();
  };

  const handleSkipInventory = () => {
    showToast('Product created without inventory. You can add items later.', 'info');
    resetAndClose();
    onSuccess();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAndClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {step === 1 ? '🎮 Add Digital Product' : '📦 Add Inventory Items'}
                    </h2>
                    <p className="text-white/80 mt-1">
                      {step === 1 ? 'Step 1: Product Information' : 'Step 2: Add Keys/Licenses'}
                    </p>
                  </div>
                  <button
                    onClick={resetAndClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Step 1: Product Info */}
              {step === 1 && (
                <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Steam Gift Card $50"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      placeholder="Detailed product description..."
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Price & Category */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Price (RM) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Image URL *
                    </label>
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      required
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Delivery Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Delivery Instructions (Optional)
                    </label>
                    <textarea
                      name="deliveryInstructions"
                      value={formData.deliveryInstructions}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="e.g., Redeem at store.steampowered.com"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Featured */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="featured"
                      id="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-purple-600 border-neutral-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="featured" className="text-sm text-neutral-700">
                      Featured Product (Show on homepage)
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          <span>Create Product</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetAndClose}
                      className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Add Inventory */}
              {step === 2 && (
                <form onSubmit={handleAddInventory} className="p-6 space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Add Product Keys/Licenses</h4>
                        <p className="text-sm text-blue-800">
                          Add your product keys, license codes, or account credentials. Each item will be automatically encrypted and stored securely.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Inventory Items */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {inventoryItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleInventoryChange(index, e.target.value)}
                          placeholder={`Key/License ${index + 1}`}
                          className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {inventoryItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInventoryField(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add More Button */}
                  <button
                    type="button"
                    onClick={addInventoryField}
                    className="w-full py-2 border-2 border-dashed border-neutral-300 text-neutral-600 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Another Item</span>
                  </button>

                  {/* Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>Add Inventory ({inventoryItems.filter(i => i.trim()).length} items)</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipInventory}
                      className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
                    >
                      Skip for Now
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddDigitalProductModal;