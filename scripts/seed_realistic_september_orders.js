const url = "https://ctcjauwqpfnvmcujvzoc.supabase.co/rest/v1/orders";
const key = "sb_publishable_O2Yg2oOZwxZx8IhBQHJPjg_P_Vr9nLx";

const customerNames = [
  "Budi Santoso", "Clara Wijaya", "Rian Pratama", "Siti Nurhaliza", 
  "Kevin Tanjaya", "Agus Setiawan", "Dina Mariana", "Fajar Nugroho", 
  "Maya Anggraini", "David Hartono", "Nadia Safitri", "Reza Pahlevi", 
  "Dewi Lestari", "Tommy Christian", "Sherly Gunawan", "Andreas Salim", 
  "Mega Octavia", "Satria Dirgantara", "Vania Aurelia", "Rizky Ramadhan",
  "Anisa Rahma", "Dimas Prasetyo", "Indah Permata", "Bambang Pamungkas"
];

const cashiers = ["Cindy", "Lulu"];

const menus = [
  { id: "f67fae12-f2d5-4afc-a70d-0e87042b096f", name: "Meo Velvet Blue Latte", price: 42000 },
  { id: "91a09460-9ca4-4ef6-a1e7-040e350ee75a", name: "Espresso Single Origin Gayo", price: 28000 },
  { id: "b5b4685a-9620-4ba4-801a-64be16eecefe", name: "Iced Spanish Sea Salt Latte", price: 45000 },
  { id: "ab754e30-9d17-42d1-8f66-1c1eb8385c76", name: "Earl Grey French Lavender", price: 38000 },
  { id: "9080ad8e-b4c3-45a8-873f-943985bcfbea", name: "Matcha Cloud Ceremonial", price: 46000 },
  { id: "24d0aa13-0863-4fc5-8cf2-8d05fc67c8b3", name: "Artisan Almond Croissant", price: 36000 },
  { id: "7ad1e98e-2a4a-4f24-8dc6-0f834449e254", name: "Wild Blueberry Cream Tartlet", price: 42000 },
  { id: "6d76f0dc-0e8c-44d1-b7e8-8b020d9193d3", name: "Truffle Parmesan Hand-cut Fries", price: 38000 },
  { id: "60ffdd9d-6d6f-4511-8253-812693995f7a", name: "Ocean Breeze Sapphire Mocktail", price: 48000 },
  { id: "fcf2ee8f-c921-46b4-a491-b1be1a420768", name: "Truffle Cream Fettuccine", price: 78000 },
  { id: "d05eaa30-0c46-47f0-b645-6a1bddd4808f", name: "Seared Salmon with Lemon Caper", price: 115000 },
  { id: "7ab993d0-9c66-4ecc-821b-4757e9d098df", name: "Wagyu Beef Cubes Rice Bowl", price: 88000 }
];

const toppings = [
  { id: "t-1", name: "Extra Espresso Shot", price: 6000 },
  { id: "t-2", name: "Oat Milk Upgrade", price: 8000 },
  { id: "t-3", name: "Brown Sugar Boba", price: 5000 },
  { id: "t-4", name: "Melted Cheddar Cheese", price: 7000 }
];

// Realistic realistic order combinations (1 - 3 items per customer, Rp 30.000 - Rp 150.000)
function generateOrderForShift(day, ordIdx) {
  const dayStr = day < 10 ? `0${day}` : `${day}`;
  const orderNum = `MEO-SEP${dayStr}-${String(ordIdx).padStart(2, '0')}`;
  const customer = customerNames[(day * 3 + ordIdx) % customerNames.length];
  const cashier = cashiers[(day + ordIdx) % 2];
  const isDineIn = (ordIdx % 3) !== 0;
  const tableNum = isDineIn ? String((ordIdx * 2 + day) % 10 + 1) : '-';
  const orderType = isDineIn ? 'dine_in' : 'take_away';

  // Realistic combos based on typical Indonesian cafe habits
  const comboType = (day + ordIdx) % 6;
  const items = [];
  let subtotal = 0;

  if (comboType === 0) {
    // 1 Kopi favorit + 1 Croissant
    const coffee = menus[0]; // Meo Velvet Blue Latte (42k)
    const pastry = menus[5]; // Almond Croissant (36k)
    items.push({
      menu_id: coffee.id,
      menu_name: coffee.name,
      price: coffee.price,
      quantity: 1,
      toppings: (ordIdx % 2 === 0) ? [toppings[1]] : [], // Oat Milk
      subtotal: coffee.price + ((ordIdx % 2 === 0) ? toppings[1].price : 0)
    });
    items.push({
      menu_id: pastry.id,
      menu_name: pastry.name,
      price: pastry.price,
      quantity: 1,
      toppings: [],
      subtotal: pastry.price
    });
  } else if (comboType === 1) {
    // 1 Makanan Berat + 1 Minuman Segar (Lunch / Dinner)
    const main = (ordIdx % 2 === 0) ? menus[11] : menus[9]; // Wagyu (88k) or Fettuccine (78k)
    const drink = menus[8]; // Ocean Breeze Sapphire Mocktail (48k)
    items.push({
      menu_id: main.id,
      menu_name: main.name,
      price: main.price,
      quantity: 1,
      toppings: [],
      subtotal: main.price
    });
    items.push({
      menu_id: drink.id,
      menu_name: drink.name,
      price: drink.price,
      quantity: 1,
      toppings: [],
      subtotal: drink.price
    });
  } else if (comboType === 2) {
    // 1 Kopi Espresso / Sea Salt Latte saja (Quick Coffee Break)
    const drink = (ordIdx % 2 === 0) ? menus[2] : menus[1]; // Spanish Sea Salt Latte (45k) or Espresso (28k)
    const tops = (ordIdx % 2 === 0) ? [toppings[0]] : []; // Extra shot
    const itemSub = drink.price + (tops.length > 0 ? tops[0].price : 0);
    items.push({
      menu_id: drink.id,
      menu_name: drink.name,
      price: drink.price,
      quantity: 1,
      toppings: tops,
      subtotal: itemSub
    });
  } else if (comboType === 3) {
    // 1 Matcha Cloud + 1 Tartlet (Dessert session)
    const drink = menus[4]; // Matcha Cloud (46k)
    const dessert = menus[6]; // Tartlet (42k)
    items.push({
      menu_id: drink.id,
      menu_name: drink.name,
      price: drink.price,
      quantity: 1,
      toppings: [toppings[2]], // Boba
      subtotal: drink.price + toppings[2].price
    });
    items.push({
      menu_id: dessert.id,
      menu_name: dessert.name,
      price: dessert.price,
      quantity: 1,
      toppings: [],
      subtotal: dessert.price
    });
  } else if (comboType === 4) {
    // Hangout Duo: 2 Minuman + 1 Kentang Goreng
    const drink1 = menus[2]; // Spanish Sea Salt (45k)
    const drink2 = menus[3]; // Earl Grey (38k)
    const fries = menus[7]; // Truffle Fries (38k)
    items.push({
      menu_id: drink1.id,
      menu_name: drink1.name,
      price: drink1.price,
      quantity: 1,
      toppings: [],
      subtotal: drink1.price
    });
    items.push({
      menu_id: drink2.id,
      menu_name: drink2.name,
      price: drink2.price,
      quantity: 1,
      toppings: [],
      subtotal: drink2.price
    });
    items.push({
      menu_id: fries.id,
      menu_name: fries.name,
      price: fries.price,
      quantity: 1,
      toppings: [toppings[3]], // Cheddar
      subtotal: fries.price + toppings[3].price
    });
  } else {
    // Gourmet Special: Seared Salmon (115k) + Tea (38k)
    const main = menus[10]; // Salmon (115k)
    const tea = menus[3]; // Earl Grey (38k)
    items.push({
      menu_id: main.id,
      menu_name: main.name,
      price: main.price,
      quantity: 1,
      toppings: [],
      subtotal: main.price
    });
    items.push({
      menu_id: tea.id,
      menu_name: tea.name,
      price: tea.price,
      quantity: 1,
      toppings: [],
      subtotal: tea.price
    });
  }

  subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
  const tax = Math.round(subtotal * 0.1);
  const totalAmount = subtotal + tax;

  // Realistic timestamps distributed throughout cafe operating hours (08:30 to 21:30)
  const hours = [8, 10, 12, 13, 15, 17, 19, 21];
  const hour = hours[(ordIdx - 1) % hours.length];
  const minute = (day * 7 + ordIdx * 11) % 60;
  const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
  const minStr = minute < 10 ? `0${minute}` : `${minute}`;
  const createdAt = `2026-09-${dayStr}T${hourStr}:${minStr}:00+07:00`;

  const paymentMethod = ordIdx % 3 === 0 ? 'cash' : (ordIdx % 3 === 1 ? 'qris' : 'transfer');
  const amountPaid = paymentMethod === 'cash' ? Math.ceil(totalAmount / 10000) * 10000 : totalAmount;
  const changeAmount = amountPaid - totalAmount;

  return {
    order_number: orderNum,
    customer_name: customer,
    table_number: tableNum,
    order_type: orderType,
    cashier_name: `Kasir ${cashier}`,
    subtotal: subtotal,
    tax: tax,
    discount: 0,
    total_amount: totalAmount,
    payment_method: paymentMethod,
    payment_status: 'paid',
    notes: JSON.stringify({
      amount_paid: amountPaid,
      change_amount: changeAmount,
      items: items
    }),
    created_at: createdAt
  };
}

async function run() {
  const allOrders = [];
  let totalRevenue = 0;

  // 30 days of September 2026: 7 realistic orders each day = 210 orders
  for (let day = 1; day <= 30; day++) {
    const ordersToday = 7;
    for (let ordIdx = 1; ordIdx <= ordersToday; ordIdx++) {
      const order = generateOrderForShift(day, ordIdx);
      totalRevenue += order.total_amount;
      allOrders.push(order);
    }
  }

  console.log(`Prepared ${allOrders.length} realistic orders.`);
  console.log(`Total September POS Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}`);
  console.log(`Average Order Value: Rp ${Math.round(totalRevenue / allOrders.length).toLocaleString('id-ID')}`);

  // Insert to Supabase in batches of 25
  const chunkSize = 25;
  for (let i = 0; i < allOrders.length; i += chunkSize) {
    const chunk = allOrders.slice(i, i + chunkSize);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(chunk)
    });
    console.log(`Batch ${Math.floor(i / chunkSize) + 1}/${Math.ceil(allOrders.length / chunkSize)} - Status: ${res.status}`);
    if (!res.ok) {
      const err = await res.text();
      console.error("Batch error:", err);
    }
  }

  console.log("Realistic September 2026 Orders successfully seeded!");
}

run().catch(console.error);
