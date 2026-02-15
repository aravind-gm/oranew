/**
 * Diagnostics utility to help debug authentication issues
 */

export const diagnoseAuthIssues = async (): Promise<string[]> => {
  const issues: string[] = [];

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    issues.push('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
  } else if (!supabaseUrl.includes('supabase.co')) {
    issues.push('⚠️ NEXT_PUBLIC_SUPABASE_URL looks invalid (should contain supabase.co)');
  } else {
    issues.push('✅ NEXT_PUBLIC_SUPABASE_URL is set');
  }

  if (!supabaseKey) {
    issues.push('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  } else if (supabaseKey.length < 50) {
    issues.push('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY looks too short');
  } else {
    issues.push('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set');
  }

  // Check network connectivity
  try {
    const response = await fetch('https://www.google.com/', { method: 'HEAD' });
    issues.push('✅ Network connectivity is working');
  } catch (err) {
    issues.push('❌ Network connectivity issue - cannot reach external services');
  }

  // Try to reach Supabase
  if (supabaseUrl) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey || '',
        },
      });
      if (response.ok || response.status === 401 || response.status === 403) {
        issues.push('✅ Can reach Supabase API');
      } else {
        issues.push(`⚠️ Supabase API returned status ${response.status}`);
      }
    } catch (err) {
      issues.push(`❌ Cannot reach Supabase API: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return issues;
};

export const logDiagnostics = async (): Promise<void> => {
  if (typeof window === 'undefined') return; // Only run on client

  try {
    // console.log('🔍 Running authentication diagnostics...');
    const issues = await diagnoseAuthIssues();
    issues.forEach((issue) => console.log(issue));
  } catch (err) {
    console.error('❌ Diagnostics failed:', err);
  }
};
