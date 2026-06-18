import { Transaction } from "../models/transaction.model.js";
import { LoginAttempt } from "../models/loginAttempt.model.js";

export const generateFraudFeatures = async ({
  user,
  receiver,
  device,
  senderWallet,
  amount,
}) => {
  const now = new Date();

  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [transactionsLast24h, failedLoginsLastWeek, previousTransfer] =
    await Promise.all([
      Transaction.countDocuments({
        sender: user._id,
        createdAt: {
          $gte: oneDayAgo,
        },
      }),

      LoginAttempt.countDocuments({
        user: user._id,
        success: false,
        createdAt: {
          $gte: sevenDaysAgo,
        },
      }),

      Transaction.findOne({
        sender: user._id,
        beneficiary: receiver._id,
        status: "SUCCESS",
      }),
    ]);

  return {
    amount,

    account_balance_before: senderWallet.balance,

    account_balance_after: senderWallet.balance - amount,

    distance_from_home_km: 0,

    device_trusted: Boolean(device?.trusted),

    new_payee: !previousTransfer,

    international_transaction: false,

    transactions_last_24h: transactionsLast24h,

    failed_logins_last_week: failedLoginsLastWeek,

    merchant_category: "Financial",

    transaction_type: "transfer",
  };
};
