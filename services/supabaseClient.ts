
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fondnuxvvunwacjlkygq.supabase.co';
const supabaseKey = 'sb_publishable_A31YYAK3jKKoPLOQbJo_1Q_sgX4s3hm';

export const supabase = createClient(supabaseUrl, supabaseKey);
