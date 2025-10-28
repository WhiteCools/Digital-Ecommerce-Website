import { ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative bg-white dark:bg-gray-900 overflow-hidden">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-block">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">New Collection 2024</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 dark:text-white">
              Premium Digital
              <span className="block">
                Products
              </span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
              Instant delivery of game keys, subscriptions, and digital accounts. Secure, verified, and ready to use.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-8 py-3.5 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-150"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-3.5 rounded-md font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
              >
                <span>Learn More</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-8 pt-6">
              {[
                { value: '5,000+', label: 'Happy Customers' },
                { value: '200+', label: 'Products' },
                { value: '4.9', label: 'Rating' }
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=800&fit=crop"
                alt="Digital Products"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>


    </section>
  );
};

export default Hero;