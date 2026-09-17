import os
import sys
import uuid
from decimal import Decimal
from sqlalchemy import create_engine, text

# Safe UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')


USER_DB_URL = "postgresql://postgres:abhishek@localhost:5432/user_service_db"
PRODUCT_DB_URL = "postgresql://postgres:abhishek@localhost:5432/product_service_db"
ORDER_DB_URL = "postgresql://postgres:abhishek@localhost:5432/order_service_db"

def sync_admin_and_sellers():
    print("🚀 Connecting to user_service_db...")
    user_engine = create_engine(USER_DB_URL)
    
    sellers_data = [
        {
            "user_id": "usr_55edf265-c30b-4cfc-8068-e37564cfc9df",
            "email": "seller@technova.com",
            "name": "Alex Rivers",
            "phone": "9820123456",
            "shop_id": "seller_technova_elec",
            "shop_name": "TechNova Electronics",
            "shop_slug": "technova-electronics",
            "category": "Electronics & Gadgets",
            "description": "Authorized flagship retailer for premium smartphones, laptops, audio gear, and smart accessories.",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560001",
            "gst_number": "29ABCDE1234F1Z5",
            "pan_number": "ABCDE1234F",
            "bank_account": "910020030040",
            "ifsc": "HDFC0001234"
        },
        {
            "user_id": "usr_fc5287e9-3c94-4a01-854b-e669df703f28",
            "email": "seller@freshbasket.com",
            "name": "Priya Sharma",
            "phone": "9876543210",
            "shop_id": "seller_freshbasket_grc",
            "shop_name": "FreshBasket Organics",
            "shop_slug": "freshbasket-organics",
            "category": "Grocery & Gourmet",
            "description": "Farm-fresh organic groceries, cold-pressed oils, artisanal snacks, and daily essentials.",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "411001",
            "gst_number": "27ABCDE5678G1Z2",
            "pan_number": "ABCDE5678G",
            "bank_account": "987654321098",
            "ifsc": "ICIC0005678"
        },
        {
            "user_id": "usr_c06bcc80-b920-4add-8ce9-b3a155deb23d",
            "email": "seller@urbanstyle.com",
            "name": "Rohan Mehta",
            "phone": "9811223344",
            "shop_id": "seller_urbanstyle_fsh",
            "shop_name": "UrbanStyle Apparels",
            "shop_slug": "urbanstyle-apparels",
            "category": "Fashion & Footwear",
            "description": "Trendsetting streetwear, casual apparel, footwear, and curated fashion essentials.",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "gst_number": "27XYZAB9876H1Z9",
            "pan_number": "XYZAB9876H",
            "bank_account": "112233445566",
            "ifsc": "SBIN0007890"
        },
        {
            "user_id": "usr_49000be3-1b16-4468-8ab1-0bd8e51747d5",
            "email": "seller@shopmate.com",
            "name": "Abhishek Verma",
            "phone": "9900112233",
            "shop_id": "seller_shopmate_direct",
            "shop_name": "ShopMate Premier Store",
            "shop_slug": "shopmate-premier-store",
            "category": "General Merchandise",
            "description": "ShopMate official verified flagship store offering top quality home, electronics, and lifestyle goods.",
            "city": "Ahmedabad",
            "state": "Gujarat",
            "pincode": "380001",
            "gst_number": "24NEXOR1122D1Z1",
            "pan_number": "NEXOR1122D",
            "bank_account": "556677889900",
            "ifsc": "KKBK0001122"
        }
    ]

    with user_engine.connect() as conn:
        # 1. Create or update Super Admin
        admin_email = "admin@shopmate.com"
        admin_check = conn.execute(
            text("SELECT unique_id FROM users WHERE email = :email"),
            {"email": admin_email}
        ).fetchone()

        if not admin_check:
            admin_uid = f"usr_{uuid.uuid4()}"
            conn.execute(
                text("""
                    INSERT INTO users (id, unique_id, name, email, role, created_at)
                    VALUES (:id, :unique_id, :name, :email, 'ADMIN', NOW())
                """),
                {
                    "id": str(uuid.uuid4()),
                    "unique_id": admin_uid,
                    "name": "Platform Super Admin",
                    "email": admin_email,
                }
            )
            print(f"✅ Created Super Admin: {admin_email} ({admin_uid})")
        else:
            conn.execute(
                text("UPDATE users SET role = 'ADMIN', name = 'Platform Super Admin' WHERE email = :email"),
                {"email": admin_email}
            )
            print(f"✅ Verified Super Admin: {admin_email} ({admin_check[0]})")

        # 2. Create or update Sellers and SellerShops
        for s in sellers_data:
            existing_user = conn.execute(
                text("SELECT unique_id FROM users WHERE email = :email"),
                {"email": s["email"]}
            ).fetchone()

            if not existing_user:
                conn.execute(
                    text("""
                        INSERT INTO users (id, unique_id, name, email, phone, role, created_at)
                        VALUES (:id, :unique_id, :name, :email, :phone, 'SELLER', NOW())
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "unique_id": s["user_id"],
                        "name": s["name"],
                        "email": s["email"],
                        "phone": s["phone"],
                    }
                )
                user_id = s["user_id"]
                print(f"✅ Created Seller User: {s['email']} ({user_id})")
            else:
                user_id = existing_user[0]
                conn.execute(
                    text("UPDATE users SET role = 'SELLER', name = :name, phone = :phone WHERE unique_id = :uid"),
                    {"name": s["name"], "phone": s["phone"], "uid": user_id}
                )
                print(f"✅ Verified Seller User: {s['email']} ({user_id})")

            # Check SellerShop
            shop_check = conn.execute(
                text("SELECT id FROM seller_shops WHERE user_id = :user_id OR id = :shop_id"),
                {"user_id": user_id, "shop_id": s["shop_id"]}
            ).fetchone()

            if not shop_check:
                conn.execute(
                    text("""
                        INSERT INTO seller_shops (
                            id, user_id, shop_name, shop_slug, owner_name, email, phone,
                            category, description, city, state, pincode, gst_number, pan_number,
                            bank_account_number, ifsc_code, commission_percentage, is_verified, is_active, created_at
                        ) VALUES (
                            :id, :user_id, :shop_name, :shop_slug, :owner_name, :email, :phone,
                            :category, :description, :city, :state, :pincode, :gst_number, :pan_number,
                            :bank_account_number, :ifsc_code, '5.0', true, true, NOW()
                        )
                    """),
                    {
                        "id": s["shop_id"],
                        "user_id": user_id,
                        "shop_name": s["shop_name"],
                        "shop_slug": s["shop_slug"],
                        "owner_name": s["name"],
                        "email": s["email"],
                        "phone": s["phone"],
                        "category": s["category"],
                        "description": s["description"],
                        "city": s["city"],
                        "state": s["state"],
                        "pincode": s["pincode"],
                        "gst_number": s["gst_number"],
                        "pan_number": s["pan_number"],
                        "bank_account_number": s["bank_account"],
                        "ifsc_code": s["ifsc"],
                    }
                )
                print(f"✅ Created Seller Shop: {s['shop_name']} [{s['shop_id']}]")
            else:
                conn.execute(
                    text("""
                        UPDATE seller_shops SET
                            shop_name = :shop_name,
                            owner_name = :owner_name,
                            category = :category,
                            is_active = true,
                            is_verified = true,
                            commission_percentage = '5.0'
                        WHERE id = :id OR user_id = :user_id
                    """),
                    {
                        "id": shop_check[0],
                        "user_id": user_id,
                        "shop_name": s["shop_name"],
                        "owner_name": s["name"],
                        "category": s["category"],
                    }
                )
                print(f"✅ Updated Seller Shop: {s['shop_name']} [{shop_check[0]}]")

        conn.commit()

    # 3. Link all products in product_service_db
    print("\n📦 Connecting to product_service_db to link products...")
    prod_engine = create_engine(PRODUCT_DB_URL)
    
    with prod_engine.connect() as conn:
        products = conn.execute(text("SELECT unique_id, name, category_id, price FROM products")).fetchall()
        print(f"Found {len(products)} products in catalog.")

        tech_count = 0
        fresh_count = 0
        urban_count = 0
        premier_count = 0

        for p in products:
            uid, name, cat_id, price = p[0], p[1], (p[2] or "").lower(), float(p[3])
            name_lower = name.lower()

            # Smart categorization to match sellers
            if any(k in name_lower or k in cat_id for k in ["phone", "headphone", "earbud", "laptop", "watch", "smart", "tech", "gadget", "charger", "cable", "wireless", "tv", "speaker", "camera", "tablet", "mouse", "keyboard", "ssd", "usb", "screen"]):
                assigned_seller_id = "seller_technova_elec"
                assigned_shop_name = "TechNova Electronics"
                tech_count += 1
            elif any(k in name_lower or k in cat_id for k in ["snack", "tea", "coffee", "biscuit", "food", "organic", "grocery", "oil", "spice", "nut", "almond", "honey", "juice", "fruit", "flour", "rice", "dal", "sugar", "salt"]):
                assigned_seller_id = "seller_freshbasket_grc"
                assigned_shop_name = "FreshBasket Organics"
                fresh_count += 1
            elif any(k in name_lower or k in cat_id for k in ["shirt", "tshirt", "t-shirt", "shoe", "sneaker", "pant", "jean", "dress", "jacket", "hoodie", "sock", "kurta", "cloth", "wear", "bag", "wallet", "fashion"]):
                assigned_seller_id = "seller_urbanstyle_fsh"
                assigned_shop_name = "UrbanStyle Apparels"
                urban_count += 1
            else:
                assigned_seller_id = "seller_shopmate_direct"
                assigned_shop_name = "ShopMate Premier Store"
                premier_count += 1

            conn.execute(
                text("""
                    UPDATE products
                    SET seller_id = :seller_id,
                        shop_name = :shop_name,
                        created_by = :created_by,
                        is_active = true
                    WHERE unique_id = :uid
                """),
                {
                    "seller_id": assigned_seller_id,
                    "shop_name": assigned_shop_name,
                    "created_by": assigned_seller_id,
                    "uid": uid
                }
            )

        conn.commit()
        print(f"✅ Products Linked Successfully:")
        print(f"   • TechNova Electronics ({tech_count} products)")
        print(f"   • FreshBasket Organics ({fresh_count} products)")
        print(f"   • UrbanStyle Apparels ({urban_count} products)")
        print(f"   • ShopMate Premier Store ({premier_count} products)")

    # 4. Synchronize Order Items in order_service_db
    print("\n🧾 Connecting to order_service_db to sync order ledger items...")
    order_engine = create_engine(ORDER_DB_URL)
    with order_engine.connect() as conn:
        items = conn.execute(text("SELECT id, product_name, total_price, seller_id FROM order_items")).fetchall()
        print(f"Found {len(items)} order items.")

        for item in items:
            item_id, item_name, total_price, current_seller_id = item[0], item[1], float(item[2]), item[3]
            item_name_lower = (item_name or "").lower()

            if not current_seller_id or current_seller_id == "None":
                if any(k in item_name_lower for k in ["phone", "headphone", "earbud", "laptop", "watch", "tech", "gadget", "charger"]):
                    s_id = "seller_technova_01"
                    s_name = "TechNova Electronics"
                elif any(k in item_name_lower for k in ["snack", "tea", "coffee", "food", "grocery", "oil", "nut"]):
                    s_id = "seller_fresh_02"
                    s_name = "FreshBasket Organics"
                elif any(k in item_name_lower for k in ["shirt", "shoe", "pant", "dress", "jacket", "fashion"]):
                    s_id = "seller_urban_03"
                    s_name = "UrbanStyle Apparels"
                else:
                    s_id = "seller_shopmate_01"
                    s_name = "ShopMate Premier Store"

                fee = round(total_price * 0.05, 2)
                payout = round(total_price * 0.95, 2)

                conn.execute(
                    text("""
                        UPDATE order_items
                        SET seller_id = :seller_id,
                            shop_name = :shop_name,
                            commission_rate = 5.0,
                            platform_fee = :fee,
                            seller_payout = :payout
                        WHERE id = :item_id
                    """),
                    {
                        "seller_id": s_id,
                        "shop_name": s_name,
                        "fee": fee,
                        "payout": payout,
                        "item_id": item_id
                    }
                )

        conn.commit()
        print("✅ Order items synced with 5% platform fees and 95% payouts!")

if __name__ == "__main__":
    sync_admin_and_sellers()
