import { Link } from 'react-router-dom';
import { Clock, CheckCircle, Upload, ShieldCheck } from 'lucide-react';

export default function PaymentPending() {
  return (
    <div className="text-center py-2">
      <div className="w-16 h-16 bg-[#FFFBEB] rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-[#F59E0B]" />
      </div>

      <h3 className="text-xl font-bold text-[#1E293B] mb-2">Proof Submitted!</h3>
      <p className="text-[#475569] text-sm mb-6">
        Your payment receipt has been submitted. Our coordinator will verify it and activate your account shortly.
      </p>

      <div className="text-left bg-[#F8F9FB] rounded-2xl p-4 mb-6 space-y-3">
        {[
          { icon: Upload,      label: 'Payment proof submitted',       done: true },
          { icon: ShieldCheck, label: 'Coordinator verifying payment', done: false },
          { icon: CheckCircle, label: 'Account activated',             done: false },
        ].map(({ icon: Icon, label, done }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon className={`w-4 h-4 flex-shrink-0 ${done ? 'text-[#22C55E]' : 'text-[#94A3B8]'}`} />
            <span className={`text-sm ${done ? 'text-[#1E293B] font-medium' : 'text-[#94A3B8]'}`}>{label}</span>
          </div>
        ))}
      </div>

      <Link to="/login"
        className="inline-block bg-[#1F5E63] hover:bg-[#2F7A80] text-white text-sm font-semibold px-8 py-3 rounded-xl transition-colors">
        Go to Login
      </Link>
    </div>
  );
}
