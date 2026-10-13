import React from 'react';
import { BatchStatus } from '../types/database.types';
import { Clock, CheckCircle2, Truck, CheckCheck, XCircle, AlertCircle, Package } from 'lucide-react';

interface StatusBadgeProps {
  status: BatchStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  switch (status) {
    case 'draft':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses[size]}`}>
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          Draft
        </span>
      );
    case 'available':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses[size]}`}>
          <Package className="w-3.5 h-3.5 text-emerald-600" />
          Available for Pickup
        </span>
      );
    case 'collection_requested':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses[size]}`}>
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          Collection Requested
        </span>
      );
    case 'assigned':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}>
          <Truck className="w-3.5 h-3.5 text-blue-600" />
          Collector Assigned
        </span>
      );
    case 'picked_up':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses[size]}`}>
          <Truck className="w-3.5 h-3.5 text-indigo-600" />
          In Transit
        </span>
      );
    case 'delivered':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses[size]}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
          Delivered to Facility
        </span>
      );
    case 'confirmed':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-brand-50 text-brand-700 border border-brand-200 ${sizeClasses[size]}`}>
          <CheckCheck className="w-3.5 h-3.5 text-brand-600" />
          Handover Confirmed
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses[size]}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-slate-100 text-slate-600 ${sizeClasses[size]}`}>
          {status}
        </span>
      );
  }
};
