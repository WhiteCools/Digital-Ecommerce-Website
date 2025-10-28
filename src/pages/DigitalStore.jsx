import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Search, Filter, Zap, Shield, CheckCircle, Gamepad2, Film, Music, Tv, Target, User, Key, Gift, Lock, Gem } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToastContext } from '../context/ToastContext';
import api from '../services/api';

const DigitalStore = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const { formatPrice, currency } = useCurrency();
  const toast = useToastContext();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (sortBy) {
        params.append('sort', sortBy);
      }

      const { data } = await api.get(`/digital-products?${params}`);
      setProducts(data.data);
          } catch (error) {
        // Failed to fetch products
      } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/digital-products/categories/list');
      setCategories(data.data);
          } catch (error) {
        // Failed to fetch categories
      }
  };

  const handleAddToCart = async (product) => {
    const result = await addToCart(product, 1);
    if (result.success) {
      toast.success(product.name, 3000, {
        productImage: product.image,
        productName: product.name
      });
    } else {
      toast.error(result.message || 'Failed to add to cart');
    }
  };

  const getProductIcon = (category) => {
    const iconMap = {
      'Discord Nitro': Gamepad2,
      'Steam Keys': Gamepad2,
      'Epic Games': Gamepad2,
      'Netflix': Film,
      'Spotify': Music,
      'YouTube Premium': Tv,
      'Game Accounts': Target,
      'Xbox Game Pass': Gamepad2,
      'PlayStation Plus': Gamepad2,
      'Gift Cards': Gift,
      'VPN': Lock,
      'Other Digital': Gem,
    };
    const IconComponent = iconMap[category] || Gem;
    return <IconComponent className="w-5 h-5" />;
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Hero Section */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
              Digital Products
            </h1>
            
            <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
              Game keys, subscriptions, and accounts. Instant delivery.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Instant Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 cursor-pointer appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} ({cat.totalStock})
                  </option>
                ))}
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 cursor-pointer appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="featured">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-gray-300 dark:border-gray-700 border-t-black dark:border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No products found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-red-300 dark:hover:border-red-700 transition-all cursor-pointer group"
                onClick={() => navigate(`/digital-product/${product._id}`)}
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Category Icon */}
                  <div className="absolute top-2 left-2">
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-2 rounded-md">
                      {getProductIcon(product.category)}
                    </div>
                  </div>
                  
                  {product.stock > 0 ? (
                    <div className="absolute bottom-3 right-3 bg-emerald-500 dark:bg-emerald-600 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                      {product.stock} available
                    </div>
                  ) : (
                    <div className="absolute bottom-3 right-3 bg-gray-800 dark:bg-gray-700 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                      Out of stock
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {product.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      {/* Check for flash sale or discount */}
                      {product.effectivePrice && product.effectivePrice < product.price ? (
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                            {formatPrice(product.price)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-semibold text-red-600 dark:text-red-400">
                              {formatPrice(product.effectivePrice)}
                            </span>
                            {product.flashSale?.active && (
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                ⚡ FLASH
                              </span>
                            )}
                            {product.discount?.type && !product.flashSale?.active && (
                              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {product.discount.type === 'percentage' ? `-${product.discount.value}%` : `-$${product.discount.value}`}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xl font-semibold text-gray-900 dark:text-white">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={product.stock === 0}
                      className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalStore;