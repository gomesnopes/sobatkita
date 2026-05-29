// supabase-config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://twunssclwdvwdbjwsysc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dW5zc2Nsd2R2d2RiandzeXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDExOTksImV4cCI6MjA5NTI3NzE5OX0.z_ME9KMif183URkPRs9JpRFhsudaNTLzojdmc7GuP1c';

export const supabase = createClient(supabaseUrl, supabaseKey);
