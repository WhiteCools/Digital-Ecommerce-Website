import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, AlertCircle, Loader, Package, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useToastContext } from '../../context/ToastContext';

const ManageInventoryModal = ({ isOpen, onClose, product, onSuccess }) => {
  const toast = useToastContext();
  const [loading, setLoading] = useState(false);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [newItems, setNewItems] = useState(['']);

  useEffect(() => {
    if (isOpen && product) {
      loadInventoryStats();
    }
  }, [isOpen, product]);

  const loadInventoryStats = async () => {
    try {
      const { data } = await api.get(`/digital-products/${product._id}/inventory`);
      setInventoryStats(data.data.stats);
          } catch (error) {
        // Failed to load inventory
      }
  };

  const handleItemChange = (index, value) => {
    const updated = [...newItems];
    updated[index] = value;
    setNewItems(updated);
  };

  const addItemField = () => {
    setNewItems([...newItems, '']);
  };

  const removeItemField = (index) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validItems = newItems.filter(item => item.trim() !== '');

      if (validItems.length === 0) {
        toast.error('Please add at least one item');
        setLoading(false);
        return;
      }

      await api.post(`/digital-products/${product._id}/inventory`, {
        items: validItems,
      });

      toast.success(`Successfully added ${validItems.length} items!`);
      setNewItems(['']);
      loadInventoryStats();
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewItems(['']);
    onClose();
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
            onClick={handleClose}
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
                    <h2 className="text-2xl font-bold">📦 Manage Inventory</h2>
                    <p className="text-white/80 mt-1">{product.name}</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Current Inventory Stats */}
                {inventoryStats && (
                  <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                      <Package className="w-5 h-5 text-purple-600" />
                      <span>Current Inventory</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm text-neutral-600">Total Items</p>
                        <p className="text-2xl font-bold text-neutral-900">{inventoryStats.total}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm text-neutral-600">Available</p>
                        <p className="text-2xl font-bold text-green-600">{inventoryStats.available}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm text-neutral-600">Sold</p>
                        <p className="text-2xl font-bold text-blue-600">{inventoryStats.sold}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add New Items */}
                <form onSubmit={handleAddInventory} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Add More Inventory</h4>
                        <p className="text-sm text-blue-800">
                          Add new keys/licenses. They will be automatically encrypted and stored securely.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* New Items */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {newItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleItemChange(index, e.target.value)}
                          placeholder={`Key/License ${index + 1}`}
                          className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {newItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemField(index)}
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
                    onClick={addItemField}
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
                          <CheckCircle className="w-5 h-5" />
                          <span>Add {newItems.filter(i => i.trim()).length} Items</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ManageInventoryModal;