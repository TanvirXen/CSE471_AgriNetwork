import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addToCart = (crop, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === crop.id);
      if (existing) {
        return prev.map(item => 
          item.id === crop.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, { ...crop, qty }];
    });
  };

  const updateQuantity = (cropId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === cropId) {
        const minQty = item.minimumOrderQty || 1;
        const newQty = item.qty + delta;
        if (newQty >= minQty) {
          return { ...item, qty: newQty };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (cropId) => {
    setCart(prev => prev.filter(item => item.id !== cropId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartTotal,
      isCartOpen,
      setIsCartOpen,
      showToast
    }}>
      {children}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#047857',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          animation: 'slideUp 0.3s ease-out'
        }}>
          🛒 {toastMessage}
        </div>
      )}
    </CartContext.Provider>
  );
};
