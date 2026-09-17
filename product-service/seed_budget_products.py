import sys
from uuid import uuid4
sys.path.append(r'd:\projects\Ecommerce-Microservices\product-service')
from app.db.session import SessionLocal
from app.models.product import Product, Category

db = SessionLocal()

categories_data = [
    {'name': 'Snacks & Munchies', 'slug': 'snacks-munchies'},
    {'name': 'Dairy & Breakfast', 'slug': 'dairy-breakfast'},
    {'name': 'Beverages & Juices', 'slug': 'beverages'},
    {'name': 'Daily Groceries', 'slug': 'groceries'},
]

cat_map = {}
for c in categories_data:
    existing = db.query(Category).filter(Category.slug == c['slug']).first()
    if not existing:
        new_cat = Category(id=f"cat_{c['slug']}", name=c['name'], slug=c['slug'], display_order=1)
        db.add(new_cat)
        db.commit()
        db.refresh(new_cat)
        cat_map[c['slug']] = new_cat.id
    else:
        cat_map[c['slug']] = existing.id

print('Categories ready:', cat_map)

products_to_add = [
    {
        'name': "Lay's India's Magic Masala Potato Chips (115g)",
        'description': 'Crispy golden potato chips tossed in rich authentic Indian spices. Perfect tea-time snack with 15-min instant delivery.',
        'price': 50.0,
        'original_price': 60.0,
        'discount_percentage': 17,
        'rating': 4.8,
        'rating_count': 1420,
        'stock': 120,
        'image_url': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop',
        'brand': "Lay's",
        'category_id': cat_map.get('snacks-munchies', 'cat_groceries'),
        'is_deal': True,
    },
    {
        'name': 'Cadbury Dairy Milk Silk Chocolate Bar (60g)',
        'description': 'Smooth, creamy, and velvety melt-in-mouth milk chocolate bar crafted with the finest cocoa.',
        'price': 99.0,
        'original_price': 120.0,
        'discount_percentage': 18,
        'rating': 4.9,
        'rating_count': 2380,
        'stock': 85,
        'image_url': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop',
        'brand': 'Cadbury',
        'category_id': cat_map.get('snacks-munchies', 'cat_groceries'),
        'is_deal': True,
    },
    {
        'name': 'Doritos Sweet Chilli Nacho Crisps (140g)',
        'description': 'Crunchy corn tortilla nacho chips infused with sweet and spicy Mexican seasoning.',
        'price': 60.0,
        'original_price': 75.0,
        'discount_percentage': 20,
        'rating': 4.7,
        'rating_count': 940,
        'stock': 65,
        'image_url': 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop',
        'brand': 'Doritos',
        'category_id': cat_map.get('snacks-munchies', 'cat_groceries'),
        'is_deal': True,
    },
    {
        'name': 'Oreo Double Stuf Chocolate Cookies (120g)',
        'description': 'Rich crunchy chocolate sandwich cookies loaded with double vanilla creme filling.',
        'price': 45.0,
        'original_price': 55.0,
        'discount_percentage': 18,
        'rating': 4.7,
        'rating_count': 810,
        'stock': 90,
        'image_url': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop',
        'brand': 'Oreo',
        'category_id': cat_map.get('snacks-munchies', 'cat_groceries'),
        'is_deal': False,
    },
    {
        'name': 'Pringles Sour Cream & Onion Potato Crisps (107g)',
        'description': 'Iconic hyper-crunchy stackable potato crisps seasoned with tangy sour cream and savoury herbs.',
        'price': 119.0,
        'original_price': 140.0,
        'discount_percentage': 15,
        'rating': 4.8,
        'rating_count': 1650,
        'stock': 45,
        'image_url': 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=600&auto=format&fit=crop',
        'brand': 'Pringles',
        'category_id': cat_map.get('snacks-munchies', 'cat_groceries'),
        'is_deal': True,
    },
    {
        'name': 'Maggi 2-Minute Special Masala Noodles (Pack of 4)',
        'description': 'Indias favourite instant noodles infused with 20 roasted aromatic whole spices.',
        'price': 72.0,
        'original_price': 85.0,
        'discount_percentage': 15,
        'rating': 4.9,
        'rating_count': 3200,
        'stock': 150,
        'image_url': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop',
        'brand': 'Maggi',
        'category_id': cat_map.get('snacks-munchies', 'cat_groceries'),
        'is_deal': True,
    },
    {
        'name': 'Amul Pasteurised Fresh Butter (100g Block)',
        'description': 'Pure dairy butter churned from fresh pasteurised milk. Wholesome goodness for bread and cooking.',
        'price': 58.0,
        'original_price': 62.0,
        'discount_percentage': 6,
        'rating': 4.9,
        'rating_count': 4100,
        'stock': 200,
        'image_url': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop',
        'brand': 'Amul',
        'category_id': cat_map.get('dairy-breakfast', 'cat_groceries'),
        'is_deal': False,
    },
    {
        'name': 'Nescafe Classic 100% Pure Instant Coffee (50g)',
        'description': '100% pure natural coffee beans roasted to perfection for a rich, aromatic morning brew.',
        'price': 149.0,
        'original_price': 180.0,
        'discount_percentage': 17,
        'rating': 4.8,
        'rating_count': 1950,
        'stock': 70,
        'image_url': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop',
        'brand': 'Nescafe',
        'category_id': cat_map.get('beverages', 'cat_groceries'),
        'is_deal': True,
    },
    {
        'name': 'Paper Boat Aamras Mango Juice (Pack of 2 x 250ml)',
        'description': 'Real sweet mango pulp juice that tastes like homemade grandmother recipe with no preservatives.',
        'price': 70.0,
        'original_price': 90.0,
        'discount_percentage': 22,
        'rating': 4.8,
        'rating_count': 920,
        'stock': 110,
        'image_url': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&auto=format&fit=crop',
        'brand': 'Paper Boat',
        'category_id': cat_map.get('beverages', 'cat_groceries'),
        'is_deal': True,
    },
    {
        'name': 'boAt Micro USB 2.4A Fast Charging Cable (1.5m)',
        'description': 'Tangle-free rugged nylon braided fast charging and high-speed data sync cable.',
        'price': 99.0,
        'original_price': 299.0,
        'discount_percentage': 67,
        'rating': 4.6,
        'rating_count': 2100,
        'stock': 130,
        'image_url': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop',
        'brand': 'boAt',
        'category_id': 'cat_electronics',
        'is_deal': True,
    },
    {
        'name': 'Portronics Fast USB-C to USB-A Metal OTG Adapter',
        'description': 'Compact aluminium alloy OTG connector for pendrives, keyboards, and lightning data transfer.',
        'price': 89.0,
        'original_price': 199.0,
        'discount_percentage': 55,
        'rating': 4.5,
        'rating_count': 740,
        'stock': 95,
        'image_url': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop',
        'brand': 'Portronics',
        'category_id': 'cat_electronics',
        'is_deal': True,
    },
    {
        'name': 'Tata Salt Vacuum Evaporated Pure Iodised Salt (1kg)',
        'description': 'Purity guaranteed vacuum evaporated salt enriched with essential iodine for daily vitality.',
        'price': 28.0,
        'original_price': 30.0,
        'discount_percentage': 7,
        'rating': 4.9,
        'rating_count': 5600,
        'stock': 300,
        'image_url': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop',
        'brand': 'Tata',
        'category_id': cat_map.get('groceries', 'cat_groceries'),
        'is_deal': False,
    }
]

added_count = 0
for p in products_to_add:
    existing = db.query(Product).filter(Product.name == p['name']).first()
    if not existing:
        prod = Product(
            id=uuid4(),
            unique_id=f"bprod_{uuid4().hex[:10]}",
            name=p['name'],
            description=p['description'],
            price=p['price'],
            original_price=p.get('original_price', p['price']),
            discount_percentage=p['discount_percentage'],
            rating=p['rating'],
            rating_count=p['rating_count'],
            stock=p['stock'],
            image_url=p['image_url'],
            brand=p['brand'],
            category_id=p['category_id'],
            is_deal=p['is_deal'],
            is_active=True,
            created_by='system_seed'
        )
        db.add(prod)
        added_count += 1

db.commit()
print(f'Successfully added {added_count} new budget/snack products near Rs 100!')
