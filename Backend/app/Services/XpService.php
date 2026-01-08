<?php

namespace App\Services;

use App\Models\XpTransaction;
use App\Models\Donor;
use Illuminate\Support\Facades\DB;

class XpService
{
    /**
     * Award XP to a donor for a donation
     *
     * @param int $donorId
     * @param int $xpAmount
     * @param string $donationType ('blood', 'live_organ', 'after_death', 'financial')
     * @param string|null $referenceType Model class name (e.g., 'App\Models\HomeAppointment')
     * @param int|null $referenceId ID of the related record
     * @param string|null $description Optional description
     * @return XpTransaction
     */
    public static function awardXp($donorId, $xpAmount, $donationType, $referenceType = null, $referenceId = null, $description = null)
    {
        // Check if XP already awarded for this reference (prevent duplicates)
        if ($referenceType && $referenceId) {
            $existing = XpTransaction::where('donor_id', $donorId)
                ->where('reference_type', $referenceType)
                ->where('reference_id', $referenceId)
                ->first();

            if ($existing) {
                return $existing; // Already awarded
            }
        }

        // Create XP transaction
        $xpTransaction = XpTransaction::create([
            'donor_id' => $donorId,
            'xp_amount' => $xpAmount,
            'donation_type' => $donationType,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'description' => $description,
        ]);

        return $xpTransaction;
    }

    /**
     * Award XP for blood donation (500 XP)
     */
    public static function awardBloodDonationXp($donorId, $referenceType, $referenceId)
    {
        return self::awardXp(
            $donorId,
            500,
            'blood',
            $referenceType,
            $referenceId,
            'Blood donation completed'
        );
    }

    /**
     * Award XP for live organ donation (900 XP)
     */
    public static function awardLiveOrganDonationXp($donorId, $referenceType, $referenceId)
    {
        return self::awardXp(
            $donorId,
            900,
            'live_organ',
            $referenceType,
            $referenceId,
            'Live organ donation pledge completed'
        );
    }

    /**
     * Award XP for after-death organ donation (1500 XP)
     */
    public static function awardAfterDeathDonationXp($donorId, $referenceType, $referenceId)
    {
        return self::awardXp(
            $donorId,
            1500,
            'after_death',
            $referenceType,
            $referenceId,
            'After-death organ donation pledge completed'
        );
    }

    /**
     * Award XP for financial donation (amount equals XP)
     */
    public static function awardFinancialDonationXp($donorId, $amount, $referenceType = null, $referenceId = null)
    {
        return self::awardXp(
            $donorId,
            (int) $amount, // Convert to integer
            'financial',
            $referenceType,
            $referenceId,
            "Financial donation of {$amount}"
        );
    }

    /**
     * Get total XP for a donor
     */
    public static function getTotalXp($donorId)
    {
        return XpTransaction::where('donor_id', $donorId)->sum('xp_amount');
    }

    /**
     * Calculate level from total XP (Level 1 = 0-999, Level 2 = 1000-1999, etc.)
     */
    public static function calculateLevel($totalXp)
    {
        return floor($totalXp / 1000) + 1;
    }
}

