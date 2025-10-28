import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { Filter, TrendingUp } from 'lucide-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Electronics', 'Fashion', 'Home', 'Sports'];
  const { addToCart } = useCart();

  // Fetch products from backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data.data || []);
          } catch (err) {
        setError('Failed to load products');
      // Fallback to dummy data jika backend tidak available
      const { products: dummyProducts } = await import('../data/products');
      setProducts(dummyProducts);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    const result = await addToCart(product, 1);
    if (result.success) {
      alert(`✅ ${product.name} added to cart!`);
    } else {
      alert(`❌ ${result.message}`);
    }
  };

  // Filter produk berdasarkan kategori
  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(product => product.category === selectedCategory);

  return (
    <div>
      {/* Hero Section */}
      <section id="home">
        <Hero />
      </section>

      {/* Products Section */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Featured Products
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Shop Digital Products
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            Instant delivery. Secure transactions. Best prices.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mr-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium text-sm">Filter:</span>
          </div>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-150 text-sm ${
                selectedCategory === category
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-3 border-gray-300 dark:border-gray-700 border-t-black dark:border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-10">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product._id || product.id} 
                product={product} 
                onAddToCart={handleAddToCart} 
              />
            ))}
          </div>
        )}

        {/* No Products Found */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No products found in this category.</p>
          </div>
        )}
      </section>

      {/* Features Section / About */}
      <section id="about" className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg">
              <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Verified Products</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">All products are tested and verified before listing</p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg">
              <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Instant Delivery</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Get your digital products delivered immediately</p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg">
              <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secure Payment</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Bank-level encryption for all transactions</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;