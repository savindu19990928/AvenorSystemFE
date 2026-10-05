import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon, ArrowRightIcon, PrinterIcon } from 'lucide-react';
import type { Order, Quotation } from '../../types/api';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { useAction } from '../../hooks/useAction';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatMoney, itemVariant, todayISO, toNumber } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { StatusBadge } from '../ui/StatusBadge';
import { BrandTag } from '../ui/BrandTag';
import { StateMessage } from '../ui/StateMessage';
import { inputClass } from '../../utils/styles';

interface QuotationDetailModalProps {
  quotationId: number | null;
  onClose: () => void;
  onChanged: () => void;
  onPrint?: (id: number) => void;
}

export function QuotationDetailModal({ quotationId, onClose, onChanged, onPrint }: QuotationDetailModalProps) {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'SALES');
  const { data, loading, error, reload } = useApi(
    () => quotationId ? api.get<Quotation>(`/api/quotations/quotations/${quotationId}/`) : Promise.resolve(null),
    [quotationId]
  );
  const { run, pending } = useAction();
  const [converting, setConverting] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(todayISO(21));
  const [address, setAddress] = useState('');
  const [deposit, setDeposit] = useState('');

  useEffect(() => {
    setConverting(false);
  }, [quotationId]);

  useEffect(() => {
    if (data) setDeposit(String(Math.round(toNumber(data.total_amount) / 2)));
  }, [data]);

  const approve = async () => {
    const res = await run(() => api.post(`/api/quotations/quotations/${quotationId}/approve/`), 'Quotation approved');
    if (res !== undefined) {
      reload();
      onChanged();
    }
  };

  const convert = async (e: React.FormEvent) => {
    e.preventDefault();
    const order = await run(
      () =>
      api.post<Order>(`/api/quotations/quotations/${quotationId}/convert-to-order/`, {
        expected_delivery_date: deliveryDate,
        delivery_address: address,
        deposit_required: Number(deposit || 0).toFixed(2)
      }),
      'Order created and stock reserved'
    );
    if (order) {
      onChanged();
      onClose();
      navigate(`/orders/${order.id}`);
    }
  };

  return (
    <Modal
      open={quotationId !== null}
      onClose={onClose}
      size="lg"
      title={data?.quotation_number ?? 'Quotation'}
      description={data ? `${data.customer_company || data.customer_name} · valid until ${formatDate(data.validity_date)}` : undefined}
      footer={
      data &&
      <>
            {!converting && onPrint &&
        <Button icon={PrinterIcon} className="mr-auto" onClick={() => onPrint(data.id)}>
                Print / PDF
              </Button>
        }
            {canManage && (data.status === 'DRAFT' || data.status === 'SENT') &&
        <Button variant="primary" icon={CheckIcon} loading={pending} onClick={approve}>
                Mark approved by customer
              </Button>
        }
            {canManage && data.status === 'APPROVED' && !converting &&
        <Button variant="primary" icon={ArrowRightIcon} onClick={() => setConverting(true)}>
                Convert to order
              </Button>
        }
            {canManage && converting &&
        <>
                <Button onClick={() => setConverting(false)}>Back</Button>
                <Button variant="primary" type="submit" form="convert-form" loading={pending} disabled={!address.trim()}>
                  Create order
                </Button>
              </>
        }
          </>

      }>
      
      {loading && !data ?
      <StateMessage kind="loading" /> :
      error ?
      <StateMessage kind="error" message={error} onRetry={reload} /> :
      data ?
      converting ?
      <form id="convert-form" onSubmit={convert} className="space-y-4">
            <p className="text-sm text-muted">
              All line items, brand and pricing carry over — nothing needs re-entering. Blank garments are reserved automatically.
            </p>
            <Field label="Expected delivery date" htmlFor="cv-date" required>
              <input id="cv-date" type="date" required className={inputClass} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </Field>
            <Field label="Delivery address" htmlFor="cv-addr" required>
              <input id="cv-addr" required className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
            <Field label="Deposit required" htmlFor="cv-dep" hint="Defaults to 50% of the quotation total.">
              <input id="cv-dep" type="number" min={0} className={inputClass} value={deposit} onChange={(e) => setDeposit(e.target.value)} />
            </Field>
          </form> :

      <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={data.status} />
              <BrandTag name={data.brand_name} />
              <span className="text-xs text-muted">{data.payment_terms}</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-canvas text-left text-xs text-faint">
                  <tr>
                    <th className="min-w-[220px] px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 font-medium">Spec</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Unit</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.items ?? []).map((i, idx) =>
              <tr key={i.id ?? idx} className="border-t border-line align-top">
                      <td className="px-3 py-2 font-medium">{i.product_name}</td>
                      <td className="px-3 py-2 text-muted">
                        <p>{[itemVariant(i).colours, itemVariant(i).sizes].filter(Boolean).join(' · ')}</p>
                        <p className="text-xs text-faint">{[i.fabric_gsm, i.printing_method].filter(Boolean).join(' · ')}</p>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{i.quantity}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMoney(i.unit_price)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMoney(i.total_price)}</td>
                    </tr>
              )}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatMoney(data.subtotal)}</dd></div>
              {data.artwork_charges && <div className="flex justify-between"><dt className="text-muted">Artwork</dt><dd className="tabular-nums">{formatMoney(data.artwork_charges)}</dd></div>}
              {data.delivery_charges && <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="tabular-nums">{formatMoney(data.delivery_charges)}</dd></div>}
              {data.discount_amount && <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd className="tabular-nums">−{formatMoney(data.discount_amount)}</dd></div>}
              {data.tax_amount && <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="tabular-nums">{formatMoney(data.tax_amount)}</dd></div>}
              <div className="flex justify-between border-t border-line pt-1.5 font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(data.total_amount)}</dd></div>
            </dl>
            {data.notes && <p className="rounded-lg bg-canvas px-3 py-2 text-sm text-muted">{data.notes}</p>}
          </div> :

      null}
    </Modal>);

}