// Edge Mart Store Initial Hydration Data & Categories List

import { Category, Product } from "../types";

export const INITIAL_CATEGORIES: Omit<Category, "spent">[] = [
  { id: "fresh-produce", name: "Fresh Produce", budget: 35000 },
  { id: "meat-poultry", name: "Meat & Poultry", budget: 40000 },
  { id: "dairy-eggs", name: "Dairy & Eggs", budget: 20000 },
  { id: "frozen-foods", name: "Frozen Foods", budget: 25000 },
  { id: "beverages", name: "Beverages", budget: 45000 },
  { id: "snacks-candy", name: "Snacks & Candy", budget: 25000 },
  { id: "pantry-staples", name: "Pantry Staples", budget: 30000 },
  { id: "canned-goods", name: "Canned Goods", budget: 15000 },
  { id: "bread-bakery", name: "Bread & Bakery", budget: 10000 },
  { id: "household-supplies", name: "Household Supplies", budget: 20000 },
  { id: "health-beauty", name: "Health & Beauty", budget: 15000 },
  { id: "pet-supplies", name: "Pet Supplies", budget: 10000 },
  { id: "miscellaneous", name: "Miscellaneous", budget: 10000 },
];

// Seed lists with 16 products each to reach ~208 high-quality grocery catalog items
const SEED_CATALOG_TEMPLATES: Record<string, { items: string[]; startPrice: number; image: string; desc: string }> = {
  "fresh-produce": {
    image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&auto=format&fit=crop&q=60",
    startPrice: 1.49,
    desc: "Premium fresh farm-harvested agricultural produce.",
    items: [
      "Hass Avocados (Pack of 4)", "Honeycrisp Apples Premium (1kg)", "Cavendish Bananas Bunch",
      "Organic Baby Spinach (300g)", "Vine-Ripened Roma Tomatoes (1kg)", "English Seedless Cucumber",
      "Fresh Strawberries (450g)", "Sweet Blueberries (170g)", "Broccoli Crowns Fresh",
      "Idaho Russet Potatoes (5kg)", "Sweet Yellow Onions (2kg)", "Seedless Red Grapes (1kg)",
      "Premium Portobello Mushrooms", "Sweet Corn Crisp (4 Ears)", "Multi-Color Bell Peppers (3-Pack)",
      "Organic Romaine Hearts (3-Pack)"
    ]
  },
  "meat-poultry": {
    image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop&q=60",
    startPrice: 6.99,
    desc: "Butcher grade fresh meats, ethically farm reared.",
    items: [
      "Organic Boneless Chicken Breasts (1kg)", "Premium Angus Ground Beef 85/15 (500g)", "Thick-Cut Applewood Pork Bacon (450g)",
      "Fresh Chicken Thighs Value Pack (1.5kg)", "Premium New York Strip Steak (400g)", "Ethically Reared Grass-Fed Beef Ribs (1.2kg)",
      "Fresh Turkey Breast Slices (400g)", "Premium Whole Rotisserie Chicken", "Sweet Italian Pork Sausage (500g)",
      "Premium Lamb Loin Chops (450g)", "Center-Cut Bone-In Pork Chops (1kg)", "Fresh Chicken Wings Party Pack (1.5kg)",
      "Lean Pork Tenderloin Coated (600g)", "Premium Bison Burger Patties (4-pack)", "Premium Smoked Hickory Ham Leg",
      "Fresh Beef Stew Cubes Premium (1kg)"
    ]
  },
  "dairy-eggs": {
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=60",
    startPrice: 2.49,
    desc: "Grade A organic dairy products and pasture-raised farm eggs.",
    items: [
      "Organic Whole Vitamin D Milk (1 Gallon)", "Grade-A Pasture-Raised Large Eggs (18-Pack)", "Unsalted Sweet Cream Butter (450g)",
      "Grated Parmesan Cheese Wheel Bowl", "Greek Strawberry Yogurt Tub (1kg)", "Shredded Sharp Cheddar Blend (500g)",
      "Organic Whipped Cream Cheese (250g)", "Fresh Cultured Cottage Cheese (450g)", "Heavy Whipping Cream Pint",
      "Provolone Cheese Sliced Deli (400g)", "Organic Whole-Milk Mozzarella (500g)", "Original Oat Milk Oatly (1.8L)",
      "Vanilla Almond Breeze Unsweetened (1.8L)", "Organic Sour Cream Tub (450g)", "Feta Cheese Crumbles Mediterranean (250g)",
      "Artisanal Swiss Cheese Block (300g)"
    ]
  },
  "frozen-foods": {
    image: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600&auto=format&fit=crop&q=60",
    startPrice: 3.99,
    desc: "Convenient, nutrient-locked flash frozen foods and appetizers.",
    items: [
      "Frozen Wild Blueberries (1kg)", "Crinkle Cut French Fries (1.5kg)", "Wood-Fired Pepperoni Pizza Premium",
      "Stir-Fry Vegetable Supreme Blend (1kg)", "Crispy Chicken Nuggets Golden (1.2kg)", "Angus Beef Lasagna Family Size",
      "Frozen Broccoli Florets Jumbo (1kg)", "Belgian Style Waffles (12-Count)", "Premium Cookie Dough Ice Cream Pint",
      "Fully Cooked Frozen Cocktail Meatballs", "Premium Frozen Salmon Burgers (4-Pack)", "Wild Caught Alaskan Cod Fillets (1kg)",
      "Frozen Super-Sweet Cut Corn (1kg)", "Premium Chicken Pot Pie (4-pack)", "Philly Cheesesteak Hot Pockets (6-Pack)",
      "Frozen Garlic Bread-sticks Premium"
    ]
  },
  "beverages": {
    image: "https://images.unsplash.com/photo-1527960656366-ee2a999e32e6?w=600&auto=format&fit=crop&q=60",
    startPrice: 1.99,
    desc: "Refreshing carbonated sodas, natural juices, mineral waters, and energy drinks.",
    items: [
      "Purified Spring Water Case (24-Pack)", "Classic Cola Carbonated Soda (12-Pack)", "Organic Cold-Pressed Orange Juice (1.8L)",
      "Unsweetened Iced Black Tea Bottle (2L)", "Premium Roasted Coffee Beans (1kg)", "Sparkling Lime Mineral Water (8-Pack)",
      "Zero Sugar Energy Elixir (4-Pack)", "Organic Red Grapefruit Juice (1.5L)", "Pure Coconut Water Pure Hydration (1L)",
      "Original Apple Cider Premium (2L)", "Diet Cola Soda Citrus (12-Pack)", "Premium Hot Cocoa Mix canister (600g)",
      "Chai Latte Concentrated Base (1L)", "Sparkling Apple Cider Celebration (750ml)", "Organic Tomato Juice Wellness (1.3L)",
      "Lemonade Stand Premium Sweet (1.8L)"
    ]
  },
  "snacks-candy": {
    image: "https://images.unsplash.com/photo-1599490659223-930bfa497705?w=600&auto=format&fit=crop&q=60",
    startPrice: 2.29,
    desc: "Delicious sweet and savory snacks to boost your energy anytime.",
    items: [
      "Kettle Cooked Sea Salt Potato Chips (400g)", "Organic Whole Grain Tortilla Chips (500g)", "Roasted Sea Salt Almonds Jar (450g)",
      "Classic Milk Chocolate Bar (6-Pack)", "Gummy Bear Fruit Medley Tub (1kg)", "Buttery Theatre Style Microwave Popcorn",
      "Double Chocolate Chunk Cookies Box", "Crunchy Honey Oat Granola Bars (24-Count)", "White Cheddar Oven-Baked Cheese Puffs",
      "Premium Holiday mixed Nuts Canister (500g)", "Peanut Butter Stuffed Pretzel Nuggets", "Chewy Chocolate Chip Rice Crispy (12-Pack)",
      "Dark Chocolate Sea Salt Caramel Caramels", "Extreme Sour Fruit Skittles Party Bag", "Premium Natural Beef Jerky Strips (300g)",
      "Toasted Whole Wheat Snack Crackers"
    ]
  },
  "pantry-staples": {
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=60",
    startPrice: 1.19,
    desc: "Essential pantry ingredients, flour, rice, and seasoning blends.",
    items: [
      "Long Grain White Rice Sack (10kg)", "Premium Organic Olive Oil (1L)", "Unbleached All-Purpose Flour (5kg)",
      "Granulated Cane Sugar Bag (4kg)", "Premium Canola Frying Oil (3L)", "Organic Quinoa Grain Bag (1.5kg)",
      "Pink Himalayan Sea Salt Grinder", "Pure Clover Honey Squeeze Bottle (800g)", "Semolina Penne Rigate Pasta Box (1kg)",
      "Organic Ground Cinnamon spice Jar", "Natural Creamy Peanut Butter Jar (1kg)", "Premium Maple Syrup Vermont Grade A",
      "Real Mayonnaise Squeeze Bottle (1L)", "Classic Yellow Mustard Squeeze (600g)", "Organic Coconut Milk Organic Can",
      "Traditional Ketchup Premium Squeeze (1L)"
    ]
  },
  "canned-goods": {
    image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&auto=format&fit=crop&q=60",
    startPrice: 0.99,
    desc: "High-quality canned vegetables, soups, beans, and preserved foods.",
    items: [
      "Canned Organic Black Beans (400g)", "Sweet Whole Kernel Golden Corn Cans", "Cream of Mushroom Condensed Soup",
      "Chunk Light Tuna in Water (4-Pack)", "Crushed San Marzano Tomatoes Can (800g)", "Canned Wild Pink Salmon Premium",
      "Organic Garbanzo Beans Cans Premium", "Chicken Noodle Comfort Soup Large Can", "Organic Diced Green Chilis Cans",
      "Traditional Baked Beans Brown Sugar Can", "Sliced Sweet Pineapple Rings Canned", "Canned Cut Green Beans (400g)",
      "Preserved Canned Sweet Garden Peas", "Hearty Beef & Vegetable Canned Stew", "Organic Tomato Paste Can (150g)",
      "Rich Coconut Cream Preserve Imperial"
    ]
  },
  "bread-bakery": {
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=60",
    startPrice: 1.89,
    desc: "Fresh, daily baked artisanal loaves, loaves, rolls and pastries.",
    items: [
      "Artisanal Sourdough Boule Freshly Baked", "Organic 100% Whole Wheat Toast Slices", "Buttery Brioche Hamburger Buns (8-pack)",
      "Thick Belgian Chocolate Fudge Brownies", "Soft Glazed Donuts Supreme (6-Pack)", "Fresh Baked All-Butter Croissants (4-Pack)",
      "Everything Bagels Bakery Fresh (6-Pack)", "Soft Flour Tortillas Fajita Size (10-Count)", "Sweet Cinnamon Rolls Crumb Cupcakes",
      "Premium Rye Sliced Sandwich Bread", "Traditional French Baguette Golden Crust", "Soft Oatmeal Honey Baked Loaf",
      "Blueberry Bakery muffins Fresh (4-Pack)", "Gluten Free Artisanal White Bread", "Country-Style Garlic Knots Bread (12-Pack)",
      "Premium Sourdough English Muffins (6-pack)"
    ]
  },
  "household-supplies": {
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=60",
    startPrice: 4.99,
    desc: "Home care utility items, cleaning supplies, paper products, and detergents.",
    items: [
      "Ultra Strength Laundry Detergent Liquid (3L)", "Ultra Soft Double Roll Toilet Paper (24 Rolls)", "Strong Multi-Surface Paper Towels (8-Pack)",
      "High Capacity Garbage Trash Bags (50-Pack)", "Antibacterial Multi-Purpose Cleaning Spray", "Concentrated Citrus Dish Soap Liquid",
      "Advanced Automatic Dishwasher Pods (60-Ct)", "Organic Fabric Softener Fresh Linen (1.5L)", "Thick Disinfecting Wipes Canister (80-Ct)",
      "Non-Scratch heavy duty Scrub Sponges (6-Pack)", "Plush Microfiber Cleaning Towels (12-Pack)", "Heavy Duty Aluminum Foil Roll (100 Sq Ft)",
      "Heavy Wood Safe Floor Cleaner Solution", "All-Temp Color-Safe Powder Bleach Sack", "Cling Wrap Food Preserver Roll (200 Sq Ft)",
      "Citrus Air Freshener Odor Eliminator Spray"
    ]
  },
  "health-beauty": {
    image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=60",
    startPrice: 3.49,
    desc: "Quality self-care, personal hygiene, cosmetics, and wellness products.",
    items: [
      "Deep Clean Extra Mint Fluoride Toothpaste", "Tea Tree Lavender Hydration Body Wash", "Organic Shea Butter Hand Lotion",
      "Moisturizing Argan Oil Shampoo (1L)", "Moisturizing Silk Argan Conditioner (1L)", "Alcohol-Free Mint Antiseptic Mouthwash",
      "Hydrating Coconut Hand Wash Sanitizer", "Aluminum-Free Eucalyptus Body Deodorant", "Premium Comfort Cotton Swabs (500-pack)",
      "Ultra Hydrating Facial Cleanser Foam", "Daily Multi-Vitamin & Mineral Tablets", "Soothing Aloe Vera After-Sun Gel",
      "Gentle Lavender Baby Wash Shampoo", "Activated Charcoal Facial Scrub Mud", "Mineral SPF 50 Broad spectrum Sunscreen",
      "Premium Micro-Bristle Soft Toothbrushes"
    ]
  },
  "pet-supplies": {
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=60",
    startPrice: 2.99,
    desc: "Wholesome foods, snacks, toys, and care items for your beloved pets.",
    items: [
      "Natural Chicken & Brown Rice Dog Kibble (10kg)", "Premium Salmon Recipe Dry Cat Food (5kg)", "Odor-Lock Scoopable Clay Cat Litter (15kg)",
      "Gourmet Beef Stew Canned Dog Food (6-Pack)", "Tender Poultry Feast Canned Cat Food (12-Pack)", "Wild Salmon Recipe Dog Treats Bag",
      "Catnip Infused Interactive Toy Mouse", "Heavy-Duty Braided Cotton Tug Leash rope", "Premium Nylon Adjustable Pet Collar",
      "Oatmeal Soothing Dog Shampoo (1L)", "Interactive Tennis ball Chew Toys (4-pack)", "Healthy Joint Care Glucosamine Dog Chews",
      "Fresh Tuna Flavor Cat Treats Pack", "Plush Orthopedic Pet Lounger Pillow Bed", "Premium Wire Flea Comb De-shedding Tool",
      "Eco-Friendly Compostable Pet Waste Bags (120-Ct)"
    ]
  },
  "miscellaneous": {
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=60",
    startPrice: 2.59,
    desc: "A collection of general store goods, seasonal accessories, and handy gadgets.",
    items: [
      "Durable Stainless Steel Water Bottle (1L)", "Multi-Size Alkaline AA Batteries Pack (16-Count)", "LED Durable Tactical Flashlight Zoomable",
      "Premium Plastic Storage Bins with Lids", "All-Purpose Utility Extension Cord (15ft)", "Premium Multipurpose Utility Scissors Bundle",
      "Heavy-Duty Weatherproof Duct Tape Roll", "Aromatherapy Lavender Scented Wax Candles", "Reusable Eco Canvas Grocery Bags (5-Pack)",
      "Premium Scented Incense Sticks holder Packet", "Durable All-Weather Outdoor Lock Key", "Compact Travel Umbrella Auto-Open Rain",
      "Laminated Lined School Composition Notebook", "Black Ink Retractable Roller-ball Pens (12-Pack)", "Universal Quick Charge USB-C Cable",
      "High Capacity Power Bank 10000mAh Portable"
    ]
  }
};

// Generates exactly 208 products sequentially (13 categories * 16 unique names)
export const generateProducts = (): Product[] => {
  const products: Product[] = [];

  Object.entries(SEED_CATALOG_TEMPLATES).forEach(([catId, meta]) => {
    meta.items.forEach((itemName, index) => {
      // Calculate realistic price variance above/below startPrice
      const priceOffset = parseFloat((index * 0.45).toFixed(2));
      const price = parseFloat((meta.startPrice + priceOffset).toFixed(2));
      
      // Stock quantity variance (typically 50 to 180 units)
      const stock = 50 + ((index * 7) % 130);

      products.push({
        id: `${catId}-${index + 1}`,
        name: itemName,
        price,
        category: catId,
        image: meta.image,
        stock,
        description: `${meta.desc} Perfect for family meals and wholesale commercial kitchens. Highly recommended for bulk procurement orders.`
      });
    });
  });

  return products;
};
