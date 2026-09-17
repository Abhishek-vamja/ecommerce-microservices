import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Award, Headphones } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      {/* Trust Badges Bar matching design screenshot */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center md:text-left">
          
          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Free Delivery</div>
              <div className="text-[11px] text-gray-500">On orders above ₹499</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Easy Returns</div>
              <div className="text-[11px] text-gray-500">7-day return policy</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Secure Payments</div>
              <div className="text-[11px] text-gray-500">100% safe & secure</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Genuine Products</div>
              <div className="text-[11px] text-gray-500">Direct from brands</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 justify-center md:justify-start col-span-2 md:col-span-1">
            <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Need Help?</div>
              <div className="text-[11px] text-gray-500">24/7 customer support</div>
            </div>
          </div>

        </div>
      </div>

      <div className="border-t border-gray-100 py-6 bg-gray-50 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} ShopMate E-Commerce Microservices. All rights reserved. Powered by FastAPI & Redis.
      </div>
    </footer>
  );
};
