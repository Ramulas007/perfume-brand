import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentNumbers {
  bkash: string;
  nagad: string;
  rocket: string;
}

export const usePaymentSettings = () => {
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumbers>({
    bkash: '01XXXXXXXXX',
    nagad: '01XXXXXXXXX',
    rocket: '01XXXXXXXXX',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentNumbers = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'payment_numbers')
          .single();

        if (error) {
          console.error('Error fetching payment numbers:', error);
          return;
        }

        if (data?.value) {
          const numbers = data.value as unknown as PaymentNumbers;
          setPaymentNumbers({
            bkash: numbers.bkash || '01XXXXXXXXX',
            nagad: numbers.nagad || '01XXXXXXXXX',
            rocket: numbers.rocket || '01XXXXXXXXX',
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentNumbers();
  }, []);

  return { paymentNumbers, loading };
};
