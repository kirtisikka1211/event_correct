import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwzadhcoeavhwwncuqie.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3emFkaGNvZWF2aHd3bmN1cWllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIxNzIxMSwiZXhwIjoyMDY0NzkzMjExfQ.SAppl4LhjZNRYtgUSWY-5ROZ59D0tlVBX8GgQoPuC84';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize storage bucket for QR codes
const initStorage = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const qrBucketExists = buckets?.some(bucket => bucket.name === 'qr-codes');
    
    if (!qrBucketExists) {
      const { data, error } = await supabase.storage.createBucket('qr-codes', {
        public: true,
        fileSizeLimit: 1024 * 1024, // 1MB limit
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
      });
      
      if (error) {
        console.error('Error creating QR codes bucket:', error);
      } else {
        console.log('QR codes bucket created successfully');
      }
    } else {
      const { error } = await supabase.storage.updateBucket('qr-codes', {
        public: true
      });
      
      if (error) {
        console.error('Error updating QR codes bucket:', error);
      } else {
        console.log('QR codes bucket updated successfully');
      }
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

initStorage();

export default supabase; 