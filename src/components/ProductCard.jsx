import { ShoppingCart, Star } from 'lucide-react';

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 group cursor-pointer">

      {/* Image Container */}
      <div className="relative overflow-hidden h-64 bg-gray-100 dark:bg-gray-700">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {product.stock < 10 && (
          <div className="absolute top-2 right-2">
            <span className="bg-black/80 text-white text-xs font-medium px-2 py-1 rounded">
              Only {product.stock} left
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{product.category}</span>
          <div className="flex items-center space-x-1">
            <Star className="w-3.5 h-3.5 fill-gray-900 dark:fill-gray-100 text-gray-900 dark:text-gray-100" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{product.rating}</span>
          </div>
        </div>

        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
          {product.name}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-semibold text-gray-900 dark:text-white">
            ${product.price}
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-150 text-sm font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;