'use client';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useState } from 'react';
import { Check } from 'lucide-react';

interface TosModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function TosModal({ open, onAccept, onDecline }: TosModalProps) {
  const [checked, setChecked] = useState(false);

  return (
    <Modal open={open} onClose={onDecline} title="Terms of service & risk disclosure" size="lg">
      <div className="space-y-4">
        <div
          className="h-60 overflow-y-auto pr-1 text-[12px] text-[var(--text-secondary)] space-y-4 leading-relaxed"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}
        >
          <div>
            <h3 className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5">1. Trading performance & returns</h3>
            <p>
              Apostle is a private crypto trading firm. Projected returns are based on historical firm performance and are{' '}
              <strong className="text-[var(--warning-ink)]">not a guarantee of future returns</strong>. Crypto markets are volatile.
            </p>
          </div>

          <div>
            <h3 className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5">2. Volatility & security</h3>
            <p>
              USDC is a stablecoin pegged to the USD. Smart contract risk, exchange liquidity, and market events can result in loss.
            </p>
          </div>

          <div>
            <h3 className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5">3. 14-day cycle & central wallet</h3>
            <p>
              All deposited funds are pooled into Apostle&apos;s master trading wallet for the 14-day cycle. Returns are distributed at cycle close.
            </p>
          </div>

          <div>
            <h3 className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5">4. Affiliate program</h3>
            <p>Referral commissions are paid strictly from platform fee revenue.</p>
          </div>

          <div>
            <h3 className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5">5. Not financial advice</h3>
            <p>Nothing on this platform constitutes financial, legal, or tax advice.</p>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer pt-3 border-t border-[var(--border)]">
          <div
            className={`w-4 h-4 rounded-[var(--radius-tag)] border shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
              checked
                ? 'bg-[var(--accent)] border-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--bg)]'
            }`}
            onClick={() => setChecked(!checked)}
          >
            {checked && <Check className="w-3 h-3 text-[var(--accent-fg)]" />}
          </div>
          <span
            className="text-[12px] text-[var(--text-secondary)] select-none leading-relaxed"
            onClick={() => setChecked(!checked)}
          >
            I have read and understood the terms. I acknowledge that{' '}
            <strong className="text-[var(--text-primary)]">returns are not guaranteed</strong>{' '}
            and my capital is at risk.
          </span>
        </label>

        <div className="flex gap-2">
          <Button
            id="btn-tos-accept"
            onClick={onAccept}
            disabled={!checked}
            className="flex-1"
          >
            Accept & continue
          </Button>
          <Button id="btn-tos-cancel" variant="ghost" onClick={onDecline}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
