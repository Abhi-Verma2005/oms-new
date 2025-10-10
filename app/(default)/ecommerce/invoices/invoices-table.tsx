'use client'

import { useItemSelection } from '@/components/utils/use-item-selection'
import InvoicesTableItem from './invoices-table-item'

export interface Invoice {
  id: number
  invoice: string
  total: string
  status: string
  customer: string
  issueddate: string
  paiddate: string
  type: string 
}

export default function InvoicesTable({ invoices }: { invoices: Invoice[]}) {
  const {
    selectedItems,
    isAllSelected,
    handleCheckboxChange,
    handleSelectAllChange,
  } = useItemSelection(invoices)  

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl relative">
      <header className="px-3 sm:px-4 md:px-5 py-3 sm:py-4">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">Invoices <span className="text-gray-400 dark:text-gray-500 font-medium">67</span></h2>
      </header>
      <div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full dark:text-gray-300 min-w-[600px] sm:min-w-[800px]">
            {/* Table header */}
            <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-t border-b border-gray-100 dark:border-gray-700/60">
              <tr>
                <th className="px-1.5 sm:px-2 first:pl-3 sm:first:pl-5 last:pr-3 sm:last:pr-5 py-2 sm:py-3 whitespace-nowrap w-px">
                  <div className="flex items-center">
                    <label className="inline-flex">
                      <span className="sr-only">Select all</span>
                      <input className="form-checkbox" type="checkbox" onChange={handleSelectAllChange} checked={isAllSelected} />
                    </label>
                  </div>
                </th>
                <th className="px-1.5 sm:px-2 first:pl-3 sm:first:pl-5 last:pr-3 sm:last:pr-5 py-2 sm:py-3 whitespace-nowrap">
                  <div className="font-semibold text-left text-xs">Invoice</div>
                </th>
                <th className="px-1.5 sm:px-2 first:pl-3 sm:first:pl-5 last:pr-3 sm:last:pr-5 py-2 sm:py-3 whitespace-nowrap">
                  <div className="font-semibold text-left text-xs">Total</div>
                </th>
                <th className="px-1.5 sm:px-2 first:pl-3 sm:first:pl-5 last:pr-3 sm:last:pr-5 py-2 sm:py-3 whitespace-nowrap">
                  <div className="font-semibold text-left text-xs">Status</div>
                </th>
                <th className="px-1.5 sm:px-2 first:pl-3 sm:first:pl-5 last:pr-3 sm:last:pr-5 py-2 sm:py-3 whitespace-nowrap">
                  <div className="font-semibold text-left text-xs">Customer</div>
                </th>
                <th className="px-1.5 sm:px-2 first:pl-3 sm:first:pl-5 last:pr-3 sm:last:pr-5 py-2 sm:py-3 whitespace-nowrap">
                  <div className="font-semibold text-left text-xs">Issued on</div>
                </th>
                <th className="px-1.5 sm:px-2 first:pl-3 sm:first:pl-5 last:pr-3 sm:last:pr-5 py-2 sm:py-3 whitespace-nowrap">
                  <div className="font-semibold text-left text-xs">Paid on</div>
                </th>
                <th className="px-1.5 sm:px-2 first:pl-3 sm:first:pl-5 last:pr-3 sm:last:pr-5 py-2 sm:py-3 whitespace-nowrap">
                  <div className="font-semibold text-left text-xs">Type</div>
                </th>
                <th className="px-1.5 sm:px-2 first:pl-3 sm:first:pl-5 last:pr-3 sm:last:pr-5 py-2 sm:py-3 whitespace-nowrap">
                  <div className="font-semibold text-left text-xs">Actions</div>
                </th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="text-xs sm:text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
              {invoices.map(invoice => (
                <InvoicesTableItem
                  key={invoice.id}
                  invoice={invoice}
                  onCheckboxChange={handleCheckboxChange}
                  isSelected={selectedItems.includes(invoice.id)} />
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  )
}