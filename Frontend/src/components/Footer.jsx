import React from 'react';
import commonStyles from '../style/common';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className={commonStyles.container + ' py-12'}>
        <div className={commonStyles.gridThreeCol + ' mb-10'}>
          {/* Company Info */}
          <div>
            <h3 className="text-white font-bold mb-4">PlaceSense</h3>
            <p className="text-sm mb-4">
              A comprehensive platform for managing placements efficiently and effectively.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-white">Home</a></li>
              <li><a href="/drives" className="hover:text-white">Drives</a></li>
              <li><a href="/applications" className="hover:text-white">Applications</a></li>
              <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: info@placementtracker.com</li>
              <li>Phone: +91-XXXXX-XXXXX</li>
              <li>Address: XYZ College, India</li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">
            © {new Date().getFullYear()} PlacementTracker. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="text-sm hover:text-white">Privacy Policy</a>
            <a href="#" className="text-sm hover:text-white">Terms of Service</a>
            <a href="#" className="text-sm hover:text-white">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
