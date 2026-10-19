const url = "https://ctcjauwqpfnvmcujvzoc.supabase.co/rest/v1/orders";
const key = "sb_publishable_O2Yg2oOZwxZx8IhBQHJPjg_P_Vr9nLx";

const customerNames = [
  "Budi Santoso", "Dr. Hendra Kusuma", "Clara Wijaya", "Rian Pratama", 
  "Siti Nurhaliza", "Kevin Tanjaya", "Agus Setiawan", "Dina Mariana",
  "Fajar Nugroho", "Maya Anggraini", "David Hartono", "Nadia Safitri",
  "Reza Pahlevi", "Dewi Lestari", "Tommy Christian", "Sherly Gunawan",
  "Andreas Salim", "Mega Octavia", "Satria Dirgantara", "Vania Aurelia"
];

const cashiers = ["Cindy", "Lulu"];

const menuPool = [
  { id: "d05eaa30-0c46-47f0-b645-6a1bddd4808f", name: "Seared Salmon with Lemon Caper", price: 115000 },
  { id: "7ab993d0-9c66-4ecc-821b-4757e9d098df", name: "Wagyu Beef Cubes Rice Bowl", price: 88000 },
  { id: "fcf2ee8f-c921-46b4-a491-b1be1a420768", name: "Truffle Cream Fettuccine", price: 78000 },
  { id: "60ffdd9d-6d6f-4511-8253-812693995f7a", name: "Ocean Breeze Sapphire Mocktail", price: 48000 },
  { id: "9080ad8e-b4c3-45a8-873f-943985bcfbea", name: "Matcha Cloud Ceremonial", price: 46000 },
  { id: "b5b4685a-9620-4ba4-801a-64be16eecefe", name: "Iced Spanish Sea Salt Latte", price: 45000 },
  { id: "f67fae12-f2d5-4afc-a70d-0e87042b096f", name: "Meo Velvet Blue Latte", price: 42000 },
  { id: "7ad1e98e-2a4a-4f24-8dc6-0f834449e254", name: "Wild Blueberry Cream Tartlet", price: 42000 },
  { id: "6d76f0dc-0e8c-44d1-b7e8-8b020d9193d3", name: "Truffle Parmesan Hand-cut Fries", price: 38000 },
  { id: "ab754e30-9d17-42d1-8f66-1c1eb8385c76", name: "Earl Grey French Lavender", price: 38000 },
  { id: "24d0aa13-0863-4fc5-8cf2-8d05fc67c8b3", name: "Artisan Almond Croissant", price: 36000 },
  { id: "91a09460-9ca4-4ef6-a1e7-040e350ee75a", name: "Espresso Single Origin Gayo", price: 28000 }
];

const toppingsPool = [
  { id: "t-1", name: "Extra Espresso Shot", price: 6000 },
  { id: "t-2", name: "Oat Milk Upgrade", price: 8000 },
  { id: "t-3", name: "Brown Sugar Boba", price: 5000 },
  { id: "t-4", name: "Melted Cheddar Cheese", price: 7000 }
];

async function seed() {
  const allOrders = [];
  let totalRevenueGenerated = 0;

  // Generate for 30 days of September 2026
  for (let day = 1; day <= 30; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    // 5 orders per day with substantial combos
    const ordersPerDay = 5;

    for (let ordIdx = 1; ordIdx <= ordersPerDay; ordIdx++) {
      const orderNum = `MEO-SEP${dayStr}-${String(ordIdx).padStart(2, '0')}`;
      const customer = customerNames[(day * 7 + ordIdx) % customerNames.length];
      const cashier = cashiers[(day + ordIdx) % cashiers.length];
      const isDineIn = ordIdx % 2 !== 0;
      const tableNum = isDineIn ? String((ordIdx * 2 + day) % 12 + 1) : '-';
      const orderType = isDineIn ? 'dine_in' : 'take_away';

      // Pick 3 to 5 items with high probability of gourmet main courses
      const items = [];
      let subtotal = 0;

      // Guaranteed gourmet dish: Salmon or Wagyu or Truffle Fettuccine
      const mainDish = menuPool[(day + ordIdx) % 3];
      const mainQty = 1 + (ordIdx % 2);
      const mainItemSub = mainDish.price * mainQty;
      items.push({
        menu_id: mainDish.id,
        menu_name: mainDish.name,
        price: mainDish.price,
        quantity: mainQty,
        toppings: [],
        subtotal: mainItemSub
      });
      subtotal += mainItemSub;

      // Drinks
      const drink1 = menuPool[3 + ((day * 2 + ordIdx) % 4)];
      const dQty = 1 + (day % 2);
      const drinkSub = drink1.price * dQty;
      items.push({
        menu_id: drink1.id,
        menu_name: drink1.name,
        price: drink1.price,
        quantity: dQty,
        toppings: ordIdx % 2 === 0 ? [toppingsPool[0]] : [],
        subtotal: drinkSub
      });
      subtotal += drinkSub;

      // Side / Dessert / Second Main
      const side = menuPool[7 + ((day + ordIdx * 3) % 5)];
      const sQty = 1;
      const sideSub = side.price * sQty;
      items.push({
        menu_id: side.id,
        menu_name: side.name,
        price: side.price,
        quantity: sQty,
        toppings: [],
        subtotal: sideSub
      });
      subtotal += sideSub;

      // Group catering order on evening shifts (ordIdx === 4 or 5)
      if (ordIdx >= 4) {
        const extraMain = menuPool[1]; // Wagyu
        items.push({
          menu_id: extraMain.id,
          menu_name: extraMain.name,
          price: extraMain.price,
          quantity: 2,
          toppings: [],
          subtotal: extraMain.price * 2
        });
        subtotal += extraMain.price * 2;
      }

      // Add fixed booster on some orders to hit the realistic ~Rp 285.000.000 across 30 days
      // ~9.5M per day / 5 orders = ~1.9M per order average (catering / executive billing)
      const multiplier = 3.5 + ((day % 4) * 0.4);
      const boostedItems = items.map(it => ({
        ...it,
        quantity: Math.max(1, Math.round(it.quantity * multiplier)),
        subtotal: Math.round(it.price * Math.max(1, Math.round(it.quantity * multiplier)))
      }));

      const finalSubtotal = boostedItems.reduce((acc, it) => acc + it.subtotal, 0);
      const tax = Math.round(finalSubtotal * 0.1);
      const totalAmount = finalSubtotal + tax;

      const hour = 11 + ((ordIdx * 2) % 10);
      const minute = (day * 13 + ordIdx * 7) % 60;
      const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
      const minStr = minute < 10 ? `0${minute}` : `${minute}`;
      const createdAt = `2026-09-${dayStr}T${hourStr}:${minStr}:00+07:00`;

      const paymentMethod = ordIdx % 3 === 0 ? 'cash' : (ordIdx % 3 === 1 ? 'qris' : 'transfer');
      const amountPaid = paymentMethod === 'cash' ? Math.ceil(totalAmount / 50000) * 50000 : totalAmount;
      const changeAmount = amountPaid - totalAmount;

      totalRevenueGenerated += totalAmount;

      allOrders.push({
        order_number: orderNum,
        customer_name: customer,
        table_number: tableNum,
        order_type: orderType,
        cashier_name: cashier,
        subtotal: finalSubtotal,
        tax: tax,
        discount: 0,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: 'paid',
        notes: JSON.stringify({
          amount_paid: amountPaid,
          change_amount: changeAmount,
          items: boostedItems
        }),
        created_at: createdAt
      });
    }
  }

  console.log(`Generated ${allOrders.length} orders. Total revenue: Rp ${totalRevenueGenerated.toLocaleString('id-ID')}`);

  // Insert in chunks of 25 to Supabase
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
    console.log(`Chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(allOrders.length / chunkSize)} status: ${res.status}`);
    if (!res.ok) {
      const errText = await res.text();
      console.error("Chunk failed:", errText);
    }
  }
  console.log("Seeding September complete!");
}

seed().catch(console.error);
