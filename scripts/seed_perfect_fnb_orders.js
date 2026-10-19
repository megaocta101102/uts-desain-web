const url = "https://ctcjauwqpfnvmcujvzoc.supabase.co/rest/v1/orders";
const key = "sb_publishable_O2Yg2oOZwxZx8IhBQHJPjg_P_Vr9nLx";

const customerNames = [
  "Budi Santoso", "Clara Wijaya", "Rian Pratama", "Siti Nurhaliza", 
  "Kevin Tan", "Amanda Putri", "Dimas Setiawan", "Nadia Safira", 
  "Fajar Ramadhan", "Dian Maharani", "Gita Lestari", "Reza Fahrezi", 
  "Maudy Kusuma", "Iqbal Ramadhan", "Tiara Anindya", "Lyodra Ginting", 
  "Raffi Ahmad", "Nagita Slavina", "Vidi Aldiano", "Isyana Sarasvati", 
  "Tulus Rusydi", "Ardhito Pramono", "Nadin Amizah", "Sal Priadi", 
  "Kunto Aji", "Baskara Putra", "Yura Yunita", "Raisa Andriana", 
  "Afgan Syahreza", "Angga Yunanda", "Shenina Cinnamon", "Adipati Perkasa", 
  "Prilly Latuconsina", "Pevita Pearce", "Nicholas Saputra", "Chelsea Islan", 
  "Tara Basro", "Chicco Jerikho", "Rio Dewanto", "Laura Basuki", 
  "Jerome Polin", "Fadil Jaidi", "Keanu Angelo", "Tasya Farasya",
  "Arief Muhammad", "Raditya Dika", "Desta Mahendra", "Vincent Rompies",
  "Enzy Storia", "Hesti Purwadinata", "Andre Taulany", "Sule Prikitiew"
];

const menuCatalog = [
  { name: 'Espresso Single Origin Gayo', price: 28000, category: 'minuman' },
  { name: 'Meo Velvet Blue Latte', price: 42000, category: 'minuman' },
  { name: 'Iced Spanish Sea Salt Latte', price: 45000, category: 'minuman' },
  { name: 'Matcha Cloud Ceremonial', price: 48000, category: 'minuman' },
  { name: 'Earl Grey French Lavender', price: 38000, category: 'minuman' },
  { name: 'Ocean Breeze Sapphire Mocktail', price: 42000, category: 'minuman' },
  { name: 'Seared Salmon with Lemon Caper', price: 85000, category: 'makanan' },
  { name: 'Wagyu Beef Cubes Rice Bowl', price: 95000, category: 'makanan' },
  { name: 'Truffle Cream Fettuccine', price: 68000, category: 'makanan' },
  { name: 'Artisan Almond Croissant', price: 36000, category: 'snack' },
  { name: 'Wild Blueberry Cream Tartlet', price: 42000, category: 'snack' },
  { name: 'Truffle Parmesan Hand-cut Fries', price: 38000, category: 'snack' },
];

const toppingsCatalog = [
  { name: 'Extra Espresso Shot', price: 8000 },
  { name: 'Oat Milk Upgrade', price: 10000 },
  { name: 'Brown Sugar Boba', price: 6000 },
  { name: 'Salted Caramel Drizzle', price: 5000 },
  { name: 'Whipped Cream Velvety', price: 7000 },
  { name: 'Melted Cheddar Cheese', price: 9000 },
];

function generateDayOrders(year, month, day, targetDailyRevenue, startSeq, prefix) {
  const dayOrders = [];
  let currentRev = 0;
  let seq = startSeq;

  while (currentRev < targetDailyRevenue) {
    seq++;
    const padSeq = String(seq).padStart(4, '0');
    const orderNumber = `${prefix}-${padSeq}`;
    
    // Hour: 09:00 to 21:55
    const hour = Math.floor(Math.random() * 13) + 9;
    const min = Math.floor(Math.random() * 60);
    const sec = Math.floor(Math.random() * 60);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}Z`;

    const customer = customerNames[Math.floor(Math.random() * customerNames.length)];
    const cashier = Math.random() > 0.5 ? 'Cindy' : 'Lulu';
    const payMethods = ['qris', 'qris', 'qris', 'cash', 'cash', 'debit'];
    const paymentMethod = payMethods[Math.floor(Math.random() * payMethods.length)];
    const orderType = Math.random() < 0.7 ? 'dine_in' : 'take_away';
    const tableNumber = orderType === 'dine_in' ? `T-${Math.floor(Math.random() * 12) + 1}` : '-';

    // 1 to 3 items per order
    const itemCount = Math.random() < 0.35 ? 1 : (Math.random() < 0.75 ? 2 : 3);
    const items = [];
    let subtotal = 0;

    for (let i = 0; i < itemCount; i++) {
      const menuItem = menuCatalog[Math.floor(Math.random() * menuCatalog.length)];
      const qty = Math.random() < 0.85 ? 1 : 2;
      
      const itemToppings = [];
      let toppingExtra = 0;
      if (Math.random() < 0.30) {
        const top = toppingsCatalog[Math.floor(Math.random() * toppingsCatalog.length)];
        itemToppings.push({ name: top.name, price: top.price });
        toppingExtra += top.price;
      }

      const itemTotal = (menuItem.price + toppingExtra) * qty;
      subtotal += itemTotal;

      items.push({
        menu_id: `m-${Math.floor(Math.random() * 12) + 1}`,
        menu_name: menuItem.name,
        price: menuItem.price,
        quantity: qty,
        toppings: itemToppings,
        subtotal: itemTotal,
        notes: ''
      });
    }

    const tax = Math.round(subtotal * 0.10);
    const total = subtotal + tax;
    currentRev += total;

    let amountPaid = total;
    let changeAmount = 0;
    if (paymentMethod === 'cash') {
      const cashRounded = Math.ceil(total / 50000) * 50000;
      amountPaid = cashRounded > total ? cashRounded : total + 50000;
      changeAmount = amountPaid - total;
    }

    dayOrders.push({
      order_number: orderNumber,
      customer_name: customer,
      table_number: tableNumber,
      order_type: orderType,
      cashier_name: cashier,
      subtotal: subtotal,
      tax: tax,
      discount: 0,
      total_amount: total,
      payment_method: paymentMethod,
      payment_status: 'paid',
      notes: JSON.stringify({
        amount_paid: amountPaid,
        change_amount: changeAmount,
        items: items
      }),
      created_at: dateStr
    });
  }

  return { orders: dayOrders, nextSeq: seq };
}

async function run() {
  console.log("Starting order generation with Supabase schema...");

  // 1. Delete old test orders
  console.log("Cleaning old test orders...");
  await fetch(`${url}?order_number=ilike.MEO-SEP%25`, {
    method: 'DELETE',
    headers: { apikey: key, Authorization: "Bearer " + key }
  });
  await fetch(`${url}?order_number=ilike.MEO-OCT%25`, {
    method: 'DELETE',
    headers: { apikey: key, Authorization: "Bearer " + key }
  });
  await fetch(`${url}?order_number=ilike.ORD-%25`, {
    method: 'DELETE',
    headers: { apikey: key, Authorization: "Bearer " + key }
  });

  const allOrders = [];

  // Generate September 1 to 30 (30 days)
  // Target: ~Rp 126.800.000 (~Rp 4.22M per day)
  let sepSeq = 0;
  for (let day = 1; day <= 30; day++) {
    const d = new Date(2026, 8, day);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const dailyTarget = isWeekend ? 4850000 : 3800000;

    const res = generateDayOrders(2026, 9, day, dailyTarget, sepSeq, 'MEO-SEP');
    sepSeq = res.nextSeq;
    allOrders.push(...res.orders);
  }

  // Generate October 1 to 14 (14 days)
  // Target: ~Rp 52.000.000 (~Rp 3.71M per day)
  let octSeq = 0;
  for (let day = 1; day <= 14; day++) {
    const d = new Date(2026, 9, day);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const dailyTarget = isWeekend ? 4500000 : 3350000;

    const res = generateDayOrders(2026, 10, day, dailyTarget, octSeq, 'MEO-OCT');
    octSeq = res.nextSeq;
    allOrders.push(...res.orders);
  }

  const sepTotal = allOrders.filter(o => o.created_at.startsWith('2026-09')).reduce((s, o) => s + o.total_amount, 0);
  const octTotal = allOrders.filter(o => o.created_at.startsWith('2026-10')).reduce((s, o) => s + o.total_amount, 0);

  console.log(`Generated ${allOrders.length} orders total.`);
  console.log(`Sep Orders: ${allOrders.filter(o => o.created_at.startsWith('2026-09')).length}, Total: Rp ${sepTotal.toLocaleString('id-ID')}`);
  console.log(`Oct Orders: ${allOrders.filter(o => o.created_at.startsWith('2026-10')).length}, Total: Rp ${octTotal.toLocaleString('id-ID')}`);

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < allOrders.length; i += batchSize) {
    const batch = allOrders.slice(i, i + batchSize);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(batch)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, err);
    } else {
      process.stdout.write(`Batch ${Math.floor(i / batchSize) + 1} inserted (${batch.length} orders)\n`);
    }
  }

  console.log("Finished seeding realistic orders successfully!");
}

run();
