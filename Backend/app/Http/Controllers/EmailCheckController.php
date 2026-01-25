<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class EmailCheckController extends Controller
{
    /**
     * Lightweight email "deliverability" check:
     * - validates format
     * - checks if domain has MX or A/AAAA records
     *
     * NOTE: This does NOT guarantee deliverability, but it catches many typos like user@gnail.con.
     */
    public function check(Request $request)
    {
        $email = (string) $request->query('email', '');
        $email = trim($email);

        if ($email === '') {
            return response()->json([
                'ok' => false,
                'valid_format' => false,
                'domain' => null,
                'has_dns' => false,
                'message' => 'Email is required.',
            ], 422);
        }

        $validFormat = filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
        if (!$validFormat) {
            return response()->json([
                'ok' => true,
                'valid_format' => false,
                'domain' => null,
                'has_dns' => false,
                'message' => "This email doesn't look valid.",
            ]);
        }

        $domain = substr(strrchr($email, "@") ?: '', 1);
        $domain = strtolower(trim((string) $domain));

        if ($domain === '') {
            return response()->json([
                'ok' => true,
                'valid_format' => false,
                'domain' => null,
                'has_dns' => false,
                'message' => "This email doesn't look valid.",
            ]);
        }

        // Best-effort DNS check (MX preferred, then A/AAAA)
        $hasMx = $this->hasDnsRecord($domain, 'MX');
        $hasA = $this->hasDnsRecord($domain, 'A');
        $hasAAAA = $this->hasDnsRecord($domain, 'AAAA');

        $hasDns = $hasMx || $hasA || $hasAAAA;

        return response()->json([
            'ok' => true,
            'valid_format' => true,
            'domain' => $domain,
            'has_dns' => $hasDns,
            'has_mx' => $hasMx,
            'message' => $hasDns
                ? 'Email domain looks valid.'
                : "Email domain doesn't appear to exist (no DNS records found).",
        ]);
    }

    private function hasDnsRecord(string $domain, string $type): bool
    {
        $type = strtoupper($type);

        // Some Windows/PHP setups can behave differently; try both approaches.
        try {
            if (function_exists('checkdnsrr') && @checkdnsrr($domain, $type)) {
                return true;
            }
        } catch (\Throwable $e) {
            // ignore
        }

        try {
            if (function_exists('dns_get_record')) {
                $map = [
                    'A' => DNS_A,
                    'AAAA' => DNS_AAAA,
                    'MX' => DNS_MX,
                ];
                $flag = $map[$type] ?? null;
                if ($flag !== null) {
                    $records = @dns_get_record($domain, $flag);
                    return is_array($records) && count($records) > 0;
                }
            }
        } catch (\Throwable $e) {
            // ignore
        }

        return false;
    }
}

