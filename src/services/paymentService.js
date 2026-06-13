import { api } from "./api";

export const paymentService = {
  // Get payments (role-aware: buyer=own, seller=their orders, admin=all)
  async getPayments() {
    const data = await api.get("/api/payments");
    return data;
  },

  // Process payment
  async processPayment(paymentData) {
    const data = await api.post("/api/payments", paymentData);
    return data;
  },

  // Update payment (refund / approve / generic update)
  async updatePayment(paymentId, updateData) {
    const result = await api.put("/api/payments", { paymentId, ...updateData });
    return result;
  },

  // Refund payment
  async refundPayment(paymentId) {
    const result = await api.put("/api/payments", {
      paymentId,
      action: "refund",
    });
    return result;
  },

  // Approve flagged payment
  async approvePayment(paymentId) {
    const result = await api.put("/api/payments", {
      paymentId,
      action: "approve",
    });
    return result;
  },

  // Delete payment
  async deletePayment(paymentId) {
    console.log(paymentId);
    const result = await api.delete(`/api/payments?paymentId=${paymentId}`);
    return result;
  },
};

export default paymentService;
