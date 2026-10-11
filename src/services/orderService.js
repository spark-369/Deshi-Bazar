import { api } from "./api";

export const orderService = {
  // Get user's all orders (regular + custom)
  async getOrders(filters = {}) {
    // Handle both old pattern (getOrders(status)) and new pattern (getOrders({ status, type }))
    let params = {};
    if (typeof filters === "string" || filters === null) {
      if (filters) params.status = filters;
    } else {
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
    }
    // Get regular orders
    const regularData = await api.get("/api/orders", { params });
    const regularOrders = Array.isArray(regularData)
      ? regularData
      : regularData.orders || [];

    // Get custom orders
    const customData = await api.get("/api/custom-orders", { params });
    const customOrders = Array.isArray(customData) ? customData : [];

    // Combine and sort by createdAt
    const allOrders = [...regularOrders, ...customOrders].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    return allOrders;
  },

  // Get only regular (product) orders
  async getRegularOrders(filters = {}) {
    let params = {};
    if (typeof filters === "string" || filters === null) {
      if (filters) params.status = filters;
    } else {
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.division) params.division = filters.division;
      if (filters.district) params.district = filters.district;
      if (filters.search) params.search = filters.search;
    }
    const regularData = await api.get("/api/orders", { params });
    return Array.isArray(regularData) ? regularData : regularData.orders || [];
  },

  // Get single order
  async getOrder(id) {
    const data = await api.get(`/api/orders/${id}`);
    return data;
  },

  // Create order from cart
  async createOrder(data) {
    const result = await api.post("/api/orders", data);
    return result;
  },

  // Update order status (bulk endpoint – backward compatible)
  async updateOrder(orderId, actionOrStatus) {
    // Determine if this is a status update (for admin) or action-based update
    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "SHIPPED",
      "RETURNED",
    ];
    const isStatusUpdate = validStatuses.includes(actionOrStatus.toUpperCase());

    if (isStatusUpdate) {
      // Direct status update (for admin)
      const result = await api.put("/api/orders", {
        orderId,
        status: actionOrStatus.toUpperCase(),
      });
      return result;
    } else {
      // Action-based update (backward compatibility)
      const result = await api.put("/api/orders", {
        orderId,
        action: actionOrStatus,
      });
      return result;
    }
  },

  // Update a single order's editable fields (seller / admin)
  // Fields: status, shippingAddress, notes, shippingMethod, predictedDeliveryDate
  async updateOrderDetails(id, data) {
    const result = await api.put(`/api/orders/${id}`, data);
    return result;
  },

  // Cancel order
  async cancelOrder(orderId) {
    return this.updateOrder(orderId, "cancel");
  },

  // Return order
  async returnOrder(orderId, reason = null) {
    return this.updateOrder(orderId, "return");
  },

  // Delete order
  async deleteOrder(id) {
    const result = await api.delete(`/api/orders/${id}`);
    return result;
  },

  // ========== Custom Orders ==========
  async getCustomOrders(filters = {}) {
    let params = {};
    if (typeof filters === "string") {
      params.status = filters;
    } else if (filters && typeof filters === "object") {
      if (filters.status) params.status = filters.status;
      if (filters.type) {
        // Pass type parameter - API will handle filtering by authenticated user
        params.type = filters.type;
      }
      if (filters.division) params.division = filters.division;
      if (filters.district) params.district = filters.district;
      if (filters.search) params.search = filters.search;
    }
    const data = await api.get("/api/custom-orders", { params });
    return data;
  },

  async getCustomOrder(id) {
    try {
      const data = await api.get(`/api/custom-orders/${id}`);
      return data;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async createCustomOrder(data) {
    const result = await api.post("/api/custom-orders", data);
    return result;
  },

  async confirmCustomOrder(id) {
    const result = await api.post(`/api/custom-orders/${id}/confirm`);
    return result;
  },

  // Update custom order details (status, shippingAddress, notes, shippingMethod)
  async updateCustomOrderDetails(id, data) {
    const result = await api.put(`/api/custom-orders/${id}`, data);
    return result;
  },

  // Verify custom order (update items and set status)
  async verifyCustomOrder(id, items, shippingCost, status) {
    const result = await api.put(`/api/custom-orders/${id}`, {
      action: "verify",
      items,
      shippingCost,
      ...(status ? { status } : {}),
    });
    return result;
  },

  // Auto-price lookup for custom order item
  async autoPriceItem(orderId, itemName) {
    const result = await api.patch(`/api/custom-orders/${orderId}/items`, {
      itemName,
    });
    return result;
  },

  async deleteCustomOrder(id) {
    const result = await api.delete(`/api/custom-orders/${id}`);
    return result;
  },
};

export const offerService = {
  // Get user's offers
  async getOffers(type = null, status = null) {
    const params = {};
    if (type) params.type = type;
    if (status) params.status = status;
    const data = await api.get("/api/offers", { params });
    return data;
  },

  // Create new offer
  async createOffer(data) {
    const result = await api.post("/api/offers", data);
    return result;
  },

  // Respond to offer (accept/reject/counter)
  async respondToOffer(offerId, action, counterOffer = null, message = null) {
    const result = await api.put("/api/offers", {
      offerId,
      action,
      counterOffer,
      message,
    });
    return result;
  },
};

export default { orderService, offerService };
