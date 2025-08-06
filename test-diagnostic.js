// Test system-diagnostic by calling it from browser console
console.log('Testing system diagnostic...');

fetch('/api/system-diagnostic', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ test: true })
})
.then(response => response.json())
.then(data => {
  console.log('System diagnostic result:', data);
})
.catch(error => {
  console.error('System diagnostic error:', error);
});

// Or call via Supabase client
import { supabase } from '@/integrations/supabase/client';

supabase.functions.invoke('system-diagnostic', {
  body: { test: true }
}).then(({ data, error }) => {
  if (error) {
    console.error('System diagnostic error:', error);
  } else {
    console.log('System diagnostic result:', data);
  }
});