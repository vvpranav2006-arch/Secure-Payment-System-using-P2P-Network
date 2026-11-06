import axiosClient from './axiosClient';

export const accountApi = {
  getBalance: () => {
    return axiosClient.get('/account/balance');
  },

  searchUsers: (query) => {
    return axiosClient.get('/account/users', {
      params: { query },
    });
  },

  transfer: ({ recipientIdentifier, amount, pin, notes, idempotencyKey }) => {
    return axiosClient.post(
      '/account/transfer',
      {
        recipientIdentifier,
        amount: parseFloat(amount),
        pin,
        notes,
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );
  },

  getTransactions: (params = {}) => {
    return axiosClient.get('/account/transactions', { params });
  },

  getTransactionById: (id) => {
    return axiosClient.get(`/account/transactions/${id}`);
  },
};

