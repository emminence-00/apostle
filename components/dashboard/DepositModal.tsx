'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import TosModal from './TosModal';
import { Copy, Check, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useApiFetch } from '@/lib/client/api';
import type { DepositDisplayConfig } from '@/lib/types';

const TX_HASH = /^0x[a-fA-F0-9]{64}$/;

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  tosAccepted: boolean;
  onTosAccept: () => Promise<boolean>;
  hasActiveDeposit?: boolean;
  activeDepositDaysLeft?: number;
  config: DepositDisplayConfig | null;
}

export default function DepositModal({
  open,
  onClose,
  tosAccepted,
  onTosAccept,
  hasActiveDeposit = false,
  activeDepositDaysLeft = 0,
  config,
}: DepositModalProps) {
  const apiFetch = useApiFetch();
  const [step, setStep] = useState<'amount' | 'send' | 'hash' | 'done'>('amount');
  const [showTos, setShowTos] = useState(false);
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const minDeposit = config?.minDeposit ?? 10;
  const destination = config?.walletAddress ?? '';
  const chainName = config?.chainName ?? 'the configured network';

  const handleAmountNext = () => {
    if (!amount || parseFloat(amount) < minDeposit) {
      setError(`Minimum deposit is ${formatCurrency(minDeposit)} USDC`);
      return;
    }
    setError('');
    if (!tosAccepted) {
      setShowTos(true);
    } else {
      setStep('send');
    }
  };

  const handleTosAccept = async () => {
    const accepted = await onTosAccept();
    if (!accepted) return;
    setShowTos(false);
    setStep('send');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(destination);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitHash = async () => {
    if (!TX_HASH.test(txHash.trim())) {
      setError('Enter a valid 0x transaction hash');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiFetch('/api/deposit', {
        method: 'POST',
        body: JSON.stringify({ txHash: txHash.trim() }),
      });
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to confirm deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('amount');
    setAmount('');
    setTxHash('');
    setError('');
    onClose();
  };

  return (
    <>
      <TosModal
        open={showTos}
        onAccept={handleTosAccept}
        onDecline={() => setShowTos(false)}
      />

      <Modal open={open && !showTos} onClose={handleClose} title="Deposit USDC" size="md">
        {step === 'amount' && (
          <div className="space-y-4">
            {hasActiveDeposit && (
              <div className="flex items-start gap-2.5 rounded-[var(--radius-btn)] border border-[var(--warning-border)] bg-[var(--warning-soft)] p-3 text-[12px] text-[var(--warning-ink)]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Active cycle in progress — {activeDepositDaysLeft} day{activeDepositDaysLeft !== 1 ? 's' : ''} remaining.
                  One deposit per cycle allowed.
                </span>
              </div>
            )}

            {config && !config.configured && (
              <div className="rounded-[var(--radius-btn)] border border-[var(--warning-border)] bg-[var(--warning-soft)] p-3 text-[12px] text-[var(--warning-ink)]">
                Deposits are not configured on this deployment. Contact support before sending funds.
              </div>
            )}

            <div>
              <label className="block text-[12px] text-[var(--text-secondary)] mb-2">
                Amount (USDC)
              </label>
              <div className="flex items-center border border-[var(--border)] rounded-[var(--radius-input)] bg-[var(--bg)] px-3 py-2.5">
                <input
                  type="number"
                  min={minDeposit}
                  step="0.01"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none font-mono text-[18px] font-medium text-[var(--text-primary)] tabular-nums"
                />
                <span className="text-[12px] text-[var(--text-muted)] ml-2 shrink-0">USDC</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                Minimum: {formatCurrency(minDeposit)} USDC · Network: {chainName}
              </p>
            </div>

            {error && <p className="text-[12px] text-[var(--negative)]">{error}</p>}

            <Button
              id="btn-deposit-continue"
              onClick={handleAmountNext}
              disabled={config?.configured === false}
              className="w-full"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-[11px] text-[var(--text-muted)] text-center">
              Funds are pooled and traded; capital is at risk.
            </p>
          </div>
        )}

        {step === 'send' && (
          <div className="space-y-4">
            <div className="p-4 rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg)] text-center">
              <p className="text-[12px] text-[var(--text-secondary)] mb-1">Send exactly</p>
              <p className="text-[22px] font-mono tabular-nums font-medium text-[var(--text-primary)]">
                {formatCurrency(parseFloat(amount) || 0)} USDC
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                on {chainName} to the Apostle trading wallet
              </p>
            </div>

            <div>
              <label className="block text-[12px] text-[var(--text-secondary)] mb-2">
                Destination wallet
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={destination}
                  className="flex-1 min-w-0 px-3 py-2 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--bg)] font-mono text-[12px] text-[var(--text-secondary)] focus:outline-none"
                />
                <Button id="btn-copy-wallet" variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
                  {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-[var(--radius-btn)] border border-[var(--warning-border)] bg-[var(--warning-soft)] p-3 text-[12px] text-[var(--warning-ink)]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Send USDC on {chainName} from the wallet linked to your account.</span>
            </div>

            <Button id="btn-deposit-sent" onClick={() => setStep('hash')} className="w-full">
              I&apos;ve sent the transaction <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === 'hash' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] text-[var(--text-secondary)] mb-2">
                Transaction hash
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--bg)] font-mono text-[12px] text-[var(--text-primary)] focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                We verify the transfer on-chain before crediting your account.
              </p>
            </div>

            {error && <p className="text-[12px] text-[var(--negative)]">{error}</p>}

            <div className="flex gap-2">
              <Button id="btn-deposit-submit" onClick={handleSubmitHash} loading={loading} className="flex-1">
                Confirm deposit
              </Button>
              <Button variant="ghost" onClick={() => setStep('send')}>
                Back
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-3 py-3">
            <div className="w-10 h-10 rounded-full border border-[var(--positive)]/30 bg-[var(--positive)]/10 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5 text-[var(--positive)]" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Deposit confirmed</h3>
              <p className="text-[12px] text-[var(--text-secondary)] mt-1">
                {formatCurrency(parseFloat(amount) || 0)} USDC was verified on-chain and added to your account.
              </p>
            </div>
            <Button id="btn-deposit-done" variant="outline" onClick={handleClose} className="w-full">
              Back to dashboard
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
