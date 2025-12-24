import { Link } from "wouter";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFacebookF,
  faInstagram,
  faTwitter
} from '@fortawesome/free-brands-svg-icons';
import {
  faMapMarkerAlt,
  faPhoneAlt,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';

const Footer = () => {
  return (
    <footer className="bg-secondary text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">Pete's Pantry</h3>
            <p className="text-gray-300 mb-4">
              Handcrafted marmalades made with love and the finest ingredients. 
              Bringing bold flavors to your table since 2020.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-primary transition duration-200">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="#" className="text-white hover:text-primary transition duration-200">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="#" className="text-white hover:text-primary transition duration-200">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-primary transition duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-primary transition duration-200">
                  Products
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-primary transition duration-200">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-primary transition duration-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Customer Service */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-300 hover:text-primary transition duration-200">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-primary transition duration-200">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-primary transition duration-200">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-primary transition duration-200">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mt-1 mr-2" />
                <span>123 Market Street, Cape Town, 8001</span>
              </li>
              <li className="flex items-center">
                <FontAwesomeIcon icon={faPhoneAlt} className="mr-2" />
                <span>+27 21 123 4567</span>
              </li>
              <li className="flex items-center">
                <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                <span>hello@petespantry.co.za</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Pete's Pantry. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
