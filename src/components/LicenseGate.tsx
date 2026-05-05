import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../renderer/services/api';

export default function LicenseGate({ children }: { children: React.ReactNode }) {
    const [licensed, setLicensed] = useState<boolean | null>(null);
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch('http://127.0.0.1:3000/api/settings/license/status');
                if (res.ok) {
                    const data = await res.json();
                    setLicensed(data?.licensed ?? false);
                } else {
                    setTimeout(check, 2000);
                }
            } catch {
                setTimeout(check, 2000);
            }
        };
        check();
    }, []);

    const handleActivate = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('http://127.0.0.1:3000/api/settings/license/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_key: key.trim() })
            });
            const data = await res.json();
            if (data?.success) {
                setLicensed(true);
            } else {
                setError(data?.error || 'Activation failed');
            }
        } catch {
            setError('Could not connect to server');
        }
        setLoading(false);
    };

    // Still checking
    if (licensed === null) return (
        <div className="h-screen flex items-center justify-center bg-[#141414]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
    );

    // Not licensed — show activation screen (no router needed here)
    if (!licensed) return (
        <div className="h-screen flex items-center justify-center bg-[#141414]">
            <div className="bg-[#1a1a1a] rounded-2xl p-8 w-full max-w-md text-center">
                <img src="/logo.png" className="w-16 h-16 mx-auto rounded-2xl mb-4" alt="InstantBill" />
                <h1 className="text-2xl font-bold text-white mb-2">InstantBill</h1>
                <p className="text-gray-400 mb-6 text-sm">Enter your license key to activate</p>
                <input
                    className="w-full bg-[#212121] border border-gray-700 rounded-xl px-4 py-3 text-white text-center font-mono text-lg mb-3 outline-none focus:border-green-500 transition-colors"
                    placeholder="IB-XXXXXXXX-XXXX"
                    value={key}
                    onChange={e => setKey(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleActivate()}
                />
                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                <button
                    onClick={handleActivate}
                    disabled={loading || key.length < 10}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Activating...' : 'Activate License'}
                </button>
                <p className="text-gray-600 text-xs mt-4">
                    Purchase at instantbill.in or contact us on WhatsApp
                </p>
            </div>
        </div>
    );

    // Licensed — render app normally
    return <>{children}</>;
}