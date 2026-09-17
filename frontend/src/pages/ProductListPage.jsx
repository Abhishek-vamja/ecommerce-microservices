import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, ChevronRight, X, Search, Zap, Star, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function ProductListPage({ 
  filterMeta, 
  categories, 
  cart,
  onAddToCart, 
  onUpdateCartQty,
  onToggleWishlist, 
  addingToCartId, 
  togglingWishlistId, 
  wishlist 
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const getProductCartQty = (pid) => {
    const item = cart?.items?.find(i => i.product_id === pid);
    return item ? item.quantity : 0;
  };

  // Filters read from URL params
  const categoryParam = searchParams.get('category') || '';
  const brandParam = searchParams.get('brand') || '';
  const minPriceParam = searchParams.get('min_price') || '';
  const maxPriceParam = searchParams.get('max_price') || '';
  const minRatingParam = searchParams.get('min_rating') || '';
  const dealParam = searchParams.get('deal') === 'true';
  const sortParam = searchParams.get('sort') || 'popularity';
  const queryParam = searchParams.get('q') || '';

  // Local state for custom price inputs
  const [localMinPrice, setLocalMinPrice] = useState(minPriceParam);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPriceParam);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Synchronize local states with URL
  useEffect(() => {
    setLocalMinPrice(minPriceParam);
    setLocalMaxPrice(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  // Fetch Products based on URL filters
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setLoading(true);
      try {
        // Map frontend sort to backend sort_by
        let sortBy = 'newest';
        if (sortParam === 'price_asc') sortBy = 'price_asc';
        else if (sortParam === 'price_desc') sortBy = 'price_desc';
        else if (sortParam === 'rating_desc' || sortParam === 'popularity') sortBy = 'rating';

        const params = {
          page_size: 24,
          sort_by: sortBy,
        };
        if (categoryParam) params.category_id = categoryParam;
        if (brandParam) params.brand = brandParam;
        if (minPriceParam) params.min_price = minPriceParam;
        if (maxPriceParam) params.max_price = maxPriceParam;
        if (minRatingParam) params.min_rating = minRatingParam;
        if (dealParam) params.is_deal = true;
        if (queryParam) params.search = queryParam;

        const res = await api.getProducts(params);
        const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
        const total = res?.pagination?.total ?? res?.total ?? items.length;
        setProducts(items);
        setTotalCount(total);
      } catch (err) {
        console.error('Failed to fetch filtered products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredProducts();
  }, [categoryParam, brandParam, minPriceParam, maxPriceParam, minRatingParam, dealParam, sortParam, queryParam]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === undefined || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = categoryParam || brandParam || minPriceParam || maxPriceParam || minRatingParam || dealParam || queryParam;

  const renderFilterContent = () => (
    <>
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm font-black text-gray-900">
          <SlidersHorizontal className="w-4 h-4 text-orange-600" />
          Filters & Refinements
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer"
          >
            Reset All
          </button>
        )}
      </div>

      {/* 1. Category Filter */}
      <div className="space-y-2.5">
        <label className="text-xs font-black uppercase tracking-wider text-gray-500">Categories</label>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
          <button
            onClick={() => { updateParam('category', ''); setIsMobileFilterOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
              !categoryParam ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => {
            const isSelected = categoryParam === cat.slug || categoryParam === cat.id;
            return (
              <button
                key={cat.id || cat.slug}
                onClick={() => { updateParam('category', cat.slug || cat.id); setIsMobileFilterOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  isSelected ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Deals Toggle */}
      <div className="pt-2 border-t border-gray-100">
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <div>
              <div className="text-xs font-bold text-gray-800 group-hover:text-orange-600">Flash Deals Only</div>
              <div className="text-[10px] text-gray-400">Products on special discount</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={dealParam}
            onChange={(e) => updateParam('deal', e.target.checked ? 'true' : '')}
            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
          />
        </label>
      </div>

      {/* 3. Price Range Slider / Inputs */}
      <div className="pt-3 border-t border-gray-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-gray-500">Price Range</label>
          <span className="text-[11px] font-bold text-orange-600">₹{localMinPrice || 0} - ₹{localMaxPrice || '50,000+'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={localMinPrice}
            onChange={(e) => setLocalMinPrice(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-hidden focus:border-orange-500"
          />
          <span className="text-gray-400 text-xs">-</span>
          <input
            type="number"
            placeholder="Max"
            value={localMaxPrice}
            onChange={(e) => setLocalMaxPrice(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-hidden focus:border-orange-500"
          />
          <button
            onClick={() => {
              updateParam('min_price', localMinPrice);
              updateParam('max_price', localMaxPrice);
              setIsMobileFilterOpen(false);
            }}
            className="px-3 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 cursor-pointer shadow-xs"
          >
            Go
          </button>
        </div>
      </div>

      {/* 4. Brand Filter */}
      {filterMeta?.brands?.length > 0 && (
        <div className="pt-3 border-t border-gray-100 space-y-2.5">
          <label className="text-xs font-black uppercase tracking-wider text-gray-500">Brands</label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
            {filterMeta.brands.map((b) => (
              <label key={b} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer hover:text-orange-600">
                <input
                  type="radio"
                  name="brand_filter"
                  checked={brandParam === b}
                  onChange={() => { updateParam('brand', brandParam === b ? '' : b); setIsMobileFilterOpen(false); }}
                  className="w-4 h-4 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <span className="truncate">{b}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 5. Rating Filter */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <label className="text-xs font-black uppercase tracking-wider text-gray-500">Customer Rating</label>
        <div className="space-y-1.5">
          {['4', '3', '2'].map((star) => (
            <label key={star} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer hover:text-orange-600">
              <input
                type="radio"
                name="rating_filter"
                checked={minRatingParam === star}
                onChange={() => { updateParam('min_rating', star); setIsMobileFilterOpen(false); }}
                className="w-4 h-4 text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <div className="flex items-center gap-1">
                <span className="font-bold">{star}★</span>
                <span className="text-gray-400">& above</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
      
      {/* Mobile Filter & Sort Bar (< lg) */}
      <div className="flex lg:hidden items-center justify-between gap-3 sticky top-28 z-30 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xs border border-gray-100">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-50 active:bg-gray-100 text-gray-800 text-xs font-black rounded-xl border border-gray-200 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600" />
          <span>Filters {hasActiveFilters ? '• (Active)' : ''}</span>
        </button>
        <div className="flex-1 relative">
          <select
            value={sortParam}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="w-full py-2.5 px-3 bg-gray-50 text-gray-800 text-xs font-black rounded-xl border border-gray-200 outline-hidden cursor-pointer"
          >
            <option value="popularity">🔥 Top Rated</option>
            <option value="newest">✨ New Arrivals</option>
            <option value="price_asc">💰 Price: Low to High</option>
            <option value="price_desc">💎 Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Top Banner / Breadcrumbs + Results Count (Desktop) */}
      <div className="hidden lg:flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold mb-1">
            <Link to="/" className="hover:text-orange-600">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-800 font-bold">Catalog</span>
            {categoryParam && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-orange-600 capitalize">{categoryParam}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>{categoryParam ? categories.find(c => c.slug === categoryParam || c.id === categoryParam)?.name || categoryParam : 'All Products'}</span>
            <span className="text-xs font-bold text-gray-400">({totalCount} items)</span>
          </h1>
        </div>

        {/* Sort Select (Desktop) */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500">Sort by:</span>
          <select
            value={sortParam}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="bg-white border border-gray-200 text-gray-800 text-xs font-bold rounded-2xl px-4 py-2 focus:border-orange-500 outline-hidden shadow-2xs cursor-pointer"
          >
            <option value="popularity">🔥 Top Rated / Popular</option>
            <option value="newest">✨ New Arrivals</option>
            <option value="price_asc">💰 Price: Low to High</option>
            <option value="price_desc">💎 Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-orange-50/60 rounded-2xl border border-orange-100">
          <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>
          {categoryParam && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-orange-700 text-xs font-bold rounded-xl border border-orange-200 shadow-2xs">
              Category: {categoryParam}
              <button onClick={() => updateParam('category', '')} className="hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {brandParam && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-orange-700 text-xs font-bold rounded-xl border border-orange-200 shadow-2xs">
              Brand: {brandParam}
              <button onClick={() => updateParam('brand', '')} className="hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {(minPriceParam || maxPriceParam) && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-orange-700 text-xs font-bold rounded-xl border border-orange-200 shadow-2xs">
              ₹{minPriceParam || '0'} - ₹{maxPriceParam || 'Max'}
              <button onClick={() => { updateParam('min_price', ''); updateParam('max_price', ''); }} className="hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {minRatingParam && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-orange-700 text-xs font-bold rounded-xl border border-orange-200 shadow-2xs">
              {minRatingParam}★ & above
              <button onClick={() => updateParam('min_rating', '')} className="hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {dealParam && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-rose-600 text-xs font-bold rounded-xl border border-rose-200 shadow-2xs">
              🔥 Deals Only
              <button onClick={() => updateParam('deal', '')} className="hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {queryParam && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-orange-700 text-xs font-bold rounded-xl border border-orange-200 shadow-2xs">
              Query: "{queryParam}"
              <button onClick={() => updateParam('q', '')} className="hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs font-bold text-red-600 hover:underline ml-auto cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Grid: STICKY FILTER SIDEBAR (Desktop) + PRODUCTS CATALOG */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* DESKTOP FILTER SIDEBAR */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 space-y-6 scrollbar-thin">
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-6">
            {renderFilterContent()}
          </div>
        </aside>

        {/* MOBILE FILTER MODAL / DRAWER */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="text-base font-black text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-orange-600" />
                  Filter Products
                </div>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {renderFilterContent()}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                <button
                  onClick={() => { clearAllFilters(); setIsMobileFilterOpen(false); }}
                  className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-100 rounded-2xl hover:bg-gray-200"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-2 py-3 text-xs font-black text-white bg-orange-600 rounded-2xl shadow-md hover:bg-orange-700"
                >
                  Show {totalCount} Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS CATALOG GRID (2 columns on mobile, 3 on tablet/desktop) */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="bg-white rounded-3xl p-4 h-72 border border-gray-100 animate-pulse shadow-xs" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-gray-100 shadow-xs space-y-4">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-gray-900">No matching products found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try loosening your filters, selecting a different category, or resetting all filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-2.5 bg-orange-600 text-white rounded-2xl text-xs font-bold hover:bg-orange-700 transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
              {products.map(product => {
                const pid = product.unique_id || product.id;
                return (
                  <ProductCard
                    key={pid}
                    product={product}
                    cartQty={getProductCartQty(pid)}
                    onAddToCart={onAddToCart}
                    onUpdateCartQty={onUpdateCartQty}
                    onToggleWishlist={onToggleWishlist}
                    addingToCartId={addingToCartId}
                    togglingWishlistId={togglingWishlistId}
                    isWishlisted={wishlist.some(w => (w.product_id || w.id) === pid)}
                  />
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}


