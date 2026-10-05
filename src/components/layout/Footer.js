'use client';

import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Deshi Bazar</h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-4">
              Your smart marketplace with bargaining, personal recommendations, and a seamless shopping experience.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <a href="#" className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-500 transition-colors">
                <FaFacebook size={18} />
              </a>
              <a href="#" className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-400 transition-colors">
                <FaTwitter size={18} />
              </a>
              <a href="#" className="p-1.5 sm:p-2 text-gray-400 hover:text-pink-500 transition-colors">
                <FaInstagram size={18} />
              </a>
              <a href="#" className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 transition-colors">
                <FaLinkedin size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Quick Links</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link href="/products" className="text-xs sm:text-sm hover:text-white transition-colors inline-block py-0.5">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-xs sm:text-sm hover:text-white transition-colors inline-block py-0.5">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/deals" className="text-xs sm:text-sm hover:text-white transition-colors inline-block py-0.5">
                  Special Deals
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-xs sm:text-sm hover:text-white transition-colors inline-block py-0.5">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Customer Service</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link href="/help" className="text-xs sm:text-sm hover:text-white transition-colors inline-block py-0.5">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-xs sm:text-sm hover:text-white transition-colors inline-block py-0.5">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-xs sm:text-sm hover:text-white transition-colors inline-block py-0.5">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-xs sm:text-sm hover:text-white transition-colors inline-block py-0.5">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Contact</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-center gap-2 text-xs sm:text-sm">
                <FaEnvelope className="text-blue-500 flex-shrink-0" size={14} />
                <span className="break-all">support@aishop.com</span>
              </li>
              <li className="flex items-center gap-2 text-xs sm:text-sm">
                <FaPhone className="text-blue-500 flex-shrink-0" size={14} />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2 text-xs sm:text-sm">
                <FaMapMarkerAlt className="text-blue-500 flex-shrink-0" size={14} />
                <span>123 Gulshan Avenue, Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 pt-4 sm:pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
            © {new Date().getFullYear()} Powered By Shyhoon
          </p>
          <div className="flex gap-4 sm:gap-6">
            <Link href="/privacy" className="text-xs sm:text-sm text-gray-400 hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs sm:text-sm text-gray-400 hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
