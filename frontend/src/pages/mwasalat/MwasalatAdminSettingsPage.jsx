import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2, Save, Settings as SettingsIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatSettingsService } from '../../services/mwasalatSettings.service.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

export default function MwasalatAdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['mwasalat-admin-settings'],
    queryFn: mwasalatSettingsService.getSettings,
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (settings) reset({ platformName: settings.platformName, supportEmail: settings.supportEmail });
  }, [settings, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: mwasalatSettingsService.updateSettings,
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['mwasalat-admin-settings'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save settings'),
  });

  return (
    <MwasalatAdminLayout title="Settings" subtitle="Platform-wide configuration">
      <div className="max-w-xl">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading settings…
          </div>
        ) : (
          <div className="card p-6">
            <div className="w-11 h-11 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-4">
              <SettingsIcon className="w-5 h-5 text-mwasalatInk-500" />
            </div>
            <h2 className="text-base font-bold text-[#1E293B] mb-1">Platform Details</h2>
            <p className="text-sm text-[#475569] mb-5">Shown to learners and instructors across the platform.</p>

            <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Platform Name</label>
                <input className={inputClass} {...register('platformName')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Support Email</label>
                <input type="email" className={inputClass} placeholder="support@mwasalat.om" {...register('supportEmail')} />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </form>
          </div>
        )}
      </div>
    </MwasalatAdminLayout>
  );
}
