
let cart = [];
let listeners = [];

export const getCart = () => cart;

export const getCartCount = () => {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
};

export const getCartTotal = () => {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

const notify = () => {
  listeners.forEach(listener => {
    try {
      listener([...cart]);
    } catch (e) {
      console.error("Error in cartStore listener:", e);
    }
  });
};

export const addToCart = (medicine) => {
  const existing = cart.find(item => item.id === medicine.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: medicine.id,
      name: medicine.name,
      nameUrdu: medicine.name_urdu || '',
      price: parseFloat(medicine.price),
      strength: medicine.strength || 'units',
      dosageForm: medicine.dosage_form || 'Medicine',
      category: medicine.category,
      pharmacyId: medicine.pharmacy_id,
      quantity: 1
    });
  }
  notify();
};

export const updateQuantity = (medicineId, quantity) => {
  const item = cart.find(item => item.id === medicineId);
  if (item) {
    item.quantity = Math.max(1, quantity);
    notify();
  }
};

export const removeFromCart = (medicineId) => {
  cart = cart.filter(item => item.id !== medicineId);
  notify();
};

export const clearCart = () => {
  cart = [];
  notify();
};

export const subscribeCart = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};
