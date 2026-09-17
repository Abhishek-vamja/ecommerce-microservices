import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';

export default function WishlistPage({ 
  wishlist, 
  onAddToCart, 
  onToggleWishlist, 
  addingToCartId, 
  recentlyAddedId, 
  togglingWishlistId, 
  token, 
  setIsAuthOpen 
}) {
  if (!token) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <Heart className="w-12 h-12 text-gray-400 mx-auto" />
        <h2 className="text-2xl font-black text-gray-900">Sign in to view your wishlist</h2>
        <button onClick={() => setIsAuthOpen(true)} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-2xl text-xs cursor-pointer">
          Sign In
        </button>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <Heart className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-2xl font-black text-gray-900">Your wishlist is empty</h2>
        <p className="text-xs text-gray-500">Explore products and tap the heart icon to save your favorites.</p>
        <Link to="/products" className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl text-xs shadow-md">
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black text-gray-900">My Wishlist ({wishlist.length} items)</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((item) => {
          const product = {
            unique_id: item.product_id || item.id,
            id: item.product_id || item.id,
            name: item.product_name || item.name,
            price: item.unit_price || item.price,
            image_url: item.image_url,
          };

          return (
            <ProductCard
              key={product.unique_id}
              product={product}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              addingToCartId={addingToCartId}
              recentlyAddedId={recentlyAddedId}
              togglingWishlistId={togglingWishlistId}
              isWishlisted={true}
            />
          );
        })}
      </div>
    </div>
  );
}
