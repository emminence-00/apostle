'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { useApiFetch } from '@/lib/client/api';
import { Check } from 'lucide-react';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  availableBalance: number;
}

export default function WithdrawModal({
  open,
  onClose,
  availableBalance,
}: WithdrawModalProps) {
  const apiFetch = useApiFetch();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleWithdraw = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (parsed > availableBalance) {
      setError('Amount exceeds available balance');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount: parsed }),
      });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    setDone(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Withdraw USDC" size="md">
      {!done ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg)]">
            <span className="text-[12px] text-[var(--text-secondary)]">Available balance</span>
            <span className="text-[15px] tabular-nums font-mono font-medium text-[var(--text-primary)]">
              {formatCurrency(availableBalance)} USDC
            </span>
          </div>

          {availableBalance === 0 && (
            <div className="p-3 rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg)]">
              <p className="text-[12px] text-[var(--text-secondary)]">
                Funds are locked in the current 14-day cycle and will be available after settlement.
              </p>
            </div>
          )}

          {availableBalance > 0 && (
            <>
              <div>
                <label className="block text-[12px] text-[var(--text-secondary)] mb-2">
                  Amount (USDC)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center border border-[var(--border)] rounded-[var(--radius-input)] bg-[var(--bg)] px-3 py-2">
                    <input
                      type="number"
                      min="1"
                      max={availableBalance}
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none font-mono text-[15px] font-medium text-[var(--text-primary)] tabular-nums"
                    />
                  </div>
                  <Button
                    id="btn-withdraw-max"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(availableBalance))}
                    className="shrink-0"
                  >
                    Max
                  </Button>
                </div>
              </div>

              <p className="text-[11px] text-[var(--text-muted)]">
                Withdrawals are processed to your registered wallet within 1–3 business days.
              </p>

              {error && <p className="text-[12px] text-[var(--negative)]">{error}</p>}

              <Button
                id="btn-withdraw-submit"
                onClick={handleWithdraw}
                loading={loading}
                className="w-full"
              >
                Request withdrawal
              </Button>
            </>
          )}

          {availableBalance === 0 && (
            <Button id="btn-withdraw-close" variant="outline" onClick={handleClose} className="w-full">
              Close
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center space-y-3 py-3">
          <div className="w-10 h-10 rounded-full border border-[var(--positive)]/30 bg-[var(--positive)]/10 flex items-center justify-center mx-auto">
            <Check className="w-5 h-5 text-[var(--positive)]" />
          </div>
          <div>
            <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Withdrawal requested</h3>
            <p className="text-[12px] text-[var(--text-secondary)] mt-1">
              {amount} USDC will be processed within 1–3 business days.
            </p>
          </div>
          <Button id="btn-withdraw-done" variant="outline" onClick={handleClose} className="w-full">
            Back to dashboard
          </Button>
        </div>
      )}
    </Modal>
  );
}
