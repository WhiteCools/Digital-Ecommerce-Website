import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ShoppingCart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-black" />
              </div>
                              <span className="text-lg font-semibold text-white">DigitalCommerce</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Your trusted source for digital products. Instant delivery, secure payments.
            </p>
            <div className="flex space-x-3">
              <a
                href="#"
                className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-md flex items-center justify-center transition-colors duration-150"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-md flex items-center justify-center transition-colors duration-150"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-md flex items-center justify-center transition-colors duration-150"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors duration-150">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors duration-150">
                  Shop
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors duration-150">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors duration-150">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors duration-150">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors duration-150">
                  Shipping Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors duration-150">
                  Return & Exchange
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors duration-150">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors duration-150">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors duration-150">
                  Track Order
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  123 Commerce Street,<br />
                  Kuala Lumpur, Malaysia
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm">+60 12-345 6789</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                  <span className="text-sm">support@example.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 text-center md:text-left">
                          © {currentYear} DigitalCommerce. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 mt-2 md:mt-0">
            Secure digital marketplace
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;