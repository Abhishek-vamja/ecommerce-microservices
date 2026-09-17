import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../api/client';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Check, 
  X, 
  Image as ImageIcon,
  Tag,
  DollarSign,
  Layers,
  Sparkles
} from 'lucide-react';

export const SellerProductsPage = () => {
  const { seller, sellerToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category_id: 'cat_electronics',
    image_url: '',
    discount_percentage: 0,
  });

  const loadData = async () => {
    if (!seller?.id) return;
    try {
      setLoading(true);
      const [prodsData, catsData] = await Promise.all([
        portalApi.getMyProducts(sellerToken, seller.id),
        portalApi.getCategories().catch(() => []),
      ]);
      setProducts(prodsData.items || prodsData || []);
      setCategories(catsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [seller?.id]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      stock: '',
      category_id: categories[0]?.id || 'cat_electronics',
      image_url: '',
      discount_percentage: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.name || product.title || '',
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category_id: product.category_id || 'cat_electronics',
      image_url: product.image_url || '',
      discount_percentage: product.discount_percentage || 0,
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.title,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category_id: formData.category_id,
        image_url: formData.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
        discount_percentage: parseFloat(formData.discount_percentage || 0),
        seller_id: seller.id,
        shop_name: seller.shop_name,
      };

      if (editingProduct) {
        await portalApi.updateProduct(sellerToken, editingProduct.unique_id || editingProduct.id, payload);
        setSuccess('Product updated successfully!');
      } else {
        await portalApi.createProduct(sellerToken, payload);
        setSuccess('Product listed successfully on ShopMate!');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this product from your inventory?')) return;
    try {
      setActionLoading(true);
      await portalApi.deleteProduct(sellerToken, productId);
      setSuccess('Product removed successfully');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const title = p.name || p.title || '';
    const cat = p.category?.name || p.category_id || '';
    return title.toLowerCase().includes(search.toLowerCase()) ||
           cat.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-blue-600" />
            <span>Store Inventory Catalog</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your store catalog, real-time stock, pricing, and 95% settlement margins
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-blue-200 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search items in your catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 self-end sm:self-auto font-semibold">
          <span>Total Products: <strong className="text-slate-900 font-bold">{products.length}</strong></span>
          <span>•</span>
          <span>In Stock: <strong className="text-emerald-600 font-bold">{products.filter((p) => p.stock > 0).length}</strong></span>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-400">Loading your store catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-slate-700">No products found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'No products match your search query.' : 'You haven’t added any products to your shop catalog yet.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const price = parseFloat(p.price || 0);
            const platformFee = price * 0.05;
            const netPayout = price * 0.95;
            const prodTitle = p.name || p.title || 'Product';

            return (
              <div
                key={p.unique_id || p.id}
                className="bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-lg rounded-3xl overflow-hidden flex flex-col group transition-all"
              >
                {/* Product Image */}
                <div className="relative aspect-video bg-slate-50 overflow-hidden">
                  <img
                    src={p.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80'}
                    alt={prodTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-md text-blue-700 shadow-xs border border-blue-100">
                      {p.category?.name || p.category_id || 'Item'}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                      p.stock > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {prodTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Financial Breakdown per item */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Listing Price:</span>
                      <strong className="text-slate-900 font-bold text-sm">₹{price.toFixed(2)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>ShopMate 5% Fee:</span>
                      <span className="text-amber-600 font-semibold">-₹{platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      <span>Your Payout (95%):</span>
                      <span>₹{netPayout.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(p.unique_id || p.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-blue-600" />
              <span>{editingProduct ? 'Edit Product' : 'Add New Product to Store'}</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id || c.slug} value={c.slug || c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="cat_electronics">Electronics</option>
                  <option value="cat_groceries">Groceries</option>
                  <option value="cat_snacks-munchies">Snacks & Munchies</option>
                  <option value="fashion">Fashion</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    placeholder="99.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inventory Stock *</label>
                  <input
                    type="number"
                    required
                    name="stock"
                    value={formData.stock}
                    onChange={handleFormChange}
                    placeholder="50"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                  />
                </div>
              </div>

              {formData.price && (
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs flex justify-between items-center text-blue-900">
                  <span>5% ShopMate Fee: <strong className="text-amber-700">₹{(parseFloat(formData.price || 0) * 0.05).toFixed(2)}</strong></span>
                  <span className="text-emerald-700 font-black">You receive (95%): ₹{(parseFloat(formData.price || 0) * 0.95).toFixed(2)}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Image URL</label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleFormChange}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Provide product highlights, specifications, or freshness details..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-blue-200 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : editingProduct ? 'Update Product' : 'List Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
