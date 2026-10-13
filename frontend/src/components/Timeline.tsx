import React from 'react';
import { WasteStatusHistory } from '../types/database.types';
import { Clock, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface TimelineProps {
  history: WasteStatusHistory[];
}

export const Timeline: React.FC<TimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        No state transitions recorded yet.
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {history.map((event, idx) => {
          const isLast = idx === history.length - 1;
          const formattedDate = new Date(event.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <li key={event.id || idx}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3 items-start">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-brand-100 border-2 border-brand-500 flex items-center justify-center ring-4 ring-white">
                      <CheckCircle className="h-4 w-4 text-brand-700" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        {event.previous_status ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <span className="capitalize">{event.previous_status.replace('_', ' ')}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="font-semibold text-brand-700 capitalize">
                              {event.new_status.replace('_', ' ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-brand-700 capitalize">
                            {event.new_status.replace('_', ' ')}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                          <ShieldCheck className="w-2.5 h-2.5 text-slate-500" />
                          {event.role_at_change}
                        </span>
                      </div>
                      {event.notes && (
                        <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                          {event.notes}
                        </p>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <time dateTime={event.created_at}>{formattedDate}</time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
