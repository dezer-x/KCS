import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

interface BannedErrorProps extends SharedData {
  flash?: {
    banDetails?: {
      reason?: string;
      duration?: string;
      banned_at?: string;
      banned_until?: string;
      is_permanent?: boolean;
      banned_by?: string;
    };
  };
}

export default function BannedError() {
  const { flash } = usePage<BannedErrorProps>().props;
  const banDetails = flash?.banDetails;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Head title="Account Banned">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
      </Head>

      <div className="bg-black/30 min-h-screen backdrop-blur-sm relative flex items-center justify-center">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-['FACERG'] text-red-400 text-4xl font-bold uppercase tracking-wider mb-4">
                ACCOUNT BANNED
              </h1>
              <p className="text-gray-300 text-lg font-['Trebuchet']">
                Your account has been suspended from this platform
              </p>
            </div>

            {/* Ban Details */}
            {banDetails && (
              <div className=" rounded-lg p-6 mb-8">
                <h2 className="font-['FACERG'] text-red-400 text-2xl font-bold uppercase tracking-wider mb-6">
                  BAN DETAILS
                </h2>
                
                <div className="space-y-4">
                  {banDetails.reason && (
                    <div>
                      <label className="block text-gray-400 text-sm font-['Trebuchet'] mb-2">
                        Reason:
                      </label>
                      <p className="text-white font-['Trebuchet'] text-lg">
                        {banDetails.reason}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm font-['Trebuchet'] mb-2">
                        Duration:
                      </label>
                      <p className="text-white font-['Trebuchet']">
                        {banDetails.is_permanent ? 'Permanent' : banDetails.duration || 'Unknown'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm font-['Trebuchet'] mb-2">
                        Banned By:
                      </label>
                      <p className="text-white font-['Trebuchet']">
                        {banDetails.banned_by || 'System'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm font-['Trebuchet'] mb-2">
                        Banned On:
                      </label>
                      <p className="text-white font-['Trebuchet']">
                        {banDetails.banned_at ? formatDate(banDetails.banned_at) : 'Unknown'}
                      </p>
                    </div>

                    {banDetails.banned_until && !banDetails.is_permanent && (
                      <div>
                        <label className="block text-gray-400 text-sm font-['Trebuchet'] mb-2">
                          Banned Until:
                        </label>
                        <p className="text-white font-['Trebuchet']">
                          {formatDate(banDetails.banned_until)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="text-center">
              <p className="text-gray-400 font-['Trebuchet'] mb-4">
                If you believe this ban was issued in error, please contact an administrator.
              </p>
              <div className="flex justify-center space-x-4">
              
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}